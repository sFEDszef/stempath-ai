import {useI18n} from '@/lib/i18n';
import { useState } from 'react';
import { artifactFields } from '@/lib/stem/stages';
import type { STEMTask,StageId,LearningArtifacts as Records } from '@/types';
export function LearningArtifacts({task,stage,records,onChange,onRecord,disabled=false,aiAvailable=true}:{task:STEMTask;stage:StageId;records:Records;onChange:(field:string,value:string)=>void;onRecord?:(field:string,value:string)=>void;disabled?:boolean;aiAvailable?:boolean}) {
 const {t}=useI18n();

 const [step,setStep]=useState(0);const fields=artifactFields(task,stage).filter(field=>aiAvailable||!field.includes('AI'));
 function fieldInput(field:string){return <label key={field}>{t(field)}<textarea aria-label={t(field)} disabled={disabled} maxLength={400} rows={2} value={records[stage]?.[field]??''} onBlur={e=>onRecord?.(field,e.target.value)} onChange={e=>onChange(field,e.target.value)} placeholder={t("Your words, your evidence…")}/></label>;}
 return <details className="rail-section learning-artifacts" open><summary>{t("Your Thinking")}</summary><p>{t("Capture your ideas for this stage. Saved in this browser.")}</p>{stage==='reflect'?<><small>{t("Reflection")}{step+1}{t("of")}{fields.length}{t("· Skip any prompt you do not need.")}</small>{fieldInput(fields[Math.min(step,fields.length-1)])}<div className="research-actions"><button disabled={step===0} onClick={()=>setStep(n=>n-1)}>{t("Previous reflection")}</button><button disabled={step===fields.length-1} onClick={()=>setStep(n=>n+1)}>{t("Next reflection")}</button></div></>:<>{fields.slice(0,3).map(fieldInput)}{fields.length>3&&<details><summary>{t("More thinking prompts")}</summary>{fields.slice(3).map(fieldInput)}</details>}</>}{Object.keys(records[stage]??{}).some(field=>!artifactFields(task,stage).includes(field))&&<details><summary>{t("Earlier reflection notes")}</summary>{Object.entries(records[stage]??{}).filter(([field])=>!artifactFields(task,stage).includes(field)).map(([field,value])=><p key={field}><strong>{t(field)}</strong><br/>{value}</p>)}</details>}</details>;
}
