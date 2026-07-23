import { getDTP } from '../dtp-client.js';

/**
 * POST /api/check-value
 * Body: { loincCode, value, age, sex }
 *
 * Calls dtp.holon.referenceRanges.getByLoincCode() — returns ReferenceRangesResponse:
 *   { total: number, ranges: ReferenceRangeEntry[] }
 *
 * Each ReferenceRangeEntry has: lowValue (string|null), highValue (string|null), unit, interpretation
 *
 * Picks the most specific range matching age and sex, then classifies:
 *   critical → >15% outside range bounds
 *   watch    → outside range bounds
 *   stable   → within range
 */
export async function checkValueRoute(req, res) {
  try {
    const { loincCode, value, age, sex } = req.body;

    if (!loincCode || value == null || age == null || !sex) {
      return res.status(400).json({ error: 'loincCode, value, age, sex are required' });
    }

    const dtp = getDTP();
    const result = await dtp.holon.referenceRanges.getByLoincCode(
      String(loincCode),
      Number(age),
      String(sex)
    );

    // Pick best matching range (most specific for this age/sex)
    const range = pickBestRange(result.ranges, Number(age), String(sex));

    if (!range) {
      // No reference range found for this code — cannot classify, return stable
      return res.json({
        status: 'stable',
        range: null,
        interpretation: null,
        note: 'No reference range found for this LOINC code',
      });
    }

    const numVal = Number(value);
    const low  = range.lowValue  != null ? Number(range.lowValue)  : null;
    const high = range.highValue != null ? Number(range.highValue) : null;

    let status = 'stable';
    if (low != null && high != null) {
      if (numVal > high * 1.15 || numVal < low * 0.85) {
        status = 'critical';
      } else if (numVal > high || numVal < low) {
        status = 'watch';
      }
    } else if (high != null && numVal > high * 1.15) {
      status = 'critical';
    } else if (high != null && numVal > high) {
      status = 'watch';
    }

    return res.json({
      status,
      range: {
        low:  low,
        high: high,
        unit: range.unit ?? null,
      },
      interpretation: range.interpretation ?? null,
    });
  } catch (err) {
    console.error('[check-value]', err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Pick the most specific range entry for this patient's age and sex.
 * Prefers ranges that match both age and sex; falls back to sex-only,
 * age-only, then general.
 */
function pickBestRange(ranges, age, sex) {
  if (!ranges || ranges.length === 0) return null;

  const normalizedSex = sex.toLowerCase().startsWith('f') ? 'female' : 'male';

  // Score each range by specificity
  const scored = ranges.map((r) => {
    const rSex = r.sex?.toLowerCase() ?? null;
    const ageMin = r.ageMinYears != null ? Number(r.ageMinYears) : null;
    const ageMax = r.ageMaxYears != null ? Number(r.ageMaxYears) : null;

    const sexMatch  = rSex === null || rSex === normalizedSex;
    const ageInRange = ageMin === null && ageMax === null
      ? true
      : (ageMin == null || age >= ageMin) && (ageMax == null || age <= ageMax);

    if (!sexMatch || !ageInRange) return { r, score: -1 };

    let score = 0;
    if (rSex === normalizedSex) score += 2;
    if (ageMin != null || ageMax != null) score += 1;
    return { r, score };
  });

  const valid = scored.filter((s) => s.score >= 0).sort((a, b) => b.score - a.score);
  return valid[0]?.r ?? null;
}
