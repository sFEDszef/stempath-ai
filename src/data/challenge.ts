import type { Stage, Message, SupportLevel } from "@/types";
export const challenge = {
  title: "Wind-Powered Car",
  description:
    "Design and build a wind-powered car that can travel at least 3 metres using the provided materials. You can choose and modify the materials, test your design, and make improvements.",
};
export const stages: Stage[] = [
  {
    id: "understand",
    title: "Understand",
    description: "What is the problem?",
    question: "How does wind produce motion?",
    prompts: [
      "你认为风是如何推动小车前进的？What do you think makes the car move?",
      "想一想风接触帆时会发生什么。What might change when the sail catches more wind?",
      "把问题分成三部分：风、帆和车轮。画出你认为力传递的方向，再解释你的想法。Which part will you explore first?",
    ],
  },
  {
    id: "imagine",
    title: "Imagine",
    description: "Generate ideas",
    question: "What different designs could you try?",
    prompts: [
      "你能想出两种不同的小车设计吗？What might make each idea work?",
      "可以从帆的形状、材料或位置选择一个方面。What two alternatives could you sketch?",
      "在纸上画两个方案，分别标出帆、车身和轮子。写下各自一个优点和一个疑问。Which idea would you like to investigate?",
    ],
  },
  {
    id: "plan",
    title: "Plan",
    description: "Design and prepare",
    question: "What will you need for your design?",
    prompts: [
      "你打算怎样把想法变成可以测试的设计？What will you need to plan?",
      "想一想材料、尺寸和连接方式。What needs to stay strong, and what needs to move freely?",
      "试着补全：我选择___作为车身，因为___；我会用___连接；我需要先检查___。What would you put in each blank?",
    ],
  },
  {
    id: "build",
    title: "Build",
    description: "Make your prototype",
    question: "How will you bring your plan to life?",
    prompts: [
      "制作时，你最想先检查哪一部分？How will you know it works as intended?",
      "试着轻轻转动车轮，观察哪里可能卡住。What do you notice about the moving parts?",
      "分步检查：连接是否牢固、轮子能否转动、帆是否稳定。记录一个发现，再决定下一步。What do you observe?",
    ],
  },
  {
    id: "test",
    title: "Test",
    description: "Collect data",
    question: "How can you make your test fair?",
    prompts: [
      "怎样判断小车是否达到3米的目标？How could you make your results trustworthy?",
      "想一想起点、风源位置和重复次数。What should stay the same in every trial?",
      "画一个记录表：试验次数、距离、观察。保持起点和风源一致，重复测试后比较结果。What pattern will you look for?",
    ],
  },
  {
    id: "improve",
    title: "Improve",
    description: "Redesign and iterate",
    question: "What does your evidence suggest changing?",
    prompts: [
      "哪一个测试发现最值得进一步研究？What single change would you try, and why?",
      "回看记录：小车是否偏离方向、停下或倾倒？Which design feature might explain it?",
      "补全：我观察到___；我推测原因是___；我只改变___；再比较___。What evidence would support your idea?",
    ],
  },
  {
    id: "reflect",
    title: "Reflect",
    description: "What did you learn?",
    question: "How has your thinking changed?",
    prompts: [
      "你的想法和最初相比有什么变化？What evidence changed your thinking?",
      "比较最初的草图和最后的测试记录。Which improvement taught you the most?",
      "用三个句子反思：起初我认为___；测试表明___；下次我会___。Can you connect your learning to another everyday object?",
    ],
  },
];
export const supportLabels: Record<SupportLevel, string> = {
  1: "Socratic questioning",
  2: "Directional hint",
  3: "Stronger scaffold",
};
export const suggestedReplies = [
  "我觉得帆越大，小车跑得越快。",
  "我不确定。",
  "你能给我一些提示吗？",
];
export const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hi! Let’s start with the Understand stage.\nBefore we design anything, try thinking about the problem first.",
  },
  { id: "student-1", role: "student", text: "我不知道从哪里开始。" },
  {
    id: "coach-1",
    role: "assistant",
    text: "没关系，我们可以一步步来。你可以先思考：\n\n1. 风是如何产生推力的？\n2. 一辆小车需要哪些基本部分？\n3. 这个挑战有哪些限制条件？\n\n你先试着回答第一个问题：你认为风是如何推动小车前进的？",
  },
  {
    id: "student-2",
    role: "student",
    text: "可能是风吹动帆，然后产生推力带动小车。",
  },
  {
    id: "coach-2",
    role: "assistant",
    text: "很好！你已经抓住了一个关键点。\n那么你觉得帆的大小会如何影响小车的速度？\n先大胆猜一猜，然后我们再想办法验证。",
    suggestions: suggestedReplies,
  },
];
