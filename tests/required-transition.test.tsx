import {windTurns,dialogue} from './progression-fixtures';
import {assessLocalReadiness} from '@/lib/stem/readiness';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('server-only',()=>({}));
import {ReadyTransitionModal} from '@/components/ReadyTransitionModal';
import {demoTasks} from '@/data/tasks';
import {newProject,parseProject} from '@/lib/projects/storage';
import {stageIds} from '@/lib/stem/stages';
import {shouldPromptReady} from '@/lib/stem/readyPrompt';
import {demoProvider} from '@/lib/ai/demoProvider';
import {deepseekProvider,pedagogicallyValid} from '@/lib/ai/deepseekProvider';
import type {ChatRequest} from '@/types';
const base:ChatRequest={task:demoTasks[0],stage:'build',level:3,message:'什么时候能进入下一阶段',history:[{role:'student',text:'我装好帆以后放到风扇前试了一次，小车跑了6米。'}],progressionHistory:dialogue(windTurns.build),artifacts:{},completed:[],interfaceLanguage:'zh-CN'};
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('required stage transition regression',()=>{
 it('reproduces screenshot evidence even when latest turn only asks when to advance',()=>{
  const response=demoProvider(base);expect(response.readiness?.ready).toBe(true);
  expect(response.text).toContain('进入下一阶段');expect(response.text).not.toMatch(/[?？]|改哪个/);
 });
 it('normalizes a real provider READY reply that keeps asking optional design questions with one call',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-key');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'现在你已经可以进入下一阶段了。如果还想继续，你打算先改哪个地方？',readiness:{ready:true,criterion:'ACTUAL_ATTEMPT'}})}}]})));
  const response=await deepseekProvider(base);expect(response).toMatchObject({mode:'ai',readiness:{ready:true,source:'AI_SEMANTIC'}});
  expect(response.text).toContain('进入下一阶段');expect(response.text).not.toMatch(/[?？]|改哪个|还想继续/);expect(fetch).toHaveBeenCalledTimes(1);
 });
 it.each([
  {stage:'understand' as const,intent:'support-change' as const,message:'请调整帮助。',history:[{role:'assistant' as const,text:'这个任务要你做什么？'}],reply:'好的，我会一步一步带你想。这个任务要你做什么？'},
  {stage:'test' as const,intent:'chat' as const,message:'我觉得下一次可能会跑6米。',history:[{role:'assistant' as const,text:'你实际测到或看到什么结果？'}],reply:'你觉得能跑6米。你准备怎么改小车？'}
 ])('bounded $stage coaching is repaired without another paid call or false readiness',async scenario=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-key');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:scenario.reply,readiness:{ready:false,missing:scenario.stage==='test'?'ACTUAL_RESULT':'BASIC_TASK_GOAL'}})}}]})));
  const request={...base,...scenario,stageReady:false,progressionHistory:[]},response=await deepseekProvider(request);
  expect(response).toMatchObject({mode:'ai',readiness:{ready:false},suggestions:[]});expect(pedagogicallyValid(response.text,request)).toBe(true);expect(fetch).toHaveBeenCalledTimes(1);
  expect(response.text).not.toContain('进入下一阶段');expect(response.text).not.toContain('准备怎么改');
 });
 it('bounded scaffolds still reject unsafe generated output',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-key');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'1. Build the body\n2. Add wheels',readiness:{ready:false,missing:'ACTUAL_RESULT'}})}}]})));
  await expect(deepseekProvider({...base,stage:'test',message:'我觉得会跑6米',history:[]})).rejects.toMatchObject({code:'pedagogy'});expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('rejects an advancement claim without actual Build evidence',()=>{
  const r={...base,message:'我明天才做',history:[],progressionHistory:[]};expect(pedagogicallyValid('现在你已经可以进入下一阶段了。你准备改哪个地方？',r)).toBe(false);expect(demoProvider(r).readiness?.ready).toBe(false);
 });
 it.each([true,false])('has explicit advance and stay actions without silent advancement, zh=%s',zh=>{
  for(const final of [false,true]){
   const html=renderToStaticMarkup(<ReadyTransitionModal final={final} zh={zh} disabled={false} onDecision={()=>{}}/>);
   expect(html.match(/<button/g)).toHaveLength(2);expect(html).toContain(zh?'继续在本阶段想一想':'Keep Thinking');expect(html).toContain('aria-describedby');
  }
 });
 it('restored promptSeen is ignored for all unfinished stages; completion suppresses it',()=>{
  const p=newProject(base.task);
  for(const stage of stageIds){
   p.active=stage;p.conversations[stage]=dialogue(windTurns[stage]);p.readiness[stage]={...assessLocalReadiness(base.task,stage,{},p.conversations[stage]),promptSeen:true};
   const restored=parseProject(JSON.parse(JSON.stringify(p))),ready=restored.readiness[stage]!;
   expect(shouldPromptReady(stage,stage,[],ready,ready)).toBe(true);expect(shouldPromptReady(stage,stage,[stage],ready,ready)).toBe(false);
  }
 });
});
