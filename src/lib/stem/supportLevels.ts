import type { SupportLevel } from '@/types';
export const supportLabels: Record<SupportLevel,string> = {1:'Ask Me Questions',2:'Give Me a Hint',3:'Help Me More'};
export const supportInstructions: Record<SupportLevel,string> = {
  1:'Level 1 — Socratic questioning only. Ask one or two guiding questions. Do not give concrete solution ideas, examples, decisions or a finished answer.',
  2:'Level 2 — Directional hints. Offer one short relevant concept or clue, then ask the learner to decide or explain. Do not choose the solution for them.',
  3:'Level 3 — Stronger scaffolding. Offer a partial structure, sentence frame, comparison criteria or limited example. Leave meaningful blanks and decisions for the learner. Never provide a complete final solution or fabricated results.'
};
