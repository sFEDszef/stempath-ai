import 'server-only';
import { demoReply } from '@/lib/stem/demo';
import type { ChatRequest, CoachResponse } from '@/types';
import { release, type FailureCode } from './provider';
export function demoProvider(request:ChatRequest,fallbackReason?:FailureCode):CoachResponse {
 return {...demoReply(request),metadata:{...release,provider:'demo',model:'deterministic',responseMode:'demo',...(fallbackReason?{fallbackReason}: {})}};
}
