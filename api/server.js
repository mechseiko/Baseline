import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { checkValueRoute } from './routes/check-value.js';
import { checkInteractionsRoute } from './routes/check-interactions.js';
import { seedDemoRoute } from './routes/seed-demo.js';
import { getTwinRoute } from './routes/twin.js';
import { flagRoute } from './routes/flag.js';
import { generateNoteRoute } from './routes/generate-note.js';
import { getPatientsRoute } from './routes/patients.js';

const app = express();
const PORT = process.env.API_PORT ?? 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Patient list (Phase 4) ────────────────────────────────────────────
app.get('/api/patients', getPatientsRoute);

// ── HOLON routes (Phase 3) ────────────────────────────────────────────
app.post('/api/check-value',        checkValueRoute);
app.post('/api/check-interactions', checkInteractionsRoute);

// ── Twin routes (Phase 4) ─────────────────────────────────────────────
app.post('/api/seed-demo',          seedDemoRoute);
app.get('/api/twin/:id',            getTwinRoute);
app.post('/api/flag',               flagRoute);

// ── AI note route (Phase 5) ───────────────────────────────────────────
app.post('/api/generate-note',      generateNoteRoute);

// ── 404 catch-all ────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`\n[Baseline API] http://localhost:${PORT}`);
  console.log(`  ONTOMORPH_API_KEY_TEST : ${process.env.ONTOMORPH_API_KEY_TEST ? '✓ set' : '✗ MISSING — set in .env'}`);
  console.log(`  ONTOMORPH_HOLON_KEY   : ${process.env.ONTOMORPH_HOLON_KEY    ? '✓ set' : '✗ MISSING — set in .env'}`);
  console.log(`  AI_API_KEY            : ${process.env.AI_API_KEY             ? '✓ set' : '— not set (template notes will be used)'}\n`);
});
