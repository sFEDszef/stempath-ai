import type { ChatRequest, CoachResponse, CoachMetadata } from '@/types';
export type CoachProvider = (request:ChatRequest)=>Promise<CoachResponse>;
export type FailureCode='not_configured'|'configuration'|'authentication'|'balance'|'rate_limit'|'upstream'|'network'|'timeout'|'invalid_response'|'pedagogy';
export class ProviderError extends Error {
 constructor(public code:FailureCode,public status=502,public metadata?:CoachMetadata){super(code);this.name='ProviderError';}
}
export const release={STEMPathVersion:'0.7',promptVersion:'young-learner-v3'} as const;

export const diagnostics:Record<FailureCode,string>={not_configured:'NOT_CONFIGURED',configuration:'CONFIGURATION_ERROR',authentication:'AUTH_ERROR',balance:'INSUFFICIENT_BALANCE',rate_limit:'RATE_LIMIT',upstream:'PROVIDER_5XX',network:'NETWORK_ERROR',timeout:'TIMEOUT',invalid_response:'INVALID_RESPONSE',pedagogy:'PEDAGOGICAL_COMPLIANCE_FAILURE'};
