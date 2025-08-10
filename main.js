/* Rules Repository — loads rules.json and displays referenced text */

const PATHS = {
  RULES_JSON: 'rules.json' // rules.json sits next to this file per your repo
};

const els = {
  search: document.getElementById('searchBox'),
  list: document.getElementById('rulesList'),
  ruleTitle: document.getElementById('ruleTitle'),
  jurisdiction: document.getElementById('jurisdiction'),
  reference: document.getElementById('reference'),
  sourceLink: document.getElementById('sourceLink'),
  ruleText: document.getElementById('ruleText')
};

let allRules = [];
let currentIndex = -1;

// -------- Fetch helpers --------
async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  return res.json();
}
async function fetchText(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  return res.text();
}

// -------- Rendering --------
function renderList(rules, activeIdx = -1) {
  els.list.innerHTML = '';
  if (!rules.length) {
    els.list.innerHTML = '<li><em>No rules match your search.</em></li>';
    return;
  }
  rules.forEach((r, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = i === activeIdx ? 'active' : '';
    btn.innerHTML = `<strong>${r.title || '(untitled)'}</strong><br/><small>${r.jurisdiction || ''}</small>`;
    btn.addEventListener('click', () => selectRuleById(r.__id));
    li.appendChild(btn);
    els.list.appendChild(li);
  });
}

function updateMeta(rule) {
  els.ruleTitle.textContent = rule.title || '(untitled)';
  els.jurisdiction.textContent = rule.jurisdiction || '—';
  els.reference.textContent = rule.reference || '—';

  // Prefer reference_url (your repo uses this), fallback to source
  const href = rule.reference_url || rule.source || '#';
  els.sourceLink.textContent = href !== '#' ? href : '—';
  els.sourceLink.href = href !== '#' ? href : '#';
}

// -------- Selection / loading text --------
async function selectRuleById(id) {
  const idx = allRules.findIndex(r => r.__id === id);
  if (idx === -1) return;

  currentIndex = idx;
  const rule = allRules[idx];
  updateMeta(rule);

  els.ruleText.textContent = 'Loading rule text…';

  // Choose the path to load text from
  const textPath = rule.reference_url || rule.source;
  if (!textPath) {
    els.ruleText.textContent = 'No reference_url or source provided for this rule.';
    return;
  }

  try {
    const txt = await fetchText(textPath);
    els.ruleText.textContent = txt || '(empty file)';
  } catch (e) {
    els.ruleText.textContent = `Error loading rule text from "${textPath}": ${e.message}`;
  }

  // Re-render list with active highlighting
  renderList(allRules, currentIndex);
}

// -------- Search --------
function applySearch() {
  const q = (els.search.value || '').toLowerCase().trim();
  const filtered = !q ? allRules : allRules.filter(r => {
    const hay = `${r.title || ''} ${r.jurisdiction || ''} ${r.reference || ''}`.toLowerCase();
    return hay.includes(q);
  });
  renderList(filtered, -1);
}

// -------- Init --------
async function init() {
  try {
    const data = await fetchJSON(PATHS.RULES_JSON);

    // Accept rules.json as array or { rules: [...] }
    const rules = Array.isArray(data) ? data : (Array.isArray(data?.rules) ? data.rules : []);
    if (!rules.length) throw new Error('rules.json must be an array or { "rules": [ ... ] }');

    // Normalize and give each rule a stable id
    allRules = rules.map((r, i) => ({
      __id: r.id || `${(r.title || 'rule').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${i}`,
      title: r.title || '',
      jurisdiction: r.jurisdiction || '',
      reference: r.reference || '',
      reference_url: r.reference_url || '',
      source: r.source || ''
    }));

    renderList(allRules, -1);

    // If you want the first rule auto-selected, uncomment:
    // if (allRules.length) selectRuleById(allRules[0].__id);

    els.search.addEventListener('input', applySearch);
  } catch (e) {
    els.ruleTitle.textContent = 'Failed to load rules.json';
    els.ruleText.textContent = e.message;
  }
}

document.addEventListener('DOMContentLoaded', init);
