# CLAUDE.md — Nova-Dash Project Context

> This document is the primary source of truth for the NovaDash project.
> Always consult this file before making architectural or feature decisions.

---

## Project Overview

**NovaDash** is a personal assistant GUI built with Electron.
The goal is to bring together a collection of tools and automations into a single, unified interface — reducing the need to open multiple individual apps or websites.

It is designed to be:

- An **installable desktop app** (Electron) for **Windows and macOS**
- Also runnable as a **local website** for fast testing and iteration (with hot reload)
- **Self-contained**: everything lives in one folder, no external web-hosted dependencies

---

## Tech Stack

| Layer            | Technology                         |
| ---------------- | ---------------------------------- |
| Runtime          | Node.js                            |
| Desktop wrapper  | Electron                           |
| UI Framework     | Bootstrap 5                        |
| Icons            | Bootstrap Icons                    |
| Database         | SQLite (via `better-sqlite3`)      |
| Hot reload (dev) | `electron-reload` / `browser-sync` |
| Theming          | Bootstrap dark/light mode          |

---

## UI Design

- Inspired by **VS Code**: a vertical sidebar on the left with **icon-only navigation**
- Clicking an icon switches the main content panel (single-page app style)
- Support for **dark mode and light mode** toggle
- Responsive enough to also work as a browser-based UI during development

---

## Pages / Modules

Each module is developed as a standalone component and integrated as a page in NovaDash.
Below is the current list of planned pages:

| #   | Page                       | Description                                               | Platform     |
| --- | -------------------------- | --------------------------------------------------------- | ------------ |
| 1   | **Dashboard (Home)**       | Overview of most-used components and quick access widgets | All          |
| 2   | **Ollama Chat**            | General chat interface powered by a local Ollama model    | All          |
| 3   | **Ollama Image Generator** | Generate images via Ollama (e.g. diffusion models)        | macOS only\* |
| 4   | **Ollama Translator**      | Translate text using a local Ollama model                 | All          |
| 5   | **Speech-to-Text**         | Record audio and transcribe to text                       | All          |
| 6   | **Job Hunting Assistant**  | Generate motivatiebrief and custom CV from job postings   | All          |
| 7   | **Pomodoro Tracker**       | Focus timer with session logging                          | All          |
| 8   | **To-Do List**             | Simple task management with SQLite persistence            | All          |
| 9   | **Obsidian Integration**   | Create and manage Markdown files for Obsidian vaults      | All          |

> \* Some Ollama features currently only work on macOS. Platform-specific code paths must be handled gracefully (show a message on unsupported platforms).

---

## Homepage / Dashboard

The homepage shows a **quick-access overview** of the most-used modules:

- Recent to-do items
- Pomodoro session status / start button
- Recent Obsidian notes
- Quick shortcut tiles to all other modules

---

## Architecture Notes

- **Single folder, self-contained**: The app must be packageable with `electron-builder` without any runtime web fetching.
- **SQLite** is used for persisting: to-do items, pomodoro sessions, settings, and other local data.
- **Ollama** runs locally on the user's machine. The app communicates with the Ollama REST API (`http://localhost:11434`).
- Pages that are not yet built should have a **placeholder UI** so the sidebar and navigation can be tested end-to-end.
- The **web mode** (browser testing) should work with a simple `npm run dev` or `npm start` that opens a browser with live reload.

---

## Development Workflow

```bash
# Install dependencies
npm install

# Run as website (hot reload for fast iteration)
npm run dev

# Run as Electron app
npm start

# Build installer
npm run build
```

---

## Folder Structure (target)

```
nova-dash/
├── main.js                  # Electron main process
├── preload.js               # Electron preload script
├── package.json
├── CLAUDE.md                # This file
├── .github/
│   └── copilot-instructions.md
├── src/
│   ├── index.html           # App shell (sidebar + content area)
│   ├── app.js               # Frontend router / logic
│   ├── styles/
│   │   └── main.css         # Custom styles on top of Bootstrap
│   ├── pages/
│   │   ├── home.html        # Dashboard homepage
│   │   ├── chat.html        # Ollama Chat
│   │   ├── image-gen.html   # Ollama Image Generator
│   │   ├── translator.html  # Ollama Translator
│   │   ├── stt.html         # Speech-to-Text
│   │   ├── pomodoro.html    # Pomodoro Tracker
│   │   ├── todo.html        # To-Do List
│   │   └── obsidian.html    # Obsidian Integration
│   └── db/
│       └── database.js      # SQLite setup and queries
├── assets/
│   └── icons/               # App icons (icns, ico, png)
└── dist/                    # Built installers (gitignored)
```

---

## Platform-Specific Notes

- **Ollama image generation** only works on macOS currently — render a graceful "not available on this platform" message on Windows.
- Use `process.platform` in both main and renderer to detect OS.
- **Speech-to-Text** will use the Web Speech API in browser mode; in Electron, consider a native binding or Whisper via Ollama.
- **Obsidian integration** reads/writes `.md` files to a user-configured vault folder path (stored in SQLite settings).

---

## Future Considerations

- Plugin/module system so new tools can be added without touching core code
- Sync / backup of SQLite database
- Keyboard shortcuts for switching between pages (like VS Code)
- Notification system for Pomodoro timers
- Tray icon support (Electron)
