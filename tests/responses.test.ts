import { afterEach,expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
import { deepseekProvider } from '@/lib/ai/deepseekProvider';
import { demoTasks } from '@/data/tasks';
import { injectTask, TASK_LOAD_EVENT, taskStorageKey } from '@/lib/stem/tasks';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('sends current task, records and history only to DeepSeek',async()=>{
 vi.stubEnv('DEEPSEEK_API_KEY','test-placeholder-not-a-real-key');
 vi.stubEnv('AI_MODEL','deepseek-flash');vi.stubEnv('DEEPSEEK_BASE_URL','https://api.deepseek.com');
 const fetch=vi.fn(async()=>Response.json({model:'deepseek-flash',choices:[{finish_reason:'stop',message:{content:'Compare actual evidence: trial A ___; trial B ___. Which recorded evidence would you compare first?'}}]}));
 vi.stubGlobal('fetch',fetch);
 const task=demoTasks[4];const artifacts={test:{Observations:'Growth measurements varied across repeated observations.'}};
 expect((await deepseekProvider({task,artifacts,completed:['understand'],stage:'test',level:2,message:'How can I check this?',history:[{role:'student',text:'I measured growth.'}]})).text).toContain('Go to the Next Step');
 const call=fetch.mock.calls[0] as unknown as [unknown,RequestInit];
 const body=JSON.parse(call[1].body as string);
 expect(body.model).toBe('deepseek-flash');expect(body.messages[0].content).toContain('Partial scaffolding');expect(body.messages[0].content).toContain('untrusted learning data');
 const data=JSON.parse(body.messages[1].content);
 expect(data.task.title).toBe(task.title);expect(data.artifacts).toEqual(artifacts);expect(data.history[0].text).toBe('I measured growth.');expect(data.latestStudentMessage).toBe('How can I check this?');expect(JSON.stringify(body)).not.toMatch(/Wind-Powered|sail/);
});
it('validates external task injection before emitting a load event',()=>{
 const target=new EventTarget();vi.stubGlobal('window',target);const receive=vi.fn();target.addEventListener(TASK_LOAD_EVENT,receive);
 injectTask({title:'Number patterns',description:'Explain a pattern with evidence.'});expect(receive).toHaveBeenCalledOnce();
 expect(()=>injectTask({title:'Missing description'})).toThrow();expect(receive).toHaveBeenCalledOnce();
});
it('isolates storage even when an external source reuses an id',()=>{expect(taskStorageKey(demoTasks[0])).not.toBe(taskStorageKey({...demoTasks[0],description:'A new task'}))});
