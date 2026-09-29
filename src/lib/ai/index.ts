import 'server-only';
import type { ChatRequest, CoachResponse } from '@/types';
import { deepseekProvider } from './deepseekProvider';
import { demoProvider } from './demoProvider';
import { ProviderError } from './provider';
import { aiEnabled, conditionConfig } from '@/lib/research/config';
export async function respond(request:ChatRequest):Promise<CoachResponse> {
 if(!aiEnabled(request.research??conditionConfig()))throw new ProviderError('configuration',403);
 if(request.mode==='demo')return demoProvider(request);
 if(request.mode!=='deepseek'&&process.env.AI_PROVIDER==='demo')return demoProvider(request);
 try {
  if(process.env.AI_PROVIDER&& !['deepseek','demo'].includes(process.env.AI_PROVIDER))throw new ProviderError('configuration',503);
  return await deepseekProvider(request);
 }catch(error){
  const safe=error instanceof ProviderError?error:new ProviderError('upstream');
  if(request.mode==='deepseek')throw safe;
  return demoProvider(request,safe.code);
 }
}
