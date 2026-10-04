import type {StageId} from '@/types';
import type {StageReadinessAssessment} from './readiness';
/** READY stays actionable until completion, including restored and previously dismissed projects. */
export function shouldPromptReady(stage:StageId,active:StageId,completed:StageId[],_previous:StageReadinessAssessment|undefined,next:StageReadinessAssessment){
 void _previous;
 return stage===active&&!completed.includes(stage)&&next.policyVersion==='task-rubric-v1'&&next.ready&&(next.meaningfulRounds??0)>=(next.requiredRounds??5)&&(next.requiredRounds??0)>=5&&next.missingCriteria?.length===0&&next.satisfiedCriteria?.length===next.criteriaRequiredCount;
}
export function readyPromptCopy(final:boolean,zh:boolean){
 return {
  title:zh?(final?'项目已经可以完成啦！ 🎉':'这一步已经够用了！ 🎉'):(final?'Your project is ready to finish! 🎉':'You’re ready for the next step! 🎉'),
  body:zh?(final?'你已经完成了最后一步的基本思考。\n点击完成项目，保存这次七阶段探究。':'你已经完成了这一步需要的基本思考。\n点击进入下一阶段，继续你的探究。'):(final?'You have enough for the final step.\nFinish the project to save your seven-stage journey.':'You have enough for this step.\nGo to the next stage to continue your exploration.'),
  advance:zh?(final?'完成项目':'进入下一阶段'):(final?'Finish Project':'Go to the Next Step'),
 };
}
