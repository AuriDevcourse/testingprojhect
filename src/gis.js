// Shared loader for the Google Identity Services script.
let promise = null

export function loadGis() {
  if (window.google?.accounts) return Promise.resolve()
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.id = 'gis-script'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(s)
  })
  return promise
}
