import {conversationProgress} from '@/lib/stem/conversationProgress';
import {youngReply} from '@/lib/stem/youngLearner';
import type { ChatRequest, CoachResponse } from '@/types';
import { decidePedagogicalAction } from './decisionEngine';
import type { Language } from './signals';
export function suggestedReplies(language:Language,request?:ChatRequest){
 const zh=language==='zh';
 if(!request)return zh?['我仍然不确定。','我想解释我的理由。','我可以怎样检查？']:['I’m still not sure.','I want to explain my reasoning.','How can I check my idea?'];
 const progress=conversationProgress(request);
 if(progress.ready&&!request.stageReady)return zh?[request.stage==='reflect'?'我想完成项目。':'我想进入下一阶段。','我还想多想一点。']:[request.stage==='reflect'?'I want to finish the project.':'I want to move to the next stage.','I want to think a little more.'];
 const topics:Record<ChatRequest['stage'],[[string,string],[string,string]]>={
  understand:[['任务的目标','the task goal'],['成功的标准','what counts as success']],
  imagine:[['自己的想法','my idea'],['不同的办法','different possibilities']],
  plan:[['第一小步','my first step'],['准备观察的情况','what I will watch']],
  build:[['刚才的尝试','what I actually tried'],['看到的情况','what I saw']],
  test:[['实际的结果','my actual result'],['结果和目标的比较','how my result compares with the goal']],
  improve:[['想改的地方','a part worth changing'],['修改的方法','how I will change it']],
  reflect:[['学到的一点','a takeaway'],['那次经历','an experience']]
 };
 const target=progress.target===0?0:1;
 const alternate=request.history.filter(m=>m.role==='assistant').length%2===0;
 return [zh?`我可以怎样描述${topics[request.stage][target][0]}？`:`How can I describe ${topics[request.stage][target][1]}?`,zh?(alternate?'我想把这一点说得更清楚。':'我想解释一下自己的想法。'):(alternate?'I want to explain that more clearly.':'I want to explain my thinking.'),zh?(alternate?'这一小步是什么意思？':'你能换个简单说法吗？'):(alternate?'What does this small step mean?':'Could you put that more simply?')];
}
export function adaptiveDemo(request:ChatRequest):CoachResponse {
 if(request.research?.condition==='NO_AI')return {text:'',suggestions:[],mode:'demo'};
 const decision=decidePedagogicalAction(request),zh=decision.state.language==='zh';
 if(request.intent==='challenge'){
  const context=request.task.successCriteria?.[0]??request.task.objectives?.[0]??request.task.description.slice(0,180);
  return {text:zh?`待验证的说法：一次结果符合“${context}”，就意味着这种方法在所有条件下都有效。`:`An unverified claim: one result matching “${context}” means this approach works under all conditions.`,suggestions:[],mode:'demo'};
 }
 // Critical evaluation still receives the chosen amount of help; no verdict or invented evidence.
 const evaluating=request.intent==='evaluate-claim'||decision.state.signals.critical;
 const text=youngReply(evaluating?{...request,stage:'test'}:request,zh);
 return {text:evaluating?(zh?'AI也可能说错。我们要找自己检查过的结果。':'AI can be wrong. Look for results you checked yourself.')+'\n\n'+text:text,suggestions:suggestedReplies(decision.state.language,request),mode:'demo'};
}
