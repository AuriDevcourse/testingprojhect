import { useCallback, useEffect, useState } from 'react'

// Favorites are stored per user (by Google `sub`) or under "guest" when signed out.
// When a guest signs in, their guest favorites are merged into the account.
const keyFor = (user) => `vault:favs:${user?.sub || 'guest'}`

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useFavorites(user) {
  const [favs, setFavs] = useState(() => read(keyFor(user)))

  // Reload when the signed-in user changes; merge guest favorites on sign-in.
  useEffect(() => {
    const key = keyFor(user)
    let list = read(key)
    if (user) {
      const guest = read('vault:favs:guest')
      if (guest.length) {
        list = Array.from(new Set([...list, ...guest]))
        localStorage.setItem(key, JSON.stringify(list))
        localStorage.removeItem('vault:favs:guest')
      }
    }
    setFavs(list)
  }, [user])

  const persist = useCallback((list) => {
    setFavs(list)
    try { localStorage.setItem(keyFor(user), JSON.stringify(list)) } catch {}
  }, [user])

  const toggle = useCallback((pair) => {
    const list = read(keyFor(user))
    const next = list.includes(pair) ? list.filter((p) => p !== pair) : [...list, pair]
    persist(next)
  }, [user, persist])

  const isFav = useCallback((pair) => favs.includes(pair), [favs])

  return { favs, toggle, isFav }
}
