import 'server-only';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {sessionSecret} from './config';
import {READINESS_POLICY_VERSION,readinessCriteria,type StageReadinessAssessment} from '@/lib/stem/readiness';
import type {StageId} from '@/types';
function signature(project:string,stage:StageId){return createHmac('sha256',sessionSecret()).update(JSON.stringify([READINESS_POLICY_VERSION,project,stage,readinessCriteria[stage]])).digest('hex');}
export function attestReadiness(project:string,stage:StageId,a:StageReadinessAssessment){return a.ready&&a.source==='AI_SEMANTIC'?{...a,attestation:signature(project,stage)}:a;}
export function verifiedReadiness(project:string,stage:StageId,a:StageReadinessAssessment|undefined){if(!a?.ready||a.criterion!==readinessCriteria[stage]||a.source!=='AI_SEMANTIC'||!a.attestation||!/^[a-f0-9]{64}$/.test(a.attestation))return false;return timingSafeEqual(Buffer.from(signature(project,stage)),Buffer.from(a.attestation));}
