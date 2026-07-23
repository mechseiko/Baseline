import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.resolve(__dirname, '../../demo-state.json');

/**
 * POST /api/seed-demo
 * Body: { count?: number }
 *
 * Seeds N demo twins using the documented POST /twins/seed-demo endpoint.
 *
 * Confirmed API response (201):
 *   { data: { twinId: string, twinCreated: boolean, eventsCreated: number } }
 *
 * IMPORTANT: The SDK has NO dtp.grants client. Grant tokens are managed
 * separately on the platform (patient-initiated consent). For demo/sandbox
 * purposes, we create grants via the platform's REST API directly using
 * the test API key. The platform exposes POST /grants for this purpose
 * when called with a test-environment key.
 *
 * The twinId → grantToken mapping is stored in demo-state.json (gitignored).
 */
export async function seedDemoRoute(req, res) {
  try {
    const count = Number(req.body?.count ?? 5);
    const twins = [];
    const BASE = process.env.DTP_BASE_URL ?? 'https://api.ontomorph.com';
    const apiKey = process.env.ONTOMORPH_API_KEY_TEST;

    for (let i = 0; i < count; i++) {
      // Step 1 — seed the demo twin
      const seedRes = await fetch(`${BASE}/twins/seed-demo`, {
        method: 'POST',
        headers: {
          'X-DTP-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!seedRes.ok) {
        const body = await seedRes.text();
        throw new Error(`seed-demo failed (${seedRes.status}): ${body}`);
      }

      const { data } = await seedRes.json();
      // data: { twinId, twinCreated, eventsCreated }
      console.log(`[seed-demo] Twin ${i + 1}/${count}: ${data.twinId} (${data.eventsCreated} events seeded)`);

      // Step 2 — create a grant for this twin
      // POST /grants with the test API key. Scope covers all systems needed for the demo.
      const grantRes = await fetch(`${BASE}/grants`, {
        method: 'POST',
        headers: {
          'X-DTP-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          twinId:    data.twinId,
          scope:     ['cardiovascular:read', 'metabolic:read', 'musculoskeletal:read', 'events:read', 'flags:write'],
          expiresAt: '2026-12-31T23:59:59Z',
        }),
      });

      let grantToken = null;
      if (grantRes.ok) {
        const grantData = await grantRes.json();
        // Platform returns the grant token in data.token or data.grantToken
        grantToken = grantData?.data?.token ?? grantData?.data?.grantToken ?? grantData?.token ?? null;
        console.log(`[seed-demo] Grant created for ${data.twinId}: ${grantToken ? '✓' : '✗ no token in response'}`);
      } else {
        const body = await grantRes.text();
        console.warn(`[seed-demo] Grant creation failed (${grantRes.status}): ${body}`);
        console.warn('[seed-demo] Storing twinId without grant token — use dashboard to create grant manually');
      }

      twins.push({
        id:            data.twinId,
        grantToken,
        eventsCreated: data.eventsCreated,
        seededAt:      new Date().toISOString(),
      });
    }

    // Persist to demo-state.json (gitignored)
    fs.writeFileSync(STATE_PATH, JSON.stringify({ twins, seededAt: new Date().toISOString() }, null, 2));
    console.log(`[seed-demo] State saved to demo-state.json`);

    return res.json({ seeded: twins.length, twins });
  } catch (err) {
    console.error('[seed-demo]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * getDemoGrantToken — reads demo-state.json to find a grant token by twinId.
 * Called by twin.js and flag.js at runtime.
 */
export function getDemoGrantToken(twinId) {
  if (!fs.existsSync(STATE_PATH)) {
    throw new Error('demo-state.json not found — run POST /api/seed-demo first');
  }
  const { twins } = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const twin = twins.find((t) => t.id === twinId);
  if (!twin) throw new Error(`No entry found for twin ${twinId} in demo-state.json`);
  if (!twin.grantToken) throw new Error(`Twin ${twinId} has no grant token — create one on the Ontomorph dashboard`);
  return twin.grantToken;
}

/**
 * getAllDemoTwins — returns the full twin list from demo-state.json.
 */
export function getAllDemoTwins() {
  if (!fs.existsSync(STATE_PATH)) return [];
  const { twins } = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  return twins ?? [];
}
