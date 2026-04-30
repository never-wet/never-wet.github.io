# Gemini AI Chat Memory

## Project

- Folder: `gemini-ai-chat`
- Stack: Next.js App Router, React, TypeScript, `@google/genai`
- Runtime requirement: server-backed Next.js app because `/api/chat` uses `process.env.GEMINI_API_KEY`

## Security

- Do not expose `GEMINI_API_KEY` to browser code.
- Frontend sends `{ message }` to `/api/chat`.
- API route validates input, calls Gemini server-side, and returns `{ reply }`.
- `.env.local` is ignored; `.env.local.example` documents the placeholder value.
- `GEMINI_API_KEY.txt` is also ignored; `GEMINI_API_KEY.txt.example` documents the copy/paste local key file.
- Prefer server-side `GEMINI_API_KEY` for production.

## Gemini

- Model: `gemini-2.5-flash`
- Prompt lives in `lib/aiPrompt.ts` for easy editing.
- Gemini client helper lives in `lib/gemini.ts`.

## UI

- Chat component: `components/AIChat.tsx`
- Supports message state, loading state, errors, Enter to send, Shift+Enter new lines, and responsive layout.
- Static launch file: `index.html`; it mirrors the chat UI for portfolio access and still calls `/api/chat` instead of Gemini directly.
- UI no longer asks for a key. The backend reads `.env.local` or `GEMINI_API_KEY.txt`.
