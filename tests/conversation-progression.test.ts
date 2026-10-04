import {afterEach,describe,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {demoTasks} from '@/data/tasks';
import {conversationHistory,conversationProgress,evidenceSlots,repeatsAnsweredQuestion} from '@/lib/stem/conversationProgress';
import {adaptiveDemo,suggestedReplies} from '@/lib/pedagogy/responses';
import {demoProvider} from '@/lib/ai/demoProvider';
import {respond} from '@/lib/ai';
import {buildDeepSeekMessages,pedagogicallyValid} from '@/lib/ai/deepseekProvider';
import {parseChatRequest} from '@/lib/stem/validation';
import {newProject,parseProject} from '@/lib/projects/storage';
import {startSession,recordEvent} from '@/lib/research/session';
import {conditionConfig} from '@/lib/research/config';
import {exportJSON,exportCSV} from '@/lib/research/export';
import type {ChatRequest,StageId} from '@/types';
const base:ChatRequest={task:demoTasks[0],stage:'build',level:2,message:'我看到发生了：小车向前走了几米',history:[{role:'assistant',text:'先回想你亲手做的一小步，再看实际发生了什么。可以先填一小句：我看到发生了：___。做的时候，你看到什么？'}],artifacts:{},completed:[]};
const append=(request:ChatRequest,text:string,message:string):ChatRequest=>({...request,history:[...request.history,{role:'student',text:request.message},{role:'assistant',text}],message});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('cumulative conversation evidence, separate from records and readiness',()=>{
 it('reproduces the reported Build / Level 2 observation loop',()=>{
  const reply=demoProvider(base);
  expect(conversationProgress(base).slots).toEqual([false,true]);
  expect(reply.readiness?.ready).toBe(false);
  expect(reply.text).toContain('你已经说出了看到的结果');
  expect(reply.text).not.toContain('我看到发生了： ___');
  expect(reply.text).not.toContain('做的时候，你看到什么？');
  expect(reply.text).toContain('你已经做了哪一步');
  expect(base.artifacts).toEqual({});
  const next=demoProvider(append(base,reply.text,'我装好帆以后放到风扇前试了一次。'));
  expect(next.readiness?.ready).toBe(true);expect(next.text).toContain('这一步已经够用了');
 });
 it.each([1,2,3] as const)('remembers observation and asks for actual attempt at level %s',level=>{
  const r={...base,level},reply=adaptiveDemo(r);
  expect(reply.text).not.toContain('做的时候，你看到什么？');
  expect(pedagogicallyValid(reply.text,r)).toBe(true);
 });
 it('another meaningful turn never produces an identical assistant response',()=>{
  const reply=adaptiveDemo(base).text;
  const next=adaptiveDemo(append(base,reply,base.message)).text;
  expect(next).not.toBe(reply);expect(next).not.toContain('我看到发生了： ___');
 });
 it('short contextual actual attempt is enough for READY',()=>{
  const r={...base,message:'把帆装上去了。',history:[{role:'assistant' as const,text:'你刚才具体做了哪一步？'}]};
  expect(demoProvider(r).readiness?.ready).toBe(true);
 });
 it('uses evidence from three learner turns ago even when notes are blank',()=>{
  const r=append(base,adaptiveDemo(base).text,'不知道');
  r.history.push({role:'assistant',text:'你卡在哪一小处？'},{role:'student',text:'不懂'},{role:'assistant',text:'你想先弄懂哪个词？'});
  expect(conversationProgress(r).slots).toEqual([false,true]);
  expect(adaptiveDemo(r).text).not.toContain('我看到发生了： ___');
 });
 it('retains both witnesses beyond the recent-history window and across project reload',()=>{
  const messages=[...base.history,{role:'student' as const,text:base.message},{role:'assistant' as const,text:'你具体做了什么？'},{role:'student' as const,text:'把帆装上去了'},...Array.from({length:60},(_,index)=>({role:index%2?'student' as const:'assistant' as const,text:index%2?'不知道':'你卡在哪一点？'}))];
  const p=newProject(base.task);p.active='build';p.conversations.build=messages.map((m,index)=>({...m,id:String(index)}));
  const saved=parseProject(JSON.parse(JSON.stringify(p)));
  const history=conversationHistory(base,saved.conversations.build!);
  expect(history.length).toBeLessThanOrEqual(12);
  expect(conversationProgress({...base,history,message:'我想再想想'}).slots).toEqual([true,true]);
  expect(parseChatRequest({...base,history}).history).toEqual(history);
  expect(saved.records).toEqual({});
 });
 it.each([['build','我准备装帆。'],['test','我觉得它会跑3米。']] as const)('never upgrades future evidence in %s',(stage,message)=>{
  expect(demoProvider({...base,stage,message}).readiness?.ready).toBe(false);
 });
 it('a conversation-mode flag cannot supply minimum evidence',()=>{
  expect(demoProvider({...base,history:[],message:'不知道',stageReady:true}).readiness?.ready).toBe(false);
  expect(()=>parseChatRequest({...base,stageReady:'yes'})).toThrow();
 });
});
const examples:[StageId,string,string][]=[['understand','我们要让小车跑起来','这个任务要你做什么？'],['imagine','我想把帆做大一点','你想到一个什么办法或猜想？'],['plan','先把大一点的帆装上去','你准备先做什么？'],['build','我把帆装上去了','你已经做了哪一步？'],['test','2.1米','你实际测到或看到什么结果？'],['improve','我想把轮子调直一点','你觉得哪里值得改一改？'],['reflect','我发现测试以后再修改会更好','你学会了什么，或改变了什么想法？']];
describe('gentle READY transitions at all seven stages',()=>{
 it.each(examples)('%s needs only its minimum contribution',(stage,message,question)=>{
  for(const level of [1,2,3] as const){
   const r={...base,stage,level,message,history:[{role:'assistant' as const,text:question}]},response=demoProvider(r);
   expect(response.readiness?.ready).toBe(true);expect(response.text).toContain('这一步已经够用了');
   expect(response.text).not.toContain(question);expect(pedagogicallyValid(response.text,r)).toBe(true);
   const stay={...append(r,response.text,'我想继续想一想。'),stageReady:true};
   const extra=demoProvider(stay);
   expect(extra.text).toContain(stage==='reflect'?'完成项目':'进入下一阶段');expect(extra.text).not.toMatch(/[?？]|还差|你还需要|必须完成|兴趣继续探索/);
   expect(pedagogicallyValid(extra.text,stay)).toBe(true);expect(stay.artifacts).toEqual({});
  }
 });
 it('Level 3 advances to step 2 after completing step 1, rather than restarting three steps',()=>{
  const r={...base,stage:'understand' as const,level:3 as const,message:'不知道',history:[]};
  const first=adaptiveDemo(r).text;expect(first).toContain('1. 找出任务要做的事');
  const answer=append(r,first,'这个任务要让小车跑起来。');
  const ready=adaptiveDemo(answer).text;expect(ready).toContain('这一步已经够用了');
  const second=adaptiveDemo({...append(answer,ready,'我想留下多想一点。'),stageReady:true}).text;
  expect(second).toContain('进入下一阶段');expect(second).not.toMatch(/[?？]/);expect(second).not.toContain('1. 找出任务要做的事');
 });
 it('both conversation slots lead to optional exploration without re-asking either',()=>{const r={...base,stageReady:true,history:[...base.history,{role:'student' as const,text:base.message},{role:'assistant' as const,text:'你亲手试过哪一小步？'},{role:'student' as const,text:'我把帆装上去了。'}],message:'我想多想一点'};for(const level of [1,2,3] as const){const reply=adaptiveDemo({...r,level});expect(conversationProgress(r).slots).toEqual([true,true]);expect(repeatsAnsweredQuestion(reply.text,{...r,level})).toBe(false);expect(pedagogicallyValid(reply.text,{...r,level})).toBe(true);}});
 it('Level 2 never repeats an answered frame',()=>{
  const answer=adaptiveDemo(base).text;
  expect(answer).not.toContain('我看到发生了： ___');
  const repeated=append(base,answer,base.message);
  expect(adaptiveDemo(repeated).text).not.toContain('我已经做了： ___');
 });
 it.each([1,2,3] as const)('confusion revisits with simplified different wording at level %s',level=>{
  const r={...base,level,message:'不知道',history:[]};
  const first=adaptiveDemo(r).text,next=adaptiveDemo(append(r,first,'不知道')).text;
  expect(next).not.toBe(first);expect(next).toMatch(/简单/);expect(pedagogicallyValid(next,append(r,first,'不知道'))).toBe(true);
 });
});
describe('provider anti-repetition, safe fallback and suggestions',()=>{
 it('rejects a paraphrased already-answered observation question',()=>{
  expect(repeatsAnsweredQuestion('你已经提到结果。做完那一步，你看到了什么？',base)).toBe(true);
  expect(repeatsAnsweredQuestion('你已经提到结果。你亲手试过哪一小步？',base)).toBe(false);
 });
 it('normalizes punctuation, spacing and sentence-frame boilerplate',()=>{
  const r={...base,message:'不知道',history:[{role:'assistant' as const,text:'可以先填一小句：你亲手试过哪一小步？'}]};
  expect(repeatsAnsweredQuestion('你 亲手试过 哪一小步?',r)).toBe(true);
 });
 it('real provider gets categorical evidence plus required transition mode and trusted non-repetition policy',()=>{
  const messages=buildDeepSeekMessages({...base,stageReady:true});
  expect(messages[0].content).toContain('Never ask the same substantive question twice');
  expect(messages[0].content).toContain('Blank structured records');
  expect(JSON.parse(messages[1].content).conversationProgress).toEqual({slots:{ACTUAL_ATTEMPT:false,OBSERVATION:true},minimumReady:false,transitionRequired:true,answeredChoice:false,futureIntent:false,prediction:false,notDone:false});
  expect(evidenceSlots.build).toEqual(['ACTUAL_ATTEMPT','OBSERVATION']);
 });
 it('DeepSeek pedagogical fallback uses the same progress without another paid call',async()=>{
  vi.stubEnv('AI_PROVIDER','deepseek');vi.stubEnv('DEEPSEEK_API_KEY','fake-regression-key');
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify({reply:base.history[0].text,readiness:{ready:false,missing:'ACTUAL_ATTEMPT'}})}}]})));
  const reply=await respond(base);
  expect(reply.metadata).toMatchObject({provider:'demo',fallbackReason:'pedagogy'});
  expect(reply.text).toContain('你已经说出了看到的结果');expect(reply.text).not.toContain('我看到发生了： ___');
  expect(fetch).toHaveBeenCalledTimes(1);
 });
 it.each(['zh','en'] as const)('ordinary suggestions remain empty in %s',language=>{for(const stage of Object.keys(evidenceSlots) as StageId[])expect(suggestedReplies(language,{...base,stage})).toEqual([]);});
 it('keeps full saved chat but research exports OFF never include its raw text',()=>{
  let s=startSession(base.task,conditionConfig());
  s=recordEvent(s,'MESSAGE_SENT',{messageText:base.message});
  s=recordEvent(s,'AI_RESPONSE',{messageText:adaptiveDemo(base).text});
  for(const output of [exportJSON(s),exportCSV(s)]){expect(output).not.toContain(base.message);expect(output).not.toContain('你已经说出了看到的结果');}
 });
});
