import { stages, suggestedReplies } from "@/data/challenge";
import type { CoachService } from "@/types";
// Replace this adapter with a server endpoint when a real backend is introduced.
// Keep provider credentials on the server; never put them in client components.
export const mockCoach: CoachService = {
  async respond({ stage, level, messages }) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    const current = stages.find((item) => item.id === stage)!;
    const last = messages.at(-1)?.text ?? "";
    const uncertain = /不确定|不知道|提示|hint|not sure/i.test(last);
    let text = `${uncertain ? "没关系，先从一个小问题开始。" : "谢谢你分享你的想法。让我们用观察和证据继续探索。"}\n\n${current.prompts[level - 1]}`;
    if (stage === "understand" && /大|bigger|larger/.test(last) && level === 1)
      text =
        "这是一个可以测试的猜想！\n如果帆变大，小车的稳定性也可能改变。你会怎样设计一个公平的比较，来检验你的想法？\n\nWhat would you keep the same while changing the sail size?";
    return {
      text,
      suggestions:
        stage === "understand"
          ? suggestedReplies
          : ["我想先画出我的想法。", "我不确定。", "我想比较两次测试的结果。"],
    };
  },
};
