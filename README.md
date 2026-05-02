# Redactly

A simple, secure, client-side PWA for anonymizing WhatsApp chat exports before sharing with AI models or others.

## Overview

Redactly parses WhatsApp `.txt` export files entirely in the browser — no server, no uploads, no data leaves your
device. You can anonymize participant names, filter conversations by date, and export the cleaned text in seconds.

## Features

- **Upload or Paste** — Drop a WhatsApp `.txt` export or paste raw chat text directly
- **Auto-detect Participants** — Identifies all unique senders from the chat
- **Name Aliases** — Assign anonymous aliases (e.g. "User A") to each participant
- **Aggressive Redaction** — Optionally redact name fragments inside message text
- **Manual Participant Addition** — When aggressive redaction is on, add names that may appear in messages but weren't
  parsed as senders
- **PII Filters** — Optional per-category masking of emails (`[EMAIL]`), URLs (`[LINK]`), phone numbers (`[PHONE]`)
- **NSFW Filter** — Heuristic content filter so downstream LLMs accept the chat. Three tiers (general profanity / slurs / graphic violence), leetspeak-aware, user-extensible word list and allowlist. Mask or soften strategies.
- **Date Filtering** — Trim the conversation to a specific date range
- **Export** — Copy to clipboard or download as a `.txt` file
- **Save to History** — Save redacted chats locally for later access
- **Name Mappings** — Persist your aliases across sessions for repeated contacts
- **Feedback** — Submit feedback or star reviews directly from the app
- **PWA** — Works offline after first visit; installable on desktop and mobile
- **Dark Mode** — Built-in light/dark theme toggle
- **Off-thread Processing** — Parsing and redaction run in a Web Worker so the UI stays responsive on large chats

## Tech Stack

- **React 19** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool and dev server
- **Tailwind CSS v4** — Utility-first styling
- **Framer Motion** — Animations
- **Zustand** — Persistent app settings (theme, date format, name mappings)
- **IndexedDB** — Local chat history storage
- **vite-plugin-pwa** — Service worker and PWA manifest

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173`.

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## NSFW Filter Notes

- **English-only** seed list. Other languages will pass through; add custom terms via the *Additional words to redact* field.
- **Source:** the *general* tier is bundled from [Shutterstock LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words) (MIT) at build time; refresh with `pnpm gen:wordlist`. Slurs and violence tiers are curated.
- **Heuristic.** Always review the preview before sharing — false positives (e.g. *Scunthorpe*) and false negatives are possible. Use the *Allowlist* field to whitelist anything the filter overshoots.
- **Build-time only** wordlist refresh: the PWA never fetches anything at runtime, preserving the offline + privacy guarantees.

## Privacy

All processing is 100% client-side. No data is ever sent to a server.

## License

[MIT](LICENSE)
