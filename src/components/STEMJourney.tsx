import {useI18n} from '@/lib/i18n';
import { Check } from "lucide-react";

import type { Stage, StageId } from "@/types";
export function STEMJourney({
  locked=[],
  stages,
  active,
  completed,
  onStage,
}: {
  locked?:StageId[];
  stages: Stage[];
  active: StageId;
  completed: StageId[];
  onStage: (id: StageId) => void;
}) {
 const {t}=useI18n();

  return (
    <section className="rail-section journey">
      <h2>{t("Your STEM Journey")}</h2>
      <div className="journey-summary">
        <span>{completed.length}{t("of 7 stages completed")}</span>
        <strong>{Math.round((completed.length / 7) * 100)}{t("%")}</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${(completed.length / 7) * 100}%` }} />
      </div>
      <ol>
        {stages.map((stage) => (
          <li key={stage.id}>
            <button
              aria-current={stage.id === active ? "step" : undefined}
              disabled={locked.includes(stage.id)}
              title={locked.includes(stage.id)?t("Upcoming"):undefined}
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
                  {completed.includes(stage.id) ? t("Completed") : t("In progress")}
                </small>
              )}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
