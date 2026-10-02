import {READINESS_POLICY_VERSION} from '@/lib/stem/readiness';
import {SUPPORT_POLICY_VERSION,PROMPT_VERSION,type SupportPolicyVersion} from '@/lib/stem/supportLevels';
import {initialSnapshot,taskTrace,tick,durations,type ConfigSnapshot,type ActivityClock,type StartContext} from './reliability';
import {targetGradeBand} from '@/lib/stem/gradeBands';
import { demoTasks } from '@/data/tasks';
import type { CoachMetadata, StageId, STEMTask, SupportLevel, TaskType } from '@/types';
import type { ResearchConfig, Condition } from './config';
import { initialLevel } from './config';
export type Initiator='STUDENT'|'SYSTEM_RECOMMENDATION'|'RESEARCH_CONDITION';
export type EventType='STAGE_READY'|'STAGE_OVERRIDE'|'CONFIG_CHANGED'|'WINDOW_HIDDEN'|'WINDOW_VISIBLE'|'IDLE_STARTED'|'ACTIVITY_RESUMED'|'USAGE_LIMIT_REACHED'|'COMPLIANCE_CHECK_PASSED'|'COMPLIANCE_REGENERATION'|'COMPLIANCE_FALLBACK_DEMO'|'AI_REQUEST_STARTED'|'STUDY_METADATA_UPDATED'|'SESSION_STARTED'|'SESSION_COMPLETED'|'SESSION_ENDED'|'TASK_CHANGED'|'STAGE_ENTERED'|'STAGE_COMPLETED'|'STAGE_REOPENED'|'MESSAGE_SENT'|'AI_RESPONSE'|'AI_ERROR'|'SUPPORT_CHANGED'|'ESCALATION_SUGGESTED'|'ESCALATION_ACCEPTED'|'ESCALATION_REJECTED'|'FADING_SUGGESTED'|'FADING_ACCEPTED'|'FADING_REJECTED'|'ARTIFACT_UPDATED'|'AI_CHALLENGE_STARTED'|'AI_CHALLENGE_RESPONSE'|'AI_CHALLENGE_FOLLOW_UP'|'WORKSPACE_RESTORED';
export type Choice='AGREE'|'DISAGREE'|'NEED_EVIDENCE';
export interface EventData {
 diagnostic?:string;reasonCategory?:string;readinessSource?:import('@/lib/stem/readiness').StageReadinessAssessment['source'];ready?:boolean;
 coach?:CoachMetadata;
 settings?:ResearchConfig;learnerSignal?:string[];pedagogicalDecision?:string;supportRecommendation?:SupportLevel;
 initiator?:Initiator;studentAction?:string;systemAction?:string;messageText?:string;
 aiChallengeTriggered?:boolean;fadingSuggested?:boolean;fadingAccepted?:boolean;
 escalationSuggested?:boolean;escalationAccepted?:boolean;artifactType?:string;stageCompleted?:boolean;
 learnerChoice?:Choice;followUpAction?:'TEST'|'REASON'|'REQUEST_HELP';
 laterRevision?:'ACCEPTED_CLAIM'|'REJECTED_CLAIM'|'UNCERTAIN';challengeId?:string;
}
export interface InteractionEvent extends EventData {eventId:string;sessionId:string;timestamp:string;taskId:string;stage:StageId;condition:Condition;supportLevel:SupportLevel;eventType:EventType}
export interface TaskRun {targetGradeBand?:import("@/types").TargetGradeBand;taskDefinitionId:string;taskRevision:number;taskSnapshotHash:string;taskId:string;taskRunId?:string;definitionId?:string;catalogTaskId?:string;type:TaskType;startedAt:string;completedAt?:string;completedStages:StageId[];title?:string;description?:string}
export interface StageTiming {taskId:string;stage:StageId;stageEnteredAt:string;stageExitedAt?:string;durationMs:number}
export interface SupportChange {timestamp:string;taskId:string;stage:StageId;from?:SupportLevel;to:SupportLevel;initiator:Initiator}
export interface ArtifactRevision {taskId:string;stage:StageId;artifactType:string;version:number;timestamp:string;characterCount:number;text?:string}
export interface ResearchSession {
 interfaceLanguage?:"zh-CN"|"en";taskLanguage?:"zh-CN"|"en";
 schemaVersion:'0.6';stempathVersion:'0.6'|'0.6.2'|'0.7';promptVersion:'deepseek-v2'|'young-learner-v3'|'young-learner-v4'|'young-learner-v5';readinessPolicyVersion?:'gentle-v1';supportPolicyVersion?:SupportPolicyVersion;provider:string;model:string;taskDefinitionVersion:number;
 participantCode?:string;baselineMeasures:Record<string,number>;outcomeMeasures:Record<string,number>;configSnapshot:ConfigSnapshot;activity:ActivityClock;elapsedDurationMs:number;activeDurationMs:number;usage:{aiCalls:number;inputTokens:number;outputTokens:number;totalTokens:number};
 sessionId:string;startedAt:string;updatedAt:string;completedAt?:string;endedAt?:string;endReason?:'RESET'|'CONDITION_CHANGE'|'SUPPORT_POLICY_CHANGE'|'READINESS_POLICY_CHANGE';condition:Condition;config:ResearchConfig;
 language:'en'|'zh';currentStage:StageId;supportLevel:SupportLevel;taskId:string;completedStages:StageId[];
 interactionCount:number;events:InteractionEvent[];tasks:TaskRun[];stageTimings:StageTiming[];
 supportHistory:SupportChange[];artifactRevisions:ArtifactRevision[];droppedEvents:number;
}
export const stamp=(ms:number)=>new Date(ms).toISOString();
const uuid=()=>crypto.randomUUID();
// Stable pseudonymous identifier, not encryption; custom IDs are omitted from exports.
function definitionId(id:string){let a=2166136261,b=5381;for(const c of id){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0);}return `task-${(a>>>0).toString(16)}${(b>>>0).toString(16)}`;}
function metadata(task:STEMTask,config:ResearchConfig,now:number):TaskRun {
 // Random run ID rather than potentially identifying custom task IDs/titles.
 const runId=uuid();return {...taskTrace(task),targetGradeBand:targetGradeBand(task),taskDefinitionId:definitionId(task.id),taskId:runId,taskRunId:runId,definitionId:definitionId(task.id),catalogTaskId:demoTasks.find(t=>t.id===task.id&&t.title===task.title&&t.description===task.description)?.id,type:task.type,startedAt:stamp(now),completedStages:[],...(config.storeMessageText?{title:task.title,description:task.description}:{})};
}
export function recordEvent(s:ResearchSession,eventType:EventType,data:EventData={},now=Date.now(),stage=s.currentStage,level=s.supportLevel):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 if(eventType==='STAGE_READY'&&s.events.some(e=>e.eventType==='STAGE_READY'&&e.taskId===s.taskId&&e.stage===stage))return s;
 const {messageText,...meta}=data;
 const event:InteractionEvent={...meta,eventId:uuid(),sessionId:s.sessionId,timestamp:stamp(now),taskId:s.taskId,stage,condition:s.condition,supportLevel:level,eventType,...(s.config.storeMessageText&&messageText!==undefined?{messageText:messageText.slice(0,4000)}:{})};
 const events=[...s.events,event];
 return {...s,updatedAt:stamp(now),interactionCount:s.interactionCount+1,events:events.slice(-5000),droppedEvents:s.droppedEvents+Math.max(0,events.length-5000)};
}
export function startSession(task:STEMTask,config:ResearchConfig,now=Date.now(),context:StartContext={interfaceLanguage:'en',taskLanguage:'en',provider:'auto',model:'pending'}):ResearchSession {
 const run=metadata(task,config,now),level=initialLevel(config.condition,config.initialSupportLevel);
 return recordEvent({schemaVersion:'0.6',stempathVersion:'0.7',promptVersion:PROMPT_VERSION,supportPolicyVersion:SUPPORT_POLICY_VERSION,readinessPolicyVersion:READINESS_POLICY_VERSION,provider:context.provider,model:context.model,taskDefinitionVersion:task.taskRevision??1,interfaceLanguage:context.interfaceLanguage,taskLanguage:context.taskLanguage,baselineMeasures:{},outcomeMeasures:{},configSnapshot:{...initialSnapshot(task,config,now,context),taskDefinitionId:run.taskDefinitionId},activity:{lastTick:now,lastActivity:now,activeDurationMs:0,visible:true,idle:false},elapsedDurationMs:0,activeDurationMs:0,usage:{aiCalls:0,inputTokens:0,outputTokens:0,totalTokens:0},sessionId:uuid(),startedAt:stamp(now),updatedAt:stamp(now),condition:config.condition,config:{...config},language:'en',currentStage:'understand',supportLevel:level,taskId:run.taskId,completedStages:[],interactionCount:0,events:[],tasks:[run],stageTimings:[{taskId:run.taskId,stage:'understand',stageEnteredAt:stamp(now),durationMs:0}],supportHistory:[{timestamp:stamp(now),taskId:run.taskId,stage:'understand',to:level,initiator:'RESEARCH_CONDITION'}],artifactRevisions:[],droppedEvents:0},'SESSION_STARTED',{settings:{...config}},now);
}
function closeStage(s:ResearchSession,now:number):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 return {...s,activity:tick(s.activity,now,s.config.idleThresholdMs),stageTimings:s.stageTimings.map(t=>t.stageExitedAt?t:{...t,stageExitedAt:stamp(now),durationMs:Math.max(0,now-Date.parse(t.stageEnteredAt))})};
}
export function enterStage(s:ResearchSession,stage:StageId,now=Date.now()):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 if(stage===s.currentStage||s.completedAt)return s;
 const next=closeStage(s,now);
 return recordEvent({...next,currentStage:stage,stageTimings:[...next.stageTimings,{taskId:s.taskId,stage,stageEnteredAt:stamp(now),durationMs:0}]},'STAGE_ENTERED',{},now);
}
export function changeTask(s:ResearchSession,task:STEMTask,now=Date.now()):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 if(s.completedAt)return s;
 const next=closeStage(s,now),run=metadata(task,s.config,now),level=initialLevel(s.condition,s.config.initialSupportLevel);
 return recordEvent({...next,taskId:run.taskId,taskDefinitionVersion:run.taskRevision,currentStage:'understand',completedStages:[],supportLevel:level,tasks:[...next.tasks,run],stageTimings:[...next.stageTimings,{taskId:run.taskId,stage:'understand',stageEnteredAt:stamp(now),durationMs:0}],supportHistory:[...next.supportHistory,{timestamp:stamp(now),taskId:run.taskId,stage:'understand',to:level,initiator:'RESEARCH_CONDITION'}]},'TASK_CHANGED',{},now);
}
export function changeSupport(s:ResearchSession,to:SupportLevel,initiator:Initiator,now=Date.now()):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 if(to===s.supportLevel||s.completedAt)return s;
 return recordEvent({...s,supportLevel:to,supportHistory:[...s.supportHistory,{timestamp:stamp(now),taskId:s.taskId,stage:s.currentStage,from:s.supportLevel,to,initiator}]},'SUPPORT_CHANGED',{initiator},now);
}
export function completeStage(s:ResearchSession,stage:StageId,complete=true,now=Date.now()):ResearchSession {
 if(s.completedStages.includes(stage)===complete)return s;
 const completedStages=complete?[...new Set([...s.completedStages,stage])]:s.completedStages.filter(id=>id!==stage);
 return recordEvent({...s,completedStages,tasks:s.tasks.map(t=>t.taskId===s.taskId?{...t,completedStages}:t)},complete?'STAGE_COMPLETED':'STAGE_REOPENED',{stageCompleted:complete},now,stage);
}
export function finishSession(s:ResearchSession,now=Date.now()):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 if(s.completedAt)return s;
 return recordEvent({...closeStage(s,now),completedAt:stamp(now),tasks:s.tasks.map(t=>t.taskId===s.taskId?{...t,completedAt:stamp(now)}:t)},'SESSION_COMPLETED',{},now);
}
export function reviseArtifact(s:ResearchSession,stage:StageId,field:string,value:string,now=Date.now()):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 const version=s.artifactRevisions.filter(r=>r.taskId===s.taskId&&r.stage===stage&&r.artifactType===field).length+1;
 const revision:ArtifactRevision={taskId:s.taskId,stage,artifactType:field,version,timestamp:stamp(now),characterCount:value.length,...(s.config.storeMessageText?{text:value.slice(0,400)}:{})};
 return recordEvent({...s,artifactRevisions:[...s.artifactRevisions,revision]},'ARTIFACT_UPDATED',{artifactType:field},now,stage);
}
/** OFF purges previously captured free text from this session, not just future events. */
export function setTextStorage(s:ResearchSession,enabled:boolean):ResearchSession {
 const next={...s,config:{...s.config,storeMessageText:enabled}};
 if(enabled)return recordEvent(next,'CONFIG_CHANGED',{systemAction:'TEXT_STORAGE_ON',settings:next.config});
 return recordEvent({...next,events:s.events.map(({messageText: _text,...event})=>{void _text;return event}),artifactRevisions:s.artifactRevisions.map(({text:_text,...revision})=>{void _text;return revision}),tasks:s.tasks.map(({title:_title,description:_description,...task})=>{void _title;void _description;return task})},'CONFIG_CHANGED',{systemAction:'TEXT_STORAGE_OFF',settings:next.config});
}
export function snapshot(s:ResearchSession,now=Date.now()):ResearchSession {
 // Saved-session export must include heartbeat time after the last structured event.
 now=Math.max(now,s.activity.lastTick,Date.parse(s.updatedAt));
 return {...s,...durations(s,now),stageTimings:s.stageTimings.map(t=>t.stageExitedAt?t:{...t,durationMs:Math.max(0,now-Date.parse(t.stageEnteredAt))})};
}
export function sessionSummary(s:ResearchSession){return {stages:s.completedStages.length,revisions:s.artifactRevisions.filter(r=>r.taskId===s.taskId&&r.version>1).length,evidence:s.events.filter(e=>e.taskId===s.taskId&&e.eventType==='MESSAGE_SENT'&&e.learnerSignal?.includes('evidence')).length,challenges:s.events.filter(e=>e.taskId===s.taskId&&e.eventType==='AI_CHALLENGE_RESPONSE').length,supportChanges:s.supportHistory.filter(h=>h.taskId===s.taskId&&h.from!==undefined).length};}

export function endSession(s:ResearchSession,reason:'RESET'|'CONDITION_CHANGE'|'SUPPORT_POLICY_CHANGE'|'READINESS_POLICY_CHANGE',now=Date.now()):ResearchSession {
 now=Math.max(now,Date.parse(s.updatedAt));
 if(s.completedAt||s.endedAt)return s;
 return recordEvent({...closeStage(s,now),endedAt:stamp(now),endReason:reason},'SESSION_ENDED',{systemAction:reason},now);
}
