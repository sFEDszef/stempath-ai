import {SUPPORT_POLICY_VERSION, PROMPT_VERSION, supportPolicyVersion} from '@/lib/stem/supportLevels';
import {READINESS_POLICY_VERSION} from '@/lib/stem/readiness';
import type {ResearchSession} from './session';

/** Preserve historical exports without mixing new prompt versions into old sessions. */
export function researchChangeReason(session: ResearchSession) {
  if (supportPolicyVersion(session.supportPolicyVersion) !== SUPPORT_POLICY_VERSION) return 'SUPPORT_POLICY_CHANGE' as const;
  if (session.readinessPolicyVersion !== READINESS_POLICY_VERSION) return 'READINESS_POLICY_CHANGE' as const;
  if (session.promptVersion !== PROMPT_VERSION) return 'PROMPT_VERSION_CHANGE' as const;
  return undefined;
}
