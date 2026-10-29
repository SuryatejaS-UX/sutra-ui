# Business Analysis Agent: Component Gap Analysis, Dependency Graph & Implementation Roadmap
*A Definitive Engineering and Architectural Specification for the Sutra UI Agile Lifecycle*

---

## 1. Executive Overview & Document Purpose

This document provides the definitive, turn-by-turn **Component Gap Analysis**, **Dependency Graph**, and **Prioritized Implementation Roadmap** for executing the complete **Business Analysis Agent** scenario (`BUSINESS ANALYSIS AGENT.md`) inside **Sutra UI**.

It audits the current codebase (`index.html`, `main.js`, `components.css`) against the requirements laid out in:
1. `business_analysis_agent_end_to_end_execution_guide.md` (End-to-End Operational Lifecycle)
2. `interface_sections_purpose_guide.md` (Section Architecture & Component Purpose)
3. `workspace_layout_specification.md` (Layout Shell, Splitter, and Grid Invariants)
4. `unified_agentic_ux_architecture_analysis.md` (Design Principles & Token Consistency)

### Core Objective
Ensure that every interactive surface, gating card, docking tray, mention popover, and chaining state machine is clearly specified with **complete technical context**, eliminating all ambiguity, structural regressions, and dependency conflicts during development.

---

## 2. Current State Component Audit Matrix

The following table categorizes every component required by the 10-phase Business Analysis lifecycle, its DOM target, its current implementation status, and the exact engineering gap.

| Lifecycle Phase | Component Name | Target DOM Container / CSS Class | Status | Engineering Gap Description |
|---|---|---|---|---|
| **Phase 1: Activation** | Agent Catalogue Card & Zone Switch | `.sutra-catalogue-container` $\rightarrow$ `#sidebar-08` | **100% Built** | Working transition between Zone 2 and Zone 3. |
| **Phase 2: Scope Setup** | Scope Setup Bar Dropdown | `#s08-scope-setup-bar` / `.s08-scope-btn` | **80% Built** | Dropdowns open and select, but bar does not smoothly collapse upon selection. |
| **Phase 2: Onboarding** | Agent Guidance & Suggestion Card | `#s08-chat-messages` / `.s08-agent-guidance-card` | **0% Built** | Empty chat river shows nothing; lacks agent badge, scope chip, and 4 one-click starter action chips. |
| **Phase 3: Mention Scope** | Cursor-Anchored Mention Popover | `#s08-chat-input-box` / `.s08-mention-menu` | **0% Built** | Typing `@` does not trigger a mention popup menu (`@workspace`, `@file`, etc.). |
| **Phase 3: Mention Scope** | Interactive Token Pill | `#s08-chat-input-box` / `.s08-token-pill` | **0% Built** | Selected mention does not convert into a removable `[@workspace: Acme Inc / Design Eng ×]` pill. |
| **Phase 3: Normalization** | Plain English Scope Normalizer | `main.js` input parser | **0% Built** | User typing `"In workspace 'Acme Inc'..."` is not auto-converted to a token pill in the chat bubble. |
| **Phase 3: Missing Scope** | Interactive Scope Resolution Card | `#s08-chat-messages` / `.s08-scope-resolution-card` | **0% Built** | Omitted scope does not trigger 1-click `@` chip guidance card with prompt buffering. |
| **Phase 4: Telemetry** | Agent Processing Trace Tree | `#s08-chat-messages` / `.s08-trace-tree` | **0% Built** | Documented only. Lacks `<Trace>`, `<TraceLine>`, `<TraceCollapsible>` with shimmer & settled durations. |
| **Phase 5: Clarification** | Interactive Clarification Gate Card | `#s08-chat-messages` / `.s08-clarification-card` | **0% Built** | Ambiguous requirements (e.g. Target Release) do not trigger interactive question cards. |
| **Phase 6: Stage Spec** | Dual-Surface Spec Viewer | `.s08-view-editor` / `.s08-md-doc` | **85% Built** | Markdown renderer exists (`renderMarkdownSpecHTML`), but does not dynamically mount during prompt execution. |
| **Phase 6: Annotation** | Editor Inline Commenting System | `.s08-view-editor` / `.s08-inline-comment-box` | **0% Built** | Text selection does not trigger inline comment box or create anchored margin comment cards. |
| **Phase 7: HITL Gate** | In-Stream Tool Approval Card | `#s08-chat-messages` / `.s08-approval-card` | **0% Built** | Documented only. Lacks assistant-ui style gate card with monospaced payload, `Allow once`, `Always allow`, `Deny`. |
| **Phase 7: Meso Dock** | Meso Staging Dock / Tray | Above `#s08-chat-input-box` / `.s08-staging-dock` | **0% Built** | Documented only. Lacks docked review ribbon above composer with diff footprint, `Reject`, and `Approve`. |
| **Phase 8: Execution** | Jira API REST & SSE Telemetry | `.s08-view-log-viewer` | **50% Built** | Generic logs work, but typed SSE HTTP requests (`POST /api/v2/... 201 Created`) are not emitted systematically. |
| **Phase 9: Response** | Ticket Receipt Card & Browser Link | `#s08-chat-messages` / `.s08-jira-link` | **100% Built** | Clean Atlassian cobalt link `[EPIC-104 ↗]` and `#DEEBFF` Defined lozenge. |
| **Phase 9: Inspection** | Embedded Browser Jira Ticket View | `.s08-view-browser` / `.s08-jira-app` | **100% Built** | Fully built. Authentic Jira/Jira layout, breadcrumbs, child features table, sidebar details, SVG icons, zero purple. |
| **Phase 10: Chaining** | Response Keeping State Machine | `window.SutraSessionState.responseKeeper` | **10% Built** | Hardcoded `IN-104` response only. Lacks dynamic session entity store for downstream chaining. |
| **Phase 10: Chaining** | Downstream Agile Chaining Flow | `main.js` prompt branching | **10% Built** | Prompts for `"Create features..."`, `"Create user stories..."`, `"Create test cases..."` fall back to generic responses. |

---

## 3. Master Component Dependency Graph

To prevent integration bugs, broken state loops, or missing DOM references, components **must be constructed according to this strict dependency flow**:

```mermaid
graph TD
    classDef foundation fill:#E2E8F0,stroke:#64748B,stroke-width:1.5px,color:#0F172A;
    classDef hitl fill:#DEEBFF,stroke:#0052CC,stroke-width:2px,color:#0747A6;
    classDef editor fill:#FEF3C7,stroke:#D97706,stroke-width:1.5px,color:#78350F;
    classDef downstream fill:#E3FCEF,stroke:#00875A,stroke-width:1.5px,color:#006644;

    subgraph Layer 1: Core Scoping & State Foundation
        S1[Scope State Normalizer]:::foundation --> S2[Scope Setup Bar Collapse Transition]:::foundation
        S1 --> S3[Agent Guidance & Suggestion Card]:::foundation
        S1 --> S4[Mention Popover @ Grammar]:::foundation
        S4 --> S5[Inline Token Pill Component]:::foundation
        S1 --> S6[Missing Scope Guidance Card]:::foundation
    end

    subgraph Layer 2: Execution Telemetry & Gating Primitives
        T1[Agent Trace Tree Primitive .s08-trace-tree]:::hitl --> T2[TraceLine Shimmer & Duration States]:::hitl
        T1 --> T3[TraceCollapsible Accordion Drawer]:::hitl
        T2 --> G1[Clarification Question Card]:::hitl
        T2 --> A1[In-Stream Tool Approval Card .s08-approval-card]:::hitl
    end

    subgraph Layer 3: Dual-Surface Staging & Editor Annotation
        E1[Dynamic Deliverable Stage Loader]:::editor --> E2[Inline Commenting Engine .s08-inline-comment-box]:::editor
        E1 --> M1[Meso Staging Dock .s08-staging-dock]:::editor
        E2 -.->|Passes Inline Comments Array| A1
        M1 <-.->|Bidirectional Sync: Approve / Reject| A1
    end

    subgraph Layer 4: Execution & Chained State Machine
        A1 -->|On Approve: Mutate Jira| EX1[Jira API Executor & Live Log Stream]:::downstream
        EX1 --> RK[Response Keeping State Store]:::downstream
        RK --> CH1[Feature Generation Chaining FEAT-201..204]:::downstream
        CH1 --> CH2[User Story Chaining US-301..303]:::downstream
        CH2 --> CH3[Test Case Chaining TC-501..502]:::downstream
```

### Critical Dependency Rules
1. **Approval Card Requires Comments Input**: The `.s08-approval-card` displays `[Review: 2 inline annotations attached in Editor]`. The comment data model must exist before or alongside the approval card so user annotations can be serialized into the tool payload or revision request.
2. **Approval Card and Staging Dock Share a Common Event Bus**: Approving in the docked tray (`.s08-staging-dock`) must immediately resolve the in-stream card (`.s08-approval-card`) and vice versa. They cannot be built with isolated state.
3. **Trace Tree Is the Lifecycle Container for Micro-Steps**: The approval card, clarification card, and tool execution logs collapse cleanly into `<TraceLine>` elements within the session trace tree.
4. **Agile Chaining Requires the Response Keeper**: Downstream feature generation (`FEAT-201`) requires the Response Keeper to persist `last_created_epic_id = "IN-104"` from the parent turn.

---

## 4. Prioritized Implementation Roadmap

### Phase P0: Critical Path (HITL Safety & Core Agent Loop)
*Goal: Transform the mock response into a fully governed, safe Human-In-The-Loop agent execution loop.*

#### P0.1: Agent Processing Trace Tree (`.s08-trace-tree`)
* **Reference**: shadcn/ui `<Trace>` base component pattern.
* **Purpose**: Standardize background execution, reasoning steps, tool calls, and sources into clean single-line rows with collapsibles.
* **Anatomy**:
  ```html
  <div class="s08-trace-tree">
    <div class="s08-trace-line completed">
      <span class="s08-trace-icon"><svg>...</svg></span>
      <span class="s08-trace-text">Parse functional requirements from PRD_App_Login_v2.pdf</span>
      <span class="s08-trace-duration">182ms</span>
    </div>
    <div class="s08-trace-collapsible">
      <div class="s08-trace-trigger">
        <span class="s08-trace-icon"><svg>...</svg></span>
        <span class="s08-trace-text">Rule Node: Intent "create an epic" -> Routed to EpicGen</span>
        <span class="s08-trace-chevron">Details ▾</span>
      </div>
      <div class="s08-trace-content">
        Rule evaluated: Keyword "create an epic" matched rule R-01 (Priority: P1)
        Target specialization: Epic Generation Agent (Jira Certified)
      </div>
    </div>
    <div class="s08-trace-line running">
      <span class="s08-trace-icon"><svg class="s08-spin">...</svg></span>
      <span class="s08-trace-text shimmer">Generating Gherkin acceptance criteria (Streaming to Canvas...)</span>
    </div>
  </div>
  ```

#### P0.2: In-Stream Tool Approval Gate Card (`.s08-approval-card`)
* **Reference**: assistant-ui Approval Card pattern.
* **Purpose**: Halt execution before mutating Jira API, rendering the exact payload with 1-click execution controls.
* **Anatomy**:
  ```html
  <div class="s08-approval-card" id="s08-approval-card-epic-104">
    <div class="s08-approval-header">
      <div class="s08-approval-icon-squircle">
        <span class="s08-jira-badge">JIRA</span>
      </div>
      <div class="s08-approval-titles">
        <h4 class="s08-approval-title">Create Epic in Jira</h4>
        <p class="s08-approval-subtitle">The agent wants to create an Epic entity in Acme Inc / Design Engineering</p>
      </div>
    </div>
    <div class="s08-approval-payload-box">
      <div class="s08-approval-payload-header">
        <span class="s08-approval-method">POST</span>
        <span class="s08-approval-endpoint">/api/v2/workspaces/AcmeInc/epics</span>
        <button class="s08-approval-copy-btn" type="button" title="Copy Payload">Copy</button>
      </div>
      <pre class="s08-approval-payload-code"><code>{
  "title": "Universal Application Login",
  "workspaceName": "Acme Inc",
  "workAreaName": "Design Engineering",
  "priority": "High",
  "targetRelease": "Q4 2026 Enterprise Core Release"
}</code></pre>
    </div>
    <div class="s08-approval-annotations-badge" id="s08-approval-annotations" style="display:none;">
      <span>Review: <strong id="s08-approval-comment-count">0</strong> inline annotations attached in Editor</span>
    </div>
    <div class="s08-approval-actions">
      <button class="s08-approval-btn ghost" id="s08-approval-deny" type="button">Deny / Request Edits</button>
      <button class="s08-approval-btn ghost" id="s08-approval-always" type="button">Always allow in session</button>
      <button class="s08-approval-btn primary" id="s08-approval-allow" type="button">Allow once (↵)</button>
    </div>
  </div>
  ```

#### P0.3: Meso Staging Dock / Tray (`.s08-staging-dock`)
* **Reference**: Section 8.2 & Meso Staging Dock specification.
* **Purpose**: Pinned review ribbon directly docked above `#s08-chat-input-box` providing continuous ambient awareness of pending deliverable mutations.
* **Anatomy**:
  ```html
  <div class="s08-staging-dock" id="s08-staging-dock">
    <div class="s08-staging-row top">
      <span class="s08-staging-dot"></span>
      <span class="s08-staging-diff-stat">+68 lines</span>
      <span class="s08-staging-badge">EPIC-Draft</span>
      <span class="s08-staging-title">Acme Inc / Universal Application Login</span>
    </div>
    <div class="s08-staging-row bottom">
      <div class="s08-staging-left">
        <span class="s08-staging-count-pill">1 Jira Entity Staged</span>
      </div>
      <div class="s08-staging-right">
        <button class="s08-staging-btn reject" id="s08-staging-reject" type="button">Reject</button>
        <button class="s08-staging-btn approve" id="s08-staging-approve" type="button">Approve & Create</button>
      </div>
    </div>
  </div>
  ```

#### P0.4: Bi-Directional State Synchronization Bus
* Wire `s08-approval-allow` and `s08-staging-approve` to trigger the same execution handler.
* On approve:
  1. Transition Approval Card into `<TraceLine status="completed">` with `✓ [Tool] Created Epic EPIC-104 in Jira [IN-104] (142ms)`.
  2. Transition Staging Dock out with `150ms ease-out` collapse.
  3. Emit SSE logs into `.s08-view-log-viewer`.
  4. Render completion message receipt with `[EPIC-104 ↗]` linking to the embedded Browser tab.

---

### Phase P1: Scoping, Onboarding & Editor Annotations
*Goal: Provide a seamless, keyboard-first scoping and review experience with zero input friction.*

#### P1.1: Scope Setup Bar Collapse & Agent Guidance Card
* When the user picks a Workspace / Folder from `#s08-scope-setup-bar` or Sidebar:
  1. Collapse `#s08-scope-setup-bar` with CSS transition:
     ```css
     .s08-scope-setup-bar.is-collapsed {
       max-height: 0;
       opacity: 0;
       margin-bottom: 0;
       padding-top: 0;
       padding-bottom: 0;
       pointer-events: none;
       transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
     }
     ```
  2. Inject `.s08-agent-guidance-card` into the empty chat river:
     ```html
     <div class="s08-agent-guidance-card" id="s08-agent-guidance-card">
       <div class="s08-guidance-header">
         <div class="s08-guidance-avatar">BA</div>
         <div class="s08-guidance-meta">
           <h3 class="s08-guidance-name">Business Analysis Agent</h3>
           <p class="s08-guidance-role">Productivity Specialist • Jira Enterprise</p>
         </div>
         <div class="s08-guidance-scope-pill" id="s08-guidance-scope-pill">
           <span>Scoped to: <strong>Acme Inc / Design Engineering</strong></span>
           <button class="s08-guidance-change-btn" id="s08-guidance-change-btn" type="button">Change</button>
         </div>
       </div>
       <p class="s08-guidance-desc">
         I decompose business requirements into formal Epics, Features, User Stories, and Acceptance Test Cases, synced directly to Jira with Human-In-The-Loop validation.
       </p>
       <div class="s08-guidance-suggestions">
         <div class="s08-guidance-suggestions-label">Suggested Actions:</div>
         <button class="s08-suggestion-chip" type="button" data-prompt="I want to create an epic for Universal Application Login with Okta SSO and WebAuthn MFA">
           <span class="s08-chip-tag">[Epic]</span>
           <span class="s08-chip-title">Create an Epic</span>
           <span class="s08-chip-preview">"I want to create an epic for Universal Application Login..."</span>
         </button>
         <button class="s08-suggestion-chip" type="button" data-prompt="Create features for epic id:IN-104">
           <span class="s08-chip-tag">[Feat]</span>
           <span class="s08-chip-title">Create Features for an Epic</span>
           <span class="s08-chip-preview">"Create features for epic id:IN-104..."</span>
         </button>
         <button class="s08-suggestion-chip" type="button" data-prompt="Create user stories for the feature id:FEAT-201">
           <span class="s08-chip-tag">[Story]</span>
           <span class="s08-chip-title">Generate User Stories</span>
           <span class="s08-chip-preview">"Create user stories for the feature id:FEAT-201..."</span>
         </button>
         <button class="s08-suggestion-chip" type="button" data-prompt="Create test cases for user story id:US-301">
           <span class="s08-chip-tag">[Tests]</span>
           <span class="s08-chip-title">Generate Test Cases</span>
           <span class="s08-chip-preview">"Create test cases for user story id:US-301..."</span>
         </button>
       </div>
     </div>
     ```

#### P1.2: In-Composer Mention Popover (`@`) & Token Pills (`.s08-token-pill`)
* Listen for `@` character input in `#s08-chat-input-box`.
* Calculate cursor coordinates using a hidden mirror div or `selectionStart`.
* Display floating popover:
  ```html
  <div class="s08-mention-menu" id="s08-mention-menu">
    <div class="s08-mention-header">Insert Context Mention</div>
    <div class="s08-mention-item selected" data-type="workspace">
      <span class="s08-mention-icon">[WS]</span>
      <div class="s08-mention-info">
        <span class="s08-mention-title">@workspace</span>
        <span class="s08-mention-sub">Set active Workspace & Work Area</span>
      </div>
    </div>
    <div class="s08-mention-item" data-type="file">
      <span class="s08-mention-icon">[Doc]</span>
      <div class="s08-mention-info">
        <span class="s08-mention-title">@file</span>
        <span class="s08-mention-sub">Attach local PRD or specification document</span>
      </div>
    </div>
    <div class="s08-mention-item" data-type="onedrive">
      <span class="s08-mention-icon">[Cloud]</span>
      <div class="s08-mention-info">
        <span class="s08-mention-title">@onedrive</span>
        <span class="s08-mention-sub">Import document from corporate OneDrive</span>
      </div>
    </div>
  </div>
  ```
* When `@workspace` is selected, expand cascading submenu of available workspaces:
  - `Acme Inc` $\rightarrow$ `Design Engineering (Active)`, `Sales & Marketing`, `Travel`
  - `Stark Industries` $\rightarrow$ `Core Infrastructure`
* Upon selection, replace the `@workspace` text with an inline interactive token pill:
  ```html
  <span class="s08-token-pill" contenteditable="false" data-ws="Acme Inc" data-wa="Design Engineering">
    <span class="s08-token-pill-label">@workspace: Acme Inc / Design Engineering</span>
    <button class="s08-token-pill-remove" type="button" title="Remove scope tag">×</button>
  </span>
  ```

#### P1.3: Plain English Scope Normalizer
* In `main.js`, add regex pattern matching in `handleUserPromptSubmit`:
  ```javascript
  const scopePattern = /in\s+workspace\s+['"]?([^'"]+?)['"]?\s+and\s+work\s*area\s+['"]?([^'"]+?)['"]?,?/i;
  ```
* When detected:
  1. Extract `workspace` and `workArea`.
  2. Synchronize `window.SutraSessionState`.
  3. Update sidebar workspace menu badges.
  4. In the rendered user chat bubble, replace the text pattern with the formatted token pill component.

#### P1.4: Editor Inline Commenting System
* In `.s08-view-editor`, bind mouseup event listener on the rendered markdown document:
  1. Detect text selection (`window.getSelection()`).
  2. If selection is valid and length > 3 characters, display floating comment icon button `[+ Add Comment]`.
  3. Clicking button opens docked `.s08-inline-comment-box`:
     ```html
     <div class="s08-inline-comment-box" id="s08-inline-comment-box">
       <div class="s08-comment-input-wrap">
         <textarea class="s08-comment-input" placeholder="Leave a review comment..." rows="2"></textarea>
       </div>
       <div class="s08-comment-actions">
         <button class="s08-comment-btn ghost" id="s08-comment-cancel" type="button">Cancel</button>
         <button class="s08-comment-btn primary" id="s08-comment-submit" type="button" disabled>Add Comment</button>
       </div>
     </div>
     ```
  4. On submit, wrap the selected text with `<mark class="s08-highlighted-comment">` and mount an anchored comment card in the right margin:
     ```html
     <div class="s08-margin-comment-card" data-comment-id="cmt-1">
       <div class="s08-comment-card-header">
         <span class="s08-comment-author">Sarah Jenkins</span>
         <span class="s08-comment-time">Just now</span>
       </div>
       <div class="s08-comment-card-body">
         Ensure session timeout is explicitly set to 15 minutes of inactivity across all client apps.
       </div>
     </div>
     ```
  5. Increment the annotations count badge on the In-Stream Approval Card (`.s08-approval-annotations-badge`).

---

### Phase P2: Agile Chaining, Resilient Guidance & Self-Healing
*Goal: Complete the chained downstream decomposition pipeline and eliminate all user failure states.*

#### P2.1: Response Keeping State Machine & Downstream Chaining
* Implement global persistent session registry:
  ```javascript
  window.SutraSessionState = {
    workspace: 'Acme Inc',
    workArea: 'Design Engineering',
    responseKeeper: {
      lastCreatedArtifactType: null,
      lastCreatedEpicId: null,
      lastCreatedEpicKey: null,
      createdFeatureKeys: [],
      createdStoryKeys: [],
      createdTestCaseKeys: []
    }
  };
  ```
* Expand `generateAgentResponse()` prompt branching to handle the 4 canonical stages:
  1. **Stage 1 (Create Epic)**: Generates `EPIC-104`, commits, sets `lastCreatedEpicId = "IN-104"`.
  2. **Stage 2 (Create Features)**: Prompts like `"Create features for epic id:IN-104"`:
     - Retrieves parent `IN-104` from Response Keeper.
     - Projects `FEAT-201`, `FEAT-202`, `FEAT-203`, `FEAT-204` into stage and artifacts panel.
     - Triggers HITL approval card for feature batch.
  3. **Stage 3 (Create User Stories)**: Prompts like `"Create user stories for feature id:FEAT-201"`:
     - Generates stories with Gherkin criteria (`US-301`, `US-302`, `US-303`).
     - Triggers HITL approval card.
  4. **Stage 4 (Create Test Cases)**: Prompts like `"Create test cases for story id:US-301"`:
     - Generates acceptance test suites (`TC-501`, `TC-502`).
     - Triggers HITL approval card.

#### P2.2: Interactive Clarification Gate Card (`.s08-clarification-card`)
* Mounts in Column 1 when requirements lack specific parameters:
  ```html
  <div class="s08-clarification-card">
    <div class="s08-clarification-header">
      <span class="s08-clarification-badge">[Clarification Required]</span>
      <h4 class="s08-clarification-title">Target Release Milestone</h4>
    </div>
    <p class="s08-clarification-question">Which delivery milestone should this Epic target?</p>
    <div class="s08-clarification-options">
      <label class="s08-clarification-option selected">
        <input type="radio" name="milestone" value="Q4 2026 Core Release" checked />
        <span>Q4 2026 Enterprise Core Release (Recommended)</span>
      </label>
      <label class="s08-clarification-option">
        <input type="radio" name="milestone" value="Q1 2027 Mobile Wave" />
        <span>Q1 2027 Mobile & Identity Wave</span>
      </label>
      <div class="s08-clarification-custom-wrap">
        <input type="text" class="s08-clarification-input" placeholder="Custom Release Name / Backlog..." />
      </div>
    </div>
    <div class="s08-clarification-actions">
      <button class="s08-clarification-submit-btn" type="button">Submit Answer</button>
    </div>
  </div>
  ```

#### P2.3: Zero-Error Missing Scope Guidance Card (`.s08-scope-resolution-card`)
* Mounts when prompt has no scope specified:
  ```html
  <div class="s08-scope-resolution-card">
    <div class="s08-scope-res-header">
      <span class="s08-scope-res-icon">[Scope Required]</span>
      <h4 class="s08-scope-res-title">Select Target Jira Workspace & Work Area</h4>
    </div>
    <p class="s08-scope-res-body">
      I have prepared your Epic for <strong>"Universal Application Login"</strong>. Before we commit it to Jira, please select which Workspace and Work Area this belongs to:
    </p>
    <div class="s08-scope-res-chips">
      <button class="s08-scope-res-chip primary" type="button" data-ws="Acme Inc" data-wa="Design Engineering">
        <span>@workspace: Acme Inc / Design Engineering (Recommended)</span>
      </button>
      <button class="s08-scope-res-chip" type="button" data-ws="Acme Inc" data-wa="Sales & Marketing">
        <span>@workspace: Acme Inc / Sales & Marketing</span>
      </button>
      <button class="s08-scope-res-chip" type="button" data-ws="Stark Industries" data-wa="Core Infrastructure">
        <span>@workspace: Stark Industries / Core Infrastructure</span>
      </button>
    </div>
  </div>
  ```
* Clicking any chip immediately binds the scope, updates the sidebar, collapses `#s08-scope-setup-bar`, and automatically fires the buffered Epic generation without making the user re-type anything.

---

## 5. Architectural Guardrails & Invariants

To guarantee long-term stability and prevent code regressions, all future pull requests and agent edits must strictly respect the following guardrails:

1. **Zero New Design Tokens**:
   - Do **NOT** create new tokens in `tokens.css`. Use existing tokens or the approved Atlassian Jira enterprise palette:
     - Primary Blue: `#0052CC` (hover `#0747A6`)
     - Text Primary: `#091E42` / `#172B4D`
     - Text Secondary: `#42526E` / `#5E6C84`
     - Borders: `#DFE1E6` / `#EBECF0`
     - Neutral Surface: `#F4F5F7`
     - Status Lozenges: `#DFE1E6` (Defined), `#DEEBFF` (In Progress), `#E3FCEF` (Done).
2. **Strict Color & Icon Discipline**:
   - **Zero Pink or Purple**: No `#8B5CF6`, `#7C3AED`, or purple gradients in Jira views, ticket receipts, or approval cards.
   - **Zero Raw Unicode Emojis**: Replace all emojis (`⚡`, `🤖`, `▲`, `🔒`, `●`, `💬`, `📋`) with clean SVG vector paths or semantic brackets like `[Jira]`, `[Epic]`, `[Feat]`, `[Copy]`.
3. **Zero Layout Shifts**:
   - Do **NOT** alter the 3-pane shell width proportions or the behavior of `#s08-canvas-splitter`.
   - The Meso Staging Dock (`.s08-staging-dock`) sits cleanly docked inside Column 1 above `#s08-chat-input-box`.
   - The Stage/Editor stays housed inside Column 2 (`.s08-tabs-canvas`).
4. **Single Source of Truth**:
   - All components must read and write to `window.SutraSessionState`.
   - A workspace change in the Sidebar must immediately update the Scope Bar, Guidance Card, and active Composer scope tags.
5. **Keyboard Accessibility**:
   - `Enter`: Triggers `Allow once` on the Approval Card when focused.
   - `Esc`: Closes mention popovers and inline comment boxes.
   - `Ctrl+Alt+M` / `⌘+Alt+M`: Triggers the inline comment box on the active text selection in the editor.

---

## 6. Document Cross-References
* Operational Lifecycle: [business_analysis_agent_end_to_end_execution_guide.md](file:///c:/Users/Surya%20Teja%20S/OneDrive/Documents/Agentic%20AI%20research/sutra-ui/docs/business_analysis_agent_end_to_end_execution_guide.md)
* Interface Architecture: [interface_sections_purpose_guide.md](file:///c:/Users/Surya%20Teja%20S/OneDrive/Documents/Agentic%20AI%20research/sutra-ui/docs/interface_sections_purpose_guide.md)
* Shell Layout Specification: [workspace_layout_specification.md](file:///c:/Users/Surya%20Teja%20S/OneDrive/Documents/Agentic%20AI%20research/sutra-ui/docs/workspace_layout_specification.md)
