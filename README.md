# Baseline

**Live drift-alert dashboard for community health workers (CHWs) in Southwest Nigeria.**

Built on the [Ontomorph](https://developer.ontomorph.com) digital-twin platform and its HOLON clinical knowledge API.

---

## What it does

Most primary care in Southwest Nigeria is delivered by community health workers, not doctors. Baseline gives a CHW a live, prioritized queue of their patients' digital twins. As new health events arrive (vitals, labs), Baseline checks each one against that patient's personal baseline **and** against HOLON's age/sex-stratified reference ranges — flags anything drifting, and surfaces a plain-language note a non-physician can act on immediately.

---

## Platform features used

| Feature | How Baseline uses it |
|---|---|
| **Digital twins** (`dtp.twins.connect`) | Each patient in the CHW queue is one twin. Connected via grant token. |
| **Health events** (`twin.events`, `twin.systems.get`) | Events (vitals, labs) are read per body system and displayed in the detail panel. |
| **Event streaming** (`twin.events.stream`) | Real-time event feed powers the "Live" indicator and demo trigger flow. |
| **HOLON reference ranges** (`dtp.holon.referenceRanges.getByLoincCode`) | Every value is classified stable/watch/critical against an age- and sex-stratified range — no hardcoded thresholds. |
| **HOLON drug interactions** (`dtp.holon.interactions.checkList`) | Patients with multiple medications are checked for interactions on each visit. |
| **Flag writes** (`twin.flag`) | When HOLON confirms a value is out of range, a flag is permanently written to the twin. |
| **Demo seeding** (`POST /twins/seed-demo`) | Sandbox twins created via the documented seed endpoint (Plan A). |

---

## What's real vs. simulated in the demo

- **Patient event streams** are triggered via the "Demo Controls" panel rather than live device data — no real medical device feeds data during a hackathon.
- **All HOLON reference-range and drug-interaction calls** (`/api/check-value`, `/api/check-interactions`) are **live API calls** against the HOLON clinical knowledge API using a real key.
- **Twin connect and flag writes** (`dtp.twins.connect`, `twin.flag`) are real calls against the Ontomorph sandbox using the test API key and seed-demo-created twins.

---

## Clinical reasoning note

A reading is classified as **stable** when it falls within HOLON's age- and sex-stratified reference range for that LOINC code. It becomes **watch** when it exceeds the range boundary, and **critical** when it exceeds the boundary by more than 15% — indicating significant drift from population norms *and* from the patient's own personal baseline. Drug interactions are surfaced separately via HOLON's pairwise interaction check across the patient's full medication list.

---

## Privacy and consent

Baseline never holds raw patient records. Access is always mediated by a scoped, time-bound grant token issued per patient — covering only the body systems needed for that session. Grants are revocable at any time by the patient. This mirrors Ontomorph's own "patient-owned twin" model.

---

## How to run locally

### Prerequisites
- Node.js 18+
- An Ontomorph developer account with a **test-type platform key** and a **HOLON key**

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd baseline
npm install

# 2. Configure keys
cp .env.example .env
# Edit .env and fill in:
#   ONTOMORPH_API_KEY_TEST=your_test_key
#   ONTOMORPH_HOLON_KEY=your_holon_key

# 3. Start both servers (Vite + Express)
npm run dev:all
# → Vite at http://localhost:5173
# → API at http://localhost:3001

# 4. (Optional) Seed demo twins — run once before switching to live mode
curl -X POST http://localhost:3001/api/seed-demo
# Then set VITE_USE_LIVE_API=true in .env and restart
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `ONTOMORPH_API_KEY_TEST` | Yes | Test-scoped platform key — **API server only, never frontend** |
| `ONTOMORPH_HOLON_KEY` | Yes | HOLON clinical knowledge key — **API server only** |
| `VITE_USE_LIVE_API` | No | `true` = real API, `false` = fixture data (default) |
| `API_PORT` | No | Express port, default `3001` |
| `AI_API_KEY` | No | Gemini API key for note generation; template notes used if absent |

---

## What we'd build next

- **Real device / EHR integration** — ingest vitals from community-level devices or HL7 FHIR imports rather than manually triggered demo events.
- **Offline support** — CHWs in Southwest Nigeria often work in low-connectivity environments; a service-worker cache of the last-known patient queue is essential for field use.
- **Supervisor escalation workflow** — when a CHW flags a critical reading, a structured referral pathway to a supervising clinician (with read-back confirmation) is the next clinical safety layer.
