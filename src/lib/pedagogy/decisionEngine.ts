import type { ChatRequest, StageId, SupportLevel, STEMTask, LearningArtifacts } from '@/types';
import { artifactFields } from '@/lib/stem/stages';
import { detectSignals, meaningful, languageOf, type Signals, type Language } from './signals';
export interface LearnerState {
 taskId:string; currentStage:StageId; currentSupportLevel:SupportLevel;
 uncertaintyScore:number; stuckScore:number; progressScore:number; evidenceUseScore:number; independenceScore:number;
 consecutiveUncertaintySignals:number; consecutiveProductiveResponses:number; turns:number;
 meaningfulArtifacts:number; fadingRecommended:boolean; strongerSupportRecommended:boolean; aiChallengeEligible:boolean;
 language:Language; signals:Signals; focus:'goal'|'condition'|'evidence'|'reasoning';
}
export type Action='ASK_SOCRATIC_QUESTION'|'GIVE_DIRECTIONAL_HINT'|'PROVIDE_STRUCTURED_SUPPORT'|'REQUEST_EVIDENCE'|'PROMPT_REFLECTION'|'RETURN_AGENCY'|'TRIGGER_AI_CHALLENGE';
export interface Decision {action:Action; recommendation?:SupportLevel; reason?:'stronger'|'fade'; challengeEligible:boolean; state:LearnerState}
export function artifactProgress(task:STEMTask,stage:StageId,records:LearningArtifacts) {
 const fields=artifactFields(task,stage);
 return fields.filter(field=>{const text=records[stage]?.[field]??'';return meaningful(text)&&!detectSignals(text,stage).uncertain;});
}
export function readiness(task:STEMTask,stage:StageId,records:LearningArtifacts) {
 const required=artifactFields(task,stage).slice(0,3);
 const done=artifactProgress(task,stage,records);
 return required.filter(field=>!done.includes(field));
}
/** Replays bounded, task-local student turns; no model or network dependency. Scores are indicators, not assessments. */
export function evaluateLearnerState(request:ChatRequest):LearnerState {
 const turns=[...request.history.filter(m=>m.role==='student').map(m=>m.text),...(request.message.trim()&&request.intent!=='support-change'&&request.intent!=='challenge'?[request.message]:[])].slice(-12);
 let uncertain=0,productive=0,total=0,evidence=0,independent=0,language:Language='en';
 let signals=detectSignals('',request.stage); const seen:string[]=[];
 for(const text of turns){signals=detectSignals(text,request.stage,seen);language=languageOf(text.replace(/^Regarding this unverified claim:[\s\S]*?\n\n/,''),language);seen.push(text);
 uncertain=signals.uncertain||signals.empty||signals.repeated?uncertain+1:0;
 productive=signals.productive?productive+1:0;
 if(signals.productive)total++;
 if(signals.evidence)evidence++;
 if(signals.productive&&(signals.reasoning||signals.critical))independent++;
 }
 const count=artifactProgress(request.task,request.stage,request.artifacts).length;
 const confused=uncertain>=2;
 const fading=request.level>1&&productive>=3&&independent>=2;
 const eligible=['imagine','plan','test','improve'].includes(request.stage)&&!confused&&!signals.uncertain&&total>=2&&(evidence>0||count>=2)&&(signals.assumption||signals.evidence||(request.task.successCriteria?.length??0)>0);
 return {taskId:request.task.id,currentStage:request.stage,currentSupportLevel:request.level,uncertaintyScore:Math.min(1,uncertain/3),stuckScore:Math.min(1,uncertain/3),progressScore:Math.min(1,(total+count)/6),evidenceUseScore:Math.min(1,evidence/3),independenceScore:Math.min(1,independent/3),consecutiveUncertaintySignals:uncertain,consecutiveProductiveResponses:productive,turns:turns.length,meaningfulArtifacts:count,fadingRecommended:fading,strongerSupportRecommended:confused&&request.level<3,aiChallengeEligible:eligible,language,signals,focus:request.stage==='understand'?(total>=2?'evidence':total>0?'condition':'goal'):evidence>0?'reasoning':'evidence'};
}
export function decidePedagogicalAction(request:ChatRequest):Decision {
 const state=evaluateLearnerState(request);
 const action:Action=request.intent==='challenge'&&state.aiChallengeEligible?'TRIGGER_AI_CHALLENGE':request.intent==='evaluate-claim'||state.signals.critical?'REQUEST_EVIDENCE':state.consecutiveProductiveResponses>=3&&state.independenceScore>=2/3?'RETURN_AGENCY':request.stage==='reflect'?'PROMPT_REFLECTION':request.level===1?'ASK_SOCRATIC_QUESTION':request.level===2?'GIVE_DIRECTIONAL_HINT':'PROVIDE_STRUCTURED_SUPPORT';
 return {state,action,recommendation:state.strongerSupportRecommended?(request.level+1) as SupportLevel:state.fadingRecommended?(request.level-1) as SupportLevel:undefined,reason:state.strongerSupportRecommended?'stronger':state.fadingRecommended?'fade':undefined,challengeEligible:state.aiChallengeEligible};
}

export function applySupportChoice(current:SupportLevel,recommended:SupportLevel|undefined,accepted:boolean):SupportLevel {return accepted&&recommended?recommended:current;}

/** Only engine-owned values enter provider instructions; raw task IDs stay in user data. */
export function providerStrategy(request:ChatRequest) {
 const d=decidePedagogicalAction(request);
 return {action:d.action,stage:request.stage,supportLevel:request.level,language:d.state.language,focus:d.state.focus,consecutiveUncertainty:d.state.consecutiveUncertaintySignals,productiveResponses:d.state.consecutiveProductiveResponses,meaningfulArtifacts:d.state.meaningfulArtifacts};
}
