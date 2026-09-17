# Commonplace — web app

The live implementation — start at the [root README](../README.md) for what
Commonplace is and the rules all three apps share.

**Deployed: https://commonplace-livid.vercel.app**

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

Vercel builds from this subdirectory — the project's **Root Directory** is set to
`web`, since the repository root holds both apps and has no `package.json`.
Pushes to `main` deploy automatically. The demo path needs no environment
variables — every screen renders from the seed — but sign-in and `/api/sync`
do. `.env.example` lists them and says what each one guards.

## Where this stands

**Phase 1 screens are complete and working against the seed corpus.** Every
screen is built to the design's literal values, every interaction works, and
every displayed number is a **real count** derived from the corpus.

That last point is worth stating plainly, because the iOS app deliberately does
the opposite: it shows fixed display constants (`1,284`, `142`, `89`) so it looks
like a product in real use. Here, `useCounts()` in `src/lib/store.tsx` derives
everything. If you see a hard-coded total in this app, it is a bug.

Not yet done: the screens still read from the seed rather than from Postgres,
and Phases 2–4 (AI extraction, generated briefs, connections) are untouched by
design — Phase 1 ships on a real URL first.

**Phase 5 landed early, out of order.** `03-react-web-app.md` defers live X
sync on the assumption that bookmarks sit behind a ~$200/month tier. They do
not: they are Owned Reads at $0.001 per resource, so a ~1,300-bookmark backfill
is roughly $1.28, and the barrier was always scope rather than cost. So real X
OAuth and a spend-guarded `POST /api/sync` are wired up now — allowlisted to a
single X user id, because a public deployment with an open sync route bills
whoever deployed it. The schema is pushed and the tables exist.

Two things to know before trusting that: sign-in at the production alias fails
with `?error=Configuration` *after* the X authorize screen, unresolved; and
`/api/sync` has never been run, so nothing has been billed and no bookmark row
has ever been written.

## Layout

```
src/
  app/
    (marketing)/          public — the pitch is the entry route, not a login wall
      page.tsx            step 1 · pitch          /
      connect/            step 2 · consent        /connect
      setup/              step 3 · backfill       /setup
    (app)/                the shell: sidebar + toast + global keys
      brief/              today's brief           /brief      [g b]
      brief/[no]/         a past brief
      briefs/             archive                 /briefs     [g p]
      library/            library                 /library    [g l]
      idea/[id]/          detail
      ask/                ask                     /ask        [g a]
      settings/           settings                /settings   [g s]
  components/
    primitives.tsx        wordmark, eyebrow, avatar, segmented, chip, toggle, buttons
    Sidebar / MobileNav / AppShell
    screens/              one file per screen
  lib/
    seed.ts               GENERATED — the 12 bookmarks, 6 briefs, relations, Ask answers
    types.ts  tags.ts  derive.ts  ask.ts  export.ts
    store.tsx             corpus state; useCounts() derives every displayed number
    useKeydown.ts         one listener, with the INPUT/TEXTAREA bail
    db/schema.ts          Drizzle — matches 03 § 3 exactly
    sources/              BookmarkSource: archive-import · paste · x-api
```

## Two things to know before editing

**`src/lib/seed.ts` is generated** by `tools/extract-web-seed.mjs`. The prose in
it is written content, not filler, and it was extracted programmatically so the
em dashes, `·` separators and names like Sørensen/Nyström are byte-exact. Do not
paraphrase it and do not hand-edit it. `node tools/check-content.mjs` verifies it
still matches the iOS copy.

**Nothing is denormalised.** Briefs, connections and Ask answers reference
bookmarks by id and hydrate at render, so marking something reviewed in the
library updates it inside the brief. Keep it that way.

## Swapping the seed for Postgres

`lib/db/schema.ts` and `lib/sources/` are ready. To go live:

1. `DATABASE_URL=…` (Neon or Supabase), then `npx drizzle-kit push`.
2. Ingest via `archiveImportSource` — zero API cost, full history, no rate
   limits. This is the Phase 1 source and a permanent fallback.
3. Replace the seed arrays in `lib/store.tsx` with queries. Budget for this:
   the store is client state keyed by `number` (`types.ts`) while the schema
   keys by `uuid` (`db/schema.ts`), so it is a conversion, not a swap. It is
   the bulk of the remaining work — more than auth or ingest were.

`lib/sources/x-api.ts` is no longer dormant — `POST /api/sync` calls it. It is
the one source that costs money, so it stays behind the allowlist and the
`SYNC_MAX_PAGES` cap. `archiveImportSource` remains the zero-cost path and the
permanent fallback.

## Demo mode

A signed-out demo is the highest-value thing for
portfolio purposes. Because the app currently renders from the seed, every route
already works with no auth — the pitch screen links to it as "See it with sample
data". Preserve that path when the database is wired in.
