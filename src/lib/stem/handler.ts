import { aiEnabled, conditionConfig } from '@/lib/research/config';
import 'server-only';
import { respond } from '@/lib/ai';
import { demoProvider } from '@/lib/ai/demoProvider';
import { ProviderError,diagnostics,release } from '@/lib/ai/provider';
import { decidePedagogicalAction } from '@/lib/pedagogy/decisionEngine';
import { suggestedReplies } from '@/lib/pedagogy/responses';
import { MAX_BODY_BYTES, parseChatRequest } from './validation';
import type { ChatRequest } from '@/types';
export type GenerateReply = (request: ChatRequest) => Promise<string>;
function reply(body: object, status=200) {
  return Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
}
export async function handleChat(req: Request, generate?: GenerateReply): Promise<Response> {
  // Reject cross-origin browser requests; this is not authentication or distributed rate limiting.
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== (req.headers.get('host') ?? new URL(req.url).host)) throw new Error('ORIGIN');
    } catch {return reply({error:'Request origin is not allowed.',retryable:false},403);}
  }
  if (!req.headers.get('content-type')?.includes('application/json')) return reply({error:'Send a JSON request.',retryable:false},415);
  let request: ChatRequest;
  try {
    const reader = req.body?.getReader();
    if (!reader) throw new Error('Invalid request');
    const chunks: Uint8Array[] = []; let size=0;
    while (true) {const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>MAX_BODY_BYTES){await reader.cancel(); return reply({error:'Your message is too long. Please shorten it.',retryable:false},413);} chunks.push(value);}
    const bytes = new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    request=parseChatRequest(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {return reply({error:'Check the stage, support level, message, and conversation length.',retryable:false},400);}
  if(!aiEnabled(request.research??conditionConfig()))return reply({error:'Coach responses are unavailable in this workspace. Use the stage prompts and Your Thinking.',retryable:false},403);
  if(request.intent==='challenge'&&!decidePedagogicalAction(request).challengeEligible)return reply({error:'Explore your current question and record some evidence before trying an AI Challenge.',retryable:false},409);
  if(request.mode==='demo')return reply(demoProvider(request));
  try {
    // Optional dependency injection supports boundary tests; production always uses the provider layer.
    if(generate)return reply({text:await generate(request),suggestions:request.intent==='challenge'?[]:suggestedReplies(decidePedagogicalAction(request).state.language),mode:'ai'});
    return reply(await respond(request));
  } catch(error) {
    const code=error instanceof ProviderError?error.code:'upstream';
    return reply({error:'DeepSeek could not respond. Please retry or select Demo. / DeepSeek 暂时无法回复，请重试或选择 Demo。',code,diagnostic:diagnostics[code],metadata:error instanceof ProviderError?(error.metadata??{...release,provider:"deepseek",model:"unavailable",responseMode:"ai",providerAttempted:false,diagnostic:diagnostics[code]}):undefined,retryable:true},error instanceof ProviderError?error.status:502);
  }
}
