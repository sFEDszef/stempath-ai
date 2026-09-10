# STEMPath AI

**Think · Explore · Build · Grow**

A responsive educational research prototype for primary and secondary STEM learners. The first challenge is a wind-powered car that travels at least 3 metres.

## Run locally

Requires Node.js 20.9+ and pnpm 11.19.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. For a production preview:

```sh
pnpm build
pnpm start
```

`pnpm typecheck` checks TypeScript independently.

## MVP interactions

- Seven selectable STEM stages, synchronized across the sidebar, coach, and journey.
- Explicit, reversible stage completion. Selecting a stage does not mark learning complete.
- Independent conversations per stage, bilingual initial conversation, suggested replies, and free text messages.
- Three user-selectable support levels: Socratic questions, directional hints, and stronger scaffolds.
- Local PNG/JPEG/WebP image previews (5 MB per file), removal, and a My Files view.
- Notebook saved in browser local storage; resources, help, home, and project overview dialogs.
- Responsive desktop, tablet, and phone layouts; keyboard controls and Chinese IME-aware Enter handling.

## Structure

```text
src/app/             Next.js App Router entry points and responsive design tokens
src/components/      Reusable UI components and workspace composition
src/data/            Challenge, stages, support labels, and mock conversation
src/lib/coach.ts     Async mock adapter implementing CoachService
src/types/           Shared stage, message, artifact, and coach contracts
```

`CoachService.respond(CoachRequest)` accepts the current stage, support level, and message history. It returns a `CoachResponse` with text and suggested replies. Replace `mockCoach` with a client adapter to a server route when adding a backend. Server-side code should handle provider credentials, validation, request limits, and research-approved coaching instructions. No OpenAI SDK, API calls, API keys, or external AI service are integrated in this MVP.

The mock intentionally asks learners to predict, explain, compare, and evaluate evidence. It does not supply a finished design or present the mock as a real model. Image uploads are previews only; the coach does not analyse images.

## Data lifecycle

Chats, completion, support level, and images are session-only and reset on page reload. Notes persist only in the current browser. Nothing is sent to a research database. Do not treat this MVP as a data collection instrument. A future study will need its own consent, storage, access, and retention design. Fonts use Google Fonts with local system fallbacks.

## Vercel readiness

Import this repository into Vercel, select the Next.js framework preset, and leave the root directory at the repository root. Use `pnpm install --frozen-lockfile` and `pnpm build`. No environment variables or provider accounts are required for this mock version. No deployment has been performed.

Next.js installation reference: https://nextjs.org/docs/app/getting-started/installation
