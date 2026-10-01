'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Workspace from './Workspace';
import {Header} from './Header';
import {Footer} from './Footer';
import {ProjectHub,type View} from './ProjectHub';
import {I18nProvider,useI18n} from '@/lib/i18n';
import {reviseTask} from "@/lib/research/traceability";
import {loadTask,localizedTask,TASK_LOAD_EVENT} from '@/lib/stem/tasks';
import {demoTasks} from '@/data/tasks';
import {LIBRARY_KEY,PROJECTS_KEY,newProject,parseProject,readCollection,type Project} from '@/lib/projects/storage';
import {useResearchSession} from '@/lib/research/useResearchSession';
import {researchMode,initialLevel,type ResearchConfig} from '@/lib/research/config';
import type {STEMTask} from '@/types';
export default function TaskWorkspace(){return <I18nProvider><Platform/></I18nProvider>;}
function Platform(){
 const {t,locale}=useI18n();const [ready,setReady]=useState(false);const [view,setView]=useState<View>('Home');const [library,setLibrary]=useState<STEMTask[]>([]);const [projects,setProjects]=useState<Project[]>([]);const projectsRef=useRef<Project[]>([]);const activeRef=useRef<string|null>(null);const [active,setActive]=useState<Project|null>(null);const [preview,setPreview]=useState<STEMTask|null>(null);const [editing,setEditing]=useState<STEMTask|null>(null);const [researchVisible,setResearchVisible]=useState(false);const [notice,setNotice]=useState('');const research=useResearchSession();const {start,end,interfaceLanguage}=research;
 const saveProjects=useCallback((next:Project[])=>{projectsRef.current=next;setProjects(next);try{localStorage.setItem(PROJECTS_KEY,JSON.stringify(next));}catch{setNotice('Storage unavailable. Export your work before leaving.');}},[]);
 const open=useCallback(async(p:Project,config?:ResearchConfig)=>{let provider="auto",model="pending";try{const status=await fetch("/api/coach-status",{signal:AbortSignal.timeout(5000)}).then(r=>r.json());if(["demo","deepseek"].includes(status.provider)&&typeof status.model==="string"){provider=status.provider;model=status.model;}}catch{}const next={...p,lastOpenedAt:new Date().toISOString(),...(config?{level:initialLevel(config.condition)}:{})};saveProjects([next,...projectsRef.current.filter(v=>v.id!==p.id)]);activeRef.current=p.id;setActive(next);setView('Workspace');end('RESET');start(p.task,config,{interfaceLanguage:locale,taskLanguage:p.task.translations?.[locale]?locale:/[\u3400-\u9fff]/.test(p.task.title)?"zh-CN":"en",provider:config?.condition==="NO_AI"?"none":provider,model:config?.condition==="NO_AI"?"none":model});},[saveProjects,start,end,locale]);
 useEffect(()=>{let tasks:STEMTask[]=[];let saved:Project[]=[];try{tasks=readCollection(localStorage.getItem(LIBRARY_KEY),loadTask);saved=readCollection(localStorage.getItem(PROJECTS_KEY),parseProject);
 // Migrate an old explicit task into a project, never automatically open it.
 const old=sessionStorage.getItem('stempath-task-v3');if(old&&!localStorage.getItem('stempath-migration-v053')){const task=loadTask(JSON.parse(old));if(!saved.some(p=>p.task.id===task.id))saved.push(newProject(task));localStorage.setItem('stempath-migration-v053','done');}
 }catch{setNotice('Some saved data could not be restored. You can choose a project.');}
 setLibrary(tasks);saveProjects(saved);const params=new URLSearchParams(location.search);setResearchVisible(researchMode(location.search));const id=params.get('task');if(id){const task=[...demoTasks,...tasks].find(task=>task.id===id);if(task){setPreview(task);setView('Preview');}else setNotice('The assigned task was not found. Choose a project.');}setReady(true);
 },[saveProjects]);
 useEffect(()=>{const receive=(event:Event)=>{try{const task=loadTask((event as CustomEvent).detail);setPreview(task);setView('Preview');}catch{setNotice('The supplied task is invalid. Your work is unchanged.');}};window.addEventListener(TASK_LOAD_EVENT,receive);return()=>window.removeEventListener(TASK_LOAD_EVENT,receive);},[]);
 useEffect(()=>{if(active)interfaceLanguage(locale,active.task.translations?.[locale]?locale:/[\u3400-\u9fff]/.test(active.task.title)?'zh-CN':'en');},[locale,active,interfaceLanguage]);
 const progress=useCallback((state:Pick<Project,'active'|'completed'|'level'|'records'>)=>{const id=activeRef.current;if(!id)return;saveProjects(projectsRef.current.map(p=>p.id===id?{...p,...state}:p));},[saveProjects]);
 function saveLibrary(next:STEMTask[]){setLibrary(next);try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));}catch{setNotice('Storage unavailable. Export your work before leaving.');}}
 function saveTask(task:STEMTask){const next=reviseTask(task,library.find(v=>v.id===task.id));saveLibrary([...library.filter(v=>v.id!==task.id),next]);setEditing(next);}
 function navigate(name:string){if(['Home','Challenges','My Projects','Resources','Library','Create'].includes(name)){if(view==='Workspace')end('RESET');setView(name as View);if(name==='Create')setEditing(null);}}
 const begin=(task:STEMTask)=>open(newProject(task));
 if(!ready)return <p className="workspace-loading">{t('Loading your learning workspace…')}</p>;
 return <>{notice&&<p role="status" className="hub-notice">{t(notice)}</p>}{view==='Workspace'&&active?<Workspace key={active.id} task={localizedTask(active.task,locale)} initialProject={active} onProgress={progress} onNavigate={navigate} onLoadTask={()=>setView('Challenges')} research={research} researchVisible={researchVisible} onResearchReset={(config,task=active.task)=>open(newProject(task),config)} onResearchClear={all=>{research.clear(all);setView('My Projects');}} onAssignTask={begin} onHideResearch={()=>setResearchVisible(false)}/>:<><Header active={view} onNavigate={navigate}/><ProjectHub view={view} library={library} examples={demoTasks} projects={projects} preview={preview} editing={editing} researchMode={researchVisible} onView={navigate} onPreview={task=>{setPreview(task);setView('Preview');}} onStart={begin} onContinue={p=>open(p)} onSave={saveTask} onEdit={task=>{setEditing(task);setView('Create');}} onDelete={id=>saveLibrary(library.filter(task=>task.id!==id))} onRemove={id=>saveProjects(projects.filter(p=>p.id!==id))} onRestart={p=>{try{localStorage.removeItem(`stempath-notebook-project-${p.id}`);}catch{}const fresh={...newProject(p.task),id:p.id};open(fresh);}} onImport={tasks=>saveLibrary([...library.filter(t=>!tasks.some(v=>v.id===t.id)),...tasks.map(task=>reviseTask(task,library.find(v=>v.id===task.id)))])}/></>}<Footer/></>;
}
