import type {ChatRequest,CriterionKind,StageId} from '@/types';
import {taskRubric} from './rubrics';
type Words=[string,string];
interface Objects {object:Words;measure:Words;comparison:Words;resources:Words;parts:Words;}
const objects:Record<string,Objects>={
 'wind-car':{object:['风力小车','wind-powered car'],measure:['小车行驶的距离','the distance the car travels'],comparison:['两次小车测试','two car tests'],resources:['小车能用的材料和推动小车的风','the materials and wind available for the car'],parts:['风挡、轮子和车身','the sail, wheels and car body']},
 bridge:{object:['纸桥','paper bridge'],measure:['桥承受的重量和坚持的时间','the load the bridge holds and how long it holds it'],comparison:['两次桥的承重测试','two bridge load tests'],resources:['搭桥的纸、胶带和安全承重要求','the paper, tape and safe loading rules for the bridge'],parts:['桥面、支撑和纸的折法','the deck, supports and paper folds']},
 filtration:{object:['过滤装置','water filter'],measure:['过滤前后水里的颗粒和清澈程度','the visible particles and clarity before and after filtering'],comparison:['两次过滤前后的观察','two before-and-after filtration observations'],resources:['过滤材料和不能饮用过滤水的要求','the filter materials and the rule never to drink filtered water'],parts:['过滤材料、层数和摆放顺序','the filter materials, layers and their order']},
 insulation:{object:['温水保温实验','warm-water insulation investigation'],measure:['相同时间后水的温度','the water temperature after the same amount of time'],comparison:['两次温水保温比较','two warm-water insulation comparisons'],resources:['保温材料和安全使用温水的要求','the insulation materials and safe warm-water rules'],parts:['保温材料、厚度和包裹位置','the insulation material, thickness and where it wraps the cup']},
 plants:{object:['光照与幼苗生长探究','light and seedling investigation'],measure:['幼苗的高度和测量日期','the seedling height and measurement date'],comparison:['两次幼苗生长观察','two seedling growth observations'],resources:['幼苗、水、土和能得到的光照','the seedlings, water, soil and available light'],parts:['光照时间、位置和幼苗的生长','the light duration, light position and seedling growth']}
};
export function coachingObjects(request:Pick<ChatRequest,'task'>):Objects {
 const known=objects[taskRubric(request.task).profile];
 if(known)return known;
 const title=request.task.title;
 return {object:[`“${title}”项目`,`the “${title}” project`],measure:[`“${title}”题目要求观察或测量的内容`,`what the “${title}” task asks you to observe or measure`],comparison:[`“${title}”的两次尝试`,`two attempts in “${title}”`],resources:[`“${title}”题目提供的材料和要求`,`the materials and rules supplied in “${title}”`],parts:[`“${title}”题目中可以比较的东西`,`things you can compare in the “${title}” task`]};
}
export function concreteQuestion(request:ChatRequest,kind:CriterionKind,zh:boolean):string {
 const o=coachingObjects(request),i=zh?0:1,object=o.object[i],measure=o.measure[i],comparison=o.comparison[i];
 const bank:Record<CriterionKind,Words>={
  TASK_GOAL:[`题目要你制作或研究${object}的什么？`,`What does the task ask you to make or investigate about ${object}?`],
  SUCCESS_CRITERION:[`${object}做到什么样，才符合题目写的要求？`,`What must ${object} do to meet the requirement written in the task?`],
  ONE_CONSTRAINT_OR_RESOURCE:[`做${object}时，题目提供了哪些材料或写了哪条要求？`,`Which material or rule does the task give you for ${object}?`],
  AT_LEAST_TWO_IDEAS:[`除了刚才说的想法，${object}还有什么不同的地方值得比较？`,`What different part of ${object} could you compare besides your first idea?`],
  CHOSEN_DIRECTION:[`你刚才说的几种${object}想法中，你想先试哪一种？`,`Which of your ideas about ${object} would you try first?`],
  SIMPLE_REASON:[`你为什么想先试刚才选的${object}想法？`,`Why would you first try the idea you chose for ${object}?`],
  CHANGE_FACTOR:[`比较${object}时，你准备只改变哪一样东西？`,`Which one thing will you change when comparing ${object}?`],
  AT_LEAST_ONE_CONTROLLED_CONDITION:[`为了比较${measure}，${comparison}里哪一样东西要保持一样？`,`To compare ${measure}, which condition should stay the same across ${comparison}?`],
  MEASUREMENT:[`你准备观察或测量${object}的什么，来检查有没有达到题目要求？`,`What will you observe or measure about ${object} to check the task requirement?`],
  SIMPLE_PROCEDURE:[`为了记录${measure}，你准备先做什么？`,`What will you do first to record ${measure}?`],
  ACTUAL_BUILD_ACTION:[`你刚才实际为${object}做了什么？`,`What have you actually done to prepare or make ${object}?`],
  SECOND_ACTUAL_ACTION_OR_DETAIL:[`你刚才对${object}做的动作，具体是怎样完成的？`,`How did you physically carry out the action you described for ${object}?`],
  BUILD_OBSERVATION_OR_PROBLEM:[`亲手做${object}时，你实际看到了什么变化或问题？`,`What change or problem did you actually notice while working on ${object}?`],
  ACTUAL_TRIAL_1:[`第一次实际尝试${object}时，你记录了什么？`,`What did you record in your first actual trial of ${object}?`],
  ACTUAL_TRIAL_2:[`第二次实际尝试${object}时，你测到或看到了什么？`,`What did you actually measure or observe in your second trial of ${object}?`],
  COMPARE_WITH_GOAL:[`把你记录的${measure}与题目要求比，现在达到了吗？`,`Looking at ${measure} you recorded, does ${object} meet the task requirement?`],
  IDENTIFY_REVISION:[`看过${comparison}的记录后，你最想先改${object}的哪个地方？`,`After looking at your records from ${comparison}, which part of ${object} would you revise first?`],
  HOW_TO_REVISE:[`你准备怎样改刚才选的${object}部分？`,`How will you change the part you chose in ${object}?`],
  LINK_TO_TEST_EVIDENCE:[`你哪条${object}测试或观察记录，让你想这样改？`,`Which test or observation record about ${object} made you want that change?`],
  ONE_TAKEAWAY:[`亲手研究${object}后，你对${measure}有了什么新发现？`,`After investigating ${object}, what did you discover about ${measure}?`],
  EVIDENCE_OR_EXPERIENCE_CONNECTION:[`你哪次制作或观察${object}的经历，帮你得到了刚才说的发现？`,`Which experience making or observing ${object} helped you make the discovery you described?`],
  ONE_CHANGE_IN_THINKING_OR_NEXT_TIME:[`如果再做${object}，你最想先改哪一个做法？`,`If you worked on ${object} again, which action would you change first?`]
 };
 const profile=taskRubric(request.task).profile;
 const specific:Partial<Record<string,Partial<Record<CriterionKind,Words>>>>={
  'wind-car':{
   TASK_GOAL:['用自己的话说说，你要做一辆靠什么往前走的小车？','In your own words, what will push the car you are making forwards?'],
   SUCCESS_CRITERION:['这辆风力小车至少要跑多远，才符合题目写的距离要求？','How far must the wind-powered car travel to meet the distance requirement in the task?'],
   AT_LEAST_TWO_IDEAS:['除了刚才提到的小车部分，还有哪个地方可能影响小车跑多远？','Besides the car part you mentioned, what other part might affect how far the car travels?'],
   MEASUREMENT:['每次测试小车时，你准备量从起点到停下来的什么？','What will you measure from the car’s starting point to where it stops?'],
   ACTUAL_TRIAL_1:['第一次测试时，小车实际跑了多少米？','How many metres did the car actually travel on the first test?'],
   ACTUAL_TRIAL_2:['第二次实际测试时，小车跑了多少米？','How many metres did the car actually travel on the second test?']},
  bridge:{ACTUAL_TRIAL_1:['第一次把重量放上纸桥后，桥实际撑住了多少重量或多久？','How much weight or how long did the paper bridge actually hold in your first load test?'],ACTUAL_TRIAL_2:['第二次实际承重测试中，纸桥撑住了多少重量或多久？','How much weight or how long did the paper bridge actually hold in your second load test?']},
  filtration:{ACTUAL_TRIAL_1:['第一次实际过滤后，水里的颗粒或清澈程度有什么变化？','After your first actual filtration, what changed in the visible particles or water clarity?'],ACTUAL_TRIAL_2:['第二次实际过滤后，水里的颗粒或清澈程度有什么变化？','After your second actual filtration, what changed in the visible particles or water clarity?']},
  insulation:{ACTUAL_TRIAL_1:['第一次保温比较中，过了相同时间的温水实际是多少度？','In your first insulation comparison, what temperatures did you actually measure after the same time?'],ACTUAL_TRIAL_2:['第二次实际比较时，过了相同时间的温水是多少度？','In your second actual comparison, what temperatures did you measure after the same time?']},
  plants:{ACTUAL_TRIAL_1:['第一次观察时，你实际量到幼苗多高？','How tall did you actually measure the seedling on your first observation?'],ACTUAL_TRIAL_2:['另一次实际观察时，你量到幼苗多高？','How tall did you measure the seedling on another actual observation?']}
 };
 let question=(specific[profile]?.[kind]??bank[kind])[i];
 if(profile==='wind-car'&&kind==='COMPARE_WITH_GOAL'){
  const goal=zh?request.task.translations?.['zh-CN']?.successCriteria?.[0]??request.task.successCriteria?.[0]:request.task.successCriteria?.[0];
  if(goal)question=zh?`和题目写的“${goal}”相比，小车这次实际跑的距离达到了吗？`:`Compared with the task requirement “${goal}”, did the car’s actual travel distance meet it?`;
 }
 const learners=[...request.history.filter(m=>m.role==='student').map(m=>m.text),(!request.intent||request.intent==='chat')?request.message:''].filter(Boolean);
 if(kind==='AT_LEAST_TWO_IDEAS'&&!learners.length)question=zh?`先想一个可以比较的地方：你会先从${object}的什么开始想？`:`Which part of ${object} would you first think about comparing?`;
 if(profile==='wind-car'){
  const part=[...learners].reverse().join(' ').match(/风挡|帆|轮子|车轮|车身|sail|windshield|wheels?|car body/i)?.[0];
  if(part&&kind==='AT_LEAST_TWO_IDEAS')question=zh?`你提到了小车的“${part}”。除了${part}，小车上还有哪个地方可能影响行驶距离？`:`You mentioned the car’s “${part}”. Besides ${part}, what other car part might affect travel distance?`;
  if(part&&kind==='HOW_TO_REVISE')question=zh?`你准备把小车的“${part}”具体怎样改？`:`How will you change the car’s “${part}”?`;
 }
 return question;
}
export function concreteDeepening(request:ChatRequest,zh:boolean):string[] {
 const o=coachingObjects(request),i=zh?0:1,object=o.object[i],measure=o.measure[i];
 const focus:Record<StageId,Words>={understand:[`题目对${object}的要求`,`the task’s requirement for ${object}`],imagine:[`你选的${object}想法`,`your chosen idea for ${object}`],plan:[`记录${measure}的计划`,`your plan for recording ${measure}`],build:[`你亲手做${object}的动作`,`your actual work on ${object}`],test:[`你记下的${measure}`,`your recorded ${measure}`],improve:[`你准备怎样改${object}`,`your planned change to ${object}`],reflect:[`你对${object}的新发现`,`your discovery about ${object}`]};
 const f=focus[request.stage][i];
 if(taskRubric(request.task).profile==='wind-car'&&request.stage==='understand')return zh?['如果小车还没跑到题目要求的距离，算完成任务吗？','为什么做小车时要记住题目要求的行驶距离？','你会怎样用距离记录检查小车有没有完成任务？','你会怎样向同学解释小车要靠什么力量前进？','关于题目对小车的要求，你还有哪里不清楚？']:['If the car stops before the distance required in the task, has it completed the task?','Why should you remember the required travel distance when making the car?','How would you use a distance record to check whether the car completed the task?','How would you explain to a classmate what pushes the car forwards?','What is still unclear about the task’s requirements for the car?'];
 return zh?[`你会怎样向同学解释${f}？`,`为什么${f}对这个项目重要？`,`你会用哪条${object}记录检查刚才说的话？`,`关于${f}，你还有哪个地方拿不准？`,`你最想再检查${object}的什么？`]:[`How would you explain ${f} to a classmate?`,`Why does ${f} matter for this project?`,`Which record about ${object} would you use to check what you said?`,`What are you still unsure about in ${f}?`,`What would you most like to check again about ${object}?`];
}
/** Check language anchoring only; this does not assess readiness or scientific truth. */
export function concreteLanguageValid(text:string,request:ChatRequest):boolean {
 if(/你补充的这一点已经记住了|这一点记住了|I have noted that part/i.test(text))return false;
 const profile=taskRubric(request.task).profile;
 const nouns:Record<string,RegExp>={
  'wind-car':/小车|风|帆|轮|车身|距离|car|wind|sail|wheel|distance/i,
  bridge:/桥|承重|重量|跨度|秒|bridge|load|weight|span|seconds/i,
  filtration:/过滤|水|颗粒|清澈|filter|water|particle|clarity/i,
  insulation:/保温|温水|温度|杯|时间|insulat|warm water|temperature|cup|time/i,
  plants:/幼苗|植物|光照|高度|日期|生长|seedling|plant|light|height|date|growth/i
 };
 const pattern=nouns[profile];
 if(!pattern)return true;
 const question=text.match(/[^。.!！\n]*[?？]/g)?.at(-1);
 if(!question)return pattern.test(text);
 if(pattern.test(question))return true;
 if(/这一点|另一个可能|怎样判断|this point|another possibility|how.*judge/i.test(question))return false;
 const before=text.slice(0,text.lastIndexOf(question)).split(/[。.!！\n]/).filter(s=>s.trim()).at(-1)??'';
 return pattern.test(before)&&/哪|怎么|怎样|多少|为什么|what|which|how|why/i.test(question);
}
export function concreteAcknowledgement(request:ChatRequest,zh:boolean):string {
 if(request.intent==='support-change'||!request.message||/^(?:我不知道|不懂|不确定|i don['’]?t know|not sure)[。.!！\s]*$/i.test(request.message.trim()))return '';
 const text=request.message.replace(/[?？\n]/g,' ').trim().slice(0,90).replace(/[。.!！]+$/,'');
 return zh?`你说：“${text}”。`:`You said: “${text}”.`;
}
