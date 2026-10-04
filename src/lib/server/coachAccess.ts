import 'server-only';
import {attestReadiness,attestRound,verifiedReadiness,verifiedRound} from './readinessReceipt';
import {parseReadiness} from '@/lib/stem/readiness';
import {stageIds} from '@/lib/stem/stages';
import {parseProgressionHistory} from '@/lib/stem/validation';
import type {Message,StageId} from '@/types';
import {platformConfig} from './config';
import {database,type DB} from './db';
import {Accounts,privileged} from './accounts';
import {Projects} from './projects';
import {sameOrigin,jsonBody,fail} from './security';
import {errorResponse} from './api';
import {localizedTask} from '@/lib/stem/tasks';
import {MAX_BODY_BYTES} from '@/lib/stem/validation';
export async function guardedCoach(request:Request,handle:(r:Request)=>Promise<Response>,teacher=false,injected?:DB){try{const config=platformConfig();if(config.auth==='disabled')return handle(request);sameOrigin(request);const db=injected??database(),user=await new Accounts(db).authenticate(request);if(teacher){privileged(user);return handle(request);}
 const body=await jsonBody(request,MAX_BODY_BYTES);if(typeof body.projectId!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.projectId))return fail(400,'Choose your project first');const p=await new Projects(db).get(user,body.projectId);if(p.researchConfig.condition==='NO_AI')return fail(403,'AI is disabled for this assignment');
 const stage=body.stage as StageId;
 if(!stageIds.includes(stage))return fail(400,'Invalid stage');
 const saved=p.conversations[stage]??[],trusted=new Map(saved.map(m=>[m.id,m]));
 const supplied=parseProgressionHistory(body.progressionHistory??[]);
 for(const [index,m] of supplied.entries()){
  if(trusted.has(m.id))continue;
  if(m.role==='assistant'){
   const student=supplied[index-1];if(!student||student.role!=='student'||!verifiedRound(p.id,p.task,stage,student as Message,m as Message))continue;
  }
  trusted.set(m.id,m as Message);
 }
 body.progressionHistory=[...trusted.values()].slice(-200);
 const prior=parseReadiness(body.priorReadiness,stage,'AI_SEMANTIC');body.priorReadiness=verifiedReadiness(p.id,stage,prior)?prior:p.readiness[stage];
 body.task=localizedTask(p.task,body.interfaceLanguage==='en'?'en':'zh-CN');body.research=p.researchConfig;
 const response=await handle(new Request(request.url,{method:request.method,headers:request.headers,body:JSON.stringify(body)}));
 if(response.ok){const data=await response.clone().json();const a=parseReadiness(data.readiness,stage,data.readiness?.source??'DEMO');
  return Response.json({...data,...(a?{readiness:attestReadiness(p.id,stage,a)}:{}),...(typeof body.messageId==='string'&&typeof body.message==='string'?{roundReceipt:attestRound(p.id,p.task,stage,{id:body.messageId,text:body.message.trim()},{text:data.text},String(body.intent??'chat'))}:{})},{status:response.status,headers:response.headers});}

 return response;
 }catch(e){return errorResponse(e);}}
