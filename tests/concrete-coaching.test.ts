import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {demoTasks} from '@/data/tasks';
import {stageIds} from '@/lib/stem/stages';
import {concreteQuestion,concreteLanguageValid} from '@/lib/stem/concreteCoaching';
import {youngReply} from '@/lib/stem/youngLearner';
import {pedagogicallyValid,deepseekProvider} from '@/lib/ai/deepseekProvider';
import {newProject,parseProject} from '@/lib/projects/storage';
import {initialLevel,conditionConfig} from '@/lib/research/config';
import {startSession} from '@/lib/research/session';
import {decidePedagogicalAction} from '@/lib/pedagogy/decisionEngine';
import {rubricRequest,dialogue,windTurns} from './progression-fixtures';
import {requestReadiness} from '@/lib/stem/readiness';
import type {ChatRequest} from '@/types';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
const base:ChatRequest={task:demoTasks[0],stage:'understand',level:1,message:'',history:[],completed:[],artifacts:{},mode:'demo'};
describe('task-grounded bilingual coaching',()=>{
 it.each(demoTasks)('$title grounds every criterion and stage welcome',task=>{
  for(const stage of stageIds)for(const zh of [true,false]){
   const r={...base,task,stage};
   for(const criterion of task.progressionCriteria![stage]){
    const question=concreteQuestion(r,criterion.kind,zh);
    expect(question.match(/[?？]/g)).toHaveLength(1);
    expect(concreteLanguageValid(question,r)).toBe(true);
    expect(question).not.toMatch(/2\.1|2\.5|3\.2|这一点|怎样判断/);
   }
   for(const level of [1,2,3] as const){
    const reply=youngReply({...r,level},zh);
    expect(reply.match(/[?？]/g)).toHaveLength(1);
    expect(pedagogicallyValid(reply,{...r,level})).toBe(true);
    expect(reply).not.toMatch(/这一点已经记住|2\.1|2\.5|3\.2/);
    if(level===1)expect(reply).not.toMatch(/___|\n1\.|风挡、轮子|sail, wheels/);
   }
  }
 });
 it('uses the latest learner-owned part without inventing an earlier choice',()=>{
  const r={...base,stage:'imagine' as const,history:[{role:'student' as const,text:'我想改变帆'}],message:'我现在想改轮子'};
  expect(concreteQuestion(r,'AT_LEAST_TWO_IDEAS',true)).toContain('除了轮子');
  expect(youngReply(r,true)).toContain('我现在想改轮子');
  expect(concreteQuestion({...r,message:'',history:[]},'AT_LEAST_TWO_IDEAS',true)).not.toContain('刚才');
 });
 it('does not mistake the student’s own example for an AI Level 1 answer list',()=>{
  const r={...base,stage:'imagine' as const,message:'比如我想试大一点的帆'};
  expect(pedagogicallyValid(youngReply(r,true),r)).toBe(true);
  expect(youngReply(r,true)).toContain('除了帆');
 });
 it('does not treat a support control message as a prior learner idea',()=>{
  const r={...base,stage:'imagine' as const,intent:'support-change' as const,message:'Please adjust guidance.'};
  const reply=youngReply(r,false);
  expect(reply).not.toMatch(/You said|besides your first|part you mentioned/i);
  expect(reply).toContain('first think');
 });
 it('rejects abstract live wording and repairs it with one paid call',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-only');
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'你补充的这一点已经记住了。你还能想到另一个可能吗？',readiness:{satisfiedCriteria:[]}})}}]})));
  const r={...base,message:'我想做风力小车'};
  const result=await deepseekProvider(r);
  expect(result.text).toMatch(/小车/);expect(result.text).not.toContain('这一点');
  expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('accepts contextual second-test short measurements without demanding full sentences',()=>{
  const r={...rubricRequest('test',demoTasks[0],windTurns.test.slice(0,1)),message:'2.4米',progressionHistory:[...dialogue(windTurns.test.slice(0,1)),{id:'second-question',role:'assistant' as const,text:'第二次实际测试时，小车跑了多少米？'}],history:[{role:'student' as const,text:windTurns.test[0]},{role:'assistant' as const,text:'第二次实际测试时，小车跑了多少米？'}]};
  expect(requestReadiness(r).missingCriteria).not.toContain('ACTUAL_TRIAL_2');
  expect(youngReply(r,true)).not.toMatch(/完整句子|full sentence/);
 });
 it('does not alter the five-round gate at any support level',()=>{
  for(const level of [1,2,3] as const){
   expect(requestReadiness({...rubricRequest(),level})).toMatchObject({ready:true,requiredRounds:5});
   const r={...rubricRequest(),level,message:windTurns.understand[3],progressionHistory:dialogue(windTurns.understand.slice(0,3))};
   expect(requestReadiness(r)).toMatchObject({ready:false,requiredRounds:5,meaningfulRounds:4});
  }
 });
});
describe('new defaults preserve existing support',()=>{
 it('starts normal and adaptive at one with unchanged policy marker',()=>{
  expect(newProject(base.task)).toMatchObject({level:1,supportPolicyVersion:'v2'});
  const session=startSession(base.task,conditionConfig('ADAPTIVE_SUPPORT'));
  expect(session.supportLevel).toBe(1);expect(session.configSnapshot.initialSupportLevel).toBe(1);
  expect(initialLevel('CUSTOM',2)).toBe(2);expect(initialLevel('CUSTOM')).toBe(1);
 });
 it.each([2,3] as const)('reload preserves saved Level %s',level=>{
  const saved={...newProject(base.task),level,notebook:'Keep my existing work'};
  expect(parseProject(JSON.parse(JSON.stringify(saved)))).toMatchObject({level,notebook:saved.notebook,supportPolicyVersion:'v2'});
 });
 it('offers Level 2 on repeated uncertainty while keeping selected Level 1',()=>{
  const r={...base,message:'我不知道',history:[{role:'student' as const,text:'我不知道'}]};
  expect(decidePedagogicalAction(r).recommendation).toBe(2);expect(r.level).toBe(1);
 });
});
