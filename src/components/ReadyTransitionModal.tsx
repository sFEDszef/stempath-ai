"use client";
import {useEffect,useRef} from 'react';
import {readyPromptCopy} from '@/lib/stem/readyPrompt';
export function ReadyTransitionModal({final,zh,disabled,onDecision}:{final:boolean;zh:boolean;disabled:boolean;onDecision:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),primary=useRef<HTMLButtonElement>(null);
 const copy=readyPromptCopy(final,zh);
 useEffect(()=>{
  const el=dialog.current;
  el?.showModal();
  primary.current?.focus();
  return()=>el?.close();
 },[]);
 return <dialog ref={dialog} className="ready-transition" aria-labelledby="ready-transition-title" aria-describedby="ready-transition-body" onCancel={e=>e.preventDefault()}>
  <div className="modal-heading"><h2 id="ready-transition-title">{copy.title}</h2></div>
  <p id="ready-transition-body">{copy.body}</p>
  <div className="ready-transition-actions"><button ref={primary} className="primary-button" disabled={disabled} onClick={onDecision}>{copy.advance}</button></div>
 </dialog>;
}
