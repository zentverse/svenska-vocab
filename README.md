# Svenska Vocab

A minimal, mobile- and desktop-friendly web app to study Swedish vocabulary from a Google Sheet. Each word loads with the pronunciation and English translation hidden so you can guess first, then tap to reveal. A speaker button speaks the Swedish word out loud.

## Stack

- Vite + vanilla TypeScript
- Tailwind CSS v3
- Google Sheets data fetched directly from the public `gviz/tq` JSON endpoint
- Real Swedish text-to-speech via a tiny `/api/tts` proxy in front of Google Translate's audio endpoint (Vercel Edge Function in production, Vite middleware in local dev). The browser's built-in `speechSynthesis` is kept as a fallback.

## Sheet format

The Google Sheet should have three columns, with row 1 as headers:

| Swedish | Pronunciation | English |
|---------|---------------|---------|
| hej     | hey           | hello   |
| tack    | tahk          | thank you |

Share the sheet as **Anyone with the link → Viewer** so the app can fetch it without an API key.

## Local development

```bash
cp .env.example .env.local        # then edit .env.local with your Sheet ID
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build       # type-check + production build into ./dist
npm run preview     # serve the built site locally to verify
```

## Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. Vercel dashboard → **Add New → Project → Import** the repo. Vercel auto-detects Vite (`npm run build` → `dist`). Click **Deploy**.
3. **Project Settings → Environment Variables**, add for Production, Preview, Development:
   - `VITE_SHEET_ID` — the long string between `/d/` and `/edit` in your sheet URL
   - `VITE_SHEET_NAME` — *(optional)* tab name; defaults to the first tab
4. **Deployments → ... → Redeploy** so the env vars are baked into the bundle.

The `VITE_` prefix means these values are exposed in the client JS — that's fine because the sheet is link-viewable anyway.

## Interactions

- **Tap** the pronunciation slot → reveal pronunciation. Tap again on the translation slot → reveal translation. Tap **Next** for a new random word.
- **Speaker icon** → hear the Swedish word (uses the OS Swedish voice if installed; the button hides itself otherwise).
- **Keyboard:** `Space` reveals the next hidden item / advances when fully revealed; `→` forces next; `R` replays TTS.
- **Mobile:** swipe left to advance.

## File map

```
index.html              entry HTML, mounts #app
src/main.ts             init, state, event wiring
src/sheet.ts            gviz fetch + JSON-prefix strip + row → Word
src/ui.ts               render, reveal, animation
src/tts.ts              client-side wrapper that calls /api/tts
src/style.css           Tailwind directives + components
src/vite-env.d.ts       env var types
api/tts.ts              Vercel Edge Function — proxy to Google Translate TTS
public/favicon.svg      SE-blue chip with "Å"
tailwind.config.js
postcss.config.js
vite.config.ts          includes a dev-only middleware that mirrors api/tts.ts
tsconfig.json
package.json
.env.example            template (committed)
.env.local              your real values (gitignored)
```

## Why the TTS proxy?

The browser's `speechSynthesis` only knows the voices installed on your OS. If you don't have the Swedish voice pack, Swedish text gets read with your default English voice — which is exactly what we want to avoid. Calling Google Translate's audio endpoint directly from the browser fails (`ERR_BLOCKED_BY_ORB`) because it returns no body without a real browser `User-Agent` and `Referer`. A 40-line server-side proxy fixes both: it forwards the request with proper headers and streams the MP3 back to the `<audio>` element. Same code shape runs as a Vercel Edge Function in production and a Vite middleware in dev.
