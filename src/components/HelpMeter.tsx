import {useI18n} from '@/lib/i18n';
import { Sparkles } from "lucide-react";
import { supportLabels } from "@/data/challenge";
import type { SupportLevel } from "@/types";
export function HelpMeter({
  level,
  onChange,
  disabled=false,
}: {
  level: SupportLevel;
  disabled?:boolean;
  onChange: (level: SupportLevel) => void;
}) {
 const {t}=useI18n();

  return (
    <section className="rail-section help-meter">
      <h2>
        <Sparkles size={17} />{t("AI Help Meter")}</h2>
      <div className="meter-label">
        <span>{t("Current Support Level")}</span>
        <strong>{t("Level")}{level}</strong>
      </div>
      <div
        className="meter-buttons"
        role="group"
        aria-label={t("Choose AI support level")}
      >
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            disabled={disabled}
            aria-label={`${t("Level")} ${n}: ${t(supportLabels[n])}`}
            aria-pressed={level === n}
            onClick={() => onChange(n)}
            className={n <= level ? "filled" : ""}
          >
            <span />
            {n}
          </button>
        ))}
      </div>
      <strong className="support-description">{t(supportLabels[level])}</strong>
      <p>
        {level === 1
          ? t("A small clue, then one decision of your own.")
          : level === 2
            ? t("A partial frame to help you break down the next step.")
            : t("Small steps, with one choice at a time.")}
      </p>
    </section>
  );
}
