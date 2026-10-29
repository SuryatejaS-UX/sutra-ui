# Sutra Design System & Token Specification

> **Status**: `FINALIZED & VERIFIED`  
> **Standard Reference**: Aligned with [Astryx Design Tokens Standard](https://astryx.atmeta.com/docs/tokens) and Apple Human Interface Guidelines.  
> **Governance Rule**: Foundational, semantic, and component tokens documented here are the single source of truth. Once defined, tokens MUST be strictly reused. No ad-hoc hex values, arbitrary margins/paddings, odd font-sizes, or unapproved border-radii may be introduced in component implementation.

---

## 1. Token Taxonomy & Architecture

Sutra follows Astryx's **two-layer token architecture**:
1. **Tier 1: Global Primitives**: Raw mathematical values (e.g. geometric spacing scale, even-pixel font sizes, radius scale, base color palettes).
2. **Tier 2: Semantic Purpose Tokens**: Functional intent tokens consumed by components so that designers and engineers immediately understand the token's role (e.g. `--color-surface-card`, `--border-width-hairline`, `--icon-size-md`, `--text-body-size`).

Components must **only** consume Tier 2 Semantic Tokens (or predefined Tailwind utilities mapped 1:1 to these tokens).

---

## 2. Color System & Semantic Purpose Tokens

Sutra uses a clean, high-contrast, accessible palette anchored by Electric Vivid Blue (`#006EF5`). All contrast ratios meet or exceed WCAG 2.1 Level AA (4.5:1 for body text, 3:1 for UI components) and AAA (7:1 for headings).

### Brand & Accent Tokens
| Token Name | Light Mode Value | Dark / Dock Value | Semantic Purpose / Usage | WCAG Ratio |
|---|---|---|---|---|
| `--color-brand-primary` | `#006EF5` | `#388BFD` | Primary brand identifier, primary action CTAs, active highlights | 4.62:1 (AA) / 5.2:1 (Dark AA) |
| `--color-brand-primary-hover` | `#005BD6` | `#58A6FF` | Interactive hover state for brand actions (soft, soothing lift) | 5.48:1 (AA) / 6.9:1 (Dark AAA) |
| `--color-brand-primary-active` | `#004EB8` | `#1F6FEB` | Pressed / active state for brand controls | 7.12:1 (AAA) / 4.8:1 (Dark AA) |
| `--color-brand-subtle` | `#EFF6FF` | `rgba(0, 110, 245, 0.12)` | Soft brand tint for selected row fills, active tab backgrounds | UI Fill |
| `--color-brand-border` | `#BFDBFE` | `rgba(0, 110, 245, 0.35)` | Border around selected / active workspace cards | 3.15:1 (UI) |

### Surface & Background Tokens
| Token Name | Light Mode Value | Dark Mode Value | Semantic Purpose / Usage |
|---|---|---|---|
| `--color-surface-canvas` | `#FCFCFD` | `#0F0F12` | Master workspace background (Light: ultra-light canvas; Dark: neutral warm charcoal, zero blue cast) |
| `--color-surface-canvas-subtle` | `#F8FAFC` | `#15151A` | Secondary canvas area / sidebar gutter (retains Light #F8FAFC; Dark neutral gutter) |
| `--color-surface-dock-light` | `#F8FAFC` | `#212128` | Light dock container background (alternative if team prefers light dock over dark slate) |
| `--color-surface-card` | `#FFFFFF` | `#19191E` | Primary cards, task composer, artifact editor surface (Dark: neutral obsidian elevated) |
| `--color-surface-card-subtle`| `#F1F5F9` | `#212128` | Secondary nested surfaces, metadata chips, code blocks (Dark: neutral container well) |
| `--color-surface-dock` | `#0F172A` | `#131317` | Navigation dock container (Light: dual-tone dark slate; Dark: solid neutral obsidian) |
| `--color-surface-dock-active` | `#1E293B` | `#24242C` | Active icon container background in navigation dock |
| `--color-surface-overlay` | `rgba(15, 23, 42, 0.45)` | `rgba(0, 0, 0, 0.75)` | Backdrop blur overlay for modals, review drawers, and dialogs |

### Text & Content Tokens
| Token Name | Light Mode Value | Dark Mode Value | Semantic Purpose / Usage | WCAG Ratio |
|---|---|---|---|---|
| `--color-text-primary` | `#0F172A` | `#F4F4F6` | Main headings, view titles, card titles, primary body (Dark: off-white neutral, low glare) | 13.4:1 (AAA) / 15.6:1 (Dark AAA) |
| `--color-text-secondary` | `#475569` | `#A1A1AA` | Subtitles, section descriptions, form labels, timestamps (Dark: zinc-400 neutral) | 5.2:1 (AA) / 6.8:1 (Dark AA) |
| `--color-text-tertiary` | `#64748B` | `#71717A` | Captions, placeholder text, metadata details (Dark: zinc-500 neutral) | 4.6:1 (AA) / 4.54:1 (Dark AA) |
| `--color-text-disabled` | `#94A3B8` | `#52525B` | Disabled buttons, non-interactive control labels | 3.1:1 (UI) |
| `--color-text-inverse` | `#FFFFFF` | `#0F0F12` | Text on brand buttons, badge labels, dark dock text | 13.4:1 (AAA) |
| `--color-text-brand` | `#2A61CA` | `#6FA1F5` | Clickable interactive links, active breadcrumbs (Dark: soft cornflower blue, zero glare) | 5.32:1 (AA) / 6.81:1 (Dark AAA) |

### Status & Feedback Tokens
| Semantic Role | Text Token | Background Token | Border Token | Dark Mode Fills |
|---|---|---|---|---|
| **Draft / Neutral** | `#475569` / `#A1A1AA` | `#F1F5F9` / `#212128` | `#E2E8F0` / `#2A2A32` | Soft neutral charcoal well |
| **Needs Clarification** | `#B45309` / `#FCD34D` | `#FEF3C7` / `rgba(245, 158, 11, 0.12)` | `#FDE68A` / `rgba(245, 158, 11, 0.35)` | Gentle amber tint, non-glaring |
| **Review / Plan** | `#2054B8` / `#93C5FD` | `#EEF4FE` / `rgba(75, 131, 235, 0.12)` | `#BFD5F8` / `rgba(75, 131, 235, 0.35)` | Harmonized soft blue tint |
| **Approved / Success** | `#047857` / `#6EE7B7` | `#ECFDF5` / `rgba(16, 185, 129, 0.12)` | `#A7F3D0` / `rgba(16, 185, 129, 0.35)` | Calming emerald wash |
| **Error / Destructive** | `#B91C1C` / `#FCA5A5` | `#FEF2F2` / `rgba(239, 68, 68, 0.12)` | `#FECACA` / `rgba(239, 68, 68, 0.35)` | Muted coral red |

### Dark Mode Ergonomics & Eye-Comfort Calibration
1. **Zero Saturated Blue Tint in Dark Surfaces**:
   Earlier dark palettes relied on `#090D16`, `#131B2E`, and `#1E293B` (heavy navy casts). In long enterprise task sessions, unnatural blue ambient surfaces cause ocular fatigue. Sutra dark mode strictly uses **neutral charcoal/obsidian tones** (`#0F0F12` canvas, `#19191E` cards, `#212128` inner wells, `#2A2A32` hairline borders) with zero blue undertones, delivering a velvety, calm background.
2. **Accessible Soft Cornflower Blue (No Laser-Neon Glare)**:
   Pure electric blue (`#2694FE` / `#38BDF8`) suffers from severe chromatic aberration and low contrast with white text (2.9:1 fail). Sutra calibrates Dark Mode brand accents to **Cornflower Blue** (`#3B82F6` for controls, `#60A5FA` for text and highlights). 
   - `--color-text-brand: #60A5FA` achieves **6.94:1 contrast ratio against the #0F0F12 canvas (WCAG AAA)**, eliminating visual vibration while preserving pristine legibility and aesthetic softness.


---

## 3. Typography Scale & Geometric Rhythm

In strict compliance with industry standards and Astryx token principles, Sutra uses **even-pixel font sizes only** (starting at 12px) paired with a **4px vertical grid line-height rhythm**. Odd pixel sizes (e.g. 11px, 13px, 15px, 17px, 35px) are strictly forbidden.

### Font Stacks & Tokens
- **Interface / Primary Font**: `'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  * `--font-family-body: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  * `--font-family-heading: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace / Code Font**: `'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace`
  * `--font-family-code: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace`
- **Google Font Import**: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400;500;600;700&display=swap">`

### Font Size Primitives (Even Pixels Only)
| Token Name | Rem Value | Pixel Value | 4px Grid Ratio | Primary Role |
|---|---|---|---|---|
| `--font-size-xs` | `0.75rem` | **12px** | Step -1 | Badges, micro-metadata, uppercase tags, keybinding hints |
| `--font-size-base` | `0.875rem` | **14px** | Step 0 (Base) | Default body text, form inputs, dropdown options, table cells |
| `--font-size-md` | `1.0rem` | **16px** | Step +1 | Prominent body text, subheadings, primary button labels |
| `--font-size-lg` | `1.25rem` | **20px** | Step +2 | Section headers, card titles, drawer headings |
| `--font-size-xl` | `1.5rem` | **24px** | Step +3 | Modal titles, artifact view headers (e.g. Epic Header) |
| `--font-size-2xl` | `1.75rem` | **28px** | Step +4 | Large landmark headers, view titles |
| `--font-size-3xl` | `2.0rem` | **32px** | Step +5 | Display headers, workspace welcome title |
| `--font-size-4xl` | `2.5rem` | **40px** | Step +6 | Marketing hero headline, KPI statistics callouts |
| `--font-size-5xl` | `3.0rem` | **48px** | Step +7 | Major display hero numbers |

### Font Weights
| Token Name | Value | Purpose |
|---|---|---|
| `--font-weight-normal` | `400` | Body text, paragraph descriptions, timestamps |
| `--font-weight-medium` | `500` | Form labels, table headers, button labels, navigation links |
| `--font-weight-semibold` | `600` | Section headings, card titles, stage indicators |
| `--font-weight-bold` | `700` | Landmark titles, major stat numbers, display text |

### Complete Semantic Type Scale (Size + Line-Height + Tracking + Weight)
Every line box aligns precisely to an even-number 4px increment to ensure predictable baselines, component heights, and vertical alignment across layouts.

| Semantic Style | Font Size | Line Height | Tracking | Weight | Target Use Case |
|---|---|---|---|---|---|
| **`--type-display-hero`** | `2.5rem` (40px) | `3.0rem` (48px) | `-0.025em` | `700` | Top-level workspace milestone headline, KPI hero stats |
| **`--type-display-title`** | `2.0rem` (32px) | `2.5rem` (40px) | `-0.020em` | `700` | Main workspace title, landmark page headers |
| **`--type-heading-1`** | `1.5rem` (24px) | `2.0rem` (32px) | `-0.015em` | `600` | Artifact panel primary title (e.g. "Draft Epic: SSO"), Modal headers |
| **`--type-heading-2`** | `1.25rem` (20px) | `1.75rem` (28px) | `-0.010em` | `600` | Section titles within artifacts (e.g. "Acceptance Criteria", "User Stories") |
| **`--type-heading-3`** | `1.0rem` (16px) | `1.5rem` (24px) | `-0.005em` | `600` | Card subheaders, drawer titles, parameter group headers |
| **`--type-body-large`** | `1.0rem` (16px) | `1.5rem` (24px) | `0` | `400` | Lead paragraphs, featured callout content |
| **`--type-body-default`**| `0.875rem` (14px) | `1.25rem` (20px) | `0` | `400` | Standard agent & user chat messages, task descriptions, list items |
| **`--type-label`** | `0.875rem` (14px) | `1.25rem` (20px) | `0` | `500` | Form input labels, primary and secondary button text, tab text |
| **`--type-code`** | `0.875rem` (14px) | `1.25rem` (20px) | `0` | `400` | Monospace code snippets, API payload fields, JSON schema tags |
| **`--type-caption`** | `0.75rem` (12px) | `1.0rem` (16px) | `+0.010em` | `400` | Timestamps, helper descriptions under inputs, footer metadata |
| **`--type-badge`** | `0.75rem` (12px) | `1.0rem` (16px) | `+0.020em` | `600` | Uppercase stage badges (e.g. "DRAFT", "IN PROGRESS"), status tags |

---

## 4. Border & Divider System (Sizes, Styles & Concrete Usages)

A design system cannot have colors without unambiguous physical widths, styles, and usage rules. Sutra defines a clear structural boundary hierarchy:

### Border Width Tokens
| Token Name | Value | Purpose & Architectural Usage Guidance |
|---|---|---|
| `--border-width-none` | `0px` | Reset borders, flat cards on light canvas, flush panel seams. |
| `--border-width-hairline` | `1px` | **Primary standard border**. Used for default card outlines, form input borders, standard table grid lines, subtle dividers, and dropdown menus. |
| `--border-width-prominent`| `2px` | **Active / emphasized border**. Used for selected card states, active tab indicators, hover borders on interactive cards, progress track fills. |
| `--border-width-focus` | `2px` | **Focus ring outline**. Mandatory for keyboard accessibility focus indicator rings. |
| `--border-width-accent` | `3px` | **Accent callout bar**. Used for vertical highlight stripes on the left edge of attention callouts or stage indicator bars. |

### Border Style Tokens
| Token Name | Value | Usage Guidance |
|---|---|---|
| `--border-style-solid` | `solid` | Standard for all structured containers, inputs, buttons, and dividers. |
| `--border-style-dashed`| `dashed` | Dedicated to dropzones, file attachment targets, and placeholder empty artifact slots. |
| `--border-style-none` | `none` | Used when borders are conditionally removed (e.g. seamless side-by-side view). |

### Border Color Tokens
| Token Name | Light Mode Value | Dark Mode Value | Usage Context |
|---|---|---|---|
| `--color-border-default` | `#E2E8F0` | `#2A2A32` | Standard card boundaries, input resting state, table borders (Dark: neutral charcoal hairline) |
| `--color-border-subtle` | `#F1F5F9` | `#1F1F26` | Hairline dividers between list items, internal card separators |
| `--color-border-hover` | `#CBD5E1` | `#3C3C48` | Interactive cards or inputs upon mouse hover |
| `--color-border-focus` | `#3A72DF` | `#4B83EB` | Outline ring for active focused inputs and buttons (Dark: soft accessible cornflower blue) |
| `--color-border-brand` | `#BFD5F8` | `#2563EB` | Highlight outline for actively selected artifact card |

### Divider Component Specifications & Usages
Dividers separate logical groups without adding heavy visual friction:

1. **Horizontal Divider (`.sutra-divider-horizontal`)**:
   - Thickness: `1px` (`--border-width-hairline`).
   - Width: `100%`.
   - Color: `--color-border-subtle` (`#F1F5F9` / `#1F1F26`) within cards; `--color-border-default` (`#E2E8F0` / `#2A2A32`) between page sections.
   - Vertical Margin: `--space-sm` (12px) for compact lists; `--space-md` (16px) between card sections.
   - Usage: Separating chat messages, separating epic header from epic body, separating table rows.

2. **Vertical Divider (`.sutra-divider-vertical`)**:
   - Thickness: `1px` (`--border-width-hairline`).
   - Height: `100%` (or self-stretching).
   - Color: `--color-border-default` (`#E2E8F0` / `#2A2A32`).
   - Horizontal Margin: `--space-xs` (8px) within toolbars; `0` when dividing side-by-side workspace panels.
   - Usage: Separating action button clusters in header, dividing Conversation panel from Artifact panel in side-by-side mode.

3. **Accessible Keyboard Focus Ring**:
   - Thickness: `2px` (`--border-width-focus`).
   - Style: `solid` (`--border-style-solid`).
   - Color: `--color-brand-primary` (`#006EF5` in light mode; `#388BFD` in dark mode).
   - Offset: `2px` (`--focus-outline-offset: 2px`).
   - Outer Spread Glow: `0 0 0 3px rgba(0, 110, 245, 0.25)` (Light) / `0 0 0 3px rgba(56, 139, 253, 0.35)` (Dark).
   - Rule: Triggered exclusively on `:focus-visible` to avoid showing rings on mouse clicks.

---

## 5. Icon System & Standards (Strictly SVG Only — No Emojis)

> **CRITICAL RULE**: Sutra uses **pure SVG iconography only** (Lucide React or clean inline SVG paths). **NO emoji characters** may be used in any UI component, badge, label, button, or message bubble. Emojis lack cross-platform consistency, font-scaling fidelity, and accessibility attributes.

### Icon Size Tokens (Even Increments)
All icon containers and SVG viewBox bounds follow standard even dimensions:

| Token Name | Size (Width × Height) | Semantic Usage Guidance |
|---|---|---|
| `--icon-size-xs` | **12px × 12px** | Micro status dots, table sorting arrows, inline badge indicators |
| `--icon-size-sm` | **16px × 16px** | Input field adornments (search, clear), compact button icons, breadcrumbs, dropdown arrows |
| `--icon-size-md` | **20px × 20px** | **Default standard icon**. Primary button icons, chat action icons, list item icons, tab icons |
| `--icon-size-lg` | **24px × 24px** | Main workspace dock icons, modal dismiss triggers, major navigation items |
| `--icon-size-xl` | **32px × 32px** | Artifact card header badges, category icons, prompt shortcut cards |
| `--icon-size-2xl` | **48px × 48px** | Empty state illustrations, successful task completion graphic anchors |

### Icon Stroke Weights
| Token Name | Value | Usage Context |
|---|---|---|
| `--icon-stroke-default` | `1.5px` | Standard interface glyphs (clean, airy, modern aesthetic) |
| `--icon-stroke-bold` | `2.0px` | Active / selected state glyphs, high-contrast indicators, dock active icon |

### Icon Color States (Semantic Tokens)
Icons inherit color via CSS `stroke="currentColor"` or `fill="currentColor"`:

| Token Name | Light Mode Value | Dark Mode Value | Usage Context |
|---|---|---|---|
| `--color-icon-primary` | `#0F172A` | `#F4F4F6` | Main UI navigation icons, prominent card action icons |
| `--color-icon-secondary` | `#475569` | `#A1A1AA` | Supporting metadata icons, timestamps, collapse triggers |
| `--color-icon-muted` | `#94A3B8` | `#71717A` | Inactive tools, unselected options, placeholder icons |
| `--color-icon-brand` | `#3A72DF` | `#6FA1F5` | Active tools, selected dock icon, brand highlights (Dark: soft cornflower blue) |
| `--color-icon-inverse` | `#FFFFFF` | `#0F0F12` | Icons on dark dock surface, icons on primary brand buttons |
| `--color-icon-disabled` | `#CBD5E1` | `#52525B` | Non-clickable, disabled buttons or controls |
| `--color-icon-success` | `#059669` | `#6EE7B7` | Checkmarks, successful export confirmation, approved task stamp |
| `--color-icon-warning` | `#D97706` | `#FCD34D` | Alert icons, clarification needed badge icon |
| `--color-icon-error` | `#DC2626` | `#FCA5A5` | Error alert banners, validation failure icons |

### Semantic Icon Registry (Lucide React SVGs)
Standard icon names mapped to functional roles across Sutra:

| Semantic Role | Lucide Icon Component | Usage Example |
|---|---|---|
| `action-send` | `ArrowRight` (`line` + `polyline`) | Submit task in composer (clean right arrow `→`) |
| `action-new-task` | `MessageSquarePlus` | Create new conversation/task across sidebar & header |
| `action-close` | `X` | Dismiss modal, close artifact drawer |
| `action-copy` | `Copy` | Copy user prompt, agent response, or artifact markdown |
| `action-revert` | `Undo2` | Restore prompt back into composer for editing |
| `action-feedback-pos` | `ThumbsUp` | Positive feedback endorsement on agent responses |
| `action-feedback-neg` | `ThumbsDown` | Negative feedback flag on agent responses |
| `action-regenerate` | `RefreshCw` / `RotateCw` | Re-run agent inference with animated spinner |
| `action-check` | `Check` | Confirmation, task step completed |
| `action-sync` | `RefreshCw` / `CheckCheck` | Sync with Jira, push draft epic |
| `action-edit` | `Edit2` / `Pencil` | Edit artifact inline |
| `action-expand` | `Maximize2` / `PanelRightOpen` | Expand side-by-side artifact panel |
| `action-collapse` | `Minimize2` / `PanelRightClose`| Collapse artifact panel |
| `nav-workspace` | `Layers` / `Briefcase` | Workspace selector menu |
| `nav-agent` | `Bot` / `Sparkles` | Agent identity & status badge |
| `nav-analytics` | `BarChart2` | Anomaly Detection / Business Analysis mode |
| `nav-settings` | `Settings` | System preferences & integrations |
| `indicator-status` | `AlertCircle` / `CheckCircle2` | Task stage progress indicators |
| `indicator-loading`| `Loader2` (animated) | Agent thinking / planning progress |

### Message Action Bars & Streaming Telemetry
1. **User Message Actions (`.s08-msg-user-actions`)**:
   - Discrete hover-triggered bar with timestamp, Copy (`⌘C`), and Revert/Undo (`Undo2`) controls.
   - Revert action features custom tooltip: `"Undo changes to this point"`.
   - Clicking Revert opens the accessible **Confirm Undo Modal Dialog** (`.sutra-modal-card`) listing contextual rollback items, restoring the prompt into the composer, and clearing subsequent turns upon confirmation (`Confirm ↵` / Enter).
   - **Dialog Architecture & Token Conformance**:
     * **Theme & Surface**: Light primary surface (`--color-surface-card`: `#FFFFFF`), hairline border (`--color-border-default`: `#E2E8F0`), and soft backdrop blur overlay (`--color-surface-overlay`: `rgba(15, 23, 42, 0.45)`).
     * **Concentric Radii System**: Outer container card (`--radius-container`: `16px`), inner change rows (`--radius-element`: `12px`), action buttons and icon badge containers (`--radius-inner`: `8px`), and compact status pills (`6px`).
     * **Even-Pixel Typography**: Modal title (`16px` semibold), description and button labels (`14px`), metadata details and status badges (`12px`).
     * **Controls**: Ghost Cancel button (`#FFFFFF` fill, `#E2E8F0` border, `#475569` text) and Primary Brand Confirm button (`#006EF5` with `0 4px 14px rgba(0, 110, 245, 0.25)` glow on hover and `↵` return symbol).
2. **Agent Message Actions (`.s08-msg-agent-actions`)**:
   - Always accessible action group: Copy response, canonical full-stroke Feedback Thumbs Up / Down with toggle states (`#10B981` / `#EF4444`), and Regenerate (`⌘R`).
3. **assistant-ui Streaming Telemetry (`.s08-msg-timing`)**:
   - Real-time performance metrics footer matching the [assistant-ui telemetry specification](https://www.assistant-ui.com/elements/message-timing).
   - Revealed on hover of `.s08-chat-message.agent` (`opacity: 0` at rest).
   - Formatted with a clean 2-line custom tooltip detailing streaming throughput, latency, token count, and inference cost.
   - Metrics: Time to First Token (`ttft`), Total duration (`total`), Generation speed (`tok/s`), Token volume (`tokens`), and Estimated cost (`cost`).
   - Muted secondary typography (`font-size: 11.5px`, tabular monospace figures) that elevates on hover.

### Icon Engineering & Accessibility Standards
1. **Always use SVG**: No font icons, no PNGs, absolutely no unicode emojis.
2. **Decorative vs. Meaningful Icons**:
   - **Decorative** (accompanies text, e.g. `<Button><Sparkles aria-hidden="true" /> Generate</Button>`): MUST have `aria-hidden="true"`.
   - **Icon-Only Button** (e.g. close button): Button MUST have an explicit `aria-label="Close review panel"` and a tooltip.
3. **SVG Standardization**:
   ```tsx
   <svg
     width="20"
     height="20"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="1.5"
     strokeLinecap="round"
     strokeLinejoin="round"
     aria-hidden="true"
     className="text-icon-secondary hover:text-icon-primary transition-colors"
   >
     ...
   </svg>
   ```

### Custom Tooltip Component Specification
- **Engine**: Zero-dependency, accessible singleton controller ([`js/tooltip.js`](file:///c:/Users/Surya%20Teja%20S/OneDrive/Documents/Agentic%20AI%20research/sutra-ui/js/tooltip.js)).
- **Appearance**: Dark slate glassmorphism (`rgba(15, 23, 42, 0.94)` with `backdrop-filter: blur(8px)`), 1px translucent border (`rgba(255, 255, 255, 0.12)`), 6px border radius, high-contrast light text (`#F8FAFC`).
- **Shortcut Formatting**: Automatically parses bracketed `[|]` and parenthesized shortcut indicators `(⌘N)`, `(Alt+C)`, `(Esc)`, `(Enter)` into styled `<kbd class="sutra-tooltip-kbd">` key caps.
- **Timing & Handoff**: `120ms` hover delay with a `350ms` warm-handoff window (instant 0ms response when moving across adjacent controls).
- **Accessibility & Dismissal**: WCAG 2.1 AA compliant. Triggers gain `aria-describedby` when active. Dismisses instantly on `Escape`, click, or window scroll. Proactively sanitizes native `title` attributes so default unstyled browser tooltips never show.

---

## 6. Spacing Scale (Astryx 4pt Geometric Rhythm)

Sutra aligns spacing with Astryx's standard progression based on a 4px/8px modular rhythm:

| Token Name | Rem Value | Pixel Value | Semantic Application |
|---|---|---|---|
| `--spacing-0` | `0rem` | `0px` | Reset |
| `--spacing-0-5` | `0.125rem` | `2px` | Hairline gaps, micro offsets |
| `--spacing-1` | `0.25rem` | `4px` | Badge internal padding, icon-to-text gap |
| `--spacing-1-5` | `0.375rem` | `6px` | Compact tag padding, button vertical gap |
| `--spacing-2` | `0.5rem` | `8px` | Button horizontal padding (compact), input vertical padding |
| `--spacing-3` | `0.75rem` | `12px` | Standard input padding, card inner item gap |
| `--spacing-4` | `1.0rem` | `16px` | Standard card padding, component gutters, message padding |
| `--spacing-5` | `1.25rem` | `20px` | Card content group padding |
| `--spacing-6` | `1.5rem` | `24px` | Main container padding, drawer padding |
| `--spacing-8` | `2.0rem` | `32px` | Workspace page padding, modal margin |
| `--spacing-10` | `2.5rem` | `40px` | Section separation in artifact review |
| `--spacing-12` | `3.0rem` | `48px` | Empty state layout spacing, hero margin |

---

## 7. Component Element Sizes (Astryx Element Height Scale)

Consistent vertical sizing for interactive controls across buttons, inputs, dropdowns, and selectors:

| Token Name | Height Value | Component Application |
|---|---|---|
| `--size-element-sm` | `28px` | Compact action pills, table filters, micro badges |
| `--size-element-md` | `32px` | Standard buttons, secondary action buttons, input fields in dense mode |
| `--size-element-lg` | `36px` | Primary view actions, task composer trigger buttons, modal CTAs |
| `--size-element-xl` | `44px` | Touch-accessible primary composer input box |

---

## 8. Border Radius Scale (Apple Continuous Curve Geometry)

Sutra adheres to Apple-style continuous curves for tactile, organic depth:

| Token Name | Value | Component Application |
|---|---|---|
| `--radius-none` | `0px` | Square edges, full-bleed images, panel dividers |
| `--radius-inner` | `8px` | Inner form inputs, dropdown options, tag pills, small buttons |
| `--radius-element` | `12px` | Standard buttons, action cards, modal controls |
| `--radius-container`| `16px` | Primary artifact cards, conversation bubbles, message cards |
| `--radius-chat` | `24px` | Floating task composer container |
| `--radius-page` | `32px` | Outer workspace frame, main layout panel corners |
| `--radius-full` | `9999px`| Circular avatars, pill-shaped filter buttons, notification badges |

---

## 9. Elevation & Shadows (Neosoft Tactile Depth)

Tactile depth separates active workspace panels without overwhelming visual noise:

| Token Name | Value | Purpose |
|---|---|---|
| `--shadow-card-subtle` | `0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)` | Flat cards on light canvas |
| `--shadow-card-elevated`| `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` | Hovered cards, floating composer bar |
| `--shadow-card-floating`| `0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.03)`| Modals, active artifact review panel in side-by-side |
| `--shadow-brand-glow` | `0 4px 14px 0 rgba(0, 102, 255, 0.22)` | Primary brand CTA buttons, active state focus glow |

---

## 10. Apple Fluid Interactive Motion & Transitions

Sutra strictly adopts **Apple Human Interface Guidelines fluid motion physics**:

### Easing Tokens
| Token Name | CSS Value | Purpose & Feeling |
|---|---|---|
| `--ease-apple-default` | `cubic-bezier(0.25, 1, 0.5, 1)` | Standard Apple fluid ease-out (smooth, snappy, deceleration) |
| `--ease-apple-spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Quick-release spring for drawer reveals, panel slide-in |
| `--ease-apple-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-pop for completed task checks, approval stamp |

### Duration Tokens
| Token Name | Value | Purpose |
|---|---|---|
| `--duration-instant` | `80ms` | Button click depression, icon color toggle |
| `--duration-micro` | `150ms` | Tooltips, hover background fills |
| `--duration-normal` | `240ms` | Dropdown opening, tabs switching, badge state changes |
| `--duration-expand` | `360ms` | Sidebar collapse, Artifact panel slide-in, Drawer reveal |
| `--duration-stage` | `480ms` | Major layout reorganization across workflow stages |

### Interaction Physics Specifications
1. **Button Active Press**:
   ```css
   .sutra-btn-primary:active {
     transform: scale(0.98);
     transition: transform var(--duration-instant) var(--ease-apple-default);
   }
   ```
2. **Accessible Focus Ring**:
   ```css
   .sutra-focusable:focus-visible {
     outline: var(--border-width-focus) var(--border-style-solid) var(--color-brand-primary);
     outline-offset: 2px;
     box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.25);
   }
   ```
3. **Artifact Panel Side-by-Side Slide**:
   ```css
   .sutra-artifact-panel {
     transition: transform var(--duration-expand) var(--ease-apple-spring),
                 opacity var(--duration-expand) var(--ease-apple-default);
   }
   ```
4. **Reduced Motion Compliance**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

---

## 11. Button System Architecture (Material Design 3 & Semantic Suites)

> **Deep-Dive Specification**: See [`docs/BUTTON_DESIGN_SYSTEM.md`](docs/BUTTON_DESIGN_SYSTEM.md) for complete anatomy, state diagrams, accessibility matrices, and component tokens.

Sutra adopts a unified button architecture combining **Material Design 3 (M3) emphasis tiers**, full-round capsule geometry (`border-radius: var(--radius-full, 9999px)`), Open Sans semibold typography, and Apple HIG fluid tactile dynamics.

### 11.1 Brand Button Variations Matrix

| Variation | CSS Class | Fill / Background | Border | Text Color | Semantic Purpose |
|---|---|---|---|---|---|
| **1. Primary (Filled)** | `.sutra-btn-primary` | `#006EF5` (`--color-brand-primary`) | `none` | `#FFFFFF` | Core highlight CTA (Launch, Confirm, Save) |
| **2. Secondary (Outlined)** | `.sutra-btn-secondary` | `#FFFFFF` (`--color-surface-card`) | `1.5px solid #006EF5` | `#006EF5` | High-visibility secondary actions (Configure, Filter) |
| **3. Ghost (Modal Cancel)** | `.sutra-btn-ghost` | `#FFFFFF` (`--color-surface-card`) | `1px solid #E2E8F0` | `#475569` | Neutral dismiss / cancel actions (matches `#s08-undo-modal-cancel`) |
| **4. Text** | `.sutra-btn-text` | Transparent | `none` | `#006EF5` | Micro-pill links, inline dismissals, tertiary actions |
| **5. Elevated** | `.sutra-btn-elevated` | Light card fill (`#FFFFFF` / `#19191E`) | `none` | `#0F172A` | Visual contrast on complex or image-heavy backgrounds |
| **6. Extended FAB** | `.sutra-btn-fab` | Elevated capsule (`#006EF5`) | `none` | `#FFFFFF` | Landmark canvas action (`+ New Agent Task`) |

### 11.2 Semantic Color Button Variations Suite

For high-stakes agent workflows, approvals, interruptions, and safety operations, Sutra provides semantic variations across 4 emphasis tiers:

| Semantic Domain | Filled (High Emphasis) | Tonal (Medium Emphasis) | Outlined (Border) | Text (Subtle) | Primary Use Cases |
|---|---|---|---|---|---|
| **Destructive** (Red) | `.sutra-btn-destructive-filled`<br>Bg: `#DC2626`, Text: `#FFF` | `.sutra-btn-destructive-tonal`<br>Bg: `#FEF2F2`, Text: `#B91C1C` | `.sutra-btn-destructive-outlined`<br>Border: `1.5px #DC2626` | `.sutra-btn-destructive-text`<br>Text: `#DC2626` | Delete agent, terminate workspace, revoke keys |
| **Success** (Green) | `.sutra-btn-success-filled`<br>Bg: `#059669`, Text: `#FFF` | `.sutra-btn-success-tonal`<br>Bg: `#ECFDF5`, Text: `#047857` | `.sutra-btn-success-outlined`<br>Border: `1.5px #059669` | `.sutra-btn-success-text`<br>Text: `#059669` | Publish workflow, approve PR, finalize plan |
| **Warning** (Amber) | `.sutra-btn-warning-filled`<br>Bg: `#D97706`, Text: `#FFF` | `.sutra-btn-warning-tonal`<br>Bg: `#FEF3C7`, Text: `#B45309` | `.sutra-btn-warning-outlined`<br>Border: `1.5px #D97706` | `.sutra-btn-warning-text`<br>Text: `#D97706` | Pause execution, skip validation, override lints |
| **Info** (Sky) | `.sutra-btn-info-filled`<br>Bg: `#0284C7`, Text: `#FFF` | `.sutra-btn-info-tonal`<br>Bg: `#F0F9FF`, Text: `#0369A1` | `.sutra-btn-info-outlined`<br>Border: `1.5px #0284C7` | `.sutra-btn-info-text`<br>Text: `#0284C7` | Interactive walkthroughs, inspect telemetry |

### 11.3 5-Tier Geometric Sizing Scale (Even-Pixel Rhythm)

| Size | Class | Height | Padding | Font Size | Icon Size | Gap | Touch Target |
|---|---|---|---|---|---|---|---|
| **Extra Small (XS)** | `.sutra-btn-xs` | **28px** | `4px 12px` | `12px` (`0.75rem`, 600) | `14px` | `4px` | 48×48px (via `::after`) |
| **Small (SM)** | `.sutra-btn-sm` | **32px** | `6px 14px` | `13px` (`0.8125rem`, 600) | `16px` | `6px` | 48×48px (via `::after`) |
| **Medium (MD)** *(Default)* | `.sutra-btn-md` | **36px** | `8px 18px` | `14px` (`0.875rem`, 600) | `18px` | `8px` | 48×48px (via `::after`) |
| **Large (LG)** | `.sutra-btn-lg` | **44px** | `10px 22px` | `15px` (`0.9375rem`, 600) | `20px` | `10px` | 48×48px (native) |
| **Extra Large (XL)** | `.sutra-btn-xl` | **52px** | `14px 28px` | `16px` (`1.0rem`, 700) | `22px` | `12px` | 52×52px (native) |

### 11.4 Interactive State Dynamics & Accessibility
- **Hover**: 150ms smooth transition with ambient brand/semantic glow (`box-shadow: 0 4px 14px rgba(0, 110, 245, 0.28)` for primary).
- **Active / Pressed**: Tactile spring depression (`transform: scale(0.97)` over 50ms).
- **Focus-Visible**: Accessible `2px solid` offset ring with `box-shadow: 0 0 0 4px rgba(0, 110, 245, 0.2)`. Never suppressed for keyboard users.
- **Disabled**: `opacity: 0.45; cursor: not-allowed; pointer-events: none;`.
- **Touch Target Compliance (WCAG 2.5.5 / 2.5.8)**: Smaller sizes (`XS`, `SM`, `MD`) incorporate a centered `48×48px` transparent hit boundary (`::after`).

---

## 12. Implementation Governance & Enforcement

1. **Zero Hardcoded Values**: No component may declare `margin: 15px`, `font-size: 13px`, or unmapped hex codes. All values must resolve to semantic tokens.
2. **Strict SVG Iconography**: Any use of raw emoji glyphs (e.g. 🚀, 📋, ⚠️) in component source code will fail design linting. Only Lucide React SVGs or system SVGs are permitted.
3. **Even Pixel Typography Enforcement**: Only font sizes `12, 14, 16, 20, 24, 28, 32, 40, 48px` are valid.
4. **Tailwind Mapping**: `tailwind.config.js` and `index.css` directly expose these exact variables as utility classes (`bg-brand-primary`, `text-body`, `p-space-4`, `rounded-container`, `border-hairline`, `border-prominent`, `icon-md`).
