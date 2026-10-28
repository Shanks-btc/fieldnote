// Parses every captured Qloo response in scripts/fixtures/ through the Zod schemas in
// lib/validation/qloo.ts. Run: node scripts/validate-fixtures.mjs  (Node 22.18+ strips TS types).
import fs from "node:fs";
import path from "node:path";
import * as q from "../lib/validation/qloo.ts";

const dir = path.join(import.meta.dirname, "fixtures");

const CASES = {
  "02-search-artist-artist.json": q.searchResponseSchema,
  "03-search-tv-show-tv_show.json": q.searchResponseSchema,
  "03-search-tv-show-movie.json": q.searchResponseSchema,
  "03-search-tv-show.json": q.searchResponseSchema,
  "04-search-brand-brand.json": q.searchResponseSchema,
  "05-tags-indie-rock.json": q.tagSearchResponseSchema,
  "06-insights-recommend-artists.json": q.insightsEntitiesResponseSchema,
  "07-insights-demographics.json": q.insightsDemographicsResponseSchema,
  "08-insights-taste-tags.json": q.insightsTagsResponseSchema,
  "09-insights-rank-shortlist.json": q.insightsEntitiesResponseSchema,
  "10-insights-brands.json": q.insightsEntitiesResponseSchema,
  "11-insights-heatmap-1.json": q.insightsHeatmapResponseSchema,
  "12-insights-location-artists.json": q.insightsEntitiesResponseSchema,
  "13-insights-trends-high.json": q.insightsEntitiesResponseSchema,
  "14-insights-explainability-default.json": q.insightsEntitiesResponseSchema,
  "14-insights-explainability-explainability-on.json": q.insightsEntitiesResponseSchema,
};

let failed = 0;
for (const [file, schema] of Object.entries(CASES)) {
  const json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const r = schema.safeParse(json);
  if (r.success) console.log(`PASS  ${file}`);
  else {
    failed++;
    console.log(`FAIL  ${file}`);
    for (const i of r.error.issues.slice(0, 5)) console.log(`        ${i.path.join(".")}: ${i.message}`);
  }
}
console.log(failed ? `\n${failed} fixture(s) failed` : "\nAll fixtures match their schemas");
process.exit(failed ? 1 : 0);
