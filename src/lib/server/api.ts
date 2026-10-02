import 'server-only';
import {platformConfig} from './config';
import {database,type DB} from './db';
import {Accounts,privileged} from './accounts';
import {Projects} from './projects';
import {ResearchStore} from './research';
import {PlatformError,fail,jsonBody,sameOrigin,cookie} from './security';
const uuid=(v:string)=>{if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v))return fail(400,'Invalid ID');return v;};
export const response=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export function errorResponse(e:unknown){return response({error:e instanceof PlatformError?e.message:'Service unavailable. Please try again. / 暂时无法连接，请稍后再试。'},e instanceof PlatformError?e.status:503);}
export async function platformAPI(request:Request,path:string[],injected?:DB){try{
 const config=platformConfig(),route=path.join('/'),method=request.method;
 if(route==='config'&&method==='GET')return response(config);
 if(config.persistence!=='postgres')return response({error:'Server accounts are not enabled'},404);
 const db=injected??database(),accounts=new Accounts(db),projects=new Projects(db),research=new ResearchStore(db);
 if(method!=='GET')sameOrigin(request);
 if(route==='login'&&method==='POST'){const body=await jsonBody(request,2000);const ip=process.env.TRUST_PROXY==='true'?(request.headers.get('x-forwarded-for')?.split(',')[0].trim().slice(0,80)??'unknown'):'single-ingress';const login=await accounts.login(body.participantCode,body.pin,ip);return response({account:login.account},200,{'Set-Cookie':cookie(login.token,login.maxAge)});}
 if(route==='logout'&&method==='POST'){await accounts.logout(request);return response({ok:true},200,{'Set-Cookie':cookie('',0)});}
 const user=await accounts.authenticate(request);
 if(route==='session'&&method==='GET')return response({account:user});
 if(route==='assignments'&&method==='GET')return response({assignments:await projects.assigned(user)});
 if(route==='projects'&&method==='GET')return response({projects:await projects.list(user)});
 if(route==='projects'&&method==='POST'){const body=await jsonBody(request,32000);return response({project:await projects.create(user,body.task,config.browsing,body.config)},201);}
 if(path[0]==='projects'&&path[1]){const id=uuid(path[1]);if(path.length===2){if(method==='GET')return response({project:await projects.get(user,id)});if(method==='PUT'){const body=await jsonBody(request);return response({project:await projects.save(user,id,body.project,body.version)});}if(method==='DELETE'){const body=await jsonBody(request,2000);await projects.remove(user,id,body.confirmation);return response({ok:true});}}
  if(path[2]==='research'&&path.length===3){if(method==='GET')return response(await research.latest(user,id));if(method==='PUT'){const body=await jsonBody(request,4_000_000);return response(await research.save(user,id,body.session,body.version));}}
 }
 if(path[0]==='admin'){privileged(user);
  if(route==='admin/accounts'&&method==='GET')return response({accounts:await accounts.list()});
  if(route==='admin/accounts'&&method==='POST'){const b=await jsonBody(request,2000);return response(await accounts.create(b.participantCode),201);}
  if(route==='admin/batch'&&method==='POST'){const b=await jsonBody(request,2000);return response({created:await accounts.batch(b.prefix,b.count,b.start)},201);}
  if(route==='admin/status'&&method==='GET')return response({projects:await projects.status(user)});
  if(path[1]==='accounts'&&path[2]){const id=uuid(path[2]);if(path.length===3&&method==='DELETE'){const b=await jsonBody(request,2000);await accounts.remove(user,id,b.confirmation);return response({ok:true});}
   if(path[3]==='reset'&&method==='POST')return response(await accounts.reset(user,id));
   if(path[3]==='disable'&&method==='POST'){await accounts.disable(user,id);return response({ok:true});}
   if(path[3]==='assign'&&method==='POST'){const b=await jsonBody(request,32000);return response({assignment:await projects.assign(user,id,b.task,b.config)});}
   if(path[3]==='research'&&method==='GET')return response({export:await research.export(user,id)});
  }
 }
 return response({error:'Not found'},404);
 }catch(e){return errorResponse(e);}}
