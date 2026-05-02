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

**Status:** 🟢 Done

**Notes:** Rewrote `src/utils/redaction.ts` with single combined regex (built once per call), longest-first sort, Unicode-aware lookaround boundaries (`(?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_])`), `iu` flags, dedup by lowercased pattern, length-3+ aggressive parts. 13 unit tests passing (Cyrillic, accented Latin, regex-special escapes, overlap, aggressive split, date filter, undated messages, longest-first). Stopwords list deferred to a follow-up — current API stable for it.

- ~~Sort names longest-first.~~ ✅
- ~~Single combined regex per pass, built once.~~ ✅
- ~~Unicode-aware boundaries via lookarounds.~~ ✅
- ~~Case-insensitive `iu` flags.~~ ✅
- ~~Aggressive split with `length >= 3`.~~ ✅ (Stopword list deferred — empty for now.)
- ~~≥10 redaction unit tests.~~ ✅ (13 tests.)

**Exit criteria:** ~~all redaction edge cases in fixtures pass.~~ ✅

---

## Phase 2 — PII Detectors Beyond Names (M)

**Status:** 🟢 Done

**Notes:** New `src/features/pii/` feature folder (types, detectors, core, barrel). Three detectors: email (`[EMAIL]`), URL (`[LINK]`), phone (`[PHONE]`). Apply order email→URL→phone so longer specific patterns mask before phone's loose digit run. Wired into `redactMessages` via optional `pii` field on `RedactionSettings`. Names redacted before PII (per plan trade-off — names in email local-parts still become aliases). Zustand store gains `pii` + `togglePii`, version bumped to 1 with `migrate` filling defaults for older persisted shapes. New "Also Redact" section in `RedactInput` settings (private `PiiToggle` sub-component). 11 new pii tests + 2 redaction integration tests.

- ~~Detector module + replacements.~~ ✅ ([src/features/pii/detectors.ts](src/features/pii/detectors.ts))
- ~~Apply pipeline post-name-redaction.~~ ✅
- ~~Zustand store update + migration.~~ ✅
- ~~UI toggles in RedactInput settings.~~ ✅
- ~~Tests: per-detector + combined ordering + integration with name redaction.~~ ✅ (13 tests; 37 total)

Credit-card detector explicitly deferred per plan (low-priority).

---

## Phase 3 — NSFW Filter (M)

**Status:** 🟢 Done

**Notes:** New `src/features/nsfw/` feature: `types.ts`, `wordlist.ts`, `wordlist.generated.ts` (399 entries from Shutterstock LDNOOBW, MIT), `core.ts` (leet-class regex builder, multi-word phrase support, longest-first sort, allowlist + extraWords merge), `index.ts` barrel. Tier model simplified to **3 tiers**: `general` (LDNOOBW minus slurs), `slurs` (base64-curated), `violence` (curated). New `pnpm gen:wordlist` script ([scripts/generate-wordlist.mjs](scripts/generate-wordlist.mjs)) refreshes the generated list at build time — no runtime fetch (PWA stays offline). Strategies: `mask` → `[REDACTED]` (default), `soften` → per-tier (`[expletive]`, `[violent-term]`). Slurs always emit `[REDACTED-SLUR]` regardless of strategy. Leet map covers a/e/i/o/s/t/l/b/g/u; whitespace inside multi-word phrases matches `\s+`. `\b` word boundaries (English-only by design). Wired into `redactMessages` after PII pass. Zustand store: `nsfw` field + 5 setters; persist version 2 with migrate that coerces v1 four-tier shape into v2 three-tier shape. **Settings UI extracted out of `RedactInput` into [`RedactSettings` modal](src/components/redact/settings/RedactSettings.tsx)** triggered by the Settings button — RedactInput now thin and reads no settings props. 18 nsfw tests, 54 total. Build + lint green.

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

**Status:** 🟢 Done

**Notes:** Parser split into format detectors: `IOS_MESSAGE` / `ANDROID_MESSAGE` for actual chat lines, `IOS_HEADER` / `ANDROID_HEADER` for system lines (matched only as fallback so messages always win). System lines (encryption notice, group events) are dropped. `<This message was edited>` stripped from `content`; `Message.edited` flag added to types. Date validation rejects out-of-range day/month/hour and catches impossible dates (Feb 30) via JS Date roundtrip. Continuation lines capped at 100. 12 new parser tests passing (Android, iOS, Unicode, date-validation, cap).

- ~~iOS bracketed regex.~~ ✅
- ~~Android dash regex.~~ ✅
- ~~Locale variants (am/pm, 24h, optional seconds, comma optional) covered by shared `DATE` / `TIME` building blocks.~~ ✅
- ~~System messages dropped.~~ ✅
- ~~Edited markers stripped, `Message.edited` flag added.~~ ✅
- ~~Date validation (day/month/hour bounds, Feb 30 roundtrip).~~ ✅
- ~~Multi-line continuation cap (100 lines).~~ ✅
- ~~Tests across fixtures.~~ ✅ (12 tests; 25 total now)

---

## Phase 5 — React Cleanups (S)

**Status:** 🟢 Done

**Notes:** Modal shell extracted. New `useFocusTrap` hook handles Escape + Tab cycling + restore focus. Both modals consume `Modal`, drop ~80 lines of duplication. Init effect moved out of render. Date inputs get linked labels. Storage backfills preview on first read via single transaction. Tests + build + lint green.

- ~~Move init logic in [src/pages/Redact.tsx:202-211](src/pages/Redact.tsx#L202-L211) into a `useEffect` keyed on `location.state`.~~ ✅
- ~~Add focus trap + Escape-to-close + return-focus to `AddParticipantModal` and `SaveChatModal`.~~ ✅ ([src/hooks/useFocusTrap.ts](src/hooks/useFocusTrap.ts))
- ~~Add `htmlFor`/`id` on date inputs in `RedactConfiguration`.~~ ✅
- ~~Backfill `preview` field in chat storage on first read.~~ ✅ ([src/features/chat/storage.ts](src/features/chat/storage.ts))
- ~~Extract reusable Modal shell.~~ ✅ ([src/components/Modal.tsx](src/components/Modal.tsx))

---

## Phase 6 — Web Worker Pipeline (M)

**Status:** 🟢 Done

**Notes:** New [src/workers/redact.worker.ts](src/workers/redact.worker.ts) — discriminated `WorkerRequest` / `WorkerResponse` protocol with parse + redact handlers. New [src/hooks/useRedactWorker.ts](src/hooks/useRedactWorker.ts) wraps the Worker with id-based callback Map, supports synchronous fallback if `Worker` unavailable (jsdom, very old browsers). `DistributiveOmit` helper preserves discriminated union variants. `Redact.tsx` switched: `handleParse` awaits `worker.parse`, `redactedContent` moved from `useMemo` to `useState` + `useEffect` with cancel flag for race protection. 50ms artificial parse delay removed (worker already off main thread). Stats payload deferred — UI badge can land in a follow-up. 54 tests still green; build emits 16 precache entries (worker bundled).

---

## Phase 7 — Polish (S)

**Status:** 🟢 Done

**Notes:** [LICENSE](LICENSE) switched to MIT (was Apache 2.0; README pointed at CC BY 4.0 — mismatch resolved). [README.md](README.md) gains: PII / NSFW filter / Web Worker bullets, dedicated *NSFW Filter Notes* section calling out English-only seed list, LDNOOBW source, build-time-only refresh, allowlist guidance. [PRD.md](PRD.md): three new functional stories — **FS-15** (PII per-category masking), **FS-16** (NSFW tier filter), **FS-17** (off-thread processing). New §3.3 *Redaction Pipeline* documents the layered apply order; §3.4 documents wordlist source. `DB_VERSION` not bumped — no chat-storage schema change.

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
