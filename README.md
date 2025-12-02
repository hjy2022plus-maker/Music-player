
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

> Tip: Serve the app through Vite (`npm run dev` or `npm run preview`) instead of opening `index.html` directly so TypeScript and CSS are compiled and served with correct MIME types.

## Mock API for local data

- Start the mock backend: `npm run mock` (defaults to `http://localhost:4000`; override with `MOCK_PORT`). If the port is taken the server will automatically try the next few ports and log the final address.
- Endpoints available:
  - `GET /health` – server check.
  - `GET /albums?q=` – list/search albums.
  - `GET /albums/:id` – album details.
  - `GET /albums/:id/songs` – album tracks.
  - `GET /songs?q=` – list/search songs.
- Data source: `mock/data.json`; adjust or extend records to match UI needs. CORS is enabled for local dev.
