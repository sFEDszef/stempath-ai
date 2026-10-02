'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {apiCoach,CoachError} from '@/lib/coach';
import {requestGate,limitReached,usageLimitMessage} from './requestGate';
import {tick,type StartContext} from './reliability';
import {measures,participantPattern} from './traceability';
import type { STEMTask,StageId,SupportLevel,ChatRequest } from '@/types';
import { parseResearchConfig, conditionConfig, type ResearchConfig } from './config';
import { endSession,changeTask,changeSupport,enterStage,finishSession,recordEvent,reviseArtifact,setTextStorage,startSession,completeStage,type ResearchSession,type EventType,type EventData,type Initiator } from './session';
import { readSavedSession, STORAGE_PREFIX } from './storage';
interface Persistence {server?:boolean;onSave?:(s:ResearchSession)=>Promise<void>;}
export function useResearchSession(options:Persistence={}){
 const persistence=useRef(options);useEffect(()=>{persistence.current=options;},[options]);
 const [storageNotice,setStorageNotice]=useState('');const remoteTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const pendingRemote=useRef<ResearchSession|null>(null);
 const flush=useCallback(()=>{if(remoteTimer.current)clearTimeout(remoteTimer.current);remoteTimer.current=null;const s=pendingRemote.current;pendingRemote.current=null;if(s)void persistence.current.onSave?.(s).then(()=>setStorageNotice('')).catch(()=>{if(!pendingRemote.current)pendingRemote.current=s;setStorageNotice('Research records could not be saved. Retry before signing out. / 研究记录尚未保存，请重试。');});},[]);
 const [session,setSession]=useState<ResearchSession|null>(null);
 const current=useRef<ResearchSession|null>(null);
 const [savedCount,setSavedCount]=useState(0);
 const save=useCallback((next:ResearchSession)=>{
  current.current=next;setSession(next);
  if(persistence.current.server){if(pendingRemote.current&&pendingRemote.current.sessionId!==next.sessionId)flush();pendingRemote.current=next;if(remoteTimer.current)clearTimeout(remoteTimer.current);remoteTimer.current=setTimeout(flush,1200);return;}
  try{localStorage.setItem(STORAGE_PREFIX+next.sessionId,JSON.stringify(next));setSavedCount(Object.keys(localStorage).filter(k=>k.startsWith(STORAGE_PREFIX)).length);setStorageNotice('');}
  catch{setStorageNotice('Local storage is unavailable or full. Export before closing this tab; the current session is still in memory.');}
 },[flush]);
 const restore=useCallback((s:ResearchSession)=>{const now=Date.now();const next=s.completedAt?s:recordEvent({...s,endedAt:undefined,endReason:undefined,activity:{...s.activity,lastTick:now,lastActivity:now,visible:true,idle:false}},'WORKSPACE_RESTORED');save(next);},[save]);
 useEffect(()=>{window.addEventListener('pagehide',flush);return()=>{flush();window.removeEventListener('pagehide',flush);};},[flush]);
 const update=useCallback((fn:(s:ResearchSession)=>ResearchSession)=>{if(current.current)save(fn(current.current));},[save]);
 const start=useCallback((task:STEMTask,config=conditionConfig(),context?:StartContext)=>{save(startSession(task,config,Date.now(),context));},[save]);
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
 const interfaceLanguage=useCallback((value:"zh-CN"|"en",taskLanguage:"zh-CN"|"en")=>update(s=>s.interfaceLanguage===value&&s.taskLanguage===taskLanguage?s:recordEvent({...s,interfaceLanguage:value,taskLanguage},'CONFIG_CHANGED',{systemAction:'LANGUAGE_CHANGED'})),[update]);
 const configure=useCallback((config:ResearchConfig)=>update(s=>recordEvent({...s,config:parseResearchConfig(config)},'CONFIG_CHANGED',{systemAction:'POLICY_UPDATED',settings:config})),[update]);
 const clear=useCallback((all:boolean)=>{
  if(persistence.current.server){setStorageNotice('Server research records require deliberate researcher account deletion.');return;}
  try{if(all){for(const key of Object.keys(localStorage))if(key.startsWith('stempath-research-')||key==='stempath-trace-v4')localStorage.removeItem(key);}else if(current.current)localStorage.removeItem(STORAGE_PREFIX+current.current.sessionId);
   setSavedCount(Object.keys(localStorage).filter(k=>k.startsWith(STORAGE_PREFIX)).length);setStorageNotice('');}
  catch{setStorageNotice('Could not clear persistent storage. Check browser storage settings.');}
  current.current=null;setSession(null);
 },[]);
 const [busy,setBusy]=useState(false);
 const study=useCallback((participantCode:string,baseline:unknown,outcome:unknown)=>update(s=>{
  if(participantCode&&!participantPattern.test(participantCode))throw Error('Use a short anonymous code such as P001 or Pilot-A07.');
  return recordEvent({...s,participantCode:participantCode||undefined,baselineMeasures:measures(baseline),outcomeMeasures:measures(outcome)},'STUDY_METADATA_UPDATED');
 }),[update]);
 // Clock is advanced on transitions and every 5 seconds, not every movement.
 useEffect(()=>{
  function activity(kind:'activity'|'hidden'|'visible'|'tick'){
   const s=current.current;if(!s||s.completedAt||s.endedAt)return;
   const now=Date.now(),clock=tick(s.activity,now,s.config.idleThresholdMs);
   let next={...s,activity:clock};
   if(clock.idle&&!s.activity.idle)next=recordEvent(next,'IDLE_STARTED',{},now);
   if(kind==='hidden'&&clock.visible){next.activity={...clock,visible:false};next=recordEvent(next,'WINDOW_HIDDEN',{},now);}
   if(kind==='visible'&&!clock.visible){next.activity={...clock,visible:true,lastActivity:now,idle:false};next=recordEvent(next,'WINDOW_VISIBLE',{},now);}
   if(kind==='activity'&&clock.visible){next.activity={...clock,lastActivity:now,idle:false};if(clock.idle)next=recordEvent(next,'ACTIVITY_RESUMED',{},now);}
   save(next);
  }
  const visible=()=>activity(document.visibilityState==='visible'&&document.hasFocus()?'visible':'hidden');
  const action=()=>activity('activity');const blur=()=>activity('hidden');
  document.addEventListener('visibilitychange',visible);window.addEventListener('focus',visible);window.addEventListener('blur',blur);
  window.addEventListener('pointerdown',action);window.addEventListener('keydown',action);window.addEventListener('scroll',action,{passive:true});
  const timer=setInterval(()=>activity('tick'),5000);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',visible);window.removeEventListener('blur',blur);window.removeEventListener('pointerdown',action);window.removeEventListener('keydown',action);window.removeEventListener('scroll',action);};
 },[save]);
 const generate=useCallback(async(request:ChatRequest)=>requestGate.run(async()=>{
  let captured=current.current;if(!captured||captured.config.condition==='NO_AI'||captured.completedAt||captured.endedAt)throw new CoachError('AI support is unavailable. / 当前无法使用 AI 支持。',false);
  const paid=request.mode!=='demo';
  if(paid&&limitReached(captured.usage,captured.config)){save(recordEvent(captured,'USAGE_LIMIT_REACHED'));throw new CoachError(usageLimitMessage,false,'USAGE_LIMIT_REACHED');}
  const id=captured.sessionId;
  captured=recordEvent({...captured,usage:{...captured.usage,aiCalls:captured.usage.aiCalls+(paid?1:0)}},'AI_REQUEST_STARTED',{},Date.now(),request.stage,request.level);save(captured);setBusy(true);
  function settle(response?:import('@/types').CoachResponse,error?:unknown){
   let s=current.current?.sessionId===id?current.current:captured!;
   if(current.current?.sessionId!==id&&!persistence.current.server){try{s=readSavedSession(localStorage,id);}catch{}}
   const metadata=response?.metadata??(error instanceof CoachError?error.metadata:undefined),u=metadata?.tokenUsage;
   s={...s,provider:metadata?.provider??s.provider,model:metadata?.model??s.model,usage:{aiCalls:s.usage.aiCalls-(paid&&metadata&&(metadata.providerAttempted===false||(!metadata.providerAttempted&&metadata.provider==='demo'))?1:0),inputTokens:s.usage.inputTokens+(u?.inputTokens??0),outputTokens:s.usage.outputTokens+(u?.outputTokens??0),totalTokens:s.usage.totalTokens+(u?.totalTokens??0)}};
   s=recordEvent(s,response?'AI_RESPONSE':'AI_ERROR',{coach:metadata,messageText:response?.text,diagnostic:metadata?.diagnostic??(response?undefined:error instanceof CoachError?error.diagnostic:'NETWORK_ERROR'),systemAction:response?.mode.toUpperCase()},Date.now(),request.stage,request.level);
   if(metadata?.compliance)s=recordEvent(s,metadata.compliance,{reasonCategory:metadata.diagnostic??'CHECK_PASSED'},Date.now(),request.stage,request.level);
   if(current.current?.sessionId===id)save(s);else if(persistence.current.server){void persistence.current.onSave?.(s).catch(()=>setStorageNotice('Research save failed. / 研究记录保存失败。'));}else try{if(localStorage.getItem(STORAGE_PREFIX+id)===null)return;localStorage.setItem(STORAGE_PREFIX+id,JSON.stringify(s));}catch{setStorageNotice('Export needed: usage could not be saved.');}
  }
  try{const response=await apiCoach.respond(request);settle(response);return response;}catch(error){settle(undefined,error);throw error;}finally{setBusy(false);}
 }),[save]);
 return {flush,restore,busy,generate,study,session,current,start,assign,event,stage,support,artifact,complete,finish,end,textStorage,language,interfaceLanguage,configure,clear,storageNotice,savedCount};
}
export type ResearchController=ReturnType<typeof useResearchSession>;
