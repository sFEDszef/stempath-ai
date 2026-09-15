'use client';
import { useCallback, useEffect, useState } from 'react';
import Workspace from './Workspace';
import { TaskLoader } from './TaskLoader';
import { loadTask, TASK_LOAD_EVENT } from '@/lib/stem/tasks';
import { demoTasks } from '@/data/tasks';
import type { STEMTask } from '@/types';
export default function TaskWorkspace(){
 const [task,setTask]=useState(demoTasks[0]);const [ready,setReady]=useState(false);const [loading,setLoading]=useState(false);const [version,setVersion]=useState(0);const [notice,setNotice]=useState('');
 useEffect(()=>{try{const saved=sessionStorage.getItem('stempath-task-v3');if(saved)setTask(loadTask(JSON.parse(saved)));}catch{setNotice('Saved challenge could not be restored. The demo is ready.')}setReady(true)},[]);
 const applyTask=useCallback((input:STEMTask)=>{const next=loadTask(input);try{sessionStorage.removeItem('stempath-progress-v3');sessionStorage.setItem('stempath-task-v3',JSON.stringify(next));}catch{setNotice('Browser storage is unavailable. Your workspace works until reload.')}setTask(next);setVersion(v=>v+1);setLoading(false)},[]);
 useEffect(()=>{const receive=(event:Event)=>{try{applyTask(loadTask((event as CustomEvent).detail));}catch{setNotice("The supplied challenge is invalid. Your current work is unchanged.")}};window.addEventListener(TASK_LOAD_EVENT,receive);return()=>window.removeEventListener(TASK_LOAD_EVENT,receive)},[applyTask]);
 if(!ready)return <p className="workspace-loading">Loading your learning workspace…</p>;
 return <>{notice&&<p role="status">{notice}</p>}<Workspace key={`${task.id}-${version}`} task={task} onLoadTask={()=>setLoading(true)}/>{loading&&<TaskDialog onClose={()=>setLoading(false)}><TaskLoader onLoad={applyTask}/></TaskDialog>}</>;
}
import { useRef } from 'react';
function TaskDialog({children,onClose}:{children:React.ReactNode;onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal()},[]);return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose()}}><div className="modal-heading"><h2>Load STEM Challenge</h2><button onClick={onClose} aria-label="Close challenge loader">×</button></div>{children}</dialog>}
