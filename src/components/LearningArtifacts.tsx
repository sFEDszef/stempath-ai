import { artifactFields } from '@/lib/stem/stages';
import type { STEMTask,StageId,LearningArtifacts as Records } from '@/types';
export function LearningArtifacts({task,stage,records,onChange}:{task:STEMTask;stage:StageId;records:Records;onChange:(field:string,value:string)=>void}) {
 return <details className="rail-section learning-artifacts" open><summary>Your Thinking</summary><p>Capture your ideas for this stage. Saved in this browser tab.</p>{artifactFields(task,stage).map(field=><label key={field}>{field}<textarea maxLength={400} rows={2} value={records[stage]?.[field]??''} onChange={e=>onChange(field,e.target.value)} placeholder="Your words, your evidence…"/></label>)}</details>;
}
