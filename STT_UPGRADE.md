# STT Module Upgrade — Implementation Summary

> **Datum**: 6 maart 2026
> **Filosofie**: Web-tech first, maar met de beste ideeën uit AI Transcribe guide

---

## ✅ Wat is geïmplementeerd

### 1. **macOS Menu Bar (Tray) Integratie**

**Locatie**: `main.js`

- Menu bar icon met context menu
- Shortcuts:
  - 🎤 Start Recording → opent STT en start opname
  - ⏹ Stop Recording → stopt lopende opname
  - Open STT → navigeert naar STT plugin
  - Open Chat → navigeert naar Chat plugin
  - Quit → sluit app
- **Status indicator** in menu bar titel:
  - 🔴 = Recording
  - ⚙️ = Transcribing
  - (leeg) = Idle
- **macOS window behavior**: hide i.p.v. quit bij venster sluiten

**Hoe te gebruiken**:

- Klik op NovaDash icon in menu bar
- Kies "Start Recording" voor snelle voice capture zonder app te openen

---

### 2. **VAD (Voice Activity Detection) Visual**

**Locatie**: `src/plugins/stt/plugin.html`

**Features**:

- **Live audio visualisatie** tijdens opname (5 dansende bars)
- **Voice indicator states**:
  - Idle (grijs) = stilte
  - Active (groen, pulserend) = spraak gedetecteerd
  - Dynamische hoogte op basis van volume (--volume CSS variabele)
- **Auto-silence stop**: stopt automatisch na 3 seconden stilte
- **Real-time status**: "Luisteren..." / "Spreekt..." / "Stilte..."

**Techniek**:

- `AudioContext` + `AnalyserNode` op microfoon stream
- RMS (Root Mean Square) berekening elke 50ms
- Threshold: 15 (aanpasbaar via `SILENCE_THRESHOLD`)
- CSS keyframe animaties voor smooth bouncing bars

---

### 3. **SQLite History met FTS Search**

**Locatie**: `src/db/database.js`, `main.js`, `preload.js`

**Schema**:

```sql
CREATE TABLE stt_transcripts (
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  language TEXT,
  model TEXT,
  duration INTEGER,  -- seconden
  confidence REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- FTS5 full-text search
CREATE VIRTUAL TABLE stt_transcripts_fts USING fts5(
  text,
  content='stt_transcripts',
  content_rowid='id'
);
```

**Features**:

- **Persistente opslag** in SQLite (niet localStorage)
- **Full-text search** via FTS5 (vind "hallo" in hele geschiedenis)
- **Metadata tracking**: taal, model, duur, confidence
- **Graceful fallback**: localStorage in browser mode
- **Search UI**: real-time zoeken met debounce (300ms)
- **Triggers**: FTS blijft automatisch in sync bij INSERT/UPDATE/DELETE

**IPC API**:

- `stt:save(transcript)` → opslaan
- `stt:getHistory(limit, offset)` → pagineren
- `stt:search(query, limit)` → FTS search
- `stt:delete(id)` → verwijderen

---

### 4. **IndexedDB Model Caching**

**Locatie**: `src/plugins/stt/plugin.html`

**Configuratie**:

```javascript
env.allowRemoteModels = true;
env.allowLocalModels = true;
env.useBrowserCache = true; // ← KEY CHANGE
```

**Voordeel**:

- **Eerste keer**: download van CDN (~140MB voor base.en)
- **Daarna**: model uit IndexedDB (offline!)
- **Zelfde web-tech stack**, maar self-contained na setup
- Progress bar geeft aan: "Downloaden" vs "Laden"

---

### 5. **Tray Status Synchronisatie**

**Locatie**: `main.js` (IPC handler), `src/plugins/stt/plugin.html` (sender)

**Flow**:

1. STT plugin roept `window.novaDash.tray.updateStatus('recording')`
2. IPC event naar main process
3. Main process:
   - Update tray titel (🔴/⚙️)
   - Enable/disable "Stop Recording" menu item
   - Refresh context menu

**States**:

- `idle` → clear tray icon
- `recording` → 🔴 + enable stop button
- `transcribing` → ⚙️ + disable stop button

---

## 🎯 Belangrijkste Voordelen

### Web-Tech First ✅

- Nog steeds `@xenova/transformers` via CDN
- Nog steeds browser MediaRecorder API
- Nog steeds client-side transcriptie
- **Geen server** nodig
- **Geen whisper.cpp** binary (voorlopig)

### Offline-First After Setup ✅

- Models cache in IndexedDB
- Transcripts in SQLite lokaal
- Geen runtime web fetching na eerste model download

### UX Wins ✅

- **Snelle capture**: menu bar → record in 1 klik
- **Visuele feedback**: zie daadwerkelijk wanneer je spreekt
- **Auto-stop**: geen handmatige stop meer nodig
- **Doorzoekbare geschiedenis**: vind oude transcripts instant

### Privacy ✅

- Alles lokaal
- Geen cloud API calls
- Geen externe opslag

---

## 🔧 Technische Details

### Bestanden Gewijzigd

1. **main.js**
   - Tray menu setup
   - IPC handlers voor `stt:*`
   - Tray status updates
   - Window hide behavior op macOS

2. **preload.js**
   - `window.novaDash.stt.*` API
   - `window.novaDash.tray.updateStatus()`
   - `window.novaDash.onTrayCommand()` listener

3. **src/db/database.js**
   - `stt_transcripts` table
   - `stt_transcripts_fts` FTS5 table
   - Triggers voor sync
   - CRUD functies

4. **src/plugins/stt/plugin.html**
   - VAD visual component HTML
   - VAD CSS animaties
   - `startVADMonitoring()` functie
   - `updateVoiceIndicator()` RMS berekening
   - Auto-silence timeout
   - DB integratie (save/load/search)
   - Search input + handlers
   - Tray status calls

5. **src/app.js**
   - `setupTrayListeners()` voor navigatie events

---

## 🚀 Wat Nu?

### Klaar om te testen

```bash
npm start
```

**Test scenario's**:

1. Klik menu bar icon → "Start Recording"
2. Spreek iets → zie groene bars dansen
3. Zwijg 3 seconden → auto-stop
4. Check transcriptie in history
5. Zoek in history met search box
6. Klik menu bar icon → status moet idle zijn

### Volgende Stappen (Optioneel)

#### Quick Wins

- [ ] Custom tray icons (idle.png, recording.png, transcribing.png)
- [ ] Keyboard shortcuts (`cmd+shift+R` voor quick record)
- [ ] Export transcript naar file/clipboard

#### Dieper

- [ ] Whisper.cpp backend (volledig offline, geen CDN)
  - Vereist: binary compileren, FFmpeg, model files lokaal
  - Voordeel: sneller, meer models, taal-specifieke optimalisatie
  - Nadeel: platform-afhankelijk, grotere bundle size

#### Advanced

- [ ] Background recording mode (minimize app, blijf opnemen)
- [ ] Multi-speaker diarization (wie zei wat)
- [ ] Timestamps in transcript (word-level)
- [ ] Real-time streaming transcriptie (tijdens opname al tekst zien)

---

## 📚 Referenties

**Geïnspireerd door**:

- AI Transcribe Integration Guide (whisper.cpp aanpak)
- Nova-Dash web-tech filosofie

**Dependencies**:

- `@xenova/transformers` (Whisper in browser)
- `better-sqlite3` (SQLite FTS)
- Web Audio API (VAD)

**Relevante Docs**:

- [Transformers.js Docs](https://huggingface.co/docs/transformers.js)
- [SQLite FTS5](https://www.sqlite.org/fts5.html)
- [Electron Tray](https://www.electronjs.org/docs/latest/api/tray)

---

**End of Summary** 🎉
