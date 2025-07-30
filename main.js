document.addEventListener("DOMContentLoaded", function () {
  const rulesList = document.querySelector("ul#rules-list");
  const ruleDetails = document.querySelector("#rule-details");
  const rulesSource = document.querySelector("#rules-source");
  const rulesText = document.querySelector("#rules-text");

  fetch("rules.json")
    .then(response => response.json())
    .then(rules => {
      rules.forEach((rule, index) => {
        const li = document.createElement("li");
        li.textContent = rule.title;
        li.addEventListener("click", () => loadRule(rule));
        rulesList.appendChild(li);
      });
    });

  function loadRule(rule) {
    document.querySelector("#rule-title").textContent = rule.title;
    document.querySelector("#rule-jurisdiction").textContent = rule.jurisdiction;
    document.querySelector("#rule-reference").textContent = rule.reference;

    const sourceLink = document.querySelector("#rule-source-link");
    sourceLink.href = rule.source;
    sourceLink.textContent = rule.source;

    // Load the actual rule text content
    fetch(rule.source)
      .then(response => {
        if (!response.ok) throw new Error("Text fetch failed");
        return response.text();
      })
      .then(text => {
        rulesText.textContent = text;
      })
      .catch(error => {
        rulesText.textContent = "⚠️ Error loading rule text.";
      });
  }
});
