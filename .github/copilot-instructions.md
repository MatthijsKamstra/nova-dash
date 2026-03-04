# GitHub Copilot Instructions — NovaDash

## Project Summary

NovaDash is a personal assistant desktop app built with **Electron + Node.js**.
It features a **VS Code-style icon-only sidebar** for navigation and integrates multiple tools into one unified GUI.

Always read `CLAUDE.md` in the project root for full context before making decisions.

---

## Tech Stack

- **Electron** — desktop app wrapper (Windows + macOS)
- **Node.js** — runtime
- **Bootstrap 5** — UI framework
- **Bootstrap Icons** — icon set for sidebar and UI elements
- **SQLite** (`better-sqlite3`) — local persistent storage
- **HTML/CSS/Vanilla JS** — frontend (no frontend framework like React/Vue)
- Hot reload in dev via `electron-reload` or `browser-sync`

---

## Code Style & Conventions

- Use **vanilla JavaScript** (ES6+), no TypeScript unless explicitly requested
- Use **Bootstrap 5 utility classes** as much as possible before writing custom CSS
- Custom CSS goes in `src/styles/main.css`
- Use **Bootstrap Icons** (`bi bi-*`) for all icons
- Page content is loaded into a `#content` div via the sidebar router (`app.js`)
- Plugins are loaded via `src/plugins.js` from `src/plugins/<id>/manifest.json`
- SQLite queries are centralised in `src/db/database.js`
- Support both **dark mode** and **light mode** using Bootstrap's `data-bs-theme` on `<html>`

---

## UI / Layout Rules

- The app shell (`src/index.html`) has two parts:
  1. A narrow left sidebar (`#sidebar`) — icon-only, like VS Code's activity bar
  2. A main content area (`#content`) — fills the rest of the screen
- Sidebar icons use Bootstrap Icons and are navigable (click = load page)
- Active page icon gets an `active` class
- Do NOT use iframes for pages — load HTML fragments dynamically via `fetch()` into `#content`
- Keep routing conventions:
  - `home` and `settings` are special pages: `src/pages/<id>/page.html`
  - Feature modules are plugins: `src/plugins/<id>/plugin.html`

---

## Pages / Modules

| Route key     | File                                  | Description                         |
| ------------- | ------------------------------------- | ----------------------------------- |
| `home`        | `src/pages/home/page.html`            | Dashboard special page              |
| `settings`    | `src/pages/settings/page.html`        | Settings special page               |
| `chat`        | `src/plugins/chat/plugin.html`        | Ollama Chat                         |
| `image-gen`   | `src/plugins/image-gen/plugin.html`   | Ollama Image Generator (macOS only) |
| `translator`  | `src/plugins/translator/plugin.html`  | Ollama Translator                   |
| `stt`         | `src/plugins/stt/plugin.html`         | Speech-to-Text                      |
| `job-hunting` | `src/plugins/job-hunting/plugin.html` | Job Hunting Assistant               |
| `pomodoro`    | `src/plugins/pomodoro/plugin.html`    | Pomodoro Tracker                    |
| `todo`        | `src/plugins/todo/plugin.html`        | To-Do List                          |
| `obsidian`    | `src/plugins/obsidian/plugin.html`    | Obsidian Markdown integration       |
| `time`        | `src/plugins/time/plugin.html`        | Local time widget page              |
| `weather`     | `src/plugins/weather/plugin.html`     | Local weather page                  |

---

## Ollama Integration

- Ollama runs locally at `http://localhost:11434`
- Use `fetch()` to call the Ollama REST API
- **Image generation** is currently macOS-only — always check platform and show a graceful message on Windows
- Detect platform with `process.platform` (Electron) or a preload-exposed flag

---

## SQLite

- All database logic lives in `src/db/database.js`
- Use `better-sqlite3` (synchronous API, preferred for Electron)
- Tables: `todos`, `pomodoro_sessions`, `settings`, `notes`
- Expose DB functions via Electron's `contextBridge` / `ipcMain` if needed from renderer

---

## Dos and Don'ts

**Do:**

- Keep each page as an independent HTML fragment
- Keep each plugin as `manifest.json` + `plugin.html` in `src/plugins/<id>/`
- Use Bootstrap grid and utilities for layout
- Handle platform differences gracefully (macOS vs Windows)
- Keep the app self-contained — no CDN links in production builds

**Don't:**

- Don't use React, Vue, or any frontend framework
- Don't fetch assets from the internet at runtime
- Don't put business logic in HTML files — keep JS in separate `.js` files
- Don't hardcode file paths — use `path.join` and user-configurable settings
- Don't add new flat pages under `src/pages/*.html` for features; use plugin folders
