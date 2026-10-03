import type {ChatRequest,StageId} from '@/types';
import {stageCheckpoints} from './stageCheckpoints';
import {supportAcknowledgement} from './supportLevels';
import {targetGradeBand} from './gradeBands';
import {conversationProgress,repeatsAnsweredQuestion} from './conversationProgress';
import {readinessCopy} from './readiness';
const questions:Record<StageId,[[string,string],[string,string]]>={
 understand:[['这个任务要你做什么？','What does this task ask you to do?'],['做到什么样，就算成功？','What would count as success?']],
 imagine:[['你想到一个什么办法或猜想？','What is one idea or guess you have?'],['你想先试哪一个想法？','Which idea do you want to try?']],
 plan:[['你准备先做什么？','What will you do first?'],['你准备观察或测量什么？','What will you watch or measure?']],
 build:[['你已经做了哪一步？','Which step have you tried?'],['做的时候，你看到什么？','What happened when you tried it?']],
 test:[['你实际测到或看到什么结果？','What did you actually see or measure?'],['这个结果达到任务的目标了吗？','Did this result meet your goal?']],
 improve:[['你觉得哪里值得改一改？','What is one thing worth changing?'],['你准备怎么改这一点？','How will you change that part?']],
 reflect:[['你学会了什么，或改变了什么想法？','What is one thing you learned?'],['哪次发现让你这样想？','What happened that helped you learn this?']]
};
const hints:Record<StageId,[string,string]>={
 understand:['先看看题目里要你做什么，以及怎样才算成功。','Look for what the task asks you to do and what counts as success.'],
 imagine:['可以先想一种与题目有关的可能，再和另一种比较。','Think of one possibility related to the task, then compare it with another.'],
 plan:['比较时，有的东西改变，有的东西需要保持一样。','In a comparison, some things change and others stay the same.'],
 build:['先回想你亲手做的一小步，再看实际发生了什么。','Think of one small step you tried and what actually happened.'],
 test:['结果是你真正看到或测到的东西，不是猜出来的。','A result is something you actually saw or measured, not a guess.'],
 improve:['先看你记录的结果，再找一处值得改的地方。','Look at your recorded result, then find one thing worth changing.'],
 reflect:['先回想一次经历，再说它怎样影响了你的想法。','Recall one experience and how it affected your thinking.']
};
const repairs:Record<StageId,[[string,string],[string,string]]>={
 understand:[['题目里哪个动作词告诉你要做什么？','Which action word in the task tells you what to do?'],['题目里哪一句说了做到什么样才算成功？','Which sentence says what would count as success?']],
 imagine:[['你能说出一个想试的想法吗？','What is one idea you would like to try?'],['你想先选自己记录的哪一个想法？','Which of your recorded ideas would you choose first?']],
 plan:[['你准备先做哪一小步？','What small step would you try first?'],['你想记录自己看到的什么？','What would you like to record seeing?']],
 build:[['你亲手试过哪一小步？','What small step did you try yourself?'],['做完那一步，你看到了什么？','What did you see after that step?']],
 test:[['你真的看到或测到了什么？','What did you actually see or measure?'],['你想先把结果和题目的哪一句比一比？','Which sentence in the task would you compare your result with?']],
 improve:[['你的记录里，哪一点值得再看看？','Which part of your notes is worth another look?'],['你想先改自己提到的哪一点？','Which part you mentioned would you change first?']],
 reflect:[['你能想起一次亲手尝试吗？','What is one thing you tried yourself?'],['那次尝试让你的哪个想法变了？','Which of your ideas changed after that experience?']]
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
function focusIndex(request:ChatRequest){return conversationProgress(request).target;}
export function youngQuestion(request:ChatRequest,zh:boolean){const index=focusIndex(request);return index===2?(zh?'如果还想多想一点，你想再检查哪一点？':'If you want to explore more, what would you check next?'):questions[request.stage][index][zh?0:1];}
export function youngReply(request:ChatRequest,zh:boolean){
 const i=zh?0:1,progress=conversationProgress(request),index=progress.target===2?1:progress.target;
 const core=stageCheckpoints(request.task,request.stage).filter(c=>c.core),first=core[index];
 const previous=request.history.filter(m=>m.role==='assistant').slice(-3);
 const support=request.intent==='support-change'?supportAcknowledgement(request.level,request.previousLevel,zh)+'\n\n':'';
 const acknowledgement=progress.latest[0]?readinessCopy[request.stage][i]:progress.latest[1]?
  (zh?'你已经说出了'+(request.stage==='build'?'看到的结果。':'这一点。'):'You have shared '+(request.stage==='build'?'what happened.':'that part.')):'';
 // Readiness is deliberately one contribution, not completion of both conversation slots.
 if(progress.ready&&!request.stageReady){
  const choices=zh?['你想怎样继续？','你想进入下一阶段，还是留下再想一想？','你想现在继续，还是多探索一点？','你想选择哪种继续方式？']:['How would you like to continue?','Would you like to move on or stay to think more?','Would you like to continue now or explore more?','Which way would you like to continue?'];
  const question=choices.find(q=>!previous.some(m=>m.text.includes(q)))??choices[request.history.length%choices.length];
  const transition=request.stage==='reflect'?(zh?' 这一步已经够用了！你可以选择完成项目，或留在这里多想一点。':' You have enough for this step! You can finish the project or stay to explore more. '):(zh?' 这一步已经够用了！你可以选择进入下一阶段，或留在这里多想一点。':' You have enough for this step! You can move on or stay to explore more. ');
  return support+acknowledgement+transition+question;
 }
 const optional=progress.ready||request.stageReady;
 const prefix=optional?(zh?'如果你还想多想一点，':'If you want to explore a little more, '):'';
 const repair=progress.confused?(zh?'换个简单说法，我们只想一小步。':'Let’s say it more simply and take one small step.')+' ':'';
 let question=progress.confused?repairs[request.stage][index][i]:youngQuestion(request,zh);
 if(optional&&request.stage==='imagine'&&progress.target===1)question=zh?'你觉得还有什么不同的办法？':'What other different idea could you compare?';
 const clue=progress.target===1?(zh?'可以看看这一点和刚才的回答有什么联系。':'You can connect this part with what you just shared.'):hints[request.stage][i];
 const criterion=request.stage==='understand'&&request.level>1&&progress.target===0?request.task.successCriteria?.[0]:undefined;
 const fact=criterion?(zh?`题目写着：“${criterion.slice(0,120)}”。`:`The task says: “${criterion.slice(0,120)}”.`):clue;
 const frame=`${zh?'可以先填一小句：':'Try one small sentence: '}${zh?first.zh:first.en} ___${zh?'。':'.'}`;
 const usedFrame=previous.some(m=>m.text.includes(zh?first.zh:first.en));
 const lead=[support.trim(),acknowledgement,repair.trim(),prefix+fact].filter(Boolean).join(' ');
 let text=request.level===1?`${lead} ${question}`:request.level===2?
  `${lead}\n\n${usedFrame?(zh?'可以选：A. 用自己的话说一点；B. 先解释卡住的词。':'Choose: A. Share a small part in your own words; B. Explain an unclear word.'):frame} ${question}`:
  `${lead}\n\n${previous.length===0&&progress.target===0?`${zh?'我们分三小步来：':'Let’s take three small steps:'}\n${microSteps[request.stage].map((step,n)=>`${n+1}. ${step[i]}`).join('\n')}\n\n`:''}${zh?'现在只做当前这一小步，后面的先不用填。':'Work on just the current small step; leave the others for later.'} ${usedFrame?'':frame}\nA. ${microSteps[request.stage][progress.target][i]}${zh?'；B. 先解释卡住的词；C. 用自己的起点。':' ; B. Explain a word you are stuck on; C. Use your own starting point.'}\n${progress.confused?(zh?'现在只选一个起点：你想先选 A、B，还是 C？':'Choose just one starting point: would you start with A, B, or C?'):question}`;
 // A repeated scaffold/question must change even on confusion. Use the next unused simple wording.
 if(repeatsAnsweredQuestion(text,request)){
  const alternatives=progress.confused?
   (zh?['你想先弄懂题目里的哪个词？','你卡在哪一小处？','你能指一指不明白的那句话吗？','你想让我把哪一点说得更简单？']:['Which word would you like explained?','Which small part feels confusing?','Which sentence feels unclear?','Which part should I make simpler?']):
   progress.target===2?(zh?['如果再做一次，你想检查哪一点？','你还想探索自己的哪个想法？','你想怎样继续探索？']:['If you tried again, what would you check?','Which of your ideas would you like to explore more?','How would you like to explore further?']):
   (zh?[repairs[request.stage][index][0],'接着这一点，你想说哪一小句？','你还想补充自己的哪一点？','你想怎样继续探索？']: [repairs[request.stage][index][1],'What small part would you add next?','What else would you like to share?','How would you like to explore further?']);
  question=alternatives.find(q=>!previous.some(m=>m.text.includes(q)))??alternatives[0];
  text=`${support}${acknowledgement} ${repair}${optional?prefix:''}${request.level===1?clue:request.level===2?(zh?'可以选：A. 用自己的话说一点；B. 先说卡住的词。':'Choose: A. Share a small part in your own words; B. Name an unclear word.'):(zh?'A. 只看当前这一小步；B. 解释一个词；C. 用自己的起点。':'A. Look at only the current small step; B. Explain a word; C. Use your own starting point.')} ${question}`;
 }
 return text.trim();
}
export function gradeStagePolicy(request:ChatRequest){const band=targetGradeBand(request.task);return `Target grade band: ${band}. Optional learner record prompts: ${stageCheckpoints(request.task,request.stage,request.research?.condition!=='NO_AI').filter(c=>c.core).map(c=>c.en).join('; ')}. Encourage ONE small contribution at a time. Records are notes, not progression gates; one minimum stage-relevant contribution is enough to continue. Use the selected support level: Level 1 adds a clue and simpler question; Level 2 adds a partial frame or limited choice; Level 3 briefly explains, decomposes into 2–3 micro-steps and asks ONLY the first small decision, then continues after the child answers. Do not present a long worksheet. Do not require every optional field or fill all checkpoints. Help notice supplied successCriteria without designing the solution. Never ask the same substantive question after a relevant answer. Use cumulative current-stage chat evidence even when records are blank. After confusion change and simplify the wording. After a completed micro-step continue with the next missing part, never restart the scaffold. When minimum evidence is reached acknowledge readiness without a mandatory second checkpoint; after the learner stays, further exploration is optional. A brief purpose cue may explain why a question matters. Use current-task objects only; never import an example from another task. No AI-literacy reflection in NO_AI.`;}
