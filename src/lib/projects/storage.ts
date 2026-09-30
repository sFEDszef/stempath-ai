import {loadTask} from '@/lib/stem/tasks';
import {parseArtifacts} from '@/lib/stem/validation';
import {stageIds} from '@/lib/stem/stages';
import type {STEMTask,StageId,SupportLevel,LearningArtifacts} from '@/types';
export const LIBRARY_KEY='stempath-task-library-v1';
export const PROJECTS_KEY='stempath-projects-v1';
export interface Project {id:string;task:STEMTask;active:StageId;completed:StageId[];level:SupportLevel;records:LearningArtifacts;lastOpenedAt:string;}
export function newProject(task:STEMTask):Project{return {id:crypto.randomUUID(),task:loadTask(task),active:'understand',completed:[],level:1,records:{},lastOpenedAt:new Date().toISOString()};}
export function parseProject(value:unknown):Project {
 if(!value||typeof value!=='object')throw Error('Invalid project');const v=value as Project;
 if(typeof v.id!=='string'||!v.id||v.id.length>100||!stageIds.includes(v.active)||![1,2,3].includes(v.level)||!Array.isArray(v.completed)||v.completed.length>7||!v.completed.every(s=>stageIds.includes(s))||typeof v.lastOpenedAt!=='string'||!Number.isFinite(Date.parse(v.lastOpenedAt)))throw Error('Invalid project');
 return {id:v.id,task:loadTask(v.task),active:v.active,completed:[...new Set(v.completed)],level:v.level,records:parseArtifacts(v.records),lastOpenedAt:v.lastOpenedAt};
}
export function readCollection<T>(raw:string|null,parse:(v:unknown)=>T):T[]{if(!raw)return [];try{const value=JSON.parse(raw);if(!Array.isArray(value)||value.length>200)return [];return value.flatMap(item=>{try{return [parse(item)];}catch{return [];}});}catch{return [];}}
export function importTasks(raw:string):STEMTask[]{const data=JSON.parse(raw);const items=Array.isArray(data)?data:[data];if(!items.length||items.length>100)throw Error('Invalid import');return items.map(loadTask);}
export function duplicateTask(task:STEMTask,suffix:string):STEMTask{return loadTask({...task,id:crypto.randomUUID(),title:task.title.slice(0,140)+suffix,translations:undefined});}
export function exportTasks(tasks:STEMTask[]){return JSON.stringify(tasks.map(loadTask),null,2);}
