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
const base:ChatRequest={task:demoTasks[0],stage:'build',level:3,message:'什么时候能进入下一阶段',history:[{role:'student',text:'我装好帆以后放到风扇前试了一次，小车跑了6米。'}],artifacts:{},completed:[],interfaceLanguage:'zh-CN'};
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('required stage transition regression',()=>{
 it('reproduces screenshot evidence even when latest turn only asks when to advance',()=>{
  const response=demoProvider(base);expect(response.readiness?.ready).toBe(true);
  expect(response.text).toContain('进入下一阶段');expect(response.text).not.toMatch(/[?？]|改哪个|继续探索|留在/);
 });
 it('normalizes a real provider READY reply that keeps asking optional design questions with one call',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','test-key');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'现在你已经可以进入下一阶段了。如果还想继续，你打算先改哪个地方？',readiness:{ready:true,criterion:'ACTUAL_ATTEMPT'}})}}]})));
  const response=await deepseekProvider(base);expect(response).toMatchObject({mode:'ai',readiness:{ready:true,source:'AI_SEMANTIC'}});
  expect(response.text).toContain('进入下一阶段');expect(response.text).not.toMatch(/[?？]|改哪个|还想继续/);expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('rejects an advancement claim without actual Build evidence',()=>{
  const r={...base,message:'我明天才做',history:[]};expect(pedagogicallyValid('现在你已经可以进入下一阶段了。你准备改哪个地方？',r)).toBe(false);expect(demoProvider(r).readiness?.ready).toBe(false);
 });
 it.each([true,false])('has one explicit confirmation action and no stay or close button, zh=%s',zh=>{
  for(const final of [false,true]){
   const html=renderToStaticMarkup(<ReadyTransitionModal final={final} zh={zh} disabled={false} onDecision={()=>{}}/>);
   expect(html.match(/<button/g)).toHaveLength(1);expect(html).not.toMatch(/Keep Thinking|再想一想|关闭/);expect(html).toContain('aria-describedby');
  }
 });
 it('restored promptSeen is ignored for all unfinished stages; completion suppresses it',()=>{
  const p=newProject(base.task);
  for(const stage of stageIds){
   p.active=stage;p.readiness[stage]={ready:true,criterion:({understand:'BASIC_TASK_GOAL',imagine:'ONE_IDEA',plan:'ONE_ACTIONABLE_NEXT_STEP',build:'ACTUAL_ATTEMPT',test:'ACTUAL_RESULT',improve:'ONE_REVISION',reflect:'ONE_TAKEAWAY'} as const)[stage],source:'DEMO',promptSeen:true};
   const restored=parseProject(JSON.parse(JSON.stringify(p))),ready=restored.readiness[stage]!;
   expect(shouldPromptReady(stage,stage,[],ready,ready)).toBe(true);expect(shouldPromptReady(stage,stage,[stage],ready,ready)).toBe(false);
  }
 });
});
