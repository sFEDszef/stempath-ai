'use client';
import { useCallback, useRef, useState } from 'react';
import type { STEMTask,StageId,SupportLevel } from '@/types';
import { conditionConfig, type ResearchConfig } from './config';
import { endSession,changeTask,changeSupport,enterStage,finishSession,recordEvent,reviseArtifact,setTextStorage,startSession,completeStage,type ResearchSession,type EventType,type EventData,type Initiator } from './session';
import { STORAGE_PREFIX } from './storage';
export function useResearchSession(){
 const [session,setSession]=useState<ResearchSession|null>(null);
 const current=useRef<ResearchSession|null>(null);
 const [storageNotice,setStorageNotice]=useState('');
 const [savedCount,setSavedCount]=useState(0);
 const save=useCallback((next:ResearchSession)=>{
  current.current=next;setSession(next);
  try{localStorage.setItem(STORAGE_PREFIX+next.sessionId,JSON.stringify(next));setSavedCount(Object.keys(localStorage).filter(k=>k.startsWith(STORAGE_PREFIX)).length);setStorageNotice('');}
  catch{setStorageNotice('Local storage is unavailable or full. Export before closing this tab; the current session is still in memory.');}
 },[]);
 const update=useCallback((fn:(s:ResearchSession)=>ResearchSession)=>{if(current.current)save(fn(current.current));},[save]);
 const start=useCallback((task:STEMTask,config=conditionConfig())=>{save(startSession(task,config));},[save]);
 const event=useCallback((type:EventType,data:EventData={},stage?:StageId,level?:SupportLevel)=>update(s=>s.completedAt?s:recordEvent(s,type,data,Date.now(),stage,level)),[update]);
 const assign=useCallback((task:STEMTask)=>{const s=current.current;if(!s)return;save(s.completedAt?startSession(task,s.config):changeTask(s,task));},[save]);
 const stage=useCallback((id:StageId)=>update(s=>enterStage(s,id)),[update]);
 const support=useCallback((level:SupportLevel,initiator:Initiator)=>update(s=>changeSupport(s,level,initiator)),[update]);
 const artifact=useCallback((stage:StageId,field:string,value:string)=>update(s=>s.completedAt?s:reviseArtifact(s,stage,field,value)),[update]);
 const complete=useCallback((stage:StageId,value:boolean)=>update(s=>s.completedAt?s:completeStage(s,stage,value)),[update]);
 const end=useCallback((reason:'RESET'|'CONDITION_CHANGE')=>update(s=>endSession(s,reason)),[update]);
 const finish=useCallback(()=>update(s=>finishSession(s)),[update]);
 const textStorage=useCallback((enabled:boolean)=>update(s=>setTextStorage(s,enabled)),[update]);
 const language=useCallback((value:'en'|'zh')=>update(s=>s.language===value?s:{...s,language:value}),[update]);
 const interfaceLanguage=useCallback((value:"zh-CN"|"en",taskLanguage:"zh-CN"|"en")=>update(s=>({...s,interfaceLanguage:value,taskLanguage})),[update]);
 const configure=useCallback((config:ResearchConfig)=>update(s=>recordEvent({...s,config},'SETTINGS_CHANGED',{systemAction:'POLICY_UPDATED',settings:config})),[update]);
 const clear=useCallback((all:boolean)=>{
  try{if(all){for(const key of Object.keys(localStorage))if(key.startsWith(STORAGE_PREFIX)||key==='stempath-trace-v4')localStorage.removeItem(key);}else if(current.current)localStorage.removeItem(STORAGE_PREFIX+current.current.sessionId);
   setSavedCount(Object.keys(localStorage).filter(k=>k.startsWith(STORAGE_PREFIX)).length);setStorageNotice('');}
  catch{setStorageNotice('Could not clear persistent storage. Check browser storage settings.');}
  current.current=null;setSession(null);
 },[]);
 return {session,current,start,assign,event,stage,support,artifact,complete,finish,end,textStorage,language,interfaceLanguage,configure,clear,storageNotice,savedCount};
}
export type ResearchController=ReturnType<typeof useResearchSession>;
