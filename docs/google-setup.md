# Google Sign-In setup (one-time)

You need a Google **OAuth Client ID** so "Sign in with Google" works. ~5 minutes, free.

## Steps

1. **Go to** [console.cloud.google.com](https://console.cloud.google.com/) and sign in with your Google account.

2. **Create a project** (top bar → project dropdown → *New Project*). Name it e.g. `vault-converter`. Select it once created.

3. **OAuth consent screen** (left menu → *APIs & Services* → *OAuth consent screen*):
   - User type: **External** → Create
   - App name: `Vault`, your email for support + developer contact → Save & Continue
   - Scopes: skip (default `openid`, `email`, `profile` are enough) → Save & Continue
   - Test users: add your own Google email → Save & Continue
   - *(While the app is in "Testing", only listed test users can sign in — that's fine.)*

4. **Create the Client ID** (left menu → *Credentials* → *Create Credentials* → *OAuth client ID*):
   - Application type: **Web application**
   - Name: `Vault web`
   - **Authorized JavaScript origins** — add both:
     - `http://localhost:5173`
     - your Vercel URL later, e.g. `https://your-app.vercel.app`
   - Create → copy the **Client ID** (looks like `1234-abc.apps.googleusercontent.com`)

5. **Add it to the app:**
   ```bash
   cp .env.example .env
   # paste your client ID after the = in .env:
   # VITE_GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com
   ```
   Restart the dev server (`npm run dev`). The "Sign in with Google" button appears in the header.

## Notes
- `.env` is gitignored — your client ID stays local. (Client IDs aren't secret, but no need to commit it.)
- For Vercel: add `VITE_GOOGLE_CLIENT_ID` in the project's *Environment Variables*, and add the Vercel URL to *Authorized JavaScript origins* in step 4.
- Sign-in here is identity only. **Google Sheets sync** (next phase) will add an OAuth *token* flow with the Sheets scope — handled separately when we build it.
