# Ledger — project notes

Installable PWA for tracking use-it-or-lose-it credit card credits. Vanilla JS, no build step, no dependencies. Open `index.html` through any static server and it runs.

## Files

| File | Role |
|---|---|
| `index.html` | App shell — four tab panes, all markup |
| `styles.css` | Everything visual. Tokens at `:root` |
| `app.js` | Card data, period math, sync, rendering |
| `sw.js` | Service worker, offline shell cache |
| `manifest.webmanifest` | Install metadata |
| `icons/` | 192, 512, maskable 512 |

## Gotcha that will bite you

**After any edit to `index.html`, `styles.css`, or `app.js`, bump `CACHE` in `sw.js`** (`ledger-v1.0.0` → `ledger-v1.0.1`). The service worker serves the cached shell first, so without a version bump, installed devices keep running the old code and it looks like your change did nothing.

## Editing card data

Everything lives in the `CARDS` array at the top of `app.js`.

```js
{
  id:'csr', issuer:'Chase', name:'Sapphire Reserve', fee:'$795',
  face:'linear-gradient(...)',          // card art on the Cards tab
  rates:[{t:'dining', r:'3X', c:'Dining worldwide', n:3}],
  //      t = advisor category tag, r = display string, n = numeric rank for comparison
  perks:['Priority Pass Select'],        // short pills only
  credits:[{ id:'csr-dining', label:'…', sub:'…', cadence:'half', value:150 }]
}
```

Credit fields:
- `cadence` — `monthly` | `quarterly` | `half` | `annual` | `anniversary`
- `value` (dollars) or `points` — drives the unclaimed total
- `anniv` — only for `cadence:'anniversary'`; points at a card id whose date is set in Settings

Advisor verdicts are hand-written in `VERDICT`, keyed by category tag. They exist because raw multiplier comparison misleads — e.g. Venture X's 10X only applies inside Capital One Travel. If you add a category, add a verdict or it falls back to naive rank comparison.

## Period math

`windowFor(credit, anniv)` returns `{start, end}` for the current window. Everything else derives from it:
- `pKey()` — the claim key, so a check-off only counts for the window it was made in
- `daysLeft()` — countdown
- `spent()` — 0–1 fraction of window elapsed, drives the depletion meter

Anniversary windows run from the account-open date, not Jan 1. Defaults in `DEFAULT_ANNIV`, user-editable in Settings.

Quick check after touching this:

```bash
node -e "$(sed -n '/PERIOD MATH/,/STATE + SYNC/p' app.js)" 2>/dev/null || echo "extract manually to test"
```

## Sync

Optional. Supabase REST via `fetch` — no SDK. Table:

```sql
create table ledger (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table ledger enable row level security;
create policy "sync code access" on ledger for all to anon using (true) with check (true);
```

Claims merge per-key by timestamp (`mergeClaims`), so two devices editing different credits both survive. Unchecking writes `{p:null, t:now}` rather than deleting — a tombstone, so an un-check propagates instead of being overwritten by a stale check.

Credentials live in `localStorage` only, entered through Settings. **Never commit them.**

## Testing locally

```bash
python3 -m http.server 8000
# then http://localhost:8000
```

Service workers and install prompts need a secure context. `localhost` counts as secure; a `file://` path does not, and neither does a LAN IP over plain HTTP.

## Ideas not yet built

- Push notification when a monthly credit hits ~5 days left
- Per-credit notes (confirmation numbers, which restaurant used the Exclusive Tables booking)
- Annual fee vs. credits-actually-claimed, to see if a card is still worth keeping
- Import card data from a JSON file so terms updates don't require code edits
