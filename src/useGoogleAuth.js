import { useCallback, useEffect, useRef, useState } from 'react'
import { loadGis } from './gis'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const STORAGE_KEY = 'vault:user'

// Decode a Google ID-token JWT payload (no verification — display only).
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(payload))))
  } catch {
    return null
  }
}

export function useGoogleAuth() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [ready, setReady] = useState(false)
  const buttonRef = useRef(null)
  const configured = Boolean(CLIENT_ID)

  const handleCredential = useCallback((response) => {
    const profile = decodeJwt(response.credential)
    if (!profile) return
    const u = {
      sub: profile.sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
    }
    setUser(u)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) } catch {}
  }, [])

  // Always load GIS (so the Sheets token flow works on persisted sessions);
  // render the sign-in button only when signed out.
  useEffect(() => {
    if (!configured) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
        })
        setReady(true)
        if (!user && buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'medium',
            shape: 'pill',
            text: 'signin_with',
          })
        }
      })
      .catch(() => setReady(false))
    return () => { cancelled = true }
  }, [configured, user, handleCredential])

  const signOut = useCallback(() => {
    setUser(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect()
  }, [])

  return { user, signOut, buttonRef, configured, ready }
}
