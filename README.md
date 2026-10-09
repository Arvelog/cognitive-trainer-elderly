# Поруч

React/Vite Ukrainian-language home-practice app for a person with aphasia and a family member or caregiver. It offers a full session of 13 tasks in six blocks, individual blocks, and a shorter six-step familiar-word session. It is designed to complement an individualized speech-language therapy plan, not replace it.

The core session is intentionally predictable and local:

- one question or decision at a time, including several questions about one situation;
- large choices or an own response, with options available on request;
- slow Ukrainian speech synthesis and progressive cues;
- assisted speech counts as useful practice;
- an unfinished session is saved on the device and can be resumed.

Answers and progress within the four-word exercise survive navigation and page reloads. A completed answer stays selected until the caregiver chooses **Повторити завдання**. Skipping is optional; ending early preserves partial word results in the summary. Finished sessions remain available as a summary and are never offered as an active session.

**Для близьких: складність вправ** on the home screen offers three manual levels for each block. The first level keeps familiar words and generous support. Higher levels change the work itself: reading messages and making inferences, comparing functions, planning under constraints, calculating purchases and time, composing notes, and negotiating changes in a dialogue. The richer bank contains 94 situations and prompts; consecutive sessions avoid the previous item in the same richer task slot.

**Спробувати змістовніший набір** starts a full session at levels 2–3 and saves those settings for subsequent sessions. It asks before replacing an unfinished session. The full-session time label changes to **у своєму темпі** when several blocks use the expanded material; the session can be completed in parts.

Counting offers objects up to 10, arithmetic up to 20 without regrouping, or the existing arithmetic with regrouping plus two-step purchases, change, budgets and clock times. The harder counting level remains the default. Sequence tasks use two, three, or four actions and accept alternative valid orders where the conditions allow them. Writing progresses from copying to a word and sentence, then an own message with a model available on request. The short session has separate word groups: familiar objects, objects and actions, or the wider vocabulary.

Settings are saved locally and apply to newly started sessions. Each session stores its own task and level snapshots, so changing settings preserves an unfinished session. Previously saved version-2 curriculum snapshots retain their original content and level labels. Levels do not rise automatically. Each question in a multi-question task preserves its answer, help and active position across reloads; the task completes only after every question.

Full-session summaries separate independent attempts, supported attempts, revealed answers, and retries. Playing the question aloud is recorded separately from an answer cue. Writing records the initial attempt, copying, and recall as separate stages; independent copying is still practice with a model. Conversation records the response form (word, phrase, writing, or gesture) separately from help. Older completed records without this detail remain unspecified.

The interface is checked at laptop and phone widths, including 320 px. Caregiver advice is collapsed by default and answer choices remain together. The progress regression checks run with `npm run test:therapy` and are also included in `npm test`.

## Setup

```bash
npm ci
npm run dev
```

`npm run dev` starts the Vite frontend. Bundled full and short practice sessions do not require AI generation.

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

The server-side AI routes remain isolated from the frontend bundle for development and regression coverage. The primary practice flow uses the curated vocabulary and situations bundled with the app. That material is never sent to an AI route.

`npm run build` also creates the Cloudflare Worker entrypoint required by Sites while preserving the existing Vite architecture.

## Production Checks

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

The AI routes enforce same-origin browser provenance, payload-size checks, and in-process per-IP rate limits. For high-traffic production, replace the in-process limiter with a shared store such as Vercel KV, Redis, or another edge-compatible rate-limit backend.
