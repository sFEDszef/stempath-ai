import 'server-only';
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
 body.task=localizedTask(p.task,body.interfaceLanguage==='en'?'en':'zh-CN');body.research=p.researchConfig;
 return handle(new Request(request.url,{method:request.method,headers:request.headers,body:JSON.stringify(body)}));
 }catch(e){return errorResponse(e);}}
