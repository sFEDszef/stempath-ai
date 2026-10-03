import {stageIds} from '@/lib/stem/stages';
import type {Project} from './storage';
/** Completion UI follows the explicit saved project/session outcome, never readiness. */
export function shouldCelebrate(project:Pick<Project,'completed'|'completionCelebrationSeen'>,sessionCompleted:boolean,saved:boolean){
 return saved&&sessionCompleted&&!project.completionCelebrationSeen&&stageIds.every(stage=>project.completed.includes(stage));
}
