#!/usr/bin/env node
// Qloo API endpoint verification for Fieldnote. Pure Node.js (18+), zero dependencies.
// Usage: QLOO_API_KEY=... node scripts/test-qloo-endpoints.js

const API_KEY = process.env.QLOO_API_KEY;
const BASES = ['https://hackathon.api.qloo.com', 'https://staging.api.qloo.com'];
const DELAY_MS = 250;

if (!API_KEY) {
  console.error('QLOO_API_KEY env var is not set.');
  process.exit(2);
}

import fs from 'node:fs';
import nodePath from 'node:path';

const FIXTURE_DIR = nodePath.join(import.meta.dirname, 'fixtures');
const manifest = []; // {file, status, url}
const STEP_FILES = {
  1: 'base-url', 2: 'search-artist', 3: 'search-tv-show', 4: 'search-brand', 5: 'tags-indie-rock',
  6: 'insights-recommend-artists', 7: 'insights-demographics', 8: 'insights-taste-tags',
  9: 'insights-rank-shortlist', 10: 'insights-brands', 11: 'insights-heatmap',
  12: 'insights-location-artists', 13: 'insights-trends-high', 14: 'insights-explainability',
};
let currentStep = 0;
let stepSeq = 0;

// Save every raw response body, untruncated, so development can use real data.
function saveFixture(url, status, text, json) {
  try {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    stepSeq++;
    const u = new URL(url);
    const variant = [
      currentStep === 1 && u.hostname.split('.')[0],
      u.searchParams.get('types')?.replace('urn:entity:', ''),
      u.searchParams.has('feature.explainability') && 'explainability-on',
      u.searchParams.has('reason') && 'reason-on',
      currentStep === 11 && stepSeq,
      currentStep === 14 && !u.searchParams.has('feature.explainability') && !u.searchParams.has('reason') && 'default',
    ].filter(Boolean).join('-');
    const base = STEP_FILES[currentStep] || `step${currentStep}`;
    const file = `${String(currentStep).padStart(2, '0')}-${base}${variant ? '-' + variant : ''}.${json ? 'json' : 'txt'}`;
    fs.writeFileSync(nodePath.join(FIXTURE_DIR, file), json ? JSON.stringify(json, null, 2) : text);
    manifest.push({ file, status, url });
  } catch (e) {
    console.log(`  (fixture save failed: ${e.message})`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = []; // {n, name, pass, note}
const findings = {}; // critical findings
let BASE = null;

// ---------- helpers ----------
async function call(path, params = {}, base = BASE) {
  await sleep(DELAY_MS);
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY, Accept: 'application/json' } });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON */ }
    saveFixture(url.toString(), res.status, text, json);
    return { status: res.status, ok: res.ok, json, text, ms: Date.now() - t0, url: url.toString() };
  } catch (e) {
    return { status: 0, ok: false, json: null, text: String(e), ms: Date.now() - t0, url: url.toString(), error: e };
  }
}

// Describe the structure of a value: every path, type, and a sample.
function shape(v, path = '$', depth = 0, out = [], maxDepth = 7) {
  if (v === null) { out.push(`${path}: null`); return out; }
  if (Array.isArray(v)) {
    out.push(`${path}: array(len=${v.length})`);
    if (v.length && depth < maxDepth) shape(v[0], `${path}[0]`, depth + 1, out, maxDepth);
    return out;
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    out.push(`${path}: object{${keys.join(', ')}}`);
    if (depth < maxDepth) for (const k of keys) shape(v[k], `${path}.${k}`, depth + 1, out, maxDepth);
    return out;
  }
  let s = typeof v === 'string' ? JSON.stringify(v.length > 80 ? v.slice(0, 80) + '…' : v) : String(v);
  out.push(`${path}: ${typeof v} = ${s}`);
  return out;
}

function logResponse(r) {
  console.log(`  GET ${r.url.replace(API_KEY, '***')}`);
  console.log(`  -> HTTP ${r.status} (${r.ms}ms)`);
  if (!r.json) { console.log(`  body (non-JSON): ${r.text.slice(0, 400)}`); return; }
  const top = Array.isArray(r.json) ? 'TOP-LEVEL ARRAY' : 'WRAPPED OBJECT';
  console.log(`  top-level: ${top}`);
  console.log('  --- shape ---');
  for (const l of shape(r.json)) console.log('  ' + l);
  const raw = JSON.stringify(r.json, null, 2);
  console.log('  --- raw (first 1800 chars) ---');
  console.log(raw.slice(0, 1800).split('\n').map((l) => '  ' + l).join('\n'));
}

// Find the first array of objects that look like entities.
function findEntities(j, p = '$') {
  if (!j || typeof j !== 'object') return null;
  if (Array.isArray(j)) {
    if (j.length && j[0] && typeof j[0] === 'object' && !Array.isArray(j[0]) &&
        ('entity_id' in j[0] || 'id' in j[0])) return { path: p, items: j };
    for (let i = 0; i < Math.min(j.length, 1); i++) { const f = findEntities(j[i], `${p}[${i}]`); if (f) return f; }
    return null;
  }
  for (const k of Object.keys(j)) { const f = findEntities(j[k], `${p}.${k}`); if (f) return f; }
  return null;
}

const idOf = (e) => e && (e.entity_id ?? e.id);
const idFieldOf = (e) => (e && 'entity_id' in e ? 'entity_id' : e && 'id' in e ? 'id' : null);

// Walk the whole payload collecting numeric fields whose key looks score-ish.
function collectScores(j, p = '$', acc = []) {
  if (j && typeof j === 'object') {
    for (const [k, v] of Object.entries(j)) {
      const np = Array.isArray(j) ? `${p}[]` : `${p}.${k}`;
      if (typeof v === 'number' && /affinity|score|popularity|probability|weight|query|rank/i.test(k)) acc.push({ path: np, value: v });
      else if (v && typeof v === 'object') collectScores(v, np, acc);
    }
  }
  return acc;
}

function scoreSummary(j) {
  const m = new Map();
  for (const s of collectScores(j)) {
    const e = m.get(s.path) || { min: Infinity, max: -Infinity, n: 0 };
    e.min = Math.min(e.min, s.value); e.max = Math.max(e.max, s.value); e.n++;
    m.set(s.path, e);
  }
  return [...m.entries()].map(([p, e]) => `${p} [n=${e.n}, min=${e.min}, max=${e.max}]`);
}

function record(n, name, pass, note = '') {
  results.push({ n, name, pass, note });
  console.log(`  >> [${pass ? 'PASS' : 'FAIL'}] ${n}. ${name}${note ? ' — ' + note : ''}`);
}

function header(n, title) { currentStep = n; stepSeq = 0; console.log(`\n${'='.repeat(78)}\n${n}. ${title}\n${'='.repeat(78)}`); }

// ---------- tests ----------
(async () => {
  console.log(`Fieldnote Qloo endpoint verification — ${new Date().toISOString()}`);
  console.log(`Node ${process.version}, delay ${DELAY_MS}ms between calls`);

  // 1. Base URL discovery
  header(1, 'Base URL discovery');
  const working = [];
  for (const b of BASES) {
    const r = await call('/search', { query: 'Billie Eilish', types: 'urn:entity:artist', take: 1 }, b);
    console.log(`  ${b} -> HTTP ${r.status}${r.error ? ' (' + r.text + ')' : ''}  body: ${r.text.slice(0, 160).replace(/\s+/g, ' ')}`);
    if (r.ok) working.push(b);
  }
  if (!working.length) {
    record(1, 'Base URL discovery', false, 'no base URL authenticated');
    summary();
    return;
  }
  BASE = working[0];
  findings.baseUrl = BASE;
  findings.allWorkingBases = working;
  record(1, 'Base URL discovery', true, `using ${BASE} (working: ${working.join(', ')})`);

  // 2. Search artist
  header(2, 'Search artist (Billie Eilish) — urn:entity:artist');
  let artist = null;
  {
    const r = await call('/search', { query: 'Billie Eilish', types: 'urn:entity:artist', take: 5 });
    logResponse(r);
    const ents = findEntities(r.json);
    if (r.ok && ents) {
      artist = ents.items[0];
      findings.searchShape = Array.isArray(r.json) ? 'top-level array' : `wrapped object (entities at ${ents.path})`;
      findings.entityIdField = idFieldOf(artist);
      findings.entityKeys = Object.keys(artist);
      console.log(`  entities at ${ents.path}; id field "${findings.entityIdField}" = ${idOf(artist)}; name=${artist.name}`);
    }
    record(2, 'Search artist', !!artist, artist ? `${artist.name} (${idOf(artist)})` : `HTTP ${r.status}`);
  }

  // 3. Search TV show — discover the type URN
  header(3, 'Search TV show (Stranger Things) — type discovery');
  let show = null;
  {
    const candidates = ['urn:entity:tv_show', 'urn:entity:show', 'urn:entity:tv', 'urn:entity:tv_series', 'urn:entity:movie', null];
    const table = [];
    for (const t of candidates) {
      const p = { query: 'Stranger Things', take: 5 };
      if (t) p.types = t;
      const r = await call('/search', p);
      const ents = findEntities(r.json);
      const first = ents && ents.items[0];
      const typesSeen = ents ? [...new Set(ents.items.flatMap((e) => (Array.isArray(e.types) ? e.types : e.type ? [e.type] : [])))] : [];
      table.push({ type: t || '(none)', status: r.status, n: ents ? ents.items.length : 0, first: first ? `${first.name} (${idOf(first)})` : '-', typesSeen });
      console.log(`  types=${t || '(none)'} -> HTTP ${r.status}, ${ents ? ents.items.length : 0} results, first=${first ? first.name : '-'}, entity types seen=${JSON.stringify(typesSeen)}`);
      if (!r.ok && r.text) console.log(`     body: ${r.text.slice(0, 200).replace(/\s+/g, ' ')}`);
      if (first && !show && /stranger things/i.test(first.name || '')) {
        show = { entity: first, typeParam: t, typesSeen };
        if (t === candidates[candidates.length - 1] || true) { /* keep scanning to log all */ }
      }
    }
    if (show) {
      findings.tvShowTypeParam = show.typeParam || '(no type filter)';
      findings.tvShowEntityTypes = show.typesSeen;
      findings.tvShowEntity = { id: idOf(show.entity), name: show.entity.name };
      console.log('\n  Full first show entity:');
      console.log(JSON.stringify(show.entity, null, 2).slice(0, 1500).split('\n').map((l) => '  ' + l).join('\n'));
    }
    record(3, 'Search TV show', !!show, show ? `works with types=${show.typeParam || '(none)'}; entity types=${JSON.stringify(show.typesSeen)}` : 'no type matched "Stranger Things"');
  }

  // 4. Search brand
  header(4, 'Search brand (Nike) — urn:entity:brand');
  {
    const r = await call('/search', { query: 'Nike', types: 'urn:entity:brand', take: 3 });
    logResponse(r);
    const ents = findEntities(r.json);
    record(4, 'Search brand', r.ok && !!ents, ents ? `${ents.items[0].name} (${idOf(ents.items[0])})` : `HTTP ${r.status}`);
  }

  // 5. Tag search
  header(5, 'Tag search "indie rock" — /v2/tags');
  {
    const r = await call('/v2/tags', { 'filter.query': 'indie rock', take: 5 });
    logResponse(r);
    const ents = findEntities(r.json) || (r.json && r.json.results && r.json.results.tags ? { path: '$.results.tags', items: r.json.results.tags } : null);
    if (ents) {
      findings.tagShape = `${Array.isArray(r.json) ? 'top-level array' : 'wrapped'} at ${ents.path}; keys=${Object.keys(ents.items[0]).join(', ')}`;
      findings.sampleTagId = idOf(ents.items[0]) || ents.items[0].tag_id;
    }
    record(5, 'Tag search', r.ok && !!ents, ents ? `${ents.items.length} tags; first=${JSON.stringify(ents.items[0]).slice(0, 140)}` : `HTTP ${r.status}`);
  }

  // Pick seeds
  const seedShow = show ? show.entity : null;
  const seedArtist = artist;
  let seed = seedShow || seedArtist;
  if (!seed) {
    console.log('\nNo seed entity resolved; cannot run insights tests.');
    [6, 7, 8, 9, 10].forEach((n) => record(n, 'Insights (needs seed)', false, 'no seed'));
  } else {
    console.log(`\nSeed for insights: ${seed.name} (${idOf(seed)})${seedShow ? ' [TV show]' : ' [artist fallback]'}`);
  }

  // 6. Recommend artists
  let recs = [];
  if (seed) {
    header(6, 'Insights — recommend artists seeded by resolved entity');
    let r = await call('/v2/insights', { 'filter.type': 'urn:entity:artist', 'signal.interests.entities': idOf(seed), take: 10 });
    logResponse(r);
    let ents = findEntities(r.json);
    if ((!r.ok || !ents) && seedShow && seedArtist) {
      console.log('  Show-seeded recs failed; retrying with artist seed');
      seed = seedArtist;
      r = await call('/v2/insights', { 'filter.type': 'urn:entity:artist', 'signal.interests.entities': idOf(seed), take: 10 });
      logResponse(r);
      ents = findEntities(r.json);
    }
    if (ents) {
      recs = ents.items;
      findings.insightsShape = Array.isArray(r.json) ? 'top-level array' : `wrapped object (entities at ${ents.path})`;
      findings.insightsEntityIdField = idFieldOf(recs[0]);
      findings.insightsEntityKeys = Object.keys(recs[0]);
      findings.affinityScoreFields = scoreSummary(r.json);
      console.log('  score-like numeric fields:');
      findings.affinityScoreFields.forEach((s) => console.log('    ' + s));
      console.log('  names: ' + recs.map((e) => e.name).join(', '));
    }
    record(6, 'Recommend artists', r.ok && recs.length > 0, recs.length ? `${recs.length} artists (seed ${seed.name})` : `HTTP ${r.status}`);
  }

  // 7. Demographics
  if (seed) {
    header(7, 'Insights — demographics for seed');
    const r = await call('/v2/insights', { 'filter.type': 'urn:demographics', 'signal.interests.entities': idOf(seed) });
    logResponse(r);
    const hasDemo = r.ok && r.json && JSON.stringify(r.json).match(/age|gender/i);
    if (r.ok) findings.demographicsScores = scoreSummary(r.json);
    record(7, 'Demographics', !!hasDemo, hasDemo ? 'age/gender data present' : `HTTP ${r.status}, no age/gender`);
  }

  // 8. Taste tags
  if (seed) {
    header(8, 'Insights — taste tags for seed');
    const r = await call('/v2/insights', { 'filter.type': 'urn:tag', 'signal.interests.entities': idOf(seed), take: 10 });
    logResponse(r);
    const ents = findEntities(r.json) || (r.json && r.json.results && r.json.results.tags ? { path: '$.results.tags', items: r.json.results.tags } : null);
    if (ents) findings.tasteTagShape = `at ${ents.path}; keys=${Object.keys(ents.items[0]).join(', ')}`;
    record(8, 'Taste tags', r.ok && !!ents, ents ? `${ents.items.length} tags` : `HTTP ${r.status}`);
  }

  // 9. Rank shortlist
  if (seed) {
    header(9, 'Insights — rank shortlist using filter.results.entities');
    const shortlist = recs.slice(0, 4).map(idOf);
    if (seedArtist && !shortlist.includes(idOf(seedArtist))) shortlist.push(idOf(seedArtist));
    console.log(`  shortlist ids: ${shortlist.join(', ')}`);
    const r = await call('/v2/insights', {
      'filter.type': 'urn:entity:artist',
      'signal.interests.entities': idOf(seed),
      'filter.results.entities': shortlist.join(','),
    });
    logResponse(r);
    const ents = findEntities(r.json);
    if (ents) findings.rankScoreFields = scoreSummary(r.json);
    record(9, 'Rank shortlist', r.ok && !!ents, ents ? `${ents.items.length} ranked: ${ents.items.map((e) => e.name).join(', ')}` : `HTTP ${r.status}`);
  }

  // 10. Cross-domain brands
  if (seed) {
    header(10, 'Insights — cross-domain brands for seed');
    const r = await call('/v2/insights', { 'filter.type': 'urn:entity:brand', 'signal.interests.entities': idOf(seed), take: 10 });
    logResponse(r);
    const ents = findEntities(r.json);
    record(10, 'Cross-domain brands', r.ok && !!ents, ents ? `${ents.items.length}: ${ents.items.slice(0, 5).map((e) => e.name).join(', ')}` : `HTTP ${r.status}`);
  }

  // 11. Heatmap (NYC bounding box). Param naming for bounds is not verified, so try variants.
  header(11, 'Insights — heatmap, small NYC bounding box');
  {
    const wkt = 'POLYGON((-74.02 40.70, -73.95 40.70, -73.95 40.78, -74.02 40.78, -74.02 40.70))';
    const variants = [
      { label: 'filter.location (WKT POLYGON)', p: { 'filter.location': wkt } },
      { label: 'filter.location.bounds (min/max)', p: { 'filter.location.bounds': '-74.02,40.70,-73.95,40.78' } },
      { label: 'signal.location (WKT POLYGON)', p: { 'signal.location': wkt } },
      { label: 'signal.location (POINT) + radius', p: { 'signal.location': 'POINT(-73.98 40.75)', 'signal.location.radius': 2000 } },
    ];
    let okVariant = null;
    for (const v of variants) {
      const base = { 'filter.type': 'urn:heatmap', ...v.p };
      if (seed) base['signal.interests.entities'] = idOf(seed);
      const r = await call('/v2/insights', base);
      console.log(`\n  variant: ${v.label} -> HTTP ${r.status}`);
      if (r.ok) { logResponse(r); okVariant = v.label; findings.heatmapParams = Object.keys(v.p).join(', '); break; }
      console.log(`     body: ${r.text.slice(0, 250).replace(/\s+/g, ' ')}`);
    }
    record(11, 'Heatmap', !!okVariant, okVariant || 'all bounding-box variants failed');
  }

  // 12. Location-seeded artists
  header(12, 'Insights — location-seeded artists (signal.location.query=Los Angeles)');
  {
    const r = await call('/v2/insights', { 'filter.type': 'urn:entity:artist', 'signal.location.query': 'Los Angeles', take: 10 });
    logResponse(r);
    const ents = findEntities(r.json);
    record(12, 'Location-seeded artists', r.ok && !!ents, ents ? `${ents.items.length}: ${ents.items.slice(0, 5).map((e) => e.name).join(', ')}` : `HTTP ${r.status}`);
  }

  // 13. Trends bias
  header(13, 'Insights — bias.trends=high');
  {
    const p = { 'filter.type': 'urn:entity:artist', 'bias.trends': 'high', take: 10 };
    if (seed) p['signal.interests.entities'] = idOf(seed);
    const r = await call('/v2/insights', p);
    logResponse(r);
    const ents = findEntities(r.json);
    record(13, 'Trends bias', r.ok && !!ents, ents ? `${ents.items.length}: ${ents.items.slice(0, 5).map((e) => e.name).join(', ')}` : `HTTP ${r.status}`);
  }

  // 14. Explainability
  header(14, 'Explainability data');
  {
    const re = /explain|reason|why|overlap|shared|because|signal|query|affinity/i;
    const hits = [];
    const scan = (j, p = '$') => {
      if (j && typeof j === 'object') for (const [k, v] of Object.entries(j)) {
        const np = Array.isArray(j) ? `${p}[]` : `${p}.${k}`;
        if (re.test(k)) hits.push(np);
        if (v && typeof v === 'object') scan(v, np);
      }
    };
    let found = [];
    if (seed) {
      // Default response, then with explainability feature flag(s).
      const attempts = [
        { label: 'default', p: {} },
        { label: 'feature.explainability=true', p: { 'feature.explainability': 'true' } },
        { label: 'reason=true', p: { reason: 'true' } },
      ];
      for (const a of attempts) {
        const r = await call('/v2/insights', { 'filter.type': 'urn:entity:artist', 'signal.interests.entities': idOf(seed), take: 3, ...a.p });
        hits.length = 0;
        if (r.json) scan(r.json);
        const uniq = [...new Set(hits)];
        console.log(`  [${a.label}] HTTP ${r.status}; explain-ish fields: ${uniq.length ? uniq.join(', ') : '(none)'}`);
        if (r.ok && r.json) {
          const real = uniq.filter((h) => /explain|reason|why|overlap|shared|because/i.test(h));
          if (real.length) { found.push(`${a.label}: ${real.join(', ')}`); console.log('  --- explain payload sample ---'); console.log(JSON.stringify(r.json, null, 2).slice(0, 1500)); break; }
        } else if (r.text) console.log(`     body: ${r.text.slice(0, 200).replace(/\s+/g, ' ')}`);
      }
    }
    findings.explainability = found.length ? found : 'none found beyond affinity/query-type fields';
    record(14, 'Explainability data', found.length > 0, found.join(' | ') || 'no explainability fields returned (see affinity fields only)');
  }

  summary();
})();

function summary() {
  console.log(`\n${'#'.repeat(78)}\nSUMMARY\n${'#'.repeat(78)}`);
  for (const r of results) console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${String(r.n).padStart(2)}. ${r.name}${r.note ? ' — ' + r.note : ''}`);
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n  ${passed}/${results.length} passed`);
  try {
    fs.writeFileSync(nodePath.join(FIXTURE_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`\n  Saved ${manifest.length} raw responses to ${FIXTURE_DIR}`);
  } catch { /* ignore */ }
  console.log('\nCRITICAL FINDINGS');
  console.log(JSON.stringify(findings, null, 2));
  process.exit(passed === results.length ? 0 : 1);
}
