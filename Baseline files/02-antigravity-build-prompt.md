
---

You are building **Baseline**, a live drift-alert dashboard for community health workers (CHWs) in Southwest Nigeria, built on the Ontomorph digital-twin platform and its HOLON clinical knowledge API. This is a hackathon project with a hard deadline in under 24 hours, built by one developer. Prioritize a small number of features that work perfectly over a large number that half-work. Build incrementally in the phases below, confirm each phase runs with no console errors before moving to the next, and never break a previously-working phase to add a new one — if a new feature risks that, isolate it behind a flag instead.

## What Baseline does

Most primary care in Southwest Nigeria is delivered by community health workers, not doctors. Baseline gives a CHW a live, prioritized queue of their patients' digital twins. Each patient has a personal baseline built from their own prior readings. As new health events arrive (vitals, labs), Baseline checks each one against that patient's baseline **and** against HOLON's age/sex-stratified reference ranges, flags anything drifting, and writes a plain-language note a non-physician can act on — not a raw lab number, but a clear next step.

## Tech stack — do not deviate

- **React 18 + Vite**, plain **JavaScript** (no TypeScript — speed and fewer type errors under time pressure).
- **Tailwind CSS** for styling, configured with the exact design tokens below in `tailwind.config.js` — do not use default Tailwind colors (no default `blue-500`, `indigo-600`, etc. anywhere in the app).
- **React Router** only if genuinely needed for 2 views (dashboard + patient detail). If both can live on one screen with a slide-over panel instead, prefer that — fewer routes means fewer things that can break in a live demo.
- State: plain React state/context. No Redux, no external state library — unnecessary overhead for this scope.
- Icons: `lucide-react`.
- Charts/sparklines: `recharts`, used sparingly (see Signature element below).
- No backend framework needed if using a serverless function via Vite's dev proxy or a tiny Express server — whichever Antigravity can scaffold fastest and most reliably. The one hard rule: `DTP_KEY` and `HOLON_KEY` live in a `.env` file and are only ever read server-side, never imported into a React component.

## Design system — apply exactly, everywhere, no exceptions

This palette is deliberately **not** generic healthcare blue, and not the default "cream background + terracotta accent" look — it's built around the actual product concept: a *baseline* is a reference line, and *drift* is a functional, color-coded deviation from it, not decoration.

### Color tokens (add these to `tailwind.config.js` as named colors, e.g. `baseline.teal`)

| Token | Hex | Use |
|---|---|---|
| `teal-900` (primary, dominant ~65%) | `#0E4B44` | Headers, primary buttons, nav, dark-section backgrounds |
| `teal-950` | `#082F2B` | Darkest backgrounds (title/hero-style moments only) |
| `clay-600` (secondary) | `#B8703F` | Secondary buttons, active-state accents, CHW-role badge |
| `alert-critical` | `#D64545` | Critical drift only — never decorative |
| `alert-watch` | `#E0A458` | Moderate/"watch" drift only — never decorative |
| `stable-green` | `#4F9D8C` | In-range/stable state only |
| `bg-canvas` | `#F7FAF9` | Main app background (cool off-white, NOT cream) |
| `surface` | `#FFFFFF` | Cards, panels |
| `ink-900` (primary text) | `#12211F` | Body text, headers |
| `ink-500` (muted text) | `#5C6B68` | Captions, secondary labels |
| `border-subtle` | `#DCE6E3` | Card borders, dividers |

**Hard rule:** the three functional colors (`alert-critical`, `alert-watch`, `stable-green`) are reserved *only* for actual patient status. Never use them for generic UI decoration (buttons, links, etc.) — if a color that means "this patient is critical" shows up anywhere else in the UI, a judge who's a working clinician will subconsciously distrust the whole dashboard.

### Typography

- **Display/headers:** `IBM Plex Serif` (has real character, distinct from generic sans headers, reads as "clinical but human" rather than corporate-generic).
- **UI/body:** `IBM Plex Sans`.
- **Data/numbers (vitals, lab values, timestamps):** `IBM Plex Mono`, with `font-variant-numeric: tabular-nums` — numbers in a live dashboard should sit in fixed-width columns so they don't jitter as they update. This is a deliberate, content-informed choice: it's the same typeface family throughout (Plex), just three weights of it doing three different jobs, which reads as considered rather than default.
- Load all three from Google Fonts or self-hosted, whichever is faster to set up reliably.

### Signature visual element — use this everywhere, it's the whole identity of the product

A **baseline indicator**: a short horizontal line with a small dot on it, where the dot's position relative to center encodes how far a value has drifted from that patient's personal baseline (center = at baseline, right in `alert-critical` = high drift, left/other side in `alert-watch` = drift the other direction, dot on center in `stable-green` = stable). Use this exact motif:
- Next to every vital/lab value on a patient card (small, inline).
- As the loading/skeleton state (a pulsing dot on a line).
- As the literal app icon/logomark on the nav bar (a stylized baseline-and-dot).
Do **not** use a generic progress bar, a percentage ring, or a stoplight-dot-in-isolation — the line matters, because it's the actual product metaphor (deviation from a personal reference line, not an absolute score).

**Explicitly avoid:** accent stripes or color bars down the side of cards (this reads as AI-generated filler), gradient hero backgrounds, any generic dashboard template look with a sidebar of unrelated icons, and centered body text/paragraphs (left-align everything except short titles).

## Structure — no marketing landing page, go straight to the point

Do **not** build a scrolling marketing landing page. This is a working tool for a demo audience with 15 minutes, not a product launch site. Structure:

1. **A single top nav bar**, present on every screen: Baseline logomark (the baseline-and-dot motif) + product name on the left, a **role toggle** (CHW view / Doctor view) on the right — this doubles as your "who is this for" statement without needing a separate landing page.
2. **Main screen = the live queue.** A list of patient cards, each showing: name/ID, age/sex (needed for HOLON reference range calls), a status badge (critical/watch/stable, using the functional colors above), the 1–2 most relevant baseline-indicator readings, and a timestamp of the most recent event.
3. **Patient detail = a slide-over panel, not a new route**, opened by clicking a card. Shows: full event history for that patient (grouped by body system), each with its baseline indicator, the plain-language flag note if one exists, and — only if you have time — a small `recharts` sparkline of that value over time.
4. **A visible "Live" indicator** (small pulsing dot + "Live" label) near the queue header, and a **Demo Controls** panel (can be a simple collapsible drawer, clearly separate from the "real" UI) with buttons like "Trigger new event for Patient X" — this is what you'll actually click during your recorded demo to make the live-streaming feel real without needing genuine device data flowing in.

## Build phases — do these in order, verify each before moving on

**Phase 1 — Scaffold + design tokens**
Vite + React + Tailwind scaffold. Wire up the full color/type token system above. Build the nav bar and an empty queue screen with the role toggle working (even with zero data, colors and fonts should already look exactly right). Confirm `npm run dev` runs clean with zero console errors before continuing.

**Phase 2 — Mock data layer + working dashboard**
Create a `data/patients.json` fixture: 4–5 demo patients, varied ages and sexes (needed later for HOLON reference range calls), each with a small history of events (`code`, `system`, `value`, `occurredAt`) across at least two body systems per patient. Build the queue and detail panel entirely against this fixture first — no live API calls yet. Get the full UI, including the baseline-indicator motif and the demo-trigger buttons, working end-to-end against fake data. This phase should produce a fully clickable, good-looking app even if every number in it is fake — that's your insurance policy if later phases run out of time.

**Phase 3 — Real HOLON integration**
Add a small server-side route (e.g. `/api/check-value`) that takes a LOINC code, age, and sex, and calls `dtp.holon.referenceRanges.getByLoincCode(loincCode, age, sex)` for real, using the real `HOLON_KEY`. Wire your fixture events to actually call this route and use the real response to decide critical/watch/stable, replacing any hardcoded thresholds. Also wire up `dtp.holon.interactions.checkList()` for any patient with more than one medication in their fixture data, so you can show a real drug-interaction flag alongside the vital-drift flags. This is the phase that proves genuine platform depth to judges — don't skip it even if Phase 4 has to shrink.

**Phase 4 — Twin connect + flag writes, real or fallback**
Attempt real `dtp.twins.connect(grantToken)` / `twin.flag()` calls per the guide's Plan A/Plan B split. If sandbox twin creation is available on the dashboard, wire it for real. If not, keep the fixture-based flow from Phase 2 but be honest about it in your documentation and demo narration rather than pretending it's fully live — judges respect an accurate account of what's real more than a vague claim.

**Phase 5 — AI plain-language layer**
For each flag, generate a short, plain-language note ("BP has been climbing for 3 readings — recommend a same-week follow-up," not "SBP 148 mmHg, +12% from baseline"). Keep prompts tightly scoped and grounded in the actual flag data — do not let this layer invent clinical claims beyond what the HOLON check and event data support.

**Phase 6 — Polish + demo mode**
Multi-patient priority sorting (critical patients float to top), the "Live" pulsing indicator, smoothing out the Demo Controls flow so you can trigger 2–3 events on cue during recording, and a final pass checking every screen against the color/type rules above. Do not add new features in this phase — only polish what already works.

## Reference code from the real Ontomorph docs — use these exact method signatures, do not invent alternatives

```javascript
import { DTP } from "@ontomorph/dtp-sdk";

const dtp = new DTP({
  apiKey: process.env.DTP_KEY,
  holonApiUrl: "https://holon-api.ontomorph.com",
  holonApiKey: process.env.HOLON_KEY,
});

// connect a patient's twin via the grant they issued
const twin = await dtp.twins.connect(grantToken);
const cardio = await twin.systems.get("cardiovascular");

// stream new events in real time
twin.events.stream({ system: "cardiovascular" }, (e) => {
  if (e.data.code === "LDL" && Number(e.data.value) > 130) {
    twin.flag("cardiovascular", `LDL ${e.data.value} climbing`);
  }
});

// grants are scoped, time-bounded, revocable
const grant = await dtp.grants.create({
  scope: ["cardiovascular:read", "events:read"],
  expiresAt: "2026-12-31",
});

// HOLON: reference ranges, stratified by age and sex
const ranges = await dtp.holon.referenceRanges.getByLoincCode("2093-3", 45, "male");

// HOLON: drug interactions across a full medication list
const list = await dtp.holon.interactions.checkList([1191, 11289, 42463]);
console.log(list.totalInteractions);

// HOLON: concept search and mapping
const hits = await dtp.holon.concepts.search("atorvastatin", { domain: "Drug" });
const mapped = await dtp.holon.mappings.translate("38341003", "SNOMED", "ICD10");
```

Do not use the plugin publish API (`dtp.plugins.publish`) anywhere — it is documented as not live yet.

## Final instruction

After each phase, run the app, check the browser console is clean, and take a screenshot of the current state before starting the next phase. If a phase is going to overrun its time budget by more than 50%, stop, ship what works, and move to the next phase rather than perfecting it — an app that reaches Phase 6 in a slightly rougher state beats one that's stuck polishing Phase 3.


### One security note

Because you're vibecoding fast, it's easy to let an AI tool put `DTP_KEY`/`HOLON_KEY` straight into frontend code "to save time." Don't. Any key visible in browser JavaScript is public the moment you deploy. Insist on a minimal backend/serverless route (even a single `api/` folder with two or three functions) that holds the keys and that your React frontend calls instead of hitting Ontomorph directly. This is also something judges may actually check if they open dev tools during your demo — a leaked key in the network tab is an easy, visible "execution" deduction.
