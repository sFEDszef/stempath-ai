import { Check } from "lucide-react";
import { stages } from "@/data/challenge";
import type { StageId } from "@/types";
export function STEMJourney({
  active,
  completed,
  onStage,
}: {
  active: StageId;
  completed: StageId[];
  onStage: (id: StageId) => void;
}) {
  return (
    <section className="rail-section journey">
      <h2>Your STEM Journey</h2>
      <div className="journey-summary">
        <span>{completed.length} of 7 stages completed</span>
        <strong>{Math.round((completed.length / 7) * 100)}%</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${(completed.length / 7) * 100}%` }} />
      </div>
      <ol>
        {stages.map((stage) => (
          <li key={stage.id}>
            <button
              aria-current={stage.id === active ? "step" : undefined}
              onClick={() => onStage(stage.id)}
              className={
                stage.id === active
                  ? "journey-active"
                  : completed.includes(stage.id)
                    ? "journey-completed"
                    : ""
              }
            >
              <span className="journey-dot">
                {completed.includes(stage.id) && <Check size={10} />}
              </span>
              {stage.title}
              {stage.id === active && (
                <small>
                  {completed.includes(stage.id) ? "Completed" : "In progress"}
                </small>
              )}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
