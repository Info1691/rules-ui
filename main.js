// Rules Repository — resilient loader with dual-path JSON resolution.

const PATH_CANDIDATES = [
  'data/rules/rules.json', // preferred structure
  'data/rules.json',       // legacy structure
  'rules.json'             // root fallback
];

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

let ALL = [];
let FILTERED = [];
let ACTIVE_INDEX = -1;

// ---------- fetch helpers ----------
async function fetchTextRaw(path) {
  const res = await fetch(path, { cache: 'no-store' });
  const txt = await res.text();
  return { ok: res.ok, status: res.status, statusText: res.statusText, txt, path };
}

async function fetchJSONWithFallback(paths) {
  const errors = [];
  for (const p of paths) {
    try {
      const { ok, status, statusText, txt, path } = await fetchTextRaw(p);
      if (!ok) { errors.push(`${path} → ${status} ${statusText}`); continue; }
      if (/<!doctype html/i.test(txt) && /404|not found/i.test(txt)) {
        errors.push(`${path} → 404 HTML`); continue;
      }
      try {
        const json = JSON.parse(txt);
        return { json, usedPath: p };
      } catch (e) {
        errors.push(`${p} → JSON parse error: ${e.message}`);
      }
    } catch (e) {
      errors.push(`${p} → ${e.message}`);
    }
  }
  throw new Error(errors.join('\n'));
}

async function fetchTextStrict(path) {
  const { ok, status, statusText, txt } = await fetchTextRaw(path);
  if (!ok) throw new Error(`${path} → ${status} ${statusText}`);
  if (/<!doctype html/i.test(txt) && /404|not found/i.test(txt)) {
    throw new Error(`${path} → 404 (file not found)`);
  }
  return txt;
}

function nameSafe(s) {
  return (s || 'rule').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

  [...document.querySelectorAll('.rule-btn')].forEach((b, idx) => {
    b.classList.toggle('active', idx === i);
  });

  updateMeta(rule);
  els.text.textContent = 'Loading…';
  els.status.textContent = '';

  const url = rule.reference_url || rule.source;
  if (!url) { els.text.textContent = 'This rule has no reference_url.'; return; }

  try {
    const t = await fetchTextStrict(url);
    els.text.textContent = t || '(empty file)';
    els.status.textContent = `Loaded: ${url}`;
  } catch (e) {
    els.text.textContent = `Failed to load rule text.\n${e.message}`;
  }
}

// ---------- search ----------
function applySearch() {
  const q = (els.search.value || '').trim().toLowerCase();
  FILTERED = !q ? [...ALL] :
    ALL.filter(r => {
      const hay = [r.title, r.jurisdiction, r.reference, r.source]
        .map(x => (x || '').toLowerCase()).join(' ');
      return hay.includes(q);
    });
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
    const { json, usedPath } = await fetchJSONWithFallback(PATH_CANDIDATES);
    const arr = Array.isArray(json) ? json : (Array.isArray(json?.rules) ? json.rules : null);
    if (!arr) throw new Error('rules registry must be an array or { "rules": [...] }');
    els.status.textContent = `Loaded registry: ${usedPath}`;

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
    els.text.textContent = `Failed to load rules.json\n${e.message}`;
    els.status.textContent = '';
  }

  els.search.addEventListener('input', applySearch);
  els.printBtn.addEventListener('click', () => window.print());
  els.exportBtn.addEventListener('click', exportToTxt);
}

document.addEventListener('DOMContentLoaded', init);
