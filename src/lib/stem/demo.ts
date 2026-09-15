import type { ChatRequest, CoachResponse } from '@/types';
import { pedagogy, getStages } from './stages';
export function demoReply(request:ChatRequest):CoachResponse {
 const {task,stage,level,message}=request;const chinese=/[\u3400-\u9fff]/.test(message);
 const context=task.successCriteria?.[0]??task.objectives?.[0]??task.description.slice(0,160);
 const saved=Object.values(request.artifacts[stage]??{}).find(v=>v.trim());
 let text:string;
 if(request.intent==='challenge') text=chinese?`关于“${task.title}”的待检验说法：只要一次观察符合“${context}”，就足以证明这个方法在所有条件下都有效。`:`A claim to investigate for “${task.title}”: one observation matching “${context}” is enough to show that this approach works under all conditions.`;
 else if(request.intent==='evaluate-claim') text=chinese?`你可以质疑这个说法。对于“${task.title}”，什么证据会让你接受、拒绝或修改它？你会怎样检查？`:`For “${task.title}”, what evidence would make you accept, reject or revise this claim? How could you check it?`;
 else {
  const lead=chinese?`我们正在探索“${task.title}”。`:`For “${task.title}”, let’s focus on ${getStages(task).find(s=>s.id===stage)!.title.toLowerCase()}.`;
  const question=chinese?({understand:'你怎样用自己的话说明目标和限制条件？',imagine:'你能提出两个不同的想法或假设吗？为什么？',plan:'你会改变什么、保持什么不变，又怎样收集证据？',build:'你尝试了什么？实际发生了什么？',test:'你观察或测量到了什么？哪些是事实，哪些是解释？',improve:'哪条证据支持你的修改？你会怎样比较？',reflect:'什么证据改变了你的想法？你怎样检查或质疑 AI 的建议？'}[stage]):pedagogy[stage].examples[0];
  const zhHints = {
understand:['先区分目标与限制条件。','试着补全：目标是___；限制是___；成功的证据是___。'],
imagine:['可以从不同的假设出发比较可能性。','比较想法 A 和 B：优点___；疑问___；需要的证据___。'],
plan:['想想改变一个因素时，哪些条件需要保持一致。','补全：改变___；保持___；测量___；重复___。'],
build:['先比较预期与实际发生的情况。','记录：尝试的步骤___；预期___；观察___；安全检查___。'],
test:['看看多次观察是否一致，区分观察与解释。','记录表可以包含：次数、条件、带单位的测量、观察。哪些内容还缺少？'],
improve:['用具体证据支持一次修改，便于比较。','补全：证据___；修改___；预测___；比较方法___。'],
reflect:['比较自己决定的步骤和受 AI 影响的步骤。','补全：最初认为___；证据显示___；接受或拒绝 AI 建议的理由___。']
};
  const scaffold=level===1?'':chinese?zhHints[stage][level-2]:pedagogy[stage].examples[level-1];
  const artifact=saved?(chinese?`你记录了“${saved.slice(0,100)}”。`:`You recorded “${saved.slice(0,100)}”.`):'';
  text=`${lead} ${artifact}\n\n${scaffold}${scaffold?'\n':''}${question}`;
 }
 return {text,suggestions:request.intent==='challenge'?[]:pedagogy[stage].replies,mode:'demo'};
}
