# STEMPath AI pedagogical scaffolding matrix — support policy v2

Current policy: [v2 support ladder, migration and research versioning](support-policy-v2.md). New sessions use young-learner-v4. Numeric levels 1/2/3 are preserved.

The executable matrix is `src/lib/stem/stages.ts` (`pedagogy`). Every entry includes objective, student responsibility, coach role, prohibited shortcuts, three support examples, questions, record fields and suggested replies. Task content is intentionally absent from the matrix.

| Stage | Learning objective / student responsibility | Coach role | Avoid |
|---|---|---|---|
| Understand | Explain the problem, goal, constraints, prior knowledge and success criteria | Clarify with questions; separate facts and assumptions | A finished solution or invented requirements |
| Imagine | Generate and compare alternatives or hypotheses | Elicit student ideas first; encourage divergent thinking | Choosing an answer for the student |
| Plan | Select variables, resources, procedure and measurements | Help structure fair comparisons | Writing the complete experimental plan |
| Build / Set Up / Implement | Carry out the approach and describe obstacles | Ask what happened before troubleshooting | Assuming every task has a physical prototype |
| Test / Collect Data / Evaluate | Collect trials and distinguish observation from interpretation | Ask about reliability, units and uncertainty | Fabricating measurements or treating one trial as proof |
| Improve / Refine / Revise | Justify a revision with evidence | Connect observations to a controlled next comparison | Prescribing changes without evidence |
| Reflect | Explain STEM learning and evaluate AI collaboration | Ask which advice was accepted, rejected and checked | Writing the learner's reflection or rewarding agreement |

| Stage | Level 1: clue + question | Level 2: partial scaffold + decision | Level 3: micro-steps + first decision |
|---|---|---|---|
| Understand | Look for task actions and success information | My goal ___; success means ___ | Find goal → find success information → choose a check; do only the first missing step |
| Imagine | Changing an assumption opens another possibility | Idea A ___; idea B ___ | Name one idea → notice a difference → choose one; start with one idea |
| Plan | Keep relevant conditions the same for comparison | Change ___; keep ___; measure ___ | Choose one change → keep a condition the same → choose measurement; decide the first change only |
| Build | Compare expected and actual behavior | I tried ___; I saw ___ | Recall a step → describe what happened → choose a safe check; recall the step first |
| Test | Results are actual observations or measurements | Trial ___; result ___; units ___ | Find a real record → compare with goal → decide another check; use one real record first |
| Improve | Link one change to a real observation | I saw ___; I want to change ___ | Find observation → choose change → check effect; find the observation first |
| Reflect | Connect an experience to a changed idea | I used to think ___; after trying ___ | Recall an experience → find changed idea → connect them; recall the experience first |

Normal support starts at Level 2. Learners control any change. Two repeated difficulty signals can offer escalation; two recent productive turns with reasoning/evidence can offer fading one level. No level changes automatically, no checkpoint is filled by the coach, and no heuristic diagnoses mastery. Confusion is rephrased with increasingly concrete help rather than the same question repeated. Even Level 3 cannot generate the final solution, complete experimental design, data, conclusion or reflection.

AI Challenge is opt-in in Imagine, Plan, Test and Improve. A model-generated claim (or explicitly labelled deterministic demo claim) invites Agree / Disagree / Need evidence. Claims are visibly unverified. Follow-up coaching asks how to test them and does not reveal a verdict. No correctness score or hidden assessment is produced.

Dynamic task fields are data, not system instructions. Uncertain task classification falls back to general STEM. Core stage IDs remain stable while inquiry/modelling labels and artifact fields adapt. This is a research prototype, not a validated pedagogical intervention.
