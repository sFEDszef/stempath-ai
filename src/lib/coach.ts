import type { CoachService, ChatRequest } from '@/types';
export class CoachError extends Error {
  constructor(message:string, public retryable=true){super(message);this.name='CoachError';}
}
export const apiCoach: CoachService = {
  async respond(request: ChatRequest) {
    try {
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(35_000)});
      const body=await response.json();
      if (!response.ok) throw new CoachError(typeof body.error==='string'?body.error:'The coach could not respond.',body.retryable!==false);
      if(typeof body.text!=='string'||!body.text.trim()||!Array.isArray(body.suggestions)||!body.suggestions.every((s:unknown)=>typeof s==='string')) throw new CoachError('The coach returned an invalid response. Please retry.');
      if(body.mode!=='ai'&&body.mode!=='demo')throw new CoachError('Invalid coach mode.');
      return {text:body.text,suggestions:body.suggestions,mode:body.mode};
    }catch(error){if(error instanceof CoachError)throw error;throw new CoachError('Connection interrupted. Please retry. Your message is still here. / 连接中断，请重试。');}
  }
};
