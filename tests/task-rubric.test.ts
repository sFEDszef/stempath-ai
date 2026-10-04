import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {demoTasks} from '@/data/tasks';
import {loadTask} from '@/lib/stem/tasks';
import {assessLocalReadiness,requestReadiness,semanticReadiness,READINESS_POLICY_VERSION} from '@/lib/stem/readiness';
import {completedRounds,meaningfulRound} from '@/lib/stem/progression';
import {stageIds} from '@/lib/stem/stages';
import {newProject,parseProject} from '@/lib/projects/storage';
import {reviseTask} from '@/lib/research/traceability';
import {defaultRubric} from '@/lib/stem/rubrics';
import {rubricQuestion} from '@/lib/stem/rubricCoaching';
import {startSession,recordEvent} from '@/lib/research/session';
import {conditionConfig} from '@/lib/research/config';
import {exportJSON,exportCSV} from '@/lib/research/export';
import {demoProvider} from '@/lib/ai/demoProvider';
import {deepseekProvider,buildDeepSeekMessages} from '@/lib/ai/deepseekProvider';
import {windTurns,dialogue,rubricRequest} from './progression-fixtures';
const task=demoTasks[0];
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('meaningful completed rounds',()=>{
 it.each(['好的','嗯','ok','yes','下一步','继续','随便','我不知道','!!!','???','我想吃午饭','I like football team'])('excludes %s',text=>expect(completedRounds(task,'understand',dialogue([text]))).toHaveLength(0));
 it('does not count pending, failed, system, welcome, admin or support action',()=>{
  const turns=dialogue(windTurns.understand);expect(completedRounds(task,'understand',turns.slice(0,-1))).toHaveLength(4);
  turns.at(-1)!.dialogue!.successful=false;expect(completedRounds(task,'understand',turns)).toHaveLength(4);
  turns.at(-1)!.dialogue={intent:'support-change',successful:true};expect(completedRounds(task,'understand',turns)).toHaveLength(4);
  expect(completedRounds(task,'understand',[{id:'welcome',role:'assistant',text:'Welcome!'}])).toHaveLength(0);
 });
 it('retry success counts the original learner once, never the retry action',()=>{
  const turns=dialogue(windTurns.understand.slice(0,1));const coach=turns[1];turns.push({...coach,id:'retry-response'});expect(completedRounds(task,'understand',turns)).toHaveLength(1);
  expect(completedRounds(task,'understand',[...turns,...turns])).toHaveLength(1);
 });
 it('excludes all non-chat dialogue intentions even if a UI action has a response',()=>{
  for(const intent of ['challenge','evaluate-claim','support-change'] as const){const turns=dialogue([windTurns.understand[0]]);turns[0].dialogue={intent};turns[1].dialogue={intent,replyTo:turns[0].id,successful:true};expect(completedRounds(task,'understand',turns)).toHaveLength(0);}
 });
 it('counts a successful retry of its original learner message across a support-change reply',()=>{
  const [student,coach]=dialogue([windTurns.understand[0]]);
  const support={id:'support',role:'assistant' as const,text:'我会调整帮助。',dialogue:{intent:'support-change' as const,successful:true}};
  expect(completedRounds(task,'understand',[student,support,coach])).toHaveLength(1);
 });
 it('is stage/task-relevant and independent of support levels',()=>{expect(meaningfulRound(task,'understand','这辆小车用风推动。')).toBe(true);expect(meaningfulRound(task,'understand','我想讨论电影。')).toBe(false);for(const level of [1,2,3] as const)expect(requestReadiness({...rubricRequest(),level})).toMatchObject({ready:true,meaningfulRounds:5,requiredRounds:5});});
});
describe('AND gate across all seven Wind Car stages',()=>{
 it.each(stageIds)('%s rejects 4 rounds even with the full rubric',stage=>{const r=assessLocalReadiness(task,stage,{[stage]:{summary:windTurns[stage].join(' ')}},dialogue(windTurns[stage].slice(0,4)));expect(r.meaningfulRounds).toBe(4);expect(r.missingCriteria).toEqual([]);expect(r.ready).toBe(false);});
 it.each(stageIds)('%s accepts five meaningful rounds plus the complete task rubric',stage=>{const a=requestReadiness(rubricRequest(stage));expect(a).toMatchObject({ready:true,policyVersion:'task-rubric-v1',meaningfulRounds:5,requiredRounds:5});expect(a.missingCriteria).toEqual([]);});
 it.each([
  ['understand',Array(5).fill('要做一个用风走的小车，只能用老师给的材料。'),'SUCCESS_CRITERION'],
  ['imagine',Array(5).fill('我想先把帆做大，因为大帆可能接更多风。'),'AT_LEAST_TWO_IDEAS'],
  ['plan',Array(5).fill('我想改变帆的大小。'),'MEASUREMENT'],
  ['build',Array(5).fill('我准备把帆安装在小车上，然后调整轮子。'),'ACTUAL_BUILD_ACTION'],
  ['test',Array(5).fill('第一次实际测到小车跑了2.1米，没达到3米。'),'ACTUAL_TRIAL_2'],
  ['improve',Array(5).fill('我想改变小车。'),'HOW_TO_REVISE'],
  ['reflect',Array(5).fill('我学到了很多小车知识。'),'EVIDENCE_OR_EXPERIENCE_CONNECTION']
 ] as const)('%s five rounds alone cannot unlock missing %s',(stage,texts,missing)=>{const a=assessLocalReadiness(task,stage,{},dialogue([...texts]));expect(a.meaningfulRounds).toBe(5);expect(a.ready).toBe(false);expect(a.missingCriteria).toContain(missing);});
 it('records can satisfy evidence but never replace rounds',()=>{expect(assessLocalReadiness(task,'understand',{understand:{summary:windTurns.understand.join(' ')}},[])).toMatchObject({ready:false,meaningfulRounds:0,missingCriteria:[]});});
 it('goal comparisons and repeating the first distance cannot invent a second trial',()=>{
  const turns=dialogue([windTurns.test[0],windTurns.test[2],windTurns.test[3],windTurns.test[4],'这次小车距离只有2.1米，我会保留记录。']);
  turns[1].text='第二次实际测到了多少距离？';
  expect(assessLocalReadiness(task,'test',{},turns)).toMatchObject({ready:false,meaningfulRounds:5,missingCriteria:['ACTUAL_TRIAL_2']});
  expect(assessLocalReadiness(task,'test',{},dialogue([...windTurns.test.slice(0,1),'第二次实际测到小车也跑了2.1米。',...windTurns.test.slice(2)]))).toMatchObject({ready:true});
 });
 it('model ready and a fake round count have no unilateral authority',()=>{const r=rubricRequest('understand',task,windTurns.understand.slice(0,2));expect(semanticReadiness({ready:true,meaningfulRounds:100,satisfiedCriteria:task.progressionCriteria!.understand.map(c=>c.id)},r)).toMatchObject({ready:false,meaningfulRounds:2});});
 it('model cannot replace actual physical trials with predictions',()=>{const r=rubricRequest('test',task,Array(5).fill('我觉得小车下一次可能跑6米。'));expect(semanticReadiness({satisfiedCriteria:task.progressionCriteria!.test.map(c=>c.id)},r)).toMatchObject({ready:false});});
 it('minimum five is mandatory even if teacher/import tries zero',()=>{expect(()=>loadTask({...task,progressionCriteria:{...task.progressionCriteria,minimumMeaningfulTurnsPerStage:0}})).toThrow();});
});
describe('frozen per-task rubrics and migration',()=>{
 it.each(demoTasks)('$id has explicit versioned standards for all stages',t=>{expect(t.taskRevision).toBe(2);for(const stage of stageIds)expect(t.progressionCriteria![stage].length).toBeGreaterThanOrEqual(2);expect(t.progressionCriteria!.minimumMeaningfulTurnsPerStage).toBe(5);});
 it('task profiles require their own results rather than car distance',()=>{expect(JSON.stringify(demoTasks[1].progressionCriteria)).toContain('load');expect(JSON.stringify(demoTasks[2].progressionCriteria)).toContain('particles');expect(JSON.stringify(demoTasks[3].progressionCriteria)).toContain('temperature');expect(JSON.stringify(demoTasks[4].progressionCriteria)).toContain('growth');});
 it('custom engineering/inquiry defaults are deterministic and not paid',()=>{for(const type of ['engineering-design','scientific-inquiry','experimental-investigation'] as const){const task=loadTask({id:'custom',title:'Explore shadows',description:'Investigate light and shadows',type});expect(loadTask(task)).toEqual(task);expect(task.progressionCriteria).toEqual(defaultRubric(task));}expect(defaultRubric({id:'custom',title:'x',description:'y',type:'scientific-inquiry'}).build[0].label).toContain('investigation');});
 it('editing the rubric increments revision without changing an existing project',()=>{const p=newProject(task);const edited=reviseTask({...task,progressionCriteria:{...task.progressionCriteria!,minimumMeaningfulTurnsPerStage:6}},task);expect(edited.taskRevision).toBe(3);expect(parseProject(p).task.progressionCriteria!.minimumMeaningfulTurnsPerStage).toBe(5);expect(parseProject(p).task.taskRevision).toBe(2);});
 it('LOCAL refresh reconstructs once; legacy READY is not completion',()=>{const p=newProject(task);p.conversations.understand=dialogue(windTurns.understand);const restored=parseProject(JSON.parse(JSON.stringify(p)));expect(restored.readiness.understand).toMatchObject({ready:true,meaningfulRounds:5});expect(parseProject(restored)).toEqual(restored);const old={...p,readinessPolicyVersion:'gentle-v1',conversations:{understand:dialogue(windTurns.understand.slice(0,1))},readiness:{understand:{ready:true,source:'DEMO',criterion:'BASIC_TASK_GOAL'}},completed:['imagine']};const migrated=parseProject(old);expect(migrated.readiness.understand?.ready).toBe(false);expect(migrated.completed).toEqual(['imagine']);expect(migrated.readinessPolicyVersion).toBe(READINESS_POLICY_VERSION);});
 it('migration makes no paid call and does not infer success from an unanswered message',()=>{const p=newProject(task);p.conversations.understand=dialogue(windTurns.understand).slice(0,-1);const a=parseProject(p).readiness.understand;expect(a?.meaningfulRounds).toBe(4);expect(a?.ready).toBe(false);});
 it('research OFF exports only numerical verdict metadata, never learner text',()=>{let s=startSession(task,conditionConfig());s=recordEvent(s,'STAGE_READY',{ready:true,reasonCategory:'TASK_STAGE_RUBRIC',systemAction:'SEMANTIC_MINIMUM_EVIDENCE',readinessSource:'DEMO',meaningfulRounds:5,requiredRounds:5,criteriaSatisfiedCount:3,criteriaRequiredCount:3,readinessPolicyVersion:READINESS_POLICY_VERSION,taskRevision:2,messageText:'PRIVATE LEARNER TEXT'});for(const raw of [exportJSON(s),exportCSV(s)]){expect(raw).not.toContain('PRIVATE LEARNER TEXT');expect(raw).toContain('task-rubric-v1');expect(raw).toContain('meaningfulRounds');}});
});
describe('same-request semantic classification and natural coaching',()=>{
 it.each([1,2,3] as const)('keeps the missing second real trial explicit after repeated prompts at level %s',level=>{
  const r={...rubricRequest('test',task,Array(5).fill('第一次实际测到小车跑了2.1米，还没达到3米。')),level};
  for(const zh of [true,false]){
   const prompts:string[]=[];
   for(let i=0;i<4;i++){
    const question=rubricQuestion({...r,history:prompts.map(text=>({role:'assistant' as const,text}))},zh);
    expect(question).toMatch(zh?/第二次/:/second/i);
    expect(question).toMatch(zh?/实际|真实/:/actual|real/i);
    expect(question.match(/[?？]/g)).toHaveLength(1);
    expect(question).toMatch(/[?？]$/);
    prompts.push(question);
   }
   expect(new Set(prompts).size).toBe(4);
  }
 });
 it('normalizes a repeated live-provider trial prompt without losing the successful round',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-only');
  const r=rubricRequest('test',task,Array(5).fill('第一次实际测到小车跑了2.1米，还没达到3米。'));
  const question=rubricQuestion(r,true);
  r.history=[{role:'assistant',text:question}];
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:question,readiness:{satisfiedCriteria:[]}})}}]})));
  const result=await deepseekProvider(r);
  expect(result.readiness).toMatchObject({ready:false,meaningfulRounds:5,missingCriteria:['ACTUAL_TRIAL_2']});
  expect(result.text).toMatch(/第二次/);
  expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('varied prompts continue targeting the missing goal instead of generic examples',()=>{
  const r=rubricRequest('understand',task,Array(5).fill('要做一个用风走的小车，用老师给的材料。'));
  for(const zh of [true,false]){
   const first=rubricQuestion(r,zh);
   const next=rubricQuestion({...r,history:[{role:'assistant',text:first}]},zh);
   expect(next).not.toBe(first);
   expect(next).toMatch(zh?/目标/:/goal/);
  }
 });
 it('asks a missing concept after five incomplete rounds without exposing a counter',()=>{const r=rubricRequest('understand',task,Array(6).fill('要做一个用风走的小车，只能用老师给的材料。'));const result=demoProvider(r);expect(result.readiness?.ready).toBe(false);expect(result.text).toMatch(/目标/);expect(result.text).not.toMatch(/回合|轮数|rounds|3\/5/);});
 it('rubric complete before five prompts useful checking without a modal/READY claim',()=>{const r=rubricRequest('understand',task,['要做一个用风走的小车，用老师的材料跑到3米。']);const result=demoProvider(r);expect(result.readiness).toMatchObject({ready:false,meaningfulRounds:1,missingCriteria:[]});expect(result.text).toContain('检查');});
 it('fifth success classifies in one paid call and normalizes READY',async()=>{vi.stubEnv('DEEPSEEK_API_KEY','test-only');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'你的理解已经可以进入下一步了。',readiness:{satisfiedCriteria:task.progressionCriteria!.understand.map(c=>c.id)}})}}]})));const result=await deepseekProvider(rubricRequest());expect(result.readiness?.ready).toBe(true);expect(result.text).toContain('进入下一阶段');expect(fetch).toHaveBeenCalledTimes(1);expect(result.metadata?.promptVersion).toBe('young-learner-v6');});
 it('provider receives frozen criteria and STEMPath-computed count, not executable criterion prompts',()=>{const payload=buildDeepSeekMessages(rubricRequest());expect(payload[0].content).toContain('task-rubric-v1');expect(payload[0].content).toContain('Never output hidden reasoning');const data=JSON.parse(payload[1].content);expect(data.conversationProgress.readiness.meaningfulRounds).toBe(5);expect(data.conversationProgress.frozenRubric).toEqual(task.progressionCriteria);});
});
