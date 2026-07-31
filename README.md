# Ledger — credit card credit tracker

An installable PWA for tracking use-it-or-lose-it card credits. Works offline, installs to your home screen, and optionally syncs across devices.

```
index.html            app shell
styles.css            all styling
app.js                card data, period math, sync
manifest.webmanifest  install metadata
sw.js                 service worker (offline cache)
icons/                192, 512, and maskable 512
```

## 1. Put it online

A PWA has to be served over HTTPS — opening `index.html` from your filesystem will not install. Any static host works. Two easy paths:

**Netlify drop:** go to app.netlify.com/drop and drag this folder in. Done in about thirty seconds, gives you a `*.netlify.app` URL.

**GitHub Pages:** push the folder to a repo, then Settings → Pages → deploy from branch → root.

## 2. Install it on your phone

- **iOS:** open the URL in Safari (not Chrome — iOS only installs from Safari), tap Share → Add to Home Screen.
- **Android:** open in Chrome, tap the Install button in the app's top bar, or use the browser's "Install app" menu item.

Once installed it launches fullscreen with no browser chrome and works with no connection.

## 3. Turn on cross-device sync

Without this the app is device-local: your phone and laptop keep separate check-offs. Sync needs a backend, and Supabase's free tier is plenty.

1. Create a project at supabase.com.
2. In the SQL editor, run:

```sql
create table ledger (
  id         text primary key,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table ledger enable row level security;

create policy "sync code access" on ledger
  for all to anon
  using (true) with check (true);
```

3. In the app: Settings → Sync, paste your **Project URL** and **anon public key** (Supabase → Project Settings → API), tap **Generate code**, then **Save & sync**.
4. On every other device, enter the same three values. The sync code is what ties them together.

### About that security model

The `anon` policy above lets anyone with your Supabase URL, anon key, *and* sync code read that row. The sync code is a random UUID, so it is effectively unguessable — but it is a shared secret, not real authentication.

That tradeoff is fine here because of what the app stores: a set of credit IDs and the period in which you checked them off. No card numbers, no balances, no name, no anything tied to your identity. If you would rather have real auth, swap the policy for `auth.uid()` matching and add Supabase magic-link sign-in.

## Keeping it current

Card terms move. Everything you would need to edit lives in the `CARDS` array at the top of `app.js`:

- `rates` — earn multipliers, `t` is the advisor category tag
- `perks` — the short pills on the Cards tab
- `credits` — each one needs `cadence` (`monthly`, `quarterly`, `half`, `annual`, `anniversary`) and either `value` (dollars) or `points`
- anniversary credits also need `anniv` pointing at a card id, with the date set in Settings

The advisor's written verdicts are in `VERDICT`, keyed by category tag.

After editing, bump `CACHE` in `sw.js` (e.g. `ledger-v1.0.1`) so devices pick up the new version instead of serving the cached copy.

## Current terms

Card details verified 31 July 2026. Anniversary dates are pre-filled as Reserve June 1, Venture X July 21, Preferred November 1 — adjust the exact days in Settings once you check your statements.
