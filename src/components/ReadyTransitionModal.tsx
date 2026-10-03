"use client";
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import {readyPromptCopy} from '@/lib/stem/readyPrompt';
export function ReadyTransitionModal({final,zh,disabled,onDecision}:{final:boolean;zh:boolean;disabled:boolean;onDecision:(action:'ADVANCE'|'STAY')=>void}){
 const dialog=useRef<HTMLDialogElement>(null),primary=useRef<HTMLButtonElement>(null);
 const copy=readyPromptCopy(final,zh);
 useEffect(()=>{
  const el=dialog.current;
  el?.showModal();
  primary.current?.focus();
  return()=>el?.close();
 },[]);
 return <dialog ref={dialog} className="ready-transition" aria-labelledby="ready-transition-title" aria-describedby="ready-transition-body" onCancel={e=>{e.preventDefault();onDecision('STAY');}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onDecision('STAY');}}}>
  <div className="modal-heading"><h2 id="ready-transition-title">{copy.title}</h2><button aria-label={zh?'关闭并继续思考':'Close and keep thinking'} onClick={()=>onDecision('STAY')}><X size={20}/></button></div>
  <p id="ready-transition-body">{copy.body}</p>
  <div className="ready-transition-actions"><button ref={primary} className="primary-button" disabled={disabled} onClick={()=>onDecision('ADVANCE')}>{copy.advance}</button><button className="secondary-button" onClick={()=>onDecision('STAY')}>{copy.stay}</button></div>
 </dialog>;
}
