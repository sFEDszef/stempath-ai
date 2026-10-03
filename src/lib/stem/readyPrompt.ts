import type {StageId} from '@/types';
import type {StageReadinessAssessment} from './readiness';
/** Only a new learner-evidence transition in the visible, unfinished stage interrupts. */
export function shouldPromptReady(stage:StageId,active:StageId,completed:StageId[],previous:StageReadinessAssessment|undefined,next:StageReadinessAssessment){
 return stage===active&&!completed.includes(stage)&&!previous?.ready&&!previous?.promptSeen&&next.ready;
}
export function readyPromptCopy(final:boolean,zh:boolean){
 return {
  title:zh?(final?'项目已经可以完成啦！ 🎉':'这一步已经够用了！ 🎉'):(final?'Your project is ready to finish! 🎉':'You’re ready for the next step! 🎉'),
  body:zh?'你已经完成了进入下一步需要的基本思考。\n你想现在继续，还是再想一想？':'You have enough to continue.\nWould you like to move on now, or keep thinking here?',
  advance:zh?(final?'完成项目':'进入下一阶段'):(final?'Finish Project':'Go to the Next Step'),
  stay:zh?(final?'我还想再想一想':'继续在本阶段想一想'):(final?'Keep Thinking':'Keep Thinking Here'),
 };
}
