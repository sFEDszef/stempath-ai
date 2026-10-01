# STEMPath AI v0.6 — Research Reliability & Pilot Readiness

This is a supervised, browser-local research prototype. It is not a secure research database, attention assessment, statistical analysis tool or ethics/consent system. Student hub, bilingual seven-stage workspace, Demo/Auto/DeepSeek and server routes remain intact. No database, authentication or billing was added.

## Research workflow

Open `?research=1`, select/preview a task and start a project. The research panel is a visibility switch, **not access control** (option A). Use the operational checklist before learner activity; inspect condition, revision, language, provider, optional anonymous code, text capture and limits. Condition changes start a fresh session. The initial default session is also retained, so export only the intended study session or distinguish records by session ID.

Participant code is optional, 2–32 ASCII letters/digits/hyphens, beginning with a letter. Use P001 or Pilot-A07, never names/student numbers. The software cannot determine whether a syntactically valid code identifies someone. Codes and numeric measures live only in research records, never in model requests or learner projects. Baseline/outcome editors accept up to 30 finite numeric JSON variables each, e.g. `{"stemPretest":62}` and `{"stemPosttest":78}`. Save them explicitly. Outcomes can be added after completion while the session is still open. Earlier saved sessions are exported/restored as records, not resumed as live coaching sessions.

## Schema, tasks and configuration

Schema `0.6`, app `0.6`, prompt `deepseek-v2` appear in data, not only filenames. Tasks default to revision 1; changed library content increments its revision; unchanged saves preserve it; duplicates start at revision 1. Existing projects keep their own task snapshot. Research exports use a stable pseudonymous derivative of the task ID, revision and canonical non-cryptographic FNV fingerprint. The fingerprint detects accidental changes; it does not authenticate data. Canonical definition includes translations. Task text remains absent when text capture is OFF; retain a separate teacher-controlled task-library backup to reconstruct the exact task.

Start snapshots freeze initial condition, task identifier/revision, configured provider/model, prompt version, language, policy toggles, text capture, limits and time. `/api/coach-status` checks server configuration without a paid request; availability is not a live health guarantee. If status fails, initial provider/model remains explicitly unresolved and validation warns. Each response records actual provider/model. Later policy/language/mode/text-capture changes emit CONFIG_CHANGED without replacing the initial snapshot. Default text capture is OFF. Switching OFF removes already captured free text from the current session, but cannot recall exports.

## Timing

Elapsed duration spans start to completion/end (or snapshot). Estimated active interaction duration accumulates only while the page is visible and focused, up to 120 seconds after the last pointer-down, key-down or scroll. A 5-second timer updates the clock; window blur/visibility transitions pause it immediately. No mouse-movement stream is stored. Configurable idleThresholdMs controls the cutoff. WINDOW_HIDDEN, WINDOW_VISIBLE, IDLE_STARTED and ACTIVITY_RESUMED record transitions. Background, tab suspension and wall-clock adjustments limit accuracy. This estimates interaction, **not attention or learning time**. Stage duration retains elapsed timing. Closing a browser without explicit completion leaves an incomplete session warning.

## Integrity, exports and retention

Data Quality Check validates session identity, anonymous-code format, versions, task runs, timestamp order, support/stage values, artifact revisions, challenge linkage, metadata/token consistency and NO_AI activity. PASS requires consistency and explicit completion with resolved initial metadata. Incomplete/idle/unresolved/truncated records get warnings; malformed records FAIL and export is blocked. Validation is consistency checking, not proof of authenticity or research quality.

Current JSON includes manifest and integrity report; long CSV repeats identifying fields. Export all creates a versioned JSON bundle; combined CSV has one row per session, condition/code and `baseline.*`/`outcome.*` columns for later analysis in R/SPSS/Python. No ANCOVA, adjusted means, causal conclusions or automatic covariate control occurs in the app. Educator-review JSON contains captured input/response, task/run, stage, level, condition, provider/model/action plus offline Yes/No/Unsure rating fields. Uncaptured text is null; ratings never feed the coach.

Restore accepts only validated v0.6 bundles (up to 200 sessions, 20 MB), rejects duplicate IDs and never overwrites. A failed write rolls back new records. Older v5 records are not relabeled as v0.6 or silently migrated. They remain stored until explicit research-data clearing; export them with their originating version before upgrading where required. Corrupt/legacy records are not included in the v0.6 export-all list. Storage estimate includes legacy research keys. Clear confirmations affect research keys only, not projects/tasks/notebooks or downloaded backups. Browser storage can be evicted, cleared or unavailable: export backups and apply your approved retention plan.

## Provider diagnostics and costs

Sanitized categories include AUTH_ERROR, INSUFFICIENT_BALANCE, RATE_LIMIT, TIMEOUT, PROVIDER_5XX, NETWORK_ERROR, INVALID_RESPONSE and PEDAGOGICAL_COMPLIANCE_FAILURE. Raw upstream bodies, credentials and stack traces are never returned. Student errors remain friendly; research records include safe category/time. Compliance accepts short acknowledgement sentences, simple clarity bullets, quotes and bilingual terms, while rejecting obvious full procedures/solutions, Level-1 concrete hints and some unsafe instructions. It is a heuristic, **not comprehensive semantic safety detection**; educator review remains necessary.

Compliance success and Demo fallback are recorded with stage/level/reason. Rejected response token usage is retained when returned upstream. No automatic paid regeneration is implemented; COMPLIANCE_REGENERATION is reserved and never falsely emitted. Raw rejected text is never retained, even with capture ON. Usage counts potential paid attempts conservatively when transport outcomes are unknown. Known local Demo responses do not consume the paid-call count. Tokens are reported usage, not estimates; upstream failures may omit usage. Default session ceilings: 40 potential paid calls and 30,000 reported tokens. Once either is reached, further paid generation is blocked with a bilingual message and event; Demo practice can remain available. A single bounded in-flight request may cross the token threshold. These are local safeguards, **not authoritative quotas or strong abuse/billing protection**. Reload/new sessions/direct API access can bypass them. Future persistent server-side quotas are required.

A shared synchronous browser-tab gate prevents overlapping chat, retry, support-change, AI Challenge and AI Task Check requests. Separate tabs/devices are not coordinated. AI Task Check runs only on explicit click in research task preview, makes at most one provider call, and never edits the saved task. It returns variables, evidence, controls, safety concerns and seven-stage fit with a Demo/DeepSeek label. It has a separate conservative 10-check-per-tab limit; its usage is outside learner-session counts. Without a configured provider it returns labeled Demo advice. Research visibility is not authorization for the API: deploy only as a supervised prototype until v0.7 access controls.

## Before a real child-participant pilot

Arrange institutional ethics approval where applicable, parent/guardian consent where required, student assent where required, a documented retention/deletion/access plan and researcher supervision. Review task/material safety, provider data handling and institutional approval to transmit student input externally. Text-capture OFF prevents local research text storage, **not transmission of chat/task context to the AI provider**. Avoid unnecessary personal information. Test each task/language/support condition with educators and practice backup/recovery. Do not use this prototype for high-stakes learner assessment.

## v0.7 recommendation

Add authenticated researcher access, authoritative server-side quotas/concurrency and retention with an approved database/KV; complete institution-specific privacy/consent workflow; extend educator evaluation across tasks/languages and provider versions. Do not optimize policy from human ratings automatically.

## Verification

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. CI uses mocks, never real paid requests. `src/lib/evaluation/bilingual.ts` provides paired scenarios; tests cover conditions, task revisions, schema integrity, linked pre/post data, export/restore, timing, request gate, compliance formats and paper-airplane task review. Production health verification must identify the exact deployed commit; source publication alone is not deployment proof.
