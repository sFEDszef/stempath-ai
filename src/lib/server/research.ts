import 'server-only';
import type {DB} from './db';
import type {Account} from './accounts';
import {privileged} from './accounts';
import {Projects} from './projects';
import {fail} from './security';
import {assertSession} from '@/lib/research/integrity';
import {setTextStorage,type ResearchSession} from '@/lib/research/session';
import {canonical} from '@/lib/research/traceability';
import {exportBundle} from '@/lib/research/export';
const top=['schemaVersion','stempathVersion','supportPolicyVersion','readinessPolicyVersion','promptVersion','provider','model','taskDefinitionVersion','participantCode','baselineMeasures','outcomeMeasures','configSnapshot','activity','elapsedDurationMs','activeDurationMs','usage','sessionId','startedAt','updatedAt','completedAt','endedAt','endReason','condition','config','language','currentStage','supportLevel','taskId','completedStages','interactionCount','events','tasks','stageTimings','supportHistory','artifactRevisions','droppedEvents','interfaceLanguage','taskLanguage'];
const pick=(v:Record<string,unknown>,keys:string[])=>Object.fromEntries(keys.filter(k=>v[k]!==undefined).map(k=>[k,v[k]]));
const eventKeys=['meaningfulRounds','requiredRounds','criteriaSatisfiedCount','criteriaRequiredCount','readinessPolicyVersion','taskRevision','eventId','sessionId','timestamp','taskId','stage','condition','supportLevel','eventType','diagnostic','reasonCategory','readinessSource','ready','coach','settings','learnerSignal','pedagogicalDecision','supportRecommendation','initiator','studentAction','systemAction','messageText','aiChallengeTriggered','fadingSuggested','fadingAccepted','escalationSuggested','escalationAccepted','artifactType','stageCompleted','learnerChoice','followUpAction','laterRevision','challengeId'];
const taskKeys=['targetGradeBand','taskDefinitionId','taskRevision','taskSnapshotHash','taskId','taskRunId','definitionId','catalogTaskId','type','startedAt','completedAt','completedStages','title','description'];
/** No account/security row is merged into an export. Reject extra nested security fields. */
export function cleanResearch(input:unknown):ResearchSession {
 if(!input||typeof input!=='object'||Array.isArray(input))return fail(400,'Invalid research session');
 const value=pick(input as Record<string,unknown>,top) as unknown as ResearchSession;
 if(!Array.isArray(value.events)||!Array.isArray(value.tasks))return fail(400,'Invalid research session');
 value.events=value.events.map(e=>pick(e as unknown as Record<string,unknown>,eventKeys)) as unknown as ResearchSession['events'];
 value.tasks=value.tasks.map(t=>pick(t as unknown as Record<string,unknown>,taskKeys)) as unknown as ResearchSession['tasks'];
 // The schema checker verifies nested enums, timing, usage and relationships. Whitelist each nested shape as well.
 const nested:Record<string,string[]>={config:['maxAICallsPerSession','maxTokensPerSession','idleThresholdMs','condition','storeMessageText','enableAIChallenge','enableFading','enableEscalation','allowManualSupportChange','randomTaskMode','seed','initialSupportLevel'],configSnapshot:['timestamp','condition','provider','model','promptVersion','supportPolicyVersion','readinessPolicyVersion','taskDefinitionId','taskRevision','taskSnapshotHash','targetGradeBand','taskType','interfaceLanguage','taskLanguage','maxAICallsPerSession','maxTokensPerSession','idleThresholdMs','fadingEnabled','escalationEnabled','AIChallengeEnabled','manualSupportChange','messageTextStorage','randomTaskMode','seed','initialSupportLevel'],activity:['lastTick','lastActivity','activeDurationMs','visible','idle'],usage:['aiCalls','inputTokens','outputTokens','totalTokens'],coach:['STEMPathVersion','promptVersion','supportPolicyVersion','readinessPolicyVersion','provider','model','responseMode','tokenUsage','providerAttempted','compliance','diagnostic','fallbackReason'],tokenUsage:['inputTokens','outputTokens','totalTokens'],settings:['maxAICallsPerSession','maxTokensPerSession','idleThresholdMs','condition','storeMessageText','enableAIChallenge','enableFading','enableEscalation','allowManualSupportChange','randomTaskMode','seed','initialSupportLevel']};
 function walk(v:unknown):unknown{if(Array.isArray(v))return v.map(walk);if(!v||typeof v!=='object')return v;return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(nested[k]&&x&&typeof x==='object'?pick(x as Record<string,unknown>,nested[k]):x)]));}
 const s=walk(value) as ResearchSession;
 s.stageTimings=s.stageTimings.map(v=>pick(v as unknown as Record<string,unknown>,['taskId','stage','stageEnteredAt','stageExitedAt','durationMs'])) as unknown as ResearchSession['stageTimings'];
 s.supportHistory=s.supportHistory.map(v=>pick(v as unknown as Record<string,unknown>,['timestamp','taskId','stage','from','to','initiator'])) as unknown as ResearchSession['supportHistory'];
 s.artifactRevisions=s.artifactRevisions.map(v=>pick(v as unknown as Record<string,unknown>,['taskId','stage','artifactType','version','timestamp','characterCount','text'])) as unknown as ResearchSession['artifactRevisions'];
 assertSession(s);return s;
}
export class ResearchStore {
 constructor(private db:DB){}
 async save(user:Account,projectId:string,input:unknown,version:unknown){
  const project=await new Projects(this.db).get(user,projectId);let s=cleanResearch(input);
  if(canonical(s.config)!==canonical(project.researchConfig)||s.condition!==project.researchConfig.condition)return fail(400,'Assignment research policy cannot be changed');
  s={...s,participantCode:user.participantCode};if(!project.researchConfig.storeMessageText&&s.config.storeMessageText)s=setTextStorage(s,false);
  assertSession(s);const payload=JSON.stringify(s);
  if(!Number.isSafeInteger(version)||Number(version)<0)return fail(400,'Invalid research version');
  return this.db.transaction(async db=>{
   const [old]=await db.query('SELECT * FROM research_sessions WHERE id=$1 FOR UPDATE',[s.sessionId]);
   if(old&&(old.user_id!==user.id||old.project_id!==projectId))return fail(404,'Session not found');
   if((old?old.version:0)!==version)return fail(409,'Research session conflict');
   const [r]=old?await db.query('UPDATE research_sessions SET snapshot=$2,version=version+1,updated_at=now() WHERE id=$1 RETURNING version',[s.sessionId,payload]):await db.query('INSERT INTO research_sessions (id,user_id,project_id,snapshot) VALUES ($1,$2,$3,$4) RETURNING version',[s.sessionId,user.id,projectId,payload]);
   await db.query('DELETE FROM research_events WHERE session_id=$1',[s.sessionId]);
   for(const e of s.events)await db.query('INSERT INTO research_events (session_id,event_id,event_type,payload,created_at) VALUES ($1,$2,$3,$4,$5)',[s.sessionId,e.eventId,e.eventType,JSON.stringify(e),e.timestamp]);
   return {version:r.version};
  });
 }
 async latest(user:Account,projectId:string){await new Projects(this.db).owned(user,projectId);const [row]=await this.db.query('SELECT snapshot,version FROM research_sessions WHERE user_id=$1 AND project_id=$2 ORDER BY created_at DESC LIMIT 1',[user.id,projectId]);return row?{session:row.snapshot,version:row.version}:null;}
 async export(actor:Account,userId:string){privileged(actor);const rows=await this.db.query('SELECT snapshot FROM research_sessions WHERE user_id=$1 ORDER BY created_at',[userId]);return rows.length?exportBundle(rows.map(r=>cleanResearch(r.snapshot))):JSON.stringify({schemaVersion:'0.6',sessions:[]});}
}
