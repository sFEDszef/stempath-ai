import { useState } from 'react';
import { apiCoach } from '@/lib/coach';
import type { Language } from '@/lib/pedagogy/signals';
import type { ChatRequest } from '@/types';
export function AIChallenge({request,onRespond,disabled,language='en',onTrigger}:{language?:Language;onTrigger?:()=>void;disabled?:boolean;request:ChatRequest;onRespond:(message:string,claim:string)=>void}) {
 const [claim,setClaim]=useState('');const [mode,setMode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [choice,setChoice]=useState('');
 async function generate(){setBusy(true);setError('');try{const res=await apiCoach.respond({...request,intent:'challenge',message:language==='zh'?'请提出一个可以检验的说法。':'Offer a testable claim for this task that I can critically evaluate.'});setClaim(res.text);setMode(res.mode);onTrigger?.()}catch{setError('Could not load the claim. Try again.')}finally{setBusy(false)}}
 return <details className="rail-section ai-challenge"><summary>AI Challenge</summary><p>A claim is something to question, not an answer to trust.</p>{!claim?<button className="primary-button" disabled={busy||disabled} onClick={generate}>{busy?'Preparing…':'Explore a claim'}</button>:<><small>{mode==='demo'?'Demo claim':'AI-generated claim'} · Not verified</small><p>{claim}</p><div className="claim-choices">{(language==='zh'?['同意','不同意','需要证据']:['Agree','Disagree','Need evidence']).map(label=><button disabled={disabled} aria-pressed={choice===label} key={label} onClick={()=>{setChoice(label);onRespond(language==='zh'?`我的看法是：${label}。`:`My response is: ${label}.`,claim)}}>{label}</button>)}</div>{choice&&<p>What could you observe or measure to decide? Explain your reasoning in the coach chat.</p>}</>}{error&&<p role="alert">{error}</p>}</details>;
}
