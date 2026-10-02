import {useI18n} from '@/lib/i18n';
import {
  Check,
  Sparkles,
  BookOpen,
  Folder,
  CircleHelp,
  ArrowRight,
} from "lucide-react";

import type { Stage, StageId } from "@/types";
export function ProgressSidebar({
  locked=[],
  stages,
  active,
  completed,
  onStage,
  onTool,
}: {
  locked?:StageId[];
  stages: Stage[];
  active: StageId;
  completed: StageId[];
  onStage: (id: StageId) => void;
  onTool: (name: string) => void;
}) {
 const {t}=useI18n();

  return (
    <aside className="progress-sidebar">
      <div className="sidebar-heading">{t("PROJECT PROGRESS")}<span>{completed.length}{t("/7")}</span>
      </div>
      <ol className="stage-list">
        {stages.map((stage, i) => (
          <li key={stage.id}>
            <button
              disabled={locked.includes(stage.id)}
              title={locked.includes(stage.id)?t("Upcoming"):undefined}
              onClick={() => onStage(stage.id)}
              className={`stage-button ${active === stage.id ? "active" : ""} ${completed.includes(stage.id) ? "completed" : ""}`}
              aria-current={active === stage.id ? "step" : undefined}
            >
              <span className="stage-number">
                {completed.includes(stage.id) ? <Check size={15} /> : i + 1}
              </span>
              <span>
                <strong>{stage.title}</strong>
                <small>{stage.description}</small>
              </span>
              {active === stage.id && (
                <ArrowRight size={14} className="stage-arrow" />
              )}
            </button>
          </li>
        ))}
      </ol>
      <div className="sidebar-tools">
        {[
          { name: "AI Coach", icon: Sparkles },
          { name: "My Notebook", icon: BookOpen },
          { name: "My Files", icon: Folder },
          { name: "Help", icon: CircleHelp },
        ].map(({ name, icon: Icon }) => (
          <button
            key={t(name)}
            onClick={() => onTool(name)}
            className={name === "AI Coach" ? "tool-active" : ""}
          >
            <Icon size={18} />
            {t(name)}
          </button>
        ))}
      </div>
      <div className="sidebar-note">
        <SproutMark />
        <p>{t("Big ideas start with")}<br />{t("a little curiosity.")}</p>
      </div>
    </aside>
  );
}
function SproutMark() {
  return <span className="note-sprout">✧</span>;
}
