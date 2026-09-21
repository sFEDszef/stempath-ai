import type { ResearchSession } from './session';
export const STORAGE_PREFIX='stempath-research-v5:';
export interface SavedSession {sessionId:string;startedAt:string;condition:string;textStored:boolean;completed:boolean}
/** Only this application's versioned research keys are inspected. Ordinary drafts are untouched. */
export function readSavedSession(storage:Storage,id:string):ResearchSession {
 if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid local session ID.');
 const raw=storage.getItem(STORAGE_PREFIX+id);if(!raw)throw new Error('This local session is no longer available.');
 const value=JSON.parse(raw) as ResearchSession;
 if(value.schemaVersion!==5||value.sessionId!==id||!Array.isArray(value.events)||!Array.isArray(value.tasks)||!Array.isArray(value.artifactRevisions)||!Array.isArray(value.supportHistory)||!Array.isArray(value.stageTimings)||!value.config)throw new Error('The saved session format is not supported.');
 return value;
}
export function listSavedSessions(storage:Storage):SavedSession[]{
 const items:SavedSession[]=[];
 for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(STORAGE_PREFIX))continue;try{const s=readSavedSession(storage,key.slice(STORAGE_PREFIX.length));items.push({sessionId:s.sessionId,startedAt:s.startedAt,condition:s.condition,textStored:s.config.storeMessageText,completed:!!s.completedAt});}catch{/* Corrupt entries remain available for explicit deletion, never restoration. */}}
 return items.toSorted((a,b)=>b.startedAt.localeCompare(a.startedAt));
}
