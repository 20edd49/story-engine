# Supabase read wiring

## Files changed

- `src/lib/supabase/client.ts`: browser client using `createBrowserClient`.
- `src/lib/supabase/server.ts`: request-scoped server client using `createServerClient` and async Next.js `cookies()`.
- `src/lib/repositories/archive.ts`: Supabase-backed reads and normalized row mapping.
- `tests/archive.test.ts`: async live-read repository checks.
- `CODEX_SUPABASE_WIRING.md`: this summary.

## Repository methods migrated

- `universeRepository`: `list`, `bySlug`, `byId`.
- `continuityRepository`: `list`, `byId`.
- `characterRepository`: `list`, `bySlug`, `byId`.
- `timelineRepository`: `list`.
- `sceneRepository`: `list`, `bySlug`, `byId`.
- `archiveRepository`: `relationships`, `locations`, `canon`, `lore`, `vehicles`, `quotes`.
- `tagRepository`: `list` (new read surface for the existing tags table).
- `searchArchive`: now builds the global index from live repository reads.

Link rows reconstruct relationship members and character IDs, location occupants, event characters/scenes/tags, scene characters/POV/tags, character tags, and vehicle scenes/events. Queries scope primary records by universe and, where applicable, continuity. Linked event/scene IDs are also checked against the parent's continuity.

## Live data and schema comparison

The live database contains 2 universes, 5 continuities, 12 characters, 16 timeline events, 2 scenes, 3 relationships, 8 canon rules, 2 lore entries, and 3 vehicles. Both universe IDs and slugs match the local seed. The core SQL columns map to the current domain shapes; optional SQL NULL values are omitted from optional TypeScript fields. Arrays represented by SQL link tables are reconstructed by the repository. No blocking schema mismatch was found. Quotes and several link tables currently contain zero rows, so their mapping is implemented but has no populated live example to compare.

The live schema has `user_story_progress`, but progress remains a local `lastActiveSceneIds` fallback until Supabase Auth supplies a user identity. No RLS or policy changes were made.

## Remaining mock dependencies

- `progressRepository` uses the two local last-active-scene IDs, then resolves the scene and universe through Supabase.
- The four files in `src/lib/data/` remain as retained seed/reference data. No application repository or search read imports them.

## Verification

- ESLint: passed.
- TypeScript `tsc --noEmit`: passed.
- Next.js production build: passed.
- Live Supabase repository tests: 3 passed, including both universes, scoping, normalized links, and search labels.
- Built app HTTP smoke checks: 200 for `/`, both universes, characters, timeline, scenes, relationships, canon, lore, vehicles, and search.

Commands used: `node node_modules/eslint/bin/eslint.js .`, `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/next/dist/bin/next build`, `npm test`, and `node node_modules/next/dist/bin/next start -p 3100`. Node was invoked by absolute path or added to PATH because `npm` and `node` were initially absent from this shell's PATH.

Initial live HTTP checks failed with `fetch failed` inside the network-restricted sandbox; running the read-only check outside it succeeded. An intermediate build exposed swallowed Next.js dynamic-rendering detection in the standalone test path; that was corrected, and the final build passes. The sandboxed `tsx` run also failed with a Windows `uv_os_get_passwd` error; the unrestricted live test run passed.

Follow-up: add Auth and per-user progress persistence when ready. Compare future populated quote and currently empty link-table output with the UI before removing the retained seed files.
