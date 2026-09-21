# STEMPath AI v0.5 — Research-ready interaction and experiment layer

## Entry and workflow

Normal `/` stays a learning workspace. Open `/?research=1` or `/?debug=1` for the research panel. Select a condition or a development preset to start a fresh anonymous session, assign a task, and choose **Enter student view** to hide the controls without changing the session. Query visibility is not authentication; this is a supervised prototype, not tamper-resistant condition allocation.

Reload starts a new research session with text capture OFF. Existing learning drafts may be restored and are marked `WORKSPACE_RESTORED`; for a controlled run always select a preset or **Start fresh session** before handing over the workspace. Archived sessions can be exported under **Saved session exports**. No automatic cloud randomization, participant accounts or database exists.

## Conditions and shared policy

`src/lib/research/config.ts` centralizes validated settings. LOW_SUPPORT starts at Level 1 and never proactively escalates/fades, but explicitly selected higher levels are honored. ADAPTIVE_SUPPORT preserves v0.4 recommendations and cooldowns. HIGH_SUPPORT starts at Level 3 so the first response can offer a partial structure; students can still select less support. NO_AI hides the composer and uses static stage prompts, with `/api/chat` rejecting generation before either provider is called. CUSTOM starts at Level 1 with proactive escalation/fading off until enabled in study settings. No condition authorizes complete solutions.

The decision engine reads the same condition and feature flags on client and server. Level remains the learner-selected level; condition is not silently used to overwrite it. Study settings can disable manual level changes, challenges, escalation or fading. Condition changes start a new session instead of mixing groups in one trace. Settings changes within a session are recorded with their policy snapshot. Client-carried settings are not a security boundary or verified experimental assignment.

## Sessions and events

`session.ts` contains pure transition functions. UUID session IDs and task-run IDs are randomly generated locally, never derived from names, IPs, devices or student identifiers. Known example tasks have a catalog ID and type; custom task titles/descriptions are omitted unless text capture is explicitly enabled. Each task run has its own stage completion and artifact history; changing task remounts the workspace, clears task-specific conversation, records and adaptive counters, and preserves the session's event chain. Starting a task after session completion starts a new session.

Events include event/session/task-run IDs, timestamp, stage, condition, level and event type; optional structured data includes learner signals, teaching decision, support recommendation, initiator, challenge choice and artifact field. Successful AI responses and failures are distinct; retries do not fabricate a new student message. An asynchronous response retains its request's stage and level. Late responses from a previous task are ignored.

Support history records the initial level and STUDENT, SYSTEM_RECOMMENDATION or RESEARCH_CONDITION as initiator. Stage transitions close an interval and open another; durations are clamped non-negative. Current exports snapshot the active interval. These are elapsed wall-clock estimates including inactivity/background time, not measured attention. Leaving/closing the browser can leave an interval open: archived duration then represents only the last captured value; do not infer active work from it.

Explicitly finishing after Reflect records SESSION_COMPLETED and completion timestamps. Research reset/condition changes record SESSION_ENDED with a reason instead of falsely claiming successful completion. Stages can still be completed with missing work, so completion is not mastery.

## Privacy, storage and retention

`useResearchSession.ts` writes each session under `stempath-research-v5:<UUID>` in localStorage. Only the last 5,000 interaction events are retained in a session; `droppedEvents` discloses omissions. Task/timing/support/revision histories remain until the session is cleared or storage fills. Storage failures produce a visible notice; in-memory data and exports remain usable. No study trace, session ID, event history or artifact version history is sent to `/api/chat` or analytics. The coaching request still carries current task, current records, conversation context and pedagogical configuration as in the existing application; a future configured AI provider will receive coaching content, not the research trace.

Text capture defaults OFF. Events then omit message text; artifact revisions retain timestamp, version number and character count only. Turning ON in the research panel captures subsequent student/AI text and subsequent artifact revision text locally; it does not retroactively copy conversation history. Turning OFF removes captured free text from the current session and closes the export preview, but cannot recall files already downloaded or text in other archived sessions. Never enter personal data in this prototype. Ordinary notebook/draft storage remains separate and can contain learning text regardless of the research trace setting.

**Clear current session** and **Clear all local research data** have explicit confirmation and pause recording. The latter removes all v0.5 session keys and the legacy v0.4 trace, without deleting notebooks or downloaded files. The panel shows stored session count and text-capture state. Local storage is editable, unencrypted application storage; it is not a secure research archive.

## Exports and assignment

`export.ts` provides versioned JSON and long-form CSV. JSON contains session/config metadata, task runs, events, stage intervals, support history and artifact revisions. CSV uses a `recordType` column for these entities and `sessionId`/`taskId` links; nested fields are JSON in quoted cells. Unicode, embedded quotes/newlines and spreadsheet formula prefixes are handled. Browser download is accompanied by an inspectable preview and a copy fallback for embedded browsers that block downloads. Export filenames use the anonymous session ID. No browser/device identifiers are exported.

Task assignment supports the existing demo/manual form, validated JSON, `?task=<known-demo-id>`, and the existing `injectTask` JSON integration boundary. Seeded random selection sorts the eligible catalog by ID and uses a deterministic hash to choose an index. Same seed plus same eligible catalog gives the same task. Empty categories show a clear error rather than silently violating the filter. This is task selection, not participant randomization or counterbalancing. Four developer presets cover Bridge, Plant Growth, Wind-Powered Car and Thermal Insulation; task names remain in task data/presets, not pedagogical rules.

## Challenges, artifact revisions and reflection

Contextual challenges retain v0.4 eligibility. They log a challenge ID, shown claim (only with text capture), AGREE/DISAGREE/NEED_EVIDENCE, and simple follow-up indicators TEST/REASON/REQUEST_HELP. A later optional learner selection records ACCEPTED_CLAIM/REJECTED_CLAIM/UNCERTAIN. These are behaviors/self-reports, never inferred correctness; absence of an event is not automatically coded IGNORE.

Artifact revisions are captured on blur only when the value changed; returning to an unchanged field creates no revision. The first new edit is v1. Earlier learning drafts are retained but do not imply historical revisions we did not observe. Seven Reflect prompts are shown one at a time, with previous/next controls; AI-specific prompts are omitted in NO_AI. Earlier v0.4 reflection notes remain visible. The completion summary reports descriptive activity counts (including recorded revisions and evidence-related messages), without ratings or learner scores.

## Validation and development workflow

Behavioral tests cover A–L: conditions, server NO_AI guard, task/session isolation, export ordering/privacy, support initiators, timing, revisions and linked challenge events; also seeded assignment, reset-vs-completion semantics, four task types and CSV escaping. Existing v0.4 tests remain in the suite. Run lint, typecheck, tests and production build before one complete logical commit/push. Do not upload incomplete directory-by-directory commits: each feature-branch push can start a Vercel Preview even before a pull request exists. Existing GitHub CI and Vercel Preview/Production integration and failure notifications are unchanged.

## Limits and v0.6

Heuristic signals can misclassify language, reasoning or evidence. No live model quality, pedagogical validity, browser persistence guarantee, cross-device synchronization or anti-tampering is claimed. Actual pilot preparation requires an approved protocol/consent workflow, educator-reviewed tasks and prompts, pre-specified condition settings/outcomes, data minimization and retention plan, accessible instructions, recruitment and support procedures, and a small usability/pilot rehearsal. These are research planning tasks, not added product infrastructure.

For v0.6 prioritize a reproducible scenario/evaluation harness, reviewed condition protocols and export data-quality checks. A future database would be needed for reliable central collection, cross-device resume, access-controlled study data, authoritative condition assignment and audited deletion; none is necessary for supervised local prototype sessions.
