import {describe,it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
vi.mock('server-only',()=>({}));
import {handleChat} from '@/lib/stem/handler';
import {POST} from '@/app/api/task-check/route';
import {demoTasks} from '@/data/tasks';
const payload={stage:'understand',level:1,message:'What is the goal?',history:[],task:demoTasks[0],artifacts:{},completed:[],mode:'demo'};
const request=(path:string,host:string,origin:string,body:unknown)=>new Request('https://internal.example'+path,{method:'POST',headers:{host,origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
afterEach(()=>vi.unstubAllEnvs());
describe('custom domain compatibility',()=>{
 it.each(['stempathai.com','www.stempathai.com','stempath-ai.vercel.app','preview-example.vercel.app'])('accepts same-origin chat on %s without paid calls',async host=>{
  const provider=vi.fn();expect((await handleChat(request('/api/chat',host,'https://'+host,payload),provider)).status).toBe(200);expect(provider).not.toHaveBeenCalled();
 });
 it.each(['https://attacker.example','https://stempathai.com.attacker.example','https://stempath-ai.vercel.app'])('rejects foreign origin %s on the canonical host',async origin=>{
  const provider=vi.fn();expect((await handleChat(request('/api/chat','stempathai.com',origin,payload),provider)).status).toBe(403);expect(provider).not.toHaveBeenCalled();
 });
 it('accepts same-origin task checks on the custom domain with Demo',async()=>{
  vi.stubEnv('DEEPSEEK_API_KEY','');expect((await POST(request('/api/task-check','stempathai.com','https://stempathai.com',{task:demoTasks[0],language:'en',condition:'ADAPTIVE_SUPPORT'}))).status).toBe(200);
 });
 it('keeps canonical metadata and relative API routing',()=>{
  const layout=readFileSync('src/app/layout.tsx','utf8');
  expect(layout).toContain('metadataBase: new URL("https://stempathai.com")');
  expect(layout).toContain('alternates: { canonical: "/" }');
  expect(layout).toContain('url: "https://stempathai.com"');
  expect(readFileSync('src/lib/coach.ts','utf8')).toContain("fetch('/api/chat'");
 });
});
