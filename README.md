# Daily Learner

Chrome / Edge (Manifest V3) side-panel extension that delivers a daily AI-written learning article plus a 5-question quiz, and can turn any public article URL into a summary + quiz. Generation uses your **Cursor API key** via no-repo [Cloud Agents](https://cursor.com/docs/cloud-agent/api/overview).

## Stack

WXT + React + TypeScript + Tailwind CSS + shadcn/ui primitives.

## Setup

```bash
npm install
npm run dev
```

The WXT/Vite reload server binds to port **3847** (uncommon on purpose).

Production build:

```bash
npm run build
```

Output lands in `.output/chrome-mv3` (dev) or `.output/chrome-mv3` after `build`.

## Load unpacked (Chrome or Edge)

1. Run `npm run dev` (or `npm run build`).
2. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the folder:
   - Dev: `.output/chrome-mv3`
   - Build: `.output/chrome-mv3`
5. Pin **Daily Learner** and click the toolbar icon to open the side panel.

## Cursor API key

1. Open [Cursor Dashboard → API Keys](https://cursor.com/dashboard) and create a user API key.
2. In the extension side panel, open **Settings**.
3. Paste the key (stored only in `chrome.storage.local` on this device).
4. Optionally set interest tags, notification preference, and daily pre-generate time.
5. Return to **Today** and click **Generate today’s lesson**.

The extension creates a **no-repo** cloud agent (`POST https://api.cursor.com/v1/agents` with no `repos` / `env`), streams the run when possible, and falls back to polling. It expects JSON with `title`, `topic`, `articleMarkdown`, `sources`, and `quiz`.

## Features (v1)

- **Today’s lesson** — generate, cache by date in `chrome.storage.local`, morning `chrome.alarms` pre-generation
- **Quiz** — 5 multiple-choice questions, score, explanations, streak / history
- **Learn from a link** — fetch page HTML, Readability extract, summary + quiz
- Clear empty / missing-key / bad-URL / generation-error states

## Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Extension dev build + reload on port **3847** |
| `npm run build`   | Production Chrome/Edge MV3                   |
| `npm run compile` | Typecheck only                               |
| `npm run demo`    | Optional UI preview (sample data) on **3848** |

## Note on pull requests

This greenfield session may start as a temporary agent repo. If opening a PR fails with `repoKind="agent_temp"`, create a real repository from the agent UI first, then open the PR from branch `cursor/daily-learner-extension-fd8a` into `main`.
