import {
  Check,
  Sparkles,
  BookOpen,
  Folder,
  CircleHelp,
  ArrowRight,
} from "lucide-react";
import { stages } from "@/data/challenge";
import type { StageId } from "@/types";
export function ProgressSidebar({
  active,
  completed,
  onStage,
  onTool,
}: {
  active: StageId;
  completed: StageId[];
  onStage: (id: StageId) => void;
  onTool: (name: string) => void;
}) {
  return (
    <aside className="progress-sidebar">
      <div className="sidebar-heading">
        PROJECT PROGRESS<span>{completed.length}/7</span>
      </div>
      <ol className="stage-list">
        {stages.map((stage, i) => (
          <li key={stage.id}>
            <button
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
            key={name}
            onClick={() => onTool(name)}
            className={name === "AI Coach" ? "tool-active" : ""}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
      </div>
      <div className="sidebar-note">
        <SproutMark />
        <p>
          Big ideas start with
          <br />a little curiosity.
        </p>
      </div>
    </aside>
  );
}
function SproutMark() {
  return <span className="note-sprout">✧</span>;
}
