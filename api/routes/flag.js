import { getDTP } from '../dtp-client.js';
import { getDemoGrantToken } from './seed-demo.js';

/**
 * POST /api/flag
 * Body: { patientId, system, message, code?, value? }
 *
 * Writes a flag onto the patient's twin.
 *
 * SDK facts (confirmed from source):
 *   - dtp.twins.connect(grantToken) is SYNCHRONOUS — no await
 *   - twin.flag(system, event: FlagInput) is ASYNC — returns Promise<HealthEvent>
 *   - FlagInput: { eventType?, occurredAt?, title?, description?, code?, value?, data?, id? }
 *   - The second argument is NOT a plain string — it's a FlagInput object
 *   - Grant MUST include the target system in its scope, or platform returns 403
 */
export async function flagRoute(req, res) {
  try {
    const { patientId, system, message, code, value } = req.body;

    if (!patientId || !system || !message) {
      return res.status(400).json({ error: 'patientId, system, and message are required' });
    }

    const grantToken = getDemoGrantToken(patientId);
    const dtp = getDTP();

    // connect() is synchronous
    const twin = dtp.twins.connect(grantToken);

    // flag() takes FlagInput, not a plain string
    const flagInput = {
      eventType:   'flag',
      title:       `Flag: ${system}`,
      description: message,
      occurredAt:  new Date().toISOString(),
      ...(code  ? { code }  : {}),
      ...(value ? { value } : {}),
    };

    const created = await twin.flag(system, flagInput);
    console.log(`[flag] ${patientId} / ${system}: "${message}" → event ${created.id}`);

    return res.json({ ok: true, eventId: created.id });
  } catch (err) {
    console.error('[flag]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
