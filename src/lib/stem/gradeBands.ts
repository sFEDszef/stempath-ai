import type {STEMTask,TargetGradeBand} from '@/types';
export const gradeBands:TargetGradeBand[]=['G3-4','G5-6','G7+'];
/** Unknown/mixed grade descriptions use the gentlest primary-school language. */
export function targetGradeBand(task:Pick<STEMTask,'targetGradeBand'|'gradeLevel'>):TargetGradeBand {
 if(task.targetGradeBand)return task.targetGradeBand;
 const grade=task.gradeLevel??'';
 if(/(?:三|四|3|4)\s*(?:年级|grade)|grade\s*[34]|grades?\s*[34]\s*[-–]/i.test(grade))return 'G3-4';
 if(/(?:五|六|5|6)\s*(?:年级|grade)|grade\s*[56]|grades?\s*[56]\s*[-–]/i.test(grade))return 'G5-6';
 if(/(?:七|八|九|十|7|8|9|10|11|12)\s*年级|grades?\s*(?:7|8|9|10|11|12)\b|secondary|high school|初中|高中/i.test(grade))return 'G7+';
 return 'G3-4';
}
export const gradeLanguage:Record<TargetGradeBand,string>={
 'G3-4':'Grade 3–4: short concrete sentences, one main idea and exactly one easy question per ordinary turn. Avoid constraints, assumptions, variables, uncertainty, interpretation and evidence standards (约束条件、证据标准、假设、变量、不确定性). If essential, explain the ordinary meaning immediately before naming the term. Say what did you see, what rule must you follow, what will you change. Never ask a compound question. A short purpose cue is allowed before the question.',
 'G5-6':'Grade 5–6: concise concrete language, one manageable question per turn. Introduce variable, fair comparison, evidence, prediction or measurement gradually with an immediate plain-language explanation. No university-level inquiry vocabulary or compound questions.',
 'G7+':'Grade 7+: concise age-appropriate STEM language; explain unfamiliar terms and leave decisions with the learner.'
};
