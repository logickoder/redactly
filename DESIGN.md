# Design System

Visual language and UX patterns extracted from the current implementation. Source of truth: [src/index.css](src/index.css). Components MUST consume tokens, not hardcoded values.

---

## 1. Brand & Tone

- **Name:** Redactly
- **Voice:** Calm, technical, privacy-first. Confident not preachy. Short sentences.
- **Hero verbs:** "redact", "anonymize", "trim". Avoid "scrub", "wipe", "delete" (sound destructive).
- **Trust badge:** "100% Client-Side" appears in the footer. Don't dilute by overusing.

---

## 2. Color Tokens

All colors defined as CSS custom properties in [src/index.css:17-41](src/index.css#L17-L41). Reference via Tailwind tokens (`bg-primary`, `text-text-muted`, etc.) or `var(--color-*)` in inline `style`.

### Light mode
| Token | Hex | Usage |
|------|----|------|
| `--color-primary` | `#6366F1` | Primary actions, links, active states, focus ring |
| `--color-primary-dark` | `#4F46E5` | Hover/active depth on primary |
| `--color-secondary` | `#8B5CF6` | Gradient terminus, secondary accent |
| `--color-accent` | `#A78BFA` | Tertiary accent, soft highlights |
| `--color-background` | `#F5F3FF` | Page background |
| `--color-surface` | `#EDE9FE` | Raised surface (rarely used directly) |
| `--color-card` | `#FFFFFF` | Card backgrounds, nav backdrop base |
| `--color-border` | `#E0D9FF` | All borders |
| `--color-text` | `#1E1B4B` | Primary text |
| `--color-text-muted` | `#6B7280` | Secondary text, icon defaults, helper copy |

### Dark mode
| Token | Hex |
|------|----|
| `--color-primary` | `#818CF8` |
| `--color-primary-dark` | `#6366F1` |
| `--color-secondary` | `#A78BFA` |
| `--color-accent` | `#C4B5FD` |
| `--color-background` | `#0D0B1E` |
| `--color-surface` | `#13102B` |
| `--color-card` | `#1A1830` |
| `--color-border` | `#2D2850` |
| `--color-text` | `#EDE9FE` |
| `--color-text-muted` | `#9CA3AF` |

### Semantic colors (Tailwind defaults)
- Errors: `text-red-500` for inline error text. No background color on error text.
- Success: green is **not** used as a color signal — use `CheckCircle2` icon in primary color instead.
- Toasts carry their own color logic via [src/context/ToastContext.tsx](src/context/ToastContext.tsx).

### Tinted overlays
Semi-transparent primary tints used for soft backgrounds. Defined as CSS custom properties in [src/index.css](src/index.css). Reference via `var(--tint-*)`.

| Variable | Value | Usage |
|---|---|---|
| `--tint-primary-faint` | `rgba(99,102,241,0.04)` | Subtle row hover/idle |
| `--tint-primary-subtle` | `rgba(99,102,241,0.05)` | Settings panel background |
| `--tint-primary-soft` | `rgba(99,102,241,0.08)` | Button hover |
| `--tint-primary` | `rgba(99,102,241,0.10)` | Pill / badge / icon-button hover |
| `--tint-primary-strong` | `rgba(99,102,241,0.12)` | Section header icon background |
| `--tint-primary-stronger` | `rgba(99,102,241,0.15)` | Heavy gradient overlay |
| `--tint-secondary-strong` | `rgba(139,92,246,0.12)` | Secondary section header icon background |
| `--tint-secondary-stronger` | `rgba(139,92,246,0.15)` | Secondary gradient overlay |

Modal backdrop uses literal `rgba(0,0,0,0.5)` (not themed). When adding a new tint depth, prefer the closest existing variable over inventing a new one.

### Brand gradients
Defined in [src/index.css](src/index.css). Always reference via `var(--gradient-*)`:

| Variable | Composition | Usage |
|---|---|---|
| `--gradient-primary` | `linear-gradient(135deg, primary → secondary)` | Buttons, badges, hero accents (auto-themes for dark mode) |
| `--gradient-primary-h` | `linear-gradient(90deg, primary → secondary)` | Modal accent strip, card top border |
| `--gradient-primary-tint` | 135° w/ 0.15 alpha | Modal icon-chip background |
| `--gradient-primary-tint-soft` | 135° w/ 0.12 alpha | Empty-state icon-chip background |

---

## 3. Typography

- **Font family:** `Inter`, sans-serif. Loaded from Google Fonts in [src/index.css:1](src/index.css#L1). Weights available: 300, 400, 500, 600, 700, 800.
- **Default body:** 400/normal.
- **Code/monospace:** Tailwind `font-mono` (system stack). Used for chat content rendering.

### Scale (observed in code)
| Use | Tailwind | Notes |
|----|---------|------|
| Page H1 | `text-3xl font-bold` | Hidden on mobile (`hidden sm:block`) |
| Card title | `text-base font-semibold` | "Configuration", "Redacted Preview" |
| Modal title | `text-base font-semibold` | |
| Section header (eyebrow) | `text-xs font-semibold tracking-wider uppercase` | Always paired with icon chip |
| Body | `text-sm` | Default for inputs, list items |
| Helper / muted | `text-xs` | Captions, counts, hints |
| Mono content | `text-sm font-mono leading-relaxed` | Chat preview, virtualized output |
| Logo | `text-2xl font-bold tracking-tight` | Always with `gradient-text` |

### Weights
- 800 — never used currently; reserve for future hero claim.
- 700 — page H1 only.
- 600 — semibold; titles, eyebrows, badge labels.
- 500 — medium; buttons, links, list-item names.
- 400 — body default.
- 300 — never used currently.

---

## 4. Spacing & Layout

- Layout container: `max-w-7xl mx-auto`.
- Page padding: `p-4 sm:p-8` for content pages; `px-4 sm:px-6 lg:px-8` inside the nav/footer.
- Section gap: `space-y-6` vertical, `gap-6` grid.
- Card internal padding: `p-6`.
- Button padding: `px-5 py-2.5` (gradient primary), `px-4 py-2.5` (secondary outline), `px-3 py-1.5` (small inline), `px-2 py-1` (smallest pill action).
- Icon button padding: `p-2` standard, `p-1.5` modal close, `p-1` smallest.

### Grids
- Two-column desktop / single-column mobile: `grid grid-cols-1 gap-6 lg:grid-cols-2`. Used in [src/pages/Redact.tsx:270](src/pages/Redact.tsx#L270).
- Date pair: `grid grid-cols-2 gap-3`.
- Action pair: `grid grid-cols-2 gap-3` (Copy + Download in [src/components/redact/RedactPreview.tsx:95](src/components/redact/RedactPreview.tsx#L95)).

---

## 5. Border Radius

| Element | Radius |
|--------|-------|
| Card / surface (`card-base`) | `rounded-2xl` |
| Input (`input-base`) | `rounded-xl` |
| Button (gradient + secondary) | `rounded-xl` |
| Icon chip (small) | `rounded-md` (5×5) or `rounded-lg` (8×8) |
| Pill / badge | `rounded-full` |
| Step indicator | `rounded-full` |
| Modal | inherits `card-base` (`rounded-2xl`) |

Never use `rounded-sm` or `rounded-md` for cards — keep the soft, generous look.

---

## 6. Shadows & Elevation

- Cards: `shadow-sm` only (subtle).
- Primary CTA (`btn-gradient`): custom `box-shadow: 0 4px 14px 0 rgba(99,102,241,0.35)`. Hover: `0 6px 20px 0 rgba(99,102,241,0.45)` + `translateY(-1px)`. Active: reset.
- "Click to edit" overlay tooltip uses `shadow-md`.
- No drop-shadows on text. No deep shadows (`shadow-2xl`).

---

## 7. Component Inventory

### 7.1 Card (`card-base`)
- Defined in [src/index.css:90-93](src/index.css#L90-L93).
- White (light) / `#1A1830` (dark) bg, soft border, `rounded-2xl`, `shadow-sm`.
- Standard internal padding `p-6`.

### 7.2 Input (`input-base`)
- [src/index.css:95-104](src/index.css#L95-L104).
- Uses `bg-background` (not card) so they sit slightly recessed against cards.
- Focus: primary border + 2px primary-tinted glow.
- Use for: text input, textarea, date input, number input.

### 7.3 Button — Primary (`btn-gradient`)
- [src/index.css:68-88](src/index.css#L68-L88).
- Indigo-to-violet 135° gradient. White text. Pill-rounded.
- Hover lifts by 1px and deepens shadow. Active resets. Disabled drops to `opacity: 0.55`.
- Use for: the **single** primary action of a view (Parse Chat, Download, Add Participant in modal).

### 7.4 Button — Secondary (outline)
- Pattern: `text-text hover:bg-primary/8 hover:text-primary border` with `border-color: var(--color-border)`. `rounded-xl px-4 py-2.5 text-sm font-medium`. Disabled `opacity: 40`.
- Used for: Copy Text in [src/components/redact/RedactPreview.tsx:97](src/components/redact/RedactPreview.tsx#L97).

### 7.5 Button — Outline-primary
- Pattern: `text-primary hover:bg-primary/10 border` with `border-color: var(--color-primary)`.
- Used for: Save to History in [src/components/redact/RedactPreview.tsx:117](src/components/redact/RedactPreview.tsx#L117).

### 7.6 Icon button (nav, toolbar)
- Pattern: `text-text-muted hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/15 rounded-xl p-2 transition-all`.
- Defined inline in [src/components/Layout.tsx:126](src/components/Layout.tsx#L126).
- Always include `aria-label`.

### 7.7 Inline ghost button (small)
- Pattern: `text-primary hover:bg-primary/10 rounded-lg px-3 py-1.5 text-xs font-medium`. Or with icon: prepend a 11–12px lucide icon and `gap-1` / `gap-1.5`.

### 7.8 Pill / badge
- Pattern: `text-primary rounded-full px-2.5 py-1 text-xs font-medium` with `background: rgba(99,102,241,0.1)`. Variants vary `px` between 2 and 2.5.
- Variant — count badge: `px-2 py-0.5`.
- Variant — trust badge (footer): white text on full primary gradient + `Lock` icon.

### 7.9 Section header (eyebrow + icon chip)
- Component: `SectionHeader` in [src/components/redact/RedactConfiguration.tsx:18](src/components/redact/RedactConfiguration.tsx#L18).
- Layout: small icon chip (5×5 `rounded-md`, tinted bg) → uppercase eyebrow → optional trailing element pushed right.
- Eyebrow text: `text-text-muted text-xs font-semibold tracking-wider uppercase`.

### 7.10 Modal
- Backdrop: `fixed inset-0 z-50 bg-black/50 backdrop-blur-sm`, click-to-close.
- Card: `card-base max-w-md`, top accent strip (1px high, primary→secondary gradient).
- Header: gradient-tinted icon chip + title left, `X` close button right.
- Footer: actions right-aligned, `gap-3`. Cancel = ghost, primary = `btn-gradient`.
- Animation: `initial: { opacity: 0, scale: 0.93, y: 10 }` → `animate: { opacity: 1, scale: 1, y: 0 }`, `duration: 0.2, ease: 'easeOut'`. Wrap in `AnimatePresence`.
- Reference: [src/components/ui/Modal.tsx](src/components/ui/Modal.tsx). Consumers: [src/components/redact/AddParticipantModal.tsx](src/components/redact/AddParticipantModal.tsx), [src/components/redact/SaveChatModal.tsx](src/components/redact/SaveChatModal.tsx).
- Accessibility: focus trapped while open, `Escape` closes, focus restored on close — all handled by [src/hooks/useFocusTrap.ts](src/hooks/useFocusTrap.ts).

### 7.11 Toast
- Implemented in [src/context/ToastContext.tsx](src/context/ToastContext.tsx). Variants: `success`, `error`. Use `toast.show(msg, variant)`.

### 7.12 Stepper (workflow indicator)
- Pattern in [src/pages/Redact.tsx:225-267](src/pages/Redact.tsx#L225-L267).
- Past step: `CheckCircle2` icon in primary, label at 70% opacity.
- Current step: gradient circle with white number, label in primary.
- Future step: gray circle (`bg-gray-200 dark:bg-white/10`), muted label.
- Separator: `ArrowRight` 14px in muted color.

### 7.13 Virtualized text panel
- Hook: [src/hooks/useVirtualizedContent.tsx](src/hooks/useVirtualizedContent.tsx).
- Container: `h-64` (or fixed via parent), `overflow-auto rounded-xl border p-4 font-mono text-sm`, `bg-background`, `border-border`.
- Lines wrap: `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-word'`.
- Reference impl: [src/components/redact/RedactPreview.tsx:45-93](src/components/redact/RedactPreview.tsx#L45-L93).

### 7.14 Nav bar
- Sticky, blurred translucent background: `color-mix(in srgb, var(--color-card) 80%, transparent)`.
- 64px tall (`h-16`), border-bottom, `z-50`.
- Logo left (gradient text), icon buttons right.

### 7.15 Footer
- Single row on desktop, stacked on mobile. Copyright link left, trust pill right.
- Border-top, `bg-card`.

---

## 8. Motion

- Library: Framer Motion 12.
- Page enter: `initial: { opacity: 0, y: 20 }` → `animate: { opacity: 1, y: 0 }`, `duration: 0.4`.
- Modal enter: see §7.10.
- Configuration card enter (Step ≥ 1): `initial: { opacity: 0, y: 20 }` → `animate: { opacity: 1, y: 0 }` → `exit: { opacity: 0, y: -20 }`, `duration: 0.4`. Wrap in `AnimatePresence`.
- Settings panel collapse/expand: `height` + `opacity` from 0/0 to `auto`/1. `overflow-hidden` on the wrapper.
- Hover micro-interaction on `btn-gradient`: 1px lift, no rotation/scale.
- Spinner: `animate-spin` on `RefreshCw` icon during loading.

Avoid: bounces, springs heavier than `tween`, spinning logos, parallax.

---

## 9. Iconography

- Library: `lucide-react` only.
- Stroke width: default (2). Don't override.
- Sizes: 10 (badge), 11–12 (inline button), 14 (compact action), 16 (default action), 18 (nav).
- Use semantic icons: `Lock` (privacy), `History` (saved chats), `Users` (mappings), `MessageSquare` (feedback), `Save`, `Copy`, `Download`, `UserPlus`, `Pencil`, `Settings`, `RefreshCw`, `CheckCircle2`, `ArrowRight`, `Calendar`, `User`, `Search`, `X`, `Sun`, `Moon`.
- Custom SVGs (Twitter/X, GitHub) live in [src/assets/](src/assets/) and render via `react-svg` `<ReactSVG>`.

---

## 10. Accessibility Targets

- Contrast: WCAG AA for all text. `text-text` on `bg-background` and `bg-card` already passes both modes.
- Focus rings: rely on `input-base:focus` for inputs. Buttons must show a visible focus indicator — current implementation depends on browser default; do not remove it without replacement.
- All icon-only buttons: `aria-label`.
- All inputs: `htmlFor` + `id` linked label.
- Modals: keyboard dismissible (Escape), focus-trapped, return focus on close.
- Color is never the only signal — pair with text/icon.

---

## 11. Imagery & Decoration

- Decorative orbs: `.orb` utility ([src/index.css:106-108](src/index.css#L106-L108)) — absolute, blurred, low opacity. Use sparingly on hero / empty states only.
- No stock photos. No illustrations of people. No emojis.

---

## 12. Page-level Patterns

### 12.1 Home
- Two-column desktop hero: tagline + value props left, upload card right. Single-column mobile, upload card stacks below.
- Above-the-fold upload (no scroll required to start).

### 12.2 Redact
- Stepper top, two-column layout: input + configuration left, preview + export right.
- Step gating: configuration card only appears after step 1; preview shows placeholder until then.
- Saved-chat mode: hide "Save to History" button (already saved).

### 12.3 History / Mappings / Feedback
- Single column, max-width contained, card-per-item lists.

---

## 13. Adding a New UI Element — Checklist

1. Does an existing component cover it? If yes, reuse.
2. Does it use only tokens from §2 and scale from §3–§5?
3. Does it have a dark-mode rendering?
4. Does it pass keyboard navigation?
5. Does it work at 360px width?
6. If interactive, does it have hover, active, disabled, and focus states?
7. If it shows error/success, is the meaning carried by both color AND icon/text?
