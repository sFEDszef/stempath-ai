import type {DialogueMessage,StageId,STEMTask,ChatRequest} from '@/types';
import {demoTasks} from '@/data/tasks';
export const windTurns:Record<StageId,string[]>={
 understand:['要做一个用风走的小车。','要跑到至少3米。','只能用老师给的材料。','小车跑2米还没有达到3米目标。','我会用尺子看小车有没有跑到3米。'],
 imagine:['我想把帆做大一点。','也可以把车做轻一点。','我想先试大一点的帆。','因为大帆可能能接到更多风。','我会比较大帆和小帆哪个让小车跑得远。'],
 plan:['我想改变帆的大小。','每次都用同一个风扇位置。','我要测量小车行驶的距离。','先装好帆，然后开风扇，再用尺子量距离。','我会记录大小两种帆的小车距离。'],
 build:['我已经把帆安装在小车上了。','我已经用胶带把帆固定好了。','动手时我看到轮子有点歪。','我已经把车轮调直了。','我看到车轮不再摩擦车身了。'],
 test:['第一次实际测到小车跑了2.1米。','第二次实际测到小车跑了2.4米。','两次结果都还没到3米。','我观察到小车最后慢慢停下来了。','我会记住这两次距离，和小车3米目标比。'],
 improve:['我想把轮子调直一点。','我准备把轮轴调整后用胶带固定。','因为刚才测试看到轮子歪，所以我想这样改。','我想先改轮子，其他条件保持一样。','改后我会再测小车的距离来比较。'],
 reflect:['我发现轮子的摩擦会影响小车行驶距离。','刚才测试轮子变顺后小车跑得更远。','以前我觉得只看帆，现在我觉得轮子也重要。','下次我会先看看轮子是否歪了。','我学会用真实测到的距离来检查小车想法。']};
export function dialogue(texts:string[],prefix='turn'):DialogueMessage[]{return texts.flatMap((text,index)=>[{id:`${prefix}-${index}`,role:'student' as const,text,dialogue:{intent:'chat' as const}},{id:`coach-${prefix}-${index}`,role:'assistant' as const,text:'看看任务中的想法，接下来你会怎样解释？',dialogue:{intent:'chat' as const,replyTo:`${prefix}-${index}`,successful:true}}]);}
export function rubricRequest(stage:StageId='understand',task:STEMTask=demoTasks[0],texts=windTurns[stage]):ChatRequest{return {task,stage,level:2,messageId:'latest',message:texts.at(-1)!,history:[],progressionHistory:dialogue(texts.slice(0,-1)),artifacts:{},completed:[],interfaceLanguage:'zh-CN'};}
