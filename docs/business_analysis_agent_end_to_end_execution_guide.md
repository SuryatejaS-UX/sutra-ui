# End-to-End Execution Guide: Business Analysis Agent in Sutra UI
*The Chronological, Start-to-Finish Engineering & Interaction Specification for the Jira Agile Pipeline*

---

## Executive Overview & Architectural Purpose

This document provides a comprehensive, chronological, **start-to-finish operational walkthrough** for executing the **Business Analysis Agent** (`BUSINESS ANALYSIS AGENT.md`) inside **Sutra UI** without modifying the approved layout architecture (`workspace_layout_specification.md`).

It synthesizes the UI shell and section specifications from `interface_sections_purpose_guide.md` and the agentic runtime principles from `unified_agentic_ux_architecture_analysis.md`. For every single stage of the journey, this document articulates:
1. **The Context**: The operational reality, user state, and system lifecycle at that exact moment.
2. **The Purpose**: The concrete user need, cognitive ergonomic goal, or enterprise constraint being addressed.
3. **The Design Decisions & Rationale**: Why the interface and agent behave the way they do, compared to conventional alternatives.

The document is organized strictly chronologically—from the moment the user discovers the agent on the Catalogue grid, through cold-start layout scaling, tri-modal scope resolution, natural language normalization, autonomous generation, dynamic deliverable expansion, human-in-the-loop governance, and live Jira API execution, to downstream agile chaining and governed turn rollbacks.

> [!TIP]
> **Engineering Implementation Roadmap & Gap Analysis:**  
> For the component-by-component engineering audit, dependency graph, and prioritized development roadmap, see:  
> [Business Analysis Agent: Component Gap Analysis, Dependency Graph & Implementation Roadmap](file:///c:/Users/Surya%20Teja%20S/OneDrive/Documents/Agentic%20AI%20research/sutra-ui/docs/business_analysis_agent_component_gap_and_implementation_roadmap.md).

---

## Table of Contents: The 12 Chronological Stages

1. [STAGE 1: Discovery & Agent Activation (Zone 2: Agent Catalogue)](#stage-1-discovery--agent-activation-zone-2-agent-catalogue)
   - [1.1 Landing on the Catalogue Grid](#11-landing-on-the-catalogue-grid)
   - [1.2 The Business Analysis Agent Card Anatomy](#12-the-business-analysis-agent-card-anatomy)
   - [1.3 View Transition Mechanics (Zone 2 $\rightarrow$ Zone 3)](#13-view-transition-mechanics-zone-2--zone-3)
   - [1.4 Context, Purpose & Design Rationale](#14-context-purpose--design-rationale)
2. [STAGE 2: Entering Workspace Shell & Initial Dynamic Layout (Scenario C5)](#stage-2-entering-workspace-shell--initial-dynamic-layout-scenario-c5)
   - [2.1 The Cold-Start Cognitive Ergonomics Problem & Solution (75%/25% Split)](#21-the-cold-start-cognitive-ergonomics-problem--solution-7525-split)
   - [2.2 Column 2 Content: Agent Context Section (.s08-artifacts-view Empty State)](#22-column-2-content-agent-context-section-s08-artifacts-view-empty-state)
   - [2.3 Context, Purpose & Design Rationale](#23-context-purpose--design-rationale)
3. [STAGE 3: Scope Resolution & Cold-Start Guidance State](#stage-3-scope-resolution--cold-start-guidance-state)
   - [3.1 The Tri-Modal Scope Architecture (Sidebar, Inset Bar, Composer Mention)](#31-the-tri-modal-scope-architecture-sidebar-inset-bar-composer-mention)
   - [3.2 Inset Scope Bar Dismissal Animation](#32-inset-scope-bar-dismissal-animation)
   - [3.3 The Agent Guidance Card & Starter Suggestion Chips](#33-the-agent-guidance-card--starter-suggestion-chips)
   - [3.4 Context, Purpose & Design Rationale](#34-context-purpose--design-rationale)
4. [STAGE 4: Prompt Composition & Resilient Input Normalization (3 Pathways)](#stage-4-prompt-composition--resilient-input-normalization-3-pathways)
   - [4.1 Pathway A: Keyboard Power User (@workspace Mention & Token Pill)](#41-pathway-a-keyboard-power-user-workspace-mention--token-pill)
   - [4.2 Pathway B: Plain English User (Scope Typed Without @ Auto-Converted)](#42-pathway-b-plain-english-user-scope-typed-without--auto-converted)
   - [4.3 Pathway C: Omitted Scope User (Zero-Error Conversational Resolution Card)](#43-pathway-c-omitted-scope-user-zero-error-conversational-resolution-card)
   - [4.4 PRD & Specification Attachment (Local Drag-and-Drop & Cloud Drives)](#44-prd--specification-attachment-local-drag-and-drop--cloud-drives)
   - [4.5 Context, Purpose & Design Rationale](#45-context-purpose--design-rationale)
5. [STAGE 5: Orchestration Cognition (Supervisor Agent & Rule Node Routing)](#stage-5-orchestration-cognition-supervisor-agent--rule-node-routing)
   - [5.1 Ingestion Envelope & Tool Call Telemetry](#51-ingestion-envelope--tool-call-telemetry)
   - [5.2 Intent Classification & Specialized Agent Delegation](#52-intent-classification--specialized-agent-delegation)
   - [5.3 Context, Purpose & Design Rationale](#53-context-purpose--design-rationale)
6. [STAGE 6: Handling Missing Information (Adaptive Multi-Step Questionnaire in Composer)](#stage-6-handling-missing-information-adaptive-multi-step-questionnaire-in-composer)
   - [6.1 Ambiguity Detection & In-Place Composer Morphing (div#s08-chat-input-box)](#61-ambiguity-detection--in-place-composer-morphing-divs08-chat-input-box)
   - [6.2 Component Design & Shadcn/ui Aesthetic Specification](#62-component-design--shadcnui-aesthetic-specification)
   - [6.3 Multi-Question Sequential Workflow (Max 3–4 Questions)](#63-multi-question-sequential-workflow-max-34-questions)
   - [6.4 The [Skip] Action & Autonomous Fallback Defaults](#64-the-skip-action--autonomous-fallback-defaults)
   - [6.5 Reverse Morphing & The Conversation Stream Audit Trail](#65-reverse-morphing--the-conversation-stream-audit-trail)
   - [6.6 Context, Purpose & Design Rationale](#66-context-purpose--design-rationale)
7. [STAGE 7: Autonomous Generation & Dynamic Deliverable Expansion (Scenario C2/C1)](#stage-7-autonomous-generation--dynamic-deliverable-expansion-scenario-c2c1)
   - [7.1 The Dynamic Splitter Transition (Chat 30% / Deliverable 70%)](#71-the-dynamic-splitter-transition-chat-30--deliverable-70)
   - [7.2 Dual-Surface Artifact Projection & Stage Features](#72-dual-surface-artifact-projection--stage-features)
   - [7.3 Context, Purpose & Design Rationale](#73-context-purpose--design-rationale)
8. [STAGE 8: Human-In-The-Loop (HITL) Validation & Docked Staging](#stage-8-human-in-the-loop-hitl-validation--docked-staging)
   - [8.1 In-Stream HITL Decision Gate Card](#81-in-stream-hitl-decision-gate-card)
   - [8.2 Meso Staging Dock (Docked Review Ribbon Above Composer)](#82-meso-staging-dock-docked-review-ribbon-above-composer)
   - [8.3 Decision Branching: Iterative Feedback Loop vs. Approval](#83-decision-branching-iterative-feedback-loop-vs-approval)
   - [8.4 Context, Purpose & Design Rationale](#84-context-purpose--design-rationale)
9. [STAGE 9: Jira API Tool Execution & Live Telemetry](#stage-9-jira-api-tool-execution--live-telemetry)
   - [9.1 Tool Invocation (jira_create_epic) & Parameter Binding](#91-tool-invocation-jira_create_epic--parameter-binding)
   - [9.2 Dynamic Layout Transition to Log Viewer (Layout T6 / T8)](#92-dynamic-layout-transition-to-log-viewer-layout-t6--t8)
   - [9.3 Real-Time HTTP Stream & Staging Dock Dismissal](#93-real-time-http-stream--staging-dock-dismissal)
   - [9.4 Context, Purpose & Design Rationale](#94-context-purpose--design-rationale)
10. [STAGE 10: State Persistence & Response Keeping](#stage-10-state-persistence--response-keeping)
    - [10.1 Response Keeping Agent State Registration](#101-response-keeping-agent-state-registration)
    - [10.2 Deliverable Synchronization & Jira Cloud Portal Linking](#102-deliverable-synchronization--jira-cloud-portal-linking)
    - [10.3 Context, Purpose & Design Rationale](#103-context-purpose--design-rationale)
11. [STAGE 11: Downstream Agile Chaining (Features $\rightarrow$ Stories $\rightarrow$ Test Cases)](#stage-11-downstream-agile-chaining-features--stories--test-cases)
    - [11.1 The Complete Hierarchical Breakdown Pipeline](#111-the-complete-hierarchical-breakdown-pipeline)
    - [11.2 Generating Features for an Epic (jira_create_features)](#112-generating-features-for-an-epic-jira_create_features)
    - [11.3 Generating User Stories for a Feature (jira_create_user_story)](#113-generating-user-stories-for-a-feature-jira_create_user_story)
    - [11.4 Generating Acceptance Test Cases (jira_create_test_case)](#114-generating-acceptance-test-cases-jira_create_test_case)
    - [11.5 Context, Purpose & Design Rationale](#115-context-purpose--design-rationale)
12. [STAGE 12: Session Organization & Governed Undo Rollbacks](#stage-12-session-organization--governed-undo-rollbacks)
    - [12.1 Project Archiving via Task Kebab Menu](#121-project-archiving-via-task-kebab-menu)
    - [12.2 Governed Turn Rollback Flow (#s08-confirm-undo-modal)](#122-governed-turn-rollback-flow-s08-confirm-undo-modal)
    - [12.3 Context, Purpose & Design Rationale](#123-context-purpose--design-rationale)
- [Appendix A: Typed Server-Sent Events (SSE) Protocol](#appendix-a-typed-server-sent-events-sse-protocol)
- [Appendix B: Error Handling & Self-Healing Matrix](#appendix-b-error-handling--self-healing-matrix)

---

## The End-to-End Visual Journey

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: Zone 2 - Agent Catalogue Landing Grid                                         │
│ User browses Productivity category -> Clicks [Use Agent] on Business Analysis Card    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼ View State Transition
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2 & 3: Zone 3 - Initial Dynamic Layout (Scenario C5: Chat Dominance 75%/25%)     │
│ • Column 1 (Conversation): 75%–80% Dominance (Spacious prompt, scope bar, suggestions) │
│ • Column 2 (Tabs Canvas): 20%–25% Context Only (.s08-artifacts-view empty dropzone)   │
│ • User sets scope -> Scope bar collapses (250ms) -> Agent Guidance Card appears        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼ User Prompt Input
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: Prompt Normalization (Pathway A: @, Pathway B: Plain text, Pathway C: Omitted) │
│ User attaches PRD -> System normalizes scope to [@workspace: Acme Inc / Design Eng]    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼ Supervisor Execution
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5 & 6: Supervisor & Rule Node Cognition                                          │
│ • Supervisor calls read_file + get_time_context -> Routes to Epic Generation Agent     │
│ • (Optional) Clarifies missing sprint via Interactive Question Card                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼ Dynamic Layout Shift to Deliverable
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 7: Autonomous Generation & Dynamic Splitter Expansion (Scenario C2: 30% / 70%)   │
│ • Column 1 compresses to 30% (Reasoning Drawer + Live Todo Checklist)                 │
│ • Column 2 expands to 70% (Editor Stage mounts Markdown Spec with Gherkin criteria)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼ Human-In-The-Loop Checkpoint
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 8: HITL Validation Gate & Meso Staging Dock                                      │
│ • In-stream HITL Gate Card: [Request Edits] vs [Approve & Create in Jira ▼]            │
│ • Docked Review Ribbon expands above composer showing +68 lines EPIC-Draft             │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼ User Clicks Approve
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 9: Jira API Tool Execution & Live Telemetry                                      │
│ • Epic API Execution Agent calls jira_create_epic -> Live logs in Log Viewer (201)     │
│ • Staging tray smoothly dismisses (150ms ease-out)                                     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼ State Persistence
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 10, 11 & 12: Response Keeping, Downstream Chaining & Handoff                     │
│ • Response Keeper stores EPIC-104 in session state -> Live link in Editor [EPIC-104 ↗] │
│ • Chained generation: Create Features -> Create Stories -> Create Test Cases           │
│ • Task moved to Project folder; Governed undo via Confirm Undo Modal                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## STAGE 1: Discovery & Agent Activation (Zone 2: Agent Catalogue)

### 1.1 Landing on the Catalogue Grid
Every user session begins in **Zone 2: Agent Catalogue** (`.sutra-catalogue-container`), the discovery and orchestration launchpad for Sutra AI:
1. The **Primary Dock (Zone 1, 64px rail)** on the far left has the **Agent Catalogue** button highlighted as active.
2. The user sees the Catalogue Header: *"Discover and deploy specialized AI agents tailored for specific tasks."*
3. The user filters the marketplace by clicking the **Productivity** category pill in the toolbar (`.sutra-category-pill`).

### 1.2 The Business Analysis Agent Card Anatomy
Under the Productivity category, the user reviews the specialized card:
* **Icon Avatar:** High-contrast purple badge with a business analysis workflow glyph.
* **Agent Title:** Business Analysis
* **Specialization Descriptor:** *"Decomposes business requirements into formal Epics, Features, User Stories, and Acceptance Test Cases for Jira with Human-In-The-Loop validation."*
* **Metrics & Social Proof:** `4.9 ★` • `8.2k enterprise runs` • `Jira Certified`
* **Action Trigger:** The primary **`[Use Agent]`** button.

### 1.3 View Transition Mechanics (Zone 2 $\rightarrow$ Zone 3)
When the user clicks **`[Use Agent]`**:
1. Zone 2 (`.sutra-catalogue-container`) smoothly unmounts.
2. The Primary Dock (Zone 1) switches its active indicator to **Workspaces**.
3. **Zone 3: Agent Workspace** (`.sutra-workspace-view`, shell variant `sidebar-08`) mounts instantly, pre-configured with the Business Analysis Agent runtime and system prompts.

### 1.4 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> Enterprise users need distinct agents for distinct tasks (coding, code reviews, business analysis, infrastructure). Dumping a user directly into a blank workspace without context leads to ambiguity about what the agent can and cannot do.

> [!TIP]
> **Purpose:**  
> 1. Establish clear capability boundaries before the first keystroke.  
> 2. Present specialized metadata (e.g. Jira certification, HITL support) that builds user trust in the agent's domain authority.  
> 3. Provide a single-click transition from discovery to an active operational environment without multi-step wizard modals.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to use a dedicated Catalogue landing page rather than a dropdown in the chat header. The Catalogue gives the agent room for a detailed specialization descriptor, capability tags, and usage metrics. When clicked, it bypasses configuration wizards and loads the workspace immediately, deferring scope selection to natural, contextual UI elements in the workspace itself.

---

## STAGE 2: Entering Workspace Shell & Initial Dynamic Layout (Scenario C5)

### 2.1 The Cold-Start Cognitive Ergonomics Problem & Solution (75%/25% Split)

#### The Problem:
When the workspace first mounts, **no requirement specifications exist, no user stories have been drafted, and no Jira tickets are staged**.

Allocating 70% of the screen width to Column 2 (Tabs Canvas) on cold start creates a massive, vacuous, intimidating blank gray box. Worse, it squashes the conversation column into a cramped 30% sliver ($\approx 380\text{px}$), forcing the initial onboarding card, scope setup bar, suggestion chips, and prompt composer into a claustrophobic layout with heavy vertical scrolling.

#### The Sutra Solution (Scenario C5: Context Only):
In strict accordance with **Section 4 of `workspace_layout_specification.md`**, Sutra UI initializes in **Scenario C5 (Context Only)**:
* **Column 1 (`.s08-conversation-col`):** Takes **75% to 80% screen dominance** ($\approx 960\text{px}–1020\text{px}$).
* **Column 2 (`.s08-tabs-col`):** Takes **20% to 25% screen width** ($\approx 260\text{px}–320\text{px}$), hosting exclusively the **Agent Context Section** (`.s08-artifacts-view`) in its clean empty state.

```
┌─────────────────────────────────────────────────────────────────┬──────────────────┐
│ COLUMN 1: CONVERSATION (75%–80% Dominance)                      │ COLUMN 2 (20–25%)│
├─────────────────────────────────────────────────────────────────┼──────────────────┤
│                                                                 │ [Artifacts ×]    │
│   ┌──────┐   Business Analysis Agent                            ├──────────────────┤
│   │  BA  │   Productivity Specialist • Jira Enterprise          │ ┌──────────────┐ │
│   └──────┘   Scoped to: Acme Inc / Design Engineering           │ │  ☁️ Upload   │ │
│                                                                 │ │  Files...    │ │
│   Suggested Actions:                                            │ └──────────────┘ │
│   ┌─────────────────────────────────────────────────────────┐   │ [OneDrive]       │
│   │ 📋 Create an Epic                                       │   │ [Google Drive]   │
│   │    "I want to create an epic for Application Login..."  │   │                  │
│   └─────────────────────────────────────────────────────────┘   │ All | Up | Gen   │
│   ┌─────────────────────────────────────────────────────────┐   │                  │
│   │ 🔹 Create Features for an Epic                          │   │ (Empty State:    │
│   │    "Create features for epic id:IN-104..."              │   │  No artifacts    │
│   └─────────────────────────────────────────────────────────┘   │  yet)            │
│                                                                 │                  │
│ [Ask anything, @workspace to set team...]                 🎤[→] │                  │
└─────────────────────────────────────────────────────────────────┴──────────────────┘
```

### 2.2 Column 2 Content: Agent Context Section (`.s08-artifacts-view` Empty State)
Instead of rendering a code file tree (which is irrelevant for a Business Analyst), Column 2 displays the **Artifacts Section**:
1. **Dropzone Surface:** Clean dashed upload target: *"Drop PRD, BRD, or requirements files here (.pdf, .docx, .md, .txt)"*.
2. **Cloud Connectors:** Native one-click import buttons for corporate **OneDrive** and **Google Drive**.
3. **Artifact Filter Tabs:** `All (0)` | `Uploaded (0)` | `Generated (0)`.
4. **Empty State Graphic:** Subtle document icon with message: *"No artifacts attached yet. Files uploaded or deliverables generated will appear here."*

### 2.3 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> On launch, the user's primary mental task is **instructional and preparational**: understanding the agent's capabilities, selecting their organizational context, uploading reference documents, and framing their business requirements.

> [!TIP]
> **Purpose:**  
> 1. Maximize visual comfort during the typing and thinking phase by giving the prompt composer generous horizontal space ($\approx 960\text{px}$).  
> 2. Prevent the visual dead-weight of an empty 70% editor canvas.  
> 3. Provide an intuitive, non-distracting resting place for reference files in Column 2.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to use **Scenario C5** over a static 50/50 or 30/70 split. By treating layout as a living, dynamic property tied to agent phase, we eliminate dead screen real estate. The Artifacts section at 25% is wide enough to act as an upload target and show cloud drive buttons, while keeping 75% of the screen focused entirely on prompt preparation.

---

## STAGE 3: Scope Resolution & Cold-Start Guidance State

### 3.1 The Tri-Modal Scope Architecture (Sidebar, Inset Bar, Composer Mention)
Enterprise Agile organizations consist of nested hierarchies: **Workspaces** (e.g. `Acme Inc`) containing multiple **Work Areas** (e.g. `Design Engineering`, `Mobile Core`, `Billing Services`).

To provide effortless access for every type of user, Sutra UI provides **three synchronized entry points** that all bind to a single session state:

```
                      ┌───────────────────────────────────────┐
                      │     CENTRAL SESSION SCOPE STATE       │
                      │  workspace: "Acme Inc" (Enterprise)   │
                      │  workArea:  "Design Engineering"      │
                      └──────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
│ 1. SIDEBAR SWITCHER   │  │ 2. CONVERSATIONAL BAR     │  │ 3. COMPOSER @ GRAMMAR     │
│ (#s08-sidebar-ws-menu)│  │ (#s08-scope-setup-bar)    │  │ (Type @workspace in chat) │
│ • Persistent on rail  │  │ • Prominent in empty chat │  │ • Keyboard-first mention  │
│ • Global default for  │  │ • Disappears once chosen  │  │ • Formatted token pill    │
│   entire session      │  │ • Auto-reveals suggestions│  │ • One-off prompt override │
└───────────────────────┘  └───────────────────────────┘  └───────────────────────────┘
```

#### Bi-Directional State Synchronization Rules:
1. **Selected via Inset Scope Bar:** When the user selects `Acme Inc / Design Engineering` in `#s08-scope-setup-bar`, the Sidebar Workspace Switcher badge immediately updates to match, and the prompt composer registers the scope.
2. **Selected via Sidebar:** If the user previously set their scope in the Sidebar, `#s08-scope-setup-bar` detects this on mount and auto-collapses immediately.
3. **Overridden in Composer via `@workspace`:** If the user explicitly types `@workspace "Stark Industries / Core"`, the session state updates immediately, updating the Sidebar badge in real time.

### 3.2 Inset Scope Bar Dismissal Animation
When the user clicks the scope button in `#s08-scope-setup-bar`:
1. A 2-tier dropdown opens:
   * **Level 1 (Workspace):** `Acme Inc` (Enterprise)
   * **Level 2 (Work Area):** `Design Engineering`
2. Upon confirmation, the bar **smoothly animates closed**:
   ```css
   #s08-scope-setup-bar.is-resolved {
     max-height: 0;
     opacity: 0;
     margin-bottom: 0;
     padding: 0;
     pointer-events: none;
     transition: max-height 250ms cubic-bezier(0.4, 0, 0.2, 1),
                 opacity 200ms ease,
                 margin 250ms ease;
   }
   ```
3. Reclaiming this vertical space removes UI noise and shifts attention directly to the conversation river.

### 3.3 The Agent Guidance Card & Starter Suggestion Chips
Immediately as the scope bar collapses, an elegant onboarding card fades in:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│   ┌──────┐   Business Analysis Agent                                                  │
│   │  BA  │   Productivity Specialist • Jira Enterprise                                 │
│   └──────┘   Scoped to: Acme Inc / Design Engineering [Change]                         │
│                                                                                        │
│   I decompose business requirements into formal Epics, Features, User Stories, and    │
│   Acceptance Test Cases, synced directly to Jira with Human-In-The-Loop validation.   │
│                                                                                        │
│   Suggested Actions:                                                                   │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 📋 Create an Epic                                                              │   │
│   │    "I want to create an epic for Universal Application Login..."               │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 🔹 Create Features for an Epic                                                 │   │
│   │    "Create features for epic id:IN-104..."                                     │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 🔸 Generate User Stories                                                       │   │
│   │    "Create user stories for the feature id:FEAT-201..."                        │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 🧪 Generate Test Cases                                                         │   │
│   │    "Create test cases for user story id:US-301..."                             │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Interaction:** Clicking any card populates the prompt composer with pre-formatted syntax.
* **Stream Behavior:** Once the first prompt is submitted, this card scrolls naturally upward into the history stream, preserving conversation context without cluttering the screen.

### 3.4 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> In enterprise agile tools like Jira, tickets cannot exist without a parent Workspace and Work Area. Failing to establish this scope causes immediate downstream API failure.

> [!TIP]
> **Purpose:**  
> 1. Make scope selection visible and intuitive for first-time users without forcing them to hunt through navigation menus.  
> 2. Avoid clutter: once scope is resolved, hide the setup bar to maximize chat reading space.  
> 3. Provide immediate starter suggestions so the user doesn't face "blank canvas paralysis."

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to support **three synchronized access points** rather than forcing a single modal dialog. Power users hate modals that interrupt typing; casual users need prominent guidance bars; organizational admins prefer persistent sidebar rails. By synchronizing all three bi-directionally to a single session state, we satisfy all three personas without cognitive friction.

---

## STAGE 4: Prompt Composition & Resilient Input Normalization (3 Pathways)

Users interact with AI in different ways. Sutra UI provides **three resilient input pathways** that all normalize gracefully into the required Jira execution contract:

```
                                  USER SUBMITS PROMPT
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
   [ PATHWAY A ]                     [ PATHWAY B ]                     [ PATHWAY C ]
User types @workspace             User types plain text             User omits scope
Token Pill Formed                 without @                         entirely
         │                                 │                                 │
         ▼                                 ▼                                 ▼
Pill validates IDs                Parser extracts entities          Context buffered;
Direct Execution                  Auto-converts to Token Pill       Interactive Scoping Card
                                  Direct Execution                  renders with 1-click chips
```

---

### 4.1 Pathway A: Keyboard Power User (`@workspace` Mention & Token Pill)
1. In the composer (`.s08-chat-input-box`), the user types `@`.
2. A context popover appears:
   ```
   ┌──────────────────────────────────────────────────────────────┐
   │ Insert Context Mention                                       │
   ├──────────────────────────────────────────────────────────────┤
   │ @workspace      Set active Workspace & Work Area             │
   │ @file           Attach local PRD or specification document   │
   │ @onedrive       Import document from corporate OneDrive      │
   │ @googledrive    Import document from Google Drive            │
   │ @agent          Switch or delegate to another agent          │
   └──────────────────────────────────────────────────────────────┘
   ```
3. Selecting `@workspace` filters down to `Acme Inc / Design Engineering`.
4. It instantly transforms into an interactive, high-contrast **Token Pill**:
   ```
   ┌────────────────────────────────────────────────────────────────────────────────────────┐
   │ Create an epic for [@workspace: Acme Inc / Design Engineering ×] with Okta SSO and MFA │
   │                                                                                        │
   │ [+]  Business Analysis ^                                                         🎤 [→]│
   └────────────────────────────────────────────────────────────────────────────────────────┘
   ```
5. Clicking `×` removes the token pill and allows re-selection.

---

### 4.2 Pathway B: Plain English User (Scope Typed Without `@` Auto-Converted)
* **Prompt Submitted:**
  ```text
  "In workspace 'Acme Inc' and work area 'Design Engineering', I want to create an epic for Universal Application Login with Okta SSO, Biometric WebAuthn MFA, and OAuth2 token support."
  ```
* **System Normalization Behavior:**
  1. The system extracts `"Acme Inc"` $\rightarrow$ `WS-ACME-01` and `"Design Engineering"` $\rightarrow$ `WA-DE-04`.
  2. The input is accepted immediately without warning or re-prompting.
  3. In the chat stream, Sutra UI **visibly normalizes the user's message bubble**, converting the raw text into the official token pill:
     ```
     ┌────────────────────────────────────────────────────────────────────────────────────┐
     │ User:                                                                              │
     │ In [@workspace: Acme Inc / Design Engineering] I want to create an epic for        │
     │ Universal Application Login with Okta SSO, Biometric WebAuthn MFA, and OAuth2...   │
     └────────────────────────────────────────────────────────────────────────────────────┘
     ```
  4. The Sidebar updates its badge, `#s08-scope-setup-bar` collapses, and generation launches directly.

---

### 4.3 Pathway C: Omitted Scope User (Zero-Error Conversational Resolution Card)
* **Prompt Submitted:**
  ```text
  "I want to create an epic for Universal Application Login with Okta SSO, Biometric WebAuthn MFA, and OAuth2 token support."
  ```
* **System Guidance Behavior:**
  1. The system **buffers the requirement prompt in session state**.
  2. **No error toast or red alert is shown.** Instead, the agent replies with an **Interactive Scope Resolution Card**:
     ```
     ┌────────────────────────────────────────────────────────────────────────────────────────┐
     │ 🏢 Select Target Jira Workspace & Work Area                                           │
     │                                                                                        │
     │ I have prepared your Epic for "Universal Application Login". Before we commit it to    │
     │ Jira, please select which Workspace and Work Area this belongs to:                    │
     │                                                                                        │
     │ Click a recent workspace to proceed:                                                   │
     │ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
     │ │ 🏢 @workspace: Acme Inc / Design Engineering (Recommended)                         │ │
     │ └────────────────────────────────────────────────────────────────────────────────────┘ │
     │ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
     │ │ 🏢 @workspace: Acme Inc / Sales & Marketing                                        │ │
     │ └────────────────────────────────────────────────────────────────────────────────────┘ │
     │ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
     │ │ 🏢 @workspace: Stark Industries / Core Infrastructure                              │ │
     │ └────────────────────────────────────────────────────────────────────────────────────┘ │
     │                                                                                        │
     │ 💡 Tip: You can also reply below using "@" to search any workspace:                   │
     │    e.g. "@workspace Acme Inc / Design Engineering"                                     │
     └────────────────────────────────────────────────────────────────────────────────────────┘
     ```
  3. **Zero-Retyping Execution:** Clicking any chip immediately binds the scope, updates the Sidebar, and **automatically resumes the buffered Epic generation without the user having to retype their prompt**.

---

### 4.4 PRD & Specification Attachment (Local Drag-and-Drop & Cloud Drives)
Alongside the prompt, the user attaches `PRD_App_Login_v2.pdf`:
* By dropping the file directly into the Column 2 **Artifacts Section** dropzone, OR
* By clicking the **OneDrive** or **Google Drive** buttons in Column 2 to authenticate and pick the document from cloud storage, OR
* By clicking the composer **`[+]`** attachment button.

### 4.5 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> Natural human language is messy. Some users love `@` shortcuts; others write complete English sentences; others dive straight into their task and forget organizational metadata.

> [!TIP]
> **Purpose:**  
> 1. Eliminate syntax barriers: Never fail a prompt because the user omitted an `@` character.  
> 2. Eliminate user frustration: Never show a blocking red error alert that demands the user re-type their entire prompt from scratch.  
> 3. Provide continuous reinforcement: Visibly converting raw text into token pills gently educates the user on the system's preferred mental model without scolding them.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to implement **Pathway C's buffered state machine** rather than traditional form validation. In traditional apps, omitting a field wipes or blocks the form. By buffering the requirement in memory and offering 1-click interactive resolution cards, the user is never penalized for incomplete input.

---

## STAGE 5: Orchestration Cognition (Supervisor Agent & Rule Node Routing)

### 5.1 Ingestion Envelope & Tool Call Telemetry via shadcn `<Trace>`
When the normalized prompt is submitted, the **Supervisor Agent** ingests the payload and initializes execution. In Column 1, rather than rendering an ad-hoc console or raw text, Sutra UI mounts the **shadcn/ui `<Trace>`** primitive to visualize agent processing:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ div.s08-trace-tree (shadcn/ui <Trace> Component in Column 1)                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ <Trace>                                                                                │
│   <TraceLine status="completed">                                                       │
│     ✓ [Read]  PRD_App_Login_v2.pdf (18 pages, 42KB)                         [182ms]    │
│   </TraceLine>                                                                         │
│   <TraceLine status="completed">                                                       │
│     ✓ [Context] TimeContext: 2026-10-25T21:41:24+05:30 (Q4 Active Sprint Horizon)      │
│   </TraceLine>                                                                         │
│   <TraceCollapsible defaultOpen={false}>                                               │
│     <TraceCollapsibleTrigger>                                                          │
│       <TraceLine status="completed">                                                   │
│         ✓ [Route] Rule Node: Intent "create an epic" -> Routed to EpicGen   [Details v] │
│       </TraceLine>                                                                     │
│     </TraceCollapsibleTrigger>                                                         │
│     <TraceCollapsibleContent>                                                          │
│       Rule evaluated: Keyword "create an epic" matched rule R-01 (Priority: P1)        │
│       Target specialization: Epic Generation Agent (Jira Certified)                    │
│       Execution context: Acme Inc / Design Engineering (Bound from session)           │
│     </TraceCollapsibleContent>                                                         │
│   </TraceCollapsible>                                                                  │
│ </Trace>                                                                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Intent Classification & Specialized Agent Delegation
The Supervisor evaluates the intent against its Rule Node matrix:
* **Rule Node Evaluation:** Analyzes prompt semantics $\longrightarrow$ intent `"create an epic"` detected with $99.4\%$ confidence.
* **Scope Binding:** Confirms session tokens `Acme Inc` $\rightarrow$ `WS-ACME-01` and `Design Engineering` $\rightarrow$ `WA-DE-04`.
* **Delegation:** Hands off execution to the specialized **Epic Generation Agent**, logging a completed trace node in the tree.

### 5.3 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> Large monolithic LLM prompts try to do everything (parsing, business logic, Jira formatting, API calls) and frequently hallucinate or drop requirements.

> [!TIP]
> **Purpose:**  
> 1. **Unified Visual Language:** Standardizes all agent background work (file reading, clock resolution, routing) into consistent single-line trace items rather than noisy chat dumps.  
> 2. **Ambient Transparency:** Users see exactly which files were read and which rule nodes fired, without being overwhelmed by raw JSON logs.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to use **shadcn/ui `<Trace>`** (`TraceLine`, `TraceIcon`, `TraceTitle`, `TraceCollapsible`) instead of plain text terminal logs. `Trace` provides standardized heights, semantic status glyphs (`running`, `completed`), and smooth collapsible accordions, maintaining a tranquil, high-polish UI in Column 1.

---

## STAGE 6: Handling Missing Information (Adaptive Multi-Step Questionnaire in Composer)

### 6.1 Ambiguity Detection & In-Place Composer Morphing (`div#s08-chat-input-box`)
During PRD ingestion, the Epic Generation Agent identifies multiple unstated requirement dimensions:
1. **Target Release Milestone** (Unspecified delivery horizon).
2. **Prioritized Authentication Mechanisms** (PRD mentions multiple protocols without precedence).
3. **Primary Target User Persona** (Internal enterprise staff vs. external B2B partner users).

Rather than rendering an in-stream card that pushes the chat view or disrupts the user's focal point, **the existing chat input box (`div#s08-chat-input-box`) dynamically morphs in-place into an Interactive Multi-Step Questionnaire Card**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ div#s08-chat-input-box.is-questionnaire-mode (Morphed in-place at bottom of Column 1)   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Question 2 of 3                                                                        │
│                                                                                        │
│ What should every progress update include?                                             │
│ Select all that apply, or skip this question.                                          │
│                                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [✓]  Progress                                                                  [A] │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [✓]  Decisions                                                                 [B] │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [ ]  Risks                                                                     [C] │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [ ]  Next step                                                                 [D] │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│ [Previous]                                                            [Skip]  [Next]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Component Design & Shadcn/ui Aesthetic Specification
Designed in strict adherence to the [shadcn/ui questionnaire primitive](https://ui.shadcn.com/docs/components/base/questionnaire) and styled with Sutra design tokens:

1. **Card Container (`#s08-chat-input-box.is-questionnaire-mode`):**
   * **Background:** `var(--surface-card, #ffffff)` in light theme / `var(--surface-elevated, #18181b)` in Obsidian Dark.
   * **Border & Elevation:** `1px solid var(--border-subtle, #e4e4e7)` with high-contrast subtle focus ring `box-shadow: 0 0 0 1px var(--brand-primary), 0 12px 30px -4px rgba(0, 0, 0, 0.08)`.
   * **Border Radius:** `16px` curvature matching Sutra's unified card tokens.
   * **Dynamic Height:** Transitions fluidly from standard composer height ($56\text{px}$) to questionnaire height ($\approx 320\text{px}–360\text{px}$) using `cubic-bezier(0.16, 1, 0.3, 1)` over $250\text{ms}$.

2. **Step Tracker & Header:**
   * **Step Indicator:** `Question X of Y` (e.g. `Question 2 of 3`) rendered in `text-xs font-medium text-[var(--text-secondary)]`.
   * **Question Heading:** Bold, high-contrast title (`text-base font-semibold text-[var(--text-primary)] tracking-tight`).
   * **Instruction Subtitle:** Muted helper text (`text-xs text-[var(--text-secondary)]`), indicating selection mode: *"Select one option"* or *"Select all that apply, or skip this question."*

3. **Option Tiles with Keyboard Shortcut Badges (`.s08-question-option-tile`):**
   * **Container:** Flex container with rounded border (`border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; cursor: pointer; transition: all 150ms ease;`).
   * **Left Glyph:**
     * **Multi-Select:** Checkbox icon (`[✓]` when checked, `[ ]` when unchecked).
     * **Single-Select:** Radio circle icon (`(●)` when selected, `( )` when unselected).
   * **Label:** Medium weight text (`text-sm font-medium text-[var(--text-primary)]`).
   * **Right Keyboard Badge:** Subtle rounded keycap pill (`border: 1px solid var(--border-subtle); background: var(--surface-base); color: var(--text-secondary); font-size: 11px; padding: 2px 7px; border-radius: 6px;`).
     * **Keyboard Activation:** Typing `A`, `B`, `C`, or `D` on the keyboard instantly toggles that option!
   * **Selected State Styling:**
     * `border-color: var(--brand-primary, #6366f1);`
     * `background: var(--brand-surface-subtle, #f5f3ff);` (Dark mode: `rgba(99, 102, 241, 0.12);`)

4. **Navigation Footer:**
   * **Flex Layout:** `display: flex; justify-content: space-between; align-items: center; padding-top: 12px; margin-top: 8px; border-top: 1px solid var(--border-subtle);`.
   * **Left Action:**
     * **`[Previous]` Button:** Ghost outline button (`border: 1px solid var(--border-subtle); border-radius: 8px; padding: 6px 14px; font-size: 12px; font-medium;`). Disabled on Question 1.
   * **Right Action Cluster:**
     * **`[Skip]` Button:** Secondary ghost button (`border: 1px solid transparent; color: var(--text-secondary); hover:text-[var(--text-primary)]; padding: 6px 14px; font-size: 12px;`). Keyboard shortcut: `Esc` or `S`.
     * **`[Next]` / `[Submit]` Button:** High-contrast solid pill button (`background: var(--brand-primary, #09090b); color: #ffffff; border-radius: 8px; padding: 6px 18px; font-size: 12px; font-semibold; shadow-sm;`). On the final question, the label automatically changes from `[Next]` to `[Submit Decision ⏎]`. Keyboard shortcut: `Enter`.

---

### 6.3 Multi-Question Sequential Workflow (Max 3–4 Questions)

The Business Analysis Agent bounds its interactive questionnaire to **maximum 3 to 4 essential questions** to prevent survey fatigue:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        3-STEP QUESTIONNAIRE SEQUENCE                                   │
│                                                                                        │
│ [Question 1 of 3: Single-Select]                                                       │
│ Which delivery milestone should this Epic target?                                      │
│ • (●) Q4 2026 Enterprise Core Release [Recommended]                               [A]  │
│ • ( ) Q1 2027 Mobile & Identity Wave                                              [B]  │
│ • ( ) Unscheduled Product Backlog                                                 [C]  │
│ Navigation: [Previous (Disabled)]                              [Skip]  [Next]          │
│                                                                                        │
│                                           ▼ (User clicks [Next] or presses Enter)      │
│ [Question 2 of 3: Multi-Select]                                                        │
│ What authentication protocols should be prioritized?                                   │
│ Select all that apply, or skip this question.                                          │
│ • [✓] Federated Okta SSO (SAML 2.0 / OIDC)                                        [A]  │
│ • [✓] Biometric WebAuthn / FIDO2 MFA                                              [B]  │
│ • [✓] OAuth2 Token Revocation & Introspection                                     [C]  │
│ • [ ] Legacy LDAP Directory Sync                                                  [D]  │
│ Navigation: [Previous]                                         [Skip]  [Next]          │
│                                                                                        │
│                                           ▼ (User clicks [Next] or presses Enter)      │
│ [Question 3 of 3: Single-Select]                                                       │
│ Who is the primary target persona for this Epic?                                       │
│ • (●) Enterprise Internal Employees (Default)                                     [A]  │
│ • ( ) External B2B Partner Integrators                                            [B]  │
│ • ( ) Multi-Tenant SaaS Public Users                                              [C]  │
│ Navigation: [Previous]                                         [Skip]  [Submit ⏎]      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.4 The `[Skip]` Action & Autonomous Fallback Defaults

> [!IMPORTANT]
> **The `[Skip]` Guarantee:**  
> The user is **never trapped or forced** to answer any question. If the user doesn't know the exact release date or protocol priority, they click `[Skip]` (or press `S`).

* **Autonomous Default Resolution:** When a question is skipped, the Agent does not break or crash. Instead, it injects an **intelligent, production-grade domain default**:
  * If Question 1 (Milestone) is skipped $\longrightarrow$ Applies `Q4 2026 Core Release (Current Active Sprint Horizon)`.
  * If Question 2 (Protocols) is skipped $\longrightarrow$ Applies `All PRD-specified standards (SAML, WebAuthn, OAuth2)`.
  * If Question 3 (Persona) is skipped $\longrightarrow$ Applies `Enterprise Internal Staff (Default Corporate Scope)`.

---

### 6.5 Reverse Morphing & The Conversation Stream Audit Trail

When the user clicks `[Submit Decision ⏎]` on Question 3 (or skips the questionnaire):

1. **In-Place Reverse Morphing (200ms ease-out):**
   * `#s08-chat-input-box` smoothly collapses from $340\text{px}$ back to its standard composer height ($56\text{px}$).
   * The questionnaire tiles fade out (`opacity: 0; transform: translateY(4px);`), and the standard prompt textarea, attachment button (`[+]`), and microphone icon return to idle state.
   * Focus is returned to the composer, ready for subsequent commands.

2. **The Dual-Lifecycle Stream Audit Trail:**
   To guarantee permanent transcript auditability, a sealed **Decision Record Capsule** is simultaneously pushed into the chat river in Column 1:
   ```
   ┌────────────────────────────────────────────────────────────────────────────────────┐
   │ ❓ Clarification Completed (3 Dimensions Resolved)                                 │
   │                                                                                    │
   │ ✓ 1. Target Milestone:    Q4 2026 Enterprise Core Release                          │
   │ ✓ 2. Auth Protocols:      Okta SAML, Biometric WebAuthn, OAuth2 Token Sync        │
   │ ✓ 3. Target Persona:      Enterprise Internal Employees (Default Applied via Skip) │
   └────────────────────────────────────────────────────────────────────────────────────┘
   ```
3. **Execution Resumption:** The Epic Generation Agent receives the resolved parameters and immediately transitions into **Stage 7 (Autonomous Generation)**.

---

### 6.6 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> Business requirements in PRDs are almost always ambiguous or incomplete in secondary dimensions (milestones, exact protocol scope, persona prioritization). Asking questions via free-form text input creates messy conversational banter and slows down delivery.

> [!TIP]
> **Purpose:**  
> 1. **Zero Spatial Travel (Fitts's Law):** By morphing `#s08-chat-input-box`, user input happens right where their hands and cursor already rest.  
> 2. **Modal Prevention of Incoherent Prompts:** While the agent is paused on clarification, replacing the free-form text box prevents the user from typing unrelated commands that could desynchronize agent state.  
> 3. **High Velocity:** Keycap shortcuts (`A`, `B`, `C`, `D`, `Enter`, `Esc`/`S`) allow power users to answer a 3-question survey in under 3 seconds without touching the mouse.  
> 4. **No Dead-Ends:** The explicit `[Skip]` action ensures that non-technical users or users in a hurry are never blocked.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to use **in-place input box morphing** coupled with a **stream audit capsule**. Morphing alone would lose historical context once the input box resets; an in-stream card alone forces awkward cursor scrolling in the chat river. Combining the two gives flawless spatial ergonomics at the bottom and permanent governance in the history stream.

---

## STAGE 7: Autonomous Generation & Dynamic Deliverable Expansion (Scenario C2/C1)

### 7.1 The Dynamic Splitter Transition (Chat 30% / Deliverable 70%)

#### Context & Purpose:
The moment generation begins, the user's primary cognitive job **flips from writing instructions to reviewing deliverables**. 

Reading a 100-line formal Agile specification with Gherkin acceptance criteria inside a 300px chat bubble is an awful user experience that causes visual fatigue. The deliverable belongs in the primary canvas.

#### Design Decision & Transition Mechanics:
1. **Trigger:** The agent emits the first markdown stream tokens for `EPIC_Universal_Login_Draft.md` and mounts the **Editor / Stage Tab** (`.s08-view-editor`) in Column 2.
2. **Fluid Splitter Animation:**
   * Sutra UI smoothly transitions from **Scenario C5 (75%/25%)** to **Scenario C2 / C4 (Deliverable Dominance: 30% Chat / 70% Tabs Canvas)**.
   * CSS transition: `transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);`.
   * **Column 1 (`.s08-conversation-col`):** Compresses gracefully to **30%** ($\approx 380\text{px}–420\text{px}$).
   * **Column 2 (`.s08-tabs-col`):** Expands to **70%** ($\approx 880\text{px}–940\text{px}$).
3. **Ambient Peripheral Signal:** The visual widening of the canvas serves as a natural, ambient announcement: *"Your specification deliverable is materializing and ready for inspection."*

```
┌───────────────────────────┬────────────────────────────────────────────────────────┐
│ COLUMN 1: CHAT (30% / 25%)│ COLUMN 2: TABS CANVAS (70% / 75% Dominance)            │
├───────────────────────────┼────────────────────────────────────────────────────────┤
│ ✓ Read PRD_App_Login.pdf  │ [Artifacts]  [Editor: EPIC_Universal_Login.md ×]       │
│ [~] Generating Epic...    ├────────────────────────────────────────────────────────┤
│                           │ # Epic: Universal Application Login                    │
│ [HITL Review Required]    │ **Status**: Staged for Review                          │
│                           │                                                        │
│ [Request Edits]           │ ## Acceptance Criteria (Gherkin Scenarios)             │
│ [Approve in Jira ▼]       │ - Scenario 1: SSO Redirect to Okta                     │
│                           │   Given a corporate user...                            │
│                           │                                                        │
│ [Meso Staging Dock]       │ [Preview/Raw]  [Download Deliverable]  [SVG Diagram]   │
└───────────────────────────┴────────────────────────────────────────────────────────┘
```

### 7.2 Dual-Surface Artifact Projection & Stage Features

#### Column 1: Conversation Section (30% width)
Agent processing in Column 1 is rendered via the unified **shadcn/ui `<Trace>`** tree:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ div.s08-trace-tree (Live Agent Generation Trace in Column 1)                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ <Trace>                                                                                │
│   <TraceCollapsible defaultOpen={false}>                                               │
│     <TraceCollapsibleTrigger>                                                          │
│       <TraceLine status="completed">                                                   │
│         ✓ 🧠 Thinking (3.2s)                                              [Details ▾] │
│       </TraceLine>                                                                     │
│     </TraceCollapsibleTrigger>                                                         │
│     <TraceCollapsibleContent className="font-mono text-xs text-muted">                 │
│       Analyzing authentication flows from PRD... Identified 3 core feature boundaries: │
│       1. Okta SAML 2.0 redirect  2. WebAuthn biometric MFA  3. OAuth2 token standards   │
│     </TraceCollapsibleContent>                                                         │
│   </TraceCollapsible>                                                                  │
│                                                                                        │
│   <TraceLine status="completed">                                                       │
│     ✓ [Read] Parse functional requirements from PRD_App_Login_v2.pdf                   │
│   </TraceLine>                                                                         │
│   <TraceLine status="completed">                                                       │
│     ✓ [Plan] Define Epic business value and target persona                             │
│   </TraceLine>                                                                         │
│   <TraceLine status="running">                                                         │
│     ▶ [Generate] Generating Gherkin acceptance criteria (Streaming to Canvas...)       │
│   </TraceLine>                                                                         │
│   <TraceLine status="pending">                                                         │
│     • [Pending] Identify child feature boundaries (SSO, MFA, OAuth2)                   │
│   </TraceLine>                                                                         │
│ </Trace>                                                                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Reasoning Trace Line:** Collapsible thinking process. Emits streaming thought tokens with an active shimmer, then auto-folds once generation begins.
* **Plan & Task Lines:** Tracks active generation progress across sub-deliverables. Status shimmers indicate active generation while pending steps remain dimmed.

#### Column 2: Tabs Canvas (70% width, Multi-Pane Layout T1)
* **Left Sub-Pane (`.s08-artifacts-view`, 28% internal width):**
  * Displays the **Artifacts Manager**:
    * Under **`Uploaded`**: `PRD_App_Login_v2.pdf` (with cloud badge).
    * Under **`Generated`**: `EPIC_Universal_Login_Draft.md` (pulsing blue badge: `Draft`).
* **Right Sub-Pane (`.s08-view-editor`, 72% internal width):**
  * Displays the living specification in **Markdown Preview** mode:
    ```markdown
    # Epic: Universal Application Login
    **Status**: Staged for Review  |  **Target**: Acme Inc / Design Engineering
    **Release**: Q4 2026 Enterprise Core Release

    ## Business Objective
    Enable zero-friction, enterprise-grade authentication supporting federated SSO,
    biometrics, and modern token standards.

    ## Acceptance Criteria (Given / When / Then)
    - Scenario 1: Enterprise SSO Redirect
      Given a user with a corporate email domain
      When they initiate login
      Then route authentication to Okta IdP via SAML 2.0...
    ```
  * **Deliverable Utilities & Inline Commenting:** Includes **Preview/Raw Toggle**, **Download Deliverable (.md / .docx)**, **View Architecture Diagram (SVG)**, and full **Inline Commenting**:
    * **Text Selection Trigger:** Highlighting any sentence or Gherkin clause in the editor reveals the floating blue comment trigger (`[+💬]`, `Ctrl+Alt+M`).
    * **Inline Composer:** Clicking opens the anchored comment composer with voice dictation (`🎤`) and `[Add Comment]`.
    * **Right Margin Rail:** Persistent numbered comment cards (`1`, `2`, `3`) dock in the editor's right gutter with `Edit (✎)` and `Delete (🗑)` controls.

### 7.3 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> Generative AI outputs in business analysis are long, structured documents (often 100–300 lines) with headers, lists, and Gherkin scenarios.

> [!TIP]
> **Purpose:**  
> 1. Treat deliverables as first-class workspace citizens, not ephemeral chat bubbles.  
> 2. Ensure reading comfort by providing full desktop width for the document editor.  
> 3. Enable granular, line-level critique on requirements rather than vague chat instructions.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to use **dynamic layout morphing (Scenario C5 $\rightarrow$ Scenario C2)** coupled with **Google Docs-style inline commenting in the editor margin**. This ensures that reviewers can annotate specific acceptance criteria without leaving the document, while preserving the chat stream at 30% for high-level orchestration.

---

## STAGE 8: Human-In-The-Loop (HITL) Validation & Docked Staging

Autonomous generation halts at the mandatory **HITL Validation Node**. Before any byte is transmitted to Jira, human authorization is required across two synchronized surfaces:

### 8.1 In-Stream Tool Approval Card (Column 1)
Adopting the standardized [assistant-ui Approval Card](https://www.assistant-ui.com/elements/approval-card) primitive, the agent halts and renders an interactive permission card in Column 1:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ div.s08-approval-card (In-Stream HITL Execution Gate)                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│   ┌────────┐   Create Epic in Jira                                                     │
│   │ [Jira] │   The agent wants to create an Epic entity in Acme Inc / Design Eng       │
│   └────────┘                                                                           │
│                                                                                        │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   │ POST /api/v2/workspaces/AcmeInc/epics                                            │ │
│   │ {"title":"Universal Application Login","release":"Q4 2026 Core Release"}  [Copy] │ │
│   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│   [Review: 2 inline annotations attached in Editor]                                    │
│                                                                                        │
│                                           Deny    Always allow in session   [Allow once]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Component Anatomy & Feature Breakdown:
1. **Tool Icon Squircle:** Dedicated tool glyph container (`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center`). Displays enterprise Jira entity icon badge.
2. **Action Header:** Bold title (`Create Epic in Jira`) paired with a descriptive subtitle outlining the target scope (`Acme Inc / Design Engineering`).
3. **Monospaced Payload Container:** Displays the exact HTTP REST endpoint and JSON payload being submitted to the enterprise instance. Includes a 1-click **Copy Payload** utility and schema expansion toggle.
4. **Inline Annotation Badge:** If the user added inline comments in the Editor during Stage 7, a clickable badge (`2 inline annotations attached`) indicates that feedback is queued.
5. **The Triad Action Set:**
   * **`Deny` / `Request Edits`** (Ghost text button): Halts execution. If inline comments exist, passes them to the agent for automated revision.
   * **`Always allow in session`** (Ghost text button): Authorizes `jira_create_*` for the remainder of the session, completely solving **"approval fatigue"** when decomposing child Features and Stories in Stage 11!
   * **`Allow once`** (High-contrast solid pill button): Grants one-time execution permission for this exact Epic ticket. Keyboard shortcut: `Enter`.

### 8.2 Meso Staging Dock (Docked Review Ribbon Above Composer)
Directly above the input box, the staging dock expands into **State B (Staging Tray)**:
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Draft] +68 lines  EPIC-Draft  Acme Inc / Universal Application Login  │
├────────────────────────────────────────────────────────────────────────┤
│ [Back] [Doc] 1 Jira Entity Staged            Reject  [Approve & Create]│
└────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Decision Branching: Iterative Feedback Loop vs. Approval

* **Branch A (Request Edits via Inline Comments or Chat):**
  1. The user reviews the Markdown deliverable in Column 2.
  2. Uses the **Inline Commenting System**:
     * Highlights line 44: *"Then route authentication to Okta IdP via SAML 2.0..."*
     * Clicks the **Add Comment** icon (or presses `Ctrl+Alt+M`) and writes: *"Ensure session timeout is explicitly set to 15 minutes of inactivity across all client apps."*
     * Submits comment card `1` into the editor's right margin.
  3. The user clicks **`[Request Edits]`** on the HITL Gate Card.
  4. The Supervisor automatically ingests the line-anchored comments as a structured revision prompt:
     ```json
     {
       "action": "revise_specification",
       "targetFile": "EPIC_Universal_Login_Draft.md",
       "inlineComments": [
         {
           "threadId": 1,
           "anchorText": "Then route authentication to Okta IdP via SAML 2.0",
           "comment": "Ensure session timeout is explicitly set to 15 minutes of inactivity across all client apps."
         }
       ]
     }
     ```
  5. The `EpicGen` agent edits the draft in-place in the Editor canvas, auto-resolves the inline comment card, updates the staging dock diff, and re-triggers the HITL Gate.

* **Branch B (Approval):**
  1. The user verifies all criteria and clicks `[Approve & Create in Jira ▼]`.
  2. The gate unlocks and triggers the execution stage.

### 8.4 Context, Purpose & Design Rationale: Defending the Dual-Surface Architecture

> [!NOTE]
> **Context:**  
> In enterprise engineering, injecting unvetted AI output directly into production issue trackers pollutes backlogs, triggers automated notifications to engineers, and causes costly governance cleanup. Review must be unambiguous, auditable, and ergonomically effortless.

> [!TIP]
> **Purpose:**  
> 1. **Enforce strict human accountability** before remote API state mutation.  
> 2. **Provide dual inspection:** Expose both the technical API payload (`POST /epics`) and the physical document footprint (`+68 lines`).  
> 3. **Eliminate approval friction:** Prevent scroll-hunting while ensuring permanent audit history in the chat transcript.

#### Deep-Dive Justification: Why Approval & Review Exist in Two Places

When stakeholders question why review and approval appear both in the **In-Stream Approval Card (8.1)** and the **Docked Staging Ribbon (8.2)**, the decision is grounded in four foundational Human-Computer Interaction (HCI) and enterprise governance principles:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ THE DUAL-SURFACE GOVERNANCE MODEL                                                      │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ 1. IN-STREAM APPROVAL CARD (8.1)          │ 2. DOCKED STAGING RIBBON (8.2)             │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Focus: System Security & Tool Intent    │ • Focus: Deliverable Quality & Diff Size   │
│ • Question: "What API is about to run?"   │ • Question: "What exact files are staged?" │
│ • Role: Permanent Transcript Audit Trail  │ • Role: Transient Operational Lever        │
│ • Anchoring: In conversation history      │ • Anchoring: Pinned above keyboard/hands   │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

##### 1. Separation of Concerns: Action Security vs. Content Footprint
* The **In-Stream Approval Card (8.1)** represents the **System Action Layer**: It authorizes the tool execution (`jira_create_epic`), inspects the REST endpoint (`POST /api/v2/...`), and allows session-level permission scoping (`Always allow in session`).
* The **Docked Staging Ribbon (8.2)** represents the **Content Artifact Layer**: It visualizes the staged entity count (`1 Jira Entity Staged`) and exact line additions (`+68 lines EPIC-Draft`).
* Combining both into a single chat bubble would create a bloated, unreadable card; putting both into a bottom ribbon would hide technical API telemetry. Separating them provides clarity at each level.

##### 2. Viewport Geometry & Fitts's Law (Scroll Resilience)
* **The Chat Stream Vulnerability:** In active agent sessions, the conversation stream scrolls continuously as reasoning tokens, activity tickers, and sub-steps stream in. If an approval prompt lives *only* in the chat stream, **it scrolls off-screen**. A user reading the living specification in Column 2 would be forced to scroll through the chat river just to locate the approve button.
* **The Docked Operating Deck:** The Meso Staging Ribbon is **permanently docked directly above the prompt composer**. Regardless of whether the user is scrolled to the top of chat, reviewing previous turns, or inspecting the editor canvas, the pending approval is always visible in their primary focal zone—zero scrolling required.

##### 3. Permanent Audit Trail vs. Transient Operational Lever
* **Audit Trail (In-Stream):** The In-Stream card remains in the chat river forever as an auditable receipt (`✓ Approved by User at 21:41:24`). When compliance teams or auditors review the session later, the exact payload and user decision are immutably preserved in the transcript.
* **Operational Lever (Docked Ribbon):** The Staging Ribbon is strictly transient. It mounts only when uncommitted changes are staged and dismisses smoothly the instant execution begins.

##### 4. Single State Machine (Zero Redundancy / No Double-Work)
* A common critique of multi-surface UI is "double work" (having to approve twice).
* In Sutra UI, both surfaces are **synchronized projections of a single underlying state machine** (`session.stagedEntities[0]`):
  * Clicking `[Allow once]` in the chat card instantly dismisses the docked ribbon and fires the API call.
  * Clicking `[Approve & Create]` in the docked ribbon instantly marks the chat card as `✓ Approved` and fires the API call.
  * The user acts on whichever surface is closest to their cursor or hands at that moment.

##### 5. Proven Enterprise Industry Precedents
* **GitHub Pull Requests:** Shows the approval checkpoint both in the chronological review timeline (for history) AND in the sticky bottom merge bar (for immediate execution).
* **Cursor / Windsurf / VS Code:** When an AI agent edits files, Cursor displays the change in two places: inside the chat stream (`Accept` / `Reject`) AND docked in the editor canvas tab (`Accept All` / `Discard`).
* Users' attention shifts dynamically between the reading surface and the typing surface; providing dual synchronized touchpoints eliminates cognitive friction.

---

## STAGE 9: Jira API Tool Execution & Live Telemetry

### 9.1 Tool Invocation (`jira_create_epic`) & Parameter Binding
Upon user approval, control passes to the **Epic API Execution Agent**:
```json
{
  "toolName": "jira_create_epic",
  "parameters": {
    "workspaceName": "Acme Inc",
    "workAreaName": "Design Engineering",
    "title": "Universal Application Login",
    "description": "Enterprise authentication supporting SAML, WebAuthn, OAuth2",
    "priority": "High",
    "targetRelease": "Q4 2026 Enterprise Core Release"
  }
}
```

### 9.2 Dynamic Layout Transition to Log Viewer (Layout T6 / T8)
To show live API execution without hiding the deliverable:
* Sutra UI splits Column 2 vertically into **Layout T6 (Reader & Logs)**:
  * **Top Pane (65% height):** Living Markdown Deliverable (`.s08-view-editor`).
  * **Bottom Pane (35% height):** Real-time Log Viewer (`.s08-view-log-viewer`).
* (Optional): In 3-Pane Studio mode (Layout T8), Column 1 scales to 25%, giving Column 2 75% width.

### 9.3 Real-Time Execution Telemetry (Trace in Column 1 & Log Viewer in Column 2)

As the API call executes, telemetry updates simultaneously across both surfaces:

1. **In Column 1 (`.s08-conversation-col`):**
   The in-stream approval card cleanly settles into a completed **`<TraceLine>`** item in the session trace:
   ```
   <TraceLine status="completed">
     ✓ [Tool] Created Epic EPIC-104 in Jira [IN-104]                           (142ms)
   </TraceLine>
   ```

2. **In Column 2 (`.s08-view-log-viewer`, Bottom Pane):**
   Real-time HTTP events stream via typed Server-Sent Events (SSE):
   ```bash
   [21:41:25] INFO  Invoking tool: jira_create_epic...
   [21:41:26] SCOPE Target verified: Acme Inc / Design Engineering
   [21:41:27] POST  https://jira.enterprise.internal/api/v2/workspaces/AcmeInc/epics
   [21:41:27] STATUS 201 Created (142ms)
   [21:41:27] RESPONSE {"id": "IN-104", "key": "EPIC-104", "status": "Defined"}
   [21:41:28] SUCCESS Epic EPIC-104 committed to Jira.
   ```
* **Staging Dock Dismissal:** The docked staging ribbon above the composer smoothly dismisses (`150ms ease-out`), returning to idle state.

### 9.4 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> External API calls to enterprise platforms can fail (e.g. rate limits, 401 token expirations, 422 schema validation errors). Users feel anxious when an app shows a generic spinning circle.

> [!TIP]
> **Purpose:**  
> 1. Provide absolute proof of execution: Show actual HTTP 201 Created status and assigned Jira keys in real time.  
> 2. Build developer and analyst trust by treating API calls with the seriousness of a deployment pipeline.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to mount the **Log Viewer (`.s08-view-log-viewer`)** directly beneath the Editor rather than showing logs in the chat. Chat is for conversational cognition; the Log Viewer is for structured, monospaced network telemetry with timestamps and syntax highlighting.

---

## STAGE 10: State Persistence & Response Keeping

### 10.1 Response Keeping Agent State Registration
Immediately following successful Jira creation, the **Response Keeping Agent** executes:
1. Registers persistent session state variables:
   * `last_created_artifact_type = "epic"`
   * `last_created_epic_id = "IN-104"`
   * `last_created_epic_key = "EPIC-104"`
   * `last_created_workspace = "Acme Inc"`
   * `last_created_work_area = "Design Engineering"`
2. Writes an auditable checkpoint to the session history cache.

### 10.2 Deliverable Synchronization & Jira Cloud Portal Linking

#### 10.2.1 Multi-Surface Synchronization
1. **Tabs Canvas Synchronization:**
   * The Markdown spec in the Editor updates its metadata header:
     ```markdown
     # Epic: Universal Application Login
     **Jira Key**: [EPIC-104 ↗](https://jira.enterprise.internal/epics/EPIC-104)  |  **Status**: Defined in Jira
     ```
2. **Artifacts Section Update:**
   * In `.s08-artifacts-view`, `EPIC_Universal_Login_Draft.md` updates badge from `Draft` to `Committed (EPIC-104)`.
3. **Column 1 Completion Summary:**
   ```
   ✓ Done — Epic EPIC-104 created in Jira.

   Entity: Universal Application Login
   Jira ID: IN-104  |  Jira Key: [EPIC-104 ↗]
   Workspace: Acme Inc  |  Work Area: Design Engineering
   Status: Defined

   Next suggested actions:
   • "Create features for epic id:IN-104"
   • "Create test cases for epic id:IN-104"
   ```

#### 10.2.2 Embedded Browser Tab Jira Ticket Inspector (`.s08-view-browser`)

When the user clicks the Jira ticket link `[EPIC-104 ↗]` (accessible from the Chat Stream receipt, the Editor document header, or the Artifacts list), Sutra UI **does not eject the user out to an external operating system browser window**. 

Instead, it intercepts the navigation and opens directly within Sutra UI's **embedded Browser Tab (`.s08-view-browser`)** in Column 2:

1. **In-App Address Bar & Security Lock:**
   * The address bar input updates to: `https://jira.enterprise.internal/epics/EPIC-104` with a verified SSL indicator.
2. **Enterprise Jira Layout Rendering (Jira-like Anatomy):**
   * The Browser Tab renders a high-fidelity dummy **Jira** (enterprise Agile management system analogous to Jira) issue view structured with a standard 70/30 two-column split:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ .s08-view-browser (Address: [ https://jira.enterprise.internal/epics/EPIC-104        ]) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Jira]  Acme Inc / Design Engineering          [ Search issues... ]   [Cloud Live] (SJ)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Synchronized with Sutra Agentic IDE • Entity ID: IN-104 • #8f2a104 [View in Editor ↗]│
├─────────────────────────────────────────────────────────────────┬──────────────────────┤
│ Acme Inc / Design Engineering / Epics / EPIC-104                │ DETAILS              │
│                                                                 │ Status:     [DEFINED]│
│ [Epic] EPIC-104                                                 │ Priority:        High│
│ Universal Application Login                                     │ Story Points:  21 pts│
│ [DEFINED v]  [Edit]  [Comment]  [Link Issue]                    │ Release:      Q4 2026│
│                                                                 │ Sprint:  PI-4 Sprint2│
│ DESCRIPTION                                                     │ Resolution:Unresolved│
│ Business Objective:                                             ├──────────────────────┤
│ Implement a robust, unified single sign-on (SSO) framework      │ PEOPLE               │
│ across web and mobile platforms for Acme Inc enterprise...      │ Assignee: (SJ) Sarah │
│                                                                 │ Reporter:   [System] │
│ Gherkin Acceptance Criteria:                                    ├──────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │ AGILE CONTEXT        │
│ │ Feature: Universal Application Login                        │ │ Workspace:  Acme Inc │
│ │   Scenario: Successful TOTP Multi-Factor Authentication     │ │ Work Area:Design Eng │
│ │     Given user is on login screen ...                       │ │ Entity ID:    IN-104 │
│ └─────────────────────────────────────────────────────────────┘ │ Synced via:Sutra IDE │
│                                                                 └──────────────────────┘
│ CHILD FEATURES (4)  [======............] 25% Done               [+ Add Feature]
│ ┌──────────────┬─────────────────────────────────────┬─────────┬────────┬──────────────┐
│ │ Key          │ Summary                             │ Status  │ Points │ Assignee     │
│ ├──────────────┼─────────────────────────────────────┼─────────┼────────┼──────────────┤
│ │ [Feat]FEAT-201 Multi-Factor Authentication (TOTP)  │ DEFINED │ 8 pts  │ Sarah Jenkins│
│ │ [Feat]FEAT-202 OAuth2 Social & Enterprise SSO      │ PLANNED │ 5 pts  │ Alex Wong    │
│ │ [Feat]FEAT-203 Self-Service Password Reset         │ PLANNED │ 5 pts  │ Marcus Brody │
│ │ [Feat]FEAT-204 Audit Logging & Failed Lockout      │ DONE    │ 3 pts  │ Elena Rostova│
│ └──────────────┴─────────────────────────────────────┴─────────┴────────┴──────────────┘
│                                                                                        │
│ ACTIVITY  [All]  [Comments (0)]  [History (2)]  [Work Log]                             │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Sutra Business Analysis Agent  •  Just now via REST API v2                         │ │
│ │ Created Epic EPIC-104 from deliverable EPIC_Universal_Login_Draft.md (+68 lines).   │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

3. **Key Interactive Capabilities of the Embedded Jira View:**
   * **Bidirectional Sutra IDE Return (`[View in Editor ↗]`):** Directly jumps back to the Markdown specification in the Editor (`.s08-view-editor`) without losing browser navigation history.
   * **Interactive Workflow State Toggle:** Clicking the status dropdown (`[DEFINED v]`) cycles through the enterprise state machine (`Defined` $\rightarrow$ `In Progress` $\rightarrow$ `In Review` $\rightarrow$ `Done`), synchronizing changes across the sidebar and logging to the Sutra Monitor stream.
   * **Hierarchy Traversal:** Clicking child features (`FEAT-201`, `FEAT-202`) allows drilling down into child requirements or generating downstream acceptance criteria.

### 10.3 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> Enterprise Business Analysts operate in Jira or Jira as their canonical System of Record (SoR). However, jumping between external desktop windows breaks concentration and destroys the agentic flow.

> [!TIP]
> **Purpose:**  
> 1. **Zero-Friction System Navigation:** Clicking `[EPIC-104 ↗]` immediately renders the live ticket inside Sutra UI's embedded browser without switching to an external browser app.  
> 2. **Side-by-Side Co-Verification:** Users can configure Sutra UI in multi-pane mode (`Browser + Editor`) to view the raw Markdown specification on the left while simultaneously viewing the customer-facing Jira Agile board on the right.  
> 3. **Eliminates Copy-Paste Toil:** Entity keys (`EPIC-104`, `IN-104`) and API sync hashes (`#8f2a104`) are automatically linked across all three columns.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> * **Why an Embedded Browser rather than an OS-level redirect?**  
>   Redirecting to Chrome/Edge forces an OS window switch, taking the user away from their active terminal logs, chat stream, and editor diffs. Embedding Jira inside `.s08-view-browser` treats external SaaS tools as first-class workspace citizens, preserving conversational context and enabling split-screen verification.  
> * **Why an Explicit Response Keeping Agent?**  
>   Rather than trusting raw LLM memory to recall `IN-104` 20 turns later, the Response Keeping Agent registers structured metadata keys (`last_created_epic_id: "IN-104"`). When the user asks "create features for this epic", downstream agents execute with 100% deterministic precision.

---

## STAGE 11: Downstream Agile Chaining (Features $\rightarrow$ Stories $\rightarrow$ Test Cases)

### 11.1 The Complete Hierarchical Breakdown Pipeline
Thanks to the Response Keeping Agent, the user can now decompose the entire Epic down to executable Acceptance Test Cases in seamless sequential steps:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CHAINED LIFECYCLE STEPS                         │
│                                                                        │
│ Step 1: Epic Created (IN-104)                                          │
│    │                                                                   │
│    ▼                                                                   │
│ Step 2: User: "Create features for epic id:IN-104"                     │
│    │  • Rule Node -> Feature Generation Agent                          │
│    │  • Tool: jira_get_epic("IN-104")                                  │
│    │  • HITL Validation -> Tool: jira_create_features                  │
│    │  • Output: FEAT-201, FEAT-202, FEAT-203                           │
│    │                                                                   │
│    ▼                                                                   │
│ Step 3: User: "Create user stories for the feature id:FEAT-201"        │
│    │  • Rule Node -> User Story Generation Agent                       │
│    │  • Tool: jira_get_feature("FEAT-201")                             │
│    │  • HITL Validation -> Tool: jira_create_user_story                │
│    │  • Output: US-301, US-302, US-303                                 │
│    │                                                                   │
│    ▼                                                                   │
│ Step 4: User: "Create test cases for User story id:US-301"             │
│       • Rule Node -> Test Case Generation Agent                        │
│       • Tool: jira_get_user_story("US-301")                            │
│       • HITL Validation -> Tool: jira_create_test_case                 │
│       • Output: TC-501, TC-502                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Generating Features for an Epic (`jira_create_features`)
1. **User Prompt:** The user clicks the proactive suggestion chip: `"Create features for epic id:IN-104"`.
2. **Execution:**
   * Rule Node routes to **Feature Generation Agent**.
   * Calls `jira_get_epic("IN-104")` to retrieve parent scope and acceptance criteria.
   * Generates 3 cohesive child Features:
     1. `FEAT-201: Federated Okta SSO Integration`
     2. `FEAT-202: Biometric WebAuthn MFA Support`
     3. `FEAT-203: OAuth2 Token Management & Revocation`
3. **HITL Gate:** Renders HITL Gate Card. User approves $\rightarrow$ **Feature Creation Agent** invokes `jira_create_features`.
4. **State Persistence:** Response Keeper records `created_feature_ids = ["FEAT-201", "FEAT-202", "FEAT-203"]`.

### 11.3 Generating User Stories for a Feature (`jira_create_user_story`)
1. **User Prompt:** `"Create user stories for the feature id:FEAT-201"`.
2. **Execution:**
   * Rule Node routes to **User Story Generation Agent**.
   * Calls `jira_get_feature("FEAT-201")`.
   * Synthesizes 3 user stories with persona definitions and Given-When-Then criteria:
     * `US-301: SAML Redirect on Domain Detection`
     * `US-302: Just-In-Time (JIT) User Provisioning`
     * `US-303: SSO Session Inactivity Timeout`
3. **HITL Gate:** User approves $\rightarrow$ **User Story Creation Agent** invokes `jira_create_user_story`.

### 11.4 Generating Acceptance Test Cases (`jira_create_test_case`)
1. **User Prompt:** `"Create test cases for User story id:US-301"`.
2. **Execution:**
   * Rule Node routes to **Test Case Generation Agent**.
   * Calls `jira_get_user_story("US-301")`.
   * Formulates automated and manual test scripts with preconditions, test steps, and expected assertions:
     * `TC-501: Valid Corporate Domain Redirection Test`
     * `TC-502: Unknown Domain Local Fallback Test`
3. **HITL Gate:** User approves $\rightarrow$ **TestCase Creation Agent** invokes `jira_create_test_case`.

### 11.5 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> A business analysis cycle is never a single prompt. It requires hierarchical decomposition from strategic vision (Epics) down to testable assertions (Test Cases).

> [!TIP]
> **Purpose:**  
> 1. Ensure absolute parent-child relationship integrity across all Jira entities.  
> 2. Maintain conversational velocity: Each stage provides the exact prompt chips needed for the next stage.  
> 3. Give analysts a unified cockpit where the entire backlog hierarchy is generated consistently.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to maintain **dedicated generation agents for each entity level** (EpicGen, FeatureGen, StoryGen, TestCaseGen) rather than one generic generator. This allows each agent to enforce domain-specific standards (e.g. Gherkin for stories, step-assertion tables for test cases) while sharing the same Jira session state.

---

## STAGE 12: Session Organization & Governed Undo Rollbacks

### 12.1 Project Archiving via Task Kebab Menu
Once the breakdown is complete, the user can organize the session inside Sutra UI:
1. In the Left Sidebar (`.s08-sidebar-scroll`), the user hovers over the current task row (`.s08-task-item`).
2. Clicks the **`⋯` (Kebab Menu)** (`.s08-kebab-menu`).
3. Selects **`Move to project`** $\longrightarrow$ chooses **`Design Engineering / Identity 2026`**.
4. The task session is neatly filed into the project folder for audited retrieval and team sharing.

### 12.2 Governed Turn Rollback Flow (`#s08-confirm-undo-modal`)
If the user ever needs to roll back a turn (e.g. they want to re-phrase their acceptance test criteria before creating test cases):
1. The user types `/undo` or clicks `[Undo Turn]` in the completion bar.
2. Sutra UI renders the **Confirm Undo Modal (`#s08-confirm-undo-modal`)**:
   ```
   ┌────────────────────────────────────────────────────────┐
   │ ⚠️ Revert Last Agent Turn?                             │
   │                                                        │
   │ This action will revert the session back one step:     │
   │ ┌────────────────────────────────────────────────────┐ │
   │ │ [Restore]   Your prompt will return to composer    │ │
   │ ├────────────────────────────────────────────────────┤ │
   │ │ [-1 turn]   Generated draft will be discarded     │ │
   │ ├────────────────────────────────────────────────────┤ │
   │ │ [Rollback]  Session state resets to checkpoint     │ │
   │ └────────────────────────────────────────────────────┘ │
   │                                                        │
   │ Note: Any entities already committed to Jira (EPIC-104)│
   │ will remain in Jira and will not be deleted.          │
   │                                                        │
   │ [Cancel]                              [Confirm Undo]   │
   └────────────────────────────────────────────────────────┘
   ```
3. Clicking `[Confirm Undo]` cleanly rolls back state, restores the prompt into the composer for editing, and prevents state corruption.

### 12.3 Context, Purpose & Design Rationale

> [!NOTE]
> **Context:**  
> Accidental undos or opaque rollback behavior in agentic software causes extreme user anxiety ("Did I just delete the tickets I spent 20 minutes creating?").

> [!TIP]
> **Purpose:**  
> 1. Provide absolute clarity and transparency regarding what is being rolled back and what remains safe.  
> 2. Ensure non-destructive rollbacks: Restore the user's prompt text into the composer so they don't have to re-type it.  
> 3. Clearly delineate local workspace state from remote Jira enterprise state.

> [!IMPORTANT]
> **Design Decision & Rationale:**  
> We decided to implement the **3-row Confirm Undo Modal (`#s08-confirm-undo-modal`)** documented in `interface_sections_purpose_guide.md`. By explicitly breaking down the impact into three badges (`Restore`, `-1 turn`, `Rollback`) and explicitly reassuring the user about remote Jira safety, we eliminate fear of data loss.

---

## Appendix A: Typed Server-Sent Events (SSE) Protocol

Below is the typed JSON event contract streaming between the Sutra UI frontend and the Agent Orchestration Backend:

```json
// Event 1: Prompt Ingestion with Normalized Scope Token
{
  "event": "part_created",
  "part": {
    "type": "UserPromptPart",
    "text": "Create an epic for Universal Application Login...",
    "scope": {
      "workspaceId": "WS-ACME-01",
      "workspaceName": "Acme Inc",
      "workAreaId": "WA-DE-04",
      "workAreaName": "Design Engineering"
    },
    "attachment": "PRD_App_Login_v2.pdf"
  }
}

// Event 2: Dynamic Layout Scaling Notification (Scenario C5 -> C2)
{
  "event": "layout_scaling_requested",
  "layout": {
    "scenario": "C2",
    "column1Width": "30%",
    "column2Width": "70%",
    "activeTab": "editor"
  }
}

// Event 3: Draft Output Projected to Tabs Canvas
{
  "event": "artifact_updated",
  "artifact": {
    "id": "art-epic-draft-01",
    "tab": "sources",
    "category": "Generated",
    "title": "Epic: Universal Application Login",
    "type": "markdown",
    "content": "# Epic: Universal Application Login\n\n**Scope**: Acme Inc / Design Engineering...",
    "status": "draft"
  }
}

// Event 4: In-Stream HITL Validation Gate Opened
{
  "event": "hitl_gate_opened",
  "gate": {
    "gateId": "hitl-epic-104",
    "targetEntity": "Universal Application Login",
    "toolToExecute": "jira_create_epic",
    "payload": {
      "workspaceName": "Acme Inc",
      "workAreaName": "Design Engineering",
      "title": "Universal Application Login",
      "release": "Q4 2026 Enterprise Core Release"
    },
    "status": "awaiting_approval"
  }
}

// Event 5: Tool Execution Result
{
  "event": "tool_executed",
  "part": {
    "toolName": "jira_create_epic",
    "status": "completed",
    "result": {
      "statusCode": 201,
      "jiraId": "IN-104",
      "jiraKey": "EPIC-104",
      "url": "https://jira.enterprise.internal/epics/EPIC-104"
    }
  }
}
```

---

## Appendix B: Error Handling & Self-Healing Matrix

| Failure Mode | Root Cause | Agent Detection | Autonomous Self-Healing / UI Recovery |
| :--- | :--- | :--- | :--- |
| **Missing Scope** | User omitted Workspace / Work Area. | Supervisor detects empty scope in context envelope. | Renders **Interactive Scope Resolution Card** (Stage 4, Pathway C) with 1-click `@` chips. Never shows error toasts. |
| **Invalid Parent ID** | User requested features for non-existent ID (e.g. `IN999`). | `jira_get_epic("IN999")` returns HTTP 404. | Renders inline error badge in tool row: *"Epic IN999 not found. Did you mean IN-104?"* Offers 1-click correction. |
| **HITL User Rejection** | User rejects draft requirement. | User clicks `[Reject]` or sends edit feedback. | Injects rejection feedback into context. `EpicGen` edits markdown in Tabs Canvas in-place without touching Jira. |
| **Jira API 401 Unauthorized** | Expired Jira session token. | `jira_create_epic` returns HTTP 401. | Triggers Sutra `PermissionGateCard` prompting user to refresh credentials or re-authenticate. |
| **Jira API 422 Unprocessable** | Missing mandatory custom field in Jira schema. | Tool returns HTTP 422 with validation error. | Model self-corrects: extracts missing field from PRD context, augments payload, and retries automatically. |
| **Accidental Turn Rollback** | User triggers undo on completed turn. | User clicks `/undo` or `[Undo Turn]`. | Triggers Sutra's **Confirm Undo Modal (`#s08-confirm-undo-modal`)** showing the 3 impact rows (`Restore`, `-1 turn`, `Rollback`) to prevent accidental data loss. |
