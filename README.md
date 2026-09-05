# Поруч

React/Vite home-practice app with six short Ukrainian-language exercises for a person with severe aphasia and a family member or caregiver. It is designed to complement an individualized speech-language therapy plan, not replace it.

The core session is intentionally predictable and local:

- one familiar word or decision at a time;
- two large choices rather than dense grids;
- slow Ukrainian speech synthesis and progressive cues;
- assisted speech counts as useful practice;
- an unfinished session is saved on the device and can be resumed.

Answers and progress within the four-word exercise survive navigation and page reloads. A completed answer stays selected until the caregiver chooses **Повторити крок**. Skipping is optional; ending early preserves partial word results in the summary. Finished sessions remain available as a summary and are never offered as an active session.

The interface is checked at laptop and phone widths, including 320 px. Caregiver advice is collapsed by default and answer choices remain together. The progress regression checks run with `npm run test:therapy` and are also included in `npm test`.

## Setup

```bash
npm ci
npm run dev
```

`npm run dev` starts the Vite frontend. The six-step therapy session does not require a network connection or AI generation.

To test AI generation locally, copy `.env.example` to `.env`, set `OPENAI_API_KEY`, and run:

```bash
npm run dev:api
```

## Environment

Serverless AI routes require:

```bash
OPENAI_API_KEY=...
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_TASK_IMAGE_MODEL=gpt-image-1-mini
```

Do not expose this key through `VITE_*` variables. The frontend calls local `/api/*` routes, and those routes call OpenAI from the server side.

The server-side AI routes remain isolated from the frontend bundle for development and regression coverage, but the primary therapy flow uses the fixed, familiar vocabulary bundled with the app. That vocabulary is never sent to an AI route.

`npm run build` also creates the Cloudflare Worker entrypoint required by Sites while preserving the existing Vite architecture.

## Production Checks

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

The AI routes enforce same-origin browser provenance, payload-size checks, and in-process per-IP rate limits. For high-traffic production, replace the in-process limiter with a shared store such as Vercel KV, Redis, or another edge-compatible rate-limit backend.
