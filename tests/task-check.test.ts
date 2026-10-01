import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {POST} from '@/app/api/task-check/route';
import {demoTasks} from '@/data/tasks';
const request=(condition='ADAPTIVE_SUPPORT',origin='http://127.0.0.1:3009')=>new Request('http://localhost:3009/api/task-check',{method:'POST',headers:{origin,host:'127.0.0.1:3009','Content-Type':'application/json'},body:JSON.stringify({task:demoTasks[0],language:'zh-CN',condition})});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('task-check HTTP boundary',()=>{
 it('accepts same host behind Next.js host normalization',async()=>{vi.stubEnv('DEEPSEEK_API_KEY','');expect((await POST(request())).status).toBe(200);});
 it('NO_AI rejects before any provider call',async()=>{vi.stubGlobal('fetch',vi.fn());expect((await POST(request('NO_AI'))).status).toBe(403);expect(fetch).not.toHaveBeenCalled();});
 it('rejects cross-origin and malformed JSON',async()=>{expect((await POST(request('ADAPTIVE_SUPPORT','https://other.example'))).status).toBe(403);expect((await POST(new Request('http://localhost/api/task-check',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'}))).status).toBe(400);});
 it('one click performs one request, parses structured advice and exposes no secret',async()=>{vi.stubEnv('DEEPSEEK_API_KEY','test-task-key');vi.stubEnv('AI_PROVIDER','deepseek');vi.stubGlobal('fetch',vi.fn(async()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({taskType:'inquiry',keyVariables:['wingspan'],likelyEvidence:['flight distance'],possibleControls:['paper'],safetyConcerns:['supervision'],sevenStageFit:['all seven stages']})}}]})));const result=await POST(request());expect(result.status).toBe(200);expect(fetch).toHaveBeenCalledTimes(1);expect(JSON.stringify(await result.json())).not.toContain('test-task-key');});
});
