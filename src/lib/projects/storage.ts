import {READINESS_POLICY_VERSION,restoreReadiness,type StageReadiness} from '@/lib/stem/readiness';
import {SUPPORT_POLICY_VERSION,migrateSupportLevel,type SupportPolicyVersion} from '@/lib/stem/supportLevels';
import {loadTask} from '@/lib/stem/tasks';
import {parseArtifacts} from '@/lib/stem/validation';
import {stageIds} from '@/lib/stem/stages';
import type {STEMTask,StageId,SupportLevel,LearningArtifacts,Message} from '@/types';
export const LIBRARY_KEY='stempath-task-library-v1';
export const PROJECTS_KEY='stempath-projects-v1';
export type Conversations=Partial<Record<StageId,Message[]>>;
export type ProjectProgress=Pick<Project,"active"|"completed"|"level"|"records"|"conversations"|"notebook"|"challenges"|"readiness"|"completionCelebrationSeen">;
export interface SavedChallenge {claim:string;choice:string;revision:string;mode:string;}
export interface Project {completionCelebrationSeen:boolean;storageVersion:2;readinessPolicyVersion:typeof READINESS_POLICY_VERSION;readiness:StageReadiness;supportPolicyVersion:SupportPolicyVersion;conversations:Conversations;notebook:string;challenges:Partial<Record<StageId,SavedChallenge>>;id:string;task:STEMTask;active:StageId;completed:StageId[];level:SupportLevel;records:LearningArtifacts;lastOpenedAt:string;}
export function newProject(task:STEMTask):Project{return {completionCelebrationSeen:false,storageVersion:2,readinessPolicyVersion:READINESS_POLICY_VERSION,readiness:{},supportPolicyVersion:SUPPORT_POLICY_VERSION,conversations:{},notebook:"",challenges:{},id:crypto.randomUUID(),task:loadTask(task),active:'understand',completed:[],level:2,records:{},lastOpenedAt:new Date().toISOString()};}
export function parseProject(value:unknown):Project {
 if(!value||typeof value!=='object')throw Error('Invalid project');const v=value as Project;
 if(v.readinessPolicyVersion!==undefined&&!['gentle-v1','checkpoint-v1',READINESS_POLICY_VERSION].includes(v.readinessPolicyVersion))throw Error('Unsupported readiness policy');
 if(typeof v.id!=='string'||!v.id||v.id.length>100||!stageIds.includes(v.active)||![1,2,3].includes(v.level)||!Array.isArray(v.completed)||v.completed.length>7||!v.completed.every(s=>stageIds.includes(s))||typeof v.lastOpenedAt!=='string'||!Number.isFinite(Date.parse(v.lastOpenedAt)))throw Error('Invalid project');
 if(v.completionCelebrationSeen!==undefined&&typeof v.completionCelebrationSeen!=='boolean')throw Error('Invalid celebration state');
 return {completionCelebrationSeen:v.completionCelebrationSeen??stageIds.every(s=>v.completed.includes(s)),storageVersion:2,readinessPolicyVersion:READINESS_POLICY_VERSION,readiness:restoreReadiness(loadTask(v.task),parseArtifacts(v.records),parseConversations(v.conversations),v.readiness),supportPolicyVersion:SUPPORT_POLICY_VERSION,conversations:parseConversations(v.conversations),notebook:typeof v.notebook==='string'?v.notebook:"",challenges:parseChallenges(v.challenges),id:v.id,task:loadTask(v.task),active:v.active,completed:[...new Set(v.completed)],level:migrateSupportLevel(v.level,v.supportPolicyVersion),records:parseArtifacts(v.records),lastOpenedAt:v.lastOpenedAt};
}
export function readCollection<T>(raw:string|null,parse:(v:unknown)=>T):T[]{if(!raw)return [];try{const value=JSON.parse(raw);if(!Array.isArray(value)||value.length>200)return [];return value.flatMap(item=>{try{return [parse(item)];}catch{return [];}});}catch{return [];}}
export function importTasks(raw:string):STEMTask[]{const data=JSON.parse(raw);const items=Array.isArray(data)?data:[data];if(!items.length||items.length>100)throw Error('Invalid import');return items.map(loadTask);}
export function duplicateTask(task:STEMTask,suffix:string):STEMTask{return loadTask({...task,id:crypto.randomUUID(),taskRevision:1,title:task.title.slice(0,140)+suffix,translations:undefined});}
export function exportTasks(tasks:STEMTask[]){return JSON.stringify(tasks.map(loadTask),null,2);}

/** Whitelist learner-visible fields. Provider/system payloads never enter project persistence. */
export function parseConversations(input:unknown):Conversations {
 const result:Conversations={};if(!input||typeof input!=='object')return result;
 for(const stage of stageIds){const messages=(input as Record<string,unknown>)[stage];if(!Array.isArray(messages))continue;
 const ids=new Set<string>();result[stage]=messages.flatMap((m:unknown)=>{if(!m||typeof m!=='object')return [];const v=m as Message;
 if(typeof v.id!=='string'||ids.has(v.id)||!['student','assistant'].includes(v.role)||typeof v.text!=='string'||!v.text.trim())return [];ids.add(v.id);
 return [{id:v.id,role:v.role,text:v.text,...(v.dialogue?{dialogue:parseDialogue(v.dialogue)}:{}),...(Array.isArray(v.suggestions)?{suggestions:v.suggestions.filter(x=>typeof x==='string').slice(0,6)}:{})}];});
 }return result;
}
function parseChallenges(input:unknown):Project['challenges'] {const result:Project['challenges']={};if(!input||typeof input!=='object')return result;for(const stage of stageIds){const v=(input as Record<string,SavedChallenge>)[stage];if(v&&typeof v.claim==='string'&&v.claim.length<=4000)result[stage]={claim:v.claim,choice:typeof v.choice==='string'?v.choice:'',revision:typeof v.revision==='string'?v.revision:'',mode:v.mode==='ai'?'ai':'demo'};}return result;}
export function projectSnapshot(project:Project):Project{return parseProject(project);}

export function parseDialogue(value:unknown):Message['dialogue']{if(!value||typeof value!=='object')return;const v=value as NonNullable<Message['dialogue']>;if(!['chat','challenge','evaluate-claim','support-change'].includes(v.intent))return;return {intent:v.intent,...(typeof v.replyTo==='string'&&v.replyTo.length<=100?{replyTo:v.replyTo}:{}),...(v.successful===true?{successful:true}:{}),...(typeof v.receipt==='string'&&/^[a-f0-9]{64}$/.test(v.receipt)?{receipt:v.receipt}:{})};}
