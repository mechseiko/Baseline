/**
 * BaselineIndicator — the core visual motif of the product.
 *
 * A short horizontal track with a dot whose position encodes how far
 * a value has drifted from the patient's personal baseline.
 *
 * Props:
 *   value       — current numeric value
 *   baseline    — patient's personal baseline for this metric
 *   rangeMin    — HOLON reference range low bound (or estimate)
 *   rangeMax    — HOLON reference range high bound (or estimate)
 *   status      — 'critical' | 'watch' | 'stable' | 'skeleton'
 *   size        — 'sm' (inline cards) | 'md' (detail panel) — default 'sm'
 */
export default function BaselineIndicator({
  value,
  baseline,
  rangeMin,
  rangeMax,
  status = 'stable',
  size = 'sm',
}) {
  if (status === 'skeleton') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className={`bl-track ${size === 'md' ? 'w-16' : 'w-14'}`}
          aria-label="Loading baseline indicator"
        >
          <span className="bl-dot bl-dot--skeleton" style={{ left: '50%' }} />
        </span>
      </span>
    );
  }

  // Compute dot position as a percentage across the track.
  // Centre (50%) = at personal baseline. Edges = max drift.
  const trackWidth = size === 'md' ? 64 : 56; // px, matching CSS classes
  let pct = 50; // default: at baseline

  if (
    value != null &&
    baseline != null &&
    rangeMin != null &&
    rangeMax != null
  ) {
    const num = Number(value);
    const base = Number(baseline);
    const spread = Math.max(Number(rangeMax) - Number(rangeMin), 1);
    const deviation = num - base;
    // Normalize deviation to [-1, +1] relative to the reference spread
    const normalized = Math.max(-1, Math.min(1, deviation / (spread * 0.5)));
    pct = 50 + normalized * 45; // clamp within 5%–95% of track
  }

  const dotClass =
    status === 'critical'
      ? 'bl-dot--critical'
      : status === 'watch'
      ? 'bl-dot--watch'
      : 'bl-dot--stable';

  const trackW = size === 'md' ? 'w-16' : 'w-14';

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={`Drift status: ${status}`}
      role="img"
      aria-label={`Baseline indicator: ${status}`}
    >
      <span className={`bl-track ${trackW}`}>
        <span
          className={`bl-dot ${dotClass}`}
          style={{ left: `${pct}%` }}
        />
      </span>
    </span>
  );
}

/**
 * LogomarkIndicator — the nav logomark variant.
 * Simplified static version in teal-950 for the header.
 */
export function LogomarkIndicator({ className = '' }) {
  return (
    <svg
      width="32"
      height="16"
      viewBox="0 0 32 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Baseline logomark"
    >
      {/* Track line */}
      <line x1="2" y1="8" x2="30" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Dot slightly right of centre (watch position for visual interest) */}
      <circle cx="20" cy="8" r="3.5" fill="currentColor" />
      {/* Subtle baseline tick at centre */}
      <line x1="16" y1="5" x2="16" y2="11" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
    </svg>
  );
}
