let rulesData = [];

async function loadRules() {
  const response = await fetch('rules.json');
  rulesData = await response.json();
  displayRuleList(rulesData);
}

function displayRuleList(data) {
  const ruleList = document.getElementById('ruleList');
  ruleList.innerHTML = '';

  data.forEach((rule, index) => {
    const li = document.createElement('li');
    li.textContent = rule.title;
    li.classList.add('rule-item');
    li.addEventListener('click', () => displayRule(rule));
    ruleList.appendChild(li);
  });
}

function displayRule(rule) {
  document.getElementById('jurisdiction').textContent = rule.jurisdiction;
  document.getElementById('reference').textContent = rule.reference;
  document.getElementById('source').textContent = rule.source;

  const ruleText = document.getElementById('ruleText');
  ruleText.textContent = 'Loading...';

  fetch(rule.source)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.text();
    })
    .then(data => {
      ruleText.textContent = data;
    })
    .catch(error => {
      ruleText.textContent = 'Error loading rule text.';
      console.error(error);
    });
}

function setupSearch() {
  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('input', () => {
    const query = searchBox.value.toLowerCase();
    const filteredRules = rulesData.filter(rule =>
      rule.title.toLowerCase().includes(query) ||
      rule.jurisdiction.toLowerCase().includes(query) ||
      rule.reference.toLowerCase().includes(query)
    );
    displayRuleList(filteredRules);
  });
}

// Load rules and activate search once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadRules();
  setupSearch();
});
