# 💱 Vault — Currency Converter

A refined, fast currency converter web app. Live ECB reference rates, fee/markup transparency, and (coming) Google Sign-In + Google Sheets sync.

## Stack
- **Vite + React** — deployable to Vercel
- **[Frankfurter](https://frankfurter.dev)** for FX data — free, no API key, ECB-backed, ~30 fiat currencies. Rates update once per working day (~16:00 CET).

## Features
- Live conversion across ~30 fiat currencies with flags
- One-click swap
- **Markup-spread slider** — see the mid-market rate vs. what a bank/card markup actually costs you (the transparency differentiator)
- Quick-pick popular pairs
- "Last updated" provenance label so you always know how fresh the rate is

## Roadmap
1. ✅ **MVP converter** (this) — no Google config needed
2. **Polish** — favorites sync, historical mini-chart, offline PWA cache
3. **Google Sign-In** (OAuth 2.0) — per-user favorites & settings
4. **Google Sheets sync** — export conversions / read amounts from a sheet

> Phases 3–4 require a one-time Google Cloud setup (project + OAuth consent screen + Sheets API). See `docs/` when added.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```
