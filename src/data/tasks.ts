import {defaultRubric} from '@/lib/stem/rubrics';
import type { STEMTask } from '@/types';
export const demoTasks: STEMTask[] = [
 {id:'wind-car',title:'Wind-Powered Car',description:'Design and build a wind-powered car that can travel at least 3 metres using the provided materials. You can choose and modify the materials, test your design, and make improvements.',type:'engineering-design',objectives:['Use wind to produce motion'],successCriteria:['Travel at least 3 metres'],constraints:['Use the provided materials'],availableMaterials:['Materials provided by your teacher']},
 {id:'bridge',title:'Bridge Challenge',description:'Design a model bridge spanning a 20 cm gap. Compare how different structures support a load safely.',type:'engineering-design',constraints:['Span a 20 cm gap','Use only paper and tape','Test on a low surface with adult supervision'],successCriteria:['Support 200 g for 10 seconds'],availableMaterials:['Paper','Tape','Ruler','Small test masses']},
 {id:'filtration',title:'Water Filtration Challenge',description:'Design and investigate a filter that reduces visible particles in a sample of muddy water. Filtered water is not safe to drink.',type:'engineering-design',constraints:['Do not drink any sample','Ask an adult to prepare containers'],successCriteria:['Compare visible clarity before and after filtering under the same conditions'],availableMaterials:['Filter paper','Gravel','Sand','Containers']},
 {id:'insulation',title:'Thermal Insulation Investigation',description:'Investigate which available material slows the cooling of warm water most effectively. Use teacher-approved warm water, never boiling water.',type:'experimental-investigation',constraints:['Keep starting conditions consistent','Use safe warm water with adult supervision'],successCriteria:['Compare temperature change over a fixed time across repeated trials'],availableMaterials:['Cups','Fabric','Paper','Thermometer','Timer']},
 {id:'plants',title:'Plant Growth Investigation',description:'Investigate how light exposure relates to the growth of seedlings over time. Design a fair comparison and record observations.',type:'scientific-inquiry',constraints:['Care for all plants','Keep other relevant growing conditions consistent'],successCriteria:['Collect repeated growth measurements and explain the evidence and limitations'],availableMaterials:['Seedlings','Containers','Ruler','Water']}
];

export const demoVisuals:Record<string,boolean>={'wind-car':true};

const chineseTasks:Record<string,NonNullable<STEMTask['translations']>['zh-CN']>={
 'wind-car':{title:'风力小车',description:'使用提供的材料设计并制作一辆能行驶至少 3 米的风力小车。你可以选择、调整材料，测试设计并进行改进。',objectives:['利用风推动物体运动'],successCriteria:['行驶至少 3 米'],constraints:['使用提供的材料'],availableMaterials:['教师提供的材料']},
 bridge:{title:'纸桥承重挑战',description:'设计一座跨越 20 厘米间隙的模型桥，比较不同结构如何安全地承受重量。',constraints:['跨越 20 厘米间隙','仅使用纸和胶带','在低处测试，并由成人监督'],successCriteria:['承受 200 克重量至少 10 秒'],availableMaterials:['纸','胶带','尺子','小砝码']},
 filtration:{title:'水过滤挑战',description:'设计并研究一个能减少泥水中可见颗粒的过滤装置。过滤后的水仍然不能饮用。',constraints:['不要饮用任何水样','请成人帮助准备容器'],successCriteria:['在相同条件下比较过滤前后的可见清澈程度'],availableMaterials:['滤纸','砾石','沙子','容器']},
 insulation:{title:'保温材料探究',description:'研究哪些材料能更有效地减缓温水冷却。使用教师允许的温水，禁止使用沸水。',constraints:['保持初始条件一致','在成人监督下使用安全温水'],successCriteria:['在固定时间内重复比较温度变化'],availableMaterials:['杯子','布料','纸','温度计','计时器']},
 plants:{title:'植物生长探究',description:'研究光照与幼苗生长的关系，设计公平比较并持续记录观察结果。',constraints:['照顾所有植物','保持其他相关生长条件一致'],successCriteria:['重复测量生长情况，并解释证据及其局限'],availableMaterials:['幼苗','容器','尺子','水']}
};
for(const task of demoTasks){task.translations={'zh-CN':chineseTasks[task.id]};task.taskRevision=2;task.progressionCriteria=defaultRubric(task);}
