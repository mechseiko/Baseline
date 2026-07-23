# Baseline — Ontomorph Setup & API Guide
## 1. What to do on the Ontomorph dashboard, in order

1. **Register for the hackathon** at developer.ontomorph.com/hackathon if you haven't already. You get your API key immediately, no waitlist.
2. **Find your keys page** (linked from the docs — "Sign in" on developer.ontomorph.com, then look for a Keys section). You need two separate keys:
   - `DTP_KEY` — your main platform key, for `dtp.twins`, `dtp.grants`, `dtp.events`.
   - `HOLON_KEY` — a separate key specifically for the HOLON clinical knowledge API. The docs are explicit that these are configured separately, so don't assume one key does both.
3. **Check for a sandbox / test-twin creation option in the dashboard UI.** The public docs show how to *connect* to a twin using a grant token, but they don't show an endpoint for *creating* a brand-new twin with synthetic data from scratch. Look for something like "test patients," "sandbox twins," or "demo data" in the dashboard. If it exists — use it, it'll save you hours. **If you can't find it within the first 30–45 minutes, stop looking and go to Plan B below.** Don't burn your limited hours hunting for an undocumented feature.
4. **Confirm your key type.** A live key targets production, a test key targets a sandbox. Use a test key while building — you don't want to accidentally write real flags to a real record during a demo rehearsal.
5. **Do not plan around the plugin registry.** The `/plugins` page on the docs site says outright that the plugin registry and publish API "aren't live yet" and that the example code "doesn't run against the current SDK." Baseline doesn't need plugins to work — it's built entirely on twins, events, HOLON and simulation, all of which are real and documented. Just don't let yourself get pulled into trying to build or publish a plugin; it's a documented dead end this week.

### Plan B — if there's no dashboard way to seed multiple twins with data

This is likely, given the docs don't document a "create twin" call. Don't lose hours to it. Instead:

- Build a small local JSON fixture file that mimics the exact shape of a real twin's data (systems → events, with `code`, `system`, `value`, `occurredAt` fields matching the docs' event shape).
- Write your app so the *data-fetching layer* is a thin function (`getTwinData(patientId)`) that can point at either the real SDK call or your local fixture, decided by one config flag. That way, if you *do* get real sandbox access working, you flip one flag and it's live; if not, your demo is still fully functional on fixture data.
- Keep your **HOLON calls real** even if your twin data is mocked. HOLON (`concepts.search`, `interactions.checkList`, `referenceRanges.getByLoincCode`) is read-only, doesn't need a patient grant, and is safe to call directly with just your `HOLON_KEY`. This is actually the single easiest way to prove genuine platform integration to judges even if your twin layer is partly simulated.

---

## 2. Ontomorph's terms, explained plainly

| Term | What it actually means | Why Baseline cares |
|---|---|---|
| **Digital twin** | A model of one patient's body, organized by system, built from their logged health events. You never touch "raw records" — you always go through the twin. | Each patient in your CHW's queue is one twin. |
| **Body system** | A physiological grouping — cardiovascular, nervous, skeletal, etc. Lets you read one part of a twin instead of the whole thing at once. | Baseline's alerts are organized by system (e.g. a cardiovascular drift vs a metabolic one). |
| **Health event** | One timestamped entry on a twin: a lab, vital, medication, or genetic variant. Always has a `code`, a `value`, and the system it belongs to. | This is the raw material your drift detection runs on. |
| **Grant / grant token** | The consent a patient gives to let you access their twin. It's scoped (only certain systems/actions) and time-bounded (expires). The *token* is the signed proof of that consent that you hand to the SDK — you never hold the patient's data directly, just the token. | This is your entire "patient-owned data" story for judges. Emphasize it — the platform's whole pitch is patient ownership, and your CHW app respects that by only ever holding a scoped, revocable token, never raw records. |
| **API key** | Identifies *you* (the calling app), not any specific patient. A live key hits production, a test key hits the sandbox. | Server-side only. Never expose this in frontend code — see security note below. |
| **Flag** | A finding you write *back* onto a twin as a new event — e.g., "this LDL result is out of range." | This is how your CHW's judgment (or your AI reasoning layer) becomes a permanent, visible part of the patient's record. |
| **Plugin** | An extension — importer, analyser, or 3D overlay. | Not usable this week (see above). Skip it. |
| **Simulation** | A projected what-if change, rendered as animation on the 3D body via `twin.simulate()`. | Optional stretch goal for Baseline — not core, but a nice "wow" if you have time left (see the Antigravity prompt for where this fits as an optional phase). |
| **HOLON** | The separate clinical knowledge API behind the twin. One REST interface over 19 medical vocabularies (SNOMED CT, LOINC, RxNorm, and 16 more), 5.3M concepts, 1.7M drug interactions, cross-vocabulary mappings, lab reference ranges, and phenotype similarity. | This is what actually computes "is this patient's value normal for their age and sex" — the core of your drift-detection logic. |
| **Concept** | One clinical idea (a drug, a lab test, a diagnosis) with one stable ID, regardless of which vocabulary named it. | Lets your app work with "LDL cholesterol" as one thing instead of juggling five different codes for it. |
| **Vocabulary** | A specific coding system, like SNOMED CT or LOINC. HOLON normalizes across all of them. | You mostly won't touch this directly — HOLON does the translation for you. |

---

## 3. How the API actually works, end to end

This is the real request flow Baseline is built on:

1. **Server-side setup.** Your backend (or a serverless function, if Antigravity scaffolds one) holds `DTP_KEY` and `HOLON_KEY` as environment variables. Never in frontend code.
2. **Get a grant.** In a real deployment, the *patient* issues a grant (`dtp.grants.create({ scope: [...], expiresAt: ... })`). For your demo, you are standing in for that consent step — you'll create these programmatically for your handful of demo patients, and it's worth narrating that step out loud in your video ("in production, this consent step is initiated by the patient themselves").
3. **Connect a twin.** `dtp.twins.connect(grantToken)` gives you a `twin` object scoped to exactly what was granted.
4. **Read a system.** `twin.systems.get("cardiovascular")` returns the events pinned to that system.
5. **Stream events.** `twin.events.stream({ system }, callback)` pushes new events to you in real time as they arrive — this is what powers your "live" dashboard feel. For your demo, you will likely need to *trigger* these events yourself on a timer or button-press, since there's no real device feeding live data in during a hackathon.
6. **Resolve against HOLON.** For each event's code, call HOLON to check it against a reference range (`dtp.holon.referenceRanges.getByLoincCode(loincCode, age, sex)`) or an interaction list (`dtp.holon.interactions.checkList([...])`). This is where "is this actually a problem" gets decided — not by a hardcoded threshold in your own code, which is the difference between a real integration and a fake one.
7. **Write a flag.** If HOLON says a value is out of range or drifting, call `twin.flag(system, message)` to permanently record that finding on the twin.
8. **Surface it to the CHW.** Your dashboard queries across your handful of demo twins, pulls whichever have new flags, and ranks them into a prioritized queue.

That loop — **event → HOLON check → flag → dashboard queue** — is the entire spine of Baseline. Everything else (the AI plain-language layer, the UI polish) sits on top of it.

---

## 4. What to upload to Antigravity as context

Give Antigravity all of the following in one go, so it has everything it needs without you having to correct it mid-build:

1. **This file** (`01-ontomorph-api-guide.md`) — the terms and the real request flow.
2. **The build prompt file** (`02-antigravity-build-prompt.md`) — the actual instructions.
3. **A screenshot of your dashboard's Keys page**, with the actual key values blacked out/cropped — this lets Antigravity see the exact key names and structure without you typing your real secrets into a prompt. (Never paste a real API key into a chat prompt, even to a coding tool — put it directly into a `.env` file yourself once the project scaffold exists.)
4. **The raw code snippets from the docs**, if Antigravity's web access is limited or you want to guarantee it doesn't hallucinate a different method signature. The four snippets that matter most: the quickstart twin-connect block, the events-stream block, the grants create/revoke block, and the HOLON concepts/interactions/mappings block. (All four are already embedded inside the build prompt file, so you technically don't need to attach these separately — they're just useful if Antigravity ever seems to invent a method that doesn't match what's in this guide.)
5. **Your color palette and type system** (also embedded in the build prompt, but worth having as a standalone reference open in a tab while you review Antigravity's output, so you can eyeball-check consistency fast).

### One security note

Because you're vibecoding fast, it's easy to let an AI tool put `DTP_KEY`/`HOLON_KEY` straight into frontend code "to save time." Don't. Any key visible in browser JavaScript is public the moment you deploy. Insist on a minimal backend/serverless route (even a single `api/` folder with two or three functions) that holds the keys and that your React frontend calls instead of hitting Ontomorph directly. This is also something judges may actually check if they open dev tools during your demo — a leaked key in the network tab is an easy, visible "execution" deduction.
