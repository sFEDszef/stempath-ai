import 'server-only';
import {randomBytes,randomInt,scrypt,timingSafeEqual,createHmac} from 'node:crypto';
import {sessionSecret} from './config';
export class PlatformError extends Error {constructor(public status:number,message:string){super(message);}}
export const fail=(status:number,message:string):never=>{throw new PlatformError(status,message);};
export const codePattern=/^[A-Z][A-Z0-9-]{1,31}$/;
export function participantCode(value:unknown){if(typeof value!=='string')return fail(400,'Invalid participant code');const c=value.trim().toUpperCase();if(!codePattern.test(c))return fail(400,'Use a short participant code such as P001');return c;}
export function pinValue(value:unknown){if(typeof value!=='string'||!/^\d{4,12}$/.test(value))return fail(400,'Use 4–12 PIN digits');return value;}
export function randomPIN(){return String(randomInt(0,1_000_000)).padStart(6,'0');}
const derive=(pin:string,salt:Buffer)=>new Promise<Buffer>((resolve,reject)=>scrypt(pin,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024},(e,key)=>e?reject(e):resolve(key)));
export async function hashPIN(pin:string){pinValue(pin);const salt=randomBytes(16);return `scrypt$32768$8$3$${salt.toString('hex')}$${(await derive(pin,salt)).toString('hex')}`;}
export async function verifyPIN(pin:string,hash:string){const parts=hash.split('$');if(parts.length!==6||parts.slice(0,4).join('$')!=='scrypt$32768$8$3'||!/^[a-f0-9]{32}$/.test(parts[4])||!/^[a-f0-9]{128}$/.test(parts[5]))return false;const actual=await derive(pin,Buffer.from(parts[4],'hex'));return timingSafeEqual(actual,Buffer.from(parts[5],'hex'));}
export function securityHash(value:string){return createHmac('sha256',sessionSecret()).update(value).digest('hex');}
export const COOKIE='stempath_session';
export function cookie(token:string,maxAge:number){return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
export function readToken(request:Request){const value=request.headers.get('cookie')?.split(';').find(p=>p.trim().startsWith(COOKIE+'='))?.trim().slice(COOKIE.length+1);return value&&/^[a-f0-9]{64}$/.test(value)?value:undefined;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin'),host=request.headers.get('host')??new URL(request.url).host;try{if(!origin||new URL(origin).host!==host)fail(403,'Request origin is not allowed');}catch{fail(403,'Request origin is not allowed');}}
export async function jsonBody(request:Request,max=2_000_000):Promise<Record<string,unknown>> {if(!request.headers.get('content-type')?.includes('application/json'))return fail(415,'Send JSON');const reader=request.body?.getReader();if(!reader)return fail(400,'Missing body');let size=0;const chunks:Uint8Array[]=[];while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>max){await reader.cancel();return fail(413,'Request too large');}chunks.push(v.value);}try{const v=JSON.parse(Buffer.concat(chunks).toString());if(!v||typeof v!=='object'||Array.isArray(v))return fail(400,'Invalid JSON');return v;}catch{return fail(400,'Invalid JSON');}}
