# Мовлення щодня

React/Vite home-practice app with Ukrainian-language exercises for adults rebuilding speech, reading, and writing after stroke-related aphasia. It is designed to complement an individualized speech-language therapy plan, not replace it.

## Setup

```bash
npm ci
npm run dev
```

`npm run dev` starts the Vite frontend only. In that mode `/api/*` is not served, so the app intentionally falls back to local task data.

To test AI generation locally, set `OPENAI_API_KEY` and run:

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

The "Що відбувається?" exercise first generates one coherent scene plan with Ukrainian answers, then renders that scene through GPT Image as a landscape WebP. A bundled photograph is used only when the image API is unavailable.

The final speech exercise uses a fixed bank of personally successful single words bundled with the app. It rotates four words per session and never sends that vocabulary to an AI route.

## Production Checks

```bash
npm run build
npm audit --audit-level=moderate
npm run test:generation
```

The AI routes enforce same-origin browser provenance, payload-size checks, and in-process per-IP rate limits. For high-traffic production, replace the in-process limiter with a shared store such as Vercel KV, Redis, or another edge-compatible rate-limit backend.
