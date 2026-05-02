# **Product Requirements Document: Redactly (PWA)**

Version: 1.2
Date: 2026-02-22
Product Goal: To provide a simple, secure, client-side tool for users to prepare sensitive WhatsApp chat data for external analysis (e.g., by AI models) by guaranteeing anonymity and scope control.

## **1. Goal and Success Metrics**

### 1.1 Project Goal

Create a Progressive Web App (PWA) that operates **100% offline** (after initial load) to ensure user privacy by
processing sensitive chat data solely on the client's device. The application simplifies the complex task of manually
redacting names and filtering conversations by date.

### 1.2 Success Metrics

| Metric                   | Definition                                                                 | Target |
|:-------------------------|:---------------------------------------------------------------------------|:-------|
| **PWA Install Rate**     | Percentage of users who install the app to their home screen/desktop.      | \>15%  |
| **Core Conversion Rate** | Percentage of users who successfully upload, process, and download a chat. | \>80%  |
| **Privacy Trust**        | Low volume of support requests related to data security.                   | \<5%   |
| **Performance**          | Time to process a 10MB chat file after initial load.                       | \< 5s  |

## **2. Core Feature Requirements**

### 2.1 User Stories

| ID        | User Story                                                                                              | Priority |
|:----------|:--------------------------------------------------------------------------------------------------------|:---------|
| **FS-1**  | Upload a standard WhatsApp .txt chat export file.                                                       | **High** |
| **FS-2**  | Automatically detect all unique participant names in the chat.                                          | **High** |
| **FS-3**  | Assign anonymous aliases (e.g., "User A") to original names.                                            | **High** |
| **FS-4**  | Specify a start and end date to trim the conversation scope.                                            | **High** |
| **FS-5**  | Maintain original chat structure (timestamps, line breaks) in the output.                               | **High** |
| **FS-6**  | Copy anonymized text to clipboard or download as a new .txt file.                                       | **High** |
| **FS-7**  | Receive feedback if file format is incorrect or processing fails.                                       | Medium   |
| **FS-8**  | Available and fully functional even when completely offline.                                            | **High** |
| **FS-9**  | Enable aggressive redaction to replace name fragments inside message bodies.                            | Medium   |
| **FS-10** | Manually add a participant (select from saved or create temporary) when aggressive redaction is active. | Medium   |
| **FS-11** | Save redacted chats locally and re-open them from a History page.                                       | Medium   |
| **FS-12** | Persist name-to-alias mappings across sessions for repeat contacts.                                     | Medium   |
| **FS-13** | Paste raw chat text directly without uploading a file.                                                  | Medium   |
| **FS-14** | Edit chat content (paste box) before parsing, for new chats only.                                       | Low      |
| **FS-15** | Mask non-name PII (emails, URLs, phone numbers) per-category toggle.                                    | **High** |
| **FS-16** | NSFW content filter (general profanity + sexual / slurs / graphic violence) so downstream LLMs accept the chat. | **High** |
| **FS-17** | Run parsing + redaction off the main thread so the UI stays responsive on large chats (>1MB).           | Medium   |

## **3. Technical Requirements**

### 3.1 Platform and Architecture

* **Type:** Progressive Web Application (PWA).
* **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Zustand (state), vite-plugin-pwa.
* **Offline Capability:** Mandatory Service Worker for caching static assets.
* **Data Processing:** Client-Side Only (In-memory JS processing).
* **Local Storage:** Zustand + localStorage for settings/name mappings; IndexedDB for chat history.

### 3.2 Data Handling

* **Input:** WhatsApp .txt export via FileReader or direct paste.
* **Parsing:** Regex identification of \[Timestamp\] Name: Message. iOS bracketed and Android dash formats supported. System messages dropped; `<This message was edited>` markers stripped.
* **Output:** Plain Text (.txt).
* **Off-thread processing:** Parsing + redaction run inside a Web Worker; main thread remains responsive on large chats. Synchronous fallback when Workers are unavailable.

### 3.3 Redaction Pipeline

Applied per message line in this order:
1. **Names** — case-insensitive, Unicode-aware lookaround boundaries (`(?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_])`), longest-first sort. Aggressive mode also targets name parts ≥3 chars.
2. **PII** (opt-in per category) — emails (`[EMAIL]`), URLs (`[LINK]`), phone numbers (`[PHONE]`).
3. **NSFW** (opt-in) — three tiers (general / slurs / graphic violence). Strategies: `mask` (`[REDACTED]`) or `soften` (per-tier replacement). Slurs always emit `[REDACTED-SLUR]`. Leetspeak-aware. User-extensible via extra-words and allowlist.

### 3.4 Wordlist Source

* **NSFW general tier:** Shutterstock LDNOOBW English list (MIT). Bundled at build time via `pnpm gen:wordlist`. No runtime fetch.
* **Slurs:** curated, base64-encoded in source.
* **Violence:** curated.

## **4. Design and UX Specifications**

### 4.1 Color Scheme (Light & Dark Mode)

**Light Mode:**

* **Primary:** #6366F1 (Indigo 500)
* **Secondary:** #8B5CF6 (Violet 500)
* **Accent:** #A78BFA (Violet 400)
* **Background:** #F5F3FF (Warm lavender tint)
* **Surface:** #EDE9FE
* **Card BG:** #FFFFFF
* **Border:** #E0D9FF
* **Text:** #1E1B4B (Deep indigo)
* **Text Muted:** #6B7280

**Dark Mode:**

* **Primary:** #818CF8 (Indigo 400)
* **Secondary:** #A78BFA (Violet 400)
* **Accent:** #C4B5FD (Violet 300)
* **Background:** #0D0B1E (Deep indigo-black)
* **Surface:** #13102B
* **Card BG:** #1A1830
* **Border:** #2D2850
* **Text:** #EDE9FE
* **Text Muted:** #9CA3AF

### 4.2 Layout

1. **Above-the-Fold Upload:** Home page uses a two-column layout on desktop (tagline left, upload card right) so users
   can start redacting without scrolling.
2. **Three-Step Workflow:** Step 1: Input → Step 2: Configure → Step 3: Export (shown via stepper in the Redact page
   header).
3. **Responsive:** Mobile-first. Upload card stacks below hero text on small screens.
4. **Output Display:** Read-only scrollable virtualized monospace text area (supports very large files).

### 4.3 Navigation

* Sticky top nav with: Logo, Name Mappings, History, Theme Toggle, Feedback, Twitter, GitHub.
* Pages: Home (`/`), Redact (`/redact`), History (`/history`), Mappings (`/mappings`), Feedback (`/feedback`).