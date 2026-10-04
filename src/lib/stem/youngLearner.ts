import type {ChatRequest,StageId} from '@/types';
import {supportAcknowledgement} from './supportLevels';
import {targetGradeBand} from './gradeBands';
import {conversationProgress} from './conversationProgress';
import {rubricQuestion} from './rubricCoaching';
const hints:Record<StageId,[string,string]>={
 understand:['先看看题目里要你做什么，以及怎样才算成功。','Look for what the task asks you to do and what counts as success.'],
 imagine:['可以先想一种与题目有关的可能，再和另一种比较。','Think of one possibility related to the task, then compare it with another.'],
 plan:['比较时，有的东西改变，有的东西需要保持一样。','In a comparison, some things change and others stay the same.'],
 build:['先回想你亲手做的一小步，再看实际发生了什么。','Think of one small step you tried and what actually happened.'],
 test:['结果是你真正看到或测到的东西，不是猜出来的。','A result is something you actually saw or measured, not a guess.'],
 improve:['先看你记录的结果，再找一处值得改的地方。','Look at your recorded result, then find one thing worth changing.'],
 reflect:['先回想一次经历，再说它怎样影响了你的想法。','Recall one experience and how it affected your thinking.']
};
const microSteps:Record<StageId,[[string,string],[string,string],[string,string]]>={
 understand:[['找出任务要做的事','Find what the task asks you to do'],['找出怎样才算成功','Find what counts as success'],['选一种检查成功的方法','Choose how to check success']],
 imagine:[['想一个可能的办法或猜想','Think of one possible idea or guess'],['找一个不同点','Find one difference'],['选一个先试','Choose one to try first']],
 plan:[['选一样想改变的东西','Choose one thing to change'],['找一样需要保持相同的条件','Find one condition to keep the same'],['决定观察或测量什么','Decide what to watch or measure']],
 build:[['回想亲手做的一步','Recall one step you tried'],['说出实际看到的情况','Describe what you actually saw'],['选一处安全检查','Choose one safe thing to check']],
 test:[['找一条真实记录','Find one actual recorded result'],['和任务目标比较','Compare it with the task goal'],['决定还要检查什么','Decide what else to check']],
 improve:[['找一条真实观察','Find one actual observation'],['选一处想改的地方','Choose one part to change'],['决定怎样检查变化','Decide how to check the change']],
 reflect:[['回想一次亲手尝试','Recall one thing you tried'],['找出一个变化的想法','Find one idea that changed'],['联系那次经历','Connect it to that experience']]
};
export function youngQuestion(request:ChatRequest,zh:boolean){return rubricQuestion(request,zh);}
export function youngReply(request:ChatRequest,zh:boolean){
 const progress=conversationProgress(request),support=request.intent==='support-change'?supportAcknowledgement(request.level,request.previousLevel,zh)+'\n\n':'';
 if(progress.ready&&!request.continueExploring){return support+(zh?'这一步已经够用了！你已经结合任务标准完成了基本探索。请在提示中选择进入下一阶段，或继续在本阶段想一想。':'You have enough for this step! Your exploration meets the task criteria. Choose the next step in the prompt, or keep thinking in this stage.')+(request.stage==='reflect'?(zh?' 也可以点击完成项目保存探究。':' You can finish the project to save your journey.'):'');}
 if((request.stage==='build'||request.stage==='test')&&progress.notDone)return support+(zh?'先去亲手试一小步，做完回来告诉我真实发生了什么。':'Try one small physical step, then come back and share what actually happened.');
 const missing=progress.assessment.missingCriteria??[];
 const missingPhysical=missing.some(id=>request.task.progressionCriteria?.[request.stage].some(c=>c.id===id&&['ACTUAL_BUILD_ACTION','ACTUAL_TRIAL_1'].includes(c.kind)));
 if(missingPhysical&&(request.stage==='build'||request.stage==='test')&&(progress.futureIntent||progress.prediction)){
  const choice=progress.choiceAnswer.replace(/[。.!！]$/,'');const ack=choice?(zh?`你已经选了“${choice}”。`:`You chose “${choice}”.`):(zh?'你说出了自己的计划或预测。':'You have shared your plan or prediction.');
  const asked=request.history.some(m=>m.role==='assistant'&&/已经亲手试过|实际测到.*还是|actually tried|actually measured.*yet/i.test(m.text));
  return support+ack+' '+(asked?(zh?'等你亲手试过，再回来告诉我真实发生了什么。':'After trying it yourself, come back and share what actually happened.'):(request.stage==='build'?(zh?'你已经亲手试过这一步了吗？':'Have you actually tried that step?'):(zh?'你实际测到了什么，还是还没开始测？':'What have you actually measured, or have you not tested yet?')));
 }
 const question=rubricQuestion(request,zh),baseHint=hints[request.stage][zh?0:1];
 const fact=request.stage==='understand'&&request.level>1?request.task.successCriteria?.[0]:undefined;
 const hint=fact?(zh?`题目写着：“${fact}”。 ${baseHint}`:`The task says: “${fact}”. ${baseHint}`):baseHint;
 const ack=progress.choiceAnswer?(zh?`你已经选了“${progress.choiceAnswer.replace(/[。.!！]$/,'')}”。`:`You chose “${progress.choiceAnswer}”.`):request.message&&progress.latest[1]&&request.stage==='build'?(zh?'你已经说出了看到的结果。':'You have shared what happened.'):request.message&&(progress.latest.some(Boolean)||progress.choiceAnswer)?(zh?'你补充的这一点已经记住了。':'I have noted that part of your thinking.'):(progress.confused?(zh?'换个简单说法，我们先想一小步。':'Let’s say it more simply and take one small step.'):'');
 const hasHistory=request.history.some(m=>m.role==='assistant');
 if(hasHistory)return `${support}${ack} ${request.level===1?hint+' ':''}${question}`.trim();
 if(request.level===1)return `${support}${ack} ${hint} ${question}`.trim();
 if(request.level===2)return `${support}${ack} ${hint}\n\n${zh?'可以先说一小句：“我想到 ___”。':'Try one small sentence: “I think ___”.'} ${question}`.trim();
 return `${support}${ack} ${hint}\n\n${zh?'我们分三小步来：':'Let’s take three small steps:'}\n${microSteps[request.stage].map((s,i)=>`${i+1}. ${s[zh?0:1]}`).join('\n')}\n\n${zh?'现在只想当前的一小点，其他的稍后再说。可以先说：“我想到 ___”。':'Focus on the current small part; we will discuss the rest later. Try a partial thought: I think ___.'} ${zh?'现在只选一个起点：A. 说自己的想法；B. 先解释一个词。':'Choose just one starting point: A. Share your own thought; B. Explain one word.'} ${question}`.trim();
}
export function gradeStagePolicy(request:ChatRequest){return `Target grade band: ${targetGradeBand(request.task)}. For G3–4 say “which condition stays the same”, never require “controlled variable”. G5–6 may gently introduce the term. Use the frozen task-specific stage rubric and minimum meaningful rounds. The threshold is identical across support levels. Gather one missing concept at a time and use concise distinct follow-ups. If concepts are present early, deepen with useful comparison, reason, prediction and summary checks. Do not expose round counts, repeat questions, interrogate or demand correctness/academic words. Actual construction and trial evidence must come from the learner. If physical work is not done, let the learner try and return. Records can contribute evidence but never replace completed dialogue rounds. No quick replies, full designs or invented observations. When STEMPath says READY, acknowledge it and offer the transition; only explore further if continueExploring is true. Never complete/advance stages yourself.`;}
