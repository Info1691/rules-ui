document.addEventListener('DOMContentLoaded', () => {
  fetch('rules.json')
    .then(response => response.json())
    .then(data => {
      const rulesList = document.getElementById('rulesList');
      const ruleTitle = document.getElementById('ruleTitle');
      const ruleJurisdiction = document.getElementById('ruleJurisdiction');
      const ruleReference = document.getElementById('ruleReference');
      const ruleSource = document.getElementById('ruleSource');
      const ruleContent = document.getElementById('ruleContent');
      const searchInput = document.getElementById('searchInput');

      let rules = data;

      function displayRule(rule) {
        ruleTitle.textContent = rule.title;
        ruleJurisdiction.textContent = rule.jurisdiction;
        ruleReference.textContent = rule.reference;
        ruleSource.textContent = rule.source;
        ruleSource.href = rule.reference_url;

        // Fetch and display the rule content from the .txt file
        fetch(rule.source)
          .then(res => {
            if (!res.ok) throw new Error('Text file not found');
            return res.text();
          })
          .then(text => {
            ruleContent.textContent = text;
          })
          .catch(err => {
            ruleContent.textContent = '⚠️ Error loading rule text.';
          });
      }

      function populateList(filteredRules) {
        rulesList.innerHTML = '';
        filteredRules.forEach(rule => {
          const li = document.createElement('li');
          li.textContent = rule.title;
          li.onclick = () => displayRule(rule);
          rulesList.appendChild(li);
        });
      }

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filtered = rules.filter(rule =>
          rule.title.toLowerCase().includes(query) ||
          rule.jurisdiction.toLowerCase().includes(query) ||
          rule.reference.toLowerCase().includes(query)
        );
        populateList(filtered);
      });

      populateList(rules);
      if (rules.length > 0) {
        displayRule(rules[0]);
      }
    })
    .catch(err => {
      console.error('Error loading rules.json:', err);
    });
});
