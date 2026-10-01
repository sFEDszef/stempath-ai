import type { ResearchSession } from './session';
import {assertSession} from './integrity';
export const STORAGE_PREFIX='stempath-research-v06:';
export interface SavedSession {sessionId:string;startedAt:string;condition:string;textStored:boolean;completed:boolean}
/** Only this application's versioned research keys are inspected. Ordinary drafts are untouched. */
export function readSavedSession(storage:Storage,id:string):ResearchSession {
 if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid local session ID.');
 const raw=storage.getItem(STORAGE_PREFIX+id);if(!raw)throw new Error('This local session is no longer available.');
 const value=JSON.parse(raw) as ResearchSession;
 assertSession(value);if(value.sessionId!==id)throw Error('Session key mismatch');
 return value;
}
export function listSavedSessions(storage:Storage):SavedSession[]{
 const items:SavedSession[]=[];
 for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(STORAGE_PREFIX))continue;try{const s=readSavedSession(storage,key.slice(STORAGE_PREFIX.length));items.push({sessionId:s.sessionId,startedAt:s.startedAt,condition:s.condition,textStored:s.config.storeMessageText,completed:!!s.completedAt});}catch{/* Corrupt entries remain available for explicit deletion, never restoration. */}}
 return items.toSorted((a,b)=>b.startedAt.localeCompare(a.startedAt));
}
export function restoreBundle(storage:Storage,raw:string){if(raw.length>20_000_000)throw Error('Backup too large.');const bundle=JSON.parse(raw);if(bundle?.schemaVersion!=='0.6'||!Array.isArray(bundle.sessions)||!bundle.sessions.length||bundle.sessions.length>200)throw Error('Only v0.6 bundles are supported.');const ids=new Set<string>();for(const s of bundle.sessions){assertSession(s);if(ids.has(s.sessionId)||storage.getItem(STORAGE_PREFIX+s.sessionId)!==null)throw Error('Duplicate session: restore never overwrites existing data.');ids.add(s.sessionId);}const written:string[]=[];try{for(const s of bundle.sessions){const key=STORAGE_PREFIX+s.sessionId;storage.setItem(key,JSON.stringify(s));written.push(key);}}catch(error){for(const key of written)storage.removeItem(key);throw error;}return written.length;}
export function storageEstimate(storage:Storage){let bytes=0,count=0;for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith('stempath-research-')){count++;bytes+=2*(key.length+(storage.getItem(key)?.length??0));}}return {count,bytes};}
