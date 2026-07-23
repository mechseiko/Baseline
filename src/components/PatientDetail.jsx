import { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import BaselineIndicator from './BaselineIndicator';
import { StatusBadge } from './PatientCard';
import { formatTimestamp, derivePatientStatus } from '../lib/utils';
import { useGenerateNote } from '../lib/useGenerateNote';
import { X, AlertTriangle, Pill, Sparkles, RefreshCw } from 'lucide-react';

const SYSTEM_ICONS = {
  cardiovascular:  '❤️',
  metabolic:       '🔬',
  musculoskeletal: '🦴',
  nervous:         '🧠',
  respiratory:     '🫁',
};

/**
 * PatientDetail — slide-over panel opened by clicking a patient card.
 *
 * Phase 5: Generates a plain-language CHW note via /api/generate-note
 * when the panel opens for a flagged patient. Falls back to the fixture
 * flagNote field if the API call fails.
 */
export default function PatientDetail({ patient, role = 'CHW View', onClose }) {
  const panelRef = useRef(null);
  const { note, loading: noteLoading, generate } = useGenerateNote();

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus panel on mount
  useEffect(() => { panelRef.current?.focus(); }, []);

  // Auto-generate note when panel opens for a flagged patient
  useEffect(() => {
    if (!patient) return;
    const topEvent = getTopFlaggedEvent(patient);
    if (!topEvent) return;

    generate({
      patientName:  patient.name,
      age:          patient.age,
      sex:          patient.sex,
      system:       topEvent.system,
      loincLabel:   topEvent.label,
      value:        topEvent.value,
      unit:         topEvent.unit,
      rangeMin:     topEvent.rangeMin ?? null,
      rangeMax:     topEvent.rangeMax ?? null,
      status:       topEvent.status,
      interactions: [],
    });
  }, [patient?.id]); // re-run only when patient changes

  if (!patient) return null;

  const status = derivePatientStatus(patient.events);
  const displayNote = note ?? patient.flagNote;

  // Group events by system, sorted oldest→newest for sparklines
  const bySystem = patient.events.reduce((acc, ev) => {
    if (!acc[ev.system]) acc[ev.system] = [];
    acc[ev.system].push(ev);
    return acc;
  }, {});
  Object.values(bySystem).forEach((evs) =>
    evs.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="slide-over-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        id="patient-detail-panel"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col animate-slide-in"
        tabIndex={-1}
        aria-label={`Patient detail: ${patient.name}`}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between px-6 pt-6 pb-4 border-b"
          style={{ borderColor: '#DCE6E3' }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2
                className="font-serif text-xl font-semibold"
                style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', color: '#12211F' }}
              >
                {patient.name}
              </h2>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm" style={{ color: '#5C6B68' }}>
              {patient.age} years · {patient.sex === 'male' ? 'Male' : 'Female'}
              {role === 'Doctor View' && (
                <span className="ml-2 font-mono text-xs" style={{ color: '#5C6B68' }}>
                  ID: {patient.id}
                </span>
              )}
            </p>
          </div>
          <button
            id="patient-detail-close"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close patient detail"
          >
            <X size={18} style={{ color: '#5C6B68' }} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* CHW Action Note (Phase 5 — AI generated) */}
          {(displayNote || noteLoading) && status !== 'stable' && (
            <FlagNoteCard
              note={displayNote}
              loading={noteLoading}
              status={status}
              role={role}
              onRegenerate={() => {
                const topEvent = getTopFlaggedEvent(patient);
                if (topEvent) generate({
                  patientName: patient.name,
                  age: patient.age,
                  sex: patient.sex,
                  system: topEvent.system,
                  loincLabel: topEvent.label,
                  value: topEvent.value,
                  unit: topEvent.unit,
                  rangeMin: topEvent.rangeMin ?? null,
                  rangeMax: topEvent.rangeMax ?? null,
                  status: topEvent.status,
                  interactions: [],
                });
              }}
            />
          )}

          {/* Drug interaction note */}
          {patient.drugInteractionNote && (
            <div
              className="rounded-xl p-4 flex gap-3"
              style={{
                backgroundColor: 'rgba(214,69,69,0.05)',
                border: '1px solid rgba(214,69,69,0.15)',
              }}
            >
              <Pill size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#D64545' }} />
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: '#D64545' }}
                >
                  Drug Interaction Detected
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#12211F' }}>
                  {patient.drugInteractionNote}
                </p>
              </div>
            </div>
          )}

          {/* Events by system */}
          {Object.entries(bySystem).map(([system, events]) => (
            <SystemSection
              key={system}
              system={system}
              events={events}
              role={role}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-3 border-t flex items-center justify-between"
          style={{ borderColor: '#DCE6E3' }}
        >
          <p className="text-xs" style={{ color: '#5C6B68' }}>
            Access: scoped grant · time-bound · revocable
          </p>
          <button
            onClick={onClose}
            className="text-sm px-4 py-1.5 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#0E4B44', color: '#fff' }}
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FlagNoteCard({ note, loading, status, role, onRegenerate }) {
  const isDoc = role === 'Doctor View';
  const borderColor = status === 'critical' ? 'rgba(214,69,69,0.2)' : 'rgba(224,164,88,0.25)';
  const bgColor     = status === 'critical' ? 'rgba(214,69,69,0.07)' : 'rgba(224,164,88,0.09)';
  const textColor   = status === 'critical' ? '#D64545' : '#C8892A';

  return (
    <div
      className="rounded-xl p-4 flex gap-3"
      style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
    >
      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: textColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: textColor }}>
            {isDoc ? 'Clinical Flag' : 'CHW Action Note'}
          </p>
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: textColor, opacity: 0.6 }} />
            <span className="text-xs" style={{ color: textColor, opacity: 0.6 }}>AI</span>
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="ml-1 p-0.5 rounded hover:opacity-80 transition-opacity"
              title="Regenerate note"
              aria-label="Regenerate note"
            >
              <RefreshCw
                size={11}
                style={{ color: textColor, opacity: 0.6 }}
                className={loading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-1.5 items-center">
            <span className="bl-track w-8" style={{ height: '2px', backgroundColor: `${textColor}30` }}>
              <span className="bl-dot bl-dot--skeleton" style={{ left: '50%', width: '6px', height: '6px' }} />
            </span>
            <span className="text-sm" style={{ color: textColor, opacity: 0.6 }}>Generating note…</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: '#12211F' }}>
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function SystemSection({ system, events, role }) {
  const byCode = events.reduce((acc, ev) => {
    if (!acc[ev.code]) acc[ev.code] = [];
    acc[ev.code].push(ev);
    return acc;
  }, {});

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base" aria-hidden="true">{SYSTEM_ICONS[system] ?? '📋'}</span>
        <h3
          className="font-serif text-sm font-semibold capitalize"
          style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', color: '#12211F' }}
        >
          {system.replace('-', ' ')}
        </h3>
        <div className="flex-1 h-px" style={{ backgroundColor: '#DCE6E3' }} aria-hidden="true" />
      </div>

      <div className="space-y-3">
        {Object.entries(byCode).map(([code, codeEvents]) => {
          const latest = codeEvents[codeEvents.length - 1];
          const hasSparkline = codeEvents.length >= 2;

          return (
            <div
              key={code}
              className="rounded-xl border p-4"
              style={{ borderColor: '#DCE6E3', backgroundColor: '#F7FAF9' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium mb-0.5" style={{ color: '#12211F' }}>
                    {latest.label}
                  </p>
                  {role === 'Doctor View' && (
                    <p className="text-xs font-mono" style={{ color: '#5C6B68', fontVariantNumeric: 'tabular-nums' }}>
                      LOINC {code}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="font-mono text-lg font-semibold"
                    style={{ color: '#12211F', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {latest.value}
                    <span className="text-xs font-normal ml-1" style={{ color: '#5C6B68' }}>
                      {latest.unit}
                    </span>
                  </span>
                  <BaselineIndicator
                    value={latest.value}
                    baseline={latest.baselineValue}
                    rangeMin={latest.rangeMin}
                    rangeMax={latest.rangeMax}
                    status={latest.status ?? 'stable'}
                    size="md"
                  />
                </div>
              </div>

              {/* Reference range — always shown */}
              {latest.rangeMin != null && latest.rangeMax != null && (
                <p className="text-xs mt-1.5" style={{ color: '#5C6B68' }}>
                  Normal range:{' '}
                  <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {latest.rangeMin}–{latest.rangeMax} {latest.unit}
                  </span>
                  {latest.baselineValue && (
                    <>
                      {' '}· Personal baseline:{' '}
                      <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {latest.baselineValue} {latest.unit}
                      </span>
                    </>
                  )}
                </p>
              )}

              {/* Sparkline */}
              {hasSparkline && (
                <div className="mt-3 h-16">
                  <Sparkline
                    data={codeEvents}
                    status={latest.status}
                    rangeMin={latest.rangeMin}
                    rangeMax={latest.rangeMax}
                    baselineValue={latest.baselineValue}
                  />
                </div>
              )}

              {/* Timestamp */}
              <p
                className="font-mono text-xs mt-2"
                style={{ color: '#5C6B68', fontVariantNumeric: 'tabular-nums' }}
              >
                Latest: {formatTimestamp(latest.occurredAt)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Sparkline({ data, status, rangeMin, rangeMax, baselineValue }) {
  const chartData = data.map((ev) => ({
    t: new Date(ev.occurredAt).getTime(),
    v: Number(ev.value),
  }));

  const color =
    status === 'critical' ? '#D64545'
    : status === 'watch'  ? '#E0A458'
    : '#4F9D8C';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        {rangeMin != null && (
          <ReferenceLine y={Number(rangeMin)} stroke="#DCE6E3" strokeDasharray="3 3" />
        )}
        {rangeMax != null && (
          <ReferenceLine y={Number(rangeMax)} stroke="#DCE6E3" strokeDasharray="3 3" />
        )}
        {baselineValue != null && (
          <ReferenceLine
            y={Number(baselineValue)}
            stroke="#5C6B68"
            strokeDasharray="4 2"
            strokeOpacity={0.5}
          />
        )}
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div
                className="text-xs px-2 py-1 rounded shadow"
                style={{ background: '#12211F', color: '#fff', fontFamily: '"IBM Plex Mono", monospace' }}
              >
                {payload[0].value}
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={{ r: 2.5, fill: color }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTopFlaggedEvent(patient) {
  const order = { critical: 0, watch: 1, stable: 2 };
  return [...(patient.events ?? [])]
    .filter((e) => e.status === 'critical' || e.status === 'watch')
    .sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2))[0] ?? null;
}
