import {youngReply} from '@/lib/stem/youngLearner';
import type { ChatRequest, CoachResponse } from '@/types';
import { decidePedagogicalAction } from './decisionEngine';
import type { Language } from './signals';
export function suggestedReplies(language:Language){return language==='zh'?['我仍然不确定。','我想解释我的理由。','我可以怎样检查？']:['I’m still not sure.','I want to explain my reasoning.','How can I check my idea?'];}
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
 return {text:evaluating?(zh?'AI也可能说错。我们要找自己检查过的结果。':'AI can be wrong. Look for results you checked yourself.')+'\n\n'+text:text,suggestions:suggestedReplies(decision.state.language),mode:'demo'};
}
