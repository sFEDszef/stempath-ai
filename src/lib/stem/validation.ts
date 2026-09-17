import { stageIds } from './stages';
import { loadTask } from './tasks';
import type { ChatRequest, LearningArtifacts, StageId } from '@/types';
export const MAX_HISTORY=12;
export const MAX_TEXT=4000;
export const MAX_BODY_BYTES=96_000;
export function parseArtifacts(input:unknown): LearningArtifacts {
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid artifacts');
 const result:LearningArtifacts={};let total=0;
 for(const [stage,fields] of Object.entries(input)){
  if(!stageIds.includes(stage as StageId)||!fields||typeof fields!=='object'||Array.isArray(fields)||Object.keys(fields).length>8)throw new Error('Invalid artifacts');
  const safe:Record<string,string>={};
  for(const [key,value] of Object.entries(fields)){
   if(key.length>80||['__proto__','constructor','prototype'].includes(key)||typeof value!=='string'||value.length>2000)throw new Error('Invalid artifact');
   total+=value.length;safe[key]=value;
  }
  result[stage as StageId]=safe;
 }
 if(total>24000)throw new Error('Too many artifact characters');
 return result;
}
export function parseChatRequest(input:unknown):ChatRequest {
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid request');
 const v=input as Record<string,unknown>;
 const text=(x:unknown,max:number):x is string=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
 if(!stageIds.includes(v.stage as StageId)||![1,2,3].includes(v.level as number)||!text(v.message,MAX_TEXT)||!Array.isArray(v.history)||v.history.length>MAX_HISTORY)throw new Error('Invalid request');
 const history=v.history.map((item:unknown)=>{if(!item||typeof item!=='object')throw new Error('Invalid history');const m=item as Record<string,unknown>;if(!['student','assistant'].includes(m.role as string)||!text(m.text,MAX_TEXT))throw new Error('Invalid history');return {role:m.role as 'student'|'assistant',text:m.text};});
 if(!Array.isArray(v.completed)||v.completed.length>7||!v.completed.every(id=>stageIds.includes(id)))throw new Error('Invalid progress');
 if(v.mode!==undefined&&!['auto','demo'].includes(v.mode as string))throw new Error('Invalid mode');
 if(v.intent!==undefined&&!['chat','challenge','evaluate-claim','support-change'].includes(v.intent as string))throw new Error('Invalid intent');
 if(v.claim!==undefined&&!text(v.claim,4000))throw new Error('Invalid claim');
 return {stage:v.stage as StageId,level:v.level as ChatRequest['level'],message:(v.message as string).trim(),history,task:loadTask(v.task),artifacts:parseArtifacts(v.artifacts),completed:[...new Set(v.completed)] as StageId[],mode:v.mode as ChatRequest['mode'],intent:v.intent as ChatRequest['intent'],claim:v.claim as string|undefined};
}
