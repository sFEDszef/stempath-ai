import type { StageId } from '@/types';
export type Language = 'en' | 'zh';
export function languageOf(text:string, fallback:Language='en'):Language {
 const zh=(text.match(/[\u3400-\u9fff]/g)??[]).length;
 const en=(text.match(/[a-z]+/gi)??[]).length;
 return zh+en===0?fallback:zh>=en?'zh':'en';
}
const uncertainty=/\b(?:don['’]?t|do not|still don['’]?t)\s+(?:really\s+)?(?:know|understand)|not\s+(?:really\s+)?sure|no idea|\bhelp\b|tell me.*answer|what should I do|stronger hint|不知道|不确定|不会|不懂|直接告诉我|怎么做|提示|没明白/i;
const stageTerms:Record<StageId,RegExp>={
 understand:/goal|achiev|must|limit|constraint|criterion|criteria|success|require|目标|限制|条件|达到|成功|要求/i,
 imagine:/idea|hypothes|alternative|compar|possib|assum|instead|想法|假设|比较|另一|方案/i,
 plan:/variable|measure|procedure|keep|constant|control|repeat|resource|变量|测量|步骤|保持|控制|重复|材料/i,
 build:/tried|observ|happened|setup|implement|problem|check|尝试|观察|发生|设置|实施|问题|检查/i,
 test:/observ|measur|trial|data|result|record|evidence|观察|测量|次数|数据|结果|记录|证据/i,
 improve:/revis|chang|improv|because|trade.off|compar|修改|改变|改进|因为|权衡|比较/i,
 reflect:/learn|used to|changed.*think|independen|advice|accepted|rejected|学到|原来|想法.*变|独立|建议|接受|拒绝/i
};
export function meaningful(text:string):boolean {
 const clean=text.trim();
 return ((clean.match(/[a-z]+/gi)??[]).length>=3||(clean.match(/[\u3400-\u9fff]/g)??[]).length>=6) && clean.length>=8 && new Set(clean.toLowerCase().replace(/\s/g,'')).size>=7 && !/^(?:test|hello|okay|yes|no|idk|不知道|不确定|不会|好的|嗯|[.?!。？！\s])+$/i.test(clean);
}
export interface Signals {uncertain:boolean; productive:boolean; evidence:boolean; reasoning:boolean; critical:boolean; assumption:boolean; empty:boolean; repeated:boolean}
/** Deterministic baseline. A future semantic classifier can implement this same contract. */
export function detectSignals(input:string,stage:StageId,previous:string[]=[]):Signals {
 const text=input.replace(/^Regarding this unverified claim:[\s\S]*?\n\n/,'');
 const repeated=previous.some(p=>p.trim().toLowerCase()===text.trim().toLowerCase());
 const uncertain=uncertainty.test(text);
 const critical=/disagree|might not be true|need evidence|how do we know|want to test|contradict|不同意|不一定|需要证据|怎么知道|想.*验证|矛盾/i.test(text);
 const evidence=critical||/evidence|observed|measured|\d.*(?:cm|metre|meter|mm|seconds|trials)|证据|观察到|测得|数据|结果/i.test(text);
 const reasoning=/because|therefore|so that|since|because of|因为|所以|因此|说明|为了/i.test(text);
 const productive=!repeated&&!uncertain&&(meaningful(text)||critical)&&(stageTerms[stage].test(text)||critical);
 return {uncertain,productive,evidence:productive&&evidence,reasoning:productive&&reasoning,critical:critical&&!repeated,assumption:/always|never|all conditions|must be true|AI.*(?:right|correct)|总是|永远|所有|一定|AI.*正确/i.test(text),empty:!meaningful(text),repeated};
}
