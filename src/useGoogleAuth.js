import { useCallback, useEffect, useRef, useState } from 'react'

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

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.getElementById('gis-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.id = 'gis-script'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(s)
  })
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

  // Initialise GIS and render the button when signed out.
  useEffect(() => {
    if (!configured || user) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
        })
        setReady(true)
        if (buttonRef.current) {
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
