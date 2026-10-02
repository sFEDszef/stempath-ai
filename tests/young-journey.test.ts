import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {newProject,parseProject,parseConversations} from '@/lib/projects/storage';
import {demoTasks} from '@/data/tasks';
import {loadTask} from '@/lib/stem/tasks';
import {targetGradeBand} from '@/lib/stem/gradeBands';
import {stageIds} from '@/lib/stem/stages';
import {stageCheckpoints,checkpointState,accessibleStage,nextStage} from '@/lib/stem/stageCheckpoints';
import {boundedHistory} from '@/lib/stem/context';
import {buildDeepSeekMessages,pedagogicallyValid} from '@/lib/ai/deepseekProvider';
import {adaptiveDemo} from '@/lib/pedagogy/responses';
import {startSession,recordEvent,reviseArtifact} from '@/lib/research/session';
import {conditionConfig} from '@/lib/research/config';
import {exportJSON,exportCSV} from '@/lib/research/export';
import type {ChatRequest,StageId,LearningArtifacts,TargetGradeBand} from '@/types';
const task={...demoTasks[0],targetGradeBand:'G3-4' as const};
const base:ChatRequest={task,stage:'understand',level:1,message:'我不知道是什么意思。',history:[],artifacts:{},completed:[],mode:'demo'};
describe('durable learner state, separate research capture',()=>{
 it('migrates v1 without losing task, progress, support or records',()=>{const p=newProject(task);const {storageVersion:_,conversations:__,notebook:___,challenges:____,...old}=p;void _;void __;void ___;void ____;const restored=parseProject({...old,active:'imagine',completed:['understand'],level:3,records:{understand:{'Success criteria':'3米'}}});expect(restored).toMatchObject({storageVersion:2,active:'imagine',completed:['understand'],level:3,conversations:{},notebook:'',records:{understand:{'Success criteria':'3米'}}});expect(restored.task).toEqual(p.task);});
 it('roundtrips four turns, stage, records, notebook and challenge state',()=>{const p={...newProject(task),active:'imagine' as const,completed:['understand' as const],level:2 as const,notebook:'My own notes',records:{understand:{'Problem statement':'造风力小车','Success criteria':'跑到3米'}},conversations:{understand:[{id:'1',role:'student' as const,text:'我要造风力小车'},{id:'2',role:'assistant' as const,text:'跑多远算成功？'},{id:'3',role:'student' as const,text:'至少3米'},{id:'4',role:'assistant' as const,text:'你想先试什么？'}]},challenges:{imagine:{claim:'One test is enough',mode:'demo',choice:'Disagree',revision:'REJECTED_CLAIM'}}};expect(parseProject(JSON.parse(JSON.stringify(p)))).toEqual(p);});
 it('keeps a failed student contribution and does not persist a retry request or secrets',()=>{const history=parseConversations({understand:[{id:'a',role:'student',text:'My unfinished answer',request:{apiKey:'secret'},systemPrompt:'hidden',authorization:'secret'}]});expect(history.understand).toEqual([{id:'a',role:'student',text:'My unfinished answer'}]);});
 it('does not truncate a long local conversation or duplicate IDs',()=>{const messages=Array.from({length:200},(_,i)=>({id:String(i),role:'student',text:'My idea '+i}));expect(parseConversations({plan:[...messages,messages[0]]}).plan).toHaveLength(200);});
 it('raw local learner text never enters OFF research JSON or CSV',()=>{const secret='UNIQUE_LEARNER_SENTENCE';const p={...newProject(task),conversations:{understand:[{id:'a',role:'student' as const,text:secret}]}};let s=startSession(task,conditionConfig());s=recordEvent(s,'MESSAGE_SENT',{messageText:secret});s=reviseArtifact(s,'understand','Problem statement',secret);expect(parseProject(p).conversations.understand?.[0].text).toBe(secret);expect(exportJSON(s)).not.toContain(secret);expect(exportCSV(s)).not.toContain(secret);});
});
describe('deterministic seven-stage journey',()=>{
 it('goal alone is not READY; success is core and constraints are optional',()=>{const records={understand:{'Problem statement':'制作小车'}};expect(checkpointState(task,'understand',records).missing.map(c=>c.field)).toEqual(['Success criteria']);expect(checkpointState(task,'understand',{understand:{...records.understand,'Success criteria':'3米'}}).status).toBe('READY');});
 it('all seven stages have two core records and advance only through explicit completion',()=>{let active:StageId='understand';const completed:StageId[]=[];const records:LearningArtifacts={};for(const stage of stageIds){expect(active).toBe(stage);const checks=stageCheckpoints(task,stage);expect(checks.filter(c=>c.core)).toHaveLength(2);records[stage]=Object.fromEntries(checks.filter(c=>c.core).map(c=>[c.field,'我做了这个步骤，并记下结果。']));expect(checkpointState(task,stage,records).status).toBe('READY');expect(completed).not.toContain(stage);completed.push(stage);expect(checkpointState(task,stage,records,completed).status).toBe('COMPLETED');active=nextStage(stage)??stage;}expect(nextStage('reflect')).toBeUndefined();expect(completed).toHaveLength(7);});
 it('future stages lock, completed stages reopen, teacher override is separate',()=>{expect(accessibleStage('test','understand',[])).toBe(false);expect(accessibleStage('imagine','understand',['understand'])).toBe(true);expect(accessibleStage('understand','test',['understand'])).toBe(true);expect(accessibleStage('test','understand',[],true)).toBe(true);});
 it('NO_AI never requires an AI reflection',()=>expect(stageCheckpoints(task,'reflect',false).some(c=>c.field.includes('AI'))).toBe(false));
 it.each(demoTasks)('has checkpoints for $title without arbitrary trial-count gate',t=>{for(const stage of stageIds)expect(stageCheckpoints(t,stage).filter(c=>c.core)).toHaveLength(2);});
});
describe('grade policy and bounded context',()=>{
 it.each([['三年级','G3-4'],['六年级','G5-6'],['Grade 8','G7+'],['unknown','G3-4']])('derives %s safely', (gradeLevel,expected)=>expect(targetGradeBand({gradeLevel})).toBe(expected));
 it('rejects invalid structured grade but preserves valid imports',()=>{expect(()=>loadTask({...task,targetGradeBand:'toddler'})).toThrow();expect(loadTask(task).targetGradeBand).toBe('G3-4');});
 it.each(['G3-4','G5-6'] as TargetGradeBand[])('repairs confusion with one short question at %s',band=>{const req={...base,task:{...task,targetGradeBand:band}};const text=adaptiveDemo(req).text;expect(text).toContain('换个简单说法');expect(text.match(/[?？]/g)).toHaveLength(1);expect(text).not.toMatch(/约束条件|证据标准|假设|变量|不确定性/);expect(pedagogicallyValid(text,req)).toBe(true);expect(buildDeepSeekMessages(req)[0].content).toContain(band==='G3-4'?'Grade 3–4':'Grade 5–6');});
 it('limits provider context but keeps full local history',()=>{const messages=Array.from({length:120},(_,i)=>({role:'student' as const,text:String(i)+'x'.repeat(1900)}));expect(boundedHistory(messages).length).toBeLessThanOrEqual(8);expect(boundedHistory(messages).reduce((n,m)=>n+m.text.length,0)).toBeLessThanOrEqual(8000);expect(messages).toHaveLength(120);expect(JSON.parse(buildDeepSeekMessages({...base,history:messages})[1].content).history.length).toBeLessThanOrEqual(8);});
 it('grade trace and readiness events retain schema 0.6 without raw text',()=>{let s=startSession(task,conditionConfig());s=recordEvent(s,'STAGE_READY',{systemAction:'MINIMUM_CHECKPOINT_NOT_MASTERY'});expect(s.schemaVersion).toBe('0.6');expect(s.tasks[0].targetGradeBand).toBe('G3-4');expect(s.configSnapshot.targetGradeBand).toBe('G3-4');expect(s.promptVersion).toBe('young-learner-v4');});
});
