import type {ChatRequest} from '@/types';
import {requestReadiness} from './readiness';
import {taskRubric} from './rubrics';
import {coachingObjects,concreteQuestion,concreteDeepening} from './concreteCoaching';
export function rubricQuestion(request:ChatRequest,zh:boolean){
 const a=requestReadiness(request),criteria=taskRubric(request.task)[request.stage],missing=criteria.find(c=>a.missingCriteria?.includes(c.id));
 const object=coachingObjects(request).object[zh?0:1];
 if(request.continueExploring&&a.ready)return zh?`如果继续研究${object}，你还想亲手检查什么？`:`What would you like to check yourself if you keep investigating ${object}?`;
 const round=a.meaningfulRounds??0;

 const deepening=concreteDeepening(request,zh);
 let q=missing?concreteQuestion(request,missing.kind,zh):deepening[Math.max(0,round-1)%deepening.length];
 const recent=request.history.filter(m=>m.role==='assistant').slice(-5).map(m=>m.text);
 if(recent.some(t=>t.includes(q))){
  const alternatives=missing?.kind==='ACTUAL_TRIAL_2'
   ?zh?[`目前记下的是${object}第一次尝试。实际完成第二次后，${q}`,`你可以先实际再试${object}，回来再说：${q}`,`重复${object}第一次的记录不能代替另一次尝试。${q}`]
      :[`We have the first actual trial of ${object}. After a second real trial, ${q}`,`You can actually try ${object} again, then return: ${q}`,`Repeating the first record of ${object} is not a second real trial. ${q}`]
   :missing
    ?zh?[`先继续看${object}：${q}`,`为了检查${object}，${q}`,`再看看你记录的${object}内容：${q}`]
       :[`Let’s keep looking at ${object}: ${q}`,`To check ${object}, ${q}`,`Look again at your record of ${object}: ${q}`]
    :deepening.filter(x=>x!==q);
  q=alternatives.find(x=>!recent.some(t=>t.includes(x)))??q;
 }
 return q;
}
