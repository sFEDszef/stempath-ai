import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {adaptiveDemo} from '@/lib/pedagogy/responses';
import {decidePedagogicalAction} from '@/lib/pedagogy/decisionEngine';
import {buildDeepSeekMessages,pedagogicallyValid} from '@/lib/ai/deepseekProvider';
import {newProject,parseProject,projectSnapshot} from '@/lib/projects/storage';
import {conditionConfig,initialLevel,parseResearchConfig} from '@/lib/research/config';
import {startSession,recordEvent} from '@/lib/research/session';
import {exportJSON,exportCSV,exportBundle,combinedCSV,educatorReview} from '@/lib/research/export';
import {validateSession} from '@/lib/research/integrity';
import {cleanResearch} from '@/lib/server/research';
import {stageIds} from '@/lib/stem/stages';
import {supportLabels} from '@/lib/stem/supportLevels';
import {translate} from '@/lib/i18n';
import {demoTasks} from '@/data/tasks';
import type {ChatRequest,SupportLevel,TargetGradeBand} from '@/types';
const base:ChatRequest={task:demoTasks[0],stage:'understand',level:2,message:"I don't know",history:[],artifacts:{},completed:[],mode:'demo'};
describe('support policy v2',()=>{
 it.each(['G3-4','G5-6','G7+'] as TargetGradeBand[])('monotonic concrete help without taking over at %s',band=>{
  for(const stage of stageIds)for(const message of ["I don't know",'我不知道','不懂','什么意思','没懂','太难了',"I don't understand",'what does that mean']){
   const request={...base,stage,message,task:{...base.task,targetGradeBand:band}};
   const text=([1,2,3] as const).map(level=>adaptiveDemo({...request,level}).text);
   // The former question-only output cannot satisfy these format and agency checks.
   expect(text[0]).toMatch(/simply|简单/);expect(text[0]).not.toContain('___');
   expect(text[1]).toContain('___');expect(text[1]).not.toMatch(/\n1\./);
   expect(text[2]).toMatch(/\n1\.[\s\S]*\n2\.[\s\S]*\n3\./);expect(text[2]).toMatch(/car|小车/);
   expect(text[2]).toMatch(/first small question|第一个小问题/);
   for(const [i,response] of text.entries()){
    expect(response.match(/[?？]/g)).toHaveLength(1);
    expect(pedagogicallyValid(response,{...request,level:(i+1) as SupportLevel})).toBe(true);
    expect(response).not.toMatch(/Build the body|Attach a sail|安装车轮|我的结论是|your conclusion is|measured 3\.5/);
   }
   expect(request.artifacts).toEqual({});expect(request.completed).toEqual([]);
  }
 });
 it('advances the next small question after an answer without filling checkpoints',()=>{
  const start=adaptiveDemo({...base,level:3,message:"I don't know"}).text;
  const next=adaptiveDemo({...base,level:3,history:[{role:'assistant',text:start}],message:'The task asks me to build a wind-powered car.'}).text;
  expect(next).not.toContain('enough for this step');
  expect(adaptiveDemo({...base,level:3,stageReady:true,history:[{role:'assistant',text:start},{role:'student',text:'The task asks me to build a wind-powered car.'}],message:'I want to think more.'}).text).not.toContain('Go to the Next Step');expect(base.artifacts).toEqual({});
  const changed=adaptiveDemo({...base,level:2,intent:'support-change',stageReady:true,previousLevel:3,history:[{role:'student',text:'The task asks me to build a wind-powered car.'}],message:'Please adjust guidance.'}).text;
  expect(changed).not.toContain('Go to the Next Step');
 });
 it.each([1,2,3] as const)('does not repeat the last question after repeated confusion at %s',level=>{
  const first=adaptiveDemo({...base,level}).text;
  const next=adaptiveDemo({...base,level,history:[{role:'assistant',text:first}]}).text;
  expect(next).not.toBe(first);expect(next.match(/[?？]/g)).toHaveLength(1);
 });
 it.each([['LOW_SUPPORT',1],['ADAPTIVE_SUPPORT',1],['HIGH_SUPPORT',3],['CUSTOM',1],['NO_AI',1]] as const)('%s starts at %s', (condition,level)=>{
  expect(initialLevel(condition)).toBe(level);expect(startSession(base.task,conditionConfig(condition)).supportLevel).toBe(level);
 });
 it('normal projects start at 1; CUSTOM can explicitly configure its initial level',()=>{
  expect(newProject(base.task)).toMatchObject({level:1,supportPolicyVersion:'v2'});
  const custom=parseResearchConfig({...conditionConfig('CUSTOM'),initialSupportLevel:3});
  expect(startSession(base.task,custom).supportLevel).toBe(3);expect(startSession(base.task,custom).configSnapshot.initialSupportLevel).toBe(3);
  expect(initialLevel('LOW_SUPPORT',3)).toBe(1);expect(()=>parseResearchConfig({...custom,initialSupportLevel:4})).toThrow();
 });
 it('default adaptive support escalates 2→3 and fades 2→1 only by invitation',()=>{
  const stuck={...base,history:[{role:'student' as const,text:"I don't know"}]};
  expect(decidePedagogicalAction(stuck)).toMatchObject({action:'PROVIDE_STRUCTURED_SUPPORT',recommendation:3});expect(stuck.level).toBe(2);
  const reasoning={...base,message:'I will measure distance because it shows whether the goal is met.',history:[{role:'student' as const,text:'The success criterion is 3 metres because we need a measurable goal.'}]};
  expect(decidePedagogicalAction(reasoning).recommendation).toBe(1);
  expect(decidePedagogicalAction({...stuck,level:3}).recommendation).toBeUndefined();
  expect(adaptiveDemo({...base,research:conditionConfig('NO_AI')})).toMatchObject({text:'',suggestions:[]});
 });
 it.each([[1,1],[2,1],[3,2]] as const)('migrates legacy project %s→%s exactly once without losing work',(old,next)=>{
  const p={...newProject(base.task),level:old,notebook:'Keep my work',records:{understand:{'Problem statement':'My own description'}},conversations:{understand:[{id:'saved',role:'student' as const,text:'My own words'}]}};
  const {supportPolicyVersion:_policy,...legacy}=p;void _policy;
  const migrated=parseProject(legacy);expect(migrated).toMatchObject({level:next,supportPolicyVersion:'v2',notebook:p.notebook,records:p.records,conversations:p.conversations});
  expect(parseProject(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);expect(projectSnapshot(migrated)).toEqual(migrated);
  expect(parseProject({...p,supportPolicyVersion:'v1'}).level).toBe(next);expect(parseProject(p).level).toBe(old);
 });
 it('rejects unknown policy markers instead of silently remapping them',()=>expect(()=>parseProject({...newProject(base.task),supportPolicyVersion:'v3'})).toThrow());
 it('uses new bilingual labels while retaining numeric levels',()=>{
  expect([1,2,3].map(level=>supportLabels[level as SupportLevel])).toEqual(['Give Me a Hint','Help Me Break It Down','Guide Me Step by Step']);
  expect([1,2,3].map(level=>translate(supportLabels[level as SupportLevel],'zh-CN'))).toEqual(['给我一点提示','帮我拆开想','一步一步带我想']);
 });
 it('provider instructions are level-aware and remove conflicting historical limits',()=>{
  for(const level of [1,2,3] as const){const text=buildDeepSeekMessages({...base,level})[0].content;
   expect(text).toContain('ONE immediate learner decision');expect(text).toContain('2–3 micro-steps');
   expect(text).not.toMatch(/Socratic questioning only|at most one hint|No solution hint|Level 2: exactly one brief hint/);
   expect(text).toContain('"supportLevel":'+level);expect(text).toContain('whole experimental design');
  }
 });
 it('accepts thinking decomposition while rejecting answer generation and whole procedures',()=>{
  expect(pedagogicallyValid('Look at the wind-powered car task.\n1. Find what pushes the car.\n2. Find the travel distance requirement.\n3. Find one rule.\nNow only do the first step: what pushes the car?',{...base,level:3})).toBe(true);
  for(const text of ['1. Build the body\n2. Attach wheels\n3. Add a sail\nWill you use this design?','Your conclusion is that a larger sail is always best. What do you think?','我的结论是小车成功了。你同意吗？','What is the goal? What are the constraints?'])expect(pedagogicallyValid(text,{...base,level:3})).toBe(false);
  expect(pedagogicallyValid('What is the goal?',{...base,level:1})).toBe(false);
  expect(pedagogicallyValid('Look for the goal. What is it?',{...base,level:2})).toBe(false);
 });
});
describe('research trace isolation',()=>{
 const fresh=()=>startSession(base.task,conditionConfig(),1000,{interfaceLanguage:'en',taskLanguage:'en',provider:'demo',model:'deterministic'});
 it('marks v2 sessions, snapshots, response metadata and every export form',()=>{
  const s=recordEvent(fresh(),'AI_RESPONSE',{coach:{provider:'demo',model:'deterministic',responseMode:'demo',STEMPathVersion:'0.7',promptVersion:'young-learner-v6',readinessPolicyVersion:'task-rubric-v1',supportPolicyVersion:'v2'}},1200);
  expect(s).toMatchObject({supportPolicyVersion:'v2',promptVersion:'young-learner-v6',readinessPolicyVersion:'task-rubric-v1',configSnapshot:{supportPolicyVersion:'v2'}});
  for(const output of [exportJSON(s),exportCSV(s),exportBundle([s]),combinedCSV([s])])expect(output).toContain('v2');
  expect(educatorReview(s)[0].supportPolicyVersion).toBe('v2');expect(cleanResearch(s).supportPolicyVersion).toBe('v2');
 });
 it('exports archives lacking a marker explicitly as v1 without changing old numeric history',()=>{
  const s=fresh();delete s.readinessPolicyVersion;delete s.configSnapshot.readinessPolicyVersion;delete s.supportPolicyVersion;delete s.configSnapshot.supportPolicyVersion;s.promptVersion='young-learner-v3';s.configSnapshot.promptVersion='young-learner-v3';s.supportLevel=3;s.supportHistory[0].to=3;
  const out=JSON.parse(exportJSON(s));expect(out.supportPolicyVersion).toBe('v1');expect(out.configSnapshot.supportPolicyVersion).toBe('v1');expect(out.manifest.supportPolicyVersion).toBe('v1');expect(out.supportLevel).toBe(3);expect(out.supportHistory[0].to).toBe(3);expect(s).not.toHaveProperty('supportPolicyVersion');
  expect(exportBundle([s,fresh()])).toContain('v1');expect(exportBundle([s,fresh()])).toContain('v2');
 });
 it('rejects mixed or incorrectly relabeled research semantics',()=>{
  const s=fresh();expect(validateSession({...s,supportPolicyVersion:'v1'}).status).toBe('FAIL');
  const mixed=recordEvent(s,'AI_RESPONSE',{coach:{provider:'demo',model:'deterministic',responseMode:'demo',STEMPathVersion:'0.7',promptVersion:'young-learner-v3'}},1200);
  expect(validateSession(mixed).status).toBe('FAIL');expect(()=>exportJSON(mixed)).toThrow();
 });
});
