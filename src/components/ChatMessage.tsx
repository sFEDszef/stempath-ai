import {useI18n} from '@/lib/i18n';
import { Sparkles, UserRound } from "lucide-react";
import type { Message } from "@/types";
export function ChatMessage({
  researchVisible=false,
  message,
}: {
  researchVisible?:boolean;
  message: Message;
}) {
 const {t}=useI18n();

  const ai = message.role === "assistant";
  return (
    <article className={`message ${ai ? "ai" : "student"}`}>
      <div className="message-avatar">
        {ai ? <Sparkles size={15} /> : <UserRound size={15} />}
      </div>
      <div className="message-body">
        <span className="message-author">{ai ? `${t("STEM Coach")}${researchVisible&&message.metadata ? ` · ${message.metadata.provider==='deepseek'?'DeepSeek':'Demo'}${message.metadata.fallbackReason?' (fallback)':''}` : ''}` : t("You")}</span>
        <div
          className="message-bubble"
          lang={/[\u3400-\u9fff]/.test(message.text) ? "zh-CN" : "en"}
        >
          {message.text}
        </div>

      </div>
    </article>
  );
}
