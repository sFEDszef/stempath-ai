import { useEffect, useRef, useState } from "react";
import { Sparkles, ImagePlus, ArrowUp, Check, ChevronDown } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { supportLabels } from "@/data/challenge";
import type { Message, Stage, SupportLevel } from "@/types";
export function AIChat({
  stage,
  level,
  messages,
  busy,
  onSend,
  onUpload,
  onComplete,
  complete,
  onLevel,
}: {
  stage: Stage;
  level: SupportLevel;
  messages: Message[];
  busy: boolean;
  onSend: (text: string) => void;
  onUpload: () => void;
  onComplete: () => void;
  complete: boolean;
  onLevel: (level: SupportLevel) => void;
}) {
  const [input, setInput] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const previous = useRef(messages.length);
  useEffect(() => {
    if (previous.current !== messages.length) {
      log.current?.scrollTo({
        top: log.current.scrollHeight,
        behavior: "smooth",
      });
      previous.current = messages.length;
    }
  }, [messages.length]);
  function submit() {
    if (input.trim() && !busy) {
      onSend(input.trim());
      setInput("");
    }
  }
  return (
    <section className="chat-panel" id="ai-coach">
      <div className="chat-heading">
        <div className="coach-title">
          <span className="coach-icon">
            <Sparkles size={20} />
          </span>
          <div>
            <h2>AI STEM Coach</h2>
            <p>Your thinking partner, every step of the way.</p>
          </div>
        </div>
        <span className="mock-badge">
          <i /> Mock AI
        </span>
      </div>
      <div className="chat-context">
        <span>
          Current Stage <strong>{stage.title}</strong>
        </span>
        <label>
          Current Support Level{" "}
          <span className="support-select">
            <select
              aria-label="Current Support Level"
              value={level}
              onChange={(e) => onLevel(Number(e.target.value) as SupportLevel)}
            >
              {([1, 2, 3] as const).map((n) => (
                <option value={n} key={n}>
                  Level {n}
                </option>
              ))}
            </select>
            <ChevronDown size={12} />
          </span>
        </label>
      </div>
      <div
        className="chat-log"
        ref={log}
        role="log"
        aria-label="Coach conversation"
        aria-live="polite"
      >
        <div className="chat-date">LET’S EXPLORE TOGETHER</div>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onReply={onSend}
            disabled={busy}
          />
        ))}
        {busy && (
          <div className="thinking">
            <Sparkles size={15} /> Your coach is thinking<span>•••</span>
          </div>
        )}
      </div>
      <div className="composer-area">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="composer"
        >
          <button
            className="upload-chat"
            type="button"
            onClick={onUpload}
            aria-label="Upload image to artifacts"
          >
            <ImagePlus size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your ideas… 用你喜欢的语言表达"
            aria-label="Message to AI Coach"
            rows={1}
            maxLength={4000}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            className="send-button"
            aria-label="Send message"
            disabled={!input.trim() || busy}
          >
            <ArrowUp size={20} />
          </button>
        </form>
        <div className="composer-hint">
          <span>
            <Sparkles size={12} /> A little guidance. Your own discoveries.
          </span>
          <span>Enter to send</span>
        </div>
      </div>
      <div className="stage-footer">
        <span>{supportLabels[level]} · Space to think for yourself</span>
        <button onClick={onComplete} className={complete ? "is-complete" : ""}>
          <Check size={14} />
          {complete ? "Stage completed" : "Complete stage"}
        </button>
      </div>
    </section>
  );
}
