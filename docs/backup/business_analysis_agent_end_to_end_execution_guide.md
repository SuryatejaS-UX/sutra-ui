# End-to-End Execution Guide: Business Analysis Agent in Sutra UI
*A Step-by-Step Engineering, Interaction, and Operational Specification for the Jira Agile Pipeline*

---

## Executive Summary & Design Purpose

This document provides the definitive, turn-by-turn operational guide for executing the **Business Analysis Agent** (`BUSINESS ANALYSIS AGENT.md`) within **Sutra UI** without altering the approved layout engine (`workspace_layout_specification.md`). 

It synthesizes the interface specifications from `interface_sections_purpose_guide.md` and the agentic principles from `unified_agentic_ux_architecture_analysis.md`, specifically defining:
1. **Tri-Modal Scope Architecture & State Synchronization:** Providing multiple synchronized paths for Workspace & Work Area selection (Sidebar, Inset Scope Bar, and In-Composer `@workspace` mention) to eliminate friction for both mouse and keyboard workflows.
2. **Scope Bar Dismissal & Onboarding Transition:** How the setup bar disappears once selected, automatically revealing the agent’s capabilities and starter prompts.
3. **Resilient Natural Language Scope Ingestion:** How the system gracefully handles prompts written in plain English without `@`, auto-converting them into the formal `@workspace` token state.
4. **Zero-Error Missing Scope Guidance:** How the system buffers prompt context and guides users with 1-click `@` chips when scope is omitted entirely, rather than throwing blocking validation errors.
5. **The Non-Coding Artifacts Ecosystem:** Utilizing Sutra's `.s08-artifacts-view` with cloud storage imports (OneDrive, Google Drive), `Uploaded` vs. `Generated` tabs, and the multi-mode Editor/Stage.
6. **The Governed Human-In-The-Loop (HITL) Pipeline:** Safe review via In-Stream Gate Cards and the Meso Staging Dock before committing changes to Jira.

---

## Table of Contents
1. [Context & Purpose: The Tri-Modal Scope Architecture](#1-context--purpose-the-tri-modal-scope-architecture)
   - [1.1 Why Multiple Selection Entry Points Exist](#11-why-multiple-selection-entry-points-exist)
   - [1.2 Bi-Directional State Synchronization](#12-bi-directional-state-synchronization)
   - [1.3 Scope Bar Dismissal & Agent Guidance Transition](#13-scope-bar-dismissal--agent-guidance-transition)
   - [1.4 Keyboard-First Scoping via `@workspace` Token Pills](#14-keyboard-first-scoping-via-workspace-token-pills)
   - [1.5 Plain English Scope Extraction & Auto-Conversion (Without `@`)](#15-plain-english-scope-extraction--auto-conversion-without-)
   - [1.6 Omitted Scope: The Resilient Guidance Flow (Zero Error Screens)](#16-omitted-scope-the-resilient-guidance-flow-zero-error-screens)
2. [Layout Mapping & Zero-Layout-Change Guarantee](#2-layout-mapping--zero-layout-change-guarantee)
3. [Actor & Multi-Agent Role Taxonomy](#3-actor--multi-agent-role-taxonomy)
4. [Master End-to-End Execution Walkthrough](#4-master-end-to-end-execution-walkthrough)
   - [Phase 1: Discovery & Agent Activation (Zone 2 $\rightarrow$ Zone 3)](#phase-1-discovery--agent-activation-zone-2--zone-3)
   - [Phase 2: Scope Selection & Empty-State Capability Reveal](#phase-2-scope-selection--empty-state-capability-reveal)
   - [Phase 3: Prompt Submission & Input Normalization (3 Pathways)](#phase-3-prompt-submission--input-normalization-3-pathways)
   - [Phase 4: Supervisor Cognition & Rule Node Routing](#phase-4-supervisor-cognition--rule-node-routing)
   - [Phase 5: Missing Context & Interactive Clarification Gate](#phase-5-missing-context--interactive-clarification-gate)
   - [Phase 6: Autonomous Generation & Dual-Surface Projection](#phase-6-autonomous-generation--dual-surface-projection)
   - [Phase 7: Human-In-The-Loop (HITL) Validation & Docked Staging](#phase-7-human-in-the-loop-hitl-validation--docked-staging)
   - [Phase 8: Jira API Tool Execution & Live Telemetry](#phase-8-jira-api-tool-execution--live-telemetry)
   - [Phase 9: State Persistence, Response Keeping & Handoff](#phase-9-state-persistence-response-keeping--handoff)
   - [Phase 10: Downstream Chaining (Features $\rightarrow$ Stories $\rightarrow$ Test Cases)](#phase-10-downstream-chaining-features--stories--test-cases)
5. [Data Contracts, JSON Schemas & SSE Events](#5-data-contracts-json-schemas--sse-events)
6. [Failure Modes, Retries & Self-Healing Matrix](#6-failure-modes-retries--self-healing-matrix)

---

## 1. Context & Purpose: The Tri-Modal Scope Architecture

### 1.1 Why Multiple Selection Entry Points Exist
In an enterprise Agile environment, requiring users to repeatedly type `"In workspace 'Acme Inc' and work area 'Design Engineering'..."` creates friction and leads to typos that cause Jira API failures. Conversely, forcing users to click through dropdown menus with a mouse disrupts keyboard-first developers.

To provide maximum accessibility without layout clutter, Sutra UI provides **three synchronized entry points**:

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

### 1.2 Bi-Directional State Synchronization
All three entry points bind to a single reactive session state:
* **Selected in Sidebar:** The Conversational Bar updates its badges and initiates dismissal; the Composer knows the scope.
* **Selected in Conversational Bar:** The Sidebar Workspace Switcher immediately reflects the chosen workspace/work area, and the bar collapses.
* **Typed in Composer via `@workspace`:** The session state updates dynamically, synchronizing the Sidebar and satisfying the scope requirement.

---

### 1.3 Scope Bar Dismissal & Agent Guidance Transition

#### The UX Problem:
Once a user configures their Workspace and Work Area, keeping the setup bar (`#s08-scope-setup-bar`) permanently pinned wastes valuable vertical chat space.

#### The Sutra Solution:
1. **Smooth Collapse:** Upon valid selection, `#s08-scope-setup-bar` transitions out (`max-height: 0; opacity: 0; margin: 0; transition: all 250ms ease;`).
2. **Agent Guidance & Capabilities Card:** In the clean chat river, Sutra displays a rich **Agent Onboarding & Suggestion Card** tailored specifically to the Business Analysis Agent:

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
* Clicking any suggestion chip populates the composer with pre-formatted syntax.
* As soon as the first prompt is sent, this card scrolls naturally into the conversation stream.

---

### 1.4 Keyboard-First Scoping via `@workspace` Token Pills

Users can define or override the scope directly in the composer using `@` mention grammar:

1. **Typing Trigger:** The user types `@` in the prompt composer.
2. **Context Menu:** A fuzzy-search popover appears directly above the cursor:
   ```
   ┌──────────────────────────────────────────────────────────────┐
   │ Insert Context Mention                                       │
   ├──────────────────────────────────────────────────────────────┤
   │ 🏢 @workspace      Set active Workspace & Work Area          │
   │ 📄 @file           Attach local PRD or specification document │
   │ ☁️  @onedrive       Import document from corporate OneDrive   │
   │ ☁️  @googledrive    Import document from Google Drive         │
   │ 🤖 @agent          Switch or delegate to another agent       │
   └──────────────────────────────────────────────────────────────┘
   ```
3. **Cascading Submenu:** Selecting `@workspace` expands the list of available workspaces and their work areas:
   ```
   ┌──────────────────────────────────────────────────────────────┐
   │ Select Workspace & Work Area                                 │
   ├──────────────────────────────────────────────────────────────┤
   │ Acme Inc                                                     │
   │   ├── Design Engineering   (Active)                          │
   │   ├── Sales & Marketing                                      │
   │   └── Travel                                                 │
   │ Stark Industries                                             │
   │   ├── Core Infrastructure                                    │
   │   └── Security Ops                                           │
   └──────────────────────────────────────────────────────────────┘
   ```
4. **Interactive Token Pill Transformation:**
   Once selected, the raw text string transforms into an interactive, high-contrast **Token Pill** inside the input area:
   ```
   ┌────────────────────────────────────────────────────────────────────────────────────────┐
   │ Create an epic for [@workspace: Acme Inc / Design Engineering ×] with Okta SSO and MFA │
   │                                                                                        │
   │ [+]  Business Analysis ^                                                         🎤 [→]│
   └────────────────────────────────────────────────────────────────────────────────────────┘
   ```
   * Clicking the `×` on the pill removes the tag and reverts to the global session default.
   * The agent runtime parses the pill into exact entity IDs (`workspace_id: "WS-ACME-01"`, `work_area_id: "WA-DE-04"`), completely eliminating syntax or naming hallucinations.

---

### 1.5 Plain English Scope Extraction & Auto-Conversion (Without `@`)

#### Context & Purpose:
Users should never be forced to memorize syntax. If a user enters:
```text
"In workspace 'Acme Inc' and work area 'Design Engineering', I want to create an epic for Universal Application Login..."
```
The system must not reject the prompt or demand that they retype it with an `@` symbol.

#### System Normalization Behavior:
1. **Entity Extraction:** The Supervisor Agent's parser identifies the natural language pattern:
   * Target Workspace: `"Acme Inc"` $\longrightarrow$ Resolved to ID `WS-ACME-01`
   * Target Work Area: `"Design Engineering"` $\longrightarrow$ Resolved to ID `WA-DE-04`
2. **Visual Auto-Conversion in the Stream:**
   When the message renders in the chat river, Sutra UI **automatically converts the raw string into the official `@workspace` token pill**:
   ```
   ┌────────────────────────────────────────────────────────────────────────────────────┐
   │ User:                                                                              │
   │ In [@workspace: Acme Inc / Design Engineering] I want to create an epic for        │
   │ Universal Application Login with Okta SSO, Biometric WebAuthn MFA, and OAuth2...   │
   └────────────────────────────────────────────────────────────────────────────────────┘
   ```
3. **UI Environment Synchronization:**
   * The **Sidebar Workspace Switcher** updates immediately to `Acme Inc` / `Design Engineering`.
   * The setup bar `#s08-scope-setup-bar` collapses.
   * The user receives instant visual confirmation that the system recognized their team scope without ambiguity.

---

### 1.6 Omitted Scope: The Resilient Guidance Flow (Zero Error Screens)

#### Context & Purpose:
What if the user ignores the setup bar, skips `@workspace`, and submits a raw instruction with zero scope?
```text
"I want to create an epic for Universal Application Login with Okta SSO, Biometric WebAuthn MFA, and OAuth2 token support."
```
Traditional systems fail with a harsh, red validation error: `Error: workspaceName and workAreaName are mandatory.` This destroys momentum and creates user frustration.

#### The Sutra Solution (Zero-Error Conversational Scoping):
1. **Never Show an Error Toast:** The system accepts the prompt as valid intent.
2. **Context Buffering:** The agent stores the user's requirement prompt in temporary session memory (`pending_action = "create_epic"`, `buffered_prompt = "Universal Application Login..."`).
3. **Interactive Scope Resolution Card:** The agent responds immediately in the conversation river with an interactive, friendly guidance card offering 1-click `@` chips:

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

4. **One-Click Execution Without Re-Typing:**
   * Clicking any chip (e.g. `[@workspace: Acme Inc / Design Engineering]`) immediately binds the scope, updates the Sidebar, collapses the setup bar, and **automatically launches the buffered Epic generation**.
   * **The user never has to re-type or copy-paste their initial prompt.**

---

## 2. Layout Mapping & Zero-Layout-Change Guarantee

All interactions strictly follow the approved **Sutra Workspace Layout Specification** (`workspace_layout_specification.md`) and **Interface Purpose Guide** (`interface_sections_purpose_guide.md`):

```
SCREEN VIEWPORT (100vw × 100vh)
 ├── LEVEL 1: MAIN WORKSPACE SHELL
 │    ├── Primary Dock (Fixed 64px): Persistent global navigation rail.
 │    ├── Sidebar-08 (15%–20% • Drag < 13% snaps to 0px): Switchers, Projects & Recent Tasks.
 │    └── Dual-Column Workspace (Remaining 80%–85% width • 100% when sidebar is collapsed):
 │         ├── Column 1: Conversation Section (Prompt composer, chat stream, HITL gates)
 │         ├── Canvas Splitter: Interactive resizer with bidirectional 10%–20% snap
 │         └── Column 2: Tabs Canvas (Multi-pane workspace body)
 │
 └── LEVEL 2: TABS CANVAS WORKFLOWS (Inside Column 2)
      ├── T1/T2: Artifact Reader (28% Artifacts Panel + 72% Reader/Editor)
      ├── T6: Reader & Logs (Vertical Stack: 65% Stage Deliverable + 35% Log Viewer)
      └── T8: 3-Pane Studio (28% Artifacts + 65% Stage Top-Right + 35% Logs Bottom-Right)
```

---

## 3. Actor & Multi-Agent Role Taxonomy

The Business Analysis Agent executes as a hierarchical cluster:

| Actor / Component | Architecture Role | Operational Responsibility |
| :--- | :--- | :--- |
| **Product Owner (User)** | Human Decision Maker | Supplies requirements, answers clarifications, validates HITL gates. |
| **Supervisor Agent** | Intent Kernel | Ingests prompts, normalizes scopes, reads attachments (`read_file`), extracts time (`get_time_context`). |
| **Rule Node** | Router | Evaluates user intent and dispatches execution to the appropriate generation subagent. |
| **Epic Generation Agent** | Subagent | Synthesizes Epic summaries, business values, and acceptance criteria. |
| **Feature Generation Agent** | Subagent | Reads parent Epic via `jira_get_epic`, identifies boundaries, drafts child features. |
| **User Story Gen Agent** | Subagent | Reads parent Feature via `jira_get_feature`, generates user stories with Gherkin scenarios. |
| **Test Case Gen Agent** | Subagent | Reads Story via `jira_get_user_story`, writes positive/negative acceptance test cases. |
| **HITL Validation Gate** | Safety Mechanism | Halts execution before disk/API mutation; renders in-stream review cards & Meso Dock. |
| **API Execution Agents** | Integration Runtimes | Calls Jira APIs (`jira_create_epic`, `jira_create_features`, `jira_create_user_story`, `jira_create_test_case`). |
| **Response Keeping Agent** | State Persistence | Stores generated Jira IDs, keys, and URLs in session memory for chained downstream calls. |

---

## 4. Master End-to-End Execution Walkthrough

### Walkthrough Scenario: Universal Application Login
* **Objective:** Create an Epic for Universal Application Login with SSO, Biometric MFA, and OAuth2, followed by child Features, User Stories, and Acceptance Test Cases in Jira.

---

### Phase 1: Discovery & Agent Activation (Zone 2 $\rightarrow$ Zone 3)
1. The user opens Sutra UI and lands in **Zone 2: Agent Catalogue** (`.sutra-catalogue-container`).
2. The user navigates to the **Productivity** category and locates the **Business Analysis** card.
3. The user clicks the **`[Use Agent]`** button on the card.
4. **Transition:** Sutra UI transitions seamlessly from Zone 2 to **Zone 3: Agent Workspace** (`sidebar-08`).

---

### Phase 2: Scope Selection & Empty-State Capability Reveal
1. In the top conversation header, `#s08-scope-setup-bar` is initially visible in its guidance state.
2. The user clicks the scope button and selects:
   * **Workspace:** `Acme Inc` (Enterprise)
   * **Work Area:** `Design Engineering`
3. **State Transition:**
   * The Sidebar Workspace Switcher (`.s08-sidebar-workspace-menu`) immediately updates.
   * `#s08-scope-setup-bar` collapses and disappears.
   * The **Agent Guidance & Suggestion Card** appears in the empty chat river, presenting the 4 quick-action chips.

---

### Phase 3: Prompt Submission & Input Normalization (3 Pathways)

Depending on how the user inputs their prompt, the system normalizes seamlessly:

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

#### Pathway A (Keyboard Power User):
* User types: `Create an epic for [@workspace: Acme Inc / Design Engineering] with Okta SSO and WebAuthn MFA...`
* System parses exact entity IDs and launches generation directly.

#### Pathway B (Plain English User):
* User types: `"In workspace 'Acme Inc' and work area 'Design Engineering', I want to create an epic for Universal Application Login..."`
* System accepts query, extracts `"Acme Inc"` and `"Design Engineering"`, normalizes the chat bubble to display `[@workspace: Acme Inc / Design Engineering]`, syncs the sidebar, and launches generation.

#### Pathway C (Fast User / Scope Omitted):
* User types: `"I want to create an epic for Universal Application Login with Okta SSO, Biometric MFA..."`
* System displays the **Interactive Scope Resolution Card** (Section 1.6). User clicks `[@workspace: Acme Inc / Design Engineering]`. System binds scope and executes immediately without re-prompting.

---

### Phase 4: Supervisor Cognition & Rule Node Routing
1. The **Supervisor Agent** ingests the request envelope:
   * Invokes `read_file("PRD_App_Login_v2.pdf")` to parse functional requirements.
   * Invokes `get_time_context()` to establish current sprint/milestone timelines.
2. **Rule Node Evaluation:**
   * Analyzes intent: Keyword `"create an epic"` detected $\longrightarrow$ routes flow to **Epic Generation Agent**.
3. **Sutra Activity Ticker (Column 1):**
   ```
   ✓ Read  PRD_App_Login_v2.pdf  (18 pages, 42KB)
   ✓ TimeContext  2026-10-25T21:24:35+05:30
   [~] Routing: Rule Node -> Epic Generation Agent
   ```

---

### Phase 5: Missing Context & Interactive Clarification Gate
1. The Supervisor notices the PRD lacks a target delivery horizon.
2. Rather than guessing, the agent triggers an **Interactive Question Card** in Column 1:
   ```
   ┌────────────────────────────────────────────────────────┐
   │ ❓ Clarification Needed: Target Release Milestone      │
   │ Which delivery milestone should this Epic target?       │
   │                                                        │
   │ ○ Q4 2026 Enterprise Core Release (Recommended)        │
   │ ○ Q1 2027 Mobile & Identity Wave                       │
   │ [ Custom Release Name / Backlog...                   ] │
   │                                     [Submit Answer]    │
   └────────────────────────────────────────────────────────┘
   ```
3. The user selects **Q4 2026 Enterprise Core Release** and clicks `Submit Answer`.
4. The generation agent receives the answer and proceeds immediately.

---

### Phase 6: Autonomous Generation & Dual-Surface Projection

The **Epic Generation Agent** synthesizes the Agile specification and projects its output across both columns simultaneously:

#### Column 1: Conversation Section
* **Reasoning Drawer:** Displays active thinking tokens (`Thinking (3.2s)...` with toggle chevron).
* **Live Todo Checklist (`todowrite`):**
  ```
  [✓] Parse functional requirements from PRD_App_Login_v2.pdf
  [✓] Define Epic business value and target persona
  [~] Generate Gherkin acceptance criteria
  [ ] Identify child feature boundaries (SSO, MFA, OAuth2)
  ```

#### Column 2: Tabs Canvas (Layout T1/T2: Artifact Reader)
* Sutra opens the **Artifacts** tab (`data-tab-name="sources"`).
* **Left Pane (`.s08-artifacts-view`, 28% width):**
  * Displays the **Artifacts Manager**:
    * Under **`Uploaded`**: `PRD_App_Login_v2.pdf` (with cloud badge).
    * Under **`Generated`**: `EPIC_Universal_Login_Draft.md` (pulsing blue).
* **Right Pane (`.s08-view-editor`, 72% width):**
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
  * User can click the **Preview / Raw Toggle** to view raw source or the **Download Deliverable** button to export the document.

---

### Phase 7: Human-In-The-Loop (HITL) Validation & Docked Staging

Generation halts at the mandatory **HITL Validation Node**:

#### 1. In-Stream HITL Card (Column 1)
```
┌────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Human-In-The-Loop Review Required                                   │
│ The Epic draft has been generated. Please validate before Jira commit.  │
│                                                                        │
│ Epic: Universal Application Login (3 Child Features identified)        │
│ Destination: Jira Instance [Acme Inc / Design Engineering]             │
│                                                                        │
│ [ Request Edits ]                       [ Approve & Create in Jira ▼ ] │
└────────────────────────────────────────────────────────────────────────┘
```

#### 2. Meso Staging Dock (Docked Review Ribbon above Composer)
Directly above the input box, the staging dock expands into **State B (Staging Tray)**:
```
┌────────────────────────────────────────────────────────────────────────┐
│ [●] +68 lines  EPIC-Draft    Acme Inc / Universal Application Login    │
├────────────────────────────────────────────────────────────────────────┤
│ [←] [📄] 1 Jira Entity Staged                Reject  [Approve & Create]│
└────────────────────────────────────────────────────────────────────────┘
```

#### 3. Human Decision Branching:
* **Option A (Feedback / Rejection):**
  * The user clicks `[Request Edits]` and inputs: *"Ensure session timeout is explicitly set to 15 minutes of inactivity"*.
  * Feedback loops back to `EpicGen`. The draft in the Editor pane updates in-place and re-submits to HITL.
* **Option B (Approval):**
  * The user clicks `[Approve & Create in Jira ▼]`.

---

### Phase 8: Jira API Tool Execution & Live Telemetry
1. Control passes to the **Epic API Execution Agent**.
2. **Layout Transition:**
   * Tabs Canvas smoothly adjusts to **T6 (Reader & Logs)** or **T8 (3-Pane Studio)**.
   * Column 1 scales to **25%**, giving Column 2 **75%** viewport width.
3. **Tool Invocation:**
   The agent calls `jira_create_epic`:
   ```json
   {
     "workspaceName": "Acme Inc",
     "workAreaName": "Design Engineering",
     "title": "Universal Application Login",
     "description": "Enterprise authentication supporting SAML, WebAuthn, OAuth2",
     "priority": "High",
     "targetRelease": "Q4 2026 Enterprise Core Release"
   }
   ```
4. **Live Telemetry in Log Viewer (`.s08-view-log-viewer`, Bottom Pane, 35% height):**
   ```bash
   [21:24:36] INFO  Invoking tool: jira_create_epic...
   [21:24:37] SCOPE Target verified: Acme Inc / Design Engineering
   [21:24:38] POST  https://jira.enterprise.internal/api/v2/workspaces/AcmeInc/epics
   [21:24:38] STATUS 201 Created (142ms)
   [21:24:38] RESPONSE {"id": "IN-104", "key": "EPIC-104", "status": "Defined"}
   [21:24:39] SUCCESS Epic EPIC-104 committed to Jira.
   ```
5. **Staging Tray Dismissal:**
   The staging tray above the composer dismisses with a smooth `150ms ease-out` transition back to State A.

---

### Phase 9: State Persistence, Response Keeping & Handoff
1. The **Response Keeping Agent** executes:
   * Persists session state variables:
     * `last_created_artifact_type = "epic"`
     * `last_created_epic_id = "IN-104"`
     * `last_created_epic_key = "EPIC-104"`
2. **Tabs Canvas Synchronization:**
   * The spec in the Reader pane updates its header: `Jira Key: [EPIC-104 ↗]` (linking to the Jira cloud portal).
   * In the Artifacts panel, the item status changes to `Committed`.
3. **Column 1 Completion Output:**
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

---

### Phase 10: Downstream Chaining (Features $\rightarrow$ Stories $\rightarrow$ Test Cases)

The workflow continues seamlessly using the state maintained by the Response Keeping Agent:

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

#### Step-by-Step Chaining Details:
1. **Generating Features:**
   * User prompt: *"Create features for epic id:IN-104"*.
   * Rule Node routes to **Feature Generation Agent**.
   * Calls `jira_get_epic("IN-104")` to retrieve parent requirements.
   * Artifacts tab appends 3 draft Features.
   * HITL approval $\rightarrow$ **Feature Creation Agent** invokes `jira_create_features`.
   * Response Keeper records `created_feature_ids = ["FEAT-201", "FEAT-202", "FEAT-203"]`.

2. **Generating User Stories:**
   * User prompt: *"Create user stories for the feature id:FEAT-201"*.
   * Rule Node routes to **User Story Generation Agent**.
   * Calls `jira_get_feature("FEAT-201")`.
   * Synthesizes stories using user persona + Gherkin scenarios.
   * HITL approval $\rightarrow$ **User Story Creation Agent** invokes `jira_create_user_story`.

3. **Generating Acceptance Test Cases:**
   * User prompt: *"Create test cases for User story id:US-301"*.
   * Rule Node routes to **Test Case Generation Agent**.
   * Calls `jira_get_user_story("US-301")`.
   * Generates step-by-step test execution scripts.
   * HITL approval $\rightarrow$ **TestCase Creation Agent** invokes `jira_create_test_case`.

---

## 5. Data Contracts, JSON Schemas & SSE Events

### 5.1 Typed Server-Sent Events (SSE) Protocol

```json
// Event 1: Context Ingestion with In-Prompt Scope Token
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

// Event 2: Draft Output Projected to Tabs Canvas
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

// Event 3: In-Stream HITL Validation Gate Opened
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

// Event 4: Tool Execution Result
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

## 6. Failure Modes, Retries & Self-Healing Matrix

| Failure Mode | Root Cause | Agent Detection | Autonomous Self-Healing / UI Recovery |
| :--- | :--- | :--- | :--- |
| **Missing Scope** | User omitted Workspace / Work Area. | Supervisor detects empty scope in context envelope. | Renders **Interactive Scope Resolution Card** (Section 1.6) with 1-click `@` chips. Never shows error toasts. |
| **Invalid Parent ID** | User requested features for non-existent ID (e.g. `IN999`). | `jira_get_epic("IN999")` returns HTTP 404. | Renders inline error badge in tool row: *"Epic IN999 not found. Did you mean IN-104?"* Offers 1-click correction. |
| **HITL User Rejection** | User rejects draft requirement. | User clicks `[Reject]` or sends edit feedback. | Injects rejection feedback into context. `EpicGen` edits markdown in Tabs Canvas in-place without touching Jira. |
| **Jira API 401 Unauthorized** | Expired Jira session token. | `jira_create_epic` returns HTTP 401. | Triggers Sutra `PermissionGateCard` prompting user to refresh credentials or re-authenticate. |
| **Jira API 422 Unprocessable** | Missing mandatory custom field in Jira schema. | Tool returns HTTP 422 with validation error. | Model self-corrects: extracts missing field from PRD context, augments payload, and retries automatically. |
| **Accidental Turn Rollback** | User triggers undo on completed turn. | User clicks `/undo` or `[Undo Turn]`. | Triggers Sutra's **Confirm Undo Modal (`#s08-confirm-undo-modal`)** showing the 3 impact rows (`Restore`, `-1 turn`, `Rollback`) to prevent accidental data loss. |

---

## 7. Verification Summary

1. **Zero Layout Changes:** The workflow functions 100% within Sutra UI's existing **Two-Column Layout**, **Tabs Canvas**, and **Docked Review Ribbon**.
2. **Tri-Modal Scope Harmony:** Mouse users benefit from the synchronized Sidebar and Scope bar, while keyboard users benefit from the fast `@workspace` token pill.
3. **Resilient Input Normalization:** Natural language prompts without `@` are accepted and auto-converted into token pills, while completely omitted scopes trigger 1-click guidance chips with zero error screens.
4. **Clutter-Free Canvas:** The Scope Setup Bar automatically dismisses upon selection, revealing the agent's capabilities and starter chips to eliminate the cold-start problem.
5. **Governed Human-In-The-Loop Execution:** No data is committed to the external Jira instance without explicit user approval at the **HITL Validation Gate**.
6. **Stateful Continuity:** The **Response Keeping Agent** preserves created IDs across turns, enabling fluid agile chaining (`Epic` $\rightarrow$ `Features` $\rightarrow$ `Stories` $\rightarrow$ `Test Cases`).
