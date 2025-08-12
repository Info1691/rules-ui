// Rules Repository — FULL main.js (expects data/rules/rules.json)

const PATHS = { JSON: 'data/rules/rules.json' };

const $ = (id) => document.getElementById(id);
const els = {
  list: $('ruleList'),
  search: $('searchBox'),
  text: $('ruleText'),
  jur: $('jurisdiction'),
  ref: $('reference'),
  src: $('source'),
  printBtn: $('printBtn'),
  exportBtn: $('exportBtn'),
  status: $('status')
};

let ALL = [];         // all rules from JSON
let FILTERED = [];    // search-filtered list
let ACTIVE_INDEX = -1;

// ---------- helpers ----------
async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  const raw = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  // Guard 404 HTML served by Pages
  if (/<!doctype html/i.test(raw) && /404|not found/i.test(raw)) {
    throw new Error(`${path} → 404 (file not found)`);
  }
  try { return JSON.parse(raw); }
  catch (e) { throw new Error(`JSON parse error in ${path}: ${e.message}`); }
}

async function fetchTextStrict(path) {
  const res = await fetch(path, { cache: 'no-store' });
  const body = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  if (/<!doctype html/i.test(body) && /404|not found/i.test(body)) {
    throw new Error(`${path} → 404 (text file not found)`);
  }
  return body;
}

function nameSafe(s) {
  return (s || 'rule')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------- rendering ----------
function renderList(items, activeIdx = 0) {
  els.list.innerHTML = '';
  items.forEach((r, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rule-btn' + (i === activeIdx ? ' active' : '');
    btn.textContent = `${r.title || 'Untitled'} — ${r.jurisdiction || ''}`;
    btn.addEventListener('click', () => selectRule(i));
    li.appendChild(btn);
    els.list.appendChild(li);
  });
}

function updateMeta(rule) {
  els.jur.textContent = rule?.jurisdiction || '—';
  els.ref.textContent = rule?.reference || '—';
  els.src.textContent = rule?.source || '—';
}

// ---------- selection ----------
async function selectRule(i) {
  ACTIVE_INDEX = i;
  const rule = FILTERED[i];
  if (!rule) return;

  // highlight
  [...document.querySelectorAll('.rule-btn')].forEach((b, idx) => {
    b.classList.toggle('active', idx === i);
  });

  updateMeta(rule);
  els.text.textContent = 'Loading…';
  els.status.textContent = '';

  const url = rule.reference_url || rule.source;
  if (!url) {
    els.text.textContent = 'This rule has no reference_url.';
    return;
  }

  try {
    const t = await fetchTextStrict(url);
    els.text.textContent = t || '(empty file)';
    els.status.textContent = `Loaded: ${url}`;
  } catch (e) {
    els.text.textContent = `Failed to load rule text.\n${e.message}`;
    els.status.textContent = '';
  }
}

// ---------- search ----------
function applySearch() {
  const q = (els.search.value || '').trim().toLowerCase();
  if (!q) {
    FILTERED = [...ALL];
  } else {
    FILTERED = ALL.filter(r => {
      const hay = [
        r.title, r.jurisdiction, r.reference, r.source
      ].map(x => (x || '').toLowerCase()).join(' ');
      return hay.includes(q);
    });
  }
  renderList(FILTERED, 0);
  if (FILTERED.length) selectRule(0);
  else {
    els.text.textContent = 'No matches.';
    els.jur.textContent = '—';
    els.ref.textContent = '—';
    els.src.textContent = '—';
    els.status.textContent = '';
  }
}

// ---------- actions ----------
function exportToTxt() {
  const active = FILTERED[ACTIVE_INDEX];
  const content = els.text.textContent || '';
  const fn = `${nameSafe(active?.reference || active?.title)}.txt`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: fn });
  document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
}

// ---------- init ----------
async function init() {
  try {
    const data = await fetchJSON(PATHS.JSON);
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.rules) ? data.rules : null);
    if (!arr) throw new Error('rules.json must be an array or { "rules": [...] }');

    ALL = arr.map(r => ({
      id: r.id || '',
      title: r.title || '',
      jurisdiction: r.jurisdiction || '',
      reference: r.reference || '',
      source: r.source || '',
      reference_url: r.reference_url || r.source || ''
    }));

    FILTERED = [...ALL];
    renderList(FILTERED, 0);
    if (FILTERED.length) await selectRule(0);
  } catch (e) {
    // Friendly failure panel
    els.text.textContent = `Failed to load rules.json\n${e.message}`;
    els.status.textContent = '';
  }

  // bind events
  els.search.addEventListener('input', applySearch);
  els.printBtn.addEventListener('click', () => window.print());
  els.exportBtn.addEventListener('click', exportToTxt);
}

document.addEventListener('DOMContentLoaded', init);
