"use client";
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export function ProjectCompletionModal({zh,onClose}:{zh:boolean;onClose:(action:'PROJECT'|'REVIEW')=>void}){
 const dialog=useRef<HTMLDialogElement>(null),primary=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const el=dialog.current;el?.showModal();primary.current?.focus();return()=>el?.close();},[]);
 return <dialog ref={dialog} className="ready-transition project-celebration" aria-labelledby="project-celebration-title" aria-describedby="project-celebration-body" onCancel={e=>{e.preventDefault();onClose('REVIEW');}}>
  <div className="modal-heading"><h2 id="project-celebration-title">{zh?'项目之路走完了。':'You made it through the whole journey.'}</h2><button aria-label={zh?'关闭并查看完成的项目':'Close and review your completed project'} onClick={()=>onClose('REVIEW')}><X size={20}/></button></div>
  <div id="project-celebration-body">
   <p>{zh?'七个阶段，你都走过来了。':'You completed all seven stages.'}</p>
   <p>{zh?'你提出了想法，亲手尝试，观察结果，也重新修改了自己的判断。':'You formed ideas, tried things yourself, observed what happened, and changed your thinking along the way.'}</p>
   <p>{zh?'有些答案可能还没有结束——这很好。真正值得保留的是，你已经学会继续追问。':'Some questions may still be unfinished — that is perfectly fine. What matters is that you learned how to keep asking better questions.'}</p>
  </div>
  <div className="completion-attribution"><p>{zh?'恭喜者：哈里尔·杜博阿':'Congratulations from:'}</p><p>Harrier Du Bois</p><small>{zh?'虚构人物的趣味署名':'A playful fictional attribution'}</small></div>
  <div className="ready-transition-actions"><button ref={primary} className="primary-button" onClick={()=>onClose('PROJECT')}>{zh?'查看我的项目':'View My Project'}</button><button className="secondary-button" onClick={()=>onClose('REVIEW')}>{zh?'回顾七个阶段':'Review the Seven Stages'}</button></div>
 </dialog>;
}
