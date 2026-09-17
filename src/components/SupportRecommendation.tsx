import type { Decision } from '@/lib/pedagogy/decisionEngine';
export function SupportRecommendation({decision,onChoice,disabled}:{decision:Decision;onChoice:(accept:boolean)=>void;disabled:boolean}){
 const zh=decision.state.language==='zh';
 return <section className="rail-section fading" aria-label="Support recommendation" aria-live="polite"><p>{decision.reason==='stronger'?(zh?'想试试更具体的提示吗？':'Would a more concrete hint help?'):(zh?'你已经表达了自己的理由。想试试减少一点支持吗？':'You have been explaining your own reasoning. Want to try with less support?')}</p><small>{zh?'当前支持':'Current support'}: Level {decision.state.currentSupportLevel} · {zh?'建议':'Suggested'}: Level {decision.recommendation}</small><div><button disabled={disabled} onClick={()=>onChoice(false)}>{zh?'保持当前支持':'Keep current support'}</button><button disabled={disabled} onClick={()=>onChoice(true)}>{zh?'尝试':'Try'} Level {decision.recommendation}</button></div></section>;
}
