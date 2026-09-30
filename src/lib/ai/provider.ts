import type { ChatRequest, CoachResponse } from '@/types';
export type CoachProvider = (request:ChatRequest)=>Promise<CoachResponse>;
export type FailureCode='not_configured'|'configuration'|'authentication'|'balance'|'rate_limit'|'upstream'|'network'|'timeout'|'invalid_response'|'pedagogy';
export class ProviderError extends Error {
 constructor(public code:FailureCode,public status=502){super(code);this.name='ProviderError';}
}
export const release={STEMPathVersion:'0.5.3',promptVersion:'deepseek-v1'} as const;
