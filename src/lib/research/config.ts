import type { SupportLevel } from '@/types';
export const conditions = ['LOW_SUPPORT','ADAPTIVE_SUPPORT','HIGH_SUPPORT','NO_AI','CUSTOM'] as const;
export type Condition = typeof conditions[number];
export interface ResearchConfig {
 maxAICallsPerSession:number;maxTokensPerSession:number;idleThresholdMs:number;
 condition: Condition; storeMessageText: boolean; enableAIChallenge: boolean;
 enableFading: boolean; enableEscalation: boolean; allowManualSupportChange: boolean;
 randomTaskMode: boolean; seed: string; initialSupportLevel?:SupportLevel;
}
export function conditionConfig(condition: Condition = 'ADAPTIVE_SUPPORT'): ResearchConfig {
 return {maxAICallsPerSession:40,maxTokensPerSession:30000,idleThresholdMs:120000,condition,storeMessageText:false,enableAIChallenge:condition!=='NO_AI',enableFading:condition==='ADAPTIVE_SUPPORT',enableEscalation:condition==='ADAPTIVE_SUPPORT',allowManualSupportChange:condition!=='NO_AI',randomTaskMode:false,seed:''};
}
export function parseResearchConfig(input: unknown): ResearchConfig {
 if(input===undefined)return conditionConfig();
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid research configuration');
 const v=input as Record<string,unknown>;
 if(!conditions.includes(v.condition as Condition))throw new Error('Invalid condition');
 const result=conditionConfig(v.condition as Condition);
 for(const key of ['storeMessageText','enableAIChallenge','enableFading','enableEscalation','allowManualSupportChange','randomTaskMode'] as const){
  if(v[key]!==undefined){if(typeof v[key]!=='boolean')throw new Error('Invalid setting');result[key]=v[key];}
 }
 if(v.seed!==undefined){if(typeof v.seed!=='string'||v.seed.length>80)throw new Error('Invalid seed');result.seed=v.seed;}
 for(const key of ["maxAICallsPerSession","maxTokensPerSession","idleThresholdMs"] as const){if(v[key]!==undefined){if(!Number.isSafeInteger(v[key])||(v[key] as number)<1||(v[key] as number)>10000000)throw Error("Invalid limit");result[key]=v[key] as number;}}
 if(v.initialSupportLevel!==undefined){if(![1,2,3].includes(v.initialSupportLevel as number))throw Error("Invalid initial support level");result.initialSupportLevel=v.initialSupportLevel as SupportLevel;}
 return result;
}
export const initialLevel=(condition:Condition,customLevel?:SupportLevel):SupportLevel=>condition==='LOW_SUPPORT'?1:condition==='HIGH_SUPPORT'?3:condition==='CUSTOM'?(customLevel??1):1;
export const aiEnabled=(config:ResearchConfig)=>config.condition!=='NO_AI';
/** Research visibility is a convenience, not authentication. Never use it to protect secrets. */
export function researchMode(search:string){const p=new URLSearchParams(search);return p.get('research')==='1'||p.get('debug')==='1';}
