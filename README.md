## v0.6.2 — Young Learner Guided Journey & Durable Learning State

Projects now resume stage conversations and notebooks automatically on the same device. See [v0.6.2 learning flow](docs/young-learner-journey.md) for migration, privacy boundaries and deterministic checkpoints.

# Official website

[STEMPath AI](https://stempathai.com) · [Research mode](https://stempathai.com/?research=1)

Hosted on the existing Vercel project. See [custom-domain deployment and browser-data migration](docs/deployment.md#custom-domain).

# STEMPath AI v0.6

Research Reliability & Pilot Readiness. See [v0.6 research protocol and limitations](docs-v06.md) for schema, timing, exports, safeguards and supervised-pilot requirements.

# STEMPath AI v0.5.2 — DeepSeek Pilot

**Think · Explore · Build · Grow**

Deployment status: this is a server-capable Next.js app, with validation-only GitHub Actions. See [deployment architecture and the Pages audit](docs/deployment.md). Production is connected to Vercel.

A task-dynamic STEM learning workspace with seven reusable pedagogical stages, learner-controlled support and critical evaluation of AI. The original white, blue and green three-column interface is retained.

## Run locally

Node.js 24 and pnpm 11.19 are used by this project.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

No API key is required. Auto mode uses deterministic Demo responses when server credentials are absent. Demo mode can also be chosen explicitly and never calls DeepSeek. Auto failures use clearly labeled Demo fallback. Forced DeepSeek failures show a retryable error.

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
- `src/lib/stem/handler.ts`: validated same-origin API boundary; `src/lib/ai/` owns DeepSeek Chat Completions, safe errors and explicit Demo fallback.
- `src/lib/stem/demo.ts`: deterministic, bilingual, task-aware practice responses and claims; no model reasoning.
- `src/lib/pedagogy/decisionEngine.ts`: optional fading invitation, never a mastery judgement.
- `src/components/TaskWorkspace.tsx`, `TaskLoader.tsx`: active-task lifecycle and input.
- `LearningArtifacts.tsx`, `AIChallenge.tsx`: thinking records and claim evaluation using existing card styling.
- `Workspace.tsx`, `AIChat.tsx`, sidebars: shared stage state, completion, conversations, loading, errors and retry.

The server receives the active task, stage, support level, recent 12 messages, latest message, learner records and completed stages. There is no server-side conversation memory to leak between tasks. A late reply for an unmounted task is ignored. Task-aware key questions and artifact schemas are derived locally; AI chat and claims adapt through the server context.

See [the pedagogical matrix](docs/pedagogy.md) for student/coach responsibilities, avoided behaviors and examples at every support level.

## Storage and research boundaries

Active task, current stage, completion, support and text records persist in versioned sessionStorage for the current tab. Chat and image previews stay in memory and reset on reload. Notes use task-scoped localStorage; the original demo notebook is still readable. No database, student account or remote analytics has been added. v0.5 records anonymous research events locally. Browser storage is fallible and is not a research archive.

Images remain local previews; AI does not analyze them. In real AI mode, recent text and records are sent to DeepSeek through the server. Only server code reads `DEEPSEEK_API_KEY`; `.env.example` remains blank. No credentials are needed for the demo or tests. Provider data retention policies apply; do not enter personal or sensitive information.

Support fading is an opt-in heuristic, not adaptive assessment. Demo replies are intentionally limited templates and may repeat. Task classification is approximate. AI Challenge claims are unverified prompts for investigation; students must reason from evidence. Real model behavior needs pedagogical evaluation before research use.

## Validation scope

Automated checks cover all stages, support routing, validation, prompt boundaries, Demo fallback, claim behavior and three distinct tasks. Browser QA covers the full journey, task switching, typed and suggested messages, records, completion, fading, claims, retry and laptop/tablet rendering. Live model quality and research validity are separate evaluations.

For v0.4, prioritize reviewed cross-task coaching evaluations and learner-controlled export of the learning record before adding accounts or research data collection.

## Adaptive scaffolding

See [v0.4 engine rules, storage, debug mode and limitations](docs/adaptive-scaffolding.md). The coach now recommends stronger support after repeated uncertainty, invites optional fading after independent reasoning, and makes AI Challenge contextual. All behavior works without an API key.

## Local research workflow

Open `/?research=1` for condition assignment, seeded tasks, local session traces and JSON/CSV exports. Text capture defaults OFF. See [v0.5 research layer, privacy, limitations and pilot workflow](docs/research-layer.md). Normal student UI hides the research panel.

## Adaptive UX (v0.5.1)

Optional support recommendations appear beside the chat input. Adaptive support offers escalation after two consecutive uncertainty/help signals. At Level 2 or 3, two consecutive productive responses, including recent reasoning, evidence or critical evaluation, can offer fading. Accepting a recommendation or manually changing support immediately requests guidance at the chosen level; no level changes automatically.

Level 1 uses one Socratic question, Level 2 adds a directional hint, and Level 3 uses task-informed choices or partial frames. LOW disables proactive recommendations; HIGH starts at Level 3; NO_AI remains unchanged. These are prototype heuristics, not validated measures of learning.

## DeepSeek pilot

See [provider architecture, modes, validation and limitations](docs/deepseek-pilot.md). Production-only secrets do not enable Preview or local AI.
