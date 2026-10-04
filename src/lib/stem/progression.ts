import type {ChatRequest,DialogueMessage,LearningArtifacts,Message,StageCriterion,StageId,STEMTask} from '@/types';
import {meaningfulEvidence,unsafeAction} from './evidence';
import {taskRubric} from './rubrics';
export type EvidenceMessage=Pick<Message,'role'|'text'> & Partial<Pick<Message,'id'|'dialogue'>>;
const synthetic=/^Regarding this unverified claim:|^(?:请调整帮助|请按我选择的支持等级|Please adjust the guidance|Please continue at my chosen support level)/i;
const offTopic=/我.*(?:午饭|晚饭|游戏账号|喜欢.*电影)|\b(?:lunch|dinner|video game|football team|favourite movie|favorite movie)\b/i;
export function meaningfulRound(task:STEMTask,stage:StageId,text:string,previous=''){
 if(!meaningfulEvidence(text)||synthetic.test(text)||offTopic.test(text)||unsafeAction(task,text))return false;
 const profile=taskRubric(task).profile;
 const domains:Record<string,RegExp>={'wind-car':/车|轮|帆|风|距离|米|材料|胶带|摩擦|car|wheel|sail|wind|distance|metres?|meters?|friction|material/i,bridge:/桥|跨度|纸|胶带|承重|负重|克|支撑|稳定|折|bridge|span|paper|tape|load|gram|support|fold|stable/i,filtration:/水|滤|颗粒|沙|砾石|清澈|浑浊|容器|water|filter|particle|sand|gravel|clarity|clear|cloudy|container/i,insulation:/水|温|时间|分钟|冷|热|材料|杯|布|纸|water|temperature|time|minute|cool|warm|heat|material|cup|fabric|paper/i,plants:/光|幼苗|植物|生长|高|厘米|土|水|天|light|seedling|plant|growth|height|centimet|soil|water|day/i};
 const domain=domains[profile];if(domain)return domain.test(text)||(/它|这个|加高|加宽|装|试|因为|比较|先|然后|每次|一样|不同|because|compare|first|then|same|different/i.test(text)&&domain.test(previous));
 const words=[task.title,task.description,...task.objectives??[],...task.successCriteria??[]].join(' ').match(/[a-z]{3,}|[\u3400-\u9fff]{2}/gi)??[];
 return words.some(w=>text.toLowerCase().includes(w.toLowerCase()))||/测试|测量|材料|模型|结果|记录|改变|比较|观察|设计|build|measure|test|material|model|result|record|change|compare|observe|design/i.test(text)||(/因为|先|然后|一样|because|first|then|same/i.test(text)&&words.some(w=>previous.toLowerCase().includes(w.toLowerCase())));
}
/** Only learner->successful-coach pairs count. IDs make retry/restore idempotent.
 * Legacy alternating saved turns are reconstructed conservatively without a paid call. */
export function completedRounds(task:STEMTask,stage:StageId,messages:EvidenceMessage[]){
 const result:{id:string;text:string;previous:string}[]=[];const seen=new Set<string>();let previous='';
 for(let index=0;index<messages.length;index++){
  const coach=messages[index];if(coach.role!=='assistant')continue;
  const explicit=coach.dialogue;
  const student=explicit?.replyTo?messages.slice(0,index).find(m=>m.role==='student'&&m.id===explicit.replyTo):messages[index-1];
  if(student?.role==='student'){
   const id=student.id??`legacy-${index-1}`;
   const successful=explicit?explicit.successful===true&&explicit.intent==='chat'&&explicit.replyTo===id:true;
   if(successful&&(!student.dialogue||student.dialogue.intent==='chat')&&!seen.has(id)&&meaningfulRound(task,stage,student.text,previous)){seen.add(id);result.push({id,text:student.text,previous});}
  }
  previous=coach.text;
 }
 return result;
}
const future=/准备|打算|预计|预测|可能会|我猜|我觉得.*会|还没(?:有)?(?:试|测|装|做|开始)|没有(?:试|测|装|做)|\b(?:will|would|might|predict|plan to|going to|not yet|haven['’]?t|didn['’]?t)\b/i;
const past=/已经|刚才|刚刚|试了|试过|装.*了|换.*了|做了|搭.*了|调.*了|剪.*了|粘.*了|放.*了|测到|测得|看到|看见|观察到|跑了|第[一二三两]|\b(?:tested|tried|built|changed|set up|installed|attached|made|measured|observed|ran|went|saw|first run|second run|trial [12])\b/i;
const observation=/卡|歪|摩擦|不稳|松|倾斜|倒|停|漏|浑浊|清澈|颗粒|长高|下降|冷|暖|跑|走|rubb|crooked|unstable|loose|lean|fell|stop|leak|cloudy|clear|particle|grow|cool|warm|went|moved|\b(?:saw|observed|noticed)\b/i;
function actualClauses(text:string){return text.split(/[,，;；。!\n]|\.(?!\d)/).filter(c=>past.test(c)&&!future.test(c));}
const factors:RegExp[]=[/帆.*(?:大|小|尺寸)|(?:sail size|bigger sail|larger sail|small sail)/i,/帆.*(?:角度|方向)|sail angle/i,/车.*(?:轻|重)|weight|lighter/i,/轮.*(?:直|歪|对齐)|wheel alignment/i,/轮.*(?:摩擦|顺|滑)|friction|wheel.*(?:smooth|rub)/i,/风.*方向|wind direction/i,/车身.*(?:形|长|宽)|body shape/i,/三角|triangle/i,/拱|arch/i,/折|fold/i,/层|layer/i,/沙|sand/i,/砾石|gravel/i,/滤纸|filter paper/i,/布|fabric/i,/纸|paper/i,/泡沫|foam/i,/光.*(?:多|少|强|弱)|light.*(?:more|less|bright|shade)/i,/水量|amount.*water/i,/土|soil/i];
export function assessCriterion(task:STEMTask,c:StageCriterion,texts:string[],rounds:{id:string;text:string;previous:string}[]){
 const joined=texts.join('\n'),profile=taskRubric(task).profile;
 const contextual=rounds.filter(t=>/实际|第[一二]次|真实.*(?:测试|结果)|actually|actual|trial|first.*(?:run|test)|second.*(?:run|test)/i.test(t.previous)&&!future.test(t.text)&&!/(?:目标|至少|达到|还没到|超过|goal|at least|reach|exceed)/i.test(t.text)&&/\d+(?:\.\d+)?\s*(?:米|m\b|metres?|meters?|cm|度|°|克|g\b)/i.test(t.text)).map(t=>'实际测到 '+t.text);
 const actual=[...texts.flatMap(actualClauses),...contextual],physical=actual.join('\n');
 const exists=(re:RegExp)=>re.test(joined);
 const outcomes:Record<string,RegExp>={'wind-car':/距离|跑.*(?:米|m\b)|行驶.*(?:米|m\b)|distance|travel|metres?|meters?/i,bridge:/承重|负重|稳定|重量|克|秒|load|support|stable|gram|second/i,filtration:/颗粒|清澈|浑浊|前后|particle|clarity|clear|cloudy|before.*after/i,insulation:/温度|水温|度|temperature|degrees?|°/i,plants:/生长|长高|高度|厘米|growth|height|taller|centimet/i};
 switch(c.kind){
 case 'TASK_GOAL':return profile==='wind-car'?exists(/(?:风[\s\S]{0,16}(?:小车|车)|(?:小车|车)[\s\S]{0,16}风|wind[\s\S]{0,25}car|car[\s\S]{0,25}wind)/i):profile==='bridge'?exists(/桥|bridge/i)&&exists(/跨|跨度|span|gap/i):profile==='filtration'?exists(/滤|filter/i)&&exists(/水|颗粒|water|particle/i):profile==='insulation'?exists(/冷却|降温|保温|cool|insulat/i):profile==='plants'?exists(/光|light/i)&&exists(/生长|growth|grow/i):exists(/要|目标|制作|探究|设计|比较|build|make|goal|investigate|compare|design/i);
 case 'SUCCESS_CRITERION':{
  if(profile==='wind-car')return exists(/(?:3|三)\s*(?:米|m\b|metres?|meters?)/i);
  if(profile==='bridge')return exists(/20\s*(?:厘米|cm)/i)&&exists(/200\s*(?:克|g\b|grams?)/i)&&exists(/10\s*(?:秒|s\b|seconds?)/i);
  if(profile==='filtration')return exists(/颗粒|清澈|particle|clarity|clear/i)&&exists(/不能喝|不能饮|不要喝|不喝|不能饮用|not.*drink|no drinking|never.*drink/i);
  if(profile==='insulation')return exists(/温度|水温|temperature/i)&&exists(/时间|分钟|time|minute/i);
  if(profile==='plants')return exists(/生长|高度|growth|height/i)&&exists(/天|时间|每天|重复|day|time|repeat/i);
  const goal=(task.successCriteria??[]).join(' '),numbers=goal.match(/\d+(?:\.\d+)?/g)??[];
  return numbers.length?numbers.every(n=>joined.includes(n)):exists(/成功|目标|达到|结果|证据|success|goal|evidence|result/i)&&(task.successCriteria?.length?goal.split(/\s+/).some(w=>w.length>3&&joined.toLowerCase().includes(w.toLowerCase())):true);
 }
 case 'ONE_CONSTRAINT_OR_RESOURCE':return profile==='filtration'?exists(/不能喝|不喝|不能饮用|not.*drink|never.*drink/i)&&exists(/滤纸|沙|砾石|容器|filter paper|sand|gravel|container/i):exists(/材料|老师给|只能|风|纸|胶带|水|温|光|土|water|light|soil|warm|material|provided|wind|paper|tape|only|constraint/i);
 case 'AT_LEAST_TWO_IDEAS':return factors.filter(re=>re.test(joined)).length>=2||texts.some(t=>/(?:两种|两个|two|another|另一种|也可以)/i.test(t)&&t.split(/也可以|或者|或者是|另一|\bor\b|another|[,，;；]/i).filter(x=>x.trim().length>5).length>=2);
 case 'CHOSEN_DIRECTION':return exists(/先(?:选|试|用|改)|选择|决定|就用|choose|chosen|pick|try.*first|first.*try/i)||rounds.some(t=>/哪.*(?:先|选)|which.*(?:first|choose)/i.test(t.previous)&&meaningfulRound(task,'imagine',t.text,t.previous));
 case 'SIMPLE_REASON':return exists(/因为|所以|为了|原因|because|so that|reason|in order to/i);
 case 'CHANGE_FACTOR':return exists(/改变|换|调|改|比较|变大|变小|加|change|vary|compare|replace|adjust|bigger|smaller/i);
 case 'AT_LEAST_ONE_CONTROLLED_CONDITION':return exists(/每次.*(?:同|一样)|保持.*(?:同|一样|不变)|固定|不改变|same|keep.*constant|fixed|consistent/i);
 case 'MEASUREMENT':return (outcomes[profile]??/测|观察|记录|measure|observe|record/i).test(joined)&&exists(/测|观察|记录|看|距离|温度|高度|measure|observe|record|distance|temperature|height|load|clarity/i);
 case 'SIMPLE_PROCEDURE':return exists(/先[\s\S]*然后|先[\s\S]*再|first[\s\S]*(?:then|next|after)/i);
 case 'ACTUAL_BUILD_ACTION':return actual.some(t=>/加|装|做|搭|剪|粘|换|调|放|准备好|built|made|set up|prepared|installed|attached|changed|cut|taped|placed|adjusted|tried/i.test(t));
 case 'SECOND_ACTUAL_ACTION_OR_DETAIL':return actual.filter(t=>/装|做|搭|剪|粘|换|调|放|built|made|installed|attached|changed|cut|taped|placed|adjusted/i.test(t)).length>=2||physical.length>0&&exists(/胶带|胶水|固定|粘|穿过|套|拧|剪|fold|cut|tape|glue|fasten|insert|through|screw/i);
 case 'BUILD_OBSERVATION_OR_PROBLEM':return physical.length>0&&texts.some(t=>!future.test(t)&&observation.test(t));
 case 'ACTUAL_TRIAL_1':case 'ACTUAL_TRIAL_2':{
  const signatures=new Set<string>(),seenValues=new Set<string>();
  for(const t of actual){if(!/测|跑|走|看到|观察|结果|test|run|ran|trial|measur|observ|result|saw|went/i.test(t))continue;
   const number=t.match(/第([一二三两123])次|(?:trial|run)\s*([12])|\b(first|second)\b/i)?.[0];
   const values=t.match(/\d+(?:\.\d+)?\s*(?:米|厘米|m\b|cm|克|g\b|秒|s\b|度|°|metres?|meters?|grams?|seconds?|degrees?)/gi)?.join('|');
   if(signatures.size&&!number&&!values&&!/又.*(?:试|测)|再次|重新测试|another trial|tested again/i.test(t))continue;
   // Repeating a previous distance without identifying a new trial is not
   // another run. Explicit first/second trials may legitimately share a value.
   if(!number&&values&&seenValues.has(values))continue;
   signatures.add(number??values??t.replace(/[\p{P}\s]/gu,''));
   if(values)seenValues.add(values);
  }
  return signatures.size>=(c.kind==='ACTUAL_TRIAL_1'?1:2);
 }
 case 'COMPARE_WITH_GOAL':return exists(/没(?:有)?(?:达到|到)|还没到|超过|达到|不够|低于|short|below|exceed|reach|met.*goal|meet.*goal|not.*(?:reach|meet)|clearer|更清澈|比.*(?:低|高|慢|快)|cool.*(?:less|more)|growth.*(?:more|less)/i)&&(profile!=='wind-car'||exists(/(?:3|三)\s*(?:米|m\b|metres?|meters?)/i));
 case 'IDENTIFY_REVISION':return exists(/改|换|调|加|减少|change|replace|adjust|add|reduce/i)&&exists(/帆|轮|小车|风|纸|桥|材料|水|滤|温|光|植物|sail|wheel|car|wind|paper|bridge|material|water|filter|temperature|light|plant/i);
 case 'HOW_TO_REVISE':return exists(/用|通过|先|把.*(?:调|换|改)|how|by|first|replace.*with|using/i)&&exists(/调|换|改|粘|剪|放|加|adjust|replace|change|tape|cut|place|add/i);
 case 'LINK_TO_TEST_EVIDENCE':return exists(/刚才|测试|测到|看见|看到|试.*(?:时|了)|结果|observed|saw|test|measured|result/i)&&exists(/因为|所以|因此|刚才.*(?:想|改)|because|so |since|therefore/i);
 case 'ONE_TAKEAWAY':return exists(/发现|学会|学到|明白|原来|现在知道|learn|realiz|noticed|found|now know/i)&&!/^我学到了很多[。\s]*$|^I learned a lot[.\s]*$/i.test(joined.trim());
 case 'EVIDENCE_OR_EXPERIENCE_CONNECTION':return exists(/那次|刚才|试过|测试|测到|看到|经历|because.*(?:test|saw)|when|experience|tested|saw|measured/i);
 case 'ONE_CHANGE_IN_THINKING_OR_NEXT_TIME':return exists(/以前|原先|之前|现在|下次|下一次|以后|想法.*变|used to|before|now|next time|changed my/i)&&exists(/想|觉得|认为|改|试|做|保持|记录|think|thought|change|try|will|keep|record/i);
 }
}
export function rubricEvidence(task:STEMTask,stage:StageId,records:LearningArtifacts,messages:EvidenceMessage[]){
 const rounds=completedRounds(task,stage,messages),texts=[...rounds.map(t=>t.text),...Object.values(records[stage]??{}).filter(t=>meaningfulRound(task,stage,t))];
 const criteria=taskRubric(task)[stage];return {rounds,criteria,satisfied:criteria.filter(c=>assessCriterion(task,c,texts,rounds)).map(c=>c.id)};
}
export function progressionMessages(r:ChatRequest,includeLatest=true):DialogueMessage[]{
 const history:DialogueMessage[]=(r.progressionHistory??r.history.map((m,index)=>({...m,id:`legacy-${index}`}))).map(m=>({...m}));
 if(includeLatest&&(!r.intent||r.intent==='chat')){const id=r.messageId??'current-learner-turn';if(!history.some(m=>m.id===id&&m.role==='student'))history.push({id,role:'student',text:r.message,dialogue:{intent:'chat'}});history.push({id:`successful-${id}`,role:'assistant',text:'Coaching completed',dialogue:{intent:'chat',replyTo:id,successful:true}});}
 return history;
}
