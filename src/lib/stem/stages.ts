import type { StageId, StagePedagogy, STEMTask, Stage } from '@/types';
export const stageIds: StageId[] = ['understand','imagine','plan','build','test','improve','reflect'];
export const pedagogy: Record<StageId, StagePedagogy> = {
  understand: {
    title:'Understand', description:'What is the problem?', objective:'Identify the problem, goal, constraints, success criteria and relevant prior knowledge.',
    student:'Explain the task in your own words and identify what you know and need to find out.', coach:'Clarify through Socratic questions; distinguish supplied facts from assumptions.', avoid:'Do not solve the problem, invent missing requirements or prescribe a design.',
    examples:['What would count as success, and why?','Separate the goal from the constraints. Which requirement matters first?','Try: Our goal is ___; we must work within ___; we will know it works when ___. What belongs in each blank?'],
    questions:['What is the problem you are trying to address?','Which limits or unknowns matter?','What evidence would show success?'], fields:['Problem statement','Constraints','Success criteria','Prior knowledge'], replies:['I’m not sure','我不知道从哪里开始。','Help me identify the goal']
  },
  imagine: {
    title:'Imagine', description:'Explore possibilities', objective:'Generate and compare multiple solutions or hypotheses.',
    student:'Propose alternatives, explain assumptions and compare strengths and uncertainties.', coach:'Ask for student ideas before offering concepts; encourage divergent thinking relevant to this task.', avoid:'Do not choose the best idea for the learner or assume a physical design is needed.',
    examples:['What are two different possibilities?','Consider a different assumption. How would that change your idea?','Compare idea A and B using: possible benefit ___; uncertainty ___; evidence needed ___. What are your two ideas?'],
    questions:['What different possibilities could you explore?','How do your ideas differ?','Which assumption would you want to check?'],fields:['Ideas or hypotheses','Comparison','Selected direction'],replies:['I have an idea','Help me compare ideas','我想试试另一个想法。']
  },
  plan: {
    title:'Plan',description:'Choose an approach',objective:'Turn a selected idea into a testable plan with variables, resources and evidence.',
    student:'Select variables, constants, resources, procedures and measurements and explain choices.',coach:'Help structure a fair, feasible investigation or design test; adapt to task type.',avoid:'Do not write the entire plan or choose every variable and procedure.',
    examples:['What evidence do you need, and how could you gather it?','Think about changing one factor while keeping relevant conditions consistent. Which factor would you choose?','Fill in: I will change ___, keep ___ consistent, measure ___, and repeat ___. What choices fit your task?'],
    questions:['What will you change or compare?','What should remain consistent?','How will you collect useful evidence?'],fields:['Variables','Materials / resources','Procedure','Measurements'],replies:['How can I test this?','Help me choose what to measure','我需要一点提示。']
  },
  build: {
    title:'Build',description:'Put your plan into action',objective:'Construct, set up or implement the selected approach and troubleshoot observations.',
    student:'Carry out the plan, record observations and describe obstacles.',coach:'Ask what happened and where before suggesting a diagnostic check; support investigations, models and implementations as well as physical construction.',avoid:'Do not assume a prototype or moving parts; do not supply turnkey instructions or unsafe procedures.',
    examples:['What did you try, and what happened?','Compare what you expected with what you observed. Where does the difference begin?','Record: step attempted ___; expected ___; observed ___; one safe check ___. Which part needs attention?'],
    questions:['What have you put into action so far?','What happened compared with your expectation?','What could you check safely next?'],fields:['Implementation notes','Problems encountered','Checks and observations'],replies:['Something isn’t working','Show me what to think about','我观察到了一个问题。']
  },
  test: {
    title:'Test',description:'Collect and examine evidence',objective:'Gather reliable evidence and distinguish observation from interpretation.',
    student:'Record trials, units, conditions, observations and uncertainty; compare with success criteria.',coach:'Ask for actual data and repeated checks; separate measured observations from inferred causes.',avoid:'Never invent measurements, claim success without evidence or treat one trial as proof.',
    examples:['What did you observe or measure?','Look at variation across repeated trials. What stays consistent?','Try a table with trial, conditions, measurement with units, and observation. Which entries are observed facts and which are interpretations?'],
    questions:['What evidence have you collected?','How consistent are repeated observations?','What do the results say about your success criteria?'],fields:['Trial results / data','Observations','Interpretation','Uncertainty'],replies:['Help me interpret my results','What evidence is missing?','How can I test this?']
  },
  improve: {
    title:'Improve',description:'Revise using evidence',objective:'Connect evidence to a justified revision and a new test.',
    student:'Choose a revision, cite evidence, predict its effect and plan a comparison.',coach:'Connect specific observations to proposed changes; encourage one-variable comparisons when appropriate.',avoid:'Do not prescribe a revision without asking for evidence or change all factors at once.',
    examples:['Which observation suggests a change, and why?','Changing one factor can help you interpret the next result. Which factor does your evidence point toward?','Complete: Evidence ___ suggests ___; I will change ___ and compare ___; my prediction is ___. What would challenge your prediction?'],
    questions:['Which evidence suggests a revision?','What single change or refinement would you try?','How will you know whether it helped?'],fields:['Revision','Evidence for revision','Prediction','Comparison after revision'],replies:['I want to revise my approach','I disagree with the AI','What should I keep consistent?']
  },
  reflect: {
    title:'Reflect',description:'Think about your learning',objective:'Reflect on STEM understanding, decisions, self-regulation and critical AI collaboration.',
    student:'Explain changes in thinking, evidence, accepted and rejected AI suggestions and how advice was verified.',coach:'Prompt reflection on both STEM learning and AI literacy; welcome disagreement and uncertainty.',avoid:'Do not write the reflection for the student or equate agreeing with AI with learning.',
    examples:['What changed in your thinking, and what evidence caused it?','Compare one decision you made independently with one influenced by AI. How did you verify the advice?','Try: I used to think ___; evidence showed ___; I accepted/rejected AI advice because ___; next time I will ___. What did you learn?'],
    questions:['How has your understanding changed?','What evidence influenced your decisions?','Which AI advice did you accept, reject or verify?'],fields:['What I learned','How my approach changed','How AI influenced my thinking','Advice I checked or rejected','Next steps'],replies:['I disagreed with the AI','Help me reflect on my evidence','我的想法发生了变化。']
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
