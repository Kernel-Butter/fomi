# Fomi Studio

Responsive image and video generation demo built with Next.js App Router, JavaScript, React, and Tailwind CSS.

## Setup

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

```sh
npm run build
npm start
```

Deploy to Vercel with default Next.js settings. No environment variables are required. Installing dependencies and fetching Inter through next/font requires network access.

## Routes and usage

- `/` redirects to `/imagestudio`.
- `/imagestudio` generates images; `/videostudio` generates videos.
- The second and third header icons and the panel toggle switch studios. The indicator slides between active tabs.
- Home, wand, and folder open the not-found page with a link back to Image Studio.
- Enter a prompt or choose an example, select count, ratio, and model, then click Generate or press Ctrl/Cmd + Enter.
- History thumbnails load saved samples into the feed. Gallery focuses history; View All scrolls to the remaining thumbnails.
- Videos load on hover or playback activation. Their button pauses playback.

## Mock API

`POST /api/generate` accepts:

```json
{
  "prompt": "A quiet alpine lake beneath a pastel sky",
  "count": 4,
  "ratio": "3:4",
  "model": "Frame 1.0",
  "type": "image"
}
```

Allowed values: count 1-4, ratio `1:1` / `3:4` / `16:9`, model `Frame 1.0` / `Flux` / `Studio`, type `image` / `video`. Prompts must contain text and be at most 5,000 characters.

Returns `{ "items": [...] }` after 1.2-1.9 seconds. Each item contains `id`, `type`, `src`, `poster`, `width`, `height`, `prompt`, and `model`. Invalid options return HTTP 400. The API serves local samples and does not call an AI provider.

## Structure

- `src/app`: routes, shared layout, styles, and API handler.
- `src/components`: header, history, generation controls, and results.
- `src/hooks/useGenerations.js`: generation requests, loading, errors, and history selection.
- `src/lib`: mock data and API client.
- `public/images` and `public/videos`: local sample media.

## Demo limitations

- The initial feed and history are empty until generation. Each studio keeps its prompts, settings, generations, and history across route changes until the browser is refreshed.
- Seed, negative prompt, and style selections are preview controls; they do not affect mock output.
- Colors follow the written brief approximately; an exact mockup image was not available for comparison.
- Support uses a placeholder email address.
- Local media replaces reference artwork. Image source: images.unsplash.com. Video sources: interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4 and media.w3.org/2010/05/bunny/trailer.mp4.

## Commit format

```text
<type>: <concise summary>

- What changed and why
- Validation performed
```

Use `feat`, `fix`, `docs`, `style`, `refactor`, or `chore` as appropriate. Keep commits focused and record only checks actually performed.
