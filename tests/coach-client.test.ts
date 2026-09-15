import {it,expect,vi,afterEach} from 'vitest';
import {demoTasks} from '@/data/tasks';
import {apiCoach} from '@/lib/coach';
const request={stage:'understand' as const,level:2 as const,message:'Why?',history:[],task:demoTasks[0],artifacts:{},completed:[]};
afterEach(()=>vi.unstubAllGlobals());
it('sends level and session context to the same-origin API',async()=>{const fetch=vi.fn(async()=>Response.json({text:'What do you predict?',suggestions:['我不确定。'],mode:'ai'}));vi.stubGlobal('fetch',fetch);expect((await apiCoach.respond(request)).text).toBe('What do you predict?');expect(fetch.mock.calls[0]).toBeDefined();expect(fetch).toHaveBeenCalledWith('/api/chat',expect.objectContaining({body:JSON.stringify(request)}));});
it('exposes a safe retryable failure',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>Response.json({error:'Please retry',retryable:true},{status:502})));await expect(apiCoach.respond(request)).rejects.toMatchObject({message:'Please retry',retryable:true});});
it('handles network failures',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('network')}));await expect(apiCoach.respond(request)).rejects.toMatchObject({retryable:true});});
