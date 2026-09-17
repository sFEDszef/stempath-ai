# STEMPath AI v0.4 — Adaptive Scaffolding Engine

## Control pipeline

Student turn and current-stage records → deterministic signals → learner indicators → teaching decision → Demo or OpenAI language generation. `src/lib/pedagogy/decisionEngine.ts` is shared by the UI and server. The server recomputes the decision from validated task-local history rather than accepting client instructions. The model must follow the selected level and engine strategy. `/api/chat`, normal Next.js builds, dynamic tasks and credential-free Demo remain intact.

## Transparent indicators

`signals.ts` detects English/Chinese uncertainty, repeated messages, low-content responses, stage-specific concepts, reasoning, evidence, critical evaluation and overgeneralization. One uncertain response does not imply failure. Two consecutive uncertainty/low-content/repetition signals suggest one level more support. Meaningful responses need content and stage-relevant concepts; exact repeated statements do not accumulate progress. Disagreement is a positive critical signal.

Understand looks for goals and constraints; Imagine alternatives; Plan variables and methods; Build execution and observations; Test measurements and evidence; Improve revision and comparisons; Reflect learning and AI influence. Meaningful records in the actual task's artifact fields add progress; blank, very short, repetitive and uncertainty-only entries do not. Three consecutive productive turns including two reasoning/critical signals can invite one-level fading. Artifact completion alone cannot cause fading or establish mastery.

These are interaction indicators, not psychological measurements or verified understanding. Keyword heuristics can miss paraphrases, confuse negation or count plausible but incorrect statements. Progress is not correctness. A future semantic classifier can implement the existing Signals contract; strategy and student control remain in STEMPath.

## Student control and challenge policy

The active level never changes silently. Recommendations show current and suggested levels. Accepting a recommendation updates the meter and requests a response at that level, without adding a fabricated student learning turn. Rejecting leaves the level unchanged and suppresses that suggestion for three new student turns. Acceptance allows a two-turn pause before another recommendation. Fading lowers exactly one level. At Level 1 repeated confusion narrows the question, without giving an answer. At higher levels struggling students receive a conceptual clue or partial frame. After productive reasoning the coach steps back rather than repeating the initial hint.

AI Challenge is eligible only in Imagine, Plan, Test or Improve, with at least two productive turns, evidence or multiple meaningful records, and a possible evidence/assumption/success-criterion context. Repeated or current uncertainty suppresses it. Eligibility is checked on the server as well as the UI. Generation is opt-in. Claims are explicitly unverified; Agree/Disagree/Need evidence lead to evidence questions, not an answer reveal. The generic Demo claim challenges overgeneralization from one result; it is not a full scientific claim generator.

Stage completion uses a soft check of the first three relevant records. Students may return to their notes or continue anyway. No stage is locked. Extra thinking prompts, images and key questions are collapsed to reduce sidebar density.

## Language, storage and debug

Language is inferred from the latest student turn, ignoring quoted AI claims. Short English/Chinese Demo responses and suggested replies follow it; task quotations retain their original language. This is not a translation system. Demo and OpenAI use the same engine, with different natural-language providers. Live model quality is not verified by mock SDK tests.

The bounded learner model is derived from recent task/stage conversation (up to 12 student turns, with the API limited to 12 recent messages). Conversations and adaptive counters are in browser memory and reset on reload/task remount; existing task/progress/artifact session storage and notebook storage are preserved. Support choices are recorded locally, including accepted/rejected recommendations and the selected target level. No database is added.

`useAdaptive.ts` keeps up to 200 metadata events for the current workspace and writes the snapshot to localStorage under `stempath-trace-v4`. Events include an opaque task fingerprint, stage, level, signal names, decision, recommendation choice, challenge generation and completion. No messages, names, artifact contents or provider text are included. The trace is never sent to `/api/chat` or any analytics endpoint. A new workspace starts a new in-memory trace; the old saved snapshot remains until replaced or cleared. Help includes a clear-trace control. Storage failure leaves the in-memory interface usable.

`?debug=1` displays indicators, the current decision and event trace only in development or on localhost/127.0.0.1. It is hidden on public production hosts; this is a developer convenience, not an authentication mechanism. Normal student UI never displays scores.

## Validation and next work

Behavioral tests cover uncertainty, fading acceptance/rejection, challenge eligibility, confusion suppression, three task types, languages, artifact quality, stage specificity, support-change turns and focus progression. Browser QA exercises the prescribed Level 1 → 2 → 1 flow, soft completion, contextual challenges, language switching and desktop/laptop/tablet widths.

For v0.5 prioritize educator-reviewed scenarios and systematic false-positive/false-negative evaluation, then learner-controlled trace/export and consent design. Add semantic interpretation behind the Signals contract only after comparison against this deterministic baseline. Authentication, billing, database and new deployment infrastructure are out of scope.
