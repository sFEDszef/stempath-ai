import type {ChatRequest,CriterionKind} from '@/types';
import {requestReadiness} from './readiness';
import {taskRubric} from './rubrics';
const cues:Record<CriterionKind,[string,string]>={TASK_GOAL:['用自己的话说说，这个任务要你做什么？','In your own words, what does this task ask you to do?'],SUCCESS_CRITERION:['做到什么样才算达到题目的目标？','What would count as meeting the goal in the task?'],ONE_CONSTRAINT_OR_RESOURCE:['这次有哪些能用的材料，或需要记住的条件？','What resource or condition matters for this task?'],AT_LEAST_TWO_IDEAS:['除了刚才的想法，你能再找一个不同的可能吗？','What is a different possibility you could compare with your first idea?'],CHOSEN_DIRECTION:['比较这些想法后，你想先试哪一个？','After comparing your ideas, which would you try first?'],SIMPLE_REASON:['你为什么想先试这个方向？','Why would you try that direction first?'],CHANGE_FACTOR:['这次比较中，你准备改变哪一样东西？','Which thing will you change in your comparison?'],AT_LEAST_ONE_CONTROLLED_CONDITION:['哪一样东西每次尽量保持一样？','Which condition will you try to keep the same each time?'],MEASUREMENT:['你准备测什么或观察什么，来看结果？','What will you measure or observe to check the result?'],SIMPLE_PROCEDURE:['你会先做什么，然后做什么来检查？','What will you do first, and then do to check?'],ACTUAL_BUILD_ACTION:['你已经亲手做了哪一步？','Which step have you actually done yourself?'],SECOND_ACTUAL_ACTION_OR_DETAIL:['刚才那一步，你具体怎样把它做出来的？','How did you physically carry out that step?'],BUILD_OBSERVATION_OR_PROBLEM:['动手的时候，你实际看到什么情况或问题？','What did you actually notice or find difficult while working?'],ACTUAL_TRIAL_1:['第一次实际尝试，你测到或看到什么？','What did you actually measure or observe on your first trial?'],ACTUAL_TRIAL_2:['再做一次实际尝试后，第二次测到或看到什么？','What did you actually measure or observe on your second trial?'],COMPARE_WITH_GOAL:['把真实结果和题目目标比一比，现在达到了吗？','Comparing your actual results with the task goal, have you reached it?'],IDENTIFY_REVISION:['你想具体改哪一个地方？','Which specific part would you revise?'],HOW_TO_REVISE:['你准备怎样做这个修改？','How will you make that revision?'],LINK_TO_TEST_EVIDENCE:['测试中看到的哪一点，让你想这样改？','Which test observation led you to that revision?'],ONE_TAKEAWAY:['这次你学到了具体的哪一点？','What is one specific thing you learned?'],EVIDENCE_OR_EXPERIENCE_CONNECTION:['哪次真实结果或经历影响了你的想法？','Which actual result or experience affected your thinking?'],ONE_CHANGE_IN_THINKING_OR_NEXT_TIME:['你的想法怎样变了，或者下次想怎样做？','How has your thinking changed, or what would you do differently next time?']};
export function rubricQuestion(request:ChatRequest,zh:boolean){
 const a=requestReadiness(request),criteria=taskRubric(request.task)[request.stage],missing=criteria.find(c=>a.missingCriteria?.includes(c.id));
 if(request.continueExploring&&a.ready)return zh?'如果继续探索，你想检验自己还不确定的哪一点？':'Which remaining uncertainty would you like to explore?';
 const round=a.meaningfulRounds??0;

 const deepening=zh?['用一个小例子，说说你怎样检查自己的想法？','如果结果和你猜的不同，你会怎样判断？','你觉得刚才哪一点最重要，为什么？','把刚才的想法连起来，你会怎样说给同学听？','你想怎样检查刚才的理解？']:['What small example would help you check your idea?','If the result differs from your prediction, how would you judge it?','Which part matters most, and why?','How would you connect your ideas to explain them to a classmate?','How would you check your understanding?'];
 let q=missing?cues[missing.kind][zh?0:1]:deepening[Math.max(0,round-1)%deepening.length];
 if(/不知道|不懂|don['’]?t.*(?:know|understand)|not sure|不确定/i.test(request.message)&&missing?.kind==='TASK_GOAL')q=zh?'题目里哪个动作词告诉你要做什么？':'Which action word in the task tells you what to do?';
 const recent=request.history.filter(m=>m.role==='assistant').slice(-5).map(m=>m.text);
 if(recent.some(t=>t.includes(q))){
  const alternatives=missing?.kind==='ACTUAL_TRIAL_2'
   ?zh?['目前说清楚的是第一次结果。等你实际再试一次，告诉我第二次测到或看到什么。','第二次真实尝试的结果还没有记下来。你可以先去试，回来再说第二次的观察。','重复第一次的结果不能代替另一次尝试。实际完成第二次后，你测到或看到什么？']
      :['We have the first result. After you actually try again, tell me what you measured or observed on the second trial.','The second real trial is not recorded yet. You can try it first, then return with your second observation.','Repeating the first result is not another trial. After completing a second real trial, what did you measure or observe?']
   :missing
    ?zh?[`先补上这一小点：${q}`,`我们仍需要这个实际信息：${q}`,`换个角度继续想这一个问题：${q}`]
       :[`Let’s add this missing part: ${q}`,`We still need this information: ${q}`,`Let’s approach this one question again: ${q}`]
    :deepening.filter(x=>x!==q);
  q=alternatives.find(x=>!recent.some(t=>t.includes(x)))??q;
 }
 return q;
}
