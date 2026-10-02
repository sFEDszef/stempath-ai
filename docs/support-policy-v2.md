Stage progression is now governed separately by [gentle-v1 readiness](gentle-readiness.md). Support levels below remain v2; current prompts are young-learner-v5. The v4 prompt mentioned below describes the original support recalibration release.

# Support policy v2 — recalibrated learning support

The numeric research levels remain **1 / 2 / 3**. New responses use `supportPolicyVersion: "v2"` and `promptVersion: "young-learner-v4"`; app version remains 0.7 and research schema remains 0.6. These numbers no longer mean the same support intensity as policy v1.

| Level | English / Chinese label | Coaching format |
|---|---|---|
| 1 | Give Me a Hint / 给我一点提示 | One concrete task-relevant clue, then one manageable question. No longer pure questioning. |
| 2 | Help Me Break It Down / 帮我拆开想 | A partial frame, small organizer or limited choice, then one learner decision. Normal recommended support, approximately former Level 3. |
| 3 | Guide Me Step by Step / 一步一步带我想 | Brief explanation, at most 2–3 thinking micro-steps or limited task-grounded choices, then only the first small decision. Strong rescue scaffolding. |

All levels leave reasoning and meaningful choices with the learner. Even Level 3 cannot supply the final solution or whole experimental design, invent observations/data, write conclusions/reflections, choose the final design, or fill all checkpoints. Partial sentence frames remain blank. Supplied success criteria are task facts, not fabricated evidence. Demo replies never populate saved learning fields or complete a stage.

On confusion, Level 1 rephrases with a clue and easier question; Level 2 adds a partial frame; Level 3 decomposes into small steps with options and one starting decision. The deterministic coach changes its entry question if the previous assistant already asked it. Short learner answers can move the conversation to the next missing checkpoint without creating a saved answer or a mastery judgement. Model instructions require the same progression. Suggestions remain unchanged.

## Defaults and adaptive choices

Normal new projects and ADAPTIVE_SUPPORT begin at 2; LOW_SUPPORT begins at 1; HIGH_SUPPORT begins at 3. CUSTOM defaults to 2 and may explicitly set `initialSupportLevel` to 1, 2 or 3. NO_AI never produces coaching regardless of the stored support number. The initial level override only applies to CUSTOM, so it cannot silently change the preset study conditions.

Repeated difficulty offers 2→3; two recent productive responses including reasoning, evidence or critical evaluation can offer 2→1. At 3, fading offers 3→2. Offers remain optional: there is no automatic level change or judgement of mastery. Support acknowledgements describe the actual new intensity and distinguish the two fading transitions.

## Existing learning projects

`parseProject` treats a missing marker or v1 as legacy: old 3→new 2, old 2→new 1, old 1→new 1. Its output carries v2, so saving/reloading never maps it twice. Records, notebook, stage progress and visible conversations are retained. Unknown policy versions fail validation.

Server projects have a `support_policy_version` column. Run the usual `pnpm db:migrate` before deploying this code in POSTGRES mode. Migration `0001_support_policy_v2.sql` labels existing rows v1; new projects explicitly insert v2. First reconstruction locks a legacy row, maps its level, marks v2 and increments its optimistic version atomically. A subsequent read does not change the level/version. A stale device must reload rather than overwrite migrated state. LOCAL Vercel production does not need a database or new environment variables.

## Research archive boundaries

Existing research numbers, events and prompt versions are never remapped. An archive with no marker means **v1**. JSON, CSV, bundle, combined CSV and educator review outputs label the effective support policy; new sessions and response metadata carry v2. Integrity validation rejects conflicting snapshot/response policies and prompt versions.

An old server research session is ended with `SUPPORT_POLICY_CHANGE` (unless already completed/ended), saved as a separate archive, and a fresh v2 session is started before opening its migrated learning workspace. The old archive remains exportable; it is not resumed with v4 responses. Research text-capture opt-in, privacy rules and schema 0.6 remain unchanged. Analyses combining archives must stratify by policy and prompt version, not just the numeric level.

## Validation limits

Tests cover all seven stages, G3–4/G5–6/G7+, Chinese/English confusion, one immediate question, relative scaffold strength, boundaries, defaults, optional adaptive transitions, one-time local/server migration and archive isolation. Provider tests use mocked calls; no credentials or paid model calls are required. The output format guard checks obvious violations and scaffold shape; it is not a semantic guarantee. Live model pedagogical quality still needs educator evaluation.
