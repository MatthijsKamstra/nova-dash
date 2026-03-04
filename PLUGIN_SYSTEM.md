# NovaDash Plugin System

## Overzicht

Het plugin-systeem stelt je in staat om modules (chat, todo, pomodoro, etc.) **aan en uit te zetten** in de Settings. Dit houdt je sidebar schoon en je kunt modules uitzetten die je niet gebruikt.

## Hoe het werkt

### 1. **Plugin Registry** (`src/plugins.js`)

Alle modules zijn gedefinieerd in een `PLUGINS` array met metadata:

```javascript
{
  id: 'chat',                      // Unieke ID
  label: 'Ollama Chat',            // Weergave naam
  icon: 'bi-chat-dots-fill',       // Bootstrap icon
  page: 'chat',                    // HTML bestand (pages/chat.html)
  enabledByDefault: true,          // Standaard ingeschakeld?
  requiredPlatform: null           // 'darwin' (macOS), 'win32', of null (alles)
}
```

### 2. **Sidebar Rendering** (`src/app.js`)

Bij het starten:
1. Laad de lijst met ingeschakelde plugins
2. Filter plugins op basis van platform (bijv. image-gen alleen op macOS)
3. Render sidebar-knoppen dynamisch

```javascript
await renderPluginsSidebar()  // Wordt aangeroepen bij DOMContentLoaded
```

### 3. **Instellingen** (`src/pages/settings.html`)

In de Settings pagina kun je via toggles schakelaars alle plugins in-/uitschakelen.

Opgeslagen in:
- **Browser mode**: `localStorage` (key: `nd-plugins-enabled`)
- **Electron mode**: Database via `window.novaDash.settings`

## Een nieuwe plugin toevoegen

### Stap 1: Maak een HTML pagina

Voeg een bestand toe in `src/pages/<plugin-id>.html`:

```html
<!-- src/pages/my-plugin.html -->
<div class="nd-page-title">
	<i class="bi bi-star-fill"></i> My Plugin
</div>

<div class="row">
	<div class="col-12">
		<div class="nd-card">
			<p>Hello from my plugin!</p>
		</div>
	</div>
</div>

<script>
	window.initPage_my_plugin = function() {
		console.log('My Plugin loaded!')
	}
</script>
```

> **Belangrijk**: De functienaam moet `initPage_<plugin-id>` zijn (met underscores in plaats van hyphens).

### Stap 2: Voeg plugin toe aan `plugins.js`

```javascript
{
  id: 'my-plugin',
  label: 'My Amazing Plugin',
  icon: 'bi-star-fill',
  page: 'my-plugin',
  enabledByDefault: true,
  requiredPlatform: null  // of 'darwin' / 'win32'
}
```

Klaar! De plugin verschijnt nu in Settings en kan in-/uitgeschakeld worden.

## Platform-specifieke Plugins

Sommige plugins werken alleen op bepaalde platforms:

- **macOS only** → `requiredPlatform: 'darwin'`
- **Windows only** → `requiredPlatform: 'win32'`
- **Alle platforms** → `requiredPlatform: null`

Voorbeeld:
```javascript
{
  id: 'image-gen',
  label: 'Image Generator',
  icon: 'bi-image-fill',
  page: 'image-gen',
  enabledByDefault: true,
  requiredPlatform: 'darwin'  // ← Alleen macOS!
}
```

## API / Functies

Alle plugin-functies zijn beschikbaar op het `window` object:

```javascript
// Alle plugins ophalen
getAllPlugins()

// Ingeschakelde plugins ophalen (gefilterd op platform)
await getEnabledPlugins()

// Lijst van ingeschakelde plugin-IDs
await getEnabledPluginIds()

// Plugin in/uitschakelen
await setPluginEnabled('chat', true)

// Plugin zoeken op ID
getPluginById('chat')

// Controleer of plugin op hudig platform beschikbaar is
isPluginAvailableOnPlatform('image-gen')
```

## Handmatig de sidebar herladen

Na het aan/uitschakelen van plugins wordt de sidebar automatisch herladen. Maar je kunt dit ook handmatig doen:

```javascript
// Sidebar herladen
await window.renderPluginsSidebar()
window.bindSidebar()

// Of ga naar Settings pagina
window.novaDashApp.navigateTo('settings')
```

## Opslag / Persistentie

**Plugin instellingen worden opgeslagen als:**

```json
[
  "chat",
  "todo",
  "pomodoro"
]
```

### Locaties:

- **Browser (dev mode)**:
  - `localStorage` key: `nd-plugins-enabled`

- **Electron (produktie)**:
  - SQLite database (ingesteld via `window.novaDash.settings.set()`)

## Troubleshooting

### Plugin verschijnt niet in sidebar?

1. Controleer dat de plugin `enabledByDefault: true` is in `plugins.js`
2. Controleer dat `requiredPlatform` overeenkomt met je OS
3. Open DevTools en voer uit:
   ```javascript
   await getEnabledPlugins()
   ```

### "initPage_<id> is not a function"?

Zorg dat je JavaScript functie in je HTML pagina juist is benoemd:

```javascript
// ✅ Correct
window.initPage_my_plugin = function() {}

// ❌ Fout
window.initPage_my-plugin = function() {}  // Hyphens → underscores!
```

### Plugin werkt op macOS maar niet Windows?

Controleer de `requiredPlatform` instelling in `plugins.js`. Zorg dat cross-platform plugins geen macOS-specifieke API's gebruiken.

## Vorige Sidebar Architecture

Voor referentie: voorheen hadden we hardcoded buttons in `src/index.html`:

```html
<!-- ❌ Oud: statisch -->
<button class="nd-nav-btn" data-page="chat" title="Ollama Chat">
  <i class="bi bi-chat-dots-fill"></i>
</button>
```

Nu is dit volledig dynamisch en wordt gegenereerd uit `plugins.js` ✅

---

**Klaar?** Test het systeem door:
1. Een plugin uit te schakelen in Settings
2. De sidebar te controleren (knop verdwijnt)
3. Opnieuw in te schakelen (knop keert terug)
