# NovaDash Model Guide

> Documentatie voor Ollama modellen en hun gebruik in NovaDash

## 📦 Geïnstalleerde Modellen Overzicht

### 💬 Chat & Algemeen Gebruik

**Chat Plugin** - Voor algemene conversaties en vragen

| Model                                   | Grootte | Beste Voor                              | Snelheid |
| --------------------------------------- | ------- | --------------------------------------- | -------- |
| `qwen3.5:2b-q4_K_M`                     | 1.9 GB  | Snelle responses, simpele vragen        | ⚡⚡⚡   |
| `llama3.2:3b`                           | 2.0 GB  | Balans tussen snelheid en kwaliteit     | ⚡⚡⚡   |
| `gemma3:4b`                             | 3.3 GB  | Google model, goed in redenen           | ⚡⚡     |
| `qwen2.5:7b-instruct-q4_K_M`            | 4.7 GB  | Veelzijdig, sterke instructie opvolging | ⚡⚡     |
| `qwen3.5:9b-q4_K_M`                     | ~7 GB   | Nieuwste versie, uitstekende kwaliteit  | ⚡       |
| `mistral-nemo:12b-instruct-2407-q4_K_M` | 7.5 GB  | Zeer capabel, lange context             | ⚡       |
| `qwen2.5:14b-instruct-q4_K_M`           | 9.0 GB  | Krachtigste lokale model                | ⚡       |
| `deepseek-r1:latest`                    | 5.2 GB  | Reasoning model, complexe problemen     | ⚡       |

**Aanbeveling:** Start met `qwen2.5:7b` voor dagelijks gebruik, schakel naar `14b` voor complexe taken.

---

### 🇳🇱 Nederlands Gespecialiseerd

| Model                          | Grootte | Beschrijving                      |
| ------------------------------ | ------- | --------------------------------- |
| `aacudad/gemma-3-DUTCH:latest` | 4.1 GB  | Speciaal getraind voor Nederlands |

**Gebruik:** Perfect voor Nederlandse conversaties, motivatiebrieven, en job hunting assistant!

---

### 🌍 Vertaling (Translator Plugin)

| Model                | Grootte | Talen                             | Kwaliteit  |
| -------------------- | ------- | --------------------------------- | ---------- |
| `translategemma:4b`  | 3.3 GB  | Multi-lingual, focus op vertaling | ⭐⭐⭐     |
| `translategemma:12b` | 8.1 GB  | Betere kwaliteit, meer nuance     | ⭐⭐⭐⭐⭐ |

**Special Format:** TranslateGemma gebruikt een speciaal format: `<2{TARGET_LANG}> {source_text}`

**Fallback:** Alle chat modellen kunnen ook vertalen, maar TranslateGemma is geoptimaliseerd ervoor.

---

### 🎨 Beeldgeneratie (Image Generator Plugin - macOS only)

| Model                    | Grootte | Stijl                         | Snelheid |
| ------------------------ | ------- | ----------------------------- | -------- |
| `x/flux2-klein:4b`       | 5.7 GB  | FLUX variant, goede kwaliteit | ⚡⚡     |
| `x/z-image-turbo:latest` | 12 GB   | Hoge kwaliteit, meer detail   | ⚡       |

**Platform:** Alleen macOS ondersteund door Ollama limitaties.

---

### 👁️ Beeldherkenning (Image Vision Plugin)

| Model              | Grootte | Beste Voor                               | Snelheid |
| ------------------ | ------- | ---------------------------------------- | -------- |
| `moondream:latest` | 1.7 GB  | Compacte vision AI, goede beschrijvingen | ⚡⚡⚡   |

**Functionaliteit:**

- Beschrijf afbeeldingen in detail
- Herken objecten en scènes
- Lees tekst uit afbeeldingen (OCR-achtig)
- Beantwoord vragen over afbeeldingen
- Detecteer kleuren, mood, compositie

---

### 📄 OCR Scanner Plugin

| Model              | Grootte | Beste Voor                       | Snelheid |
| ------------------ | ------- | -------------------------------- | -------- |
| `moondream:latest` | 1.7 GB  | Tekst extractie uit afbeeldingen | ⚡⚡⚡   |

**Functionaliteit:**

- Extract tekst uit screenshots
- Lees documenten & scans
- Verwerk bonnetjes en rekeningen
- Business cards en formulieren
- 3 modi: All Text / Structured / Tables
- Clipboard paste support
- Download als TXT bestand

**Gebruik Cases:**

- 📸 Screenshot → tekst
- 📃 Document scannen
- 🧾 Bonnetjes digitaliseren
- 💳 Business cards bewaren
- 📋 Formulieren omzetten

---

### 💻 Code (Code Assistant - toekomstige plugin)

| Model                            | Grootte | Talen      | Specialisatie           |
| -------------------------------- | ------- | ---------- | ----------------------- |
| `qwen2.5-coder:7b-instruct-q6_K` | 6.3 GB  | Alle talen | Code generatie & uitleg |
| `deepseek-coder-v2:16b`          | 8.9 GB  | Alle talen | Krachtigste code model  |

**Gebruik in Chat:** Je kunt deze modellen nu al gebruiken in de Chat plugin voor code vragen!

---

### 🔍 Embeddings (Document Search - toekomstige plugin)

| Model                   | Grootte | Gebruik                         |
| ----------------------- | ------- | ------------------------------- |
| `embeddinggemma:latest` | 621 MB  | Semantisch zoeken, RAG systemen |

**Toekomstig:** Voor indexeren van Obsidian notities en semantisch zoeken.

---

### ☁️ Cloud Modellen

Deze modellen draaien NIET lokaal maar via externe API's:

| Model                         | Provider    | Beschrijving            |
| ----------------------------- | ----------- | ----------------------- |
| `kimi-k2.5:cloud`             | Moonshot AI | Krachtig cloud model    |
| `kimi-k2:1t-cloud`            | Moonshot AI | Extra groot model       |
| `minimax-m2:cloud`            | MiniMax     | Chinese AI provider     |
| `minimax-m2.5:cloud`          | MiniMax     | Nieuwere versie         |
| `glm-5:cloud`                 | Zhipu AI    | ChatGLM cloud           |
| `deepseek-v3.1:671b-cloud`    | DeepSeek    | Mega groot model        |
| `gpt-oss:120b-cloud`          | -           | Open source GPT variant |
| `gemini-3-pro-preview:latest` | Google      | Gemini preview          |

**Let op:** Deze vereisen API keys en internetverbinding!

---

## 🎯 Plugin → Model Aanbevelingen

### Chat Plugin

1. **Eerste keuze:** `qwen2.5:7b-instruct-q4_K_M` (balans)
2. **Snelheid:** `qwen3.5:2b-q4_K_M` (supersnel)
3. **Kwaliteit:** `qwen2.5:14b-instruct-q4_K_M` (beste)
4. **Nederlands:** `aacudad/gemma-3-DUTCH` (voor NL conversaties)

### Translator Plugin

1. **Eerste keuze:** `translategemma:4b` (gespecialiseerd)
2. **Betere kwaliteit:** `translategemma:12b` (meer nuance)
3. **Fallback:** `qwen2.5:7b` (als geen gemma)

### Image Generator Plugin (macOS)

1. **Eerste keuze:** `x/flux2-klein:4b` (goede balans)
2. **Hoge kwaliteit:** `x/z-image-turbo` (langzamer)

### Image Vision Plugin

1. **Eerste keuze:** `moondream:latest` (enige optie nu)
2. **Alternatief:** Je zou `llava` of `bakllava` kunnen installeren

### OCR Scanner Plugin

1. **Eerste keuze:** `moondream:latest` (snel en accuraat)
2. **Tip:** Gebruik "Structured" mode voor documenten, "Table" mode voor spreadsheets

---

## 🚀 Model Selector Functionaliteit

Elke plugin heeft nu een **Model Selector** met:

✅ **Auto-detectie** - Haalt lijst op van geïnstalleerde modellen via Ollama API
✅ **Categoriefiltering** - Toont alleen relevante modellen per plugin
✅ **Status indicator** - Groene/rode cirkel toont of Ollama draait
✅ **Voorkeur opslag** - Je keuze wordt bewaard in SQLite
✅ **Refresh knop** - Update lijst zonder pagina herladen

### Hoe het werkt:

1. Plugin laadt → Model Selector verschijnt bovenaan
2. Selector haalt modellen op via `http://localhost:11434/api/tags`
3. Filtert modellen op basis van naam patronen (bijv. "translate" voor Translator)
4. Toont dropdown met beschikbare modellen
5. Bij selectie: opslaan in database + activeren voor gebruik
6. Status knop check Ollama beschikbaarheid

---

## 📁 Technische Implementatie

### Nieuwe Bestanden

```
src/utils/
├── ollamaApi.js        # Ollama REST API wrapper
└── modelSelector.js    # Herbruikbaar UI component
```

### API Functies

**ollamaApi.js:**

- `checkOllamaStatus()` - Is Ollama running?
- `getInstalledModels()` - Haal alle modellen op
- `filterModelsByCategory(models, category)` - Filter op type
- `getSuggestedModels(category)` - Combinatie van bovenstaande
- `chatStream({model, messages, onChunk})` - Chat streaming
- `generateImage({model, prompt})` - Beeld generatie
- `analyzeImage({model, prompt, image})` - Vision analyse

**modelSelector.js:**

- `createModelSelector({containerId, category, settingKey, onChange})`
- `getSelectedModel(containerId)`

### Categorieën

```javascript
{
  chat: /llama|mistral|qwen|gemma|deepseek|phi/i,
  translate: /translate|gemma/i,
  image: /flux|stable|diffusion|z-image/i,
  vision: /moondream|llava|vision/i,
  code: /coder|codellama|starcoder/i,
  embed: /embed/i
}
```

---

## ⚙️ Database Schema

**Settings tabel** gebruikt voor model voorkeuren:

```sql
settings (
  key   TEXT PRIMARY KEY,
  value TEXT
)
```

**Keys:**

- `chat_preferred_model` - Chat plugin keuze
- `translator_preferred_model` - Translator plugin keuze
- `image_gen_preferred_model` - Image generator keuze
- `vision_preferred_model` - Image vision keuze

---

## 🔜 Toekomstige Uitbreidingen

### Code Assistant Plugin

- Gebruik `qwen2.5-coder:7b` of `deepseek-coder-v2:16b`
- Code generatie, review, uitleg
- Refactoring suggesties

### Document Search Plugin

- Gebruik `embeddinggemma` voor embeddings
- Semantisch zoeken door Obsidian notes
- RAG (Retrieval Augmented Generation)

### Dutch Mode Preset

- Special preset in Chat die `aacudad/gemma-3-DUTCH` forceert
- Voor Nederlandse gesprekken en job hunting

---

## 💡 Tips & Tricks

### Performance

- **2b-4b modellen:** Supersnel, goed voor simpele taken
- **7b-12b modellen:** Beste balans voor meeste gebruik
- **14b+ modellen:** Gebruik voor complexe redeneringen

### Disk Space

Je gebruikt ~85 GB voor alle modellen. Overweeg:

- Verwijder cloud modellen (bespaar 0 bytes, ze zijn niet lokaal)
- Kies 1 translate model (4b OF 12b, niet beide)
- Kies 1 image model als je weinig ruimte hebt

### Ollama Commando's

```bash
# Lijst van modellen
ollama list

# Model verwijderen
ollama rm model-name

# Model info
ollama show model-name

# Pull nieuw model
ollama pull model-name

# Ollama starten
ollama serve
```

---

## ✅ Checklist Setup

- [x] Ollama geïnstalleerd en draaiend
- [x] Minimaal 1 chat model (`qwen2.5:7b`)
- [x] Minimaal 1 translate model (`translategemma:4b`)
- [x] Vision model voor Image Vision (`moondream`)
- [x] Image gen model voor macOS (`flux2-klein`)
- [ ] Code model als je code wilt (`qwen2.5-coder`)
- [ ] Embedding model voor toekomst (`embeddinggemma`)

---

**💎 Je hebt een complete AI toolkit!** Alle plugins werken nu met model keuze en je kunt switch tussen snelheid en kwaliteit op basis van de taak.
