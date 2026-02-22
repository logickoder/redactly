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
- **Date Filtering** — Trim the conversation to a specific date range
- **Export** — Copy to clipboard or download as a `.txt` file
- **Save to History** — Save redacted chats locally for later access
- **Name Mappings** — Persist your aliases across sessions for repeated contacts
- **Feedback** — Submit feedback or star reviews directly from the app
- **PWA** — Works offline after first visit; installable on desktop and mobile
- **Dark Mode** — Built-in light/dark theme toggle

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

## Privacy

All processing is 100% client-side. No data is ever sent to a server.

## License

[Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE)
