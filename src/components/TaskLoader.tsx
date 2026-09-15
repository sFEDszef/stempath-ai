import { useState } from 'react';
import { demoTasks } from '@/data/tasks';
import { loadTask, taskTypes } from '@/lib/stem/tasks';
import type { STEMTask } from '@/types';
export function TaskLoader({onLoad}:{onLoad:(task:STEMTask)=>void}) {
 const [error,setError]=useState('');
 return <div className="task-loader"><p>Choose an example or bring your own question. Loading a challenge starts a fresh workspace.</p><div className="demo-grid">{demoTasks.map(task=><button key={task.id} onClick={()=>onLoad(task)}>{task.title}<small>{task.type.replaceAll('-',' ')}</small></button>)}</div><h3>Custom challenge</h3><form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);try{const list=(name:string)=>String(data.get(name)||'').split('\n').map(s=>s.trim()).filter(Boolean);onLoad(loadTask({title:data.get('title'),description:data.get('description'),type:data.get('type')||undefined,constraints:list('constraints'),successCriteria:list('criteria'),availableMaterials:list('materials')}));}catch(err){setError((err as Error).message)}}}>
 <label>Challenge Title<input name="title" required maxLength={160}/></label><label>Challenge Description<textarea name="description" required maxLength={4000}/></label><label>Task type<select name="type"><option value="">Suggest from description</option>{taskTypes.map(t=><option key={t} value={t}>{t.replaceAll('-',' ')}</option>)}</select></label>
 {['constraints','criteria','materials'].map((name,i)=><label key={name}>{['Constraints','Success Criteria','Materials / Resources'][i]} (optional, one per line)<textarea name={name} maxLength={3600}/></label>)}
 {error&&<p role="alert">{error}</p>}<button className="primary-button">Load STEM Challenge</button></form></div>;
}
