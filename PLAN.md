# Implementation Plan

Ordered by risk reduction first, then features. Each phase ships independently. Estimated cost in T-shirt sizes.

## Status Legend

- ⚪ **Not started** — phase not begun
- 🟡 **In progress** — work underway
- 🟢 **Done** — exit criteria met, merged
- 🔴 **Blocked** — paused with reason in phase notes
- ⏭️ **Skipped** — deliberately deferred or dropped

Update the Status line under each phase as work moves. Add a one-line **Notes** below Status when blocked, partially landed, or skipped.

---

## Phase 0 — Foundation (S)

**Status:** 🟢 Done

**Notes:** Vitest + RTL + jsdom installed. Tests live in `tests/` (separated from `src/`); `tsconfig.test.json` covers the test tree. Redaction logic extracted to `src/utils/redaction.ts`; `escapeRegex` extracted to `src/utils/regex.ts`. Fixtures under `tests/fixtures/` (Android, iOS, Unicode, overlap). 3 tests passing. Build green.

**Goal:** preconditions for everything else.

- ~~Add Vitest + React Testing Library. Wire `pnpm test` script.~~ ✅
- ~~Create `src/utils/redaction.ts` (new module) — extract redaction logic out of [src/pages/Redact.tsx:48-88](src/pages/Redact.tsx#L48-L88) so it is unit-testable and Worker-shippable.~~ ✅
- ~~Create fixtures dir with sample WhatsApp exports.~~ ✅ (Moved to `tests/fixtures/`)

**Exit criteria:** ~~`pnpm test` green with one trivial test. Redact page still works (no behavior change).~~ ✅

---

## Phase 1 — Critical Redaction Correctness (M)

**Status:** ⚪ Not started

**Files:** `src/utils/redaction.ts`, `src/pages/Redact.tsx`, `src/hooks/useStore.ts`.

1. **Sort names longest-first** before building regex. Prevents "John" eating "Johnsons".
2. **Single combined regex per pass**, built once per `(aliases, aggressive)` change. Replace with a function that maps match→alias. Eliminates O(n·m) loop in [src/pages/Redact.tsx:63-78](src/pages/Redact.tsx#L63-L78).
3. **Unicode-aware boundaries.** Replace `\b` with lookarounds: `(?<!\p{L}|\p{N})…(?!\p{L}|\p{N})` with `u` flag. Handles Cyrillic, CJK, accented Latin.
4. **Case-insensitive but Unicode-correct:** flag `iu`. Verify Turkish dotted-i edge cases via test fixture.
5. **Aggressive split rule:** keep `length > 2` filter; also drop common-name stopwords (configurable list, start empty).
6. **Tests:** ≥10 redaction unit tests covering ordering, Unicode, overlap, aggressive mode, partial mentions.

**Exit criteria:** all redaction edge cases in fixtures pass.

---

## Phase 2 — PII Detectors Beyond Names (M)

**Status:** ⚪ Not started

**New module:** `src/utils/piiDetectors.ts`.

Add detectors as togglable rules; user opts in per category. Each detector returns `{ pattern: RegExp, replacement: string | ((m: string) => string) }`.

Detectors:
- **Phone numbers** — international + local. E.164-ish `\+?\d[\d\s\-().]{7,}\d`. Replacement: `[PHONE]` or last-4 preserve (`***-1234`).
- **Emails** — RFC-lite `[\w.+-]+@[\w-]+\.[\w.-]+`. Replacement: `[EMAIL]`.
- **URLs** — `https?://\S+` and bare-domain heuristic. Replacement: `[LINK]`.
- **Credit-card-shaped numbers** (low priority, future).

UI:
- New collapsible section in `RedactInput` settings panel: "Also redact". Checkboxes for Phone, Email, URL.
- Settings persisted via Zustand: `pii: { phone: boolean, email: boolean, url: boolean }`.
- Update `useStore.ts` schema; bump persist version.

Apply order: PII detectors run **after** name redaction (so a name in an email local-part still becomes alias first, then `[EMAIL]` masks the rest).

**Tests:** fixture per detector + combinations.

---

## Phase 3 — NSFW Filter (M)

**Status:** ⚪ Not started

**Goal:** strip/soften sexual + graphic-violent language so downstream LLMs accept the chat without refusing.

### 3.1 Approach

Two strategies, both shipped behind a single toggle "NSFW Filter":

- **Default (`mask`):** replace flagged tokens with `[REDACTED]` (preserves message structure, signals to the LLM that content was filtered intentionally).
- **Optional (`soften`):** swap for tame synonyms from a curated table (e.g. profanity → "[expletive]", sexual term → "[intimate]", slur → `[REDACTED-SLUR]`). More likely to keep conversational coherence.

User picks strategy in settings.

### 3.2 Wordlist

- Bundle a small, curated **English** seed list as `src/utils/nsfwWords.ts`. Tiers:
  - `tier1` profanity (always filter)
  - `tier2` sexual explicit
  - `tier3` slurs (always filter, never softened — always `[REDACTED-SLUR]`)
  - `tier4` graphic violence
- Each tier independently toggleable.
- Word entries support: exact word, leetspeak normalization (`@→a`, `0→o`, `1→i`, `3→e`, `$→s`), and obvious plural/-ing/-ed inflections.
- Provide `extraWords: string[]` user-customizable list in Zustand for project-specific terms.
- Provide `allowList: string[]` for false-positive mitigation (e.g. "Scunthorpe problem").

### 3.3 Algorithm

In `src/utils/nsfwFilter.ts`:
1. Build leet-normalized lookup set + a single Unicode-aware word-boundary regex per tier.
2. On match, check against `allowList` before replacing.
3. Apply **after** name redaction and **after** PII detectors (NSFW words can appear inside names/emails — protect aliasing first).

### 3.4 UI

- New "Content Filters" section in `RedactInput` settings:
  - Master toggle: NSFW Filter
  - Sub-checkboxes: Profanity / Sexual / Slurs (always on when master is on, dimmed) / Graphic Violence
  - Strategy radio: Mask / Soften
  - Textarea: "Additional words to redact" (comma- or newline-separated)
  - Textarea: "Allowlist (do not redact)"
- Small badge on preview header: `n NSFW redactions` count with `Shield` icon.

### 3.5 Performance

NSFW pass shares Worker pipeline (Phase 6). Build regexes once per settings change, not per render.

### 3.6 Tests

- Each tier match.
- Leet normalization (`f@ck`, `5h1t`).
- Allowlist (Scunthorpe).
- Plural / inflection.
- Mask vs soften strategies.
- Zero false-positives on a 500-line normal-conversation fixture.

### 3.7 Disclaimers

- One-line note in settings panel: "Heuristic filter — review preview before sharing."
- README + DEVELOPMENT.md updated to mark wordlist as maintained dependency.

---

## Phase 4 — Parser Robustness (M)

**Status:** ⚪ Not started

**File:** `src/utils/chatParser.ts`.

Replace single regex with format-detection chain:
1. Try iOS bracketed: `[dd/MM/yy, HH:mm:ss] Name: Msg`
2. Try Android dash: `dd/MM/yy, HH:mm - Name: Msg`
3. Try locale variants (am/pm vs 24h, comma vs none).
4. **System messages** filtered: lines like `Messages and calls are end-to-end encrypted`, `<Media omitted>`, `Missed voice call`, `<This message was edited>` either dropped or kept as `[SYSTEM]` (configurable).
5. **Edited markers** detected; strip `<This message was edited>` suffix from `content` while preserving `originalString`.
6. **Date validation:** reject `day > 31`, `month > 12`. Currently silent.
7. **Multi-line continuation** stays as-is but capped (defensive: if a single message accumulates >100 lines, treat as parse failure for that block).

**Tests:** parse each fixture, assert `messages.length` and a sampled message.

---

## Phase 5 — React Cleanups (S)

**Status:** ⚪ Not started

- Move init logic in [src/pages/Redact.tsx:202-211](src/pages/Redact.tsx#L202-L211) into a `useEffect` keyed on `location.state`.
- Add focus trap + Escape-to-close + return-focus to `AddParticipantModal` and `SaveChatModal`. Pull `focus-trap-react` (small) or write 30-line hook in `src/hooks/useFocusTrap.ts`.
- Add `htmlFor`/`id` on date inputs in [src/components/redact/RedactConfiguration.tsx:72,83](src/components/redact/RedactConfiguration.tsx#L72).
- Backfill `preview` field in [src/utils/chatStorage.ts:185](src/utils/chatStorage.ts#L185): on first read of an old chat, write back computed preview so next read fast. (`db.put` inside map; cheap, idempotent.)
- Extract reusable Modal shell out of `AddParticipantModal` + `SaveChatModal` per DEVELOPMENT.md no-duplication rule. New: `src/components/Modal.tsx` (backdrop + card + accent strip + header + animation). Existing modals consume it.

---

## Phase 6 — Web Worker Pipeline (M)

**Status:** ⚪ Not started

**Goal:** keep main thread responsive on >1MB chats.

- New worker file `src/workers/redactWorker.ts`. Vite supports `?worker` import.
- Worker exposes: `parse(text, dateFormat)`, `redact(messages, settings)`. Settings include aliases, aggressive flag, PII flags, NSFW config.
- `Redact.tsx` posts to worker on debounced setting change; receives `{ redactedContent, stats }`.
- Stats: `{ namesRedacted, phonesRedacted, emailsRedacted, urlsRedacted, nsfwRedacted }` for new badge.
- Fallback to sync path if `Worker` unavailable.

Trigger threshold: always use worker. Simpler than dual paths.

---

## Phase 7 — Polish (S)

**Status:** ⚪ Not started

- License: switch repo to MIT (or dual MIT + CC BY 4.0 for docs/assets).
- README: document NSFW filter behavior + that it ships English-only seed list.
- PRD update: append §FS-15 (PII detectors) and §FS-16 (NSFW filter).
- Bump `DB_VERSION` to 4 if any chat-storage shape change required.

---

## Risk Register

| Risk | Mitigation |
|-----|-----------|
| NSFW false positives upset users | Allowlist UI, per-tier toggles, "soften" strategy as safer default |
| NSFW false negatives (LLM still refuses) | Document limits; encourage tier4 + soften combo |
| Wordlist becomes maintenance burden | Curate small, document update policy in DEVELOPMENT.md |
| Slurs in wordlist offend contributors browsing source | Store as base64/rot13 with decoder fn; comment explains why |
| Worker breaks Safari/older PWA installs | Sync fallback (Phase 6) |
| Unicode regex unsupported on very old browsers | Targeted browserslist already excludes them via Vite defaults |

---

## Order of Operations

1. Phase 0 (test infra) — unblocks everything
2. Phase 1 (critical redaction) — biggest correctness win
3. Phase 5 (React cleanups) — small, ride along with #1
4. Phase 4 (parser) — depends on fixtures from #0
5. Phase 2 (PII)
6. Phase 3 (NSFW)
7. Phase 6 (Worker)
8. Phase 7 (polish)
