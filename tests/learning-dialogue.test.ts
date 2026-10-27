import {describe,it,expect} from 'vitest';
import {rubricRequest,dialogue,windTurns} from './progression-fixtures';
import {requestReadiness,assessLocalReadiness} from '@/lib/stem/readiness';
import {learningCheck,termExplanation} from '@/lib/stem/learningDialogue';
import {unresolvedDifficulty} from '@/lib/stem/evidence';
import {youngReply} from '@/lib/stem/youngLearner';
describe('learner understanding before transitions',()=>{
 it.each(['我不知道小车为什么要这样做','我还是不会','I do not understand friction'])('pauses READY on current difficulty: %s',message=>{
  const r=rubricRequest();r.progressionHistory=dialogue(windTurns.understand);r.message=message;
  expect(requestReadiness(r).ready).toBe(false);
  expect(youngReply(r,true)).not.toContain('这一步已经够用了');
 });
 it('keeps earlier criteria and resumes after understanding returns',()=>{
  const r=rubricRequest();const history=dialogue([...windTurns.understand,'我不懂风怎么推小车']);
  expect(assessLocalReadiness(r.task,r.stage,{},history).ready).toBe(false);
  expect(assessLocalReadiness(r.task,r.stage,{},dialogue([...windTurns.understand,'现在明白了，风推帆带动车'])).ready).toBe(true);
 });
 it('does not confuse physical behaviour with learner difficulty',()=>expect(unresolvedDifficulty('车轮现在不会卡住了')).toBe(false));
 it('does not mistake former uncertainty for current difficulty',()=>expect(unresolvedDifficulty('以前不懂，现在明白了')).toBe(false));
 it('offers a five-round summary/self-rating without requiring it for READY',()=>{
  const r=rubricRequest('understand',undefined,Array(5).fill('要做风力小车'));
  expect(learningCheck(r,true)).toContain('1–5');expect(learningCheck(r,true)).toContain('不是考试分数');
  expect(learningCheck(rubricRequest(),true)).toBeUndefined();
 });
 it('does not repeat a check for a confidence-only reply',()=>{const r=rubricRequest('understand',undefined,Array(6).fill('要做风力小车'));r.message='4分';expect(learningCheck(r,true)).toBeUndefined();});
 it('explains a requested term accurately without a full design',()=>{
  const r={...rubricRequest(),message:'瓦楞结构是什么意思？'};
  expect(termExplanation(r,true)).toContain('不等于所有三角形结构');
  expect(youngReply(r,true)).toContain('瓦楞结构');
 });
});
