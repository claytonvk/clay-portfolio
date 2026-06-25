import { scoreColor } from "./ui";

// Circular progress ring for a 0–100 health/score value.
export default function HealthRing({
  score,
  size = 64,
  stroke = 6,
  label,
}: {
  score: number | null | undefined;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-ink/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span
          className="font-vanguard font-extrabold"
          style={{ color, fontSize: size * 0.3 }}
        >
          {score == null ? "—" : score}
        </span>
        {label && (
          <span className="text-[9px] uppercase tracking-widest2 text-muted mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
