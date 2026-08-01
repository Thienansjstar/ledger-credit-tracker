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
| `netlify.toml` | publish dir + cache headers |

## Panes

Five tabs: Credits, Cards, Perks, Which?, Settings. `PERKS` in `app.js` holds the non-dollar benefits — status tiers, lounges, insurance — as `{name, kind, what, gets[], how, watch}`. `how` exists because several benefits are dormant until activated, and `watch` is the fine print that decides whether a benefit is real (primary rental cover needs you to decline the counter waiver; Discover is barely accepted abroad). Set `kind:'Watch out'` to render the tag in red.

Anything in `PERKS` with a `how` should usually also exist as a `cadence:'once'` credit, so it is checkable rather than merely readable.

## Daily digest

`scripts/build-digest.mjs` reads points-blog RSS feeds and writes `digest.json`; `.github/workflows/digest.yml` runs it daily and commits, and Netlify redeploys on that push. `loadDigest()` in `app.js` renders the strip. Free: Actions minutes are unlimited on public repos.

**Headlines and links only.** Nothing in the digest may edit `CARDS` or `PERKS` — those carry a human verification date, and a feed scraper has no business overwriting them. If a story suggests terms actually changed, that is a human's job.

Two things that are load-bearing and easy to undo by accident:

- `if: github.event_name == 'schedule' || inputs.commit` on the commit step. A schedule event carries no inputs, so testing `inputs.commit` alone means the daily run never commits — green workflow, site never updates.
- De-duplication runs *after* the date sort, and compares significant words rather than exact titles. The same story runs on several blogs under different headlines; the first live run spent two of three slots on one lounge story.

Matchers cover benefit names, not just card names. "Chase Sapphire Lounges Cut Priority Pass Access" names no card in `CARDS` yet is the most relevant thing a Reserve holder could read that week.

Test without hitting the network:

```bash
FEEDS_BASE=http://127.0.0.1:8877 node scripts/build-digest.mjs
```

**Known limit:** GitHub disables scheduled workflows after 60 days of repo inactivity, and the workflow's own bot commits do not reliably reset that timer. The strip shows the digest date, so a stalled feed looks stale rather than looking like no news.

## Reminders

Settings → Reminders exports an `.ics`. Deliberately **not** web push: push needs a server awake at the right moment, and on the free Supabase tier the project pauses after ~7 days idle while iOS silently drops push subscriptions when the home-screen icon goes away. Both fail without telling you, which is the worst property for a use-it-or-lose-it tracker. A calendar file hands scheduling to the phone and keeps working regardless.

One `VEVENT` per cadence, not per credit, so the calendar stays readable. `fold()` wraps at 75 **octets** per RFC 5545 — count bytes, not JS string length, or the em dashes in the summaries push lines over.

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
- `cadence` — `monthly` | `quarterly` | `half` | `annual` | `anniversary` | `multiyear` | `once`
- `value` (dollars) or `points` — drives the unclaimed total; omit both for `once` items so they do not inflate it
- `anniv` — only for `cadence:'anniversary'`; points at a card id whose date is set in Settings
- `years` — only for `cadence:'multiyear'`; defaults to 4

The two cadences that are not calendar windows:

- **`multiyear`** (Global Entry) — the clock starts when you *use* it, not on any date, so the window comes from the claim timestamp via `multiState()` rather than from `windowFor()`. An unused one has no deadline; it is just available. This is why `isClaimed` special-cases it.
- **`once`** (Apple TV+, DashPass, Priority Pass enrolment) — benefits that are dormant until switched on. `windowFor` returns null, so `pKey` yields `'once'` and the check-off never expires. Neither cadence shows a depletion meter, because neither is depleting.

If you add a credit whose label already exists on another card, `DUPE_LABELS` picks it up automatically and stamps the card name on those rows — three identical "Global Entry" rows were unusable without it.

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

The client never talks to the table. `anon` has no privileges on `ledger`; it can only execute two `security definer` functions, both of which take the sync code as an argument:

```
POST /rest/v1/rpc/ledger_pull   {"code": "<uuid>"}                  -> jsonb | null
POST /rest/v1/rpc/ledger_push   {"code": "<uuid>", "payload": {…}}  -> void
```

Both reject a code shorter than 20 characters. This is why the code must come from a CSPRNG — `Math.random()` is not acceptable here, because the code *is* the credential. See `#genRoom` in `app.js`.

**Do not "simplify" this back to `from('ledger').select()` with a permissive policy.** A `using(true)` policy makes the anon key sufficient on its own and reduces the sync code to a client-side row selector, which is not a security boundary — the anon key is designed to ship in client code.

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
