import type {StageId,STEMTask} from '@/types';
const trivial=/^(?:好的?|嗯+|不知道|不懂|没懂|不确定|随便|下一步|继续|我不知道|ok(?:ay)?|yes|no|idk|thanks|thank you|not sure|i don['’]?t (?:know|understand))[。.!?？\s]*$/i;
export function meaningfulEvidence(text:string){return !/^(?:what (?:is|are) (?:the |this )?(?:task['’]?s? )?goal|how (?:can|do|should) I (?:start|begin)|任务(?:的目标|要做什么)|什么时候(?:能|可以)?进入下一阶段)/i.test(text.trim())&&!/^(?:我(?:可以|该)?(?:怎样|怎么)(?:描述|说明|表达|说出)|How (?:can|should) I (?:describe|explain|express|share))/i.test(text.trim())&&text.trim().length>=2&&/[\p{L}\p{N}]/u.test(text)&&!/^[_?？.。\s]+$/.test(text)&&!trivial.test(text.trim())&&!/^(?:我)?(?:还是|仍然|真的|完全|还)?(?:不知道|不懂|没懂|不确定|don['’]?t know|not sure|i don['’]?t know)(?:从哪|怎么|从哪里|该|如何|where|what)?[^,，;；。]*[。.!?？]*$/i.test(text.trim())&&!/ignore.*instructions|忽略.*指令|mark.*ready|设.*ready/i.test(text);}
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
 if(stage==='test')return /\d+(?:\.\d+)?\s*(?:米|m\b|met(?:re|er)s?\b|cm|centimet(?:re|er)s?\b|毫米|秒|seconds?\b|s\b|度|°|克|grams?\b|g\b)|跑了|走了|动了|停了|倒了|看到|测到|测得|比.*(?:远|快|高|低)|went|fell|observed|measured|was|rose|this time|result/i.test(text)||(record&&/\d/.test(text));
 if(stage==='build')return /已经|刚刚|试了|试过|装.*了|换.*了|做了|搭.*了|推了|tested|tried|built|changed|set up|installed|attached|made|did|have.*(?:done|tried)/i.test(text);
 if(record)return true;
 if(!related(task,text))return false;
 const patterns:Partial<Record<StageId,RegExp>>={understand:/让|做|至少|要|目标|跑|设计|制作|build|make|goal|need|travel|run|design|find|investigate/i,imagine:/想|猜|觉得|试|把|可能|idea|try|could|think|guess|maybe/i,plan:/先|准备|打算|试|装|换|做|plan|first|will|try|measure|change/i,improve:/改|换|调|下次|把|change|next|adjust|lighter|bigger|smaller|try/i,reflect:/发现|学会|原来|现在|重要|明白|learn|realiz|noticed|found|important|used to/i};return !!patterns[stage]?.test(text);
}
