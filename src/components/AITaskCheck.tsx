'use client';
import {useState} from 'react';
import {useI18n} from '@/lib/i18n';
import {requestGate} from '@/lib/research/requestGate';
import type {STEMTask} from '@/types';
let checksThisTab=0;
export function AITaskCheck({task}:{task:STEMTask}){const {locale}=useI18n(),zh=locale==='zh-CN';const [busy,setBusy]=useState(false),[result,setResult]=useState(''),[error,setError]=useState('');
 async function run(){setError('');setBusy(true);try{await requestGate.run(async()=>{if(checksThisTab>=10)throw Error('Task-check limit reached / 任务检查已达本标签页 10 次上限');checksThisTab++;const res=await fetch('/api/task-check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,language:locale}),signal:AbortSignal.timeout(30000)});const data=await res.json();if(!res.ok)throw Error(data.error??'INVALID_RESPONSE');setResult(JSON.stringify(data,null,2));});}catch(error){setError(error instanceof Error?error.message:'NETWORK_ERROR');}finally{setBusy(false);}}
 return <section className="rail-section"><h3>{zh?'AI 任务检查':'AI Task Check'} · {zh?'修订':'Revision'} {task.taskRevision??1}</h3><p>{zh?'仅供教师参考，不会修改任务。每次点击最多发出一次提供商请求；本标签页最多 10 次。':'Advisory only; never modifies the task. At most one provider request per click; 10 checks per tab.'}</p><button disabled={busy} onClick={()=>void run()}>{busy?(zh?'检查中…':'Checking…'):(zh?'检查此任务':'Check this task')}</button>{result&&<pre>{result}</pre>}{error&&<p role="alert">{error}</p>}</section>;}
