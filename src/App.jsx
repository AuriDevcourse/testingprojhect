import { useEffect, useMemo, useRef, useState } from 'react'
import { getCurrencies, getRate } from './api'
import { metaFor } from './flags'
import { useGoogleAuth } from './useGoogleAuth'
import { useFavorites } from './useFavorites'
import { useSheets } from './useSheets'

const POPULAR = ['USD', 'EUR', 'GBP', 'DKK', 'JPY', 'CHF']

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d + 'T16:00:00')
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function App() {
  const [currencies, setCurrencies] = useState({})
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [rate, setRate] = useState(null)
  const [date, setDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [spread, setSpread] = useState(0) // bank/card markup %, transparency feature
  const [swapped, setSwapped] = useState(false)

  const { user, signOut, buttonRef, configured } = useGoogleAuth()
  const { favs, toggle, isFav } = useFavorites(user)
  const { submit, saving, error: saveError, savedUrl } = useSheets(user)
  const [justSaved, setJustSaved] = useState(false)
  const pair = `${from}/${to}`

  async function handleSubmit() {
    if (rate == null || error) return
    const ok = await submit({
      amount: numeric,
      from,
      to,
      rate,
      result: result != null ? Number(result.toFixed(4)) : null,
      spread,
      effectiveRate: effectiveRate != null ? Number(effectiveRate.toFixed(6)) : null,
    })
    if (ok) {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    }
  }

  // Load the currency list once.
  useEffect(() => {
    getCurrencies()
      .then(setCurrencies)
      .catch(() => setError('Could not load currencies. Check your connection.'))
  }, [])

  // Fetch the rate whenever the pair changes.
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getRate(from, to)
      .then(({ rate, date }) => {
        if (!active) return
        setRate(rate)
        setDate(date)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Rate unavailable right now.')
        setLoading(false)
      })
    return () => { active = false }
  }, [from, to])

  const numeric = parseFloat(amount) || 0
  const effectiveRate = rate != null ? rate * (1 - spread / 100) : null
  const midResult = rate != null ? numeric * rate : null
  const result = effectiveRate != null ? numeric * effectiveRate : null
  const lost = midResult != null && result != null ? midResult - result : 0

  const fmt = (n, code) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: code === 'JPY' || code === 'KRW' ? 0 : 2,
    }).format(n)

  function swap() {
    setSwapped((s) => !s)
    setFrom(to)
    setTo(from)
  }

  const codes = useMemo(() => Object.keys(currencies).sort(), [currencies])

  return (
    <div className="app">
      <div className="grain" aria-hidden />
      <div className="glow" aria-hidden />

      <header className="masthead">
        <div className="mark">💱</div>
        <div className="brand">
          <h1>VAULT</h1>
          <p className="tag">Live foreign exchange · ECB reference rates</p>
        </div>
        <div className="auth">
          {user ? (
            <div className="user">
              {user.picture && <img src={user.picture} alt="" referrerPolicy="no-referrer" />}
              <div className="user-text">
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <button className="signout" onClick={signOut}>Sign out</button>
              </div>
            </div>
          ) : configured ? (
            <div ref={buttonRef} className="gbtn" />
          ) : (
            <span className="auth-hint" title="Add VITE_GOOGLE_CLIENT_ID to .env — see docs/google-setup.md">
              Sign-in: add client ID
            </span>
          )}
        </div>
      </header>

      <main className="card">
        {/* Amount */}
        <label className="field-label">You send</label>
        <div className="amount-row">
          <input
            className="amount-input"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            aria-label="Amount to convert"
          />
          <CurrencySelect value={from} codes={codes} currencies={currencies} onChange={setFrom} />
        </div>

        {/* Swap */}
        <div className="swap-line">
          <span className="rule" />
          <button className={`swap-btn ${swapped ? 'spun' : ''}`} onClick={swap} aria-label="Swap currencies">
            ↑↓
          </button>
          <span className="rule" />
        </div>

        {/* Result */}
        <label className="field-label">They receive</label>
        <div className="result-row">
          <div className={`result-figure ${loading ? 'is-loading' : ''}`}>
            <span className="result-symbol">{metaFor(to).symbol}</span>
            <span className="result-number">
              {error ? '—' : result != null ? fmt(result, to) : '—'}
            </span>
          </div>
          <CurrencySelect value={to} codes={codes} currencies={currencies} onChange={setTo} />
        </div>

        {/* Rate line */}
        <div className="rate-line">
          {error ? (
            <span className="err">{error}</span>
          ) : rate != null ? (
            <>
              <span className="dot" />
              <span className="mono">
                1 {from} = {fmt(rate, to)} {to}
              </span>
              {date && <span className="updated">updated {formatDate(date)}</span>}
            </>
          ) : (
            <span className="mono dim">fetching rate…</span>
          )}
          {rate != null && !error && (
            <button
              className={`star ${isFav(pair) ? 'on' : ''}`}
              onClick={() => toggle(pair)}
              aria-label={isFav(pair) ? 'Remove favorite' : 'Save favorite'}
              title={user ? 'Save to your account' : 'Save (sign in to sync)'}
            >
              {isFav(pair) ? '★' : '☆'}
            </button>
          )}
        </div>

        {/* Transparency: markup spread slider */}
        <div className="spread">
          <div className="spread-head">
            <span className="field-label">Bank / card markup</span>
            <span className="mono spread-val">{spread.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={spread}
            onChange={(e) => setSpread(parseFloat(e.target.value))}
            className="slider"
          />
          <p className="spread-note">
            {spread === 0
              ? 'Showing the mid-market rate — what banks see, before their cut.'
              : `At ${spread.toFixed(1)}% you'd lose ≈ ${metaFor(to).symbol}${fmt(lost, to)} vs. the mid-market rate.`}
          </p>
        </div>

        {/* Submit → append to Google Sheet */}
        {configured && (
          <div className="submit-block">
            <button
              className={`submit-btn ${justSaved ? 'ok' : ''}`}
              onClick={handleSubmit}
              disabled={saving || rate == null || !!error}
            >
              {saving ? 'Saving…' : justSaved ? '✓ Saved to Sheet' : 'Save this conversion'}
            </button>
            <div className="submit-meta">
              {saveError ? (
                <span className="err">{saveError}</span>
              ) : savedUrl ? (
                <a href={savedUrl} target="_blank" rel="noreferrer" className="sheet-link">
                  View your sheet ↗
                </a>
              ) : (
                <span className="dim-note">Logs each conversion to a Google Sheet in your Drive</span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Favorites (when saved) or quick popular targets */}
      {favs.length > 0 ? (
        <div className="quick">
          <span className="quick-label">{user ? 'Your pairs' : 'Saved'}</span>
          {favs.map((p) => {
            const [f, t] = p.split('/')
            return (
              <button key={p} className="chip fav" onClick={() => { setFrom(f); setTo(t) }}>
                <span>{metaFor(f).flag}</span>{f}
                <span className="arrow">→</span>
                <span>{metaFor(t).flag}</span>{t}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="quick">
          {POPULAR.filter((c) => c !== from).slice(0, 5).map((c) => (
            <button key={c} className="chip" onClick={() => setTo(c)}>
              <span>{metaFor(c).flag}</span> {c}
            </button>
          ))}
        </div>
      )}

      <footer className="foot">
        <span>Rates: <a href="https://frankfurter.dev" target="_blank" rel="noreferrer">Frankfurter</a> · ECB</span>
        <span className="soon">Sign-in + Sheets sync · live</span>
      </footer>
    </div>
  )
}

function CurrencySelect({ value, codes, currencies, onChange }) {
  const ref = useRef(null)
  const meta = metaFor(value)
  return (
    <div className="select-wrap">
      <span className="select-flag">{meta.flag}</span>
      <select
        ref={ref}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={currencies[value] || value}
      >
        {codes.map((c) => (
          <option key={c} value={c}>
            {c} — {currencies[c]}
          </option>
        ))}
      </select>
      <span className="select-caret">▾</span>
    </div>
  )
}
