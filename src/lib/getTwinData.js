/**
 * getTwinData — data-fetching abstraction.
 *
 * A single config flag (VITE_USE_LIVE_API) controls whether data
 * comes from the real Ontomorph API routes or from the local fixture.
 * Flip to 'true' in .env when Phase 4 twin connect is ready.
 */

const USE_LIVE_API = import.meta.env.VITE_USE_LIVE_API === 'true';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Returns all patients (queue view).
 * Live: GET /api/patients (Phase 4)
 * Fixture: patients.json
 */
export async function getAllPatients() {
  if (USE_LIVE_API) {
    const res = await fetch(`${API_BASE}/api/patients`);
    if (!res.ok) throw new Error(`GET /api/patients failed: ${res.status}`);
    return res.json();
  }
  const { default: patients } = await import('../data/patients.json');
  return patients;
}

/**
 * Returns a single patient with all events.
 * Live: GET /api/twin/:id (Phase 4)
 * Fixture: patients.json filtered by id
 */
export async function getTwinData(patientId) {
  if (USE_LIVE_API) {
    const res = await fetch(`${API_BASE}/api/twin/${patientId}`);
    if (!res.ok) throw new Error(`GET /api/twin/${patientId} failed: ${res.status}`);
    return res.json();
  }
  const { default: patients } = await import('../data/patients.json');
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) throw new Error(`Patient ${patientId} not found in fixture`);
  return patient;
}

/**
 * Calls /api/check-value to resolve the clinical status of a single event.
 * Falls back to the fixture event's status field if API is unavailable.
 *
 * @param {object} event — event object with code, value, unit
 * @param {number} age
 * @param {string} sex
 * @returns {Promise<{ status, range, interpretation }>}
 */
export async function checkEventStatus(event, age, sex) {
  try {
    const res = await fetch(`${API_BASE}/api/check-value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loincCode: event.code, value: event.value, age, sex }),
    });
    if (!res.ok) throw new Error(`check-value failed: ${res.status}`);
    return res.json();
  } catch {
    // Graceful fallback to fixture status
    return { status: event.status ?? 'stable', range: null, interpretation: null };
  }
}

/**
 * Calls /api/check-interactions for a patient's medication list.
 * @param {number[]} rxNormIds
 * @returns {Promise<{ totalInteractions, interactions[] }>}
 */
export async function checkInteractions(rxNormIds) {
  if (!rxNormIds || rxNormIds.length < 2) return { totalInteractions: 0, interactions: [] };
  try {
    const res = await fetch(`${API_BASE}/api/check-interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rxNormIds }),
    });
    if (!res.ok) throw new Error(`check-interactions failed: ${res.status}`);
    return res.json();
  } catch {
    return { totalInteractions: 0, interactions: [] };
  }
}

/**
 * Writes a flag to a twin (Phase 4+).
 * No-op in fixture mode.
 */
export async function writeFlag(patientId, system, message) {
  if (!USE_LIVE_API) return { ok: true, simulated: true };
  const res = await fetch(`${API_BASE}/api/flag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, system, message }),
  });
  if (!res.ok) throw new Error(`flag write failed: ${res.status}`);
  return res.json();
}
