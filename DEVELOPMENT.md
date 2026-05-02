# Development Conventions

Strict rules extracted from the current codebase. New code MUST conform. Deviations require justification in the PR description.

---

## 1. Tech Stack (Locked)

| Layer | Choice | Notes |
|------|-------|------|
| Framework | React 19 | Function components only. No class components. |
| Language | TypeScript ~5.9 | `strict` mode. No `any`, no `// @ts-ignore` (only `@ts-expect-error` with reason). |
| Build | Vite 7 | `pnpm` package manager (locked: `pnpm@10.16.0`). |
| Styling | Tailwind CSS v4 (PostCSS) | Theme via CSS custom properties in [src/index.css](src/index.css). |
| Routing | `react-router-dom` v7 | `HashRouter` (PWA-friendly, GitHub Pages compatible). |
| State | Zustand 5 + `persist` middleware | Settings to `localStorage`. History to IndexedDB via `idb`. |
| Animation | Framer Motion 12 | Use `motion.*` + `AnimatePresence`. No CSS-only transitions for entering/exiting elements. |
| Icons | `lucide-react` only | No emoji. No font-icon libs. SVG assets in `src/assets/` rendered through `react-svg`. |
| Virtualization | `@tanstack/react-virtual` | Wrapped in [src/hooks/useVirtualizedContent.tsx](src/hooks/useVirtualizedContent.tsx). |
| Compression | `pako` (gzip) + base64 | See [src/utils/compression.ts](src/utils/compression.ts). |
| PWA | `vite-plugin-pwa` `registerType: 'autoUpdate'` | Manifest in [vite.config.ts](vite.config.ts). |

Adding a new dependency requires: (a) a justification in PR description, (b) confirmation it ships <50KB gzipped, (c) confirmation it works offline.

---

## 2. Architecture Rules

### 2.1 Privacy invariant (non-negotiable)
- **Zero network egress for user data.** No `fetch`/`XMLHttpRequest`/`WebSocket`/analytics SDK that touches chat content, names, mappings, or history.
- Network calls allowed only for: (i) loading the app shell + fonts (Google Fonts is the only external host today, see [src/index.css:1](src/index.css#L1)), (ii) PWA service worker assets.
- Any new network call MUST be reviewed in PR.

### 2.2 Data flow
- Chat parsing, redaction, and storage happen entirely client-side.
- Settings (theme, date format, name mappings, redaction toggles) → Zustand `persist` → `localStorage` ([src/hooks/useStore.ts](src/hooks/useStore.ts)).
- Saved chats → IndexedDB store `chats` ([src/features/chat/storage.ts](src/features/chat/storage.ts)). Bump `DB_VERSION` for schema changes; provide an `upgrade` handler.
- Compression: gzip via `pako`, store as base64 string. Threshold: compress if `length > 10 * 1024`. Always store an uncompressed `preview` (first 10 lines) for fast list rendering.

### 2.3 Folder layout
```
src/                       Application code only. Ships in the production bundle.
  App.tsx                  Router root. ToastProvider > HashRouter > Routes.
  main.tsx                 Entry. Mounts <App />.
  index.css                Tailwind import + theme tokens + utility classes.
  pages/                   Route components only (Home, Redact, History, Mappings, Feedback).
  components/              UI components, organized into three buckets:
    layout/                App shell pieces (Layout, SEO, ScrollToTop).
    ui/                    Reusable UI primitives (Modal, Toast, PageHeader).
    <feature>/             Feature-scoped components (e.g. redact/).
    <feature>/<group>/     Subgroups within a feature (e.g. redact/settings/).
  features/<name>/         Feature-scoped logic modules. Pure-ish; no React UI.
                           Each is a folder with an index.ts barrel export.
                           Current features: chat, redaction, compression, pii, nsfw.
  lib/                     Cross-cutting low-level helpers (regex, math, type guards).
                           Flat files, NOT folders. No barrel.
  hooks/                   Reusable hooks + Zustand stores. File name MUST start with `use`.
  context/                 React Context providers (e.g. ToastContext).
  workers/                 Web Worker entry files.
  assets/                  Static SVGs and other media.

tests/                     Test code + fixtures. NEVER ships in production bundle.
  setup.ts                 Vitest setup (jest-dom matchers, etc.).
  fixtures/                Sample input data (.txt, .json) used by tests.
  features/                Tests for src/features/*. Mirrors the src/ tree.
  components/              Tests for src/components/*.
  hooks/                   Tests for src/hooks/*.
  lib/                     Tests for src/lib/*.
  pages/                   Tests for src/pages/*.
```

**Feature folders (`src/features/<name>/`):**
- Each feature is a folder, not a flat file. Even single-file features start as a folder so growth doesn't force a churn-heavy rename later.
- Required files inside a feature folder:
  - `types.ts` — interfaces and type aliases for the feature
  - one or more implementation files (e.g. `core.ts`, `parser.ts`, `storage.ts`)
  - `index.ts` — **barrel export.** Re-exports the public surface only. Internal helpers must NOT be re-exported.
- Consumers ALWAYS import from `'../features/<name>'` (the barrel), never from a deep path like `'../features/<name>/core'`. The barrel is the contract; deep imports break the boundary.
- **Worker exception:** files in `src/workers/` MAY import directly from `features/<name>/<file>` to keep the worker bundle lean (avoid pulling in IndexedDB / storage / compression code that the worker doesn't run). Document the import with a one-line comment when you do this.
- Inside a feature, files import from sibling files via relative paths (e.g. `./types`, `./core`). Do NOT import a feature's own barrel from inside that feature — circular.
- A feature MAY import from another feature only via that other feature's barrel. Cross-feature deep imports are forbidden.
- A feature MUST NOT import from `pages/`, `components/`, or `hooks/`. Direction of dependency is one-way: UI → features → lib. Features may import from `lib/`.
- A feature MUST NOT import from `react`, `react-dom`, or any rendering library. Features are headless logic.

**lib/:**
- Flat single-purpose files only (e.g. `regex.ts`). No subfolders, no barrel.
- Pure utilities with no domain knowledge. If logic carries domain meaning, it belongs in `features/`, not `lib/`.

**Component folders:**
- `components/layout/` — pieces of the app shell (header, footer, page wrapper, SEO, scroll restorers). Used by the router root only.
- `components/ui/` — reusable presentational primitives that are agnostic of any one feature (Modal, Toast, PageHeader, future Button/Badge/etc.). New primitives go here when they're used across two or more features OR when they're a stateless wrapper others compose.
- `components/<feature>/` — components scoped to one feature (only consumed by that feature's page). Includes feature-specific modals.
- `components/<feature>/<group>/` — when a feature accumulates components serving a sub-concern (e.g. `redact/settings/`), nest them. Don't nest beyond two levels deep.
- One default export per component file. Helper components in the same file are fine if private (see `NavIcon` in [src/components/layout/Layout.tsx](src/components/layout/Layout.tsx), `SectionHeader` in [src/components/redact/RedactConfiguration.tsx](src/components/redact/RedactConfiguration.tsx)).
- Components do NOT have a barrel — import each component directly by its file path.

**Promotion rule:** a feature-scoped component that gains a second consumer outside its feature graduates to `components/ui/`. Don't shortcut by adding cross-feature imports.

**Strict separation of concerns:**
- `src/` is application code only. **No `*.test.ts(x)` files in `src/`.** No fixtures, no test scaffolding.
- `tests/` is the only home for test code, fixtures, mocks, and test setup.
- Test files mirror the path of the file under test, e.g. `src/features/redaction/core.ts` → `tests/features/redaction.test.ts` (test the barrel surface).
- Test imports reach into `src/` via relative paths (e.g. `import { foo } from '../../src/features/foo'`).
- `tsconfig.app.json` includes `src` only — tests never reach the build. `tsconfig.test.json` covers the `tests/` tree.
- Vitest is configured with `include: ['tests/**/*.{test,spec}.{ts,tsx}']` in [vite.config.ts](vite.config.ts). Do not change.

---

## 3. TypeScript Rules

- Always type component props via `interface XxxProps`. Never inline.
- Components typed as `FC<Props>` from `react` — match existing pattern.
- Use `type` for unions/aliases; `interface` for object shapes.
- Imports: prefer `import { type Foo } from '...'` for type-only imports (already enforced for some imports).
- No non-null assertions (`!`) without an inline comment justifying why null is impossible.
- No `any`. If unavoidable, use `unknown` and narrow.
- `@ts-expect-error` is allowed only with an inline reason on the same line (existing precedent: [src/components/Layout.tsx:124](src/components/Layout.tsx#L124)).

---

## 4. React Patterns

### 4.1 State
- `useState` for component-local state.
- Zustand for cross-component or persisted state. Never duplicate Zustand state into local state — read directly via the hook.
- Refs (`useRef`) for: timers, debounce handles, "did I init" flags, DOM refs. Never as a workaround for missing dependency arrays.

### 4.2 Effects
- All side-effecting code (DOM writes, subscriptions, timers, async kicks) goes in `useEffect`. **Do not mutate state during render.** ([src/pages/Redact.tsx:202-211](src/pages/Redact.tsx#L202-L211) is a known violation slated for fix.)
- Always clean up timers/subscriptions inside the returned cleanup function. Existing precedent: [src/pages/Redact.tsx:191-200](src/pages/Redact.tsx#L191-L200).
- No empty-deps `useEffect` for "run once" logic that depends on a value — restructure instead.

### 4.3 Memoization
- Use `useMemo` for derived values that are (a) expensive, OR (b) referenced as a dep elsewhere (so the ref must be stable).
- Use `useCallback` only when the callback is passed to a memoized child or used as a hook dep.
- Don't memoize cheap primitives.

### 4.4 Lists
- Every `.map()` returning JSX must have a stable, unique `key`. Never use array index unless the list is append-only AND order never changes.
- Modal "reset on open" pattern: pass a `key` derived from open state to remount the modal — see [src/pages/Redact.tsx:317](src/pages/Redact.tsx#L317), [src/pages/Redact.tsx:325](src/pages/Redact.tsx#L325).

### 4.5 Forms
- Controlled inputs only. Inline `onChange` handlers OK.
- Every `<input>` MUST have an associated `<label htmlFor="...">` AND `<input id="...">`. Visually-hidden labels are acceptable.

---

## 5. Performance Rules

- **No sync work >16ms on the main thread for user-typed events.** Long-running parsing/redaction must be debounced or moved to a Web Worker.
- Debounce expensive recomputes triggered by typing. Existing precedent: 1000ms alias debounce ([src/pages/Redact.tsx:191-200](src/pages/Redact.tsx#L191-L200)).
- Long monospace text MUST be rendered through `useVirtualizedContent`. Don't render >5000 lines as flat DOM.
- Build a single combined regex for batch replacements; do not construct `new RegExp(...)` per item per render.
- IndexedDB list views read `preview` only — never decompress full content for list rendering.

---

## 6. Styling Rules (Tailwind v4)

- **Use the design tokens in [src/index.css](src/index.css):** `bg-background`, `bg-card`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `text-primary`, `text-secondary`, `text-accent`. Don't hardcode hex values in components.
- Exception: gradient inline styles are tolerated (we don't have a Tailwind gradient utility wired). Use the existing `linear-gradient(135deg, #6366F1, #8B5CF6)` recipe — extract to a CSS variable when adding the third instance.
- Reuse the utility classes: `card-base`, `input-base`, `btn-gradient`, `gradient-text`, `gradient-primary`. Add new ones to the `@layer utilities` block in [src/index.css](src/index.css) when a class repeats ≥3 times.
- Dark mode: `dark:` variants. Theme is class-based (`.dark` on `<html>`), toggled in [src/components/Layout.tsx:13-19](src/components/Layout.tsx#L13-L19).
- Responsive: mobile-first. Default styles target mobile; `sm:`, `md:`, `lg:` add larger-screen behavior.
- Spacing: prefer Tailwind scale (`p-4`, `gap-3`). Don't use arbitrary values unless matching a spec.

---

## 7. Accessibility Rules

- Every interactive element has either visible text OR `aria-label`.
- Every input has `htmlFor` ↔ `id` linkage.
- Modals MUST: trap focus, close on Escape, restore focus to the trigger on close, have a backdrop click-to-close, and have `role="dialog"` + `aria-modal="true"`.
- Color contrast: text-on-background must meet WCAG AA. Don't use `text-text-muted` for primary content.
- Icons that convey meaning need `aria-label` on the parent button. Decorative icons need `aria-hidden="true"`.

---

## 8. Error Handling

- User-facing errors → `toast.show(message, 'error')` from [src/context/ToastContext.tsx](src/context/ToastContext.tsx). Never `alert()`.
- Catch only at boundaries (parsing, IndexedDB, clipboard). Let internal logic throw — don't blanket-catch.
- `console.error` is allowed for unexpected paths but must be paired with a user-visible toast.
- Never swallow errors silently.

---

## 9. Code Style

- Prettier + `prettier-plugin-tailwindcss`. Run before committing.
- ESLint: `eslint.config.js` with `react-hooks` + `react-refresh`. Zero warnings.
- Single quotes for strings, semicolons required, trailing commas.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utils/hooks.
- Imports: external first, internal second, type imports last.
- Barrel files (`index.ts` re-exports) are allowed **only at feature-folder roots** (`src/features/<name>/index.ts`) per §2.3. Do not create barrels for `src/components/`, `src/hooks/`, `src/lib/`, or any subfolder of these.
- No comments explaining what code does. Comment only when WHY is non-obvious.

---

## 9a. No Duplication (Strict)

**Core rule:** if logic, JSX, or styling appears (or is about to appear) in more than one place, extract it. Copy-paste is a defect.

### 9a.1 Before writing new code

1. Search for an existing helper, hook, component, or utility class that already does (or nearly does) the job:
   - Functions/utils → `src/utils/` and `src/hooks/`
   - Reusable components → `src/components/`
   - Styling primitives → `@layer utilities` block in [src/index.css](src/index.css) (`card-base`, `input-base`, `btn-gradient`, `gradient-text`, `gradient-primary`, `orb`)
2. If something close exists, **extend it** (parameters, props, variants) rather than forking a parallel implementation.
3. If nothing exists, write the new thing in the most reusable location from the start — don't inline now and "extract later".

### 9a.2 The two-occurrence rule

When the same construct appears twice and is about to appear a third time, **stop and extract before writing the third copy.** This applies to:
- Functions and pure logic (parsing, formatting, validation, regex builders) → `src/utils/<topic>.ts`
- React components and JSX blocks (modals, cards, headers, list items, badges, buttons with non-trivial styling) → `src/components/` (or `components/<feature>/` if feature-scoped)
- Hooks (effects, debouncers, focus traps, virtualizers) → `src/hooks/use<Name>.ts`
- Tailwind class strings used in three or more places → new utility class in `@layer utilities` in [src/index.css](src/index.css)
- Inline-`style` recipes (gradients, tinted backgrounds, custom shadows) used in three or more places → CSS custom property or utility class

Two near-identical occurrences are tolerated only if the duplication is genuinely incidental and a shared abstraction would be more confusing than the two literals. Justify in the PR.

### 9a.3 Extraction checklist

When extracting:
- Place in the most narrow shared location possible. A helper used by two files in `components/redact/` belongs in `components/redact/shared/`, not in top-level `components/`.
- Name by **what it is**, not by where it came from. `Modal` not `AddParticipantModalShell`.
- Export named (not default) for utilities and hooks. Components use the existing default-export pattern.
- Keep prop surface minimal. Add new props only when a real second consumer needs them.
- Update both (or all) original sites in the same commit. Never leave one site unmigrated.
- Delete the old inline code. Never keep "for reference".

### 9a.4 Known extraction debts

These exist as duplicates today and MUST be consolidated when next touched:
- ~~Modal shell — backdrop, card, top accent strip, animation. Currently inlined in `AddParticipantModal`. Extract to `src/components/Modal.tsx` when adding any new modal.~~ ✅ Extracted to [src/components/Modal.tsx](src/components/Modal.tsx) with [src/hooks/useFocusTrap.ts](src/hooks/useFocusTrap.ts). Both `SaveChatModal` and `AddParticipantModal` consume it.
- Section header (eyebrow + icon chip) — `SectionHeader` is currently private to [src/components/redact/RedactConfiguration.tsx:18](src/components/redact/RedactConfiguration.tsx#L18). Promote to `src/components/SectionHeader.tsx` on next reuse.
- Virtualized monospace panel — repeated structurally in `RedactInput` step ≥1 view and `RedactPreview`. Extract to `src/components/VirtualizedTextPanel.tsx` if a third use appears.
- ~~Regex special-character escape — currently inlined twice in `src/pages/Redact.tsx`. Extract to `escapeRegex(str: string): string`.~~ ✅ Extracted to [src/lib/regex.ts](src/lib/regex.ts).
- Tinted-background recipes (`rgba(99,102,241,0.04|0.05|0.08|0.10|0.12)`) — promote the most common to CSS custom properties (`--tint-primary-soft`, `--tint-primary`, `--tint-primary-strong`) and update §2 of [DESIGN.md](DESIGN.md).

### 9a.5 What is NOT duplication

- Two pieces of code that look similar but encode different domain concepts. Force-merging them couples unrelated change axes.
- A short literal (a one-liner Tailwind class string) used twice in the same file.
- Test fixtures and test scaffolding — duplication in tests is often clearer than abstraction.

When in doubt, lean toward extracting. Over-extraction is cheap to undo; scattered copies rot.

---

## 10. Testing & Verification

- **Framework:** Vitest + React Testing Library + jsdom. Setup file at [tests/setup.ts](tests/setup.ts) loads `@testing-library/jest-dom/vitest` matchers.
- **Run:** `pnpm test` (watch), `pnpm test:run` (CI/one-shot), `pnpm test:ui` (web UI).
- **Location:** all test files live under `tests/`. Mirror the `src/` path. See §2.3.
- **Naming:** `*.test.ts` for non-UI; `*.test.tsx` if rendering React.
- **Fixtures:** plain files under `tests/fixtures/`, imported with `?raw` for text content.
- **Coverage targets** (no enforced threshold yet, but expected): `src/utils/` ≥ 80%; `src/hooks/` ≥ 70%. Components covered when behavior is non-trivial.
- **Required tests** for new features that touch: parsing, redaction, PII detection, NSFW filtering, IndexedDB storage, compression. Pure-function modules MUST have unit tests in the same PR.
- **UI changes:** `pnpm dev`, exercise in browser (light + dark + mobile viewport), confirm no console errors.
- Do not write tests in `src/`. Do not import test utilities from `src/`.

---

## 11. Build & Release

- `pnpm dev` — local dev (port 5173).
- `pnpm build` — `tsc -b && vite build`. TypeScript errors fail the build.
- `pnpm lint` — must pass before merge.
- `pnpm generate-pwa-assets` — run after changing `public/logo.svg` or PWA config.
- `base: '/redactly'` in [vite.config.ts](vite.config.ts) — this is a sub-path deploy, do not change without updating routing.

---

## 12. Git Conventions

- Branches: feature/*, fix/*, chore/*.
- Commit messages: imperative mood, present tense ("Add NSFW filter", not "Added"). Existing log uses sentence-case subject lines.
- One logical change per PR. No mixing refactors with feature work.
- Never commit: `.env`, raw chat samples, screenshots containing real names.
