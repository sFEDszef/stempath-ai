> Archived policy notes. Current readiness uses [task-specific rubrics and five meaningful rounds](task-rubric-readiness.md). The transition UI remains, but earlier gentle-v1 thresholds below are superseded.

# Semantic Readiness & Gentle Stage Progression

Readiness policy: `gentle-v1`. Prompt: `young-learner-v5`. Support policy remains `v2`; normal support remains Level 2. Research schema/app version remains 0.6/0.7.

READY means **minimum sufficient learner evidence to proceed**. It does not certify accuracy, mastery, quality, safety of a whole experiment, teacher approval or success of the product. All ages and all three support levels use the same minimum rubric:

| Stage | Minimum criterion | Enough | Not enough |
|---|---|---|---|
| Understand | BASIC_TASK_GOAL | One basic task goal/success statement | Acknowledgement/irrelevant text |
| Imagine | ONE_IDEA | One idea, guess or direction | AI suggestion followed by “ok” |
| Plan | ONE_ACTIONABLE_NEXT_STEP | One intended action | Confusion alone |
| Build | ACTUAL_ATTEMPT | Report of an actual attempt | Future plan |
| Test | ACTUAL_RESULT | One observation or measurement; short numeric result allowed | Prediction |
| Improve | ONE_REVISION | One change to try | No proposed change |
| Reflect | ONE_TAKEAWAY | One meaningful takeaway/change in thinking | Acknowledgement |

## Response and fallback

The existing DeepSeek Chat Completions request sets `response_format: {type: "json_object"}` (official documentation: https://api-docs.deepseek.com/guides/json_mode/). It requests a short visible `reply` and `readiness: {ready: true, criterion: ...}` or `{ready: false, missing: ...}`. It does not request chain-of-thought, evidence quotations or free-form assessment explanations. The server assigns `source: AI_SEMANTIC` and whitelists the current stage criterion. Learner role, acknowledgements and temporal/safety hard exclusions are checked independently. The visible reply separately passes the unchanged pedagogical formatting/safety validator.

Malformed/missing assessment metadata falls back deterministically. A valid reply survives missing metadata, plain-text legacy output or a malformed JSON metadata tail when its intact reply string can be parsed. Unrecoverable or pedagogically invalid replies retain the existing Auto Demo fallback/forced-provider retry error. No automatic paid regeneration occurs. One normal coaching request only.

Demo uses learner-authored messages and current-stage records. LOCAL_RECORD identifies a relevant note; DEMO identifies deterministic conversation evidence. NO_AI never calls the provider and can continue using learner records. Two checkpoint notes remain useful, but both are no longer gates. Local heuristics are deliberately limited and may miss paraphrases; the learner can write one meaningful note. They do not claim to verify that reported physical activity actually occurred.

## UI and persistence

`readiness.ts` defines the shared rubric, deterministic classifier, metadata parser, copy and migration. Readiness is stored separately from records and never silently autofills them. A calm card says “这一步已经够用了，可以进入下一步啦！” / “You have enough to continue to the next step.” Choosing to think more hides the card but preserves READY and the completion button. Finish before READY shows one immediate cue. No stage advance or completion occurs until the learner clicks. Explicitly dangerous actions still block completion, even after otherwise latched readiness.

LOCAL project snapshots contain `readinessPolicyVersion` and a per-stage readiness map. READY is latched across additional conversation and refresh; restart clears it. Legacy projects derive minimum readiness from learner records/messages without AI and retain completion, conversations, notes, support v2 and AI Challenge state.

POSTGRES migration `0002_gentle_readiness.sql` adds the project policy marker and per-stage JSON readiness. Existing rows initially remain `checkpoint-v1`; locked reconstruction migrates once and increments the optimistic version. Existing completed stages are preserved. Signed semantic receipts bind the project/stage/policy/criterion using the existing server-only SESSION_SECRET; no extra configuration or learner text is included. The server verifies a new semantic receipt or independently derives local evidence before allowing student completion. Existing READY stays latched. A normal chat does not race project saves by changing project version. Apply explicit migrations before enabling/updating POSTGRES. Production LOCAL/auth-disabled mode needs no database change and remains unchanged.

## Research and privacy

New sessions/config snapshots/response metadata carry `readinessPolicyVersion: gentle-v1`. Existing v4 sessions keep their old policy; exports distinguish missing legacy markers as `checkpoint-v1`. Opening an old server study archives it with READINESS_POLICY_CHANGE and starts a fresh policy-consistent session. No old archive is relabelled.

First readiness emits STAGE_READY once per task/stage: systemAction=SEMANTIC_MINIMUM_EVIDENCE, ready=true, reasonCategory=current criterion, readinessSource=AI_SEMANTIC/LOCAL_RECORD/DEMO. Explicit completion and navigation retain STAGE_COMPLETED/STAGE_ENTERED. Restoring latched READY does not emit a duplicate or request AI. Events carry no raw sentence, assessment explanation or receipt. storeMessageText=OFF continues to strip learner/model text; learning conversations follow the separate existing project storage policy. JSON/CSV/bundle manifests distinguish readiness policy independently from support policy.

## Validation and limits

Tests cover the requested Chinese/English short contributions, level independence, learner-only evidence, actual-vs-future temporal distinctions, one note vs two notes, persistence/migration/latching, research event deduplication/privacy, NO_AI, structured provider output and one-call fallback, plus authenticated POSTGRES receipt/migration checks.

An AI semantic classification remains probabilistic; local matching is conservative and approximate. Short ambiguous results need current-stage context. Self-reported actions are not verified physical observations. The lightweight existing pedagogical guard is not a complete semantic safety guarantee. Live model teaching quality and research validity still need human evaluation.

## Learner choice at READY

A new false → true transition in the active unfinished stage opens an accessible native dialog. It never advances automatically. ADVANCE uses the existing guarded completion/entry flow; STAY, Escape, the backdrop and the close control only dismiss it and restore workspace focus. The normal Finish button remains available. Reflect offers Finish Project and completes the existing session without an eighth stage.

Each stage persists `promptSeen: true` when its prompt opens, alongside latched ready/criterion/source in LOCAL project snapshots and POSTGRES stage JSON. No schema migration or provider request is needed. Previously READY or completed stages do not open a prompt on restoration/revisit. Server merges may acknowledge a verified or locally evidenced READY stage but cannot forge readiness or clear a previous acknowledgement. Provider metadata cannot acknowledge the dialog on a learner's behalf.

`STAGE_READY_DECISION` records only `studentAction: ADVANCE | STAY`, separately from STAGE_READY, STAGE_COMPLETED and STAGE_ENTERED. Decision events never contain raw learner text, even with text capture enabled.
