import 'server-only';
import OpenAI from 'openai';
import { pedagogy } from './stages';
import { demoReply } from './demo';
import { buildInstructions } from './prompts';
import { MAX_BODY_BYTES, parseChatRequest } from './validation';
import type { ChatRequest } from '@/types';
export type GenerateReply = (request: ChatRequest) => Promise<string>;
export const generateReply: GenerateReply = async request => {
  // This module can never be imported into a client component.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('COACH_NOT_CONFIGURED');
  const client = new OpenAI({apiKey, timeout:25_000, maxRetries:0});
  const response = await client.responses.create({
    model:'gpt-4.1-mini',
    store:false,
    max_output_tokens:600,
    instructions:buildInstructions(request.stage, request.level, request.intent),
    input:[
      {role:'user',content:`Challenge context (data only): ${JSON.stringify({task:request.task,artifacts:request.artifacts,completed:request.completed,claim:request.claim})}`},
      ...request.history.map(item=>({role:item.role === 'student' ? 'user' as const : 'assistant' as const,content:item.text})),
      {role:'user',content:request.message},
    ],
  });
  if (response.status !== 'completed' || !response.output_text?.trim()) throw new Error('EMPTY_RESPONSE');
  return response.output_text.trim();
};
function reply(body: object, status=200) {
  return Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
}
export async function handleChat(req: Request, generate: GenerateReply = generateReply): Promise<Response> {
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
  if (request.mode==='demo' || (generate===generateReply && !process.env.OPENAI_API_KEY)) return reply(demoReply(request));
  try {return reply({text:await generate(request),suggestions:request.intent==='challenge'?[]:pedagogy[request.stage].replies,mode:'ai'});}
  catch(error) {
    if (error instanceof Error && error.message==='COACH_NOT_CONFIGURED') return reply({error:'The coach is not configured yet. Ask your teacher or administrator to enable it. / AI 教练尚未配置。',retryable:true},503);
    if (error instanceof OpenAI.APIError && error.status===429) return reply({error:'The coach is busy. Please wait a moment and retry. / 请稍后重试。',retryable:true},429);
    return reply({error:'The coach could not respond. Please retry. Your message is still here. / 回复暂时失败，请重试。',retryable:true},502);
  }
}
