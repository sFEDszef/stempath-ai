/** One generation per browser tab, shared by chat/retry/challenge/task check. */
export class RequestGate {
 private active=false;
 get busy(){return this.active;}
 async run<T>(work:()=>Promise<T>):Promise<T>{if(this.active)throw Error('REQUEST_BUSY');this.active=true;try{return await work();}finally{this.active=false;}}
}
export const requestGate=new RequestGate();
export function limitReached(usage:{aiCalls:number;totalTokens:number},limits:{maxAICallsPerSession:number;maxTokensPerSession:number}){return usage.aiCalls>=limits.maxAICallsPerSession||usage.totalTokens>=limits.maxTokensPerSession;}
export const usageLimitMessage='本次 AI 支持已达到研究设置的使用上限，请联系老师。 / AI support has reached this session’s limit. Please contact your teacher.';
