import type { StageId, StagePedagogy, STEMTask, Stage } from '@/types';
export const stageIds: StageId[] = ['understand','imagine','plan','build','test','improve','reflect'];
export const pedagogy: Record<StageId, StagePedagogy> = {
  understand: {
    title:'Understand', description:'What is the problem?', objective:'Identify the problem, goal, constraints, success criteria and relevant prior knowledge.',
    student:'Explain the task in your own words and identify what you know and need to find out.', coach:'Clarify with level-appropriate clues and scaffolds; distinguish supplied facts from assumptions.', avoid:'Do not solve the problem, invent missing requirements or prescribe a design.',
    examples:["Look for what counts as success. What is one success criterion?", "My goal is ___; success means ___. Which part will you fill first?", "1. Find the goal. 2. Find success information. 3. Choose a way to check. Now only do the first missing step: which task action would you start with?"],
    questions:['What is the problem you are trying to address?','Which limits or unknowns matter?','What evidence would show success?'], fields:['Problem statement','Constraints','Success criteria','Prior knowledge'], replies:['I’m not sure','我不知道从哪里开始。','Help me identify the goal']
  },
  imagine: {
    title:'Imagine', description:'Explore possibilities', objective:'Generate and compare multiple solutions or hypotheses.',
    student:'Propose alternatives, explain assumptions and compare strengths and uncertainties.', coach:'Ask for student ideas before offering concepts; encourage divergent thinking relevant to this task.', avoid:'Do not choose the best idea for the learner or assume a physical design is needed.',
    examples:["Changing one assumption can create another possibility. What is one idea?", "Idea A ___; idea B ___. Which idea will you describe first?", "1. Name one idea. 2. Find a difference. 3. Choose one to try. Now only name your first idea: what would you explore?"],
    questions:['What different possibilities could you explore?','How do your ideas differ?','Which assumption would you want to check?'],fields:['Ideas or hypotheses','Comparison','Selected direction'],replies:['I have an idea','Help me compare ideas','我想试试另一个想法。']
  },
  plan: {
    title:'Plan',description:'Choose an approach',objective:'Turn a selected idea into a testable plan with variables, resources and evidence.',
    student:'Select variables, constants, resources, procedures and measurements and explain choices.',coach:'Help structure a fair, feasible investigation or design test; adapt to task type.',avoid:'Do not write the entire plan or choose every variable and procedure.',
    examples:["A fair comparison keeps some things the same. What would you change?", "Change ___; keep ___; measure ___. Which part will you decide first?", "1. Choose one change. 2. Keep another condition the same. 3. Decide what to measure. Now only choose the first change: what would it be?"],
    questions:['What will you change or compare?','What should remain consistent?','How will you collect useful evidence?'],fields:['Variables','Materials / resources','Procedure','Measurements'],replies:['How can I test this?','Help me choose what to measure','我需要一点提示。']
  },
  build: {
    title:'Build',description:'Put your plan into action',objective:'Construct, set up or implement the selected approach and troubleshoot observations.',
    student:'Carry out the plan, record observations and describe obstacles.',coach:'Ask what happened and where before suggesting a diagnostic check; support investigations, models and implementations as well as physical construction.',avoid:'Do not assume a prototype or moving parts; do not supply turnkey instructions or unsafe procedures.',
    examples:["Compare what you expected with what happened. What did you notice?", "I tried ___; I saw ___. Which part will you record first?", "1. Recall a step. 2. Describe what happened. 3. Choose a safe check. Now only recall your step: what did you try?"],
    questions:['What have you put into action so far?','What happened compared with your expectation?','What could you check safely next?'],fields:['Implementation notes','Problems encountered','Checks and observations'],replies:['Something isn’t working','Show me what to think about','我观察到了一个问题。']
  },
  test: {
    title:'Test',description:'Collect and examine evidence',objective:'Gather reliable evidence and distinguish observation from interpretation.',
    student:'Record trials, units, conditions, observations and uncertainty; compare with success criteria.',coach:'Ask for actual data and repeated checks; separate measured observations from inferred causes.',avoid:'Never invent measurements, claim success without evidence or treat one trial as proof.',
    examples:["Results come from what you saw or measured. What is one actual result?", "Trial ___; actual measurement ___; units ___. Which part can you fill from your notes?", "1. Find one actual result. 2. Compare with the goal. 3. Decide what else to check. Now only find one recorded result: what did you actually see?"],
    questions:['What evidence have you collected?','How consistent are repeated observations?','What do the results say about your success criteria?'],fields:['Trial results / data','Observations','Interpretation','Uncertainty'],replies:['Help me interpret my results','What evidence is missing?','How can I test this?']
  },
  improve: {
    title:'Improve',description:'Revise using evidence',objective:'Connect evidence to a justified revision and a new test.',
    student:'Choose a revision, cite evidence, predict its effect and plan a comparison.',coach:'Connect specific observations to proposed changes; encourage one-variable comparisons when appropriate.',avoid:'Do not prescribe a revision without asking for evidence or change all factors at once.',
    examples:["Link one change to an observation. Which part is worth changing?", "I saw ___; I want to change ___. Which part will you fill first?", "1. Find an observation. 2. Choose one change. 3. Decide how to check. Now only find your observation: what did you see?"],
    questions:['Which evidence suggests a revision?','What single change or refinement would you try?','How will you know whether it helped?'],fields:['Revision','Evidence for revision','Prediction','Comparison after revision'],replies:['I want to revise my approach','I disagree with the AI','What should I keep consistent?']
  },
  reflect: {
    title:'Reflect',description:'Think about your learning',objective:'Reflect on STEM understanding, decisions, self-regulation and critical AI collaboration.',
    student:'Explain changes in thinking, evidence, accepted and rejected AI suggestions and how advice was verified.',coach:'Prompt reflection on both STEM learning and AI literacy; welcome disagreement and uncertainty.',avoid:'Do not write the reflection for the student or equate agreeing with AI with learning.',
    examples:["A real experience can change an idea. What is one thing you learned?", "I used to think ___; after trying ___ I thought ___. Which blank will you fill first?", "1. Recall an experience. 2. Find one changed idea. 3. Connect the two. Now only recall your experience: what did you try yourself?"],
    questions:['How has your understanding changed?','What evidence influenced your decisions?','Which AI advice did you accept, reject or verify?'],fields:['What changed in my thinking?','Which evidence influenced my decision?','Which AI suggestion did I accept?','Which AI suggestion did I question or reject?','When did I need more help?','When could I work more independently?','What would I do differently next time?'],replies:['I disagreed with the AI','Help me reflect on my evidence','我的想法发生了变化。']
  }
};
export const stageInstructions = Object.fromEntries(stageIds.map(id=>[id,`${pedagogy[id].objective}\nStudent responsibility: ${pedagogy[id].student}\nCoach: ${pedagogy[id].coach}\nAvoid: ${pedagogy[id].avoid}`])) as Record<StageId,string>;
export function getStages(task: STEMTask): Stage[] {
  const labels: Partial<Record<StageId,string>> = task.type==='scientific-inquiry'||task.type==='experimental-investigation' ? {build:'Set Up',test:'Collect Data',improve:'Refine'} : task.type==='modelling' ? {build:'Implement',test:'Evaluate',improve:'Revise'} : task.type==='general-stem' ? {build:'Put Into Action',test:'Evaluate'} : {};
  return stageIds.map(id=>({id,title:labels[id]??pedagogy[id].title,description:pedagogy[id].description,question:pedagogy[id].questions[0],prompts:pedagogy[id].examples}));
}
export function keyQuestions(task: STEMTask, stage: StageId) {
  const questions=pedagogy[stage].questions.map(q=>`${task.title}: ${q}`);
  if(stage==='understand'&&task.constraints?.length) questions[1]=`How will you work within “${task.constraints[0]}”?`;
  if(stage==='test'&&task.successCriteria?.length) questions[2]=`What evidence addresses “${task.successCriteria[0]}”?`;
  return questions;
}
export function artifactFields(task: STEMTask,stage:StageId) {
  if(stage==='imagine' && /inquiry|investigation/.test(task.type)) return ['Hypotheses','Alternative explanations','Selected hypothesis'];
  if(stage==='build' && /inquiry|investigation/.test(task.type)) return ['Setup notes','Procedure changes','Observations'];
  if(task.type==='optimization'&&stage==='understand') return ['Objective','Constraints','Measure to optimize'];
  if(task.type==='optimization'&&stage==='improve') return ['Best-performing alternative','Trade-offs','Next comparison'];
  if(task.type==='modelling'&&stage==='build') return ['Model assumptions','Implementation notes','Checks'];
  return pedagogy[stage].fields;
}
