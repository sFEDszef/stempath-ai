import type {ChatRequest,StageId} from '@/types';
import {supportAcknowledgement} from './supportLevels';
import {targetGradeBand} from './gradeBands';
import {conversationProgress} from './conversationProgress';
import {rubricQuestion} from './rubricCoaching';
import {coachingObjects,concreteAcknowledgement} from './concreteCoaching';
import {taskRubric} from './rubrics';
function concreteHint(request:ChatRequest,zh:boolean){
 const o=coachingObjects(request),i=zh?0:1,object=o.object[i],measure=o.measure[i];
 const hints:Record<StageId,[string,string]>={
 understand:[`先看题目要你对${object}做什么，以及写了什么要求。`,`Look at what the task asks you to do with ${object} and the requirement it gives.`],
 imagine:[`先想${object}上有什么地方可以比较。`,`Think of a part you could compare in ${object}.`],
 plan:[`比较${measure}时，有些东西改变，有些东西要保持一样。`,`When comparing ${measure}, some things change and others stay the same.`],
 build:[`先回想你亲手为${object}做的动作。`,`Recall the work you actually did on ${object}.`],
 test:[`我们要看你实际记下的${measure}，不是猜测。`,`Use ${measure} you actually recorded, rather than a guess.`],
 improve:[`先看${object}的真实记录，再选一个想改的地方。`,`Look at your actual records of ${object}, then choose one part to change.`],
 reflect:[`先回想你制作或观察${object}的一次经历。`,`Recall one experience making or observing ${object}.`]
 };return hints[request.stage][i];
}
function concreteSteps(request:ChatRequest,zh:boolean){
 const o=coachingObjects(request),i=zh?0:1,object=o.object[i],measure=o.measure[i];
 const steps:Record<StageId,[string,string,string]>={
 understand:zh?[`看题目要你对${object}做什么`,`找出${object}要达到的要求`,`找出${object}能用的材料或限制`]:[`Find what the task asks about ${object}`,`Find the requirement for ${object}`,`Find a material or rule for ${object}`],
 imagine:zh?[`想一个${object}上可以比较的地方`,`再想一个不同的地方`,`选择自己想先试的想法`]:[`Think of one part of ${object} to compare`,`Think of a different part`,`Choose the idea you want to try first`],
 plan:zh?[`选${object}要改变的东西`,`找一个每次保持一样的条件`,`决定怎样记录${measure}`]:[`Choose what to change in ${object}`,`Find one condition to keep the same`,`Decide how to record ${measure}`],
 build:zh?[`回想你为${object}亲手做的动作`,`说出动手时实际看到的情况`,`找一个安全检查的地方`]:[`Recall your actual work on ${object}`,`Describe what you actually saw while working`,`Find one safe thing to check`],
 test:zh?[`找出一次真实的${measure}记录`,`找出另一次真实记录`,`对照题目要求看是否达到`]:[`Find one actual record of ${measure}`,`Find another actual record`,`Compare with the task requirement`],
 improve:zh?[`看${object}的一条真实观察`,`选${object}想改的地方`,`决定怎样检查修改后的变化`]:[`Look at one actual observation of ${object}`,`Choose a part of ${object} to change`,`Decide how to check the change`],
 reflect:zh?[`回想亲手研究${object}的经历`,`说出对${object}的新发现`,`联系帮你得到发现的那次经历`]:[`Recall investigating ${object} yourself`,`Describe your discovery about ${object}`,`Connect it to the experience that helped you learn`]
 };return steps[request.stage];
}
export function youngQuestion(request:ChatRequest,zh:boolean){return rubricQuestion(request,zh);}
export function youngReply(request:ChatRequest,zh:boolean){
 const object=coachingObjects(request).object[zh?0:1];
 const progress=conversationProgress(request),support=request.intent==='support-change'?supportAcknowledgement(request.level,request.previousLevel,zh)+'\n\n':'';
 if(progress.ready&&!request.continueExploring){return support+(zh?'这一步已经够用了！你已经结合任务标准完成了基本探索。请在提示中选择进入下一阶段，或继续在本阶段想一想。':'You have enough for this step! Your exploration meets the task criteria. Choose the next step in the prompt, or keep thinking in this stage.')+(request.stage==='reflect'?(zh?' 也可以点击完成项目保存探究。':' You can finish the project to save your journey.'):'');}
 if((request.stage==='build'||request.stage==='test')&&progress.notDone)return support+(zh?`先亲手试${object}，做完回来告诉我你实际看到或测到了什么。`:`Try ${object} yourself, then come back and share what you actually saw or measured.`);
 const missing=progress.assessment.missingCriteria??[];
 const missingPhysical=missing.some(id=>request.task.progressionCriteria?.[request.stage].some(c=>c.id===id&&['ACTUAL_BUILD_ACTION','ACTUAL_TRIAL_1'].includes(c.kind)));
 if(missingPhysical&&(request.stage==='build'||request.stage==='test')&&(progress.futureIntent||progress.prediction)){
  const ack=concreteAcknowledgement(request,zh);
  const asked=request.history.some(m=>m.role==='assistant'&&/已经亲手|实际测到|实际测试|实际.*多少|actually tried|actually measured|actually tested/i.test(m.text));
  return support+ack+' '+(asked?(zh?`等你亲手试过${object}，再回来告诉我实际看到了什么。`:`After trying ${object} yourself, come back and share what you actually saw.`):(request.stage==='build'?(zh?`你已经亲手试过对${object}做这个动作了吗？`:`Have you actually done that work on ${object}?`):(zh?`你已经实际测试或观察过${object}了吗？`:`Have you actually tested or observed ${object} yet?`)));

 }
 const question=rubricQuestion(request,zh),baseHint=concreteHint(request,zh);
 const fact=request.stage==='understand'&&request.level>1?(zh?request.task.translations?.['zh-CN']?.successCriteria?.[0]??request.task.successCriteria?.[0]:request.task.successCriteria?.[0]):undefined;
 const hint=fact?(zh?`题目写着：“${fact}”。 ${baseHint}`:`The task says: “${fact}”. ${baseHint}`):baseHint;
 const ack=progress.confused?(zh?`换个简单说法，我们先看看${object}。`:`Let’s put it simply and look at ${object}.`):concreteAcknowledgement(request,zh);
 const hasHistory=request.history.some(m=>m.role==='assistant');
 if(hasHistory)return `${support}${ack} ${request.level===1?hint+' ':''}${question}`.trim();
 if(request.level===1)return `${support}${ack} ${hint} ${question}`.trim();
 if(request.level===2)return `${support}${ack} ${hint}\n\n${zh?`可以先填一小句：“关于${object}，我想 ___”。`:`Try a partial sentence: “About ${object}, I think ___”.`} ${question}`.trim();
 return `${support}${ack} ${hint}\n\n${zh?'我们分三小步来：':'Let’s take three small steps:'}\n${concreteSteps(request,zh).map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n${zh?`现在只回答${object}的第一个小问题，其他的稍后再说。`:`Answer only the first small question about ${object}; we will discuss the rest later.`} ${question}`.trim();
}
export function gradeStagePolicy(request:ChatRequest){const o=coachingObjects(request),context=['engineering','inquiry'].includes(taskRubric(request.task).profile)?'Use the objects, actions and measurements supplied in the current task.':`Use concrete nouns for the current task: ${o.object[1]}, ${o.measure[1]}, ${o.parts[1]}.`;return `Target grade band: ${targetGradeBand(request.task)}. For G3–4 say “which condition stays the same”, never require “controlled variable”. G5–6 may gently introduce the term. Resolve every vague reference with the actual task object, learner-mentioned part, action or measurement. ${context} Acknowledge what the learner actually said, never “I have noted that point”. Never invent measurements, prior choices or physical activity. Only use numbers supplied by the task or learner; label any necessary hypothetical clearly. G3–4 use one concrete question; G5–6 explain plain language before an optional technical term. Level 1 never supplies a list of design answers; higher support may offer a short task-grounded frame or selective micro-steps without choosing for the learner. Use the frozen task-specific stage rubric and minimum meaningful rounds. The threshold is identical across support levels. Gather one missing concept at a time and use concise distinct follow-ups. If concepts are present early, deepen with useful comparison, reason, prediction and summary checks. Do not expose round counts, repeat questions, interrogate or demand correctness/academic words. Actual construction and trial evidence must come from the learner. If physical work is not done, let the learner try and return. Records can contribute evidence but never replace completed dialogue rounds. No quick replies, full designs or invented observations. When STEMPath says READY, acknowledge it and offer the transition; only explore further if continueExploring is true. Never complete/advance stages yourself.`;}
