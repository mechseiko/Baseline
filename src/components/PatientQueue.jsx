import { useEffect, useRef, useState } from 'react';
import PatientCard from './PatientCard';
import DemoControls from './DemoControls';
import { sortPatients } from '../lib/utils';

/**
 * PatientQueue — the main live queue screen.
 *
 * Props:
 *   patients         — initial patient list from getAllPatients()
 *   role             — 'CHW View' | 'Doctor View' (for future per-role UI tweaks)
 *   onSelectPatient  — callback when a card is clicked
 *   onPatientsChange — callback with updated patient array (after demo triggers)
 */
export default function PatientQueue({
  patients: initialPatients,
  role,
  onSelectPatient,
  onPatientsChange,
}) {
  const [patients, setPatients] = useState(() => sortPatients(initialPatients));
  const [newlyChanged, setNewlyChanged] = useState(new Set());
  const [livePulse, setLivePulse] = useState(false);

  // Sync when parent pushes new data
  useEffect(() => {
    const sorted = sortPatients(initialPatients);
    setPatients(sorted);
  }, [initialPatients]);

  function handleDemoTrigger({ patientId, event, flagMessage }) {
    setPatients((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          events: [...p.events, event],
          flagNote: flagMessage ?? p.flagNote,
        };
      });
      const sorted = sortPatients(updated);
      // Notify parent so selectedPatient stays in sync
      onPatientsChange?.(sorted);
      return sorted;
    });

    // Animate the changed card
    setNewlyChanged((prev) => new Set([...prev, patientId]));
    setTimeout(() => {
      setNewlyChanged((prev) => {
        const next = new Set(prev);
        next.delete(patientId);
        return next;
      });
    }, 1400);

    // Flash the Live dot
    setLivePulse(true);
    setTimeout(() => setLivePulse(false), 800);
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-6">
      {/* ── Queue header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1
            className="font-serif text-2xl font-semibold"
            style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', color: '#12211F' }}
          >
            Patient Queue
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5C6B68' }}>
            {patients.length} patients · sorted by severity
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`live-dot ${livePulse ? 'live-dot--event' : ''}`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium" style={{ color: '#5C6B68' }}>
            Live
          </span>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-2.5 mb-6">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            isNew={newlyChanged.has(patient.id)}
            onClick={() => onSelectPatient(patient)}
          />
        ))}
      </div>

      {/* ── Demo controls ── */}
      <DemoControls onTrigger={handleDemoTrigger} />
    </main>
  );
}
