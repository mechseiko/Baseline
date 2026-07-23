import { getAllDemoTwins } from './seed-demo.js';
import patientsFixture from '../../src/data/patients.json' assert { type: 'json' };

/**
 * GET /api/patients
 *
 * Returns all patients for the queue view.
 * In live mode: reads from demo-state.json (seeded twins).
 * If no demo state exists yet, falls back to fixture data with a warning.
 */
export async function getPatientsRoute(req, res) {
  try {
    const twins = getAllDemoTwins();

    if (twins.length === 0) {
      console.warn('[patients] No demo twins found — returning fixture data. Run POST /api/seed-demo first.');
      return res.json(patientsFixture);
    }

    // Map demo-state twins to the same shape the frontend expects.
    // Event data comes from the twin API; here we just return the patient list
    // with basic metadata from demo-state. The detail panel fetches full events via GET /api/twin/:id
    const patients = twins.map((twin, i) => ({
      id:          twin.id,
      name:        `Demo Patient ${i + 1}`,
      age:         30 + i * 8,   // varied ages for HOLON reference range calls
      sex:         i % 2 === 0 ? 'female' : 'male',
      grantToken:  twin.grantToken,
      systems:     ['cardiovascular', 'metabolic'],
      medications: [],
      events:      [],            // events fetched lazily via GET /api/twin/:id
      flagNote:    null,
    }));

    return res.json(patients);
  } catch (err) {
    console.error('[patients]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
