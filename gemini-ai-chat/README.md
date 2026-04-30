# Gemini AI Chat

A secure Gemini-powered chat feature built with Next.js, React, TypeScript, and `@google/genai`.

## Setup

Get a Gemini API key from Google AI Studio:

1. Open `https://aistudio.google.com/app/apikey`.
2. Create or copy an API key.
3. Create `gemini-ai-chat/.env.local` from the example file.

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

Then edit `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Never put the real API key in frontend code and never commit `.env.local`.

### Easier Local Key File

You can also copy `GEMINI_API_KEY.txt.example` to `GEMINI_API_KEY.txt` and paste your key there:

```powershell
Copy-Item GEMINI_API_KEY.txt.example GEMINI_API_KEY.txt
```

Then edit `GEMINI_API_KEY.txt`:

```txt
GEMINI_API_KEY=your_gemini_api_key_here
```

`GEMINI_API_KEY.txt` is ignored by git. This file is read only by the backend route while the Next.js server is running.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. The frontend sends chat messages to `/api/chat`; that server route calls Gemini with `process.env.GEMINI_API_KEY`.

## Static HTML Entry

`index.html` is included so the project opens from the main portfolio link at `/gemini-ai-chat/`. It is only a browser chat shell and still sends messages to `/api/chat`; it does not contain or use a Gemini API key. Run or deploy the Next.js server for real Gemini replies.

## Build

```bash
npm run build
npm run start
```

This app requires the Next.js server because `/api/chat` must keep the Gemini key server-side. Static GitHub Pages export is not enough for the API route. Deploy this project to a server-backed host such as Vercel, Netlify with Next support, or another Node.js host.

## Security

- The browser never receives `GEMINI_API_KEY`.
- The frontend only calls `/api/chat`.
- The backend reads the key from `GEMINI_API_KEY`, `.env.local`, or local `GEMINI_API_KEY.txt`.
- The backend validates the message before calling Gemini.
- Server errors return a safe generic response.

For production, prefer setting `GEMINI_API_KEY` on the server. Do not paste your private production key into a public page and ask visitors to use it.

## Troubleshooting

- Missing key: make sure `.env.local` exists in `gemini-ai-chat` and contains `GEMINI_API_KEY=...`.
- Local key file: make sure `GEMINI_API_KEY.txt` exists in `gemini-ai-chat` and contains either the raw key (`AIza...`) or `GEMINI_API_KEY=AIza...`.
- If you left template text in the file by accident, the backend tries to extract the first `AIza...` key it can find. Keeping only the real key line is still cleaner.
- Empty messages: the API rejects blank input.
- Quota or rate limit: check your Google AI Studio billing, free tier, and quota limits.
- Network error: confirm the Next.js dev server is running and the browser is using the same origin.
- Deployment issue: use a host that supports Next.js API routes.
