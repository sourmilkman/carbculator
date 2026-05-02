# Carbculator

A mobile-first Progressive Web App for tracking daily macros on a ketogenic diet — carbs, fat **and** protein — with independent traffic-light indicators per macro.

## Features

### Macro tracking
- **All three macros** tracked per entry: carbs, fat, protein.
- **Per-macro daily limits** with sliders. Defaults follow keto proportions (≈ 5 % / 20 % / 75 % of a 2000 kcal day):
  - Carbs: **30 g**
  - Protein: **100 g**
  - Fat: **165 g**
- **Independent traffic lights** per macro:
  - 🟢 Green — within limit
  - 🟡 Amber — ≥ 80 % of limit
  - 🔴 Red — over limit
- **Lock keto ratios** toggle: when on, moving any slider rebalances the other two using the keto kcal split (4 / 4 / 9 kcal/g), so adjusting carbs auto-scales fat and protein.

### Adding food
- **Barcode scanner** (native `BarcodeDetector` with ZXing fallback). Saved barcodes auto-fill from your library; new ones are looked up against **Open Food Facts** (carbs, fat, protein, serving size).
- **Nutrition label OCR** (Tesseract) — snap a photo and the app extracts carbs/fat/protein per 100 g.
- Manual entry fields grouped by **per 100 g**, **per portion** and **per piece** for each macro.
- Quick chips for ½ / 1 / 2 portions and 1 / 2 / 5 / 10 pieces.

### Tabs
- **Add** — log the next entry.
- **Today** — entries logged today with full macro breakdown.
- **Suggest** — *"What else can I eat?"* Looks at remaining macros, identifies which macro has the most room, and ranks library foods by how cleanly they close that gap. e.g. when fat is lacking it suggests up to *X g of butter* without pushing carbs or protein over the limit. One tap pre-fills the Add form with the suggested grams.
- **Library** — saved products, searchable, with per-100 g macro summary.
- **History** — last 14 days, each with three status pills (one per macro).

### Sync & offline
- Everything saves locally first.
- **Google Drive sync** writes a single JSON file (`carbculator_entries.json`) holding entries, products and limits. Auto-syncs after every change once you've signed in.
- **PWA installable** with offline service-worker caching.

## Run locally

```bash
python3 -m http.server 5173
```

Open http://localhost:5173.

## Google Drive sync setup

1. Create a Google Cloud project.
2. Enable **Google Drive API**.
3. Create an **OAuth Client ID** of type **Web application**.
4. Add your local/dev and production origins.
5. Replace `GOOGLE_CLIENT_ID` at the top of `app.js`.

Scope used: `https://www.googleapis.com/auth/drive.file`.

## Deployment

Static files at repo root — GitHub Pages, Netlify, or Vercel all work without configuration.
