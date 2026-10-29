# OpenCode Agent Interface — Deep Research & Mapping to Our App

> Research date: October 2026. Covers OpenCode 1.x TUI and the OpenCode 2 desktop/web direction.
> Goal: understand **every element, state, and system** in OpenCode's agent workflow UI,
> then map each one to the components in `src/components/ag/` so we know exactly what to
> copy, simplify, or skip for our Antigravity-style agent workspace.
>
> Companion document: `docs/cursor-agent-interface-research.md`.
>
> Caveat: OpenCode is evolving quickly, and the TUI, desktop, and web clients do not render
> every part identically. Treat this as a pattern language plus a mapping, not a pixel spec.
> Verify exact visuals against the installed build before turning any item into a ticket.

---

## Table of contents

1. [Why this document exists](#1-why-this-document-exists)
2. [TL;DR: what OpenCode's agent UX is trying to accomplish](#2-tldr-what-opencodes-agent-ux-is-trying-to-accomplish)
3. [Product surfaces and architecture](#3-product-surfaces-and-architecture)
4. [The agent loop](#4-the-agent-loop)
5. [Context: the agent's working memory](#5-context-the-agents-working-memory)
6. [Reasoning and planning](#6-reasoning-and-planning)
7. [Tools and permissions](#7-tools-and-permissions)
8. [Interface anatomy and visual grammar](#8-interface-anatomy-and-visual-grammar)
9. [Cross-cutting systems](#9-cross-cutting-systems)
10. [Element-by-element mapping to our app](#10-element-by-element-mapping-to-our-app)
11. [Task-lifecycle flow comparison](#11-task-lifecycle-flow-comparison)
12. [Gap analysis and prioritized backlog](#12-gap-analysis-and-prioritized-backlog)
13. [Patterns worth stealing and anti-patterns](#13-patterns-worth-stealing-and-anti-patterns)
14. [Worked trace](#14-worked-trace)
15. [Sources](#15-sources)
16. [Maintainer note](#16-maintainer-note)

---

## 1. Why this document exists

We are building an agent-first workspace in `src/components/ag/`, modeled on Google
Antigravity's "Agent Manager": a project/thread rail on the left, an agent conversation in
the middle, and an artifact/review pane on the right. We already have a deep Cursor
teardown. OpenCode is a second, deliberately different reference point:

- **Terminal-first**, but backed by a server and a typed event stream.
- **Open**, so its data model and tool lifecycle are inspectable.
- **Explicit** about context assembly, permissions, sessions, subagents, and compaction.
- **Compact** in its visual grammar: one line per action, expand for detail.

This document answers four questions:

1. What is each OpenCode interface element **for** — what job does it do in the loop?
2. How does OpenCode **represent** the agent's process: reasoning, tool calls, results,
   todos, permissions, delegation, memory, and recovery?
3. Which of **our** components already cover that job, and which are only visual stubs?
4. What should we **copy, adapt, or skip**, in priority order?

The most important insight is architectural: OpenCode treats the agent's process as a
**typed, streamable paper trail**. The UI is a projection of parts and events, not a chat
log of strings. That decision is what makes streaming, collapsing, retrying, subagent
drill-down, and multiple clients possible.

---

## 2. TL;DR: what OpenCode's agent UX is trying to accomplish

OpenCode's entire interface is organized around **making an autonomous loop legible and
controllable at four moments**:

| Control moment | OpenCode's answer |
| --- | --- |
| **Before work starts** | `@` file/reference context, `AGENTS.md` project rules, a skills index, agent selection (Build/Plan), model and reasoning variant, permission policy |
| **While work runs** | Streaming reasoning, one-line tool rows with expandable output, a live todo checklist, permission gates, structured questions, abort/interrupt |
| **After work finishes** | Diffs and changed-file summaries, verification output, session diff, undo/redo, revert, export/share |
| **Across many tasks** | Session list and resume, child sessions for subagents, compaction summaries, auto-generated titles, completion notifications |

Everything else — the status bar, the command palette, the collapsible rows, the sounds —
serves one of those four moments.

**Positioning:** Cursor optimizes for an IDE-integrated agent with a rich review surface.
OpenCode optimizes for a **transparent, composable agent runtime** with a terminal client.
Our app sits between them: a desktop-style agent manager with a three-pane shell, but
currently a mock runtime. OpenCode is the best reference for the **loop, the event model,
and the control surface**; Cursor is the best reference for **review, parallel agents, and
workspace integration**.

---

## 3. Product surfaces and architecture

### 3.1 Surfaces

| Surface | What it is | Why it matters for us |
| --- | --- | --- |
| **TUI** | The canonical terminal client. Chat log, composer, status bar, dialogs, keybinds. | The purest expression of OpenCode's visual grammar: dense, keyboard-first, one line per action. |
| **Desktop app** | A native shell over the same runtime. | Closer to our three-pane product; more room for persistent rails and review panes. |
| **Web app** | Served with `opencode pair`; browser client. | Demonstrates multi-client rendering of the same session. |
| **IDE extension** | Editor integration and prompt handoff. | Relevant if we add "Open IDE" handoff later. |
| **Server** | `opencode serve` exposes an OpenAPI 3.1 spec and SSE event stream. | The runtime/UI boundary is the key architectural lesson. |
| **SDK** | Type-safe JS/TS client generated from the server spec. | Shows how to make the agent runtime programmable and testable. |

### 3.2 Architecture

```
+-------------------+        HTTP / SSE        +-------------------+
|  TUI / desktop /  | <----------------------> |   OpenCode server |
|  web / IDE client |                          |   (agent runtime) |
+-------------------+                          +-------------------+
                                                        |
                                                        +--> providers / models
                                                        +--> filesystem / shell
                                                        +--> MCP / LSP / plugins
                                                        +--> sessions / snapshots
```

- Running `opencode` starts a TUI and a server; the TUI is a client of the server.
- The server streams events over SSE.
- The server publishes an OpenAPI spec and an SDK.
- Desktop, web, IDE, and programmatic clients can share the same runtime.

**Lesson for our app:** define the event schema and part lifecycle before building more
UI. Our current mock (`page.tsx` with `setTimeout`) simulates transitions; a real runtime
would emit typed events for the same transitions.

### 3.3 Version note

OpenCode 1 and OpenCode 2 both use the `opencode` command and cannot be installed side by
side under the default command. The v2 line adds desktop and web surfaces. Always confirm
which client and version a visual claim comes from.

---

## 4. The agent loop

### 4.1 The cycle

```
USER          MODEL                        TOOLS                 UI
 | query ---->|                            |                     |
 |            | assemble context           |                     |
 |            | (system + rules + history  |                     |
 |            |  + skills index + schemas) |                     |
 |            | reason --------------------+-------------------->| reasoning block
 |            | tool call -----------------+--> permission? --->| action row
 |            |                            |    execute          |
 |            | <---- result --------------+---------------------| result / diff
 |            | update todo ---------------+-------------------->| checklist
 |            |         loop               |                     |
 | <----------| final answer --------------+-------------------->| markdown + files
```

### 4.2 Step by step

1. **Submit** — the user message is persisted. Text, `@` references, images, and `!` shell
   output become message parts.
2. **Assemble** — the runtime builds the prompt from system instructions, agent config,
   project rules, skills index, conversation history, tool schemas, and attachments.
3. **Infer** — the provider streams tokens. The runtime parses them into reasoning, text,
   and structured tool calls.
4. **Gate** — if a tool needs permission, the user is prompted. A denial is fed back into
   the loop as a result.
5. **Act** — tools execute. Independent calls can run in parallel. Outputs are captured,
   summarized, and truncated if large.
6. **Observe** — results are appended to context. Todos, diffs, and statuses update.
7. **Loop** — the model sees the new context and chooses the next action.
8. **Synthesize** — when the model stops calling tools, it produces the final answer.
9. **Maintain** — the session can be compacted, summarized, shared, exported, undone, or
   resumed.

### 4.3 The non-linear reality

The clean cycle is a simplification. In practice:

- Reasoning, text, and tool calls can **interleave** within one turn.
- The model can emit **multiple tool calls** in one turn.
- Independent calls can run in **parallel** and return **out of order**.
- The plan can **change mid-loop** as new evidence arrives.
- The user can **interrupt**, answer a question, deny a permission, or stop the run.
- A tool can **fail**, **retry**, or be **denied**.
- The model can get **stuck** in a loop or hit a **step limit**.
- Context can be **compacted** mid-task, changing what the model remembers.

**Design implication:** the interface should be a **log**, not a wizard. Do not imply a
rigid "Think -> Plan -> Act -> Verify" stepper. Design a trace that can absorb branching,
reordering, and recovery.

### 4.4 When the loop ends

- The model emits a final text response with no further tool calls.
- The agent hits its configured max steps; it is forced to summarize and recommend
  remaining work.
- The user aborts the session.
- A fatal provider or tool error stops the run.
- Context pressure triggers compaction, after which the loop continues.

### 4.5 What the user can do mid-loop

- Approve, always-approve, or reject a tool.
- Answer a structured question.
- Expand or collapse reasoning, tool details, and outputs.
- Inspect diffs and file changes.
- Abort the run.
- After completion: undo/redo, revert, export, share, fork, resume.

---

## 5. Context: the agent's working memory

### 5.1 The desk metaphor

```
+---------------- CONTEXT WINDOW ----------------+
| identity + tone + rules + AGENTS.md            |
| skills index (names only, not full contents)   |
| user request + @files + images                 |
| conversation + tool results + todo state       |
| . . . . . . . . free space . . . . . . . . .   |
+------------------------------------------------+
```

The desk is finite. The agent decides what to put on it. Tools fetch more. Compaction
clears older pages into a summary. Subagents get their own desk.

### 5.2 Layers of context

| Layer | Contents | When it enters |
| --- | --- | --- |
| **Static** | System prompt, agent prompt, `AGENTS.md`, environment, skills catalog | Before the first token |
| **Conversational** | User text, `@` files, images, `!` shell output | At submit |
| **Acquired** | `glob` / `grep` / `read` / `lsp` / `webfetch` / `websearch` / `bash` / `skill` results | During the loop |
| **Compressed** | Compaction summary, subagent summary | When context is tight or work is delegated |

### 5.3 System prompt and agent configuration

The system prompt typically includes:

- Identity and role.
- Tone and style rules.
- Proactiveness and task workflow.
- Tool usage policy.
- Code-reference conventions.
- Environment: working directory, platform, git status, date.
- Project rules from `AGENTS.md`.
- A catalog of available skills (names, descriptions, locations only).

Agent configuration can override:

- Model and provider.
- Custom prompt.
- Temperature and top-p.
- Permissions.
- Max steps.
- Color and visibility.

### 5.4 `AGENTS.md`

Project rules live in `AGENTS.md`. They are injected into context and shape behavior:
conventions, commands, testing approach, architecture notes, and agent-specific rules.
`/init` helps create or update the file. It is meant to be committed to git.

**Our gap:** our app has no concept of project rules or an `AGENTS.md` equivalent.

### 5.5 Skills and progressive disclosure

Skills are reusable instruction packs. Only the **name, description, and location** are
loaded upfront. The full `SKILL.md` is fetched by a `skill` tool call only when needed.

This is progressive disclosure at the context level: keep the index cheap, load the detail
on demand. It is the same principle we should use in the UI: show the index of actions,
expand the detail when the user asks.

### 5.6 Tools as context

Tool definitions are JSON schemas with descriptions. They are part of what the model sees.
The available tool set changes with the agent, permissions, and configuration. Tool
descriptions therefore shape behavior as much as prompts do.

**Our gap:** our mock thread messages are visual kinds (`folders`, `files`, `subagents`,
`permission`), not a generic tool-call model. There is no schema-driven rendering.

### 5.7 Attachments and references

- `@` opens a fuzzy file search; the selected file's content is added to context.
- External reference roots can be aliased and referenced.
- Images can be dragged into the terminal and added to the prompt.
- `!` runs a shell command; its output is added as a tool result.
- The external editor can compose long messages.

**Our gap:** the composer placeholder says `@ to mention, / for actions`, but neither is
implemented. The attach button is a stub.

### 5.8 Just-in-time retrieval

The agent does not start with the whole repo. It explores:

- `glob` for file patterns.
- `grep` for content matches.
- `read` for file contents and line ranges.
- `lsp` for definitions, references, symbols, and call hierarchy.
- `webfetch` / `websearch` for external information.

Each result consumes context. The UI's action rows are the visible record of this
acquisition.

### 5.9 Compaction

When the context window nears its limit, a hidden **compaction agent** summarizes older
content into a smaller representation. The session continues with the summary. The user can
also trigger `/compact` (alias `/summarize`).

The UI should make compaction visible enough to explain why memory changed, without
exposing a wall of tokens.

**Our gap:** no context meter, no compaction state, no summary marker.

### 5.10 Subagents and context isolation

A subagent runs with a **fresh context**. It explores, reasons, and acts independently,
then returns a summary to the main agent. This keeps the main context clean and enables
parallel work. The user can drill into the child session.

**Our gap:** `subagents` cards exist and look good, but there is no child session, no
context isolation, and no summary return model.

### 5.11 Todos as externalized planning

The `todowrite` tool creates a structured list with:

- Content.
- Status: `pending`, `in_progress`, `completed`, `cancelled`.
- Priority.

The model re-reads this state each turn. The user sees progress. It is a **boundary
object**: shared state that changes both the agent's behavior and the user's understanding.

It is more reliable than a paragraph of intentions because it is structured, persistent,
and visible.

**Our gap:** the artifact panel has a static 3/5 progress bar. There is no live checklist.

### 5.12 Budget and context pressure

Context is finite. The budget includes:

- System and tool schemas.
- Conversation history.
- Retrieved context.
- Reserved output space.

Large tool outputs are truncated and may be saved to a file that the model can read later.
The UI should show usage or context pressure in some form.

**Our gap:** no token estimate, no context ring, no cost readout.

### 5.13 What the model does not see

- Files it has not read.
- Full skill contents until loaded.
- Other sessions or subagent contexts.
- Future tool results.
- Hidden permission rules unless surfaced.
- Anything the user did not attach or reference.

This is why the action trace matters: it is the only evidence of what the model actually
knows at any moment.

---

## 6. Reasoning and planning

### 6.1 Token generation, not a separate planner

There is no separate "planner" or "searcher" module. The model generates tokens
autoregressively. Some tokens become text, some become reasoning, some become structured
tool calls. The loop is the architecture.

### 6.2 Reasoning streams

Some models expose a separate reasoning channel ("extended thinking"). OpenCode can display
it as a **reasoning part**. Important distinctions:

- `/thinking` toggles **visibility** of reasoning blocks.
- `ctrl+t` cycles **model variants**, which can change reasoning effort or capability.
- Some providers expose raw reasoning; some expose summaries; some expose nothing.

**Our gap:** `note.workedFor` shows an elapsed-time label, but there is no reasoning body,
no toggle, and no model-variant control. The composer's "(High)" is static.

### 6.3 Reasoning is not a plan

Reasoning can be useful, wrong, performative, or incomplete. It is not a contract. The
externalized plan (todos) and the actual tool calls are stronger evidence of what the agent
is doing.

### 6.4 Planning via todos

The model uses `todowrite` to:

- Break work into steps.
- Mark the current step `in_progress`.
- Mark completed steps immediately.
- Keep the list current as the plan changes.

The UI renders this as a checklist with status and priority. Completed items are visually
de-emphasized; the current item is highlighted.

### 6.5 Interleaving

A single turn may contain:

```
reasoning -> tool call -> reasoning -> text -> tool call -> tool call -> text
```

The UI groups these into a readable trace, but the underlying process is not cleanly
phase-separated.

### 6.6 Failure modes

- **Doom loop:** the same tool call repeats with identical input.
- **Plan drift:** the agent stops following the todo list.
- **Overconfidence:** fluent reasoning that is not backed by evidence.
- **Context loss:** important details fall out of the window or are poorly summarized.
- **Premature completion:** the agent claims success without verification.
- **Permission deadlock:** repeated denials without adaptation.

### 6.7 UX implications

- De-emphasize reasoning; make the plan and evidence prominent.
- Show tool results, not just tool names.
- Keep the todo list visible and current.
- Allow the user to steer or correct the plan.
- Make verification steps explicit.
- Surface stuck states and offer recovery.

---

## 7. Tools and permissions

### 7.1 Tool taxonomy

| Category | Tools | Purpose |
| --- | --- | --- |
| **Read** | `read`, `grep`, `glob`, `lsp` | Acquire context |
| **Write** | `edit`, `write`, `apply_patch` | Modify files |
| **Execute** | `bash`, formatters | Run commands, verify, format |
| **Web** | `webfetch`, `websearch` | External research |
| **Delegate** | `task`, `skill` | Subagents, load instructions |
| **Ask** | `question` | Gather user input |
| **Plan** | `todowrite` | Externalize the plan |
| **Extend** | MCP tools, custom tools | Add capabilities |

The docs list `bash`, `edit`, `write`, `read`, `grep`, `glob`, `lsp` (experimental),
`apply_patch`, `skill`, `webfetch`, `websearch`, and `question`. The runtime also exposes
`task` and `todowrite` for delegation and planning.

### 7.2 Lifecycle

```
proposed
  -> awaiting_permission
      -> denied -> completed_with_denial
      -> approved -> running
  -> running
      -> streaming_output -> completed
      -> error -> retry -> running
      -> cancelled -> cancelled
```

A tool call is a **part** whose state mutates in place. That is why the UI can show
"running" and then "done" without appending a new message.

### 7.3 Call structure

A tool call carries:

- Tool name.
- Arguments.
- Status.
- Output or error.
- Metadata: timing, truncation, file path, exit code.

### 7.4 Parallel and batched calls

The model can batch independent calls in one turn. The runtime executes them, and results
may return out of order. The UI should:

- Show each call as its own row.
- Allow independent status updates.
- Avoid reordering rows as results arrive.
- Group related calls visually when useful.

### 7.5 Streaming tool arguments

Some clients can show tool arguments forming as tokens arrive. This is a useful
micro-interaction: the user sees the file path or command appear before execution. If not
supported, show a pending row with the tool name.

### 7.6 Permission model

Core actions:

- `allow` — run without approval.
- `ask` — prompt before running.
- `deny` — block.

Prompt outcomes:

- **Once** — approve this request.
- **Always** — approve this and future requests matching suggested patterns for the
  session.
- **Reject** — deny.

Safety guards:

- **Doom loop:** repeated identical calls trigger a prompt.
- **External directory:** paths outside the project trigger a prompt.
- **Secrets:** `.env` files are denied by default; `.env.example` is allowed.
- **Granular rules:** permissions can match command patterns, file globs, URLs, and
  subagent names.
- **Auto mode:** approves non-denied requests automatically; explicit denies still apply;
  a muted `auto` indicator shows the state.

Denial is fed back into the loop as a result, so the model can adapt. This is a recovery
loop, not a dead end.

### 7.7 Output handling

Large outputs are truncated. The full output may be saved to a file that the model can read
on demand. The UI should show:

- A preview or summary.
- A count or size.
- An expand action.
- The truncation marker.
- A path to the full output.

**Our gap:** we show labels and counts (`Analyzed file.tsx #L1-120`), but no raw output,
truncation marker, or full-output path.

### 7.8 Errors

Tool errors are **model-visible results**, not just UI errors. The model can read the
error, adjust, and retry. The UI should show the error inline, with:

- The failing command or tool.
- The error message.
- The relevant output.
- A retry or next-step affordance.

**Our gap:** no error or retry message kind.

### 7.9 Tool availability

Tool availability depends on:

- The active agent (Build vs Plan).
- Permissions.
- Configuration.
- Provider/model capabilities.
- Experimental flags.

Plan agents ask before edits and bash; Build agents have broader access. Custom agents can
be narrower.

**Our gap:** no mode concept, so no tool-availability difference between modes.

### 7.10 Extensibility

- **MCP servers** add external tools.
- **Custom tools** add project-specific functions.
- **Plugins** can hook execution and behavior.
- **LSP** adds code intelligence.
- **Formatters** run after edits.

These expand the action palette, so the UI must handle unknown tool types gracefully.

**Our gap:** no generic tool renderer, so unknown tools have nowhere to go.

---

## 8. Interface anatomy and visual grammar

### 8.1 Layout and information architecture

The TUI is chat-centric:

- **Chat log** — chronological trace of messages, reasoning, tools, results, and answers.
- **Composer** — input with `@`, `!`, `/`, image drop, and submit.
- **Status bar** — model, agent, mode, usage, auto indicator.
- **Dialogs** — permissions, questions, help, models, themes, sessions.
- **Session surfaces** — session list, child sessions, titles.
- **Persistent plan** — todo checklist, often inline or pinned.

Desktop and web clients have more room for a persistent rail and review pane, which is
closer to our app's shell.

### 8.2 Message anatomy

- **User message:** text, file chips, image thumbnails.
- **Reasoning block:** dim, collapsible, streamed.
- **Tool row:** icon, verb, object, status, result summary.
- **Tool result:** preview, counts, diff, error.
- **Answer:** markdown, code blocks, links, file list.
- **System markers:** compaction, retry, interruption, completion.

### 8.3 Component inventory

| Component | Answers | Default | Expanded | Key states | Interactions |
| --- | --- | --- | --- | --- | --- |
| User message | What did I ask? | Text + chips | Full attachments | Sent, edited, reverted | Edit/resend, undo |
| Reasoning block | Why? | Collapsed/dim | Streamed reasoning | Streaming, done, hidden | Toggle |
| Tool row | What is it doing? | One line | Args + raw output | Proposed, waiting, running, success, error, denied, cancelled | Expand, retry, copy |
| Diff card | What changed? | Summary +/− | Full diff | Applied, reverted, conflict | Expand, undo, open file |
| Todo list | How far? | Checklist | Plan + priority | Pending, in progress, completed, cancelled | Collapse, filter, steer |
| Permission prompt | Is it safe? | Command/diff + choices | Pattern details | Waiting, approved, denied | Once, always, reject |
| Question form | What does it need? | Question + options | Custom answer | Waiting, answered | Select, type, navigate |
| Subagent block | Who's doing what? | Agent + task + status | Child transcript | Running, done, error | Drill down, return |
| Compaction marker | Will it remember? | "Compacted" + summary | Summary details | Compacting, done | Expand |
| Status bar | Global state | Model, agent, usage | Details | Idle, busy, auto | Switch model/agent |
| Composer | How do I steer? | Input + hints | Command palette | Empty, typing, disabled | @, !, /, submit |
| Session list | Where am I? | Titles + status | Metadata | Active, idle, error | Resume, new, delete |
| Toast/dialog | What happened? | Brief message | Actions | Info, success, error | Dismiss, act |
| Empty state | What can I do? | Tips/examples | Onboarding | First run | Start, init, connect |

### 8.4 Visual semantics

- **Color:** status (success/warning/error), role (user/assistant/system), diff (+/−),
  agent identity.
- **Icons:** tool type, status, agent.
- **Typography:** assistant text normal; reasoning dim; code monospace; labels compact.
- **Indentation:** nesting for subagents and tool results; dependency.
- **Spacing:** group by turn or step; avoid dense walls.
- **Motion:** spinner only on the active item; streaming cursor; collapse/expand; no
  decorative animation.
- **Sound:** attention events; opt-in; volume; sound packs.

### 8.5 States and motion

Session states:

```
idle -> submitting -> thinking -> acting -> waiting_for_user -> thinking -> ... -> done
                                      -> error
                                      -> aborted
```

Motion rules:

- Animate only active work.
- Respect reduced motion.
- Avoid layout shift; append and mutate in place.
- Use elapsed time for long tools.
- Use a subtle completion state, not a celebration.

### 8.6 Progressive disclosure

Default view should be scannable. Expand for:

- Reasoning.
- Raw tool arguments.
- Full tool output.
- Full diffs.
- Child sessions.
- Compaction summaries.

OpenCode uses `/details` and per-component toggles. Our app already uses `Collapsible` for
folders and files; the pattern is established.

### 8.7 Input and navigation

- `@` — files and agents.
- `!` — shell command.
- `/` — slash commands.
- `Tab` — switch primary agent.
- Leader key (`ctrl+x`) — shortcuts.
- `ctrl+p` — command palette.
- `ctrl+t` — cycle model variants.
- `ctrl+x e` — external editor.
- `ctrl+x l` — sessions.
- `ctrl+x u` / `ctrl+x r` — undo/redo.
- `ctrl+x x` — export.
- `ctrl+x t` — themes.
- `ctrl+x m` — models.
- `ctrl+x n` — new session.
- `ctrl+x c` — compact.
- `ctrl+x q` — exit.
- Mouse capture, scroll speed, cursor style are configurable.
- Child session navigation: leader+down to enter, left/right to cycle, up to return.

**Our gap:** only Enter-to-send and basic dropdowns. No keyboard model, no command palette,
no `@`/`/`/`!` input grammar.

### 8.8 Notifications and peripheral awareness

- Attention notifications for questions, permissions, errors, session completion, and
  subagent completion.
- Sounds for the same events.
- Non-subagent events notify only when the terminal is blurred.
- Sound packs and volume are configurable.
- The goal is awareness without interruption.

**Our gap:** `ChromeToast` exists but is unused. No notification or sound model.

### 8.9 Empty, loading, error, and recovery states

- **Empty:** tips, examples, `/init`, `/connect`, `/help`.
- **Loading:** spinner, elapsed time, partial streaming.
- **Error:** inline, persistent, actionable; not toast-only.
- **Recovery:** retry, edit, deny, abort, undo.
- **Partial:** show what completed and what remains.

### 8.10 Accessibility

- Keyboard-first; focus order in dialogs.
- Do not rely on color alone; pair with labels/icons.
- Ensure contrast for diffs and statuses.
- Respect reduced motion.
- Pair sound with visual notifications.
- Handle narrow terminals; stacked diffs; truncation.
- Provide copy/export for screen-reader and external use.
- Use plain language for statuses.

Our app has some good foundations: `aria-live` on the working line, `aria-label`s on icon
buttons, `MotionConfig reducedMotion="user"`, focus-visible rings, and semantic status
labels. These should be preserved as we add the missing surfaces.

### 8.11 Theming and customization

- Themes.
- Agent colors.
- Diff styles: auto or stacked.
- Cursor style and blinking.
- Scroll speed and acceleration.
- Mouse capture.
- Keybinds.
- Attention settings.

**Our gap:** dark mode only; no diff style, keybind, or attention settings.

### 8.12 What the UI deliberately hides

- Raw context window.
- Full tool output by default.
- Other sessions.
- Internal retries.
- Provider details.
- Some permission internals.

The UI is a lossy projection. Design the lossiness deliberately.

---

## 9. Cross-cutting systems

### 9.1 Sessions

- Create, list, resume, delete.
- Auto-generated titles.
- Share and export.
- Fork at a message.
- Child sessions for subagents.

### 9.2 Summaries

- Hidden title agent generates short session titles.
- Hidden summary agent creates session summaries.
- Compaction agent summarizes context.

### 9.3 Undo and redo

- `/undo` removes the last user message, subsequent responses, and file changes.
- `/redo` restores.
- Git-backed snapshots.
- Revert/unrevert via API.
- Session diff shows changes.

### 9.4 Diffs

- File diffs rendered as cards.
- `diff_style`: auto or stacked.
- Session-level diff.
- Diff previews in permission prompts.

### 9.5 Compaction

- Automatic when context is tight.
- Manual via `/compact`.
- Summary marker in the trace.
- Continuity after compaction.

### 9.6 Max steps

- Agent config `steps`.
- When reached, the model is forced to summarize and recommend remaining work.
- Prevents runaway loops and cost.

### 9.7 Multi-session work

- Multiple sessions can run.
- Child sessions represent delegated work.
- The UI must handle concurrent statuses and completion notifications.

### 9.8 Cost and usage

- Token usage and cost readouts in some clients.
- Context pressure indicators.
- Transparency builds trust and helps users manage spend.

### 9.9 Extensibility

- MCP servers.
- Custom tools.
- Plugins.
- LSP servers.
- Formatters.

---

## 10. Element-by-element mapping to our app

Legend: **Implemented** = the visual/interaction exists in our mock; **Partial** = a stub
or a partial version exists; **Missing** = no equivalent yet. Our components live in
`src/components/ag/` unless noted.

### 10.1 Shell and navigation

| OpenCode element | Job | Ours | Status |
| --- | --- | --- | --- |
| App identity / version | Brand and context | `app-header.tsx`: logo, "Antigravity", version badge, avatar | Implemented |
| New session action | Start fresh work | Header `SquarePen` + sidebar "New Conversation" | Implemented (mock: selects first thread) |
| Session history | Resume old work | `chrome-dialogs.tsx` `HistoryDialog`; sidebar "Conversation History" | Partial: flat list, no search/filter |
| Session list / rail | See all work at a glance | `sidebar-left.tsx`: projects + threads under "new-project" | Partial: mock projects, only one project has threads |
| Status dots | Running / blocked / idle | `STATUS_DOT` with pulse/warning/muted | Partial: no "needs attention" count or filter |
| Projects / workspaces | Organize by repo | Hardcoded `PROJECTS`; composer project dropdown | Partial: not connected to one state source |
| Settings | Preferences | `SettingsDialog`: dark mode, default model, prefer worktrees | Partial: no approvals/run mode |
| Toasts | Non-blocking feedback | `ChromeToast` exported | Partial: unused |
| Restart to update | Ship-safe update flow | `RestartDialog` exists; header button not wired | Partial |
| Open IDE | Handoff to editor | `OpenIdeDialog` exists; header button not wired | Partial |
| Plans sidebar | Saved plan artifacts | None | Missing |
| Child session list | Delegated work | None | Missing |
| Command palette | Discoverability | None | Missing |

### 10.2 Thread and timeline

| OpenCode element | Job | Ours | Status |
| --- | --- | --- | --- |
| User prompt | Anchor each instruction | `thread-view.tsx` right-aligned bubble | Implemented |
| Reasoning block | Show why, optionally | `note.workedFor` line only | Partial: no reasoning body/toggle |
| Assistant prose | Findings and summaries | `note` message kind | Implemented |
| Working/status line | Live heartbeat | `working` kind + `Spinner` + `aria-live` | Implemented |
| Tool-call row | One line per action | `folders` and `files` collapsibles | Partial: no generic tool row, no raw output |
| Tool result preview | Evidence of what was learned | File names + line ranges | Partial: no output, no truncation marker |
| Edit/diff chip in thread | Surface file mutations | Only in `artifact-tabs.tsx` Overview/Review | Partial: not in the thread |
| Terminal command card | Transparent execution | Only the blocked variant in `permission-card.tsx` | Partial: no command result card |
| Permission card | Human gate | `permission-card.tsx`: "Permission required", Blocked badge, command, Approve/Deny | Partial: no once/always/reject, no reason, no diff preview |
| Clarifying question | Structured mid-task Q&A | None | Missing |
| Queued messages | Batch follow-ups | None | Missing |
| Steering / send now | Redirect mid-run | None | Missing |
| Stop / abort | Kill a runaway turn | None | Missing |
| Checkpoints / restore | Safe rollback | None | Missing |
| Subagent cards | Show delegation fan-out | `subagents` kind with running/done cards | Implemented visually; no child session |
| Child session drill-down | Inspect delegated work | None | Missing |
| Todo checklist | Track multi-step execution | Static 3/5 `Progress` in artifact panel | Missing in thread |
| Compaction marker | Explain memory changes | None | Missing |
| Error / retry / cancel states | Recovery | None | Missing |
| Final summary / walkthrough | Auditable handoff | `walkthrough` pill (non-functional link) | Partial |
| Suggested follow-ups | Reduce blank-canvas cost | None | Missing |

### 10.3 Composer

| OpenCode element | Job | Ours (`composer.tsx`) | Status |
| --- | --- | --- | --- |
| Auto-grow textarea, Enter-send | Core input | 160px cap, Enter/Shift+Enter | Implemented |
| Project selector | Route work to a repo | Folder dropdown above the box | Implemented (mock) |
| Agent/mode switcher | Choose autonomy level | None | Missing |
| Model picker | Match cost/capability | Model dropdown | Implemented |
| Reasoning effort / variant | Control thinking depth | Static "(High)" suffix | Partial |
| `@` mention autocomplete + pills | Precise context | Placeholder only | Missing |
| `/` command palette | Repeatable actions | Placeholder only | Missing |
| `!` shell input | Run a command as context | None | Missing |
| Attach images/files | Visual context | Plus icon stub | Partial |
| Voice input | Hands-free prompting | Mic icon stub | Partial |
| Local vs worktree toggle | Isolation choice | Laptop/GitFork dropdown | Implemented (concept, mock) |
| Context ring / usage | Prevent silent overflow | None | Missing |
| Queue vs send-now | Safe batching while running | Single send path; no queue | Missing |
| Stop / abort | Interrupt | None | Missing |
| Auto-mode indicator | Show approval policy | None | Missing |

### 10.4 Permission and control

| OpenCode element | Job | Ours | Status |
| --- | --- | --- | --- |
| Permission card | Gate risky actions | `permission-card.tsx` | Implemented visual |
| Command preview | Show what will run | `$ command` line | Implemented |
| Once / always / reject | Scoped approval | Approve / Deny only | Partial |
| Reason / "why paused" | Explain the gate | "Permission required" + Blocked badge | Partial |
| Diff preview in gate | Show file impact | None | Missing |
| Granular policy patterns | Reduce permission fatigue | None | Missing |
| Auto mode | Approve non-denied actions | None | Missing |
| Doom-loop guard | Detect repeated calls | None | Missing |
| External directory guard | Protect outside paths | None | Missing |
| `.env` protection | Protect secrets | None | Missing |
| Denial feedback to model | Let the agent adapt | Denial note in mock | Partial |
| Interrupt / abort | Stop a run | None | Missing |

### 10.5 Plan, artifact, and review

| OpenCode element | Job | Ours | Status |
| --- | --- | --- | --- |
| Artifact panel | Review surface | `artifact-panel.tsx` with Overview / Plan / Review | Implemented |
| Plan document | Review-before-code contract | `PlanTab`: static plan with User Review Required + Open Questions | Partial: not editable |
| Proceed / Build | Approve the plan | Footer "Proceed"; approved state | Implemented visual (mock) |
| Task progress | Track execution | Static `Progress` 3/5 | Partial |
| Overview sections | Mission summary | Subagents, Files Changed, Artifacts, Background Tasks | Implemented (mock) |
| Aggregated diff | Post-build verification | `ReviewPane` mock diff + comments | Partial: no accept/reject, fake diff |
| Review comments | Feedback loop | Comments thread + "Post comment" | Implemented (beyond OpenCode) |
| Find issues / verification | Automated post-checks | None | Missing |
| Session diff | All changes in one place | None | Missing |
| Saved plans | Reusable plan artifacts | None | Missing |
| Best-of-N / parallel attempts | Choose among attempts | None | Missing |
| Checkpoints / restore | Rollback | None | Missing |

### 10.6 Memory and recovery

| OpenCode element | Job | Ours | Status |
| --- | --- | --- | --- |
| Session list / resume | Continue old work | Sidebar + History dialog | Partial |
| Session titles | Orientation | Mock titles in `data.ts` | Implemented (mock) |
| Session summaries | Compress a session | None | Missing |
| Compaction | Free context | None | Missing |
| Undo / redo | Revert a turn and files | None | Missing |
| Revert / unrevert | Message-level rollback | None | Missing |
| Snapshots | Git-backed restore | None | Missing |
| Export | Share a transcript | None | Missing |
| Share link | Hand off a session | None | Missing |
| Fork | Branch a session | None | Missing |
| Max steps | Cost/loop control | None | Missing |
| Cost / usage | Transparency | None | Missing |
| Completion notifications | Peripheral awareness | None (toast unused) | Missing |

### 10.7 Cross-cutting systems

| OpenCode system | Job | Ours | Status |
| --- | --- | --- | --- |
| Subagents | Delegate and parallelize | `subagents` cards | Partial: visual only |
| Child sessions | Inspect delegated work | None | Missing |
| Skills | Reusable playbooks | None | Missing |
| `AGENTS.md` / rules | Project behavior | None | Missing |
| MCP / custom tools | Extend capabilities | None | Missing |
| LSP / formatters | Code intelligence / cleanup | None | Missing |
| Model variants | Reasoning effort | Static "(High)" | Partial |
| Themes | Personalization | Dark mode | Partial |
| Notifications / sounds | Awareness | None | Missing |
| Accessibility | Inclusive use | Some good aria/reduced-motion foundations | Partial |

---

## 11. Task-lifecycle flow comparison

Same job, three products — where do the flows diverge?

```
STEP              OPENCODE                                  OUR APP (ag/)
-------------------------------------------------------------------------------------
1. Start          Choose agent/model; @ context            Pick thread (Rail); pick
                                                           project/model/worktree
2. Prompt         Type; @, !, /                            Type; Enter
3. Kickoff        Assemble context; stream reasoning        working spinner appended
4. During run     One-line tool rows; todo checklist;       folders/files/subagents;
                  permission gates; questions; abort        permission card; no queue,
                                                           stop, steer, or todo
5. Gate           once / always / reject; auto mode         Approve / Deny
6. Plan           todos + optional Plan mode                 Artifact card -> panel ->
                                                           Proceed (static plan)
7. Finish         Summary + diff + verification              note + walkthrough pill
8. Verify         Session diff; tests; LSP; review           Mock diff + comments;
                                                           no accept/reject
9. Ship           Commit/PR outside; export/share            Branch mention only
10. Recover       Undo/redo; revert; snapshots; compact      Nothing
```

**Key insight:** our happy path already mirrors the **visual vocabulary** of both Cursor
and OpenCode surprisingly well — user bubble, worked-for label, tool groups, subagent
cards, permission card, artifact plan, review pane. What we lack is the **live loop and
the recovery story**: no real event stream, no reasoning body, no generic tool renderer,
no todo checklist, no stop/queue/steer, no checkpoints, no undo, no compaction, and no
context visibility.

That is the next chunk of product value.

---

## 12. Gap analysis and prioritized backlog

### P0 — core agent-loop credibility

1. **Mode switcher (Build / Plan / Ask) in the composer.** Even as client-side state that
   gates simulated capabilities, it is the most visible OpenCode/Cursor concept we lack.
2. **Stop + queued messages + steering.** While a thread is `running`, the user needs to
   interrupt, queue a follow-up, or redirect at a safe boundary.
3. **Real permission semantics.** Once / always / reject, a short reason, and a
   command/diff preview. Approve/Deny alone is too coarse.
4. **Reasoning block + generic tool row.** One-line verb + object + outcome, expandable to
   arguments and output. This is the atomic unit of the trace.
5. **Live todo checklist.** Replace or augment the static 3/5 progress bar with a
   status-driven list (`pending`, `in_progress`, `completed`, `cancelled`).
6. **Editable plan + real Proceed state.** The plan is the contract before code; let the
   user refine it.

### P1 — trust, orientation, and recovery

7. **Checkpoints / restore + undo/redo.** At minimum, a mock snapshot before significant
   changes and a restore action.
8. **Context ring / token estimate + compaction marker.** Answer "will it remember?"
9. **Error / retry / cancel states** for tools and providers. Inline, persistent,
   actionable.
10. **Question card.** Structured options plus a free-text answer.
11. **Session search/filter + child session drill-down.**
12. **Wire the orphaned chrome:** `RestartDialog`, `OpenIdeDialog`, `ChromeToast`,
    "Scheduled Tasks", "See all (20)".
13. **Diff accept/reject + verification result.** Move the Review tab from mock to a
    credible review loop.

### P2 — scale and differentiation

14. **Subagent child sessions + parallel status.** Show existence, status, and summary,
    with drill-down.
15. **`@` mention pills + `/` command palette + `!` shell input.**
16. **Skills / `AGENTS.md` / MCP surfaces.** Start with a read-only "Context" panel that
    lists rules, skills, and connected tools.
17. **Export / share / fork.**
18. **Notifications and attention settings.**
19. **Model variants and reasoning-effort selection.**
20. **Accessibility and keyboard-first polish:** focus order, shortcuts, labels, reduced
    motion, contrast.

### Deliberate non-goals (for now)

- Full terminal emulator or editor fork.
- Provider management and enterprise policy.
- Cloud agent fleet, Slack/GitHub/Linear entry points.
- Best-of-N/worktree orchestration before the single-agent loop is credible.
- Real sandboxing before the control surface is designed.

---

## 13. Patterns worth stealing and anti-patterns

### 13.1 Ten patterns worth stealing

1. **One line per action.** Verb + object + outcome; details on demand.
2. **Progressive disclosure.** Collapse reasoning, raw output, and child sessions.
3. **Status as a state machine.** Pending/running/success/error/denied/cancelled.
4. **Stream and mutate in place.** Update the part that changed; don't re-render the
   transcript.
5. **Keep the plan visible.** Todos are the spine of long tasks.
6. **De-emphasize reasoning.** Show it for trust; never as the answer.
7. **Gate risk inline.** Permission with a preview and scoped approval.
8. **Make actions reversible.** Diffs, undo/redo, snapshots.
9. **Show context pressure.** Usage, compaction, attachments.
10. **Design for peripheral awareness.** Notifications and sounds.

### 13.2 Anti-patterns

- The infinite spinner with no elapsed time.
- The disappearing error toast.
- A wall of chain-of-thought as the main content.
- Silent actions with no trace.
- A modal that hides the context you need to decide.
- Auto-scroll hijacking.
- A fake progress bar.
- "Done" without verification.
- A permission prompt without a preview.
- Irreversible actions without undo.
- Nested subagent noise.
- A context meter that alarms without explanation.
- Anthropomorphic "thinking" theatre.
- A stepper that lies about the process.
- Raw token dumps as "transparency."
- Hiding the tool result the user needs.

### 13.3 User-question matrix

| User question | UI affordance | OpenCode example |
| --- | --- | --- |
| What is it doing? | Action trace | Tool rows, spinner, elapsed time |
| Why? | Reasoning/plan | Thinking block, todos, args |
| How far? | Progress | Todo status, step count, subagent status |
| Is it safe? | Gates | Permission prompt, diff preview, policies |
| Can I undo? | Reversibility | Undo/redo, revert, snapshots |
| Will it remember? | Memory | Context usage, compaction, attachments |
| Who's doing what? | Delegation | Child sessions, agent labels |
| What did it learn? | Evidence | Tool results, reads, matches |
| What changed? | Diff | File diffs, session diff |
| What's next? | Synthesis | Final answer, remaining todos |

### 13.4 Screen/state checklist

- First run/empty.
- Idle.
- Streaming reasoning.
- Streaming text.
- Tool proposed.
- Tool waiting for permission.
- Tool running.
- Tool success.
- Tool error.
- Tool denied.
- Tool cancelled.
- Question waiting.
- Subagent running.
- Compaction.
- Interrupted.
- Completed.
- Reverted.
- Offline/provider error.

### 13.5 Four-layer checklist

1. **Intent and control:** Can the user express goals and set boundaries?
2. **Context and memory:** Can the user see what the agent knows and how it forgets?
3. **Action and evidence:** Can the user see what the agent did and learned?
4. **Recovery and trust:** Can the user recover from failure and trust the result?

---

## 14. Worked trace

### 14.1 Happy path

```
> Add a dark mode toggle to the settings page

| Thinking                                   [collapsed]
| Glob  **/settings/**                       2 files
| Read  app/settings/page.tsx                142 lines
| Read  components/theme-provider.tsx         38 lines
| Grep  "theme"                              6 matches
| TodoWrite                                  5 tasks
   [ ] Add toggle UI
   [~] Wire theme provider        <- in progress
   [ ] Persist preference
   [ ] Update empty states
   [ ] Verify contrast
| Edit  page.tsx                             +18 -2   [diff]
| Edit  theme-provider.tsx                   +6 -1    [diff]
| Bash  npm run typecheck                    error
| Read  page.tsx (lines 40-80)               40 lines
| Edit  page.tsx                             +2 -2
| Bash  npm run typecheck                    ok 4.2s
| Bash  npm test                             ok 12 tests
| TodoWrite                                  5/5 done
Done - 2 files changed.  [view diff] [undo]
```

The trace answers: *What is it doing? How far along? What changed? Is it safe? Can I undo
it?* without a wall of tokens.

### 14.2 Permission denied

```
| Bash  rm -rf build                         permission required
|   command: rm -rf build
|   [allow once] [always allow rm -rf *] [reject]
> reject
| Bash  rm -rf build                         denied
| Thinking ...
| Bash  git clean -nd build                  ok
```

The denial becomes context; the model adapts.

### 14.3 Tool error

```
| Bash  npm run build                        error
|   error TS2304: Cannot find name 'theme'
| Read  src/theme.ts                         22 lines
| Edit  src/theme.ts                         +1 -1
| Bash  npm run build                        ok 6.1s
```

Errors are inline, persistent, and actionable.

### 14.4 Interruption

```
| Bash  npm test                             running 12s...
> [abort]
| Bash  npm test                             cancelled
| TodoWrite                                  2/5 done
| Thinking ...
```

Partial state is preserved; the todo list shows what remains.

### 14.5 Subagent

```
| Task  explore: find theme usage             running
|   child session: 3 files, 2 matches
| Task  explore: find theme usage             done
|   summary: theme is read in 3 places...
```

Existence is visible; the transcript is behind a drill-down.

### 14.6 Compaction

```
| Compaction                                  context 92% -> 41%
|   summary: 14 messages compacted...
```

The user understands why memory changed.

### 14.7 What our app would need to render this

- A generic `tool` message kind with `name`, `args`, `status`, `output`, `error`.
- A `reasoning` message kind with `text` and `collapsed`.
- A `todo` message kind with items and statuses.
- A `question` message kind with options and a custom answer.
- An `error` / `retry` state attached to a tool or provider call.
- A `compaction` marker.
- A `checkpoint` marker with restore.
- A `childSession` reference for subagents.
- A status bar for model, agent, usage, and auto mode.

Our existing visual vocabulary can carry most of this; the missing piece is the **data
model and state transitions**, not the styling.

---

## 15. Sources

Primary (official docs consulted):

- OpenCode Intro: <https://opencode.ai/docs/>
- OpenCode TUI: <https://opencode.ai/docs/tui/>
- OpenCode Tools: <https://opencode.ai/docs/tools/>
- OpenCode Agents: <https://opencode.ai/docs/agents/>
- OpenCode Permissions: <https://opencode.ai/docs/permissions/>
- OpenCode Server: <https://opencode.ai/docs/server/>
- OpenCode SDK: <https://opencode.ai/docs/sdk/>
- OpenCode v2 Intro: <https://opencode.ai/v2/docs/>

Related official docs for follow-up reading:

- Rules / `AGENTS.md`: <https://opencode.ai/docs/rules/>
- Skills: <https://opencode.ai/docs/skills/>
- Keybinds: <https://opencode.ai/docs/keybinds/>
- Commands: <https://opencode.ai/docs/commands/>
- Themes: <https://opencode.ai/docs/themes/>
- MCP servers: <https://opencode.ai/docs/mcp-servers/>
- Custom tools: <https://opencode.ai/docs/custom-tools/>
- LSP servers: <https://opencode.ai/docs/lsp/>
- Formatters: <https://opencode.ai/docs/formatters/>
- References: <https://opencode.ai/docs/references/>

Verification checklist before implementation:

- Confirm the target client (TUI v1, TUI v2, desktop, web).
- Confirm which part types and events it exposes.
- Confirm whether a context meter/percentage is shown.
- Confirm how todos are rendered and updated.
- Confirm the exact permission prompt options.
- Confirm notification/sound behavior.
- Confirm keybindings for the installed version.
- Confirm the diff style and review affordances.

---

## 16. Maintainer note

Keep this document updated when OpenCode ships a breaking interface change, when the
event/part model changes, or when an item moves from **Missing** to **Partial** or
**Implemented** in `src/components/ag/`. The mapping table is the backlog's source of
truth; the pattern sections are the design rationale.

When in doubt, verify against the installed OpenCode build rather than the docs alone.
Docs explain intent; the client shows the actual states, timing, and micro-interactions.
