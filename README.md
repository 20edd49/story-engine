# The Archives

A literary archive for independent fictional universes. Reyes-Bennett and Elias / Navarro are equal first-class worlds, with shared reading tools and distinct visual identities. Local artwork is CSS-generated; there are no remote fonts or stock-image dependencies.

## Run locally

Install Node.js 20.9 or newer (Node 24 LTS recommended), then:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use Cmd/Ctrl + K for command search. Production: `npm run build`, then `npm start`.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS with a custom editorial stylesheet, ESLint, and lucide-react. Pages are server components; directory filters and the search dialog are client components. Native dialog provides modal focus containment and Escape handling. System serif/sans fonts keep the archive independent of external font services.

## Project structure

```text
src/app/                         App Router pages, metadata, error boundaries, design tokens
  [universeSlug]/               Universe theme layout and overview
    [section]/                  Shared content directories
      [recordSlug]/             Shared record pages and scene reader
  search/                       Global or universe-scoped search
  universes/                    Universe collection
src/components/                 Shell, artwork, cards, filters, timeline, search
src/lib/domain.ts               Domain types and future extension models
src/lib/data/                   Centralized, canon-conscious TypeScript seed data
src/lib/repositories/archive.ts Scoped read/query boundary
tests/                         Repository integrity and isolation tests
```

## Domain architecture

Stable string IDs are independent of display names and slugs. All content belongs to a `universeId`. Events, scenes, canon, relationships, lore, quotes, and vehicles carry a `continuityId`. Universe configuration owns theme tokens, navigation, enabled modules, labels, and the default continuity. Disabled modules and invalid universe/record pairs return 404.

Separate models exist for characters, relationships, scenes, locations, events, canon rules, quotes, collections, tags, lore, and vehicles. Extension types reserve independent boundaries for books, chapters, arcs, organizations, artifacts, powers, and periods. Family visualization currently displays only supplied parent/child relationships; it is not a genealogical inference engine.

Scene text is stored as plain text with an explicit `bodyFormat`, then rendered as escaped paragraphs. Future rich text should use a validated, sanitized schema. Character and location pages derive linked events and scenes from foreign keys. No prose or relationship copies are maintained in pages.

## Continuity and canon

Main Canon is the default. The Reyes Starbucks, Speedster, and Divine continuities are separate records with empty histories until material is supplied. Timeline and scene filters select a single continuity. Search labels each result with universe and continuity where applicable. Cross-universe queries are scoped at the repository boundary.

Dates distinguish exact, approximate, year, and narrative precision. `sortDate` supports coarse sorting; it is not displayed as an invented exact date. Undated events live in an explicit group. Narrative ordering is archive presentation order, not an assertion of unknown chronology.

Scene samples are visibly marked **placeholder / not canon**, and stored as drafts. Elias has no invented locations, relationships, timeline events, or medical facts. Northstar is recorded as a supplied name with its classification intentionally unresolved. Immigration entries reproduce fictional story anchors; they are not legal guidance.

## Data access

UI pages call repositories rather than importing seed files. Queries require a universe ID; continuity-sensitive methods accept a continuity ID. The current local implementation is synchronous. Server pages can await asynchronous database implementations later, and pass serializable, limited results to interactive components.

The in-memory command index is suitable for the seed archive. Before storing thousands of scenes, move search to a server endpoint and paginate directory queries. Full prose is never included in the command search index.

## Future Persistence Layer

Supabase/Postgres would plug into `src/lib/repositories/archive.ts`, replacing local array queries with scoped table queries while retaining domain return types. Create tables matching the separate entities and junction tables for scene characters, event characters, relationship members, tags, and linked scenes. Use composite foreign keys or equivalent validation to ensure references share a universe. Enforce continuity ownership in the database as well as the repository.

Add authentication and row-level access policies before deploying private story material. “Personal collection” and no-index metadata are presentation, **not access control**; this local prototype has no login or authorization. Keep credentials on the server. An eventual `/admin` can call validated write services using these same domain boundaries.

Deferred: database/persistence, authentication, CMS editing, uploads, rich text editing, server-side full-text search, pagination, and fully interactive family trees. No database SDK is installed.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Browser checks use Playwright as a development-only dependency. `tests/browser-check.mjs` exercises the running app, including route links, continuity isolation, keyboard search, and mobile overflow. Run `npx playwright install chromium`, start the app, then `node tests/browser-check.mjs`. Screenshots and reports go to ignored `test-results/`.
