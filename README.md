# PAP Mask-Fitting Study — Clinical Data Entry App

Data entry app for: *Role of Guided, Individualized, and Tailored Mask Fitting in PAP Therapy Adherence* — Institute of Sleep Science, Kolkata. CRF v2.0 (PI: Somnath Maity, PT / Co-PI: Dr. Arup Kr. Halder).

Built the same way as the OSA-GA and DISE Variability apps: single-page HTML/CSS/JS, no build step, syncing directly to a Google Sheet via Apps Script.

---

## How it's organized

Unlike the CRF's single wide row per patient, this app splits data entry into **three flows**, because your CRF has data entered at different times by different people:

1. **New Patient Enrollment** — Demographics through Patient Experience (everything collected at the fitting visit). Submitting this generates a **Patient ID** (e.g. `ISS-4821`) and appends a new row to the sheet. **Write this ID down** — it's needed for every follow-up.
2. **Follow-Up Visit Entry** — look up a patient by ID, pick a timepoint (1 week / 1 month / 3 months / 6 months / 1 year), and log that visit's 5 adherence fields. This **updates the existing row in place** rather than creating a new one, so the sheet still ends up one row per patient, matching your CRF layout.
3. **Study Outcomes** — overall satisfaction and AI-vs-final-mask concordance, entered whenever that's determined (typically at the final assessment). Also updates the existing row.

The sheet tab is called **"Mask Fitting Study"** and is created automatically, with all 67 columns from the CRF (Patient ID column added at the front so follow-up lookups are reliable — your original CRF only keyed rows by patient name, which isn't safe for lookups).

## A few judgment calls worth knowing about

- **Patient ID** is generated client-side (`ISS-####`) with a uniqueness check against the sheet before submitting — same pattern as the DISE Study ID. There's no authentication on this ID; anyone with it can log a follow-up for that patient.
- **Missing-data codes**: for follow-up visits, a "Visit not done (ND)" checkbox marks all 5 fields for that timepoint as `ND` in one tap, matching your CRF's ND/NA convention. Leaving a follow-up out entirely (not submitting it) is what keeps a cell blank, per your "visit not yet due" convention.
- The CRF's "Patient Experience" section header says "rate each from 0–10" but only shows one numeric column in the data — I built it as a single 0–10 rating. Flag if you actually need multiple sub-ratings there.
- **"Set pressure (cmH2O)"** is a free-text field rather than a number, since your example data has both single values (`9.8 cmH2O`) and ranges (`5-20 cmH2O`).
- BK/BL ("AI-suggested mask" / "Concordance") are entered manually in the Study Outcomes step, not auto-computed from the AI's 1st-choice mask type — the instructions tab implies these might be derivable, but a brand/model final mask can't be reliably auto-matched to a mask *type* suggestion, so I left it as a judgment call for study staff.

---

## Setup

1. Open a new Google Sheet → **Extensions → Apps Script**
2. Paste the contents of `apps-script.gs`
3. **Deploy → New deployment** → Web app → Execute as: **Me** → Who has access: **Anyone**
4. Authorize, then copy the `/exec` URL
5. Paste that URL into `config.js` → `SCRIPT_URL`
6. Push all four files to your GitHub repo, enable **GitHub Pages**, share the Pages URL with your team

Health check: open the `/exec` URL directly in a browser — it should return `{"status":"ready",...}`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Full app — home screen + 3 wizards |
| `config.js` | **Edit this** — paste your Apps Script URL here |
| `apps-script.gs` | Backend: creates the sheet, appends on enrollment, updates in place for follow-ups/outcomes, handles ID lookups |
