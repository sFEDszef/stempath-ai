import {conditions,parseResearchConfig} from './config';
import {stageIds} from '@/lib/stem/stages';
import {measures,participantPattern} from './traceability';
import type {ResearchSession} from './session';
export interface IntegrityReport {status:'PASS'|'PASS WITH WARNINGS'|'FAIL';errors:string[];warnings:string[];checks:string[]}
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&Date.parse(v)>=0;
const nonnegative=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
/** Fail closed at import boundaries. This checks consistency, not authenticity. */
export function validateSession(value:unknown):IntegrityReport {
 const errors:string[]=[],warnings:string[]=[],checks:string[]=[];
 const require=(ok:unknown,label:string)=>{if(!ok)errors.push(label);};
 try {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid session object');
  const s=value as ResearchSession;
  require(s.schemaVersion==='0.6'&&['0.6','0.6.2'].includes(s.stempathVersion),'Unsupported schema/app version');
  require(typeof s.sessionId==='string'&&/^[a-f0-9-]{36}$/i.test(s.sessionId),'Invalid session ID');
  require(s.participantCode===undefined||(typeof s.participantCode==='string'&&participantPattern.test(s.participantCode)),'Invalid participant code');
  measures(s.baselineMeasures);measures(s.outcomeMeasures);parseResearchConfig(s.config);
  require(conditions.includes(s.condition)&&s.config.condition===s.condition,'Invalid condition');
  require(date(s.startedAt)&&date(s.updatedAt)&&Date.parse(s.updatedAt)>=Date.parse(s.startedAt),'Invalid session timestamps');
  for(const end of [s.completedAt,s.endedAt])if(end!==undefined)require(date(end)&&Date.parse(end)>=Date.parse(s.startedAt),'Invalid end timestamp');
  require(stageIds.includes(s.currentStage)&&[1,2,3].includes(s.supportLevel),'Invalid current stage/support');
  require(Array.isArray(s.completedStages)&&s.completedStages.every(v=>stageIds.includes(v)),'Invalid completed stages');
  require(['zh-CN','en'].includes(s.interfaceLanguage!)&&['zh-CN','en'].includes(s.taskLanguage!),'Missing language');
  const initial=s.configSnapshot;
  require(!!initial&&date(initial.timestamp)&&initial.condition===s.condition&&!!initial.provider&&!!initial.model&&initial.promptVersion===s.promptVersion,'Invalid initial configuration');
  require(['en','zh-CN'].includes(initial.interfaceLanguage)&&['en','zh-CN'].includes(initial.taskLanguage),'Invalid initial languages');
  require(['fadingEnabled','escalationEnabled','AIChallengeEnabled','manualSupportChange','messageTextStorage'].every(k=>typeof initial[k as keyof typeof initial]==='boolean'),'Invalid initial policy');
  require(['maxAICallsPerSession','maxTokensPerSession','idleThresholdMs'].every(k=>Number.isSafeInteger(initial[k as keyof typeof initial])&&Number(initial[k as keyof typeof initial])>0),'Invalid initial limits');
  if(initial.provider==='auto'||initial.model==='pending')warnings.push('Initial provider availability was unresolved; use per-response metadata.');
  require(typeof s.provider==='string'&&s.provider.length>0&&typeof s.model==='string'&&s.model.length>0&&['deepseek-v2','young-learner-v3'].includes(s.promptVersion),'Missing provider metadata');
  require(Array.isArray(s.tasks)&&s.tasks.length>0&&s.tasks.length<=200,'Missing/oversized task runs');
  const runs=new Map(s.tasks.map(t=>[t.taskId,t]));require(runs.size===s.tasks.length&&runs.has(s.taskId),'Duplicate or missing task run');
  for(const t of s.tasks){require(t.taskId===t.taskRunId&&typeof t.taskDefinitionId==='string'&&!!t.taskDefinitionId&&Number.isSafeInteger(t.taskRevision)&&t.taskRevision>0&&typeof t.taskSnapshotHash==='string'&&/^fnv-[a-f0-9]+-[a-f0-9]+$/.test(t.taskSnapshotHash),'Invalid task trace');require(date(t.startedAt)&&t.completedStages.every(v=>stageIds.includes(v)),'Invalid task metadata');}
  require(s.tasks[0].taskDefinitionId===initial.taskDefinitionId&&s.tasks[0].taskRevision===initial.taskRevision,'Initial task snapshot mismatch');
  require(Array.isArray(s.events)&&s.events.length<=5000,'Invalid event collection');
  let previous=Date.parse(s.startedAt);const ids=new Set<string>(),claims=new Map<string,string>();
  for(const e of s.events){require(e.sessionId===s.sessionId&&runs.has(e.taskId)&&!ids.has(e.eventId)&&typeof e.eventId==='string','Cross-session/task or duplicate event');ids.add(e.eventId);require(date(e.timestamp)&&Date.parse(e.timestamp)>=previous,'Events not ordered');previous=Date.parse(e.timestamp);require(e.condition===s.condition&&stageIds.includes(e.stage)&&[1,2,3].includes(e.supportLevel),'Invalid event policy');
   if(e.eventType==='AI_CHALLENGE_STARTED'){require(!!e.challengeId&&!claims.has(e.challengeId),'Invalid challenge start');claims.set(e.challengeId!,e.taskId+e.stage);}
   if(['AI_CHALLENGE_RESPONSE','AI_CHALLENGE_FOLLOW_UP'].includes(e.eventType))require(!!e.challengeId&&claims.get(e.challengeId)===e.taskId+e.stage,'Unlinked challenge event');
   if(e.coach){require(['demo','deepseek'].includes(e.coach.provider)&&typeof e.coach.model==='string'&&e.coach.model.length>0&&['0.6','0.6.2'].includes(e.coach.STEMPathVersion)&&e.coach.promptVersion===s.promptVersion,'Invalid response metadata');require(e.coach.responseMode===(e.coach.provider==='demo'?'demo':'ai'),'Provider/mode mismatch');const u=e.coach.tokenUsage;if(u)require(Object.values(u).every(nonnegative)&&u.totalTokens===u.inputTokens+u.outputTokens,'Invalid response token usage');}
   if(!s.config.storeMessageText)require(e.messageText===undefined,'Text present with capture OFF');
  }
  for(const list of [s.supportHistory,s.artifactRevisions,s.stageTimings])require(Array.isArray(list)&&list.length<=20000,'Invalid history collection');
  let supportTime=0;for(const h of s.supportHistory){require(runs.has(h.taskId)&&stageIds.includes(h.stage)&&[1,2,3].includes(h.to)&&(h.from===undefined||[1,2,3].includes(h.from))&&date(h.timestamp)&&Date.parse(h.timestamp)>=supportTime,'Invalid support history');supportTime=Date.parse(h.timestamp);}
  const revisions=new Map<string,{version:number;time:number}>();for(const a of s.artifactRevisions){const k=a.taskId+a.stage+a.artifactType,last=revisions.get(k);require(runs.has(a.taskId)&&stageIds.includes(a.stage)&&date(a.timestamp)&&a.version===(last?.version??0)+1&&Date.parse(a.timestamp)>=(last?.time??0)&&nonnegative(a.characterCount),'Invalid artifact revision ordering');if(!s.config.storeMessageText)require(a.text===undefined,'Artifact text with capture OFF');revisions.set(k,{version:a.version,time:Date.parse(a.timestamp)});}
  for(const t of s.stageTimings)require(runs.has(t.taskId)&&stageIds.includes(t.stage)&&date(t.stageEnteredAt)&&nonnegative(t.durationMs)&&(!t.stageExitedAt||(date(t.stageExitedAt)&&Date.parse(t.stageExitedAt)>=Date.parse(t.stageEnteredAt))),'Invalid stage timing');
  require(!!s.activity&&[s.activity.lastTick,s.activity.lastActivity,s.activity.activeDurationMs,s.elapsedDurationMs,s.activeDurationMs].every(nonnegative)&&s.activeDurationMs<=s.elapsedDurationMs,'Invalid activity timing');
  require(!!s.usage&&Object.values(s.usage).every(nonnegative)&&Number.isSafeInteger(s.usage.aiCalls)&&s.usage.totalTokens===s.usage.inputTokens+s.usage.outputTokens,'Invalid usage summary');
  if(s.condition==='NO_AI')require(s.usage.aiCalls===0&&s.usage.totalTokens===0&&!s.events.some(e=>e.coach?.provider==='deepseek'||e.coach?.providerAttempted||e.eventType==='AI_ERROR'),'NO_AI has provider activity');
  if(!s.completedAt)warnings.push('Session not explicitly completed.');
  if(s.droppedEvents)warnings.push(`${s.droppedEvents} early events omitted.`);
  const idle=s.events.filter(e=>e.eventType==='IDLE_STARTED').length;if(idle)warnings.push(`${idle} idle period(s); timing estimates interaction, not attention.`);
  if(!errors.length)checks.push('Session metadata complete','Task revision recorded','Event sequence valid','Support/artifact history valid','Provider and usage metadata consistent');
 }catch{errors.push('Malformed or incomplete research data.');}
 return {status:errors.length?'FAIL':warnings.length?'PASS WITH WARNINGS':'PASS',errors:[...new Set(errors)],warnings,checks};
}
export function assertSession(value:unknown):asserts value is ResearchSession {const report=validateSession(value);if(report.status==='FAIL')throw Error('Research validation failed: '+report.errors.join('; '));}
