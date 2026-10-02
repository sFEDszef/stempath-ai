'use client';
import {projectSnapshot,type Project} from '@/lib/projects/storage';
import type {STEMTask} from '@/types';
import type {ResearchSession} from '@/lib/research/session';
import type {ResearchConfig} from '@/lib/research/config';
import {canonical} from '@/lib/research/traceability';
export interface RemoteProject extends Project {serverVersion:number;updatedAt:string;researchConfig:ResearchConfig;}
export class PersistenceError extends Error {constructor(public status:number,message:string){super(message);}}
export async function platformFetch<T>(path:string,method='GET',body?:unknown):Promise<T>{const r=await fetch('/api/platform/'+path,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw new PersistenceError(r.status,data.error??'Please try again');return data;}
/** Server versions are held in memory only. Never replay anonymous local projects into an account. */
export class RemoteProjectStore {
 private versions=new Map<string,number>();private saved=new Map<string,string>();private queue:Promise<unknown>=Promise.resolve();private researchVersions=new Map<string,number>();
 async load(){const {projects}=await platformFetch<{projects:RemoteProject[]}>('projects');this.versions.clear();this.saved.clear();for(const p of projects){this.versions.set(p.id,p.serverVersion);this.saved.set(p.id,canonical(projectSnapshot(p)));}return projects;}
 async create(task:STEMTask,config?:ResearchConfig){const {project}=await platformFetch<{project:RemoteProject}>('projects','POST',{task,config});this.versions.set(project.id,project.serverVersion);this.saved.set(project.id,canonical(projectSnapshot(project)));return project;}
 async refresh(id:string){const {project}=await platformFetch<{project:RemoteProject}>('projects/'+id);this.versions.set(id,project.serverVersion);this.saved.set(id,canonical(projectSnapshot(project)));return project;}
 saveAll(projects:Project[]){const snapshot=projects.map(projectSnapshot);const run=async()=>{
  // No delete is inferred from an empty/failed list load. Removal uses its own deliberate API.
  for(const p of snapshot){const encoded=canonical(p);if(this.saved.get(p.id)===encoded)continue;const version=this.versions.get(p.id);if(!version)throw new PersistenceError(409,'Reopen the server project before saving');const {project}=await platformFetch<{project:RemoteProject}>('projects/'+p.id,'PUT',{project:p,version});this.versions.set(p.id,project.serverVersion);this.saved.set(p.id,encoded);}
 };const promise=this.queue.catch(()=>{}).then(run);this.queue=promise;return promise;}
 async remove(id:string){await this.queue;await platformFetch('projects/'+id,'DELETE',{confirmation:'DELETE PROJECT'});this.versions.delete(id);this.saved.delete(id);}
 async loadResearch(projectId:string){const saved=await platformFetch<{session:ResearchSession;version:number}|null>('projects/'+projectId+'/research');if(saved)this.researchVersions.set(saved.session.sessionId,saved.version);return saved?.session;}
 saveResearch(projectId:string,session:ResearchSession){const run=async()=>{const result=await platformFetch<{version:number}>('projects/'+projectId+'/research','PUT',{session,version:this.researchVersions.get(session.sessionId)??0});this.researchVersions.set(session.sessionId,result.version);};const promise=this.queue.catch(()=>{}).then(run);this.queue=promise;return promise;}
 async settled(){await this.queue;}
}
