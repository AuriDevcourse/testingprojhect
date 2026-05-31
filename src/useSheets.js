import { useCallback, useState } from 'react'
import { loadGis } from './gis'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
// drive.file = non-sensitive; only files this app creates. Enough to make + write our sheet.
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const TITLE = 'Vault Conversions'
const SHEET = 'Conversions'
const HEADER = ['Saved at', 'Amount', 'From', 'To', 'Rate', 'Converted', 'Markup %', 'Effective rate']

let tokenClient = null
let cachedToken = null
let tokenExpiry = 0

async function getToken() {
  await loadGis()
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: () => {},
    })
  }
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(new Error(resp.error))
      cachedToken = resp.access_token
      tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000
      resolve(cachedToken)
    }
    tokenClient.requestAccessToken({ prompt: cachedToken ? '' : 'consent' })
  })
}

async function api(token, url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error?.message || `Request failed (${res.status})`)
  return data
}

const valuesUrl = (id) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${SHEET}!A1:append?valueInputOption=USER_ENTERED`

async function ensureSpreadsheet(token, storageKey) {
  const existing = localStorage.getItem(storageKey)
  if (existing) {
    try {
      await api(token, `https://sheets.googleapis.com/v4/spreadsheets/${existing}?fields=spreadsheetId`)
      return existing
    } catch {
      localStorage.removeItem(storageKey) // file gone / no access — recreate
    }
  }
  const created = await api(token, 'https://sheets.googleapis.com/v4/spreadsheets', 'POST', {
    properties: { title: TITLE },
    sheets: [{ properties: { title: SHEET } }],
  })
  const id = created.spreadsheetId
  await api(token, valuesUrl(id), 'POST', { values: [HEADER] })
  localStorage.setItem(storageKey, id)
  return id
}

export function useSheets(user) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedUrl, setSavedUrl] = useState(() => {
    const id = localStorage.getItem(`vault:sheet:${user?.sub || 'me'}`)
    return id ? `https://docs.google.com/spreadsheets/d/${id}` : null
  })

  const submit = useCallback(async (conv) => {
    setError(null)
    setSaving(true)
    try {
      const token = await getToken()
      const key = `vault:sheet:${user?.sub || 'me'}`
      const id = await ensureSpreadsheet(token, key)
      const row = [
        new Date().toLocaleString('en-GB'),
        conv.amount,
        conv.from,
        conv.to,
        conv.rate,
        conv.result,
        conv.spread,
        conv.effectiveRate,
      ]
      await api(token, valuesUrl(id), 'POST', { values: [row] })
      setSavedUrl(`https://docs.google.com/spreadsheets/d/${id}`)
      return true
    } catch (e) {
      setError(e.message || 'Could not save to Sheets')
      return false
    } finally {
      setSaving(false)
    }
  }, [user])

  return { submit, saving, error, savedUrl }
}
