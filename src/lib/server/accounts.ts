import 'server-only';
import {randomBytes,randomUUID} from 'node:crypto';
import type {DB} from './db';
import {fail,hashPIN,participantCode,pinValue,randomPIN,verifyPIN,securityHash,readToken} from './security';
export type Role='STUDENT'|'RESEARCHER'|'ADMIN';
export interface Account {id:string;participantCode:string;role:Role;status:'ACTIVE'|'DISABLED';}
interface UserRow extends Record<string,unknown>{id:string;participant_code:string;role:Role;status:'ACTIVE'|'DISABLED';pin_hash:string;}
const safe=(r:UserRow):Account=>({id:r.id,participantCode:r.participant_code,role:r.role,status:r.status});
export function privileged(user:Account){if(!['RESEARCHER','ADMIN'].includes(user.role))fail(403,'Researcher access required');}
export class Accounts {
 constructor(private db:DB,private now=()=>Date.now()){}
 async create(code:unknown,role:Role='STUDENT',pin=randomPIN()){
  if(!['STUDENT','RESEARCHER','ADMIN'].includes(role))return fail(400,'Invalid role');
  const value=participantCode(code),hash=await hashPIN(pin),id=randomUUID();
  try{const [r]=await this.db.query<UserRow>('INSERT INTO users (id,participant_code,pin_hash,role) VALUES ($1,$2,$3,$4) RETURNING *',[id,value,hash,role]);return {account:safe(r),displayPIN:pin};}
  catch(e){if((e as {code?:string}).code==='23505')return fail(409,'Participant code already exists');throw e;}
 }
 async batch(prefix:unknown,count:unknown,start:unknown=1){
  if(typeof prefix!=='string'||! /^[A-Z]{1,8}$/.test(prefix)||!Number.isInteger(count)||Number(count)<1||Number(count)>100||!Number.isInteger(start)||Number(start)<1||Number(start)>999999)return fail(400,'Use a prefix and 1–100 accounts');
  return this.db.transaction(async db=>{const a=new Accounts(db,this.now),rows=[];for(let i=0;i<Number(count);i++)rows.push(await a.create(prefix+String(Number(start)+i).padStart(3,'0')));return rows;});
 }
 async limit(code:string,ip:string){
  // Persistent atomic counters: requests, including successes, are limited. Never a permanent account lock.
  const now=new Date(this.now()),expiry=new Date(this.now()+15*60_000);
  for(const [kind,value,max] of [['code',code,5],['ip',ip,20]] as const){
   const key=securityHash(`login:${kind}:${value}`);
   const [r]=await this.db.query<{attempts:number}&Record<string,unknown>>(`INSERT INTO login_limits (key,attempts,expires_at) VALUES ($1,1,$2)
   ON CONFLICT (key) DO UPDATE SET attempts=CASE WHEN login_limits.expires_at<=$3 THEN 1 ELSE login_limits.attempts+1 END,
   expires_at=CASE WHEN login_limits.expires_at<=$3 THEN $2 ELSE login_limits.expires_at END RETURNING attempts`,[key,expiry,now]);
   if(r.attempts>max)fail(429,'Please wait before trying again. / 请稍后再试。');
  }
  await this.db.query('DELETE FROM login_limits WHERE expires_at < $1',[new Date(this.now()-86400_000)]);
 }
 async login(code:unknown,pin:unknown,ip:string){
  const c=participantCode(code);await this.limit(c,ip);const p=pinValue(pin);
  const [r]=await this.db.query<UserRow>('SELECT * FROM users WHERE participant_code=$1',[c]);
  // Missing codes still do a full KDF to avoid the fast account-enumeration path.
  const fallback='scrypt$32768$8$3$'+'00'.repeat(16)+'$'+'00'.repeat(64);
  const valid=await verifyPIN(p,r?.pin_hash??fallback);
  if(!r||!valid||r.status!=='ACTIVE')return fail(401,'Check your participant code and PIN. / 请检查研究编号和 PIN。');
  const token=randomBytes(32).toString('hex'),expires=new Date(this.now()+8*3600_000);
  const account=await this.db.transaction(async db=>{
   // Reset/disable races cannot create a session against the old hash.
   const [current]=await db.query<UserRow>('SELECT * FROM users WHERE id=$1 FOR UPDATE',[r.id]);
   if(!current||current.status!=='ACTIVE'||current.pin_hash!==r.pin_hash)return fail(401,'Please sign in again');
   await db.query('DELETE FROM auth_sessions WHERE expires_at <= $1',[new Date(this.now())]);
   await db.query('INSERT INTO auth_sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)',[securityHash(token),r.id,expires]);return safe(current);
  });return {account,token,maxAge:8*3600};
 }
 async authenticate(request:Request){const token=readToken(request);if(!token)return fail(401,'Please sign in / 请先登录');
  const [r]=await this.db.query<UserRow>('SELECT u.* FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND u.status=\'ACTIVE\'',[securityHash(token),new Date(this.now())]);
  if(!r)return fail(401,'Session expired. Please sign in / 请重新登录');return safe(r);
 }
 async logout(request:Request){const token=readToken(request);if(token)await this.db.query('DELETE FROM auth_sessions WHERE token_hash=$1',[securityHash(token)]);}
 async list(){return (await this.db.query<UserRow>('SELECT id,participant_code,role,status FROM users ORDER BY participant_code LIMIT 500')).map(safe);}
 async reset(actor:Account,id:string){privileged(actor);const pin=randomPIN(),hash=await hashPIN(pin);await this.db.transaction(async db=>{const [r]=await db.query<UserRow>('SELECT * FROM users WHERE id=$1 FOR UPDATE',[id]);if(!r||r.role!=='STUDENT')return fail(404,'Student not found');await db.query('UPDATE users SET pin_hash=$2,updated_at=now() WHERE id=$1',[id,hash]);await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[id]);await db.query('DELETE FROM login_limits WHERE key=$1',[securityHash(`login:code:${r.participant_code}`)]);});return {displayPIN:pin};}
 async disable(actor:Account,id:string){privileged(actor);const [r]=await this.db.query('UPDATE users SET status=\'DISABLED\',updated_at=now() WHERE id=$1 AND role=\'STUDENT\' RETURNING id',[id]);if(!r)return fail(404,'Student not found');await this.db.query('DELETE FROM auth_sessions WHERE user_id=$1',[id]);}
 async remove(actor:Account,id:string,confirmation:unknown){privileged(actor);await this.db.transaction(async db=>{const [r]=await db.query<UserRow>('SELECT * FROM users WHERE id=$1 AND role=\'STUDENT\' FOR UPDATE',[id]);if(!r)return fail(404,'Student not found');if(confirmation!==`DELETE ${r.participant_code}`)return fail(400,'Type DELETE followed by the participant code');await db.query('DELETE FROM login_limits WHERE key=$1',[securityHash(`login:code:${r.participant_code}`)]);const tasks=await db.query('SELECT id FROM task_definitions WHERE created_by=$1',[id]);await db.query('DELETE FROM users WHERE id=$1',[id]);for(const t of tasks)await db.query('DELETE FROM task_definitions WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM projects WHERE task_id=$1) AND NOT EXISTS (SELECT 1 FROM task_assignments WHERE task_id=$1)',[t.id]);});}
}
