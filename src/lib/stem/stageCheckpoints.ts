import type {STEMTask,StageId,LearningArtifacts} from '@/types';
import {stageIds} from './stages';
import {targetGradeBand} from './gradeBands';
export interface Checkpoint {field:string;zh:string;en:string;core:boolean;}
const item=(field:string,zh:string,en:string,core=true):Checkpoint=>({field,zh,en,core});
/** Canonical existing record keys preserve previous learners' notes. No model call or mastery score. */
export function stageCheckpoints(task:STEMTask,stage:StageId,aiUsed=true):Checkpoint[]{
 const inquiry=/inquiry|investigation/.test(task.type),older=targetGradeBand(task)!=='G3-4';
 const all:Record<StageId,Checkpoint[]>={
 understand:[item(task.type==='optimization'?'Objective':'Problem statement','这个任务要我：','This task asks me to:'),item(task.type==='optimization'?'Measure to optimize':'Success criteria','做到这样就算成功：','It will count as success when:'),item('Constraints','我要遵守的规则：','A rule I must follow:',false)],
 imagine:[item(inquiry?'Hypotheses':'Ideas or hypotheses','我想到的一个办法或猜想：','One idea or guess I have:'),item(inquiry?'Selected hypothesis':'Selected direction','我想先试：','I want to try:'),item(inquiry?'Alternative explanations':'Comparison',older?'另一个想法有什么不同：':'还可以试的办法：','Another possibility:',false)],
 plan:[item('Procedure','我准备这样做：','I plan to:'),item('Measurements','我要观察或测量：','I will watch or measure:'),item('Variables',older?'只改变什么，哪些保持一样：':'我想改变的一样东西：','What changes and what stays the same:',false),item('Materials / resources','我需要：','I need:',false)],
 build:[item(inquiry?'Setup notes':'Implementation notes','我已经做了：','I have tried:'),item(inquiry?'Observations':'Checks and observations','我看到发生了：','I saw this happen:'),item('Problems encountered','我遇到的小问题：','A problem I noticed:',false)],
 test:[item('Trial results / data','实际测到或看到的结果：','My actual result:'),item('Interpretation','和任务目标比，我发现：','Compared with my goal, I noticed:'),item('Observations','再试一次，我看到：','When I tried again:',false)],
 improve:[item('Revision','我觉得这里值得改：','One thing worth changing:'),item('Prediction','我准备这样改：','The change I want to try:'),item('Evidence for revision','我这样想是因为看到：','I think this because I saw:',false)],
 reflect:[item('What changed in my thinking?','我学会了，或改变了想法：','Something I learned or changed my mind about:'),item('Which evidence influenced my decision?','让我这样想的一次发现或经历：','Something I saw or tried that changed my thinking:'),...(aiUsed?[item('Which AI suggestion did I question or reject?','AI说的话，我这样检查过：','How I checked something the AI said:',false)]:[])]
 };return all[stage];
}
export function hasCheckpointText(value:string){const s=value.trim();return !/不知道|没懂|不懂|不确定|don['’]?t (?:know|understand)|not sure/i.test(s)&&s.length>=2&&/[\p{L}\p{N}]/u.test(s)&&! /^(?:不知道|不懂|没懂|不确定|好的|嗯+|idk|yes|no|ok|test|I don['’]?t know|not sure)[。.!?？]*$/i.test(s)&&!/^[_?？.。\s]+$/.test(s);}
export function checkpointState(task:STEMTask,stage:StageId,records:LearningArtifacts,completed:StageId[]=[]){const core=stageCheckpoints(task,stage).filter(c=>c.core);const missing=core.filter(c=>!hasCheckpointText(records[stage]?.[c.field]??''));return {core,missing,count:core.length-missing.length,status:completed.includes(stage)?'COMPLETED':missing.length===0?'READY':core.some(c=>!!records[stage]?.[c.field])?'IN_PROGRESS':'NOT_STARTED'} as const;}
export function accessibleStage(stage:StageId,active:StageId,completed:StageId[],teacher=false){return teacher||stage===active||completed.includes(stage)||stageIds.slice(0,stageIds.indexOf(stage)).every(s=>completed.includes(s));}
export function nextStage(stage:StageId){return stageIds[stageIds.indexOf(stage)+1];}
export const childStageNames:Record<StageId,[string,string]>={understand:['看懂任务','Understand'],imagine:['想办法','Imagine'],plan:['做计划','Plan'],build:['动手试试','Try it'],test:['测一测','Test'],improve:['改一改','Improve'],reflect:['想一想','Reflect']};
