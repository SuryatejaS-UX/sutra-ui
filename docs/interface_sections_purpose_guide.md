# Sutra UI — Interface Sections & Purpose Guide

> **Version**: 1.0  
> **Last Updated**: 25 October 2026  
> **Scope**: Every user-facing section across the Sutra application — what it is, why it exists, and when it appears.

---

## Table of Contents

1. [Application Shell Overview](#1-application-shell-overview)
2. [Zone 1 — Primary Navigation Dock (Icon Rail)](#2-zone-1--primary-navigation-dock-icon-rail)
3. [Zone 2 — Agent Catalogue (Landing View)](#3-zone-2--agent-catalogue-landing-view)
4. [Zone 3 — Agent Workspace (Active Session View)](#4-zone-3--agent-workspace-active-session-view)
   - [3A — Collapsible Sidebar](#4a-collapsible-sidebar)
   - [3B — Conversational Section (Column 1)](#4b-conversational-section-column-1)
   - [3C — Tabs Panel (Column 2)](#4c-tabs-panel-column-2)
5. [Agent-Specific Context Section](#5-agent-specific-context-section)
6. [Overlays & Modals](#6-overlays--modals)
7. [Cross-Cutting UI Elements](#7-cross-cutting-ui-elements)
8. [Section Visibility Matrix](#8-section-visibility-matrix)

---

## 1. Application Shell Overview

The Sutra application is a **single-page agentic AI workspace** that operates inside a fullscreen app shell. The outermost layout is composed of three nested containers:

| Container | Class | Purpose |
|---|---|---|
| Viewport Wrapper | `.sutra-viewport-wrapper` | Fills the browser window (100vw × 100vh). Provides the root surface and background color. |
| App Window | `.sutra-app-window` | The visible "application frame" inside the viewport — sets boundaries, rounds corners, and applies the chosen surface theme. |
| App Shell | `.sutra-app-shell` | The flexbox row that lays out the Primary Dock and the main content area side by side. |

The shell has **two mutually exclusive primary views**:

| View | When Shown |
|---|---|
| **Agent Catalogue** | Default landing state. No agent is selected yet. |
| **Agent Workspace** | Activates when a user clicks "Use Agent" on any agent card. |

---

## 2. Zone 1 — Primary Navigation Dock (Icon Rail)

**Location**: Far-left thin vertical strip, always visible.  
**Class**: `.sutra-icon-dock`  
**Width**: Fixed 48px (collapsed) / 64px (expanded states).

### Purpose

The Primary Dock is the **persistent global navigation rail** — it is always visible regardless of which view (Catalogue or Workspace) is active. It provides single-click access to top-level application destinations and system utilities.

### Sections Within the Dock

| Position | Button | Purpose |
|---|---|---|
| **Top Cluster** | Agent Catalogue | Navigates back to the Agent Catalogue view where users discover and select agents. Active by default on launch. |
| | Workspaces | Opens the Workspaces/Projects browser where users can manage their organizational workspaces and work areas. |
| **Bottom Cluster** | Surface Theme Switcher | Opens a popover with 4 surface color themes (Modern Crisp, Contrast Dock, Warm Minimalist, Obsidian Dark). Lets users change the visual appearance of the entire application in real time. |
| | Settings | Opens application settings (preferences, API keys, integrations, etc.). |
| | Button Variations | Design system reference — opens a modal showcasing the 4 canonical button styles (Primary, Secondary, Ghost, Text). This is a dev/design tool. |
| | Profile | Opens user account/profile management. |

### Surface Theme Switcher (Popover)

When the theme button is clicked, a popover menu appears with:

| Theme | Description |
|---|---|
| Modern Crisp (Default) | Slate-50 & pure white — clean, minimal, professional. |
| Contrast Dock | Obsidian dock & white canvas — high-contrast navigation. |
| Warm Minimalist | Warm zinc canvas & soft gray — softer, warmer tones. |
| Obsidian Dark | Zero-glare enterprise dark — full dark mode. |

**Why it exists**: Different users prefer different visual environments. Enterprise users often work in well-lit offices (light themes), while developers coding at night prefer dark themes. The switcher provides instant, no-reload theme toggling.

---

## 3. Zone 2 — Agent Catalogue (Landing View)

**Location**: Fills the main content area (everything right of the dock).  
**Class**: `.sutra-catalogue-container`  
**Visible When**: No agent session is active (default landing state).

### Purpose

The Agent Catalogue is the **discovery and selection hub** for all available AI agents. It lets users browse, search, filter, and select a specialized agent to begin a task session.

### Sub-Sections

#### 3.1 Catalogue Header
- **Title**: "Agent Catalogue"
- **Subtitle**: Explains the purpose — "Discover and deploy specialized AI agents tailored for specific tasks."
- **Why**: Provides immediate context so first-time users understand what this page is for.

#### 3.2 Catalogue Toolbar

| Component | Purpose |
|---|---|
| **Search Box** | Free-text search to find agents by name or task description (e.g., "code generation", "data analysis"). |
| **Category Filter Pills** | Pill tabs (All, Development, Writing, Data, Productivity, Design) that filter the agent grid by category. Only one category can be active at a time. |
| **View Switcher** | Toggles between two views: **Card Grid** (visual cards) and **Table View** (dense data table). Accommodates different browsing preferences — visual scanning vs. data-dense comparison. |

**Why the toolbar exists**: With 10+ agents across multiple categories, users need quick ways to narrow down which agent to use. The combined search + filter + view toggle provides multiple discovery paths.

#### 3.3 Agent Cards Grid (View 1)

Displays agents as visual cards in a responsive grid. Each card shows:

| Element | Purpose |
|---|---|
| **Agent Icon** | Color-coded category icon for instant visual identification (blue = Development, purple = Writing, green = Data, etc.). |
| **Agent Name** | The agent's display name (e.g., Synthetix, Lexi, DataWeaver). |
| **Version** | Current agent version (e.g., v2.4.1). Shows the agent is actively maintained. |
| **Rating** | Star rating (e.g., 4.9 ★). Social proof — helps users assess agent quality. |
| **Description** | One-line summary of the agent's capabilities. |
| **User Count** | How many users are using this agent (e.g., 12.4k users). Additional social proof. |
| **"Use Agent" Button** | Clicking this transitions from the Catalogue to the Agent Workspace with that agent loaded. |

**Available Agents** (as catalogued):

| Agent | Category | Specialization |
|---|---|---|
| Synthetix | Development | Code generation and refactoring (React, Node, Python) |
| Lexi | Writing | Copywriting, editing, blogs, marketing copy, documentation |
| DataWeaver | Data | Data analysis and visualization, CSV processing, Python plots |
| SecureOps | Productivity | Security auditing, configuration and code vulnerability scanning |
| Business Analysis | Productivity | Epics, user stories, test cases for Jira with HITL approval |
| Anomaly Detection | Data | Spikes/outliers detection (Isolation Forest, IQR, statistical baselines) |
| Data Forecasting | Data | Trend forecasting (EWMA, SARIMA, signal regimes) |
| Data Profiler | Data | Schema discovery, ER diagrams, metadata profiling, data quality |
| ReactSculptor | Design | Converts wireframes/descriptions into production React components |
| General Assistant | Productivity | Versatile everyday AI for general questions and brainstorming |

#### 3.4 Agent Data Table (View 2)

A table view with sortable columns: Agent Name, Category, Version, Rating, Users, Action. Populated dynamically from the card data.

**Why two views**: Power users who compare multiple agents prefer the dense table; casual users prefer the visual card layout.

#### 3.5 Empty State

Shown when search/filter yields zero results. Displays a robot icon, "No agents found" heading, and guidance to adjust the search query or filters.

#### 3.6 Pagination

Bottom of the catalogue. Shows "Showing 1–8 of 10 agents" with Previous/Next buttons and page number indicators. Prevents overwhelming the user with too many cards at once.

---

## 4. Zone 3 — Agent Workspace (Active Session View)

**Location**: Replaces the Catalogue view when an agent is selected.  
**Class**: `.sutra-workspace-view`  
**Visible When**: A user clicks "Use Agent" on any agent card.

The workspace is a **three-zone horizontal layout**:

```
┌────────────────────────────────────────────────────────────────────┐
│ Dock │ Sidebar │ Conversation Column │ Resizer │ Tabs Column      │
│ 48px │ 15-20%  │      variable       │  drag   │   variable       │
└────────────────────────────────────────────────────────────────────┘
```

---

### 4A. Collapsible Sidebar

**Class**: `.s08-sidebar`  
**Default State**: Collapsed (body class `s08-sidebar-collapsed`).  
**Resizable**: Yes — drag resizer or toggle button.

#### Purpose

The sidebar is the **navigation and organizational backbone** of the workspace. It holds the agent/workspace switchers, project groups, and conversation history.

#### Sub-Sections of the Sidebar

##### 4A.1 Agent Switcher Header

| Element | Purpose |
|---|---|
| **Agent Logo Badge** | 2-letter abbreviation of the current agent (e.g., "AG" for Agent General). Quick visual identification. |
| **Agent Name** | Current agent's full name. |
| **Agent Role** | One-line specialty descriptor (e.g., "Autonomous Specialist"). |
| **Chevron Toggle** | Opens a dropdown to switch between recently used agents. |

**Agent Switcher Dropdown**: Lists the **last 6 recently used agents** for fast switching. Each entry shows the agent name and its role/specialty. A checkmark indicates the currently active agent. At the bottom, a "View Catalogues" button navigates back to the full Agent Catalogue.

**Why it exists**: Users frequently work with multiple agents in a single session. The switcher eliminates the need to go back to the catalogue every time — just click to swap agents.

##### 4A.2 Workspace Switcher Header

| Element | Purpose |
|---|---|
| **Workspace Name** | Current workspace (organization/team). Default: "Select Workspace". |
| **Work Area Label** | The sub-area within the workspace. |
| **Chevron Toggle** | Opens a cascading dropdown to switch workspace + work area. |

**Workspace Switcher Dropdown**: Two-level cascading menu.
- **Level 1**: Lists available workspaces (e.g., Acme Inc, Stark Industries, Global Logistics) with their plan type (Enterprise, Growth, Production).
- **Level 2**: On hover/click of a workspace, shows its work areas (e.g., Design Engineering, Sales & Marketing, Travel).
- **"Connect Work Area..."**: Action at the bottom of each workspace's submenu to add a new work area.

**Why it exists**: In enterprise environments, users belong to multiple organizations and teams. The workspace switcher lets them scope their agent session to the correct organizational context without leaving the workspace.

##### 4A.3 New Task Button

A prominent button labeled "New task" with a `⌘N` keyboard shortcut. Creates a fresh conversation/task session with the currently active agent.

**Why it exists**: Users need a clear, always-accessible way to start a new conversation. The keyboard shortcut enables power-user speed.

##### 4A.4 Projects Section

**Collapsible**: Yes (default collapsed).

A grouping mechanism where users can organize multiple conversations into named project folders.

| Element | Purpose |
|---|---|
| **Section Header** | "Projects" label with folder icon. Has a `+` button to create new projects and a collapse chevron. |
| **New Project Creator** | Inline input field (hidden by default, shown on `+` click) with Save/Cancel buttons. |
| **Project Folders** | Each project is an expandable folder containing nested task conversations. Shows project name, task count, and a kebab menu for folder options. |
| **Nested Tasks** | Tasks within a project show task title, date, and hover actions (pin, kebab menu for rename/delete/share/move). |

**Example Projects**: Design Engineering (2 tasks), Sales & Marketing (2 tasks), Travel (1 task).

**Why it exists**: Without projects, the sidebar becomes a flat, unorganized list of conversations. Projects let users group related tasks (e.g., all design system tasks in one folder) for easy retrieval and context.

##### 4A.5 Recent Tasks Section

**Collapsible**: Yes (default expanded).

Lists all recent conversations grouped by date, with actions on each.

| Element | Purpose |
|---|---|
| **Section Header** | "Recent Tasks" with clock icon. Has actions: New Task (+), Search (magnifying glass), Sort, and Collapse. |
| **Search Input** | Toggle-able search box to filter tasks by name. |
| **Date Sub-Groups** | Today, Yesterday, Previous 7 Days — provides temporal context. |
| **Task Items** | Each shows: task title, timestamp (swaps with action buttons on hover), pin button, kebab menu. |
| **Pinned Tasks** | Pinned tasks appear with a visual indicator and are always at the top of their date group. |
| **View All Button** | Shows overflow tasks hidden by default. Displays total count (e.g., "View all (11)"). |

**Why it exists**: Conversation history is critical — users need to quickly find and resume previous tasks. Date grouping and pinning provide natural organization, while search handles large histories.

---

### 4B. Conversational Section (Column 1)

**Class**: `.s08-conversation-col`

The left column of the workspace — the primary interaction surface where the user communicates with the agent.

#### Sub-Sections

##### 4B.1 Conversation Header Bar

| Element | Purpose |
|---|---|
| **Sidebar Toggle** | `[│]` icon button that expands/collapses the navigation sidebar. |
| **Separator** | Vertical divider between the sidebar toggle and breadcrumbs. |
| **Breadcrumbs** | Shows the navigation path. When a task is inside a project: `Project Name / Task Name`. When standalone: just `New task`. |
| **New Task Button** | Visible only when the sidebar is collapsed — duplicate affordance so users always have access to "New task" even with sidebar hidden. |
| **Right Sidebar Toggle** | `[│]` icon to reopen the tabs panel if it was collapsed. Visible only when the right column (tabs panel) is closed. |

**Why it exists**: The header provides wayfinding (breadcrumbs) and critical toggle controls that remain accessible regardless of sidebar state. The conditional visibility of the New Task and Right Sidebar buttons prevents UI clutter when those controls aren't needed.

##### 4B.2 Scope Selector (Workspace / Folder)

**Class**: `.s08-scope-setup-bar`

A specialized 2-level dropdown in the conversation body that sets the execution context for the agent.

| Level | What It Sets | Purpose |
|---|---|---|
| **Primary (Workspace)** | The codebase / repository | Tells the agent which code repository to work with. |
| **Secondary (Folder)** | The execution sandbox / environment | Tells the agent which environment (Development Sandbox, Staging Preview, Production) to target. |

**Dropdown Structure**: Cascading submenu — Level 1 shows workspace names (web-platform, core-api, agent-research), Level 2 shows folders within each workspace. Also includes a "Connect New Repository..." action.

**Context Note**: Below the dropdown, a text note explains: "Primary: Workspace (codebase) • Secondary: Folder (execution sandbox)".

**Why it exists**: Agents (especially coding agents) need to know *where* to operate. Without scope, the agent would have no context about which files to read, which environment to deploy to, or which repository to modify. This is essential for multi-repo, multi-environment organizations.

##### 4B.3 Messages Stream

**Class**: `.s08-messages-stream`

The scrollable area where the conversation between the user and agent is displayed. Shows user prompts and agent responses in a threaded dialogue format.

**Why it exists**: This is the core interaction surface — the conversational interface through which users instruct agents, receive responses, review generated code, approve/reject suggestions, and iterate on tasks.

##### 4B.4 Chat Input (Prompt Composer & Adaptive Questionnaire)

**Class**: `.s08-chat-input-box`

The bottom-pinned input area where users type their prompts, featuring a dual-mode adaptive architecture.

###### Mode A: Standard Prompt Composer (Default)

| Element | Purpose |
|---|---|
| **Textarea** | Auto-expanding textarea for composing prompts. Placeholder text provides guidance (e.g., "What is the loan disbursement forecast for this month?"). |
| **Attachment Button (+)** | Lets users attach files, images, or tools to their prompt — provides the agent with additional context. |
| **Agent Pill Selector** | An inline pill inside the input bar showing the active agent name. Clicking opens a dropdown to switch agents without leaving the conversation. Truncates long names to 16 chars with tooltip. |
| **Voice Input Button** | Microphone icon for voice-to-text input — accessibility and convenience for long prompts. |
| **Send Button** | Arrow icon to submit the prompt. Disabled until text is entered. Keyboard shortcut: Enter. |

###### Mode B: Adaptive Questionnaire Mode (`.is-questionnaire-mode`)

When an agent detects missing information or needs structured human input (e.g. Stage 6 of the Business Analysis Agent), the container **smoothly morphs in-place from 56px to ~320px–360px** into a multi-step questionnaire inspired by shadcn/ui primitives:

| Element | Purpose |
|---|---|
| **Step Indicator** | Shows current progress (e.g., `Question 2 of 3`) in muted text. Max 3–4 questions to prevent survey fatigue. |
| **Question Heading** | Bold, clear question title explaining what decision is needed. |
| **Instruction Subtitle** | Helper text indicating single-select or multi-select (`Select all that apply, or skip this question.`). |
| **Option Cards** | Rounded border tiles with selection glyphs (checkboxes/radios), medium-weight labels, and right-aligned keyboard shortcut badges (`[A]`, `[B]`, `[C]`, `[D]`). Pressing keycap toggles the choice. |
| **[Previous] Button** | Secondary outline button allowing users to navigate back and revise earlier answers. Disabled on Step 1. |
| **[Skip] Button** | Essential escape hatch allowing users to bypass a question. When clicked, the agent applies an intelligent domain default. |
| **[Next] / [Submit]** | Primary solid action button. Advances to the next step, or submits the completed answers and triggers reverse morphing back to Mode A. |

**Why it exists**: The prompt composer is the user's primary tool for communicating with the agent. By dynamically morphing into the questionnaire when clarification is required, user interaction happens **right where their hands and cursor already rest (Fitts's Law)**, while modal state prevents typing uncoordinated prompts during a blocking pause. Upon submission, it collapses back to Mode A and posts an auditable summary record to the message stream.

##### 4B.5 Docked Review Ribbon (Meso Staging Dock)

**Class**: `.s08-docked-review-ribbon`  
**Location**: Docked directly above the chat input box at the bottom of Column 1.

A persistent operational dock that expands whenever an autonomous agent stages deliverables, file modifications, or enterprise entities (e.g. `+68 lines EPIC-Draft`).

| Element | Purpose |
|---|---|
| **Staging Indicator Icon** | Amber pulsing dot (`[●]`) indicating pending uncommitted deliverables. |
| **Diff & Entity Footprint** | Shows exact net line changes and entity label (e.g. `+68 lines EPIC-Draft`, `Acme Inc / Universal Application Login`). |
| **Staged Items Counter** | Badge indicating quantity (e.g. `1 Jira Entity Staged`). |
| **Reject / Request Edits** | Rejects the staged artifact and focuses the composer for feedback input. |
| **Approve & Create Button** | High-contrast action button that authorizes execution and commits the deliverable. |

###### Dual-Surface Governance Rationale (Why in Two Places):
The Docked Review Ribbon operates in **bi-directional synchronization** with the **In-Stream Tool Approval Card (Section 7.4)**:
1. **Separation of Concerns**: The In-Stream Card governs the **API Tool Permission** (`jira_create_epic`), while the Docked Ribbon visualizes the **Deliverable File Footprint** (`+68 lines diff`).
2. **Scroll Resilience (Fitts's Law)**: In-stream chat messages scroll off-screen as conversation streams. The Docked Ribbon stays permanently pinned above the user's hands at the keyboard—zero scroll hunting.
3. **Auditability vs. Transient Action**: The In-Stream Card remains in the transcript forever as an immutable audit receipt; the Docked Ribbon mounts only while changes are staged and cleanly dismisses upon commit.
4. **Single State Machine**: Approving on *either* surface instantly resolves both. There is zero redundant double-work.

---

### 4C. Tabs Panel (Column 2)

**Class**: `.s08-tabs-col`

The right column of the workspace — a multi-tab container that hosts various tool views the agent and user need during a session.

#### Sub-Sections

##### 4C.1 Tab Bar Header

| Element | Purpose |
|---|---|
| **Expand/Restore Button** | Toggles the tabs panel between split-width and full-width. When expanded, the conversation column is hidden for maximum tab space. |
| **Tab Pills** | Horizontal scrollable list of open tab pills. Each pill has a label and a close (×) icon. Active tab is visually highlighted. Multiple tabs can be open simultaneously. |
| **Add Tab Button (+)** | Opens a dropdown to add new tab panes: Editor, Browser, Log Viewer, Artifacts. |
| **Tab Overflow Dropdown (▼)** | Appears when too many tabs are open to fit. Shows a badge with the count and lists all open tabs in a dropdown. |
| **Close Panel Button (✕)** | Closes the entire tabs panel, giving the conversation column full width. |

**Available Tab Types**:

| Tab | Purpose |
|---|---|
| **Artifacts** | File management — upload, browse, and view attached or generated files. |
| **Editor** | Code/document viewer and editor with syntax highlighting, markdown preview, diff view, and SVG diagram support. |
| **Browser** | Embedded web browser for previewing applications, testing local dev servers, or inspecting live pages. |
| **Log Viewer** | Real-time execution log stream showing agent runtime events, scope resolution, and status messages. |

##### 4C.2 Artifacts / Sources View (Agent-Specific Context)

> [!IMPORTANT]
> This section dynamically changes its content based on the currently active agent type.

**Two Variants**:

###### Variant A — File Tree (Coding Agents like Synthetix)

**Class**: `.s08-synthetix-files-view`  
**Shown When**: The active agent is a **coding/development agent** (e.g., Synthetix).

| Element | Purpose |
|---|---|
| **Title Bar** | Shows "Workspace Tree" with the selected workspace name. Includes a "Collapse all" action. |
| **Empty State** | When no workspace is selected: Shows folder icon, "No Workspace Selected" title, and guidance to select a workspace scope. Includes a "Select Scope" button. |
| **File Tree** | Hierarchical tree view of the project's files and folders. Each file/folder shows: expand/collapse chevron (folders), file/folder icon, name, and change badge (M = Modified, + = Added). Supports nested folders. Active file is highlighted. |

**Why it exists**: Coding agents need direct access to the project's file structure. The file tree lets users see which files have been modified or created by the agent, navigate to specific files, and understand the scope of changes. The change badges (M, +) provide instant diff awareness — users can see what's been touched without opening individual files.

**Example structure shown**:
```
src/
  ├── app.tsx [M]
  ├── forecast.ts [+]
  ├── tokens/
  │   ├── colors.json [M]
  │   └── typography.json [M]
  └── components/
      └── file-tree.tsx [+]
package.json [M]
README.md
```

###### Variant B — Artifacts Panel (All Non-Coding Agents)

**Class**: `.s08-artifacts-view`  
**Shown When**: The active agent is **any agent other than a coding agent** (e.g., Business Analysis, Lexi, DataWeaver, General Assistant).

| Element | Purpose |
|---|---|
| **Upload Dropzone** | Dashed drag-and-drop area for uploading files. Includes a cloud-upload icon, "Upload files" title, "Drag & drop or browse from device" subtitle, and a "Browse" button. |
| **Integration Source Buttons** | Quick-import pills for Google Drive and OneDrive — lets users pull files directly from cloud storage without downloading first. |
| **Search & Filter Toolbar** | Search input to find files by name, a filter button, and pill tabs (All, Uploaded, Generated) to filter artifacts by origin. |
| **Empty State** | When no artifacts exist: Shows a cube icon, "No artifacts yet" title, and guidance to upload files or generate outputs. |
| **Artifacts List** | Populated as users upload files or the agent generates outputs. Lists all files with metadata. |

**Why it exists**: Non-coding agents don't work with a repository file tree, but they still need file context. A Business Analysis agent might need a requirements PDF uploaded; a Data Forecasting agent needs a CSV. The artifacts panel provides a unified place to:
1. **Upload** input files for the agent to process
2. **View** files the agent has generated as output
3. **Filter** between user-uploaded vs. agent-generated files
4. **Import** from cloud integrations (Google Drive, OneDrive) for enterprise workflows

##### 4C.3 Browser View

**Class**: `.s08-view-browser`

An embedded web browser inside Column 2 of the workspace that supports two primary operating modes:

###### 1. Core Browser Toolbar Elements
| Element | Purpose |
|---|---|
| **Navigation Buttons** | Back, Forward, Reload — standard browser navigation with integrated history stack. |
| **URL Bar** | Address bar with verified SSL indicator (HTTPS lock icon). Pre-populated with default preview URLs or enterprise endpoints (e.g. `https://jira.enterprise.internal/epics/EPIC-104`). Users can type any URL. |
| **Close Button** | Closes the browser tab. |
| **Quick Launch Chips** | Provides instant one-click launch chips: `Jira: EPIC-104`, `localhost:3000`, `localhost:5173`, `Docs`. |

###### 2. Operating Modes
* **Mode A: Web Application Preview & Local Dev Server:**  
  When developing web applications, coding agents mount dev servers (`localhost:3000`). Users can interact with live applications, run end-to-end tests, or inspect responsive UI states without leaving Sutra IDE.
* **Mode B: Embedded Enterprise Jira / Jira Ticket Inspector:**  
  When enterprise agents commit deliverables to tracking systems (e.g., Jira / Jira), clicking the ticket receipt link (e.g., `[EPIC-104 ↗]`) loads the live enterprise ticket directly inside `.s08-view-browser`. Renders a standard two-column Agile issue view (70% main details with Gherkin scenarios, child features table `FEAT-201`..`FEAT-204`, and activity audit log; 30% metadata sidebar with status dropdown, story points, assignee, and bidirectional `[View Spec in Editor ↗]` link).

**Why it exists**: Context switching kills developer and analyst productivity. Redirecting out to an external operating system browser forces the user away from their active conversational stream and live diffs. Embedding both local servers and external SaaS tools (like Jira/Jira) inside `.s08-view-browser` keeps the user anchored in their unified agentic workbench, enabling side-by-side verification (e.g. `Browser + Editor` split view).

##### 4C.4 Editor / Stage View & Inline Commenting System

**Class**: `.s08-view-editor`

A code/document viewer and editor supporting multiple content types, equipped with a collaborative, agentic **Inline Commenting System**.

###### Core Toolbar & Render Modes

| Element | Purpose |
|---|---|
| **Top Bar** | Shows file icon, filename (e.g., `EPIC_Universal_Login.md`), and action buttons. |
| **Preview/Raw Toggle** | For markdown files: switches between rendered preview and raw source view. |
| **Action Buttons** | View Changes (diff), Copy Content, Download Deliverable, Close Stage. |
| **Content Views** | Supports 4 render modes: |
| | **Code/JSON View** — Syntax-highlighted code display. |
| | **Markdown Preview** — Rendered markdown with formatting. |
| | **Unified Diff View** — Git-style diff showing additions/deletions. |
| | **SVG Diagram View** — Renders SVG diagrams with zoom controls (zoom in/out, zoom level %, fit-to-view). |

###### Inline Commenting System (For Documents, Specs & Code Files)

The Editor supports Google Docs / Figma / Notion-style **inline contextual commenting**, enabling users to provide line-level critique on agent-generated deliverables:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ .s08-view-editor (Document Body with Margin Comment Rail)                              │
├─────────────────────────────────────────────────────────────────┬──────────────────────┤
│ 3. Right Panel — Interactive Artifact Studio: High-density      │ ┌──────────────────┐ │
│    workspace showing real-time anomaly charts [💬+]             │ │ 1                │ │
│                                                                 │ │ Ensure charts    │ │
│    ┌──────────────────────────────────────────────┐             │ │ support zoom &   │ │
│    │ Leave a comment...                           │             │ │ click events     │ │
│    │                                              │             │ │         [✎]  [🗑]│ │
│    │ 🎤                              Cancel  [Add]│             │ └──────────────────┘ │
│    └──────────────────────────────────────────────┘             │                      │
│                                                                 │ ┌──────────────────┐ │
│ ▌ TIP: We will deliver both a Visual Architecture Breakdown     │ │ 2                │ │
│ ▌ in Markdown and a Live Interactive Web Prototype App          │ │ Add test fixtures│ │
│                                                                 │ │ for offline mode │ │
│                                                                 │ │         [✎]  [🗑]│ │
│                                                                 │ └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┴──────────────────────┘
```

| Component | Behavior & Specification |
|---|---|
| **Selection Floating Trigger** | When text or code lines are selected, a floating blue comment button (`.s08-comment-trigger-btn`, `[+💬]`) appears at the end of the selection range. Hovering displays the tooltip: `Comment (Ctrl+Alt+M)`. |
| **Inline Comment Composer Box** | Clicking the trigger (or pressing `Ctrl+Alt+M` / `⌘+Alt+M`) opens an inline box (`.s08-inline-comment-box`) docked directly beneath the highlighted text range (styled with a soft blue selection tint `var(--selection-highlight, #cfe4fa)`).<br>• **Input Area**: Text field with placeholder *"Leave a comment"*. Auto-expands as typed.<br>• **Voice Input**: Microphone icon for audio comment dictation.<br>• **Actions**: `[Cancel]` (ghost text button) and `[Add Comment]` (solid primary button, enabled once text is present). |
| **Gutter Markers & Margin Rail** | Once submitted, the commented document block displays a color-coded vertical line in the margin (e.g. purple, green, blue) indicating an active annotation.<br>• In the right margin rail (`.s08-comment-rail`), an anchored **Comment Card** (`.s08-comment-card`) docks alongside the referenced text. |
| **Marginal Comment Cards** | Each card shows:<br>• Thread sequence badge (`1`, `2`, `3`) or user avatar.<br>• Comment body text.<br>• Quick actions on hover: `Edit` (pencil icon `✎`) and `Delete` (trash icon `🗑`) or `Resolve` (`✓`).<br>• Bidirectional navigation: Clicking a comment card scrolls and highlights its source passage; clicking highlighted text focuses and elevates its corresponding comment card. |
| **Agentic Closed-Loop HITL** | In Sutra UI, inline comments are not just human notes—they act as **structured feedback prompts for the Agent**. When the user clicks `[Request Edits]` in the conversation column or clicks `[Apply Comments to Spec]`, the agent ingests all active inline comments mapped to their exact line numbers to self-correct the deliverable with pinpoint accuracy. |

**Why it exists**: Generic chat feedback (e.g. *"In the third paragraph under acceptance criteria, change the timeout to 15 mins"*) is ambiguous, forcing the agent to guess which sentence the user meant. Inline commenting grounds human critique directly to the exact words or code lines, eliminating ambiguity and providing enterprise-grade collaborative review.

---

##### 4C.5 Log Viewer

**Class**: `.s08-view-log-viewer`

A real-time execution log stream.

| Element | Purpose |
|---|---|
| **Status Indicator** | Green dot showing the stream is active. |
| **Title** | "Agent Execution Stream". |
| **Action Buttons** | Clear log stream, Close log viewer. |
| **Log Rows** | Timestamped entries with severity tags (INFO, SCOPE, READY, WAIT) and messages describing agent runtime events. |

**Example log entries**:
```
[01:15:02] INFO  Agent runtime initialized with Agent General.
[01:15:05] SCOPE Workspace scope resolved: Acme Inc / Design Engineering.
[01:15:08] READY Sources and Browser canvas mounted.
[01:15:10] WAIT  Awaiting user prompt or task instruction...
```

**Why it exists**: Provides transparency into what the agent is doing behind the scenes. Critical for debugging (why did the agent fail?), for understanding scope resolution (which workspace did it pick up?), and for monitoring long-running tasks. Enterprise users need this audit trail.

##### 4C.6 No Tabs Open Placeholder

**Class**: `.s08-no-tabs-view`  
**Shown When**: All tabs have been closed.

Displays an empty state with a panel icon, "No Tabs Open" heading, guidance to add a tab from the `+` menu, and a "Reopen Artifacts" button for quick recovery.

**Why it exists**: Prevents a confusing blank column. Guides users on how to restore their workspace.

---

## 5. Agent-Specific Context Section

> [!NOTE]
> This is the key adaptive behavior in Sutra's UI — the right panel's primary tab changes based on the selected agent type.

### Decision Logic

```
IF active agent is a Coding Agent (e.g., Synthetix, ReactSculptor):
    → Show FILE TREE in the Artifacts/Sources tab
    → The file tree displays the connected workspace's directory structure
    → Files show change badges (Modified, Added)
    → Requires a Workspace & Folder scope to be selected

ELSE (any non-coding agent — Business Analysis, Lexi, DataWeaver, etc.):
    → Show ARTIFACTS PANEL in the Artifacts/Sources tab
    → The artifacts panel provides file upload (drag & drop, browse, cloud imports)
    → Files are categorized as "Uploaded" vs "Generated"
    → No workspace scope required
```

### Why This Distinction Exists

| Agent Type | Needs | UI Response |
|---|---|---|
| **Coding Agents** | Access to the repository structure, visibility of which files are changed, ability to navigate codebase. | File Tree with change badges, connected to the Workspace/Folder scope. |
| **Non-Coding Agents** | Ability to attach reference files (PDFs, CSVs, docs), view agent outputs (reports, analyses). No codebase concept. | Artifacts panel with upload, cloud imports, and generated/uploaded filter tabs. |

---

## 6. Overlays & Modals

### 6.1 Kebab Menu (Task Options)

**Class**: `.s08-kebab-menu`  
**Triggered By**: Clicking the `⋯` (three dots) button on any task item in the sidebar.

| Action | Purpose |
|---|---|
| **Rename** | Rename the task/conversation title. |
| **Pin / Unpin** | Pin the task to the top of its date group for quick access. |
| **Share** | Share the task/conversation with team members. |
| **Archive** | Move to archive (hidden from recent tasks but not deleted). |
| **Delete** | Permanently delete the task. Styled in red (danger action). |
| **Move to project** | Opens a sub-menu to move the task into a project folder. Has a chevron indicating a submenu. |

### 6.2 Folder Options Kebab Menu

**Class**: `.s08-folder-kebab-menu`  
**Triggered By**: Clicking `⋯` on a project folder.

| Action | Purpose |
|---|---|
| **New task in folder** | Creates a new task directly inside this project folder. |
| **Rename folder** | Renames the project folder. |
| **Delete folder** | Deletes the folder (danger action). |

### 6.3 Confirm Undo Modal

**Class**: `.sutra-modal-backdrop` (`#s08-confirm-undo-modal`)  
**Triggered By**: User initiates an undo action on a conversation turn.

Shows three impact rows:

| What's Affected | Action | Badge |
|---|---|---|
| **User Prompt** | Restored to chat composer for editing | Restore |
| **Agent Response & Outputs** | Output for this query will be cleared | -1 turn |
| **Execution Context** | Revert thread and reset state to checkpoint | Rollback |

Has Cancel and Confirm buttons. 

**Why it exists**: Undoing an agent interaction is a significant action — it discards generated output and rolls back state. The modal prevents accidental undos and clearly communicates the consequences.

### 6.4 Button Variations Showcase Modal

**Class**: `.sutra-modal-backdrop` (`#sutra-button-showcase-modal`)  
**Triggered By**: Clicking the toggle button in the dock's bottom cluster.

Displays the 4 canonical button styles (Primary, Secondary, Ghost, Text) with their specifications. This is a design system reference tool.

---

## 7. Cross-Cutting UI Elements

### 7.1 Draggable Resizers

Three resizer handles exist in the workspace:

| Resizer | Location | Purpose |
|---|---|---|
| **Sidebar Resizer** | Between sidebar and main content | Drag to resize the sidebar width. Dragging left past threshold snaps the sidebar closed. |
| **Canvas Resizer** | Between Conversation Column and Tabs Column | Drag to resize the split between chat and tabs. Bidirectional snap zones at 10% and 20%. |
| **Tab Pane Resizers** | Within the tabs column (vertical and horizontal) | Resize between side-by-side or stacked tab panes when multiple tabs are open. |

### 7.2 Custom Tooltips

**Script**: `tooltip.js`

A custom tooltip engine that provides rich tooltips with multi-line support via the `data-custom-tooltip` attribute. Used on scope selector buttons, stage action buttons, and other elements where the standard `title` attribute isn't sufficient.

### 7.3 Agentation Script

**Script**: `agentation.js`

Visual feedback and annotation tool for AI pair-programming. Provides mechanisms for the agent to highlight, annotate, and visually communicate changes in the UI.

### 7.4 In-Stream Tool Approval Card (`.s08-approval-card`)

**Class**: `.s08-approval-card`  
**Pattern Reference**: [assistant-ui Approval Card](https://www.assistant-ui.com/elements/approval-card)

An in-stream permission gate card rendered in the Conversation Column whenever an autonomous agent halts to request permission before executing a consequential tool (e.g. `run_command`, `write_to_file`, or enterprise API mutations like `jira_create_epic`).

| Element | Purpose |
|---|---|
| **Tool Squircle Icon** | Displays the tool or entity glyph (terminal icon, API webhook icon, or entity key badge for Jira). |
| **Tool Action Header** | Shows action title (e.g. `Create Epic in Jira`) and target organizational scope (e.g. `Acme Inc / Design Engineering`). |
| **Monospaced Payload Box** | Displays the exact command string or REST endpoint + JSON payload being executed, with a 1-click Copy button. |
| **Annotation Indicators** | Displays badge if any inline comments are attached to the deliverable in the Editor. |
| **Deny / Request Edits** | Rejects execution and loops user feedback or inline annotations back to the agent. |
| **Always allow in session** | Grants standing permission for this tool prefix for the rest of the session, eliminating approval fatigue during multi-step chained tasks. |
| **Allow once** | High-contrast pill button granting single-execution approval. Keyboard shortcut: `Enter`. |

**Why it exists**: Prevents arbitrary or hallucinated mutations from executing against production environments without human consent. By exposing the exact execution payload in a monospaced container and offering session-level standing permissions (`Always allow`), it provides enterprise security without degrading developer velocity.

### 7.5 Agent Processing Trace Tree (`.s08-trace-tree` / `<Trace>`)

**Class**: `.s08-trace-tree`  
**Pattern Reference**: [shadcn/ui Trace Primitive](https://ui.shadcn.com/docs/components/base/trace)

The universal building block for visualizing agent background execution, reasoning steps, tool calls, sources, and task checklists inside the Conversation Column (`.s08-conversation-col`).

| Component Primitive | Role & Purpose |
|---|---|
| **`<Trace>`** | Root container managing the vertical execution timeline and visual connectors. |
| **`<TraceLine>`** | Enforces a uniform, single-line structure for every atomic step: `[Icon] + [Title] + [Status/Shimmer] + [Duration]`. |
| **`<TraceIcon>`** | Semantic vector icon indicating the step type: brain icon for reasoning, document icon for file reading, terminal/cloud icon for tools, checkmark for completion. |
| **`<TraceCollapsible>`** | Interactive accordion wrapper enabling users to click and inspect granular payloads (e.g. raw thinking text, tool arguments, or file extraction summaries). |
| **`<TraceCollapsibleTrigger>`** | The clickable surface featuring a chevron indicator (`Details ▾`). |
| **`<TraceCollapsibleContent>`** | Smoothly expanding drawer displaying monospaced output or streaming reasoning tokens. |

###### Supported Execution States:
* **`running`**: Emits an animated shimmer across the title while the model is thinking or streaming tool calls.
* **`completed`**: Displays a solid checkmark glyph (`✓`) with the settled duration badge (e.g. `142ms`).
* **`error`**: Highlights with a destructive badge/icon if a tool execution fails.
* **`pending`**: Rendered with muted opacity for planned future steps in a checklist.

**Why it exists**: Agents execute multiple micro-steps (reading PRDs, clock resolution, reasoning, supervisor routing, API calling). Rendering these as unformatted chat text creates visual clutter. The `Trace` tree standardizes all background processing into clean, single-line, collapsible rows, ensuring complete transparency without overwhelming the conversation stream.

---

## 8. Section Visibility Matrix

| Section | Catalogue View | Workspace View (Coding Agent) | Workspace View (Non-Coding Agent) |
|---|:---:|:---:|:---:|
| Primary Dock | ✅ | ✅ | ✅ |
| Agent Catalogue | ✅ | ❌ | ❌ |
| Sidebar | ❌ | ✅ (collapsible) | ✅ (collapsible) |
| Agent Switcher | ❌ | ✅ | ✅ |
| Workspace Switcher | ❌ | ✅ | ✅ |
| Projects Section | ❌ | ✅ | ✅ |
| Recent Tasks | ❌ | ✅ | ✅ |
| Conversation Column | ❌ | ✅ | ✅ |
| Scope Selector (Workspace/Folder) | ❌ | ✅ | ✅ |
| Chat Input / Prompt Composer | ❌ | ✅ | ✅ |
| Agent Pill Selector (in input) | ❌ | ✅ | ✅ |
| Tabs Panel | ❌ | ✅ | ✅ |
| **File Tree** (in Sources tab) | ❌ | ✅ | ❌ |
| **Artifacts Panel** (in Sources tab) | ❌ | ❌ | ✅ |
| Browser Tab | ❌ | ✅ (optional) | ✅ (optional) |
| Editor/Stage Tab | ❌ | ✅ (optional) | ✅ (optional) |
| Log Viewer Tab | ❌ | ✅ (optional) | ✅ (optional) |
| Kebab Menus | ❌ | ✅ (on hover) | ✅ (on hover) |
| Confirm Undo Modal | ❌ | ✅ (on action) | ✅ (on action) |

---

> **Key Insight**: Sutra's interface is fundamentally a **two-state application** (Catalogue → Workspace) with **agent-adaptive context panels** — the same structural shell accommodates vastly different agent workflows by swapping the right panel's primary content between a file tree (codebase context) and an artifacts manager (file upload/output context).
