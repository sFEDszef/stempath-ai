# STEMPath AI v0.6.2

## Durable learner state
The old Workspace owned conversations only in React state; unmounting removed them. Projects now have storageVersion: 2, per-stage conversations (id/role/text/suggestions only), notebook, and per-stage AI Challenge claim/choice/revision alongside the existing task snapshot, records, completed stages, active stage and support level. The existing stempath-projects-v1 collection key remains to allow in-place migration. Valid old projects retain all existing fields; absent conversations start empty. Previous per-project notebook keys are read as a fallback and are not deleted during migration.

Writes are debounced 350 ms and flushed on navigation, pagehide and backgrounding. Saved / Saving / Save failed and explicit save retry are visible. Storage quota/private-mode failures leave in-memory work available; they do not silently remove older conversations. No browser storage can guarantee recovery after clearing data, device loss or an abrupt crash before the write. Images remain transient object URLs, never large base64 localStorage entries. No cross-device or cross-origin migration is implied.

Failed student messages remain visible; a trailing unanswered student turn offers explicit retry after reopening. Reload never issues a paid request automatically. If the workspace is closed during an in-flight request, its later answer is not attached to a different project; the preserved student turn may be explicitly retried. Learners should wait for an answer before leaving if they want to avoid repeating that call.

## Privacy and context
Learner-local conversations are distinct from research capture. storeMessageText OFF still excludes conversation and artifact text from research JSON/CSV. Project text is not passed into the research exporter. On shared devices, project history remains visible to the next device user; do not enter personal information. Research records retain schema 0.6, with optional targetGradeBand and additional STAGE_READY/STAGE_OVERRIDE event types. Old v0.6 archives remain accepted. New app metadata is 0.6.2 and prompt version is young-learner-v3.

Provider context is at most 8 recent messages / 8,000 history characters (2,000 per message), plus active task, current stage/support, structured records and completed-stage flags. All learner-visible history stays local. There is no paid summarization or readiness call.

## Grade and language
Optional targetGradeBand is G3-4, G5-6 or G7+. Clear free-text grade descriptions are derived; unknown/mixed descriptions conservatively default to G3-4. Teachers can explicitly choose. Grade bands are task configuration, not child ages.

G3-4 uses concrete objects, short sentences, one manageable question and a short purpose cue or confusion repair. G5-6 can introduce STEM vocabulary with simple explanation. Level 1 permits a purpose cue but no solution hints; Level 2 supplies one clue and one question; Level 3 supplies a small frame/choice without completing a design. Task fields remain untrusted context. Model compliance checks are conservative format checks, not guarantees of pedagogy or safety; educator review remains necessary.

## Stage checkpoints
Canonical IDs and support levels remain unchanged. Primary Chinese labels: 看懂任务、想办法、做计划、动手试试（探究任务：开始探究）、测一测、改一改、想一想.

| Stage | Two core learner records |
|---|---|
| understand | task goal; success condition |
| imagine | one idea/guess; chosen direction |
| plan | intended actions; what to observe/measure |
| build | something carried out; what happened |
| test | actual result; comparison with goal |
| improve | something worth changing; intended change |
| reflect | learning/change in thinking; experience that influenced it |

Existing canonical record keys preserve older notes. Optional records do not block. A learner may explicitly copy their latest answer into a checkpoint rather than repeat typing. Deterministic readiness checks record presence (including short numeric answers such as 3米), not semantic correctness, mastery, truth of measurements or task success. Task-specific repetitions should be described in the result and reviewed by a teacher; there is no arbitrary universal trial count.

READY is logged when core records become available, but never navigates automatically. Finish & Go to Next Step explicitly completes and advances; Reflect finishes the project without an eighth stage. Completed/current stages can be reopened; future stages require preceding completion. Teacher/research view permits logged override navigation and Force Continue. This mode is not access-controlled and must remain supervised.

## Pilot recommendation
Run a small supervised Grade 3–4 / Grade 5–6 usability pilot before formal data collection. Check comprehension, single-question pacing, checkpoint burden, recovery after refresh, error retry and shared-device privacy. Explain that Saved refers to this device, images are temporary, READY is not mastery and AI can be wrong. Retain existing study consent/ethics processes; this software does not supply them.
