import 'server-only';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {sessionSecret} from './config';
import {READINESS_POLICY_VERSION,type StageReadinessAssessment} from '@/lib/stem/readiness';
import type {StageId,Message,STEMTask} from '@/types';
function sign(value:unknown){return createHmac('sha256',sessionSecret()).update(JSON.stringify(value)).digest('hex');}
function same(expected:string,actual:unknown){return typeof actual==='string'&&/^[a-f0-9]{64}$/.test(actual)&&timingSafeEqual(Buffer.from(expected),Buffer.from(actual));}
function verdict(project:string,stage:StageId,a:StageReadinessAssessment){return [READINESS_POLICY_VERSION,project,stage,a.taskRevision,a.meaningfulRounds,a.requiredRounds,a.satisfiedCriteria,a.missingCriteria,a.criteriaRequiredCount];}
export function attestReadiness(project:string,stage:StageId,a:StageReadinessAssessment){return a.policyVersion===READINESS_POLICY_VERSION?{...a,attestation:sign(verdict(project,stage,a))}:a;}
export function verifiedReadiness(project:string,stage:StageId,a:StageReadinessAssessment|undefined){return !!a&&a.policyVersion===READINESS_POLICY_VERSION&&same(sign(verdict(project,stage,a)),a.attestation);}
export function attestRound(project:string,task:STEMTask,stage:StageId,student:Pick<Message,'id'|'text'>,coach:Pick<Message,'text'>,intent:string){return sign([READINESS_POLICY_VERSION,project,task.taskRevision??1,stage,student.id,student.text,coach.text,intent]);}
export function verifiedRound(project:string,task:STEMTask,stage:StageId,student:Message,coach:Message){return !!coach.dialogue?.successful&&coach.dialogue.replyTo===student.id&&same(attestRound(project,task,stage,student,coach,coach.dialogue.intent),coach.dialogue.receipt);}
