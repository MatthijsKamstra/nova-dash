# NovaDash Plugin System v2

Deze documentatie beschrijft de actuele plugin-oplossing in NovaDash.

## Doel

Het pluginsysteem maakt modules configureerbaar via Settings:

- Dynamische sidebar op basis van ingeschakelde plugins
- Metadata en requirements per plugin via manifest.json
- Platform filtering via requiredPlatform
- Persistente plugin toggles in Browser en Electron

## Kernarchitectuur

Belangrijkste bestanden:

- src/plugins.js
  - Laadt plugin manifests
  - Houdt plugin status bij (enabled/disabled)
  - Exporteert plugin API op window
- src/app.js
  - Boot sequence bij DOMContentLoaded
  - Dynamisch renderen van sidebar-knoppen
  - Router naar plugin pages en special pages
- src/plugins/<id>/manifest.json
  - Plugin metadata
- src/plugins/<id>/plugin.html
  - Plugin UI en init script
- src/pages/home/page.html
  - Special page (geen plugin)
- src/pages/settings/page.html
  - Special page met plugin toggles en requirements

## Huidige plugins

Plugin IDs die nu worden geladen:

- chat
- image-gen
- translator
- stt
- time
- weather
- job-hunting
- pomodoro
- todo
- obsidian

## Manifest formaat

Voorbeeld:

```json
{
  "id": "weather",
  "label": "Local Weather",
  "icon": "bi-cloud-sun-fill",
  "description": "Current local weather and short forecast",
  "enabledByDefault": true,
  "requiredPlatform": null,
  "requirements": [
    {
      "name": "Geolocation Permission",
      "type": "permission",
      "installed": true,
      "description": "Browser or Electron geolocation access is needed",
      "instructions": "Allow location access when prompted"
    }
  ]
}
```

Velden:

- id: unieke plugin-id en mapnaam
- label: naam in sidebar/settings
- icon: Bootstrap Icons class
- description: korte uitleg
- enabledByDefault: standaard aan of uit
- requiredPlatform: null, darwin, of win32
- requirements: lijst met afhankelijkheden of setupstappen

## Runtime flow

1. app.js wacht op DOMContentLoaded
2. window.loadPlugins() in src/plugins.js laadt manifests
3. renderPluginsSidebar() toont alleen enabled + platform-compatible plugins
4. navigateTo(home) opent default special page

Routering:

- home en settings worden geladen uit pages/<id>/page.html
- plugins worden geladen uit plugins/<id>/plugin.html

Belangrijk detail:

- Omdat pages via innerHTML worden geïnjecteerd, voert app.js scripts uit met executePageScripts(...). Daardoor worden initPage\_<id> functies uit plugin/page fragments correct geregistreerd.

## Settings gedrag

In src/pages/settings/page.html:

- getAllPlugins() toont alle plugins
- getEnabledPluginIds() bepaalt toggle-status
- setPluginEnabled(id, enabled) slaat op en herlaadt sidebar
- requirements uit manifests worden weergegeven in de UI

Opslag van toggles:

- Browser: localStorage key nd-plugins-enabled
- Electron: window.novaDash.settings key plugins_enabled

## Nieuwe plugin toevoegen

1. Maak map src/plugins/my-plugin
2. Voeg manifest.json toe
3. Voeg plugin.html toe
4. Voeg my-plugin toe aan pluginIds in src/plugins.js
5. Definieer init functie volgens router-conventie

Voorbeeld init naam bij plugin my-plugin:

```html
<script>
  window.initPage_my_plugin = async function () {
    // plugin init
  };
</script>
```

Let op: hyphens in page-id worden omgezet naar underscores voor init-functies.

## Error handling

- Als een manifest niet laadbaar is, logt de loader een warning en gaat door met andere plugins
- Als een route niet bestaat, toont de router een notFound template
- requiredPlatform sluit incompatibele plugins automatisch uit

## Smoke-test

1. Start met npm run dev
2. Open Settings
3. Zet een plugin uit
4. Verifieer dat de plugin uit sidebar verdwijnt
5. Refresh de app en controleer dat de status behouden blijft
6. Open de plugin en controleer dat init code loopt

## Wijzigingslog v2

- Migratie naar manifest-based plugin loading
- Router onderscheid tussen special pages en plugin pages
- Script execution fix voor dynamisch geladen HTML fragments
- Toegevoegd: time plugin
- Toegevoegd: weather plugin
