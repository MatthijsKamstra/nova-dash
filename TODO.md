# TODO

## Plugin Capabilities & Permissions

1. Definieer capability schema in manifests

- [x] Voeg `capabilities` toe aan plugin manifest formaat.
- [x] Voeg `capabilityReasons` toe voor user-facing uitleg per capability.
- [x] Pas `stt/manifest.json` aan met `"microphone"` capability.

2. Host-side permission broker in Electron

- [x] Lees plugin manifest in `main.js` en cache dit.
- [x] Valideer capability requests tegen gedeclareerde manifest capabilities.
- [x] Voeg IPC endpoint toe: `permissions:request-capability`.
- [x] Implementeer `microphone` capability afhandeling (macOS + fallback).

3. Renderer/preload API

- [x] Expose in `preload.js`: `window.novaDash.permissions.requestCapability(pluginId, capability)`.
- [x] Houd bestaande specifieke permission helpers voorlopig compatibel.

4. STT migratie naar broker

- [x] Vervang directe microfoon permission call door capability request.
- [x] Toon duidelijke foutmelding bij `capability-not-declared`.
- [x] Houd fallback voor `navigator.mediaDevices.getUserMedia` checks.

5. Documentatie

- [ ] Werk `PLUGIN_SYSTEM_V2.md` bij met capability-sectie.
- [ ] Voeg manifest voorbeeld toe met `capabilities` en `capabilityReasons`.
- [ ] Documenteer broker flow: plugin -> preload -> ipc -> main -> OS permission.
- [ ] Voeg lijst met standaard `reason` waarden toe (`granted`, `denied`, `capability-not-declared`, etc.).

6. Security hardening voor downloadbare plugins

- [ ] Voeg trust level toe in manifest (`builtin`, `verified`, `community`).
- [ ] Maak default policy: community plugins starten met deny op gevoelige capabilities.
- [ ] Voeg optionele network capability + whitelist model toe.

7. UX in Settings

- [ ] Toon capabilities per plugin in Settings.
- [ ] Voeg per capability status toe (allowed/denied/ask).
- [ ] Voeg knop toe om eerder gegeven toestemming te resetten.

8. Persistente policy

- [ ] Sla user decisions op in SQLite settings (bijv. `plugin_permissions`).
- [ ] Gebruik key-structuur zoals `${pluginId}:${capability}`.
- [ ] Pas broker aan om eerst policy te controleren, dan pas OS prompt.

9. Tests / smoke tests

- [ ] Test STT op macOS met first-run permission prompt.
- [ ] Test denied flow + herstel via System Settings.
- [ ] Test behavior als capability ontbreekt in manifest.
- [ ] Test browser mode fallback zonder Electron bridge.

10. Packaging

- [x] Zet `NSMicrophoneUsageDescription` in `package.json` (`build.mac.extendInfo`).
- [ ] Verifieer prompttekst in packaged mac app (.dmg).

## Kortetermijn Next Step

- [ ] Eerst `PLUGIN_SYSTEM_V2.md` updaten (sectie: Capabilities & Permission Broker), daarna Settings UI uitbreiden.
