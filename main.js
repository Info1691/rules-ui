let rules = [];
let currentRuleIndex = -1;
let matches = [];
let currentMatchIndex = -1;

const ruleList = document.getElementById('ruleList');
const ruleTextEl = document.getElementById('ruleText');
const searchBox = document.getElementById('searchBox');
const textSearchBox = document.getElementById('textSearchBox');

fetch('data/rules.json')
  .then(res => res.json())
  .then(data => {
    rules = data;
    renderRuleList();
  })
  .catch(err => {
    document.getElementById('status').textContent = 'Error loading rules.json';
    console.error(err);
  });

function renderRuleList() {
  ruleList.innerHTML = '';
  rules.forEach((rule, index) => {
    const li = document.createElement('li');
    li.textContent = rule.title;
    li.addEventListener('click', () => loadRule(index));
    ruleList.appendChild(li);
  });
}

function loadRule(index) {
  currentRuleIndex = index;
  const rule = rules[index];
  document.getElementById('jurisdiction').textContent = rule.jurisdiction;
  document.getElementById('reference').textContent = rule.reference;
  document.getElementById('source').textContent = rule.source;

  fetch(rule.source)
    .then(res => res.text())
    .then(text => {
      ruleTextEl.innerHTML = escapeHTML(text);
      matches = [];
      currentMatchIndex = -1;
    })
    .catch(err => {
      ruleTextEl.textContent = 'Error loading rule text';
      console.error(err);
    });
}

function escapeHTML(text) {
  return text.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

searchBox.addEventListener('input', () => {
  const query = searchBox.value.toLowerCase();
  const filtered = rules.filter(r => r.title.toLowerCase().includes(query));
  ruleList.innerHTML = '';
  filtered.forEach((rule, index) => {
    const li = document.createElement('li');
    li.textContent = rule.title;
    li.addEventListener('click', () => loadRule(rules.indexOf(rule)));
    ruleList.appendChild(li);
  });
});

textSearchBox.addEventListener('input', () => {
  highlightMatches(textSearchBox.value);
});

document.getElementById('prevMatch').addEventListener('click', () => {
  if (matches.length > 0) {
    currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    scrollToMatch();
  }
});

document.getElementById('nextMatch').addEventListener('click', () => {
  if (matches.length > 0) {
    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
    scrollToMatch();
  }
});

function highlightMatches(query) {
  if (!query) {
    ruleTextEl.innerHTML = escapeHTML(rules[currentRuleIndex]?.fullText || ruleTextEl.textContent);
    matches = [];
    currentMatchIndex = -1;
    return;
  }
  const regex = new RegExp(`(${query})`, 'gi');
  const text = rules[currentRuleIndex] ? escapeHTML(ruleTextEl.textContent) : '';
  ruleTextEl.innerHTML = text.replace(regex, `<mark>$1</mark>`);
  matches = Array.from(ruleTextEl.querySelectorAll('mark'));
  currentMatchIndex = matches.length > 0 ? 0 : -1;
  scrollToMatch();
}

function scrollToMatch() {
  if (matches.length > 0) {
    matches[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (currentRuleIndex >= 0) {
    const blob = new Blob([ruleTextEl.textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = rules[currentRuleIndex].reference + '.txt';
    link.click();
  }
});
