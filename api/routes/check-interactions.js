import { getDTP } from '../dtp-client.js';

/**
 * POST /api/check-interactions
 * Body: { rxNormIds: number[] }
 *
 * Calls dtp.holon.interactions.checkList() — returns InteractionListResponse:
 *   { totalDrugs: number, totalInteractions: number, pairs: [{ drugA, drugB, interactions[] }] }
 *
 * Returns a flattened interactions array and the total count.
 */
export async function checkInteractionsRoute(req, res) {
  try {
    const { rxNormIds } = req.body;

    if (!Array.isArray(rxNormIds) || rxNormIds.length < 2) {
      return res.json({ totalInteractions: 0, interactions: [] });
    }

    const dtp = getDTP();
    const result = await dtp.holon.interactions.checkList(
      rxNormIds.map(Number)
    );

    // Flatten pairs into a single interactions array for the frontend
    const interactions = (result.pairs ?? []).flatMap((pair) =>
      (pair.interactions ?? []).map((ix) => ({
        drugAId:       pair.drugA,
        drugBId:       pair.drugB,
        drugAName:     ix.drugAName,
        drugBName:     ix.drugBName,
        severity:      ix.severity,
        clinicalEffect: ix.clinicalEffect,
        management:    ix.management,
        evidenceGrade: ix.evidenceGrade,
      }))
    );

    return res.json({
      totalInteractions: result.totalInteractions ?? 0,
      interactions,
    });
  } catch (err) {
    console.error('[check-interactions]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
