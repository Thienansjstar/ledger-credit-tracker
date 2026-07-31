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

A PWA has to be served over HTTPS — opening `index.html` from your filesystem will not install.

This repo is set up for **Netlify** and needs no build step. `netlify.toml` publishes the root as-is and sets the cache headers that matter: nothing here is content-hashed, so the shell files revalidate on every request. Without that the CDN keeps serving a stale `sw.js` and the `CACHE` bump never reaches installed devices.

The site is `ledger-credit-tracker.netlify.app`. To deploy, either connect this repo in the Netlify UI (Add new project → Import an existing project → GitHub) so every push to `main` redeploys, or run a one-off from a clone:

```bash
npx netlify-cli deploy --prod --dir .
```

GitHub Pages also works if you prefer it — Settings → Pages → deploy from branch → root. The relative paths in `manifest.webmanifest` and the `sw.js` registration are deliberately relative so the app runs correctly from a subpath like `/ledger-credit-tracker/`.

## 2. Install it on your phone

- **iOS:** open the URL in Safari (not Chrome — iOS only installs from Safari), tap Share → Add to Home Screen.
- **Android:** open in Chrome, tap the Install button in the app's top bar, or use the browser's "Install app" menu item.

Once installed it launches fullscreen with no browser chrome and works with no connection.

## 3. Turn on cross-device sync

Without this the app is device-local: your phone and laptop keep separate check-offs. Sync needs a backend, and Supabase's free tier is plenty.

A Supabase project named `ledger-credit-tracker` is already provisioned with the table below applied, so you can skip to step 3 and paste its URL and anon key into Settings. The steps are kept here for rebuilding from scratch.

1. Create a project at supabase.com.
2. In the SQL editor, run:

```sql
create table ledger (
  id         text primary key,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table ledger enable row level security;

-- anon never touches the table. The only way in is these two functions,
-- and both demand the sync code as an argument.
revoke all on ledger from anon, authenticated;

create function ledger_pull(code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if code is null or length(code) < 20 then raise exception 'sync code too short'; end if;
  select l.data into result from public.ledger l where l.id = code;
  return result;
end; $$;

create function ledger_push(code text, payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if code is null or length(code) < 20 then raise exception 'sync code too short'; end if;
  insert into public.ledger (id, data, updated_at) values (code, payload, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
end; $$;

-- Supabase's default privileges hand EXECUTE to authenticated as well; this
-- app has no sign-in, so take it back.
revoke all on function ledger_pull(text), ledger_push(text, jsonb) from public, authenticated;
grant execute on function ledger_pull(text), ledger_push(text, jsonb) to anon;
```

3. In the app: Settings → Sync, paste your **Project URL** and **anon public key** (Supabase → Project Settings → API), tap **Generate code**, then **Save & sync**.
4. On every other device, enter the same three values. The sync code is what ties them together.

### About that security model

The sync code is the credential, and the database is what enforces it. `anon` has no privileges on the `ledger` table at all — it can only call `ledger_pull` and `ledger_push`, both of which take the code as an argument and touch exactly the one row it names. So the anon key on its own reaches nothing: it cannot list the table, and it cannot read a row whose code it does not already have. The code is a `crypto.randomUUID()` value, generated client-side and never sent anywhere but these two calls.

This matters because the anon key is not really a secret — it is designed to ship in client code, and anyone you share a sync code with also holds the key. Making the code the boundary is what keeps that from mattering.

It is still a shared secret rather than per-user authentication: anyone you give a code to has full access to that row, and there is no way to revoke one device without rotating the code everywhere. That is an acceptable ceiling for what gets stored — a set of credit IDs, the period each was checked off in, and your card anniversary dates. No card numbers, no balances, no name. If you want real per-user auth, add Supabase magic-link sign-in and swap the functions for policies keyed on `auth.uid()`.

Credentials never live in this repo. They are entered in Settings and kept in `localStorage` on each device.

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
