import 'server-only';
import {requestReadiness} from '@/lib/stem/readiness';
import { demoReply } from '@/lib/stem/demo';
import type { ChatRequest, CoachResponse } from '@/types';
import { release, type FailureCode } from './provider';
export function demoProvider(request:ChatRequest,fallbackReason?:FailureCode):CoachResponse {
 return {...demoReply(request),readiness:requestReadiness(request),metadata:{...release,provider:'demo',model:'deterministic',responseMode:'demo',...(fallbackReason?{fallbackReason}: {})}};
}
