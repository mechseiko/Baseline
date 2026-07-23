import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * useGenerateNote — fetches a plain-language CHW action note from /api/generate-note.
 * Falls back gracefully if the API is unavailable.
 *
 * Usage:
 *   const { note, loading, generate } = useGenerateNote();
 *   await generate({ patientName, age, sex, system, ... });
 */
export function useGenerateNote() {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/generate-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`generate-note ${res.status}`);
      const data = await res.json();
      setNote(data.note ?? null);
      return data.note;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setNote(null); setError(null); }, []);

  return { note, loading, error, generate, reset };
}

/**
 * generateNoteForPatient — convenience wrapper that builds the full
 * payload for the most critical event on a patient and calls the API.
 *
 * Returns the note string or null.
 */
export async function generateNoteForPatient(patient) {
  // Find the most critical event to base the note on
  const order = { critical: 0, watch: 1, stable: 2 };
  const topEvent = [...(patient.events ?? [])]
    .filter((e) => e.status !== 'stable')
    .sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2))[0];

  if (!topEvent) return null;

  try {
    const res = await fetch(`${API_BASE}/api/generate-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.note ?? null;
  } catch {
    return null;
  }
}
