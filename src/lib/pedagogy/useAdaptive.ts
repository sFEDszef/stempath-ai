'use client';
import { useState } from 'react';
import type { ChatRequest } from '@/types';
import { decidePedagogicalAction, applySupportChoice } from './decisionEngine';
/** UI invitation cooldown only. Research events live in the session layer. */
export function useAdaptive(request:ChatRequest){
 const decision=decidePedagogicalAction(request);
 const [dismissals,setDismissals]=useState<Record<string,number>>({});
 const [serial,setSerial]=useState(0),[lastChange,setLastChange]=useState(-10);
 const key=`${request.stage}:${request.level}:${decision.reason}`;
 const last=dismissals[key];
 const showRecommendation=decision.recommendation!==undefined&&serial-lastChange>=2&&(last===undefined||serial-last>=3);
 function resolveRecommendation(accepted:boolean){setDismissals(prev=>({...prev,[key]:serial}));if(accepted)setLastChange(serial);return applySupportChoice(request.level,decision.recommendation,accepted);}
 return {decision,showRecommendation,resolveRecommendation,onStudentTurn:()=>setSerial(n=>n+1)};
}
