import type {ChatRequest,Message,StageId} from '@/types';
import {assessLocalReadiness,evidenceForStage,meaningfulEvidence,unsafeAction} from './readiness';
import {stageCheckpoints} from './stageCheckpoints';
export const evidenceSlots:Record<StageId,readonly [string,string]>={
 understand:['BASIC_GOAL','SUCCESS_CONDITION'],imagine:['IDEA','CHOSEN_DIRECTION'],
 plan:['ACTION_STEP','OBSERVE_OR_MEASURE'],build:['ACTUAL_ATTEMPT','OBSERVATION'],
 test:['ACTUAL_RESULT','GOAL_COMPARISON'],improve:['REVISION','HOW_TO_CHANGE'],
 reflect:['TAKEAWAY','EXPERIENCE_OR_EVIDENCE']
};
export const isConfused=(text:string)=>/不知道|不懂|什么意思|没懂|太难|不确定|不会|没明白|\b(?:don['’]?t|do not)\s+(?:really\s+)?(?:know|understand)|what does .*mean|no idea|not sure/i.test(text);
const primaryQuestions:Record<StageId,RegExp>={
 understand:/要.*做什么|任务.*(?:动作|做的事|目标)|task.*(?:ask|goal)|which action/i,
 imagine:/什么.*(?:办法|猜想)|一个.*(?:想法|办法)|one.*(?:idea|guess)|what.*idea/i,
 plan:/先.*(?:做|步)|准备.*做|first|action.*step/i,
 build:/做了哪|试过|具体做|亲手|实际.*做|which step|what.*(?:tried|try yourself|did you do)/i,
 test:/测到|测得|看到.*结果|实际.*(?:看到|结果)|actual.*(?:result|see|measure)|what did.*(?:see|measure)/i,
 improve:/哪里.*改|哪.*(?:值得|想).*改|one.*(?:worth changing|change)|what.*changing/i,
 reflect:/学会|学到|变化的想法|what.*learn|idea.*changed/i
};
const secondaryQuestions:Record<StageId,RegExp>={
 understand:/成功|success/i,imagine:/先.*(?:选|试哪)|哪一个想法|which.*(?:idea|choose)|different.*idea/i,
 plan:/观察|测量|记录.*看到|watch|measure|record seeing/i,
 build:/看到什么|看到了什么|观察到|发生了什么|what.*(?:happened|see after|observe)/i,
 test:/目标.*(?:比|吗)|结果.*目标|goal.*(?:compare|meet)|compare.*goal/i,
 improve:/怎么改|怎样改|how.*change/i,reflect:/哪次|经历|哪.*发现|what happened|experience|helped.*learn/i
};
/** Inspect the final question, not a preceding multi-step scaffold. */
export function questionTarget(stage:StageId,text:string):0|1|undefined{
 const question=text.match(/[^。.!！\n]*[?？]/g)?.at(-1)??text;
 if(secondaryQuestions[stage].test(question))return 1;
 if(primaryQuestions[stage].test(question))return 0;
}
const secondaryEvidence:Record<StageId,RegExp>={
 understand:/至少|成功|达到|米|metres?|meters?|success|at least|goal.*(?:reach|meet)/i,
 imagine:/先选|先试|选择|决定|就用|choose|chosen|pick|try.*first/i,
 plan:/观察|测量|记录|看看|watch|measure|observe|record/i,
 build:/看到|发生|向前|跑了|走了|倒了|停了|动了|observed|saw|went|moved|fell|happened|\d.*(?:米|m\b)/i,
 test:/达到|没到|没有到|目标|不够|超过|差.*米|goal|shorter|below|exceed|enough/i,
 improve:/怎么|怎样|用|通过|先|把.*(?:调|换|改)|how|by|first|replace.*with/i,
 reflect:/因为|那次|试过|测试|经历|看到|because|when|experience|tested|saw/i
};
const prospective=/准备|打算|还没|没试|没有|预计|预测|可能会|我猜|我觉得.*会|\b(?:will|would|might|predict|plan to|not yet|haven['’]?t)\b/i;
export function contribution(request:Pick<ChatRequest,'task'|'stage'>,text:string,previous=''):[boolean,boolean]{
 if(!meaningfulEvidence(text)||isConfused(text)||unsafeAction(request.task,text))return [false,false];
 const target=questionTarget(request.stage,previous);
 let first=evidenceForStage(request.task,request.stage,text);
 let second=secondaryEvidence[request.stage].test(text);
 // Short contextual answers count, but plans/predictions never become actual attempts/results.
 const actual=request.stage==='build'||request.stage==='test';
 const invalidActual=actual&&prospective.test(text);
 if(invalidActual)second=false;
 if(target===0&&!first&&!invalidActual){
  const contextual=actual?/装.*(?:了|去)|换.*了|试.*次|\b(?:installed|attached|tried|did|measured)\b/i.test(text):
   /它|这个|帆|小车|轮|水|纸|桥|材料|\bit\b|sail|wheel|water|paper|bridge|material/i.test(text);
  if(contextual)first=true;
 }
 if(target===1&&!second&&!invalidActual){
  // A responsive short answer may omit the task noun, but off-topic prose is not evidence.
  second=/\d|米|秒|更|比|帆|轮|小车|风|水|纸|桥|因为|先|选|试|\bit\b|sail|wheel|water|paper|bridge|because|first|choose/i.test(text);
 }
 return [first,second];
}
export function conversationProgress(request:ChatRequest){
 const slots:[boolean,boolean]=[false,false];
 const core=stageCheckpoints(request.task,request.stage).filter(c=>c.core);
 for(const [index,field] of core.entries()){
  const text=request.artifacts[request.stage]?.[field.field]??'';
  if(index===0)slots[0]=evidenceForStage(request.task,request.stage,text,true);
  else slots[1]=meaningfulEvidence(text)&&!isConfused(text)&&!unsafeAction(request.task,text);
 }
 let previous='';let latest:[boolean,boolean]=[false,false];
 const turns=[...request.history,...(!request.intent||request.intent==='chat'?[{role:'student' as const,text:request.message}]:[])];
 for(const turn of turns){
  if(turn.role==='assistant'){previous=turn.text;continue;}
  latest=contribution(request,turn.text,previous);
  slots[0] ||= latest[0];slots[1] ||= latest[1];
 }
 const ready=slots[0]||assessLocalReadiness(request.task,request.stage,request.artifacts).ready;
 const target:0|1|2=!slots[0]?0:!slots[1]?1:2;
 return {slots,ready,target,latest,confused:isConfused(request.message)};
}
/** Keep witnesses for each slot plus recent turns within the existing request limit.
 * Derived every time from the full saved stage conversation; no new persisted state or text copies.
 */
export function conversationHistory(request:Pick<ChatRequest,'task'|'stage'>,messages:Pick<Message,'role'|'text'>[]){
 const indexes=new Set<number>();const found=[false,false];let previous='';
 for(const [index,turn] of messages.entries()){
  if(turn.role==='assistant'){previous=turn.text;continue;}
  const evidence=contribution(request,turn.text,previous);
  for(const slot of [0,1])if(evidence[slot]&&!found[slot]){found[slot]=true;indexes.add(index);if(index>0&&messages[index-1].role==='assistant')indexes.add(index-1);}
 }
 for(let index=Math.max(0,messages.length-8);index<messages.length;index++)indexes.add(index);
 return [...indexes].sort((a,b)=>a-b).map(index=>({role:messages[index].role,text:messages[index].text.slice(0,2000)}));
}
function normalize(text:string){return text.toLowerCase().replace(/___|[\p{P}\p{S}\s]/gu,'').replace(/可以先填一小句|换个简单说法|我们只想一小步|tryonesmallsentence|letssayitmoresimply/g,'');}
export function repeatsAnsweredQuestion(text:string,request:ChatRequest){
 if(request.intent==='challenge'||request.intent==='evaluate-claim')return false;
 const progress=conversationProgress(request),target=questionTarget(request.stage,text);
 if(!progress.confused&&target!==undefined&&progress.slots[target])return true;
 const core=stageCheckpoints(request.task,request.stage).filter(c=>c.core);
 if(!progress.confused&&core.some((field,index)=>progress.slots[index]&&text.includes('___')&&(normalize(text).includes(normalize(field.zh))||normalize(text).includes(normalize(field.en)))))return true;
 const recent=request.history.filter(m=>m.role==='assistant').slice(-3).map(m=>m.text);
 const candidate=normalize(text),question=normalize(text.match(/[^。.!！\n]*[?？]/g)?.at(-1)??'');
 return recent.some(old=>{
  const normalized=normalize(old),oldQuestion=normalize(old.match(/[^。.!！\n]*[?？]/g)?.at(-1)??'');
  if(candidate===normalized||(question.length>5&&question===oldQuestion))return true;
  const a=new Set([...candidate].slice(0,600).map((_,i)=>candidate.slice(i,i+3)).filter(s=>s.length===3));
  const b=new Set([...normalized].slice(0,600).map((_,i)=>normalized.slice(i,i+3)).filter(s=>s.length===3));
  const overlap=[...a].filter(s=>b.has(s)).length;
  return overlap/Math.max(a.size,b.size,1)>0.85;
 });
}
