# Fomi Studio

A responsive image/video studio with an integrated dummy backend. Built with Next.js App Router, JavaScript, React, and Tailwind CSS. No AI account, paid service, database, or environment variables are needed for the local demo.

## Run

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use `npm.cmd` on Windows if PowerShell blocks `npm`.

```sh
npm run build
npm start
```

Dependency installation and the initial Inter font build require network access. Media is served locally at runtime.

## Studio behavior

- `/` redirects to `/imagestudio`; `/videostudio` has separate prompts, settings, jobs, and history.
- A fresh page creates a new backend session. Route changes preserve both studios until refresh.
- Models, ratios, counts, visual references, defaults, and prompt cards load from the configuration API.
- Count, ratio, model, and style changes save through the settings API. Advanced Apply saves preferences; Cancel discards edits. Reset defaults changes the modal draft; applying that draft resets advanced preferences through the API while preserving output options.
- Enter a prompt or select a card, then Generate or press Ctrl/Cmd + Enter. Jobs display queued/processing progress, skeletons, and completed results at the bottom of the chat.
- Failed or interrupted generations retain their prompt and offer Retry. Network retries resume an existing job when possible.
- History comes from the backend and contains only completed generations: one stacked entry per conversation. Gallery opens the tray; clicking a preview retrieves and scrolls to that conversation.
- Videos load on interaction and pause when leaving the studio or hiding the browser tab.
- Home, wand, and folder show a fallback screen through normal client navigation (HTTP 200), preserving studio state. Unknown URLs return HTTP 404.

## API

Start with `POST /api/sessions`, then send the returned `id` as the `X-Session-ID` header. The browser manages this automatically in memory. No session ID is saved in localStorage or cookies.

| Endpoint                          | Behavior                                                                 |
| --------------------------------- | ------------------------------------------------------------------------ |
| `GET /api/config`                 | Public models, presets, supported values, defaults, and polling interval |
| `POST /api/sessions`              | Create an isolated demo session; HTTP 201                                |
| `GET /api/settings?type=image`    | Retrieve studio preferences (`image` or `video`)                         |
| `PUT /api/settings?type=image`    | Save `{ options, advanced }`                                             |
| `DELETE /api/settings?type=image` | Reset advanced settings; keep count, ratio, and model                    |
| `POST /api/generate`              | Submit a generation; HTTP 202 with `{ job }`                             |
| `GET /api/jobs/:id`               | Poll progress, error, metadata, and final items                          |
| `POST /api/jobs/:id/retry`        | Restart a failed job under the same conversation ID                      |
| `GET /api/history?type=image`     | Completed groups, newest first, scoped to session and type               |
| `GET /api/history/:id`            | Retrieve a complete, completed conversation                              |

Example generation body:

```json
{
  "prompt": "A quiet alpine lake beneath a pastel sky",
  "count": 4,
  "ratio": "3:4",
  "model": "Frame 1.0",
  "type": "image",
  "advanced": {
    "style": "Natural",
    "color": "Original",
    "camera": "Auto",
    "seed": "42",
    "negative": "unwanted text, blur",
    "guidance": 7,
    "steps": 28
  }
}
```

Supported values come from `/api/config`. Prompts must contain text and be at most 5,000 characters; negative prompts are limited to 2,000. Seed is an unsigned 32-bit integer or an empty string for random. `advanced` may be omitted to use saved preferences. An optional UUID `requestId` makes repeated submissions idempotent within the session; the frontend supplies one automatically.

Jobs transition `queued -> processing -> completed` or `failed`. Polling computes elapsed progress without a background worker. Images take roughly 1.5-2 seconds with default settings; videos take longer. Each completed item includes `id`, `type`, `src`, `poster`, `width`, `height`, `prompt`, `model`, `seed`, and presentation metadata.

The seed, prompt, model, and all advanced fields deterministically influence sample selection. Style and color also affect display filters; camera changes cropping position; steps and output count influence simulated duration. These are simulations using local media, not newly synthesized artwork. The same explicit seed and request parameters reproduce the same samples and presentation.

Errors use `{ "error": "Actionable message" }` with HTTP 400 for invalid input, 401 for missing session, 404 for unavailable session-owned resources, 409 for invalid job state, 410 for expired sessions, and 429/503 for demo capacity limits.

For a reproducible failure scenario, send `X-Mock-Failure: once` on generation submission. The job fails on its first attempt and succeeds when retried. Normal UI requests do not deliberately fail; the regression suite exercises this scenario.

## Architecture

- `src/lib/server/store.js`: isolated in-memory sessions, preferences, and jobs.
- `src/lib/server/service.js`: settings, job lifecycle, retries, and history.
- `src/lib/server/simulator.js`: deterministic sample provider; replace this boundary with a real AI adapter later.
- `src/lib/server/http.js`: consistent JSON responses and error handling.
- `src/lib/generationConfig.js` and `promptPresets.js`: API configuration data.
- `src/lib/api.js`: frontend API adapter and cancellable polling delay.
- `src/hooks/useGenerations.js`: optimistic chat placeholders, polling, retries, and API history.
- `StudioWorkspace`: initializes configuration/session/settings and retains the two studio components across route navigation.
- `HistoryTray`: owns tray interaction; Gallery uses React callbacks and navigation uses refs.
- `src/styles`: feature-specific styles and breakpoints.

## Limits and deployment

The mock store is process-local and volatile. Refresh starts a new session; server restarts discard all sessions. Idle sessions expire after eight hours. The demo caps active sessions at 200 and generations per session at 500. Session IDs isolate demo data but are not account authentication.

The project builds with default Next.js/Vercel settings. For reliable sessions on Vercel or other multi-instance/serverless hosts, replace the mock store with shared storage; process memory is not shared across instances and may disappear between requests. The complete dummy-backend demonstration should run in one Node.js process with `npm start` until that adapter is replaced.

There is no real AI generation, persistent account storage, billing, or external messaging. Support remains a placeholder email address. Local images come from images.unsplash.com; sample videos come from interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4 and media.w3.org/2010/05/bunny/trailer.mp4.

## Checks

```sh
npm run lint
npm run format:check
npm run build
npx playwright install chromium
npm test
```

Playwright starts a production server on port 3102, so build first. Tests cover real API configuration/settings, session and studio isolation, deterministic outputs, job progress/retry, history retrieval, request validation, frontend recovery, route persistence/refresh reset, modal behavior, video playback, and viewport bounds. Failure injection is limited to tests; successful generation flows exercise the actual backend.

Runtime dependencies remain Next.js and React. ESLint, Prettier, and Playwright are development-only tools.

## Commit format

```text
<type>: <concise summary>

- What changed and why
- Validation performed
```

## Image and video previews

Click a result image, a video poster outside its inline play button, or the expand icon to open a full preview. Videos retain inline hover/play behavior; the expanded preview uses native video controls. The preview dialog traps focus, closes on Escape/backdrop/close, supports browser Back/Forward, and preserves the underlying studio and its scroll position. Background videos pause while it is open.

The App Router implementation uses `@modal/(.)media/[id]` to intercept soft navigation into a modal and `media/[id]` for direct visits or refresh. `@modal/default.js` and the catch-all null route prevent unmatched or stale overlays. One shared `MediaPreview` component renders both forms.

`GET /api/media/:id` returns one completed output plus previous/next IDs, its position, and the output count within the same generation. This is an intentionally public, read-only media link in the dummy backend; it does not expose session IDs, private settings, or unrelated conversations. Direct visits and refresh can still display that single output while its original in-memory session exists. The new studio session remains empty after refresh. Links expire when the originating session expires or the server restarts; the preview then shows a recovery link.

Preview arrows move within the selected generation; first/last boundaries are disabled, and single-output generations omit the controls. Image previews also support Left/Right arrow keys. A persistent intercepted-route layout keeps the dialog open while URLs change, and replacement navigation means Close returns directly to the studio. Standalone viewers update their URL through the Next.js-compatible native History API without opening a nested modal.
