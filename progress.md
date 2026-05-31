# Vault — Progress

_Currency converter web app · Vite + React · live ECB rates · Google Sign-In + Sheets sync._

**Repo:** https://github.com/AuriDevcourse/testingprojhect
**Local:** `~/currency-converter/` · `npm run dev` → http://localhost:5173

---

## Status by phase

| Phase | What | Status |
|---|---|---|
| 1 | MVP converter — live ECB rates (Frankfurter), ~30 fiat currencies, swap, quick-pick pairs, markup-spread slider, "last updated" label | ✅ Done |
| 2 | Polish — historical mini-chart, offline PWA cache | ⬜ Not started |
| 3 | Google Sign-In (OAuth 2.0) + per-user favorites (★ a pair) | ✅ Done |
| 4 | Save conversion → appends to a "Vault Conversions" Google Sheet in your Drive | ✅ Done |

---

## How it works

- **FX data:** [Frankfurter](https://frankfurter.dev) — free, no API key, ECB-backed. Rates update once per working day (~16:00 CET). `src/api.js`.
- **Auth:** Google Identity Services. Sign-in (ID token) for identity; favorites stored per Google account. `src/useGoogleAuth.js`, `src/useFavorites.js`.
- **Sheets:** `drive.file` scope (non-sensitive — only app-created files). "Save this conversion" creates the sheet on first use, then appends a row each save. Sheet id cached per user in localStorage. `src/useSheets.js`.
- **Design:** dark "Vault" theme — espresso-black + gold, Fraunces serif figures, JetBrains Mono rates, Hanken Grotesk UI. `src/index.css`.

## Config

- **Local:** `.env` (gitignored) holds `VITE_GOOGLE_CLIENT_ID`. The client _secret_ is NOT used (public frontend flow).
- **Vercel:** add `VITE_GOOGLE_CLIENT_ID` in Settings → Environment Variables, then redeploy.
- **Google Cloud:** OAuth client must list the app's origin under *Authorized JavaScript origins* (`http://localhost:5173` already added; add the Vercel URL for production). Enable Sheets API + Drive API. Add yourself as a test user while the consent screen is in Testing. See `docs/google-setup.md`.

## Verified

- Build passes (`npm run build`), app serves, Frankfurter returns live rates.
- Sign-in button + "Save this conversion" button render. _End-to-end save flow to be confirmed by Auri in a real browser (needs Sheets API enabled + test user)._

## Next up

- [ ] Auri: test sign-in + save flow in browser, confirm sheet is created
- [ ] Deploy to Vercel (add env var + production origin)
- [ ] Phase 2 polish: historical chart, offline PWA
