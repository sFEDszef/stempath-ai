import { Sparkles } from "lucide-react";
import { supportLabels } from "@/data/challenge";
import type { SupportLevel } from "@/types";
export function HelpMeter({
  level,
  onChange,
}: {
  level: SupportLevel;
  onChange: (level: SupportLevel) => void;
}) {
  return (
    <section className="rail-section help-meter">
      <h2>
        <Sparkles size={17} />
        AI Help Meter
      </h2>
      <div className="meter-label">
        <span>Current Support Level</span>
        <strong>Level {level}</strong>
      </div>
      <div
        className="meter-buttons"
        role="group"
        aria-label="Choose AI support level"
      >
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            aria-label={`Level ${n}: ${supportLabels[n]}`}
            aria-pressed={level === n}
            onClick={() => onChange(n)}
            className={n <= level ? "filled" : ""}
          >
            <span />
            {n}
          </button>
        ))}
      </div>
      <strong className="support-description">{supportLabels[level]}</strong>
      <p>
        {level === 1
          ? "Good questions help great ideas grow."
          : level === 2
            ? "A small hint to help you find your next step."
            : "A thinking framework to help you move forward."}
      </p>
    </section>
  );
}
