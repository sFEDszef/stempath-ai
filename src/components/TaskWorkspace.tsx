'use client';
import {RemoteProjectStore,platformFetch,type RemoteProject} from '@/lib/persistence/client';
import type {Account} from '@/lib/server/accounts';
import {endSession} from '@/lib/research/session';
import {READINESS_POLICY_VERSION} from '@/lib/stem/readiness';
import {SUPPORT_POLICY_VERSION,supportPolicyVersion} from '@/lib/stem/supportLevels';
import type {ResearchSession} from '@/lib/research/session';
import {useCallback,useEffect,useRef,useState} from 'react';
import Workspace from './Workspace';
import {Header} from './Header';
import {Footer} from './Footer';
import {ProjectHub,type View} from './ProjectHub';
import {I18nProvider,useI18n} from '@/lib/i18n';
import {reviseTask} from "@/lib/research/traceability";
import {loadTask,localizedTask,TASK_LOAD_EVENT} from '@/lib/stem/tasks';
import {demoTasks} from '@/data/tasks';
import {LIBRARY_KEY,PROJECTS_KEY,newProject,parseProject,readCollection,projectSnapshot,type Project,type ProjectProgress} from '@/lib/projects/storage';
import {useResearchSession} from '@/lib/research/useResearchSession';
import {researchMode,initialLevel,type ResearchConfig} from '@/lib/research/config';
import type {STEMTask} from '@/types';
interface Props {serverAccount?:Account;taskMode?:'OPEN'|'ASSIGNED';onLogout?:()=>Promise<void>;onAdmin?:()=>void;}
export default function TaskWorkspace(props:Props){return <I18nProvider><Platform {...props}/></I18nProvider>;}
function Platform({serverAccount,taskMode='OPEN',onLogout,onAdmin}:Props){
 const {t,locale}=useI18n();const [ready,setReady]=useState(false);const [view,setView]=useState<View>('Home');const [library,setLibrary]=useState<STEMTask[]>([]);const [projects,setProjects]=useState<Project[]>([]);const projectsRef=useRef<Project[]>([]);const activeRef=useRef<string|null>(null);const [active,setActive]=useState<Project|null>(null);const [preview,setPreview]=useState<STEMTask|null>(null);const [editing,setEditing]=useState<STEMTask|null>(null);const [researchVisible,setResearchVisible]=useState(false);const [notice,setNotice]=useState('');const remote=useRef(serverAccount?new RemoteProjectStore():null);const sessionProjects=useRef(new Map<string,string>());const [assigned,setAssigned]=useState<STEMTask[]>([]);
 const persistResearch=useCallback((session:ResearchSession)=>{const id=sessionProjects.current.get(session.sessionId)??activeRef.current;if(!id||!remote.current)return Promise.resolve();sessionProjects.current.set(session.sessionId,id);return remote.current.saveResearch(id,session);},[]);
 const research=useResearchSession({server:!!serverAccount,onSave:persistResearch});const {start,end,interfaceLanguage,flush:flushResearch,restore:restoreResearch}=research;
 const [saveStatus,setSaveStatus]=useState<'saved'|'saving'|'failed'>('saved');const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const flushProjects=useCallback(async()=>{if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=null;try{if(remote.current)await remote.current.saveAll(projectsRef.current);else localStorage.setItem(PROJECTS_KEY,JSON.stringify(projectsRef.current.map(projectSnapshot)));setSaveStatus('saved');return true;}catch(e){setSaveStatus('failed');if(remote.current)setNotice(e instanceof Error?e.message:'Could not save. Please retry.');return false;}},[]);
 const saveProjects=useCallback((next:Project[])=>{projectsRef.current=next;setProjects(next);setSaveStatus('saving');if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(flushProjects,350);},[flushProjects]);
 useEffect(()=>{const flush=()=>flushProjects();const hidden=()=>{if(document.visibilityState==='hidden')flush();};window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hidden);return()=>{flush();window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hidden);};},[flushProjects]);
 const open=useCallback(async(p:Project,config?:ResearchConfig)=>{try{
 if(!await flushProjects())return;
 if(remote.current){const found=projectsRef.current.some(v=>v.id===p.id);p=found?await remote.current.refresh(p.id):await remote.current.create(p.task,config);config=(p as RemoteProject).researchConfig;}
 let provider="auto",model="pending";try{const status=await fetch("/api/coach-status",{signal:AbortSignal.timeout(5000)}).then(r=>r.json());if(["demo","deepseek"].includes(status.provider)&&typeof status.model==="string"){provider=status.provider;model=status.model;}}catch{}
 end('RESET');if(remote.current){flushResearch();await remote.current.settled();}
 const next={...p,lastOpenedAt:new Date().toISOString(),...(config&&!remote.current?{level:initialLevel(config.condition,config.initialSupportLevel)}:{})};saveProjects([next,...projectsRef.current.filter(v=>v.id!==p.id)]);activeRef.current=p.id;
 const prior=remote.current?await remote.current.loadResearch(p.id):undefined;
 if(prior&&supportPolicyVersion(prior.supportPolicyVersion)===SUPPORT_POLICY_VERSION&&prior.readinessPolicyVersion===READINESS_POLICY_VERSION)restoreResearch(prior);else {if(prior&&remote.current)await remote.current.saveResearch(p.id,endSession(prior,prior.supportPolicyVersion===SUPPORT_POLICY_VERSION?'READINESS_POLICY_CHANGE':'SUPPORT_POLICY_CHANGE'));start(p.task,config,{interfaceLanguage:locale,taskLanguage:p.task.translations?.[locale]?locale:/[\u3400-\u9fff]/.test(p.task.title)?"zh-CN":"en",provider:config?.condition==="NO_AI"?"none":provider,model:config?.condition==="NO_AI"?"none":model});}
 setActive(next);setView('Workspace');
 }catch(e){setNotice(e instanceof Error?e.message:'Please retry');}},[saveProjects,start,end,locale,flushProjects,flushResearch,restoreResearch]);
 useEffect(()=>{if(remote.current){let alive=true;Promise.all([remote.current.load(),platformFetch<{assignments:{task:STEMTask}[]}>('assignments')]).then(([saved,a])=>{if(!alive)return;projectsRef.current=saved;setProjects(saved);setAssigned(a.assignments.map(v=>loadTask(v.task)));setView('My Projects');setResearchVisible(serverAccount?.role!=='STUDENT');setReady(true);}).catch(e=>{if(alive)setNotice(e.message);});return()=>{alive=false;};}
 let tasks:STEMTask[]=[];let saved:Project[]=[];try{tasks=readCollection(localStorage.getItem(LIBRARY_KEY),loadTask);saved=readCollection(localStorage.getItem(PROJECTS_KEY),parseProject).map(p=>({...p,notebook:p.notebook||localStorage.getItem(`stempath-notebook-project-${p.id}`)||''}));
 // Migrate an old explicit task into a project, never automatically open it.
 const old=sessionStorage.getItem('stempath-task-v3');if(old&&!localStorage.getItem('stempath-migration-v053')){const task=loadTask(JSON.parse(old));if(!saved.some(p=>p.task.id===task.id))saved.push(newProject(task));localStorage.setItem('stempath-migration-v053','done');}
 }catch{setNotice('Some saved data could not be restored. You can choose a project.');}
 setLibrary(tasks);saveProjects(saved);const params=new URLSearchParams(location.search);setResearchVisible(researchMode(location.search));const id=params.get('task');if(id){const task=[...demoTasks,...tasks].find(task=>task.id===id);if(task){setPreview(task);setView('Preview');}else setNotice('The assigned task was not found. Choose a project.');}setReady(true);
 },[saveProjects,serverAccount?.role]);
 useEffect(()=>{if(serverAccount?.role==='STUDENT'&&taskMode==='ASSIGNED')return;const receive=(event:Event)=>{try{const task=loadTask((event as CustomEvent).detail);setPreview(task);setView('Preview');}catch{setNotice('The supplied task is invalid. Your work is unchanged.');}};window.addEventListener(TASK_LOAD_EVENT,receive);return()=>window.removeEventListener(TASK_LOAD_EVENT,receive);},[serverAccount?.role,taskMode]);
 useEffect(()=>{if(active)interfaceLanguage(locale,active.task.translations?.[locale]?locale:/[\u3400-\u9fff]/.test(active.task.title)?'zh-CN':'en');},[locale,active,interfaceLanguage]);
 const progress=useCallback((state:ProjectProgress)=>{const id=activeRef.current;if(!id)return;saveProjects(projectsRef.current.map(p=>p.id===id?{...p,...state}:p));},[saveProjects]);
 function saveLibrary(next:STEMTask[]){setLibrary(next);if(serverAccount)return;try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));}catch{setNotice('Storage unavailable. Export your work before leaving.');}}
 function saveTask(task:STEMTask){const next=reviseTask(task,library.find(v=>v.id===task.id));saveLibrary([...library.filter(v=>v.id!==task.id),next]);setEditing(next);}
 function navigate(name:string){if(serverAccount?.role==='STUDENT'&&taskMode==='ASSIGNED'&&['Create','Library'].includes(name))return;void flushProjects();flushResearch();if(['Home','Challenges','My Projects','Resources','Library','Create'].includes(name)){if(view==='Workspace')end('RESET');setView(name as View);if(name==='Create')setEditing(null);}}
 const begin=(task:STEMTask)=>open(newProject(task));
 async function removeProject(id:string){try{if(remote.current)await remote.current.remove(id);saveProjects(projectsRef.current.filter(p=>p.id!==id));}catch(e){setNotice(e instanceof Error?e.message:'Please retry');}}
 async function signOutToAdmin(){if(await flushProjects()){flushResearch();try{await remote.current?.settled();onAdmin?.();}catch(e){setNotice(e instanceof Error?e.message:'Please retry');}}}
 async function signOut(){if(await flushProjects()){flushResearch();try{await remote.current?.settled();await onLogout?.();}catch(e){setNotice(e instanceof Error?e.message:'Please retry');}}}
 const examples=serverAccount?(taskMode==='ASSIGNED'&&serverAccount.role==='STUDENT'?assigned:[...assigned,...demoTasks.filter(t=>!assigned.some(a=>a.id===t.id))]):demoTasks;
 if(!ready)return <div className="workspace-loading"><p>{t('Loading your learning workspace…')}</p>{notice&&<><p role="alert">{notice}</p><button onClick={()=>location.reload()}>{locale==='zh-CN'?'重试':'Retry'}</button></>}</div>;
 return <>{serverAccount&&<div className="account-bar"><span>{serverAccount.participantCode}</span><button onClick={()=>void signOut()}>{locale==='zh-CN'?'退出':'Sign out'}</button>{serverAccount.role!=='STUDENT'&&<button onClick={()=>void signOutToAdmin()}>{locale==='zh-CN'?'参与者管理':'Participants'}</button>}</div>}{notice&&<p role="status" className="hub-notice">{t(notice)}{serverAccount&&<button onClick={()=>{if(confirm(locale==='zh-CN'?'重新载入服务器记录会替换当前未保存的修改，继续吗？':'Reload server records and replace unsaved edits?'))location.reload();}}>{locale==='zh-CN'?'重新载入':'Reload'}</button>}</p>}{view==='Workspace'&&active?<Workspace key={active.id} task={localizedTask(active.task,locale)} initialProject={active} saveStatus={saveStatus} onSaveRetry={flushProjects} onProgress={progress} onNavigate={navigate} onLoadTask={()=>setView('Challenges')} research={research} researchVisible={researchVisible} onResearchReset={(config,task=active.task)=>open(newProject(task),config)} onResearchClear={all=>{research.clear(all);setView('My Projects');}} onAssignTask={begin} onHideResearch={()=>setResearchVisible(false)}/>:<><Header active={view} onNavigate={navigate}/><ProjectHub view={view} library={library} examples={examples} serverMode={!!serverAccount} assignedOnly={!!serverAccount&&taskMode==='ASSIGNED'&&serverAccount.role==='STUDENT'} projects={projects} preview={preview} editing={editing} researchMode={researchVisible} onView={navigate} onPreview={task=>{setPreview(task);setView('Preview');}} onStart={begin} onContinue={p=>open(p)} onSave={saveTask} onEdit={task=>{setEditing(task);setView('Create');}} onDelete={id=>saveLibrary(library.filter(task=>task.id!==id))} onRemove={id=>void removeProject(id)} onRestart={p=>{try{localStorage.removeItem(`stempath-notebook-project-${p.id}`);}catch{}const fresh={...newProject(p.task),id:remote.current?crypto.randomUUID():p.id};void (async()=>{/* Server restart creates a new project; the original study data stays available. */await open(fresh);})().catch(e=>setNotice(e.message));}} onImport={tasks=>saveLibrary([...library.filter(t=>!tasks.some(v=>v.id===t.id)),...tasks.map(task=>reviseTask(task,library.find(v=>v.id===task.id)))])}/></>}<Footer/></>;
}
