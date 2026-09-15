import type { LearningArtifacts, StageId, SupportLevel } from '@/types';
export function canSuggestFading(level:SupportLevel,stage:StageId,artifacts:LearningArtifacts,turns:number){
 return level>1&&turns>=2&&Object.values(artifacts[stage]??{}).filter(v=>v.trim().length>=20).length>=2;
}
