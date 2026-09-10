import { Sparkles, UserRound } from "lucide-react";
import type { Message } from "@/types";
export function SuggestedReplies({
  replies,
  onReply,
  disabled,
}: {
  replies: string[];
  onReply: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="suggested-replies">
      {replies.map((reply) => (
        <button disabled={disabled} onClick={() => onReply(reply)} key={reply}>
          {reply}
        </button>
      ))}
    </div>
  );
}
export function ChatMessage({
  message,
  onReply,
  disabled,
}: {
  message: Message;
  onReply: (text: string) => void;
  disabled: boolean;
}) {
  const ai = message.role === "assistant";
  return (
    <article className={`message ${ai ? "ai" : "student"}`}>
      <div className="message-avatar">
        {ai ? <Sparkles size={15} /> : <UserRound size={15} />}
      </div>
      <div className="message-body">
        <span className="message-author">{ai ? "STEM Coach" : "You"}</span>
        <div
          className="message-bubble"
          lang={/[\u3400-\u9fff]/.test(message.text) ? "zh-CN" : "en"}
        >
          {message.text}
        </div>
        {message.suggestions && (
          <SuggestedReplies
            replies={message.suggestions}
            onReply={onReply}
            disabled={disabled}
          />
        )}
      </div>
    </article>
  );
}
