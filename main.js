document.addEventListener("DOMContentLoaded", () => {
  fetch("rules.json")
    .then((res) => res.json())
    .then((rules) => {
      const ruleList = document.getElementById("ruleList");
      const ruleDetails = document.getElementById("ruleDetails");
      const searchBar = document.getElementById("searchBar");

      function displayRules(filteredRules) {
        ruleList.innerHTML = "";
        filteredRules.forEach((rule, index) => {
          const li = document.createElement("li");
          li.textContent = rule.title;
          li.addEventListener("click", () => displayRuleDetails(rule));
          ruleList.appendChild(li);
        });
      }

      function displayRuleDetails(rule) {
        fetch(rule.source)
          .then((res) => res.text())
          .then((text) => {
            ruleDetails.innerHTML = `
              <h2>${rule.title}</h2>
              <p><strong>Jurisdiction:</strong> ${rule.jurisdiction}</p>
              <p><strong>Reference:</strong> ${rule.reference}</p>
              <p><strong>Source:</strong> <a href="${rule.reference_url}" target="_blank">${rule.reference_url}</a></p>
              <pre>${text}</pre>
            `;
          });
      }

      searchBar.addEventListener("input", () => {
        const searchTerm = searchBar.value.toLowerCase();
        const filtered = rules.filter(
          (r) =>
            r.title.toLowerCase().includes(searchTerm) ||
            r.jurisdiction.toLowerCase().includes(searchTerm)
        );
        displayRules(filtered);
      });

      displayRules(rules);
    });
});
