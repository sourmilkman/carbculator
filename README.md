# Carbculator

A mobile-first Progressive Web App for tracking daily carbohydrate intake from food and drinks.

## Features

- Photograph nutrition labels and run OCR extraction for carbohydrate values.
- Manual fallback entry fields if OCR is unclear.
- Supports both *carbs per 100g* and *carbs per portion (+ portion grams)*.
- Daily carb limit from **0g to 50g**.
- Traffic-light status:
  - Green: within limit
  - Amber: ≥80% of daily limit
  - Red: exceeded limit
- Custom bottom keyboard sheet for grams input (roughly half-screen on mobile).
- PWA installable experience with offline caching and bundled local app icons (SVG, 192/512 variants).
- Save everything locally and sync all entries into one Google Drive JSON file (`carbculator_entries.json`).

## Run locally

Because this app registers a service worker, serve it with a local web server:

```bash
python3 -m http.server 5173
```

Open http://localhost:5173.

## Google Drive sync setup

1. Create a Google Cloud project.
2. Enable **Google Drive API**.
3. Create an **OAuth Client ID** of type **Web application**.
4. Add your local/dev and production origins.
5. Paste the client ID into the app under **Google Drive setup**.

Scope used: `https://www.googleapis.com/auth/drive.file`.

## Deployment

Push this repo to your GitHub repository and deploy via GitHub Pages, Netlify, or Vercel.

For GitHub Pages, keep it as static files at root.
