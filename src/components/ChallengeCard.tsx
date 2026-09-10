import { Wind, Flag, MoveUpRight } from "lucide-react";
import { challenge } from "@/data/challenge";
export function ChallengeCard() {
  return (
    <section className="challenge-card">
      <div className="challenge-copy">
        <h1>{challenge.title}</h1>
        <p>{challenge.description}</p>
        <div className="challenge-goal">
          <Flag size={15} />
          <span>
            Your goal: <strong>Travel at least 3 metres</strong>
          </span>
        </div>
      </div>
      <div
        className="challenge-image"
        role="img"
        aria-label="Wind-powered car challenge image placeholder"
      >
        <Wind size={44} strokeWidth={1.3} />
        <div className="car-placeholder">
          <span className="sail" />
          <span className="car-base" />
          <span className="wheel wheel-one" />
          <span className="wheel wheel-two" />
        </div>
        <span className="image-caption">
          A little wind. A big idea. <MoveUpRight size={13} />
        </span>
      </div>
    </section>
  );
}
