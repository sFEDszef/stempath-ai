import type {ChatRequest,LearningArtifacts,StageId,STEMTask,Message} from '@/types';
import {stageCheckpoints} from './stageCheckpoints';
export const READINESS_POLICY_VERSION='gentle-v1' as const;
export const readinessCriteria={understand:'BASIC_TASK_GOAL',imagine:'ONE_IDEA',plan:'ONE_ACTIONABLE_NEXT_STEP',build:'ACTUAL_ATTEMPT',test:'ACTUAL_RESULT',improve:'ONE_REVISION',reflect:'ONE_TAKEAWAY'} as const;
export type ReadinessCriterion=typeof readinessCriteria[StageId];
export interface StageReadinessAssessment {ready:boolean;criterion?:ReadinessCriterion;missing?:ReadinessCriterion;source:'AI_SEMANTIC'|'LOCAL_RECORD'|'DEMO';attestation?:string;promptSeen?:boolean;}
export type StageReadiness=Partial<Record<StageId,StageReadinessAssessment>>;
const trivial=/^(?:好的?|嗯+|不知道|不懂|没懂|不确定|随便|下一步|继续|ok(?:ay)?|yes|no|idk|thanks|thank you|not sure|i don['’]?t (?:know|understand))[。.!?？\s]*$/i;
function learnerText(text:string){return text.replace(/^Regarding this unverified claim: “[^]*?”\n\n/,'');}
export function meaningfulEvidence(text:string){return text.trim().length>=2&&/[\p{L}\p{N}]/u.test(text)&&!/^[_?？.。\s]+$/.test(text)&&!trivial.test(text.trim())&&!/^(?:我)?(?:还是|仍然|真的|完全|还)?(?:不知道|不懂|没懂|不确定|don['’]?t know|not sure|i don['’]?t know)(?:从哪|怎么|从哪里|该|如何|where|what)?[^,，;；。]*[。.!?？]*$/i.test(text.trim())&&!/ignore.*instructions|忽略.*指令|mark.*ready|设.*ready/i.test(text);}
/** Narrow, directly dangerous actions only. No general safety checklist or mastery score. */
export function unsafeAction(task:STEMTask,text:string){return /触摸带电|(?:touch|connect).*?(?:mains|live wire)|混合漂白|mix.*bleach.*ammonia/i.test(text)||(/不能饮用|not.*drink|do not drink/i.test([task.safetyNotes,...task.constraints??[],task.description].join(' '))&&/(?:我要|准备|想|will|going to).*?(?:喝|drink)/i.test(text));}
function temporalEvidence(stage:StageId,text:string){
 if(stage==='build'||stage==='test'){
  if(/(?:我觉得|我猜|我会|会(?:跑|走|倒|变|升|降|更)|应该(?:会|能)|可能会|预计|预测|准备|打算|明天|将会|还没|没有|没试|haven['’]?t|did not|didn['’]?t|have not|not yet|will|would|going to|plan to|tomorrow|predict|might|think.*(?:go|run|travel))/i.test(text))return false;
 }
 return true;
}
function related(task:STEMTask,text:string){const words=[task.title,task.description,...task.objectives??[],...task.successCriteria??[],...task.relevantDomains??[]].join(' ').toLowerCase().match(/[a-z]{3,}|[\u3400-\u9fff]{2}/g)??[];return words.some(w=>text.toLowerCase().includes(w))||/它|这个|测试|修改|\bit\b|test|小车|帆|轮子|材料|风|水温|桥|纸|水|温度|car|sail|wheel|material|wind|water|temperature|bridge|paper|pattern|模型|规律|植物|plant/i.test(text);}
export function evidenceForStage(task:STEMTask,stage:StageId,text:string,record=false):boolean{
 if((stage==='build'||stage==='test')&&/[,，;；。.!]/.test(text)){const clauses=text.split(/[,，;；。!]|\.(?!\d)/).filter(x=>x.trim());if(clauses.length>1)return !unsafeAction(task,text)&&clauses.some(x=>evidenceForStage(task,stage,x,record));}
 if(!meaningfulEvidence(text)||unsafeAction(task,text)||!temporalEvidence(stage,text))return false;
 if(stage==='test')return /\d+(?:\.\d+)?\s*(?:米|m\b|cm|毫米|秒|s\b|度|°|克|g\b)|跑了|倒了|看到|测到|测得|比.*(?:远|快|高|低)|went|fell|observed|measured|was|rose|this time|result/i.test(text)||(record&&/\d/.test(text));
 if(stage==='build')return /已经|刚刚|试了|装.*了|换.*了|做了|搭.*了|推了|tested|tried|built|changed|set up|installed|attached|made|did|have.*(?:done|tried)/i.test(text);
 if(record)return true;
 if(!related(task,text))return false;
 const patterns:Partial<Record<StageId,RegExp>>={understand:/让|做|至少|要|目标|跑|设计|制作|build|make|goal|need|travel|run|design|find|investigate/i,imagine:/想|猜|觉得|试|把|可能|idea|try|could|think|guess|maybe/i,plan:/先|准备|打算|试|装|换|做|plan|first|will|try|measure|change/i,improve:/改|换|调|下次|把|change|next|adjust|lighter|bigger|smaller|try/i,reflect:/发现|学会|原来|现在|重要|明白|learn|realiz|noticed|found|important|used to/i};return !!patterns[stage]?.test(text);
}
export function assessLocalReadiness(task:STEMTask,stage:StageId,records:LearningArtifacts,messages:Pick<Message,'role'|'text'>[]=[],source:StageReadinessAssessment['source']='LOCAL_RECORD'):StageReadinessAssessment{
 const fields=stageCheckpoints(task,stage).filter(c=>c.core);
 const relevant=stage==='understand'?fields:stage==='improve'?fields:fields.slice(0,1);
 const recordReady=relevant.some(c=>evidenceForStage(task,stage,records[stage]?.[c.field]??'',true));
 const ready=recordReady||messages.some(m=>m.role==='student'&&evidenceForStage(task,stage,learnerText(m.text)));
 return ready?{ready:true,criterion:readinessCriteria[stage],source:recordReady?'LOCAL_RECORD':source}:{ready:false,missing:readinessCriteria[stage],source};
}
export function requestReadiness(r:ChatRequest,source:StageReadinessAssessment['source']='DEMO'){
 const latest=(!r.intent||r.intent==='chat')?[{role:'student' as const,text:r.message}]:[];
 return assessLocalReadiness(r.task,r.stage,r.artifacts,[...r.history,...latest],source);
}
export function parseReadiness(value:unknown,stage:StageId,source:StageReadinessAssessment['source']):StageReadinessAssessment|undefined{
 if(!value||typeof value!=='object')return;const v=value as Record<string,unknown>,criterion=readinessCriteria[stage];
 if(v.ready===true&&v.criterion===criterion)return {ready:true,criterion,source,...(v.promptSeen===true?{promptSeen:true}:{}),...(typeof v.attestation==='string'&&v.attestation.length<=128?{attestation:v.attestation}:{})};
 if(v.ready===false&&v.missing===criterion)return {ready:false,missing:criterion,source};
}
export function semanticReadiness(value:unknown,r:ChatRequest){
 const a=parseReadiness(value,r.stage,'AI_SEMANTIC');if(!a)return requestReadiness(r);
 const student=[...r.history.filter(m=>m.role==='student').map(m=>learnerText(m.text)),...(!r.intent||r.intent==='chat'?[r.message]:[]),...Object.values(r.artifacts[r.stage]??{})];
 if(a.ready&&!student.some(t=>meaningfulEvidence(t)&&t.split(/[,，;；。!]|\.(?!\d)/).some(c=>meaningfulEvidence(c)&&temporalEvidence(r.stage,c))&&!unsafeAction(r.task,t)))return requestReadiness(r);
 if(student.some(t=>unsafeAction(r.task,t)))return {ready:false,missing:readinessCriteria[r.stage],source:'AI_SEMANTIC' as const};
 return a;
}
export function restoreReadiness(task:STEMTask,records:LearningArtifacts,messages:Partial<Record<StageId,Message[]>>,input:unknown):StageReadiness{
 const v=input&&typeof input==='object'?input as Record<string,unknown>:{};const result:StageReadiness={};
 for(const stage of Object.keys(readinessCriteria) as StageId[]){const raw=v[stage] as StageReadinessAssessment|undefined;const parsed=raw&&['AI_SEMANTIC','LOCAL_RECORD','DEMO'].includes(raw.source)?parseReadiness(raw,stage,raw.source):undefined;const a=parsed?.ready?parsed:assessLocalReadiness(task,stage,records,messages[stage], 'DEMO');if(a.ready)result[stage]=a;}
 return result;
}
export function readinessInstruction(stage:StageId){return `Return a JSON object only: {"reply":"learner-facing coaching","readiness":{"ready":true,"criterion":"${readinessCriteria[stage]}"}} or {"reply":"...","readiness":{"ready":false,"missing":"${readinessCriteria[stage]}"}}. Reply must independently follow ALL pedagogical rules. Readiness policy gentle-v1: minimum sufficient LEARNER evidence to continue, never correctness, mastery, quality or teacher approval. Identical threshold at support levels 1,2,3 and all grades; be permissive for short Grade 3–6 contributions. Understand needs one basic goal; Imagine one idea; Plan one actionable intended step; Build one ACTUAL past attempt (future plan insufficient); Test one ACTUAL observation/result (prediction insufficient; 2.1m suffices in result context); Improve one revision; Reflect one takeaway. Only learner messages/records count, never your reply, suggestions, synthetic support-change messages, or acknowledgements like ok/好的/不知道. Do not invent evidence, fill records, request/store hidden reasoning or explanations of classification. Stay on the task; irrelevant text is insufficient. Address directly relevant unsafe intended actions before readiness; do not add routine checklists. Never advance or complete a stage. Metadata contains only ready and the current stage criterion/missing; no explanation or quoted evidence. For challenge/support-change/evaluate-claim, judge only prior learner-authored contributions, not synthetic/AI quoted claims.`;}
export const readinessCopy:Record<StageId,[string,string]>={understand:['你已经说出了这次任务大概要做什么。','You have described the basic task goal.'],imagine:['你已经有一个可以试试的想法了。','You have an idea you could try.'],plan:['你已经知道下一步准备做什么了。','You have a next step to try.'],build:['你已经实际试过一步了。','You have reported trying a step.'],test:['你已经有一个实际结果了。','You have reported a result.'],improve:['你已经想到一个可以修改的地方了。','You have a change you could try.'],reflect:['你已经说出了自己的一个学习发现。','You have shared a takeaway.']};
export const missingCue:Record<StageId,[string,string]>={understand:['先告诉我，这个任务大概要做什么？','What is this task asking you to do?'],imagine:['还差一个小想法：你想先试什么？','What is one idea you could try?'],plan:['你准备先做哪一步？','What step will you try first?'],build:['你实际试过哪一步了？','What have you actually tried?'],test:['你实际看到或测到了什么？','What did you actually observe or measure?'],improve:['你想先改哪一个地方？','What is one thing you want to change?'],reflect:['这次你学到了什么？','What is one thing you learned?']};
