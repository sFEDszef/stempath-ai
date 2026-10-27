import type {ChatRequest} from '@/types';
import {requestReadiness} from './readiness';
import {coachingObjects} from './concreteCoaching';
import {unresolvedDifficulty} from './evidence';
import {taskRubric} from './rubrics';
import {meaningfulRound} from './progression';

/** These are optional reflection prompts, never scores or progression evidence. */
export function learningCheck(r:ChatRequest,zh:boolean){
 if(r.intent&&r.intent!=='chat'||unresolvedDifficulty(r.message))return;
 if(!meaningfulRound(r.task,r.stage,r.message,r.history.filter(m=>m.role==='assistant').at(-1)?.text))return;
 const a=requestReadiness(r),n=a.meaningfulRounds??0;
 if(a.ready||n===0||n%5!==0)return;
 // Never replace a missing real-world attempt with a reflection prompt.
 if(taskRubric(r.task)[r.stage].some(c=>a.missingCriteria?.includes(c.id)&&['ACTUAL_BUILD_ACTION','ACTUAL_TRIAL_1','ACTUAL_TRIAL_2'].includes(c.kind)))return;
 const object=coachingObjects(r).object[zh?0:1];
 return zh?`先用一句话回顾你对${object}的发现，并给自己现在的把握打1–5分（1是还拿不准，5是能向同学解释）。这是自评，不是考试分数；你会怎样说？`:`Summarize what you have found about ${object} in one sentence and rate your confidence from 1–5 (1 means unsure, 5 means able to explain to a friend). This is your self-rating, not a test mark; what would you say?`;
}
const terms=[
 {match:/瓦楞|corrugat/i,zh:'瓦楞结构',en:'corrugation',definition:'把纸折成一排排波浪或折纹，像纸箱夹层里的起伏纸层；它不等于所有三角形结构',english:'repeated ridges and folds, like the wavy paper layer inside cardboard; it does not mean every triangular structure'},
 {match:/拱形|arch/i,zh:'拱形',en:'arch',definition:'像门洞那样弯起来的形状，受力会传到两边的支撑处；能撑多少还要实际测试',english:'a curved shape that transfers load towards supports on both sides; its load capacity still needs testing'},
 {match:/摩擦|friction/i,zh:'摩擦',en:'friction',definition:'两个表面接触并相对运动时，阻碍运动的作用',english:'a force that opposes relative motion between touching surfaces'},
 {match:/控制变量|公平测试|controlled variable|fair test/i,zh:'公平测试',en:'fair test',definition:'只改变想研究的一个条件，其他会影响结果的条件尽量保持一样',english:'changing the condition you want to investigate while keeping other conditions that affect the result the same'}
];
export function termExplanation(r:ChatRequest,zh:boolean){
 if(!/什么意思|是什么|解释|不懂|没懂|what (?:is|does)|explain|mean|understand/i.test(r.message))return;
 const term=terms.find(t=>t.match.test(r.message));if(!term)return;
 const object=coachingObjects(r).object[zh?0:1];
 return zh?`“${term.zh}”（${term.en}）是指${term.definition}。联系${object}，你会怎样用自己的话解释它？`:`“${term.en}” means ${term.english}. How would you explain it in your own words in relation to ${object}?`;
}
export function learningDialogueInstruction(r:ChatRequest){
 const check=learningCheck(r,false);
 return `Learning dialogue: Begin a new stage with one diagnostic question about the learner's current understanding; never give the full answer first. Use concrete task objects, changed conditions and measured outcomes rather than vague "parts to compare". Introduce at most one relevant, accurate STEM term alongside a plain-language explanation when useful or requested. Never invent a term, confuse corrugation with every triangular structure, or claim an unperformed search/source. Do not require jargon for readiness. When an answer seems mistaken, first invite one observation or check that could reveal the mistake; then explain if the learner remains stuck. Respect the chosen support level and never withhold a requested simple definition. ${check?'This turn is a five-meaningful-round reflection: ask for one short learner summary together with an optional 1–5 confidence self-rating, clearly not a test or mastery score. Do not add another question.':'Do not interrupt every turn with a rating.'} Explicit current confusion takes priority over reflection and READY: rephrase the difficult point and ask one easier diagnostic question. Once sufficient evidence is present and current confusion is resolved, offer progression promptly without filler. At project completion, invite an optional learning journal covering what I learned, what confused me and what I would try next; never write the learner’s journal, require a rating to finish or infer mastery from confidence.`;
}

export function confusionRepair(r:ChatRequest,zh:boolean){
 if(!unresolvedDifficulty(r.message))return;
 const a=requestReadiness(r);
 if(a.missingCriteria?.length)return;
 const o=coachingObjects(r),object=o.object[zh?0:1],measure=o.measure[zh?0:1];
 const questions={
 understand:[`先只看题目第一句：它要你对${object}做什么？`,`Look only at the task’s first sentence: what does it ask you to do with ${object}?`],
 imagine:[`我们先不选最好办法。看看${object}，你最想试着改变哪个地方？`,`We do not need the best idea yet. Looking at ${object}, which part would you like to try changing?`],
 plan:[`先只说第一步：为了研究${object}，你准备先做哪个动作？`,`Just the first step: what action would you do first to investigate ${object}?`],
 build:[`回想你亲手碰过的${object}材料：你刚才实际做了哪个动作？`,`Think of the materials you handled for ${object}: what action did you actually do?`],
 test:[`先不判断好坏：你实际看到或记下的${measure}是什么？`,`No judgement needed yet: what did you actually see or record about ${measure}?`],
 improve:[`先看${object}的测试记录，你实际看到的哪个问题最想再试一试？`,`Look at your test record of ${object}: which problem you actually noticed would you like to try working on?`],
 reflect:[`回想研究${object}的一次尝试：你还记得当时发生了什么吗？`,`Think of one attempt with ${object}: what do you remember happening?`]
 };
 return (zh?'没关系，我们先把问题变小一点。':'That is okay. Let’s make the question smaller. ')+questions[r.stage][zh?0:1];
}
