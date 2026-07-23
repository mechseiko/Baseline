/**
 * formatTime — formats an ISO timestamp for display.
 * Numbers always rendered in mono context (tabular-nums).
 */
export function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/**
 * formatTimestamp — full ISO timestamp in mono display.
 */
export function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * derivePatientStatus — returns the worst status across all events.
 * critical > watch > stable
 */
export function derivePatientStatus(events = []) {
  if (events.some((e) => e.status === 'critical')) return 'critical';
  if (events.some((e) => e.status === 'watch')) return 'watch';
  return 'stable';
}

/**
 * sortPatients — sorts by status severity then by most-recent event time.
 */
export function sortPatients(patients) {
  const order = { critical: 0, watch: 1, stable: 2 };
  return [...patients].sort((a, b) => {
    const sa = derivePatientStatus(a.events);
    const sb = derivePatientStatus(b.events);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    // Tie-break: most recent event first
    const ta = Math.max(...a.events.map((e) => new Date(e.occurredAt).getTime()));
    const tb = Math.max(...b.events.map((e) => new Date(e.occurredAt).getTime()));
    return tb - ta;
  });
}

/**
 * getTopEvents — returns the 1–2 most clinically relevant events to
 * show inline on the patient card (critical first, then watch, then stable).
 */
export function getTopEvents(events = [], max = 2) {
  const order = { critical: 0, watch: 1, stable: 2 };
  return [...events]
    .sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2))
    .slice(0, max);
}
