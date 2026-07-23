import BaselineIndicator from './BaselineIndicator';
import { derivePatientStatus, formatTime, getTopEvents } from '../lib/utils';

const STATUS_LABEL = {
  critical: 'Critical',
  watch:    'Watch',
  stable:   'Stable',
};

/**
 * PatientCard — one row in the queue.
 * Shows: name, age/sex, status badge, top 1–2 readings with baseline indicator, timestamp.
 */
export default function PatientCard({ patient, onClick, isNew = false }) {
  const status = derivePatientStatus(patient.events);
  const topEvents = getTopEvents(patient.events, 2);
  const latestAt = patient.events.reduce((acc, e) =>
    new Date(e.occurredAt) > new Date(acc) ? e.occurredAt : acc,
    patient.events[0]?.occurredAt ?? ''
  );

  return (
    <article
      id={`patient-card-${patient.id}`}
      className={`
        patient-card bg-white rounded-xl border px-5 py-4
        flex items-start gap-4 w-full text-left
        ${isNew ? 'animate-status-rise' : ''}
      `}
      style={{ borderColor: '#DCE6E3' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`View ${patient.name}, status ${status}`}
    >
      {/* Status stripe (left edge semantic indicator — NOT a decorative stripe) */}
      <div
        className="flex-shrink-0 w-1 self-stretch rounded-full"
        style={{
          backgroundColor:
            status === 'critical' ? '#D64545'
            : status === 'watch'   ? '#E0A458'
            : '#4F9D8C',
        }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top row: name + status badge + timestamp */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2
              className="font-serif text-base font-semibold truncate"
              style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', color: '#12211F' }}
            >
              {patient.name}
            </h2>
            <span
              className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: '#F7FAF9',
                color: '#5C6B68',
                border: '1px solid #DCE6E3',
              }}
            >
              {patient.age}y · {patient.sex === 'male' ? 'M' : 'F'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={status} />
            <span
              className="font-mono text-xs"
              style={{ color: '#5C6B68', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(latestAt)}
            </span>
          </div>
        </div>

        {/* Readings row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {topEvents.map((ev) => (
            <ReadingChip key={ev.id} event={ev} />
          ))}
          {patient.drugInteractionNote && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(214,69,69,0.08)',
                color: '#D64545',
                border: '1px solid rgba(214,69,69,0.2)',
              }}
            >
              ⚠ Drug interaction
            </span>
          )}
        </div>

        {/* Flag note preview */}
        {patient.flagNote && (
          <p
            className="mt-2 text-xs line-clamp-1"
            style={{ color: '#5C6B68' }}
          >
            {patient.flagNote}
          </p>
        )}
      </div>
    </article>
  );
}

function ReadingChip({ event }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: '#5C6B68' }}>
        {event.label}
      </span>
      <span
        className="font-mono text-sm font-medium"
        style={{ color: '#12211F', fontVariantNumeric: 'tabular-nums' }}
      >
        {event.value}
        <span className="text-xs ml-0.5 font-normal" style={{ color: '#5C6B68' }}>
          {event.unit}
        </span>
      </span>
      <BaselineIndicator
        value={event.value}
        baseline={event.baselineValue}
        rangeMin={event.rangeMin}
        rangeMax={event.rangeMax}
        status={event.status ?? 'stable'}
        size="sm"
      />
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor:
            status === 'critical' ? '#D64545'
            : status === 'watch'   ? '#E0A458'
            : '#4F9D8C',
        }}
      />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
