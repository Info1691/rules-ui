document.addEventListener("DOMContentLoaded", () => {
  fetch("rules.json")
    .then(response => response.json())
    .then(data => loadRules(data));
});

function loadRules(rules) {
  const list = document.querySelector("#ruleList");
  const details = document.querySelector("#ruleDetails");
  const searchInput = document.querySelector("#searchInput");

  rules.forEach(rule => {
    const li = document.createElement("li");
    li.textContent = rule.title;
    li.addEventListener("click", () => {
      // Show rule details
      details.innerHTML = `
        <h2>${rule.title}</h2>
        <p><strong>Jurisdiction:</strong> ${rule.jurisdiction}</p>
        <p><strong>Reference:</strong> ${rule.reference}</p>
        <p><strong>Source:</strong> <a href="${rule.source}" target="_blank">${rule.source}</a></p>
        <pre id="ruleText">Loading rule text...</pre>
      `;

      // Fetch and display the rule text from source
      fetch(rule.source)
        .then(response => response.text())
        .then(text => {
          document.querySelector("#ruleText").textContent = text;
        })
        .catch(error => {
          document.querySelector("#ruleText").textContent = "⚠️ Error loading rule text.";
          console.error("Error loading rule text:", error);
        });
    });
    list.appendChild(li);
  });

  // Filter logic
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const items = list.getElementsByTagName("li");
    for (let item of items) {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(filter) ? "" : "none";
    }
  });
}
