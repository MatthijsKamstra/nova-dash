const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const fs = require('fs')

// Store DB in user data directory so it persists across app updates
const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '..', '..')
const dbPath = path.join(userDataPath, 'nova-dash.db')

// Ensure directory exists
if (!fs.existsSync(userDataPath)) {
	fs.mkdirSync(userDataPath, { recursive: true })
}

const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')

// ── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS stt_transcripts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    text       TEXT NOT NULL,
    language   TEXT,
    model      TEXT,
    duration   INTEGER,
    confidence REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS todos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    text      TEXT NOT NULL,
    done      INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    duration   INTEGER NOT NULL,  -- minutes
    type       TEXT NOT NULL DEFAULT 'work',  -- 'work' | 'short_break' | 'long_break'
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at   TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    tags       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Create FTS5 table for STT transcript search (after main tables)
try {
	db.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS stt_transcripts_fts USING fts5(
			text,
			content='stt_transcripts',
			content_rowid='id'
		);

		-- Triggers to keep FTS in sync
		CREATE TRIGGER IF NOT EXISTS stt_transcripts_ai AFTER INSERT ON stt_transcripts BEGIN
			INSERT INTO stt_transcripts_fts(rowid, text) VALUES (new.id, new.text);
		END;

		CREATE TRIGGER IF NOT EXISTS stt_transcripts_ad AFTER DELETE ON stt_transcripts BEGIN
			DELETE FROM stt_transcripts_fts WHERE rowid = old.id;
		END;

		CREATE TRIGGER IF NOT EXISTS stt_transcripts_au AFTER UPDATE ON stt_transcripts BEGIN
			DELETE FROM stt_transcripts_fts WHERE rowid = old.id;
			INSERT INTO stt_transcripts_fts(rowid, text) VALUES (new.id, new.text);
		END;
	`)
} catch (err) {
	console.warn('[DB] FTS5 setup warning (probably already exists):', err.message)
}

// ── To-Do ────────────────────────────────────────────────────────────────────

function getAllTodos() {
	return db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all()
}

function addTodo(text) {
	const stmt = db.prepare('INSERT INTO todos (text) VALUES (?)')
	const info = stmt.run(text)
	return db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid)
}

function toggleTodo(id) {
	db.prepare('UPDATE todos SET done = CASE WHEN done = 0 THEN 1 ELSE 0 END WHERE id = ?').run(id)
	return db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
}

function deleteTodo(id) {
	return db.prepare('DELETE FROM todos WHERE id = ?').run(id)
}

// ── Pomodoro ─────────────────────────────────────────────────────────────────

function getPomodoroSessions() {
	return db.prepare('SELECT * FROM pomodoro_sessions ORDER BY started_at DESC LIMIT 50').all()
}

function addPomodoroSession({ duration, type = 'work', ended_at = null }) {
	const stmt = db.prepare('INSERT INTO pomodoro_sessions (duration, type, ended_at) VALUES (?, ?, ?)')
	const info = stmt.run(duration, type, ended_at)
	return db.prepare('SELECT * FROM pomodoro_sessions WHERE id = ?').get(info.lastInsertRowid)
}

// ── Settings ─────────────────────────────────────────────────────────────────

function getSetting(key) {
	const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
	return row ? row.value : null
}

function setSetting(key, value) {
	db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
		.run(key, value)
	return { key, value }
}

// ── Notes ────────────────────────────────────────────────────────────────────

function getAllNotes() {
	return db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all()
}

function saveNote({ id, title, content, tags }) {
	if (id) {
		db.prepare('UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = datetime(\'now\') WHERE id = ?')
			.run(title, content, tags || null, id)
		return db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
	} else {
		const info = db.prepare('INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)').run(title, content, tags || null)
		return db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid)
	}
}

function deleteNote(id) {
	return db.prepare('DELETE FROM notes WHERE id = ?').run(id)
}

// ── STT Transcripts ──────────────────────────────────────────────────────────

function saveSTTTranscript({ text, language, model, duration, confidence }) {
	const stmt = db.prepare(`
		INSERT INTO stt_transcripts (text, language, model, duration, confidence)
		VALUES (?, ?, ?, ?, ?)
	`)
	const info = stmt.run(text, language || null, model || null, duration || null, confidence || null)
	return db.prepare('SELECT * FROM stt_transcripts WHERE id = ?').get(info.lastInsertRowid)
}

function getSTTTranscripts(limit = 50, offset = 0) {
	return db.prepare(`
		SELECT * FROM stt_transcripts
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`).all(limit, offset)
}

function searchSTTTranscripts(query, limit = 50) {
	try {
		return db.prepare(`
			SELECT t.* FROM stt_transcripts t
			JOIN stt_transcripts_fts fts ON t.id = fts.rowid
			WHERE stt_transcripts_fts MATCH ?
			ORDER BY rank
			LIMIT ?
		`).all(query, limit)
	} catch (err) {
		console.error('[DB] FTS search error:', err.message)
		// Fallback to LIKE search
		return db.prepare(`
			SELECT * FROM stt_transcripts
			WHERE text LIKE ?
			ORDER BY created_at DESC
			LIMIT ?
		`).all('%' + query + '%', limit)
	}
}

function deleteSTTTranscript(id) {
	return db.prepare('DELETE FROM stt_transcripts WHERE id = ?').run(id)
}

// ── Export ───────────────────────────────────────────────────────────────────

module.exports = {
	getAllTodos,
	addTodo,
	toggleTodo,
	deleteTodo,
	getPomodoroSessions,
	addPomodoroSession,
	getSetting,
	setSetting,
	getAllNotes,
	saveNote,
	deleteNote,
	saveSTTTranscript,
	getSTTTranscripts,
	searchSTTTranscripts,
	deleteSTTTranscript
}
