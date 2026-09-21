'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Workspace from './Workspace';
import { TaskLoader } from './TaskLoader';
import { loadTask, TASK_LOAD_EVENT } from '@/lib/stem/tasks';
import { demoTasks } from '@/data/tasks';
import { useResearchSession } from '@/lib/research/useResearchSession';
import { researchMode, type ResearchConfig } from '@/lib/research/config';
import { taskFromQuery } from '@/lib/research/assignment';
import type { STEMTask } from '@/types';
export default function TaskWorkspace(){
 const [task,setTask]=useState(demoTasks[0]);const [ready,setReady]=useState(false);const [loading,setLoading]=useState(false);const [version,setVersion]=useState(0);const [notice,setNotice]=useState('');const [researchVisible,setResearchVisible]=useState(false);
 const research=useResearchSession();const {start,assign}=research;
 useEffect(()=>{
  let initial=demoTasks[0];
  try{const saved=sessionStorage.getItem('stempath-task-v3');if(saved)initial=loadTask(JSON.parse(saved));const queryTask=taskFromQuery(location.search);if(queryTask){initial=queryTask;sessionStorage.removeItem('stempath-progress-v3');}}
  catch{setNotice('Saved or supplied challenge could not be restored. The current example is ready.');}
  setTask(initial);setResearchVisible(researchMode(location.search));start(initial);setReady(true);
 },[start]);
 const storeTask=useCallback((next:STEMTask)=>{try{sessionStorage.removeItem('stempath-progress-v3');sessionStorage.setItem('stempath-task-v3',JSON.stringify(next));}catch{setNotice('Browser storage is unavailable. Your workspace works until reload.');}setTask(next);setVersion(v=>v+1);setLoading(false);},[]);
 const applyTask=useCallback((input:STEMTask)=>{const next=loadTask(input);assign(next);storeTask(next);},[assign,storeTask]);
 function reset(config:ResearchConfig,assigned=task){research.end(config.condition===research.session?.condition?'RESET':'CONDITION_CHANGE');start(assigned,{...config,storeMessageText:researchVisible&&config.storeMessageText});storeTask(assigned);}
 function clear(all:boolean){research.clear(all);storeTask(task);}
 useEffect(()=>{const receive=(event:Event)=>{try{applyTask(loadTask((event as CustomEvent).detail));}catch{setNotice('The supplied challenge is invalid. Your current work is unchanged.');}};window.addEventListener(TASK_LOAD_EVENT,receive);return()=>window.removeEventListener(TASK_LOAD_EVENT,receive);},[applyTask]);
 if(!ready)return <p className="workspace-loading">Loading your learning workspace…</p>;
 return <>{notice&&<p role="status">{notice}</p>}<Workspace key={`${task.id}-${version}`} task={task} onLoadTask={()=>setLoading(true)} research={research} researchVisible={researchVisible} onResearchReset={reset} onResearchClear={clear} onAssignTask={applyTask} onHideResearch={()=>setResearchVisible(false)}/>{loading&&<TaskDialog onClose={()=>setLoading(false)}><TaskLoader onLoad={applyTask}/></TaskDialog>}</>;
}
function TaskDialog({children,onClose}:{children:React.ReactNode;onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();},[]);return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="modal-heading"><h2>Load STEM Challenge</h2><button onClick={onClose} aria-label="Close challenge loader">×</button></div>{children}</dialog>;}
