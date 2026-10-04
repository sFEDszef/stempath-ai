# Task rubrics and meaningful dialogue rounds

Current readiness policy: `task-rubric-v1`. Prompt: `young-learner-v6`.
Support policy remains `v2`; this release preserves the monochrome UI, free-text conversation, grade-band language and explicit transition decisions.

## Readiness formula and round definition

`READY = meaningfulRounds >= task.minimumMeaningfulTurnsPerStage AND all frozen stage criteria satisfied`.

Every stage defaults to five; task configuration accepts 5–20. LOW_SUPPORT, ADAPTIVE_SUPPORT and HIGH_SUPPORT have identical gates. A round requires a task-relevant learner free-text message followed by its successfully completed coach response. Student IDs and coach replyTo IDs deduplicate retry and restore. Trivial acknowledgements, uncertainty-only messages, punctuation, irrelevant text, support changes, welcome/system messages, challenge/evaluate-claim actions, teacher overrides and modal actions do not count. Pending/failed requests do not count; a successful retry completes the original round once.

## Frozen task schema

`STEMTask.progressionCriteria` contains a minimum, a deterministic task profile and seven lists of `{id, kind, label}`. IDs and kinds come from validated structured configuration; labels describe the intended evidence, never executable prompts. Tasks imported without criteria receive deterministic engineering/inquiry defaults without an AI call. Built-in rubrics are revision 2. Editing a task creates a new revision; previously assigned projects retain their own task snapshot and rubric. Teacher/researcher task editors expose round minimum, human-readable evidence types and editable descriptions before assignment. Student mode hides the rubric editor and diagnostics.

## Wind-Powered Car rubric

| Stage | Required evidence in addition to five rounds |
| --- | --- |
| Understand | Wind-powered car goal; at least 3 metres; one resource/constraint |
| Imagine | Two plausible ideas/factors; chosen direction; simple reason |
| Plan | Change factor; one kept-same condition; distance measurement; simple sequence |
| Build | Actual implementation; another action/detail or how it was done; real observation/problem |
| Test | Two distinct actual trials; comparison with 3 m |
| Improve | Concrete revision; how to revise; link to test evidence |
| Reflect | Takeaway; actual experience/result connection; changed thinking or next-time action |

Predictions and future plans cannot satisfy actual construction/trial criteria. A repeated previous result without a new-trial identifier is not a second test. Goal comparisons are not measured runs. Two explicitly identified trials may have the same result. Technical vocabulary, perfect grammar, long answers, three trials/statistics and scientific correctness are not required. Several short child-authored messages can accumulate evidence.

## Other built-in task rubrics

All seven stages follow goal/ideas/plan/actual setup/actual comparisons/revision/reflection, with these task-specific criteria:

- Bridge: a gap-spanning model; 20 cm span and 200 g supported for 10 seconds; paper/tape/safe loading resources; compare structures; observe supported load, stability and time; two real load tests and goal comparison; revise from structural observations.
- Filtration: reduce visible particles; before/after clarity and no drinking; filtration resource plus no-drinking constraint; compare filter ideas/materials; measure visible clarity/particles; actual assembly and observation; two actual filtration comparisons; revisions connected to clarity evidence; do not infer drinkability.
- Insulation: material effects on cooling; temperature change over a fixed time; safe warm-water preparation; compare material ideas; keep starting temperature, water quantity or elapsed time consistent; record temperature/time; two actual comparisons; evidence-based insulation revision and reflection.
- Plants: light exposure and seedling growth; repeated growth evidence over time; keep water, soil or species consistent; compare explanations/light conditions; growth measurement with time/light conditions; actual setup/care and observation; another time point or comparison; relate growth to the light question and limitations.

Generic engineering: goal/success/resource; two ideas/choice/reason; change/kept-same/measurement/sequence; actual build and observation; two trials and goal comparison; revision/method/evidence; learning/experience/changed thinking. Inquiry defaults use explanations/predictions, actual investigation preparation and evidence comparisons in place of engineering phrasing.

## DeepSeek and deterministic application responsibilities

The existing normal coaching request includes the frozen task/stage rubric, application-derived categorical progress and bounded recent conversation. The SAME request returns concise `readiness.satisfiedCriteria` alongside the coaching reply. There is no additional paid classification, migration or rubric-creation call, no model round-count authority and no hidden reasoning returned. STEMPath whitelists criterion IDs, merges cumulative evidence and computes the final AND gate. Physical criteria also require conservative local actual-evidence checks, so the model cannot mark predictions as real trials. Safe but policy-invalid wording is normalized by the task-rubric scaffold in the same response; unsafe or turnkey designs remain rejected. Real provider identity and actual token usage remain truthful.

Before five rounds, full evidence prompts concise checking/comparison/reasoning rather than repeating an answered checkpoint. After five rounds with missing evidence, coaching targets one missing criterion. The learner never sees a countdown. Support changes affect assistance intensity only. G3–4 use “keep the same”; technical words are not necessary for readiness.

## Popup, persistence and migration

The popup requires the AND gate, current unfinished stage, no pending response and no unsafe latest action. It offers Advance and Stay, and never auto-advances. Stay keeps the stage incomplete, allows optional further thinking and leaves the Finish control available. Refresh can show the explicit choice again. Reflect presents Finish Project, with the existing completion ceremony after persistence succeeds. Ordinary learners cannot bypass the gate via Finish; teacher Force Continue remains an explicitly recorded STAGE_OVERRIDE.

LOCAL stores completion annotations with conversation; refresh reconstructs counts without duplicate increments. POSTGRES stores `messages.dialogue` JSONB (migration `0004_task_rubric_rounds`). Successful server responses carry HMAC receipts bound to project/stage/task revision/student ID/text/coach text/intent; forged completions and unsigned semantic claims cannot unlock server projects. Previously stored message text is immutable. Cross-device restoration recomputes counts from persisted pairs and preserves trusted semantic criteria.

Old gentle/checkpoint READY flags do not complete an unfinished stage. Saved conversations/records are re-evaluated without a paid call; legacy alternating conversations reconstruct conservatively. Already completed stages remain completed. Task snapshots missing a rubric materialize and persist their deterministic fallback during migration. Policy-changing research sessions remain archived rather than silently relabelled.

## Research metadata and privacy

Projects, research sessions/config snapshots and exports carry `task-rubric-v1` and task revision; current response metadata carries `young-learner-v6`. Existing archived versions remain recognized. STAGE_READY includes meaningfulRounds, requiredRounds, criteriaSatisfiedCount, criteriaRequiredCount, readinessPolicyVersion and taskRevision, with existing STAGE_COMPLETED/STAGE_ENTERED events preserved. Text capture OFF excludes learner text/evidence excerpts from research exports. Researchers can see stage counts, satisfied/missing criterion IDs and policy/revision; normal students cannot.

## Validation and known limitations

Automated coverage includes all seven stage gates (four rounds/full criteria, five rounds/missing criteria, five rounds/full criteria), exclusions, retry/reload deduplication, support independence, task defaults/revision isolation, LOCAL migration, POSTGRES round receipts/restoration, student completion bypass prevention, teacher override, same-request semantic classification and export privacy. Browser acceptance covers a full seven-stage Demo flow, four-round refresh, trivial/support-change exclusions, explicit Stay, single-vs-two actual trials, learner diagnostic hiding, no quick replies and the final completion ceremony.

- Free text is heuristic evidence supplemented by semantic classification; it is not proof of physical activity or scientific mastery. Regex checks are conservative and may miss unusual wording. Teachers retain explicit override.
- Editor descriptions guide semantic classification, while fixed evidence kinds determine local checks. Arbitrary labels do not create arbitrary executable predicates. Runtime standards are never silently authored by AI. Optional AI Task Check does not draft rubrics in this release.
- Coach history is bounded (12 recent turns plus up to 200 stage messages for progression requests). Persisted projects retain full conversations. Extremely long unauthenticated local stages may exceed the request evidence window; the minimum is capped at 20.
- Legacy completion can only be inferred from alternating saved chat; old storage has no independently verifiable success receipt.
- NO_AI intentionally cannot fabricate learner–AI rounds. Teacher override remains available; a separate non-AI progression protocol is needed before comparing that condition as an autonomous learner workflow.
- Local researcher UI is a supervised tool, not access control. POSTGRES requires existing authentication/session configuration and explicit database migration before enabling that mode. No new key or deployment settings are required for the existing LOCAL Vercel app.
- Live physical activity was simulated in acceptance messages, not performed by the agent. Local database tests use PGlite; CI additionally uses PostgreSQL 17. Local Demo and stubbed DeepSeek tests do not establish live provider quality for every possible task wording.
