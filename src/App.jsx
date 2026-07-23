import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import PatientQueue from './components/PatientQueue';
import PatientDetail from './components/PatientDetail';
import { getAllPatients } from './lib/getTwinData';
import './index.css';

/**
 * App — root layout.
 * Manages: role state, patient data loading, selected patient (slide-over).
 * Role is threaded down to NavBar, PatientDetail so CHW vs Doctor View
 * affects the label and level of clinical detail shown.
 */
export default function App() {
  const [role, setRole] = useState('CHW View');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAllPatients()
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Keep selected patient in sync when patients state updates
  // (e.g. after a demo trigger re-sorts the queue)
  useEffect(() => {
    if (!selectedPatient) return;
    const updated = patients.find((p) => p.id === selectedPatient.id);
    if (updated) setSelectedPatient(updated);
  }, [patients]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F7FAF9', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}
    >
      <NavBar role={role} onRoleChange={setRole} />

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3" style={{ color: '#5C6B68' }}>
            <span className="bl-track w-14" style={{ backgroundColor: '#DCE6E3' }}>
              <span className="bl-dot bl-dot--skeleton" style={{ left: '50%' }} />
            </span>
            <span className="text-sm">Loading patient queue…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-6xl mx-auto px-5 py-6">
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              backgroundColor: 'rgba(214,69,69,0.07)',
              color: '#D64545',
              border: '1px solid rgba(214,69,69,0.2)',
            }}
          >
            Failed to load patients: {error}
          </div>
        </div>
      )}

      {!loading && !error && (
        <PatientQueue
          patients={patients}
          role={role}
          onSelectPatient={setSelectedPatient}
          onPatientsChange={setPatients}
        />
      )}

      {/* Slide-over detail panel — passes role so Doctor View shows LOINC codes */}
      {selectedPatient && (
        <PatientDetail
          patient={selectedPatient}
          role={role}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}
