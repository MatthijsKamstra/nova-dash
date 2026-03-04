# NovaDash Plugin System

Dit bestand is een korte ingang naar de actuele documentatie.

## Status

De implementatie draait op Plugin System v2 (manifest-based, dynamisch).

## Lees eerst

Volledige technische documentatie staat in:

- PLUGIN_SYSTEM_V2.md

## Kernpunten v2

- Plugins staan in src/plugins/<id>/ met manifest.json en plugin.html
- src/plugins.js laadt manifests en beheert enabled status
- src/app.js rendert de sidebar dynamisch en routeert naar plugins of special pages
- Settings page toont toggles en requirements op basis van manifests
- Recente toevoegingen: time en weather plugins

## Opmerking

Oude voorbeelden uit de eerdere, statische aanpak (pages/\*.html per plugin) zijn niet meer leidend.
