import type { SupportLevel } from '@/types';
export const SUPPORT_POLICY_VERSION = 'v2' as const;
export const PROMPT_VERSION = 'young-learner-v4' as const;
export type SupportPolicyVersion = 'v1' | 'v2';
/** Missing markers always identify the historical policy, never the current one. */
export function supportPolicyVersion(value: unknown): SupportPolicyVersion {
  if (value === undefined || value === 'v1') return 'v1';
  if (value === SUPPORT_POLICY_VERSION) return value;
  throw new Error('Unsupported support policy');
}
export function migrateSupportLevel(level: SupportLevel, policy?: SupportPolicyVersion): SupportLevel {
  return supportPolicyVersion(policy) === 'v1' ? (level === 3 ? 2 : 1) : level;
}
export const supportLabels: Record<SupportLevel,string> = {1:'Give Me a Hint',2:'Help Me Break It Down',3:'Guide Me Step by Step'};
export const supportInstructions: Record<SupportLevel,string> = {
  1:'Level 1 — Light useful help: one short concrete task-relevant clue, then ONE manageable question. A short purpose cue is allowed. For confusion, rephrase simply, add a clue and ask an easier question instead of repeating the previous question. The learner reasons and decides; do not provide the completed answer.',
  2:'Level 2 — Partial scaffolding (normal recommended support): one partial structure, sentence frame, limited choice, comparison criterion or small partly completed organizer, with a concrete clue where useful, then ONE meaningful learner decision/question. For confusion, rephrase and offer a partial frame or limited choice. Leave meaningful blanks; never choose the final solution.',
  3:'Level 3 — Step-by-step rescue support: explain a difficult concept briefly in child-friendly language, break the current problem into at most 2–3 micro-steps or offer 2–3 task-grounded choices, and ask for ONLY the first missing small decision. A stronger sentence frame, supplied task fact or small non-final example is allowed. Continue to the next small step after the learner answers; never show a whole worksheet. Never supply a complete final solution, whole experimental design, fabricated data/observations, learner conclusion/reflection, final design choice, or all completed checkpoint fields.'
};
export function supportAcknowledgement(level:SupportLevel,previous:SupportLevel|undefined,zh:boolean):string {
  if(previous===3&&level===2)return zh?'你已经开始找到方向了，我们试着少一点带领。':'You are finding a direction. Let’s try a little less guidance.';
  if(previous===2&&level===1)return zh?'你已经能自己做更多判断了，我只给你一个小提示。':'You can make more decisions yourself. I’ll give you just a small hint.';
  return (zh?{1:'我会给你一个小提示，再让你自己想。',2:'我们把这一步拆开一点来想。',3:'我会一步一步陪你想，每次只处理一个小问题。'}:{1:'I’ll give you a small hint, then leave the thinking to you.',2:'Let’s break this step down a little.',3:'I’ll guide you step by step, one small decision at a time.'})[level];
}
