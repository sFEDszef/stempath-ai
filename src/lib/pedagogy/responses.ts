import type { ChatRequest, CoachResponse, StageId } from '@/types';
import { decidePedagogicalAction } from './decisionEngine';
import type { Language } from './signals';
export function suggestedReplies(language:Language){return language==='zh'?['我仍然不确定。','我想解释我的理由。','需要什么证据？']:['I’m still not sure.','I want to explain my reasoning.','What evidence would help?'];}
const questions:Record<StageId,[string,string]>={
 understand:['What is one thing the task says you need to achieve?','任务说你需要达到什么目标？'],
 imagine:['What is one possibility you would like to explore?','你想探索哪一种可能性？'],
 plan:['What is one thing you could measure?','你可以测量哪一个量？'],
 build:['What happened when you tried your next step?','尝试下一步时，你观察到了什么？'],
 test:['What did one trial show?','一次测试得到了什么结果？'],
 improve:['Which observation suggests a change?','哪条观察结果让你想做出修改？'],
 reflect:['Which evidence changed your thinking?','什么证据改变了你的想法？']
};
const hints:Record<StageId,[string,string]>={
 understand:['Look for a sentence describing what counts as success.','留意任务中描述怎样才算成功的句子。'],
 imagine:['Consider one assumption you could change.','关注一个可以改变的假设。'],
 plan:['A fair comparison keeps other relevant conditions consistent.','公平比较需要保持其他相关条件一致。'],
 build:['Compare what you expected with what actually happened.','比较你的预期与实际发生的情况。'],
 test:['Repeated observations help you see whether a result is consistent.','多次观察有助于判断结果是否一致。'],
 improve:['Link one proposed change to a specific observation.','把一项修改与一条具体观察联系起来。'],
 reflect:['Separate your own decisions from advice you accepted or rejected.','区分自己的决定和接受或拒绝的建议。']
};
const frames:Record<StageId,[string,string]>={
 understand:['My goal is ___; one condition is ___.','我的目标是___；一个条件是___。'],
 imagine:['Possibility A: ___; possibility B: ___; one difference: ___.','可能性 A：___；可能性 B：___；区别：___。'],
 plan:['I will change ___, keep ___ consistent, and measure ___.','我会改变___，保持___一致，测量___。'],
 build:['I tried ___; expected ___; observed ___.','我尝试了___；预期___；观察到___。'],
 test:['Trial ___; conditions ___; measurement and units ___; observation ___.','第___次；条件___；测量值和单位___；观察___。'],
 improve:['Evidence ___; proposed revision ___; next comparison ___.','证据___；修改___；下一次比较___。'],
 reflect:['I used to think ___; evidence ___; advice I checked ___; now I think ___.','我原来认为___；证据___；我检查的建议___；现在认为___。']
};
export function adaptiveDemo(request:ChatRequest):CoachResponse {
 const decision=decidePedagogicalAction(request), s=decision.state, zh=s.language==='zh',i=zh?1:0;
 const context=request.task.successCriteria?.[0]??request.task.objectives?.[0]??request.task.description.slice(0,180);
 let text:string;
 if(request.intent==='challenge')text=zh?`待验证的说法：一次结果符合“${context}”，就意味着这种方法在所有条件下都有效。你会如何检验？`:`An unverified claim: one result matching “${context}” means this approach works under all conditions. How could you test that?`;
 else if(request.intent==='evaluate-claim'||s.signals.critical)text=zh?'什么证据会让你接受、拒绝或修改这个说法？你会怎样收集它？':'What evidence would make you accept, reject or revise this claim? How could you collect it?';
 else {
 let question=questions[request.stage][i];
 if(s.independenceScore>=2/3&&s.consecutiveProductiveResponses>=3)question=zh?'接下来你想独立尝试什么？为什么？':'What would you try next on your own, and why?';
 else if(request.stage==='understand'&&s.focus==='condition')question=zh?'你还发现了什么必须遵守的条件？它为什么重要？':'What other condition must you work within, and why does it matter?';
 else if(s.signals.productive) question=zh?'你的理由是什么？什么证据能够支持或改变这个想法？':'What is your reasoning? What evidence could support or change this idea?';
 if(s.consecutiveUncertaintySignals>=2&&request.level===1)question=zh?'先只看任务的第一句话：你注意到了哪个要求？':'Looking only at the first sentence of the task, which requirement do you notice?';
 text=request.level===1||s.signals.productive?question:request.level===2?`${hints[request.stage][i]}\n\n${question}`:`${zh?'可以试着补全：':'Try a partial frame:'} ${frames[request.stage][i]}\n\n${question}`;
 if(request.stage==='understand'&&request.level===3&&s.focus==='goal')text=zh?`任务写着：“${context}”。\n\n你认为它是 A. 资源，B. 成功标准，还是 C. 方法？为什么？`:`The task states: “${context}”.\n\nWould you classify it as A. a resource, B. a success criterion, or C. a method? Why?`;
 }
 return {text,suggestions:request.intent==='challenge'?[]:suggestedReplies(s.language),mode:'demo'};
}
