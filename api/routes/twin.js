import { getDTP } from '../dtp-client.js';
import { getDemoGrantToken } from './seed-demo.js';

const DEMO_SYSTEMS = ['cardiovascular', 'metabolic', 'musculoskeletal'];

/**
 * GET /api/twin/:id
 *
 * Connects to a demo twin using its grant token and reads events
 * from all configured body systems.
 *
 * SDK facts (confirmed from source):
 *   - dtp.twins.connect(grantToken) is SYNCHRONOUS — no await
 *   - twin.systems.get(systemName) is ASYNC — returns Promise<SystemView>
 *   - SystemView: { system: string, twinId: string, events: HealthEvent[] }
 *   - HealthEvent.data contains all clinical fields (code, system, value, unit, etc.)
 */
export async function getTwinRoute(req, res) {
  try {
    const { id } = req.params;
    const grantToken = getDemoGrantToken(id);

    const dtp = getDTP();
    // connect() is synchronous — no await
    const twin = dtp.twins.connect(grantToken);

    // Fetch each system view in parallel; swallow system-level 404s gracefully
    const systemResults = await Promise.allSettled(
      DEMO_SYSTEMS.map((s) => twin.systems.get(s))
    );

    // Merge all events, tagging each with the system it came from
    const events = systemResults.flatMap((r, i) => {
      if (r.status !== 'fulfilled') {
        console.warn(`[twin] ${id} / ${DEMO_SYSTEMS[i]}: ${r.reason?.message ?? 'failed'}`);
        return [];
      }
      return (r.value?.events ?? []).map((ev) => ({
        id:          ev.id,
        code:        ev.data?.code ?? ev.data?.flaggedCode ?? null,
        system:      ev.data?.system ?? DEMO_SYSTEMS[i],
        label:       ev.title ?? ev.data?.code ?? 'Unknown',
        value:       ev.data?.value ?? ev.data?.flaggedValue ?? null,
        unit:        ev.data?.unit ?? null,
        occurredAt:  ev.occurredAt,
        eventType:   ev.eventType,
        description: ev.description ?? null,
        raw:         ev,
      }));
    });

    return res.json({ id, events });
  } catch (err) {
    console.error('[twin]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
