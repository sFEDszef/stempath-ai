import { demoTasks } from '@/data/tasks';
import { loadTask } from '@/lib/stem/tasks';
import type { STEMTask, TaskType } from '@/types';
export function assignTask(tasks:STEMTask[],type:TaskType|'all',seed:string,random:()=>number=Math.random):STEMTask {
 const pool=tasks.filter(task=>type==='all'||task.type===type).toSorted((a,b)=>a.id.localeCompare(b.id));
 if(!pool.length)throw new Error('No eligible tasks for this type. Choose another filter or load a custom task.');
 let value=random();
 if(seed){let hash=2166136261;for(const char of seed)hash=Math.imul(hash^char.charCodeAt(0),16777619);value=(hash>>>0)/4294967296;}
 return pool[Math.min(pool.length-1,Math.floor(Math.max(0,value)*pool.length))];
}
export function taskFromQuery(search:string):STEMTask|undefined {
 const id=new URLSearchParams(search).get('task');if(!id)return;
 const task=demoTasks.find(t=>t.id===id);if(!task)throw new Error('Unknown demo task in URL.');return loadTask(task);
}
export const scenarioPresets = [
 {label:'A · Low support / Bridge',condition:'LOW_SUPPORT',taskId:'bridge'},
 {label:'B · Adaptive / Plant growth',condition:'ADAPTIVE_SUPPORT',taskId:'plants'},
 {label:'C · High support / Wind-powered car',condition:'HIGH_SUPPORT',taskId:'wind-car'},
 {label:'D · No AI / Thermal insulation',condition:'NO_AI',taskId:'insulation'},
] as const;
