import {useI18n} from '@/lib/i18n';
import { useEffect, useRef, useState } from "react";
import { Sparkles, ImagePlus, ArrowUp, Check, ChevronDown } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { supportLabels } from "@/data/challenge";
import type { Message, Stage, SupportLevel } from "@/types";
export function AIChat({
  completionLabel,
  researchVisible=false,
  recommendation,
  mode,
  coachDisabled=false, supportDisabled=false, sessionFinished=false,
  stage,
  level,
  messages,
  busy,
  onSend,
  onUpload,
  onComplete,
  complete,
  onLevel,
  error,
  onRetry,
}: {
  completionLabel?:string;
  researchVisible?:boolean;
  recommendation?: import("react").ReactNode;
  mode?: "ai"|"demo"|"deepseek";
  coachDisabled?:boolean; supportDisabled?:boolean; sessionFinished?:boolean;
  error?: {message:string; retryable:boolean};
  onRetry: () => void;
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
 const {t}=useI18n();

  const [input, setInput] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const previous = useRef(messages.length);
  useEffect(()=>setInput(""),[stage.id]);
  useEffect(() => {
    if (previous.current !== messages.length || error || busy) {
      log.current?.scrollTo({
        top: log.current.scrollHeight,
        behavior: "smooth",
      });
      previous.current = messages.length;
    }
  }, [messages.length, error, busy]);
  function submit() {
    if (input.trim() && !busy && !coachDisabled) {
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
            <h2>{t("AI STEM Coach")}</h2>
            <p>{t("Your thinking partner, every step of the way.")}</p>
          </div>
        </div>
        {researchVisible&&<span className="mock-badge">
          <i /> {coachDisabled ? t("Guided workspace") : mode === "ai" ? t("DeepSeek") : mode === "demo" ? t("Demo") : mode === "deepseek" ? t("DeepSeek selected") : t("Auto")}
        </span>}
      </div>
      <div className="chat-context">
        <span>{t("Current Stage")}<strong>{stage.title}</strong>
        </span>
        <label>{t("Current Support Level")}{t(" ")}
          <span className="support-select">
            <select
              aria-label={t("Current Support Level")}
              disabled={supportDisabled||coachDisabled}
              value={level}
              onChange={(e) => onLevel(Number(e.target.value) as SupportLevel)}
            >
              {([1, 2, 3] as const).map((n) => (
                <option value={n} key={n}>{t("Level")}{n}
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
        aria-label={t("Coach conversation")}
        aria-live="polite"
      >
        <div className="chat-date">{t("LET’S EXPLORE TOGETHER")}</div>
        {coachDisabled&&<p className="static-stage-prompt">{sessionFinished?t("Your session is complete. Review your thinking records below."):`${t("Your Thinking")}: ${stage.question}`}</p>}
        {(!coachDisabled||sessionFinished)&&messages.map((message) => (
          <ChatMessage
            key={message.id}
            researchVisible={researchVisible}
            message={message}
          />
        ))}
        {!coachDisabled&&busy && (
          <div className="thinking">
            <Sparkles size={15} />{t("Your coach is thinking")}<span>{t("•••")}</span>
          </div>
        )}
        {!coachDisabled&&error && <div className="message ai" role="alert"><div className="message-body"><div className="message-bubble">{researchVisible||error.message.includes('使用上限')?error.message:t("The coach could not respond. Please retry.")}</div>{error.retryable && <div className="suggested-replies"><button disabled={busy} onClick={onRetry}>{t("Retry / 重试")}</button></div>}</div></div>}
      </div>
      {!coachDisabled&&recommendation}
      {!coachDisabled&&<div className="composer-area">
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
            aria-label={t("Upload image to artifacts")}
          >
            <ImagePlus size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("Share your ideas… 用你喜欢的语言表达")}
            aria-label={t("Message to AI Coach")}
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
            aria-label={t("Send message")}
            disabled={!input.trim() || busy}
          >
            <ArrowUp size={20} />
          </button>
        </form>
        <div className="composer-hint">
          <span>
            <Sparkles size={12} />{t("A little guidance. Your own discoveries.")}</span>
          <span>{t("Enter to send")}</span>
        </div>
      </div>
      }
      <div className="stage-footer">
        <span>{coachDisabled?t("Space to record your own thinking"):t(supportLabels[level])+t(" · Space to think for yourself")}</span>
        <button disabled={sessionFinished||busy} onClick={onComplete} className={complete ? "is-complete" : ""}>
          <Check size={14} />
          {completionLabel??(complete ? t("Stage completed") : t("Complete stage"))}
        </button>
      </div>
    </section>
  );
}
