import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {startSession,completeStage,finishSession,recordEvent,snapshot,changeSupport,reviseArtifact} from '@/lib/research/session';
import {conditionConfig,conditions} from '@/lib/research/config';
import {exportJSON,exportBundle,combinedCSV} from '@/lib/research/export';
import {validateSession} from '@/lib/research/integrity';
import {restoreBundle,STORAGE_PREFIX} from '@/lib/research/storage';
import {reviseTask,measures} from '@/lib/research/traceability';
import {newProject} from '@/lib/projects/storage';
import {tick} from '@/lib/research/reliability';
import {RequestGate,limitReached} from '@/lib/research/requestGate';
import {demoTasks} from '@/data/tasks';
import {stageIds} from '@/lib/stem/stages';
import {checkTask,demoTaskCheck} from '@/lib/ai/taskCheck';
import {pedagogicallyValid} from '@/lib/ai/deepseekProvider';
import {bilingualCases} from '@/lib/evaluation/bilingual';
import {decidePedagogicalAction} from '@/lib/pedagogy/decisionEngine';
import {adaptiveDemo} from '@/lib/pedagogy/responses';
import type {ChatRequest} from '@/types';
const fresh=()=>startSession(demoTasks[0],conditionConfig(),1000,{provider:'demo',model:'deterministic',interfaceLanguage:'en',taskLanguage:'en'});
const finished=()=>{let s=fresh();for(const stage of stageIds)s=completeStage(s,stage,true,1200);return finishSession(s,2000);};
const base:ChatRequest={task:demoTasks[0],stage:'understand',level:1,message:'What is the goal?',history:[],artifacts:{},completed:[],mode:'demo'};
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('v0.6 research integrity',()=>{
 it('complete adaptive session has PASS and explicit trace/versions',()=>{const out=JSON.parse(exportJSON(finished(),2000));expect(out.schemaVersion).toBe('0.6');expect(out.manifest.integrityStatus).toBe('PASS');expect(out.configSnapshot).toMatchObject({condition:'ADAPTIVE_SUPPORT',taskRevision:1,provider:'demo',model:'deterministic',promptVersion:'young-learner-v5'});expect(out.tasks[0].taskSnapshotHash).toMatch(/^fnv-/);});
 it('links P001 baseline 62 and outcome 78 without calculation',()=>{const s={...finished(),participantCode:'P001',baselineMeasures:{stemPretest:62},outcomeMeasures:{stemPosttest:78}};const out=JSON.parse(exportJSON(s));expect(out).toMatchObject({sessionId:s.sessionId,participantCode:'P001',baselineMeasures:{stemPretest:62},outcomeMeasures:{stemPosttest:78}});});
 it('three sessions produce directly linked analysis rows',()=>{const sessions=['LOW_SUPPORT','ADAPTIVE_SUPPORT','HIGH_SUPPORT'].map((condition,i)=>{const s=startSession(demoTasks[0],conditionConfig(condition as typeof conditions[number]),1000);return {...s,participantCode:`P00${i+1}`,baselineMeasures:{stemPretest:62+i},outcomeMeasures:{stemPosttest:78+i}};});const csv=combinedCSV(sessions);expect(csv.split('\r\n')).toHaveLength(4);for(const k of ['participantCode','condition','baseline.stemPretest','outcome.stemPosttest'])expect(csv).toContain(k);});
 it('old project and session keep revision 1 after library revision 2',()=>{const first=reviseTask(demoTasks[0]),p=newProject(first),s=startSession(first,conditionConfig());const second=reviseTask({...first,description:'An edited challenge.'},first);expect(second.taskRevision).toBe(2);expect(p.task.taskRevision).toBe(1);expect(s.tasks[0].taskRevision).toBe(1);expect(startSession(second,conditionConfig()).tasks[0].taskRevision).toBe(2);expect(reviseTask(second,second).taskRevision).toBe(2);});
 it('initial snapshot is immutable across policy and support changes',()=>{const initial=fresh();const s=recordEvent(changeSupport(initial,2,'STUDENT',1200),'CONFIG_CHANGED',{settings:{...initial.config,enableFading:false}},1300);expect(s.configSnapshot).toEqual(initial.configSnapshot);expect(s.events.at(-1)?.eventType).toBe('CONFIG_CHANGED');});
 it.each(['bad name','<script>','姓名'])('rejects participant code %s',participantCode=>expect(validateSession({...fresh(),participantCode}).status).toBe('FAIL'));
 it('rejects cross task/events, invalid levels, unordered artifacts and inconsistent NO_AI',()=>{const s=reviseArtifact(fresh(),'understand','Goal','a',1200);for(const broken of [{...s,events:s.events.map(e=>({...e,taskId:'other'}))},{...s,supportLevel:9},{...s,artifactRevisions:s.artifactRevisions.map(a=>({...a,version:2}))},{...s,condition:'NO_AI',config:conditionConfig('NO_AI'),usage:{...s.usage,aiCalls:1}}])expect(validateSession(broken).status).toBe('FAIL');});
 it('rejects malformed/incompatible backup and collisions without overwriting',()=>{const map=new Map<string,string>();const storage={get length(){return map.size;},clear:()=>map.clear(),key:(i:number)=>[...map.keys()][i]??null,getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v),removeItem:(k:string)=>map.delete(k)} as Storage;const s=finished(),bundle=exportBundle([s]);expect(restoreBundle(storage,bundle)).toBe(1);const before=map.get(STORAGE_PREFIX+s.sessionId);expect(()=>restoreBundle(storage,bundle)).toThrow('Duplicate');expect(map.get(STORAGE_PREFIX+s.sessionId)).toBe(before);expect(()=>restoreBundle(storage,'{"schemaVersion":5,"sessions":[]}')).toThrow();expect(()=>restoreBundle(storage,'{"schemaVersion":"0.6","sessions":[{}]}')).toThrow();});
 it('only finite numeric named measures accepted',()=>{expect(measures({stemPretest:62})).toEqual({stemPretest:62});expect(()=>measures({name:'Student'})).toThrow();expect(()=>measures({score:Infinity})).toThrow();});
 it('active clock excludes hidden and post-threshold idle intervals',()=>{let clock={lastTick:1000,lastActivity:1000,activeDurationMs:0,visible:true,idle:false};clock=tick(clock,61000,120000);clock={...clock,visible:false};clock=tick(clock,181000,120000);expect(clock.activeDurationMs).toBe(60000);clock={...clock,visible:true,idle:false,lastActivity:181000};clock=tick(clock,361000,120000);expect(clock.activeDurationMs).toBe(180000);expect(clock.idle).toBe(true);const s=snapshot({...fresh(),activity:clock},361000);expect(s.elapsedDurationMs).toBe(360000);expect(s.activeDurationMs).toBe(180000);expect(tick(clock,100,120000).activeDurationMs).toBe(180000);});
});
describe('paid request safeguards and task review',()=>{
 it('shared gate refuses simultaneous send/retry/challenge then unlocks',async()=>{const gate=new RequestGate();let resolve!:()=>void;const provider=vi.fn(()=>new Promise<void>(r=>{resolve=r;}));const first=gate.run(provider);await expect(gate.run(provider)).rejects.toThrow('REQUEST_BUSY');expect(provider).toHaveBeenCalledTimes(1);resolve();await first;await gate.run(async()=>{});expect(gate.busy).toBe(false);});
 it('call and token ceilings independently block additional use',()=>{const limits={maxAICallsPerSession:1,maxTokensPerSession:100};expect(limitReached({aiCalls:1,totalTokens:0},limits)).toBe(true);expect(limitReached({aiCalls:0,totalTokens:100},limits)).toBe(true);expect(limitReached({aiCalls:0,totalTokens:99},limits)).toBe(false);});
 it('paper airplane Demo task check is relevant and never mutates task',async()=>{vi.stubEnv('DEEPSEEK_API_KEY','');vi.stubGlobal('fetch',vi.fn());const task={...demoTasks[0],id:'paper',title:'纸飞机翼展与飞行距离',description:'探究翼展如何影响飞行距离。'};const before=JSON.stringify(task),result=await checkTask(task,true);expect(result.provider).toBe('demo');for(const term of ['翼展','飞行距离','纸张','重复测试'])expect(JSON.stringify(result)).toContain(term);expect(JSON.stringify(task)).toBe(before);expect(fetch).not.toHaveBeenCalled();expect(demoTaskCheck(task,false).sevenStageFit).toHaveLength(7);});
 it.each(['先读题。你认为目标是什么？','Distance means how far something travels. What does “distance / 距离” refer to here?','Read the task. What is the goal?'])('accepts safe formatting %s',text=>expect(pedagogicallyValid(text,base)).toBe(true));
 it.each(['1. Build the body\n2. Attach the wheels','Touch the live wire. What happens?','例如用一个大帆，你想怎么安装？'])('still rejects unsafe or solution content %s',text=>expect(pedagogicallyValid(text,base)).toBe(false));
});
describe('reusable bilingual policy cases',()=>{
 for(const condition of conditions)for(const scenario of bilingualCases)it(`${condition}: ${scenario.name} bilingual reproducibility`,()=>{const outputs=(['en','zh'] as const).map(language=>{const texts=scenario[language];const request:ChatRequest={...base,level:scenario.level,research:conditionConfig(condition),message:texts.at(-1)!,history:texts.slice(0,-1).map(text=>({role:'student',text})),...('intent' in scenario?{intent:scenario.intent}:{})};const decision=decidePedagogicalAction(request);expect(decidePedagogicalAction(request)).toEqual(decision);expect(adaptiveDemo(request)).toEqual(adaptiveDemo(request));expect(request.level).toBe(scenario.level);for(const task of demoTasks.slice(1))expect(adaptiveDemo(request).text).not.toContain(task.title);return decision;});expect(outputs[0].action).toBe(outputs[1].action);expect(outputs[0].recommendation).toBe(outputs[1].recommendation);});
});

describe('NO_AI full journey',()=>{
 it('completes seven stages with no usage/provider errors',()=>{let s=startSession(demoTasks[0],conditionConfig('NO_AI'),1000,{provider:'none',model:'none',interfaceLanguage:'zh-CN',taskLanguage:'zh-CN'});for(const stage of stageIds)s=completeStage(s,stage,true,1500);s=finishSession(s,2000);expect(validateSession(s).status).toBe('PASS');expect(s.usage).toEqual({aiCalls:0,inputTokens:0,outputTokens:0,totalTokens:0});expect(s.events.some(e=>e.eventType==='AI_ERROR')).toBe(false);});
});

it("saved-session export includes heartbeat time after the last event",()=>{const s=fresh();s.activity=tick(s.activity,61000,120000);const out=JSON.parse(exportJSON(s,Date.parse(s.updatedAt)));expect(out.elapsedDurationMs).toBe(60000);expect(out.activeDurationMs).toBe(60000);});
