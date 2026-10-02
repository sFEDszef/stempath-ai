import type {ChatRequest,StageId} from '@/types';
import {stageCheckpoints,hasCheckpointText} from './stageCheckpoints';
import {targetGradeBand} from './gradeBands';
const cues:Record<StageId,[string,string]>={understand:['先看清要做什么，后面才好试。','Knowing our goal helps us decide what to test.'],imagine:['先说自己的想法，再选一个试试。','Start with your own idea.'],plan:['先想一小步，就更容易开始。','A small first step makes it easier to begin.'],build:['说说你亲手做过的事。','Tell me about something you tried.'],test:['把看到的结果记下来，才好比较。','Recording what happened helps us compare.'],improve:['每次改一点，就容易看出区别。','A small change is easier to check.'],reflect:['回头看看，你的想法可能变了。','Look back at how your thinking changed.']};
const questions:Record<StageId,[[string,string],[string,string]]>={
 understand:[['这个任务要你做什么？','What does this task ask you to do?'],['做到什么样，就算成功？','What would count as success?']],
 imagine:[['你想到一个什么办法或猜想？','What is one idea or guess you have?'],['你想先试哪一个想法？','Which idea do you want to try?']],
 plan:[['你准备先做什么？','What will you do first?'],['你准备观察或测量什么？','What will you watch or measure?']],
 build:[['你已经做了哪一步？','Which step have you tried?'],['做的时候，你看到什么？','What happened when you tried it?']],
 test:[['你实际测到或看到什么结果？','What did you actually see or measure?'],['这个结果达到任务的目标了吗？','Did this result meet your goal?']],
 improve:[['你觉得哪里值得改一改？','What is one thing worth changing?'],['你准备怎么改这一点？','How will you change that part?']],
 reflect:[['你学会了什么，或改变了什么想法？','What is one thing you learned?'],['哪次发现让你这样想？','What happened that helped you learn this?']]
};
export function youngQuestion(request:ChatRequest,zh:boolean){const core=stageCheckpoints(request.task,request.stage).filter(c=>c.core);let index=core.findIndex(c=>!hasCheckpointText(request.artifacts[request.stage]?.[c.field]??''));if(index===-1)return zh?'你想再检查自己记录的哪一点？':'Which part of your notes would you like to check?';if(index===0&&[...request.history,{role:'student',text:request.message}].some(m=>m.text.trim()&&m.role==='student'&&!/不知道|不懂|not sure|don['’]?t know/i.test(m.text))&&!/不知道|不懂|什么意思|没懂|not sure|don['’]?t know/i.test(request.message))index=1;return questions[request.stage][index===1?1:0][zh?0:1];}
export function youngReply(request:ChatRequest,zh:boolean){const i=zh?0:1;const confused=/不知道|什么意思|没懂|不懂|太难|don['’]?t understand|what does .*mean|no idea|not sure/i.test(request.message);
 const question=youngQuestion(request,zh);const cue=confused?(zh?'换个简单说法，我们只想一小步。':'Let’s say it more simply and take one small step.'):cues[request.stage][i];
 if(request.intent==='evaluate-claim')return zh?'AI也可能说错。你准备怎样亲自检查这个说法？':'AI can be wrong. How could you check this claim yourself?';
 const ack=request.intent==='support-change'?(request.level===1?(zh?'接下来只用问题，陪你想一步。':'I’ll use one question to guide you.'):request.previousLevel===3&&request.level===2?(zh?'我会少给一点结构。':'I’ll give less structure.'):zh?'我们把问题缩小一点。':'Let’s try smaller steps.')+' ':'';
 if(request.level===1)return `${ack}${cue} ${question}`;
 const criterion=request.stage==='understand'?request.task.successCriteria?.[0]:undefined;
 const hint=criterion?(zh?`题目里写着：“${criterion.slice(0,160)}”。`:`The task says: “${criterion.slice(0,160)}”.`):cues[request.stage][i];
 if(request.level===2)return `${ack}${confused?cue+' ':''}${hint} ${question}`;
 const first=stageCheckpoints(request.task,request.stage).find(c=>c.core)!;
 return `${ack}${hint} ${confused?cue+' ':''}${zh?'可以先填一小句：':'Try one small sentence: '}${zh?first.zh:first.en} ___${zh?'。':'.'} ${question}`;
}
export function gradeStagePolicy(request:ChatRequest){const band=targetGradeBand(request.task);return `Target grade band: ${band}. Current checkpoint goals: ${stageCheckpoints(request.task,request.stage,request.research?.condition!=='NO_AI').filter(c=>c.core).map(c=>c.en).join('; ')}. Work on ONE missing checkpoint at a time. Do not require every optional worksheet field. Help the child notice supplied successCriteria without designing the solution. Confusion repair: if the learner says they do not understand, first rephrase the concept in simpler concrete language, then ask ONE easier question; never just repeat it. A brief purpose cue may explain why the question matters. Use current-task objects only; never import an example from another task. No AI-literacy reflection in NO_AI.`;}
