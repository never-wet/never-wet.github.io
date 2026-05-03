# Visual Search Lens

Upload an image and get structured, search-focused visual analysis: description, keywords, Google image queries, style classification, colors, tags, objects, and similar-image discovery guidance.

## Local Setup

```powershell
cd visual-search-lens
npm install
Copy-Item .env.local.example .env.local
```

Add your key to `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_VISION_MODEL=gpt-4.1-mini
```

Then run:

```powershell
npm run dev
```

Open the local URL printed by Next.js. The browser compresses images before sending them to `/api/analyze`.

## Static Portfolio Link

`index.html` is included so the main GitHub Pages homepage can open `/visual-search-lens/`. When opened from a local static portfolio server, it tries the local Next analyzer on ports `8091` through `8100`; otherwise it calls `/api/analyze` on the current host. Real AI analysis still requires running or deploying this as a server-backed Next.js app.

## Security

Keep `OPENAI_API_KEY` server-side. Do not put a private key in browser code or commit `.env.local` / `OPENAI_API_KEY.txt`.
