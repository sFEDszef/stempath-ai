import { Sprout, ArrowUpRight } from "lucide-react";
export function Header({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <header className="header">
      <button
        className="brand"
        onClick={() => onNavigate("Home")}
        aria-label="STEMPath AI home"
      >
        <span className="brand-icon">
          <Sprout size={26} />
        </span>
        <span>
          <strong>
            STEMPath <em>AI</em>
          </strong>
          <small>Think · Explore · Build · Grow</small>
        </span>
      </button>
      <nav aria-label="Main navigation">
        {["Home", "Challenges", "My Projects", "Resources"].map((name) => (
          <button
            key={name}
            className={name === "Challenges" ? "nav-active" : ""}
            onClick={() => onNavigate(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <span className="prototype-label">
        Learning workspace <ArrowUpRight size={14} />
      </span>
    </header>
  );
}
