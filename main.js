document.addEventListener('DOMContentLoaded', function () {
  fetch('rules.json')
    .then(response => response.json())
    .then(data => {
      const rulesList = document.querySelector('.rules-list');
      const ruleDisplay = document.getElementById('rule-display');

      data.forEach((rule, index) => {
        const ruleItem = document.createElement('div');
        ruleItem.className = 'rule-item';
        ruleItem.textContent = rule.title;

        ruleItem.addEventListener('click', () => {
          ruleDisplay.innerHTML = `
            <h2>${rule.title}</h2>
            <p><strong>Jurisdiction:</strong> ${rule.jurisdiction}</p>
            <p><strong>Reference:</strong> ${rule.reference}</p>
            <p><strong>Source:</strong> <a href="${rule.reference_url}" target="_blank">${rule.reference_url}</a></p>
            <div class="button-bar">
              <button onclick="printRule()">🖨️ Print</button>
              <button onclick="exportPDF()">📄 Export to PDF</button>
            </div>
            <pre id="rule-content">Loading...</pre>
          `;

          fetch(rule.source)
            .then(response => response.text())
            .then(text => {
              document.getElementById('rule-content').textContent = text;
            });
        });

        rulesList.appendChild(ruleItem);
      });
    });
});

function printRule() {
  const content = document.getElementById('rule-display').innerHTML;
  const win = window.open('', '', 'height=800,width=800');
  win.document.write('<html><head><title>Print Rule</title></head><body>');
  win.document.write(content);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
}

function exportPDF() {
  const element = document.getElementById('rule-display');
  html2pdf().from(element).save('Rule-Export.pdf');
}
