import {describe,it,expect,vi,afterEach} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('server-only',()=>({}));
import {demoTasks} from '@/data/tasks';
import {demoProvider} from '@/lib/ai/demoProvider';
import {conversationProgress,conversationHistory} from '@/lib/stem/conversationProgress';
import {semanticReadiness} from '@/lib/stem/readiness';
import {pedagogicallyValid,deepseekProvider,buildDeepSeekMessages} from '@/lib/ai/deepseekProvider';
import {respond} from '@/lib/ai';
import {ChatMessage} from '@/components/ChatMessage';
import {AIChat} from '@/components/AIChat';
import {I18nProvider} from '@/lib/i18n';
import {getStages} from '@/lib/stem/stages';
import type {ChatRequest} from '@/types';
const base:ChatRequest={task:demoTasks[0],stage:'build',level:3,message:'加高',history:[{role:'assistant',text:'现在只做第一小步：你打算把风挡加高一点，还是加宽一点？'}],artifacts:{},completed:[],mode:'demo'};
const next=(r:ChatRequest,text:string,message:string):ChatRequest=>({...r,history:[...r.history,{role:'student',text:r.message},{role:'assistant',text}],message});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('stage-consistent physical dialogue',()=>{
 it.each([1,2,3] as const)('remembers the exact reported choice and never upgrades it at level %s',level=>{
  let r={...base,level};let reply=demoProvider(r);
  expect(conversationProgress(r)).toMatchObject({choiceAnswer:'加高',futureIntent:true,ready:false});
  expect(reply.text).toContain('你已经选了“加高”');expect(reply.text).toContain('已经亲手试过');
  expect(reply.text).not.toMatch(/A\.|B\.|加高.*还是.*加宽/);expect(reply.readiness?.ready).toBe(false);
  r=next(r,reply.text,'加高一点');reply=demoProvider(r);
  expect(reply.text).toContain('等你亲手试过');expect(reply.text).not.toMatch(/A\.|加高.*还是.*加宽/);expect(reply.readiness?.ready).toBe(false);
  r=next(r,reply.text,'我已经把它加高了，刚刚试了一次。');reply=demoProvider(r);
  expect(reply.readiness?.ready).toBe(false);expect(reply.readiness?.meaningfulRounds).toBeLessThan(5);expect(reply.text).not.toContain('这一步已经够用了');
 });
 it.each(['还没。','还没有。','还没开始。','Not yet.','I haven’t tried yet.'])('allows a physical pause after %s',message=>{
  const r=next(base,demoProvider(base).text,message),reply=demoProvider(r);
  expect(reply.readiness?.ready).toBe(false);expect(reply.text).not.toMatch(/[?？]|A\./);expect(pedagogicallyValid(reply.text,r)).toBe(true);
 });
 it.each([['build','你已经装好了吗？','装好了。'],['test','你实际测到了多少？','2.3米。'],['test','你实际看到了什么？','小车向前走了。'],['test','What did you actually measure?','It travelled 2.3 metres.'],['test','What did you actually measure?','2.3 meters.']] as const)('interprets contextual %s evidence',(stage,question,message)=>{
  const reply=demoProvider({...base,stage,message,history:[{role:'assistant',text:question}]});expect(reply.readiness?.ready).toBe(false);
 });
 it.each(['我觉得会跑3米。','我准备测一下。','应该能到3米。','I think it will travel 3 metres.'])('does not upgrade prediction %s',message=>{
  const r={...base,stage:'test' as const,message};expect(demoProvider(r).readiness?.ready).toBe(false);
  expect(semanticReadiness({ready:true,criterion:'ACTUAL_RESULT'},r).ready).toBe(false);
 });
 it('keeps non-readiness memory beyond the history window without adding records',()=>{
  const messages=[...base.history,{role:'student' as const,text:base.message},...Array.from({length:40},(_,i)=>({role:i%2?'student' as const:'assistant' as const,text:i%2?'不知道':'哪个词不明白？'}))];
  const history=conversationHistory(base,messages);expect(history.length).toBeLessThanOrEqual(12);
  expect(conversationProgress({...base,history,message:'还没'})).toMatchObject({choiceAnswer:'加高',futureIntent:true,ready:false,notDone:true});expect(base.artifacts).toEqual({});
 });
 it('rejects provider future-planning and repeated selected choices in Build',()=>{
  for(const text of ['你已有方向。你打算把风挡加高还是加宽？','你选了加高。A. 加高 B. 加宽。你选哪个？'])expect(pedagogicallyValid(text,base)).toBe(false);
  expect(pedagogicallyValid('你已经选了加高。你已经亲手试过这一步了吗？',base)).toBe(true);
 });
 it('accepts a concise real-provider acknowledgement and returns no chips',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','fake-stage-test-key');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:'你已经选了加高。你已经亲手试过这一步了吗？',readiness:{ready:false,missing:'ACTUAL_ATTEMPT'}})}}]})));
  expect(await deepseekProvider(base)).toMatchObject({mode:'ai',suggestions:[],readiness:{ready:false}});
  const prompt=buildDeepSeekMessages(base);expect(prompt[0].content).toContain('Do not generate learner quick replies');expect(JSON.parse(prompt[1].content).conversationProgress).toMatchObject({answeredChoice:true,futureIntent:true});
 });
 it('Auto fallback retains intent and physical pause semantics without another call',async()=>{
  vi.stubEnv('AI_PROVIDER','deepseek');vi.stubEnv('DEEPSEEK_API_KEY','fake-stage-test-key');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:base.history[0].text})}}]})));
  const reply=await respond({...base,mode:'auto'});expect(reply).toMatchObject({mode:'ai',suggestions:[],readiness:{ready:false}});expect(reply.text).toContain('你已经选了');expect(fetch).toHaveBeenCalledTimes(1);
 });
});
describe('free-text only UI, including saved historical suggestions',()=>{
 it.each([1,2,3] as const)('level %s has no chips in either language, including legacy messages',level=>{
  for(const text of ['你好','Hello']){
   const message={id:'old',role:'assistant' as const,text,suggestions:['Old choice 1','Old choice 2','Old choice 3']};
   const html=renderToStaticMarkup(<I18nProvider><ChatMessage message={message}/></I18nProvider>);expect(html).not.toContain('<button');expect(html).not.toContain('Old choice');
   expect(demoProvider({...base,level,message:text}).suggestions).toEqual([]);
  }
 });
 it('retains text composer, retry and system completion action',()=>{
  const noop=()=>{};const html=renderToStaticMarkup(<I18nProvider><AIChat stage={getStages(base.task)[0]} level={3} messages={[]} busy={false} onSend={noop} onUpload={noop} onComplete={noop} complete={false} onLevel={noop} onRetry={noop} error={{message:'Retry',retryable:true}}/></I18nProvider>);
  expect(html).toContain('<textarea');expect(html).toContain('重试');expect(html).toContain('send-button');expect(html).toContain('stage-footer');
 });
});
