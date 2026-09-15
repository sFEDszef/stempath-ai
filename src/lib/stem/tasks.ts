import type { STEMTask, TaskType } from '@/types';
export const taskTypes: TaskType[]=['engineering-design','scientific-inquiry','experimental-investigation','optimization','modelling','general-stem'];
export function classifyTask(text:string): TaskType {
  const matches: TaskType[]=[];
  if(/optimi[sz]|优化/i.test(text)) matches.push('optimization');
  if(/mathematical model|数学建模/i.test(text)) matches.push('modelling');
  if(/investigat|experiment|实验|探究/i.test(text)) matches.push('experimental-investigation');
  if(/design|build|设计|搭建/i.test(text)) matches.push('engineering-design');
  return matches.length===1 ? matches[0] : 'general-stem';
}
// The same boundary is used by the form, browser restore, server and future external callers.
export function loadTask(input:unknown):STEMTask {
  if(!input||typeof input!=='object'||Array.isArray(input)) throw new Error('Provide a challenge title and description.');
  const v=input as Record<string,unknown>;
  function text(value:unknown,max:number,required=false):string|undefined {
    if(value===undefined&&!required)return;
    if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Check the challenge fields and their length.');
    return value.trim()||undefined;
  }
  const title=text(v.title,160,true)!; const description=text(v.description,4000,true)!;
  if(v.type!==undefined&&!taskTypes.includes(v.type as TaskType))throw new Error('Unknown task type.');
  const task:STEMTask={id:text(v.id,100)??`task-${hash(title+'\n'+description)}`,title,description,type:(v.type as TaskType)??classifyTask(title+' '+description)};
  for(const key of ['context','additionalInstructions'] as const){const value=text(v[key],2000);if(value)task[key]=value;}
  for(const key of ['objectives','constraints','successCriteria','availableMaterials','relevantDomains'] as const){
    if(v[key]===undefined)continue;
    if(!Array.isArray(v[key])||v[key].length>12)throw new Error('Use up to 12 entries per list.');
    task[key]=v[key].map(item=>text(item,300,true)!);
  }
  return task;
}
function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}

export const TASK_LOAD_EVENT = 'stempath:load-task';
/** Programmatic browser integration boundary. No LMS or external transport is assumed. */
export function injectTask(input:unknown):void {
  const task=loadTask(input);
  if(typeof window==='undefined')throw new Error('Mount TaskWorkspace in a browser before injecting a task.');
  window.dispatchEvent(new CustomEvent(TASK_LOAD_EVENT,{detail:task}));
}
export function taskStorageKey(task:STEMTask){return `${task.id}-${hash(JSON.stringify(task))}`;}
