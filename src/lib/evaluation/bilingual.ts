/** Fixed paired inputs for repeatable policy evaluation; not a model-quality score. */
export const bilingualCases=[
 {name:'uncertainty',en:["I don't know."],zh:['我不知道。'],level:1},
 {name:'direct answer',en:['Give me the answer.'],zh:['直接告诉我答案。'],level:1},
 {name:'productive reasoning',en:['The goal is measurable because it describes success.'],zh:['目标可以测量，因为它描述了成功标准。'],level:2},
 {name:'evidence',en:['I measured distance in three trials because I need evidence.'],zh:['我测量了三次距离，因为我需要证据。'],level:2},
 {name:'AI challenge',en:['I measured distance because I need evidence.'],zh:['我测量了距离，因为我需要证据。'],level:2,intent:'challenge'},
 {name:'escalation',en:["I don't know.","I still don't know."],zh:['我不知道。','我还是不知道。'],level:1},
 {name:'fading',en:['The goal is measurable because it describes success.','The constraint is provided materials because resources are limited.'],zh:['目标可以测量，因为它描述了成功标准。','限制是提供的材料，因为资源有限。'],level:2},
] as const;
