'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChatRequest, SupportLevel } from '@/types';
import { decidePedagogicalAction, applySupportChoice } from './decisionEngine';
export interface TraceEvent {timestamp:string;taskId:string;stage:string;supportLevel:SupportLevel;learnerSignal:string[];pedagogicalDecision:string;supportRecommendation?:SupportLevel;studentAcceptedRecommendation?:boolean;aiChallengeTriggered?:boolean;stageCompleted?:boolean;event:string}
export function useAdaptive(request:ChatRequest){
 const decision=decidePedagogicalAction(request);
 const [dismissals,setDismissals]=useState<Record<string,number>>({});
 const [trace,setTrace]=useState<TraceEvent[]>([]);
 const [debug,setDebug]=useState(false);
 const traceRef=useRef<TraceEvent[]>([]);
 const [serial,setSerial]=useState(0);
 const [lastChange,setLastChange]=useState(-10);
 const key=`${request.stage}:${request.level}:${decision.reason}`;
 const last=dismissals[key];
 const showRecommendation=decision.recommendation!==undefined&&serial-lastChange>=2&&(last===undefined||serial-last>=3);
 useEffect(()=>{setDebug(new URLSearchParams(location.search).get('debug')==='1'&&(process.env.NODE_ENV==='development'||['localhost','127.0.0.1'].includes(location.hostname)));},[]);
 function record(event:string,extra:Partial<TraceEvent>={},input:ChatRequest=request){
  if(event==='student-message')setSerial(n=>n+1);
  const d=decidePedagogicalAction(input);
  // Opaque task fingerprint; never store messages, artifact text, titles, names or provider content in the trace.
  let hash=0;for(const c of JSON.stringify(input.task))hash=(hash*31+c.charCodeAt(0))|0;
  const item:TraceEvent={timestamp:new Date().toISOString(),taskId:`task-${hash>>>0}`,stage:input.stage,supportLevel:input.level,learnerSignal:Object.entries(d.state.signals).filter(([,v])=>v).map(([k])=>k),pedagogicalDecision:d.action,supportRecommendation:d.recommendation,event,...extra};
  traceRef.current=[...traceRef.current,item].slice(-200);setTrace(traceRef.current);
  try{localStorage.setItem('stempath-trace-v4',JSON.stringify(traceRef.current));}catch{/* In-memory trace remains available. */}
 }
 function resolveRecommendation(accepted:boolean){setDismissals(prev=>({...prev,[key]:serial}));if(accepted)setLastChange(serial);record('support-recommendation',{studentAcceptedRecommendation:accepted});return applySupportChoice(request.level,decision.recommendation,accepted);}
 function clearTrace(){traceRef.current=[];setTrace([]);try{localStorage.removeItem('stempath-trace-v4');}catch{/* No persistent storage available. */}}
 return {clearTrace,decision,showRecommendation,resolveRecommendation,record,trace,debug};
}
