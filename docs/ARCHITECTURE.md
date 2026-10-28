# Fieldnote — System Architecture

## Overview

Fieldnote is a 5-page Next.js web app with a server-side agentic workflow
that chains Qloo API calls to produce culturally-grounded music sync
recommendations. The LLM layer interprets briefs and synthesizes
explanations. Qloo provides the taste intelligence. Spotify provides
track metadata and previews.

No database required for the hackathon. State lives in memory per session.
No auth required — judges must be able to try it immediately.

---

## Pages

1. **Landing** (`/`)
   - Value prop, stats row, product preview, how it works, footer
   - Pre-filled "Try the demo" CTA that loads a sample brief
   - Teampot-style: white, clean, black type

2. **Brief builder** (`/brief`)
   - Form for the creative brief
   - Pre-filled example (Stranger Things S5 transition scene)
   - Submit triggers the agent workflow
   - Fields: project name, project type, scene description, target audience,
     geographic market, mood/emotion, genre preferences, cultural references,
     exclusions

3. **Research view** (`/brief/[id]/research`)
   - Live timeline showing each agent step as it executes
   - Each step shows: what it's doing, which Qloo endpoint it called,
     what came back (entity count, status)
   - Steps turn from pending → running → complete/failed
   - Real steps only — no fake loading

4. **Results workspace** (`/brief/[id]/results`)
   - Ranked shortlist of 5-10 artists/tracks
   - Each result: track name, artist, album art (Spotify), preview button,
     creative fit score, cultural fit score, audience score, composite score
   - Expandable evidence panel per result: Qloo taste tags, shared cultural
     entities, geographic overlap, trend direction
   - "Compare without Qloo" toggle

5. **Compare view** (`/brief/[id]/compare`)
   - Side by side: LLM-only recommendations vs Qloo-grounded recommendations
   - Same brief, same format, different rankings
   - Visual diff showing what Qloo changed and why

---

## Architecture layers

```
┌─────────────────────────────────────────────┐
│                  FRONTEND                    │
│        Next.js App Router + shadcn/ui        │
│    Pages: Landing, Brief, Research, Results   │
└──────────────────┬──────────────────────────┘
                   │ Server Actions / API Routes
┌──────────────────▼──────────────────────────┐
│              AGENT ORCHESTRATOR              │
│     Parses brief → plans steps → executes    │
│     Returns structured results + evidence    │
└───┬──────────┬──────────┬──────────┬────────┘
    │          │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ QLOO  │ │  LLM  │ │SPOTIFY│ │SCORING│
│CLIENT │ │ADAPTER│ │CLIENT │ │ENGINE │
└───────┘ └───────┘ └───────┘ └───────┘
```

---

## Module breakdown

### `lib/qloo/` — Qloo API client

**`client.ts`**
- Authenticated HTTP client for Qloo API
- Base URL: `hackathon.api.qloo.com` (verified)
- Auth: `X-Api-Key` header from env
- Rate limiting: 5 calls/sec with 250ms delay queue
- Retry: once on 429 (wait 1s), once on 5xx, never on 401/403
- Timeout: 15s per request
- Returns typed responses, never raw JSON

**`search.ts`**
- `searchEntities(query, type, take)` — GET /search
- Handles `needs_input` (ambiguous results) by returning candidates
- Types: artist, movie, tv_show (`urn:entity:tv_show`, verified), brand, place
- Search can return several entities with the same name (two "Stranger Things"); use `pickBestMatch` (exact name, then highest popularity)

**`insights.ts`**
- `recommendEntities(seedIds, targetType, options)` — GET /v2/insights
- `getAudienceDemographics(entityIds)` — filter.type=urn:demographics
- `getTasteTags(entityIds)` — filter.type=urn:tag; over-fetches, then keeps only music/media/culture tags (`tagFilter.ts`)
- `rankShortlist(seedIds, optionIds, optionType)` — filter.results.entities
- `getHeatmap(entityId, boundingBox)` — filter.type=urn:heatmap
- `getLocationArtists(city, options)` — signal.location.query
- All return typed result objects with affinity scores

**`tags.ts`**
- `searchTags(query)` — GET /v2/tags
- Returns tag IDs for genre/style filtering (`results.tags[]`, field `id`)

**`types.ts`**
- TypeScript interfaces for all Qloo request params and response shapes, matched to `scripts/fixtures/`
- Entity type URN constants

**`normalize.ts`** / **`tagFilter.ts`**
- Map raw search/insight entities and tags to app-level `Entity` / `Tag` (including `spotifyId` and `imageUrl`)
- `isCultureTag` drops restaurant, place and brand tags from the taste profile

### `lib/agent/` — Workflow orchestrator

**`orchestrator.ts`**
- Takes a parsed brief, returns a complete research result
- Manages step sequencing and dependencies
- Emits step status events for the research timeline UI
- Handles partial failures (some steps fail, others succeed)

**`steps.ts`**
- Each step is a typed function:
  1. `resolveProject` — search for the show/film/brand entity
  2. `resolveReferences` — search for any cultural references the user named
  3. `getProjectTasteProfile` — taste tags for the project entity
  4. `getProjectDemographics` — audience demographics
  5. `recommendArtists` — get artist recommendations seeded by project
  6. `enrichWithSpotify` — match Qloo artists to Spotify for metadata
  7. `scoreAndRank` — run the scoring engine
  8. `generateExplanations` — LLM writes evidence summaries
- Each step returns a typed result + status (ok/empty/partial/error)
- Each step records which Qloo endpoint it called (for transparency)

**`types.ts`**
- `Brief` — parsed creative brief
- `ResearchStep` — name, status, result, qlooEndpoint, duration
- `ResearchResult` — complete output with all steps

### `lib/scoring/` — Recommendation scoring engine

**`engine.ts`**
- Three scoring dimensions:
  1. **Creative fit** (0-1): LLM evaluates how well the artist matches
     the brief's mood, genre, tempo, scene description
  2. **Cultural fit** (0-1): Qloo affinity score between the project entity
     and the recommended artist — this comes directly from Qloo, not invented
  3. **Audience relevance** (0-1): derived from demographic overlap and
     geographic overlap data from Qloo
- Composite score: weighted average, weights configurable
- Default weights: creative 0.3, cultural 0.5, audience 0.2
  (cultural weighted highest because Qloo is the differentiator)

**`normalize.ts`**
- `minMaxRescale`: Qloo affinity is 0-1 but clustered (0.924-0.935 in a top-10), so cultural fit is rescaled within each result set to spread 0-1 (relative: 1 = best of this set)
- `normalizeSigned`: demographics are signed (-1..1, 0 = average), mapped to 0-1 with 0.5 = average
- Handles missing data (null, not zero; the composite re-weights over what is present)

**`compare.ts`**
- Runs the same brief through LLM-only (no Qloo data)
- Produces a parallel shortlist for the comparison view
- Shows which artists moved up/down/appeared/disappeared with Qloo

### `lib/spotify/` — Spotify metadata client

**`client.ts`**
- Spotify Web API client (client credentials flow — no user login)
- `getTopTracks(spotifyArtistId, market)` — tracks with preview URLs. This is the only job.
- Auth: client ID + secret from env, token auto-refresh
- No search or name matching: Qloo returns `external.spotify[0].id` and `properties.image.url` for every artist

### `lib/llm/` — LLM adapter

**`adapter.ts`**
- Provider-agnostic interface
- Currently: OpenAI GPT-4o or Anthropic Claude
- Two jobs:
  1. Parse brief into structured creative requirements
  2. Generate evidence-based explanations for each recommendation
- System prompts that constrain the LLM to use provided data only
- Never asks the LLM to invent scores or cultural connections

**`prompts.ts`**
- System prompts for brief parsing and explanation generation
- Structured output schemas (JSON mode)

### `lib/validation/` — Schemas

**`brief.ts`** — Zod schema for creative brief input
**`results.ts`** — Zod schema for recommendation output
**`qloo.ts`** — Zod schemas for Qloo API responses (filled after testing)

### `app/` — Next.js pages and routes

**`app/page.tsx`** — Landing page (static, no API calls)
**`app/brief/page.tsx`** — Brief builder form
**`app/brief/[id]/research/page.tsx`** — Research timeline (server-sent events)
**`app/brief/[id]/results/page.tsx`** — Results workspace
**`app/brief/[id]/compare/page.tsx`** — Comparison view
**`app/api/research/route.ts`** — POST endpoint that runs the agent
**`app/api/research/[id]/stream/route.ts`** — SSE endpoint for live progress

### `components/` — UI components

**Layout:** `Navbar`, `Footer`, `PageSection`, `StatsRow`
**Brief:** `BriefForm`, `BriefField`, `ExampleBriefButton`
**Research:** `ResearchTimeline`, `ResearchStep`, `StepStatus`
**Results:** `ResultsTable`, `ResultRow`, `ScoreBar`, `EvidencePanel`,
  `AudioPreview`, `AlbumArt`
**Compare:** `CompareView`, `RankingDiff`
**Shared:** `Badge`, `Divider`, `MonoValue`

---

## Data flow: brief submission to results

```
User fills brief form
  ↓
POST /api/research { brief }
  ↓
Orchestrator starts — opens SSE stream for progress
  ↓
Step 1: searchEntities("Stranger Things", "movie/tv_show")
  → Returns entity ID + confirms it's in Qloo
  → If ambiguous: return candidates, ask user (needs_input)
  ↓
Step 2: searchEntities for any cultural references user named
  → Resolve "indie film", "art rock" to tag IDs via /v2/tags
  ↓
Step 3: GET /v2/insights?filter.type=urn:tag&signal.interests.entities=<show_id>
  → Returns taste tags describing the show's audience
  ↓
Step 4: GET /v2/insights?filter.type=urn:demographics&signal.interests.entities=<show_id>
  → Returns age/gender affinity for the audience
  ↓
Step 5: GET /v2/insights?filter.type=urn:entity:artist&signal.interests.entities=<show_id>&take=15
  → Returns recommended artists with affinity scores
  ↓
Step 6: For top 10 artists, fetch top tracks by the Spotify ID Qloo returned
  → Preview URLs, track names (image from Qloo as fallback)
  ↓
Step 7: Scoring engine runs:
  - Cultural fit = Qloo affinity score (direct from API)
  - Creative fit = LLM evaluates artist vs brief (mood, genre match)
  - Audience relevance = demographic + optional geographic data
  - Composite = weighted average
  ↓
Step 8: LLM generates one-paragraph explanation per recommendation
  → Constrained to cite only data from steps 3-5
  ↓
Return ranked shortlist with scores + evidence + Spotify metadata
```

---

## Environment variables

```env
# Qloo (required)
QLOO_API_KEY=            # Hackathon API key, server-side only

# Spotify (required for album art + previews)
SPOTIFY_CLIENT_ID=       # From developer.spotify.com
SPOTIFY_CLIENT_SECRET=   # From developer.spotify.com

# LLM (required for brief parsing + explanations)
OPENAI_API_KEY=          # Or ANTHROPIC_API_KEY

# App
NEXT_PUBLIC_APP_URL=     # For production deployment
```

---

## Deployment

- **Platform:** Vercel (Next.js native, free hobby tier)
- **Qloo calls:** Server-side only (API routes / server actions)
- **Key security:** All API keys in Vercel env vars, never in client bundle
- **Build:** `next build` must pass with zero errors
- **Hosting requirement met:** Live URL judges can visit

---

## Implementation status (core loop)

Live: brief form -> `POST /api/research` -> orchestrator (6 steps: resolveProject, getProjectTasteProfile,
getProjectDemographics, recommendArtists, scoreAndRank, generateExplanations) -> SSE
`/api/research/[id]/stream` -> `GET /api/research/[id]/results`. Sessions are in server memory
(`lib/agent/store.ts`); the finished result is also cached in the browser's sessionStorage.
Not yet built: Spotify previews, LLM brief parsing/explanations (explanations are data-derived placeholders),
the compare view, creative-fit scoring, cultural-reference resolution, geographic overlap.

## Verified API behaviour

From `scripts/test-qloo-endpoints.js` (2026-10-22). Raw responses are in `scripts/fixtures/`;
`node scripts/validate-fixtures.mjs` checks them against `lib/validation/qloo.ts`.

1. TV show type: `urn:entity:tv_show` (`show`, `tv`, `tv_series` return 400)
2. Entity ID field: `entity_id` everywhere. Insights entities use `subtype` for the real type (`type` is just `urn:entity`); search entities use `types[]`
3. Affinity: 0-1 float at `query.affinity`, tightly clustered, so rescale per result set. /search results have no affinity
4. Wrappers: /search `{results: [...]}`; /v2/tags `{results: {tags: [...]}}` (field `id`); insights `{success, results: {entities|tags|demographics|heatmap}}` (tags use `tag_id`)
5. Demographics are signed (-1..1)
6. `urn:tag` insights return tags for every entity type (places, brands, podcasts); filter to culture tags
7. `bias.trends=high` works and lowers affinity values (0.935 -> 0.727 for the top artist)
8. Explainability: `feature.explainability=true` adds `query.explainability["signal.interests.entities"] = [{entity_id, score}]` per entity and an aggregate `effect_on_top{3,5,10}_recs` block at the top-level `query`. With a single seed every score is 1, so it only becomes informative with several seeds
9. Heatmap: `filter.location` with a WKT POLYGON (~1.9k points for a small NYC box, ~800KB)
10. Every artist carries `external.spotify[0].id` and `properties.image.url`
11. Some entities lack `popularity`, and a few tags carry only `type` (no id/name)

---

## Build order (after key arrives + tests pass)

Phase 1: Scaffolding
  - Next.js + TypeScript + Tailwind + shadcn/ui setup
  - Folder structure matching this architecture
  - Environment config + .env.example

Phase 2: Qloo client
  - Typed client with rate limiting
  - All endpoint functions based on verified test results
  - Unit tests with mocked responses

Phase 3: Agent orchestrator
  - Step definitions and sequencing
  - SSE streaming for progress
  - Error handling for partial failures

Phase 4: Scoring engine
  - Three-dimension scoring
  - Normalization
  - Compare mode (with/without Qloo)

Phase 5: UI
  - Landing page (Teampot style)
  - Brief form with pre-filled example
  - Research timeline
  - Results table with evidence panels
  - Compare view

Phase 6: Spotify integration
  - Artist matching
  - Album art + preview URLs

Phase 7: LLM integration
  - Brief parsing
  - Explanation generation

Phase 8: Polish + deploy
  - Error states, loading states, empty states
  - CSV export
  - README + LICENSE
  - Vercel deployment
  - Final testing
