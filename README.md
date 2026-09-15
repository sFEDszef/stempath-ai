# STEMPath AI v0.3 — Complete STEM Learning Journey

**Think · Explore · Build · Grow**

A task-dynamic STEM learning workspace with seven reusable pedagogical stages, learner-controlled support and critical evaluation of AI. The original white, blue and green three-column interface is retained.

## Run locally

Node.js 24 and pnpm 11.19 are used by this project.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

No API key is required. Auto mode uses deterministic Demo responses when server credentials are absent. Demo mode can also be chosen explicitly and never calls OpenAI. If a configured provider fails, an error and retry remain visible; failure is not silently passed off as AI success.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

## Tasks and integration boundary

`src/lib/stem/tasks.ts` exposes `loadTask(input)`, which validates and normalizes external data. Only title and description are required. Optional fields include id, type, context, objectives, constraints, success criteria, resources, domains and additional instructions. Classification uses a small conservative heuristic; ambiguous inputs use `general-stem`, and the loader allows an explicit type.

The Load STEM Challenge dialog supports five development examples plus custom tasks. Examples live only in `src/data/tasks.ts`; they are not pedagogical policy. Loading any task starts a fresh task workspace and clears current task progress, conversations and images. Switching stages within a task preserves each stage's conversation and records.

Future browser integrations can call:

```ts
import { injectTask } from '@/lib/stem/tasks';
injectTask({ title: 'Investigate a pattern', description: 'Compare patterns and justify a prediction.' });
```

This validates and dispatches a local event consumed by the mounted TaskWorkspace. It does not implement an LMS, random generator, network transport or researcher dashboard. Server callers can normalize data with `loadTask` directly.

## Shared architecture

- `src/lib/stem/stages.ts`: full seven-stage pedagogical matrix, adaptive labels, key questions, artifact fields and stage suggestions.
- `src/lib/stem/supportLevels.ts`: Level 1 questions, Level 2 directional hints, Level 3 partial scaffolds.
- `src/lib/stem/prompts.ts`: trusted teaching rules, stage and support composition; treats every task field, claim and record as untrusted data.
- `src/lib/stem/validation.ts`: bounded server request and record validation.
- `src/lib/stem/handler.ts`: official OpenAI Responses API, `store:false`, safe errors and missing-key Demo fallback.
- `src/lib/stem/demo.ts`: deterministic, bilingual, task-aware practice responses and claims; no model reasoning.
- `src/lib/stem/fading.ts`: optional fading invitation, never a mastery judgement.
- `src/components/TaskWorkspace.tsx`, `TaskLoader.tsx`: active-task lifecycle and input.
- `LearningArtifacts.tsx`, `AIChallenge.tsx`: thinking records and claim evaluation using existing card styling.
- `Workspace.tsx`, `AIChat.tsx`, sidebars: shared stage state, completion, conversations, loading, errors and retry.

The server receives the active task, stage, support level, recent 12 messages, latest message, learner records and completed stages. There is no server-side conversation memory to leak between tasks. A late reply for an unmounted task is ignored. Task-aware key questions and artifact schemas are derived locally; AI chat and claims adapt through the server context.

See [the pedagogical matrix](docs/pedagogy.md) for student/coach responsibilities, avoided behaviors and examples at every support level.

## Storage and research boundaries

Active task, current stage, completion, support and text records persist in versioned sessionStorage for the current tab. Chat and image previews stay in memory and reset on reload. Notes use task-scoped localStorage; the original demo notebook is still readable. No database, student account, research event collection or analytics has been added. Browser storage is fallible and is not a research archive.

Images remain local previews; AI does not analyze them. In real AI mode, recent text and records are sent to OpenAI through the server. Only server code reads `OPENAI_API_KEY`; `.env.example` remains blank. No credentials are needed for the demo or tests. `store:false` does not change provider retention policies.

Support fading is an opt-in heuristic, not adaptive assessment. Demo replies are intentionally limited templates and may repeat. Task classification is approximate. AI Challenge claims are unverified prompts for investigation; students must reason from evidence. Real model behavior needs pedagogical evaluation before research use.

## Validation scope

Automated checks cover all stages, support routing, validation, prompt boundaries, Demo fallback, claim behavior and three distinct tasks. Browser QA covers the full journey, task switching, typed and suggested messages, records, completion, fading, claims, retry and laptop/tablet rendering. Live model quality and research validity are separate evaluations.

For v0.4, prioritize reviewed cross-task coaching evaluations and learner-controlled export of the learning record before adding accounts or research data collection.
