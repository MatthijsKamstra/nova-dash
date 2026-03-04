# NovaDash Dynamic Plugin System (v2.0)

## 🎯 Overzicht

Het **plugin-systeem v2.0** laadt plugins dynamisch vanuit `manifest.json` files in plaats van hardcoding. Dit stelt je in staat om:

- ✅ **Plugins toe te voegen zonder code aan te raken**
- ✅ **Requirements per plugin te documenteren**
- ✅ **Platform-specifieke support** (macOS-only, Windows-only, etc.)
- ✅ **Plugin instellingen in Settings UI**

## 📁 Folder Structuur

```
src/
├── plugins.js              # Plugin loader (dynamisch)
├── plugins/                # 🆕 Plugin folder
│   ├── chat/
│   │   ├── manifest.json   # Metadata (naam, icon, requirements)
│   │   └── plugin.html     # UI content
│   ├── todo/
│   │   ├── manifest.json
│   │   └── plugin.html
│   ├── image-gen/
│   │   ├── manifest.json
│   │   └── plugin.html
│   └── ... (meer plugins)
│
└── pages/                  # Speciale pages (niet in plugin systeem)
    ├── home/
    │   └── page.html       # Dashboard
    ├── settings/
    │   └── page.html       # Settings
```

## 📄 Plugin Manifest Structure

Elk plugin heeft een `manifest.json` met metadata:

```json
{
  "id": "chat",
  "label": "Ollama Chat",
  "icon": "bi-chat-dots-fill",
  "description": "Chat with a local language model powered by Ollama",
  "enabledByDefault": true,
  "requiredPlatform": null,
  "requirements": [
    {
      "name": "Ollama",
      "type": "service",
      "installed": false,
      "url": "https://ollama.ai",
      "description": "Local Ollama service must be running on http://localhost:11434",
      "instructions": "1. Download Ollama\n2. Run 'ollama serve'\n3. Pull a model: 'ollama pull mistral'"
    }
  ]
}
```

### Manifest Fields

| Field | Type | Beschrijving |
|-------|------|-------------|
| `id` | string | Unieke plugin identifier (folder naam) |
| `label` | string | Weergave naam (in sidebar & settings) |
| `icon` | string | Bootstrap icon class (bijv. `bi-chat-dots-fill`) |
| `description` | string | Korte beschrijving |
| `enabledByDefault` | boolean | Standaard ingeschakeld? |
| `requiredPlatform` | string\|null | `null` = all, `darwin` = macOS, `win32` = Windows |
| `requirements` | array | List van benodigde externe services/APIs |

### Requirements Object

```json
{
  "name": "Ollama",           // Naam van requirement
  "type": "service",          // Type: service, browser-api, permission, config, database, platform
  "installed": false,         // Is het installed/available?
  "url": "https://ollama.ai", // Download/info URL
  "description": "...",       // Wat is het?
  "instructions": "..."       // Hoe te installeren?
}
```

## 🚀 Hoe Plugins Inladen

Op app-start:

1. **`DOMContentLoaded`** event → `app.js` boot
2. **`await loadPlugins()`** → laadt alle `manifest.json` files van `src/plugins/*/`
3. **`PLUGINS` array** wordt dynamisch gepoputeerd
4. **`renderPluginsSidebar()`** genereert sidebar knoppen op basis van enabled plugins
5. Wanneer je een plugin opent → `plugins/<id>/plugin.html` wordt geladen

## 📝 Een Nieuw Plugin Toevoegen

### Stap 1: Maak een folder

```bash
mkdir src/plugins/my-plugin
```

### Stap 2: Maak manifest.json

```json
{
  "id": "my-plugin",
  "label": "My Amazing Plugin",
  "icon": "bi-star-fill",
  "description": "Does something awesome",
  "enabledByDefault": true,
  "requiredPlatform": null,
  "requirements": []
}
```

### Stap 3: Maak plugin.html

```html
<div class="nd-page-title">
  <i class="bi bi-star-fill"></i> My Plugin
</div>

<div class="nd-card">
  <p>Hello from my plugin!</p>
</div>

<script>
  window.initPage_my_plugin = function() {
    console.log('My plugin initialized!')
  }
</script>
```

### Stap 4: Voeg ID toe aan `loadPlugins()` in `plugins.js`

```javascript
const pluginIds = [
  'chat',
  'todo',
  'my-plugin',      // ← Toevoegen!
  // ... rest
]
```

✅ **Klaar!** Je plugin verschijnt nu in:
- Sidebar (als ingeschakeld)
- Settings pagina (met toggle)

## 🔄 Hoe Plugin Loading Werkt

```javascript
// 1. Load manifests
await loadPlugins()
// PLUGINS = [
//   { id: 'chat', label: 'Chat', ... },
//   { id: 'todo', label: 'To-Do', ... }
// ]

// 2. Filter on platform
const enabled = await getEnabledPlugins()
// Excludes plugins where requiredPlatform !== current platform

// 3. Render sidebar buttons
await renderPluginsSidebar()
// Creates <button data-page="chat"> etc.

// 4. Load plugin HTML on navigation
navigateTo('chat')
// fetch('plugins/chat/plugin.html')
```

## 🎛️ Settings - Plugin Management

In **Settings > Plugins & Modules**:
- Toggle plugins aan/uit
- Zien welke enabled zijn
- Zien requirements voor **alle plugins**
- Requirements worden gefilterd op `installed` status

Per enabled plugin zie je:
- ✅ Icon + naam
- Toggle switch (aan/uit)
- Vereisten met status (✅ = installed, ⚠️ = required)

## 🔧 Engine (Plugin Loading Code)

### `plugins.js` - Main Plugin Loader

```javascript
// Laadt alle manifests
async function loadPlugins() {
  const pluginIds = ['chat', 'todo', ...]
  for (const id of pluginIds) {
    const manifest = await fetch(`plugins/${id}/manifest.json`)
    PLUGINS.push(manifest)
  }
}

// Filter op platform & enabled status
async function getEnabledPlugins() {
  return PLUGINS.filter(p => {
    // Platform check
    if (p.requiredPlatform && p.requiredPlatform !== window.__platform)
      return false
    // Enabled status check
    return enabledIds.includes(p.id)
  })
}

// Persist enabled plugins
async function setPluginEnabled(id, enabled) {
  const ids = await getEnabledPluginIds()
  const updated = enabled
    ? [...ids, id]
    : ids.filter(x => x !== id)
  localStorage.setItem('nd-plugins-enabled', JSON.stringify(updated))
}
```

### `app.js` - Router Update

```javascript
async function navigateTo(page) {
  // Bepaal of het een plugin of speciale page is
  const isPlugin = PLUGINS.some(p => p.page === page)
  const path = isPlugin 
    ? `plugins/${page}/plugin.html`
    : `pages/${page}/page.html`
  
  const html = await fetch(path).then(r => r.text())
  // ... load en initialize
}
```

## 💾 Opslag

Plugin enabled-status wordt opgeslagen in:
- **Browser mode**: `localStorage['nd-plugins-enabled']` = `["chat","todo","pomodoro"]` (JSON array)
- **Electron mode**: SQLite database via `window.novaDash.settings`

## 🎨 Platform-Specifieke Plugins

Sommige plugins werken alleen op bepaalde platforms:

```json
{
  "id": "image-gen",
  "label": "Image Generator",
  "requiredPlatform": "darwin"  // ← macOS only!
}
```

Op Windows/Linux:
- Plugin verdwijnt uit sidebar
- Verschijnt niet in enabled plugins

## 🧪 Testing

```bash
# Dev mode with hot reload
npm run dev

# Controleer console in DevTools
window.PLUGINS          // Alle geladen plugins
window.getEnabledPlugins() // Ingeschakelde plugins
window.loadPlugins()    // Handmatig herladen

# Test Settings page
navigateTo('settings')  // Triggers initPage_settings
```

## ❓ F.A.Q.

**Q: Kan ik een plugin uit settings permanent uitzetten?**  
A: Ja! Toggle in Settings > Plugins wordt opgeslagen in localStorage/SQLite.

**Q: Wat gebeurt er als een plugin manifest niet geladen kan worden?**  
A: Het wordt overgeslagen (warning in console) en de rest laadt normaal.

**Q: Kan ik plugins remote laden (bijv. van CDN)?**  
A: Ja, je kunt `loadPlugins()` aanpassen om van elke URL te fetch'en. Momenteel laadt het lokaal.

**Q: Hoe maak ik een plugin platform-specific?**  
A: Zet `requiredPlatform: "darwin"` (macOS) of `"win32"` (Windows) in manifest.json.

## 📚 Zie Ook

- [PLUGIN_SYSTEM.md](PLUGIN_SYSTEM.md) — Oude v1.0 documentatie (verouderd)
- [CLAUDE.md](CLAUDE.md) — Algemene project guidelines

---

**Versie**: 2.0 (Dynamic Plugin Loader)  
**Datum**: 2026-03-04
