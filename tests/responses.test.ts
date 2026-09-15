import { afterEach,expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
import { generateReply } from '@/lib/stem/handler';
import { demoTasks } from '@/data/tasks';
import { injectTask, TASK_LOAD_EVENT, taskStorageKey } from '@/lib/stem/tasks';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('uses Responses with current task, records, history and no provider storage',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-placeholder-not-a-real-key');
 const fetch=vi.fn(async()=>Response.json({id:'resp_test',object:'response',status:'completed',output:[{id:'msg_test',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:'What evidence would help you decide?',annotations:[]}]}]}));
 vi.stubGlobal('fetch',fetch);
 const task=demoTasks[4];const artifacts={test:{Observations:'Growth measurements varied across repeated observations.'}};
 expect(await generateReply({task,artifacts,completed:['understand'],stage:'test',level:2,message:'How can I check this?',history:[{role:'student',text:'I measured growth.'}]})).toContain('evidence');
 const call=fetch.mock.calls[0] as unknown as [unknown,RequestInit];
 const body=JSON.parse(call[1].body as string);
 expect(body.store).toBe(false);expect(body.model).toBe('gpt-4.1-mini');expect(body.instructions).toContain('Directional hints');expect(body.instructions).toContain('untrusted learning data');
 expect(body.input[0].content).toContain(task.title);expect(body.input[0].content).toContain(artifacts.test.Observations);expect(body.input.at(-1).content).toBe('How can I check this?');expect(JSON.stringify(body)).not.toMatch(/Wind-Powered|sail/);
});
it('validates external task injection before emitting a load event',()=>{
 const target=new EventTarget();vi.stubGlobal('window',target);const receive=vi.fn();target.addEventListener(TASK_LOAD_EVENT,receive);
 injectTask({title:'Number patterns',description:'Explain a pattern with evidence.'});expect(receive).toHaveBeenCalledOnce();
 expect(()=>injectTask({title:'Missing description'})).toThrow();expect(receive).toHaveBeenCalledOnce();
});
it('isolates storage even when an external source reuses an id',()=>{expect(taskStorageKey(demoTasks[0])).not.toBe(taskStorageKey({...demoTasks[0],description:'A new task'}))});
