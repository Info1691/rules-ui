// Robust base-URL resolution so the app works from ANY path/host/iframe.
// Also: list filter, in-text highlight+Prev/Next, and export.

const $ = (id) => document.getElementById(id);
const els = {
  list: $('ruleList'),
  listSearch: $('listSearch'),
  text: $('ruleText'),
  jur: $('jurisdiction'),
  ref: $('reference'),
  src: $('source'),
  status: $('status'),
  textSearch: $('textSearch'),
  prev: $('prevBtn'),
  next: $('nextBtn'),
  printBtn: $('printBtn'),
  exportBtn: $('exportBtn')
};

// Determine base URL from this script tag (works regardless of how page is opened)
function getBaseUrl() {
  const script = document.currentScript || Array.from(document.scripts).find(s => /main\.js/.test(s.src));
  const url = new URL(script.src, location.href);
  // strip "main.js?..." -> keep trailing slash
  url.pathname = url.pathname.replace(/[^/]*main\.js.*$/, '');
  return url.toString();
}
const BASE = getBaseUrl();

// Build absolute URLs relative to the app root
const abs = (rel) => new URL(rel, BASE).toString();

// Preferred registry path + fallbacks
const REGISTRY_PATHS = [
  abs('data/rules/rules.json'),
  abs('data/rules.json'),
  abs('rules.json')
];

let ALL = [];
let FILTERED = [];
let ACTIVE_INDEX = -1;
let originalText = '';
let matches = [];
let matchIndex = -1;

// ---------- helpers ----------
async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-store' });
  const txt = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, txt, url };
}
async function loadRegistry(paths) {
  const errors = [];
  for (const p of paths) {
    try {
      const { ok, status, txt, url } = await fetchText(p);
      if (!ok) { errors.push(`${url} → ${status}`); continue; }
      if (/<!doctype html/i.test(txt) && /404|not found/i.test(txt)) { errors.push(`${url} → 404 HTML`); continue; }
      try { return { registry: JSON.parse(txt), used: url }; }
      catch (e) { errors.push(`${url} → JSON parse error: ${e.message}`); }
    } catch (e) { errors.push(`${p} → ${e.message}`); }
  }
  throw new Error(errors.join('\n'));
}
const esc = (s='') => s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const nameSafe = (s) => (s||'rule').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

// ---------- render list ----------
function renderList(items, active=0) {
  els.list.innerHTML = '';
  items.forEach((r,i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rule-btn' + (i===active ? ' active' : '');
    btn.textContent = `${r.title || 'Untitled'} — ${r.jurisdiction || ''}`;
    btn.addEventListener('click', () => selectRule(i));
    li.appendChild(btn);
    els.list.appendChild(li);
  });
}

// ---------- selection ----------
async function selectRule(i) {
  ACTIVE_INDEX = i;
  const rule = FILTERED[i];
  if (!rule) return;

  [...document.querySelectorAll('.rule-btn')].forEach((b, idx) => {
    b.classList.toggle('active', idx === i);
  });

  els.jur.textContent = rule.jurisdiction || '—';
  els.ref.textContent = rule.reference || '—';
  els.src.textContent = rule.source || '—';
  els.text.textContent = 'Loading…';
  els.status.textContent = '';

  const srcUrl = abs(rule.reference_url || rule.source);
  try {
    const { ok, status, txt, url } = await fetchText(srcUrl);
    if (!ok) throw new Error(`${url} → HTTP ${status}`);
    if (/<!doctype html/i.test(txt) && /404|not found/i.test(txt)) throw new Error(`${url} → 404 (not found)`);
    originalText = txt || '';
    els.text.innerHTML = esc(originalText);
    clearMatches();
    els.status.textContent = `Loaded: ${url}`;
  } catch (e) {
    els.text.textContent = `Failed to load rule text.\n${e.message}`;
    els.status.textContent = '';
    clearMatches();
  }
}

// ---------- search (list) ----------
els.listSearch.addEventListener('input', () => {
  const q = (els.listSearch.value || '').toLowerCase();
  FILTERED = !q ? [...ALL] :
    ALL.filter(r => [r.title, r.jurisdiction, r.reference, r.source]
      .map(x => (x||'').toLowerCase()).join(' ').includes(q));
  renderList(FILTERED, 0);
  if (FILTERED.length) selectRule(0);
  else {
    els.text.textContent = 'No matches.';
    els.jur.textContent = '—'; els.ref.textContent = '—'; els.src.textContent = '—';
    clearMatches();
  }
});

// ---------- search (in-text) ----------
function clearMatches(){ matches = []; matchIndex = -1; }
function highlight(query) {
  if (!query) { els.text.innerHTML = esc(originalText); clearMatches(); return; }
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi');
  els.text.innerHTML = esc(originalText).replace(re,'<mark>$1</mark>');
  matches = Array.from(els.text.querySelectorAll('mark'));
  matchIndex = matches.length ? 0 : -1;
  if (matchIndex >= 0) jumpTo(matchIndex);
}
function jumpTo(i){ if (matches.length) matches[i].scrollIntoView({behavior:'smooth', block:'center'}); }
els.textSearch.addEventListener('input', () => highlight(els.textSearch.value));
els.prev.addEventListener('click', () => { if (matches.length){ matchIndex=(matchIndex-1+matches.length)%matches.length; jumpTo(matchIndex);} });
els.next.addEventListener('click', () => { if (matches.length){ matchIndex=(matchIndex+1)%matches.length; jumpTo(matchIndex);} });

// ---------- actions ----------
els.printBtn.addEventListener('click', () => window.print());
els.exportBtn.addEventListener('click', () => {
  const rule = FILTERED[ACTIVE_INDEX];
  if (!rule) return;
  const blob = new Blob([originalText], { type:'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href:url, download:`${nameSafe(rule.reference || rule.title)}.txt` });
  document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
});

// ---------- init ----------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { registry, used } = await loadRegistry(REGISTRY_PATHS);
    const arr = Array.isArray(registry) ? registry
              : (Array.isArray(registry?.rules) ? registry.rules : null);
    if (!arr) throw new Error('Registry must be an array or { "rules": [...] }');

    ALL = arr.map(r => ({
      id: r.id || '',
      title: r.title || '',
      jurisdiction: r.jurisdiction || r.jurisdiction || '',
      reference: r.reference || '',
      source: r.source || '',
      reference_url: r.reference_url || r.source || ''
    }));

    FILTERED = [...ALL];
    renderList(FILTERED, 0);
    if (FILTERED.length) await selectRule(0);
    els.status.textContent = `Loaded registry: ${used}`;
  } catch (e) {
    els.text.textContent = `Error loading rules.json\n${e.message}`;
    els.status.textContent = '';
  }
});
