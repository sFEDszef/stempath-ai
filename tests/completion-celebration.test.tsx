import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {newProject,parseProject,projectSnapshot,readCollection} from '@/lib/projects/storage';
import {shouldCelebrate} from '@/lib/projects/completion';
import {stageIds} from '@/lib/stem/stages';
import {ProjectCompletionModal} from '@/components/ProjectCompletionModal';
import {demoTasks} from '@/data/tasks';
import {startSession,completeStage,finishSession} from '@/lib/research/session';
import {conditionConfig} from '@/lib/research/config';
import {exportJSON} from '@/lib/research/export';
describe('explicit seven-stage completion ceremony',()=>{
 it('Reflect READY is insufficient, as is an unsaved or incomplete session',()=>{
  const p=newProject(demoTasks[0]);p.completed=stageIds.slice(0,6);p.readiness.reflect={ready:true,criterion:'ONE_TAKEAWAY',source:'DEMO'};
  expect(shouldCelebrate(p,false,true)).toBe(false);p.completed=[...stageIds];expect(shouldCelebrate(p,false,true)).toBe(false);expect(shouldCelebrate(p,true,false)).toBe(false);expect(shouldCelebrate(p,true,true)).toBe(true);
 });
 it('explicit Reflect completion ends the seven-stage session without ceremony changing research',()=>{
  const p=newProject(demoTasks[0]);let session=startSession(p.task,conditionConfig(),1000);
  for(const [i,stage] of stageIds.entries())session=completeStage(session,stage,true,1100+i*100);
  session=finishSession(session,2000);p.completed=[...stageIds];const before=exportJSON(session,2100);
  expect(shouldCelebrate(p,!!session.completedAt,true)).toBe(true);p.completionCelebrationSeen=true;
  expect(exportJSON(session,2100)).toBe(before);expect(session.completedStages).toHaveLength(7);expect(stageIds).toHaveLength(7);
 });
 it.each([true,false])('text attribution and actions in zh=%s',zh=>{
  const html=renderToStaticMarkup(<ProjectCompletionModal zh={zh} onClose={()=>{}}/>);
  expect(html).toContain('Harrier Du Bois');expect(html).toContain('aria-labelledby');expect(html).not.toContain('<img');
  expect(html).toContain(zh?'恭喜者：哈里尔·杜博阿':'Congratulations from:');expect(html).toContain(zh?'查看我的项目':'View My Project');expect(html).toContain(zh?'回顾七个阶段':'Review the Seven Stages');
 });
 it('LOCAL roundtrip persists seen state and completed project without reopening',()=>{
  const p={...newProject(demoTasks[0]),completed:[...stageIds],completionCelebrationSeen:true};
  const saved=readCollection(JSON.stringify([projectSnapshot(p)]),parseProject)[0];expect(saved.completionCelebrationSeen).toBe(true);expect(shouldCelebrate(saved,true,true)).toBe(false);expect(saved.completed).toEqual(stageIds);
 });
 it('legacy completed projects migrate seen; unfinished projects remain eligible',()=>{
  const p=newProject(demoTasks[0]);const {completionCelebrationSeen:_,...legacy}=p;void _;
  expect(parseProject(legacy).completionCelebrationSeen).toBe(false);expect(parseProject({...legacy,completed:stageIds}).completionCelebrationSeen).toBe(true);
  expect(()=>parseProject({...p,completionCelebrationSeen:'yes'})).toThrow();
 });
});
