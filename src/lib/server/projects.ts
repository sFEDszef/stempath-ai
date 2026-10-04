import 'server-only';
import {unsafeAction,assessLocalReadiness,parseReadiness,READINESS_POLICY_VERSION} from '@/lib/stem/readiness';
import {verifiedReadiness,verifiedRound} from './readinessReceipt';
import {randomUUID} from 'node:crypto';
import type {DB} from './db';
import type {Account} from './accounts';
import {privileged} from './accounts';
import {fail} from './security';
import {newProject,parseProject,parseDialogue,type Project} from '@/lib/projects/storage';
import {loadTask} from '@/lib/stem/tasks';
import {stageIds} from '@/lib/stem/stages';
import {checkpointState,accessibleStage} from '@/lib/stem/stageCheckpoints';
import {canonical} from '@/lib/research/traceability';
import {SUPPORT_POLICY_VERSION,migrateSupportLevel,type SupportPolicyVersion} from '@/lib/stem/supportLevels';
import {parseResearchConfig,conditionConfig,initialLevel,type ResearchConfig} from '@/lib/research/config';
import type {StageId,STEMTask,Message} from '@/types';
export interface ServerProject extends Project {serverVersion:number;updatedAt:string;researchConfig:ResearchConfig;}
interface Row extends Record<string,unknown>{id:string;user_id:string;current_stage:StageId;support_level:1|2|3;support_policy_version:SupportPolicyVersion;readiness_policy_version:string;notebook:string;last_opened_at:Date;updated_at:Date;version:number;completion_celebration_seen:boolean;snapshot:STEMTask;research_config:ResearchConfig;}
export class Projects {
 constructor(private db:DB){}
 async owned(user:Account,id:string,lock=false){const [r]=await this.db.query<Row>('SELECT p.*,t.snapshot FROM projects p JOIN task_definitions t ON t.id=p.task_id WHERE p.id=$1 AND p.user_id=$2'+(lock?' FOR UPDATE OF p':''),[id,user.id]);if(!r)return fail(404,'Project not found');return r;}
 async task(input:unknown,actor:Account){const task=loadTask(input),revision=task.taskRevision??1,id=randomUUID();await this.db.query('INSERT INTO task_definitions (id,definition_id,revision,snapshot,created_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (definition_id,revision) DO NOTHING',[id,task.id,revision,JSON.stringify(task),actor.id]);const [r]=await this.db.query<{id:string;snapshot:STEMTask}&Record<string,unknown>>('SELECT id,snapshot FROM task_definitions WHERE definition_id=$1 AND revision=$2',[task.id,revision]);if(canonical(loadTask(r.snapshot))!==canonical(task))return fail(409,'This task revision already has a different snapshot');return r;}
 async assigned(user:Account){return this.db.query('SELECT a.id,a.condition,a.research_config,t.snapshot AS task FROM task_assignments a JOIN task_definitions t ON t.id=a.task_id WHERE a.user_id=$1 ORDER BY a.created_at',[user.id]);}
 async assign(actor:Account,userId:string,input:unknown,configInput:unknown){privileged(actor);const config=parseResearchConfig(configInput);const [student]=await this.db.query('SELECT id FROM users WHERE id=$1 AND role=\'STUDENT\' AND status=\'ACTIVE\'',[userId]);if(!student)return fail(404,'Student not found');const t=await this.task(input,actor);return this.db.query('INSERT INTO task_assignments (id,user_id,task_id,condition,research_config) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id,task_id) DO UPDATE SET condition=$4,research_config=$5,updated_at=now() RETURNING id',[randomUUID(),userId,t.id,config.condition,JSON.stringify(config)]);}
 async create(user:Account,input:unknown,browsing:'OPEN'|'ASSIGNED',configInput?:unknown){
  const task=loadTask(input),assigned=await this.db.query<{id:string;task_id:string;research_config:ResearchConfig;snapshot:STEMTask}&Record<string,unknown>>('SELECT a.*,t.snapshot FROM task_assignments a JOIN task_definitions t ON t.id=a.task_id WHERE a.user_id=$1 AND t.definition_id=$2 AND t.revision=$3',[user.id,task.id,task.taskRevision??1]);
  const a=assigned[0];if(browsing==='ASSIGNED'&&user.role==='STUDENT'&&!a)return fail(403,'This task is not assigned to you');if(a&&canonical(loadTask(a.snapshot))!==canonical(task))return fail(400,'Assigned task snapshot cannot be changed');
  const t=a?{id:a.task_id}:await this.task(task,user),config=a?parseResearchConfig(a.research_config):user.role!=='STUDENT'&&configInput?parseResearchConfig(configInput):conditionConfig(),p=newProject(task);p.level=initialLevel(config.condition,config.initialSupportLevel);
  await this.db.transaction(async db=>{await db.query('INSERT INTO projects (id,user_id,task_id,assignment_id,current_stage,support_level,last_opened_at,research_config,support_policy_version,readiness_policy_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[p.id,user.id,t.id,a?.id??null,p.active,p.level,p.lastOpenedAt,JSON.stringify(config),SUPPORT_POLICY_VERSION,READINESS_POLICY_VERSION]);await new Projects(db).writeState(p);});return this.get(user,p.id);
 }
 async writeState(p:Project){
  for(const stage of stageIds){const status=p.completed.includes(stage)?'COMPLETED':p.readiness[stage]?.ready?'READY':checkpointState(p.task,stage,p.records).status;await this.db.query('INSERT INTO project_stage_state (project_id,stage,status,challenge,readiness) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (project_id,stage) DO UPDATE SET status=$3,challenge=$4,readiness=$5,updated_at=now()',[p.id,stage,status,JSON.stringify(p.challenges[stage]??null),JSON.stringify(p.readiness[stage]??null)]);}
  // A version-checked transaction makes this full snapshot replacement atomic.
  await this.db.query('DELETE FROM messages WHERE project_id=$1',[p.id]);await this.db.query('DELETE FROM learning_records WHERE project_id=$1',[p.id]);
  for(const stage of stageIds){let position=0;for(const m of p.conversations[stage]??[]){if(m.id.length>100||m.text.length>16000)return fail(400,'Message too long');await this.db.query('INSERT INTO messages (project_id,id,stage,role,text,suggestions,position,dialogue) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',[p.id,m.id,stage,m.role,m.text,JSON.stringify(m.suggestions??[]),position++,JSON.stringify(m.dialogue??null)]);}for(const [field,value] of Object.entries(p.records[stage]??{}))await this.db.query('INSERT INTO learning_records (project_id,stage,field,value) VALUES ($1,$2,$3,$4)',[p.id,stage,field,value]);}
 }
 async get(user:Account,id:string):Promise<ServerProject>{return this.db.transaction(db=>new Projects(db).reconstruct(user,id));}
 private async reconstruct(user:Account,id:string):Promise<ServerProject>{let r=await this.owned(user,id,true);
 if(r.support_policy_version!==SUPPORT_POLICY_VERSION){
  const level=migrateSupportLevel(r.support_level,r.support_policy_version);
  const [updated]=await this.db.query<Row>('UPDATE projects SET support_level=$2,support_policy_version=$3,version=version+1,updated_at=now() WHERE id=$1 RETURNING *',[id,level,SUPPORT_POLICY_VERSION]);
  r={...r,...updated};
 }
 const [stages,messages,records]=await Promise.all([this.db.query('SELECT * FROM project_stage_state WHERE project_id=$1',[id]),this.db.query('SELECT * FROM messages WHERE project_id=$1 ORDER BY stage,position',[id]),this.db.query('SELECT * FROM learning_records WHERE project_id=$1',[id])]);const p=newProject(r.snapshot);p.id=id;p.active=r.current_stage;p.level=r.support_level;p.supportPolicyVersion=r.support_policy_version;p.notebook=r.notebook;p.lastOpenedAt=new Date(r.last_opened_at).toISOString();p.completionCelebrationSeen=r.completion_celebration_seen;p.completed=stages.filter(s=>s.status==='COMPLETED').map(s=>s.stage as StageId);for(const s of stages){const id=s.stage as StageId;const a=parseReadiness(s.readiness,id,(s.readiness as {source?:'AI_SEMANTIC'|'DEMO'|'LOCAL_RECORD'}|undefined)?.source??'LOCAL_RECORD');if(a)p.readiness[id]=a;}for(const s of stages)if(s.challenge)p.challenges[s.stage as StageId]=s.challenge as Project['challenges'][StageId];for(const m of messages){const stage=m.stage as StageId;(p.conversations[stage]??=[]).push({id:String(m.id),role:m.role as Message['role'],text:String(m.text),...(m.dialogue?{dialogue:parseDialogue(m.dialogue)}:{}),...(m.role==='assistant'&&Array.isArray(m.suggestions)&&m.suggestions.length?{suggestions:m.suggestions as string[]}: {})});}for(const l of records)(p.records[l.stage as StageId]??={})[String(l.field)]=String(l.value);const restored=parseProject(p);
 if(r.readiness_policy_version!==READINESS_POLICY_VERSION){if(!['checkpoint-v1','gentle-v1'].includes(r.readiness_policy_version))return fail(400,'Unsupported readiness policy');if(!r.snapshot.progressionCriteria)await this.db.query('UPDATE task_definitions SET snapshot=$2 WHERE id=$1',[r.task_id,JSON.stringify(restored.task)]);await this.writeState(restored);const [updated]=await this.db.query<Row>('UPDATE projects SET readiness_policy_version=$2,version=version+1,updated_at=now() WHERE id=$1 RETURNING *',[id,READINESS_POLICY_VERSION]);r={...r,...updated};}
 return {...restored,serverVersion:r.version,updatedAt:new Date(r.updated_at).toISOString(),researchConfig:parseResearchConfig(r.research_config)};}
 async list(user:Account){const rows=await this.db.query('SELECT id FROM projects WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 200',[user.id]);return Promise.all(rows.map(r=>this.get(user,String(r.id))));}
 async save(user:Account,id:string,input:unknown,version:unknown){const p=parseProject(input);if(p.id!==id||!Number.isSafeInteger(version)||Number(version)<1||p.notebook.length>32000)return fail(400,'Invalid project snapshot');
  await this.db.transaction(async db=>{const store=new Projects(db),old=await store.get(user,id);if(canonical(old.task)!==canonical(p.task))return fail(400,'Project task snapshot cannot be changed');if(old.serverVersion!==version)return fail(409,'A newer project is saved. Reload before continuing. / 项目已在别处更新，请重新打开。');
   // Clients cannot forge a semantic READY receipt. Deterministic notes/conversations remain usable without AI.
   p.readinessPolicyVersion=READINESS_POLICY_VERSION;
   for(const stage of stageIds){
    const oldMessages=old.conversations[stage]??[],ids=new Set(oldMessages.map(m=>m.id));
    const turns=p.conversations[stage]??[];
    for(const [index,m] of turns.entries()){
     if(ids.has(m.id)){const prior=oldMessages.find(x=>x.id===m.id)!;if(m.text!==prior.text||m.role!==prior.role)return fail(400,'Saved dialogue cannot be rewritten');m.dialogue=prior.dialogue;continue;}
     if(m.role==='assistant'&&m.dialogue?.successful&&m.dialogue.intent==='chat'){const student=turns.slice(0,index).find(t=>t.role==='student'&&t.id===m.dialogue?.replyTo);if(!student||!verifiedRound(id,p.task,stage,student,m))return fail(400,'Unverified coach completion');}
     if(m.role==='assistant'&&m.dialogue&&m.dialogue.intent!=='chat')m.dialogue={...m.dialogue,successful:false};
     // New unannotated assistant bubbles are never migration evidence.
     if(m.role==='assistant'&&!m.dialogue)m.dialogue={intent:'chat',successful:false};
    }
    const candidate=p.readiness[stage],semantic=verifiedReadiness(id,stage,candidate)?candidate:old.readiness[stage];
    p.readiness[stage]=assessLocalReadiness(p.task,stage,p.records,p.conversations[stage],semantic?.source??'DEMO',semantic);
    if(candidate?.promptSeen||old.readiness[stage]?.promptSeen)p.readiness[stage]!.promptSeen=true;
   }
   for(const stage of p.completed)if(!old.completed.includes(stage)&&[...Object.values(p.records[stage]??{}),p.conversations[stage]?.filter(m=>m.role==='student').at(-1)?.text??''].some(t=>unsafeAction(p.task,t)))return fail(400,'Address the unsafe action before continuing');
   if(user.role==='STUDENT'){if(!accessibleStage(p.active,old.active,p.completed))return fail(400,'Complete the earlier stage first');for(const stage of p.completed)if(!old.completed.includes(stage)&&(!p.readiness[stage]?.ready||!stageIds.slice(0,stageIds.indexOf(stage)).every(s=>p.completed.includes(s))))return fail(400,'Five successful meaningful rounds and the task rubric are needed');}
   if(old.researchConfig.condition==='NO_AI'&&(Object.values(p.challenges).some(c=>c?.claim)||Object.values(p.conversations).some(v=>v?.some(m=>m.role==='assistant'))))return fail(400,'AI is disabled for this assignment');
   const [updated]=await db.query('UPDATE projects SET current_stage=$3,support_level=$4,notebook=$5,last_opened_at=$6,status=$7,completion_celebration_seen=$9,version=version+1,updated_at=now() WHERE id=$1 AND user_id=$2 AND version=$8 RETURNING id',[id,user.id,p.active,p.level,p.notebook,p.lastOpenedAt,p.completed.length===7?'COMPLETED':'ACTIVE',version,old.completionCelebrationSeen||(p.completed.length===7&&p.completionCelebrationSeen)]);if(!updated)return fail(409,'Project conflict');await store.writeState(p);
  });return this.get(user,id);
 }
 async remove(user:Account,id:string,confirmation:unknown){if(confirmation!=='DELETE PROJECT')return fail(400,'Confirm project deletion');const [r]=await this.db.query('DELETE FROM projects WHERE id=$1 AND user_id=$2 RETURNING id',[id,user.id]);if(!r)return fail(404,'Project not found');}
 async status(actor:Account){privileged(actor);return this.db.query(`SELECT u.id AS user_id,u.participant_code,p.id AS project_id,t.snapshot->>'title' AS task_title,p.current_stage,p.status,p.updated_at,COUNT(s.stage) FILTER (WHERE s.status='COMPLETED')::int AS completed FROM users u LEFT JOIN projects p ON p.user_id=u.id LEFT JOIN task_definitions t ON t.id=p.task_id LEFT JOIN project_stage_state s ON s.project_id=p.id WHERE u.role='STUDENT' GROUP BY u.id,p.id,t.snapshot ORDER BY u.participant_code LIMIT 1000`);}
}
