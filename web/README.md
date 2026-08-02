# Commonplace — web app

The live implementation — start at the [root README](../README.md) for what
Commonplace is and the rules both apps share.

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Where this stands

**Phase 1 screens are complete and working against the seed corpus.** Every
screen is built to the design's literal values, every interaction works, and
every displayed number is a **real count** derived from the corpus.

That last point is worth stating plainly, because the iOS app deliberately does
the opposite: it shows fixed display constants (`1,284`, `142`, `89`) so it looks
like a product in real use. Here, `useCounts()` in `src/lib/store.tsx` derives
everything. If you see a hard-coded total in this app, it is a bug.

Not yet done: the ingest is not wired to a running database, and the later
phases (AI extraction, generated briefs, connections, live X sync) are untouched
by design — Phase 1 ships on a real URL first.

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
3. Replace the seed arrays in `lib/store.tsx` with queries. No screen changes:
   the store already exposes a repository-shaped interface.

`lib/sources/x-api.ts` is written but should not be used until Phase 5 — bookmark
reads count toward the monthly post cap, and tiers move. Verify quotas in the X
developer console first.

## Demo mode

A signed-out demo is the highest-value thing for
portfolio purposes. Because the app currently renders from the seed, every route
already works with no auth — the pitch screen links to it as "See it with sample
data". Preserve that path when the database is wired in.
