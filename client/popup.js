let port = chrome.runtime.connect({ name: "popup" });

document.addEventListener('DOMContentLoaded', () => {
  const checkButton = document.getElementById("check");
  const statusDiv = document.getElementById("status");
  const resultContainer = document.getElementById("result-container");
  const resultContentDiv = document.getElementById("result-content");
  const verdictIconSpan = document.getElementById("verdict-icon");
  const verdictTextSpan = document.getElementById("verdict-text");

  checkButton.onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url) {
      statusDiv.textContent = "Performing manual check...";
      resultContainer.style.display = 'none'; 
      chrome.runtime.sendMessage({
        type: "MANUAL_CHECK",
        url: tab.url
      });
    }
  };

  port.onMessage.addListener((message) => {
    if (message.type === "ANALYSIS_RESULT") {
      statusDiv.textContent = "Result received.";
      displayAnalysisResult(message.result);
    } else if (message.type === "ERROR") {
      statusDiv.textContent = "Error during check.";
      resultContainer.style.display = 'none';

    }
  });

  function displayAnalysisResult(result) {
    resultContentDiv.innerHTML = '';

    let icon = '❓';
    let iconClass = 'verdict-info'; 
    let bgColor = '#d1ecf1';

    switch (result.verdict) {
      case 'safe':
        icon = '✅ ';
        iconClass = 'verdict-safe';
        bgColor = '#d4edda';
        break;
      case 'phishing':
        icon = '❌ ';
        iconClass = 'verdict-phishing';
        bgColor = '#f8d7da';
        break;
      case 'suspicious':
        icon = '⚠️ ';
        iconClass = 'verdict-suspicious';
        bgColor = '#fff3cd';
        break;
    }

    verdictIconSpan.textContent = icon;
    verdictIconSpan.className = `verdict-icon ${iconClass}`;
    verdictTextSpan.textContent = `Analysis Result: ${result.verdict.toUpperCase()}`;

    const urlRow = document.createElement('div');
    urlRow.className = 'result-row';
    urlRow.innerHTML = `
    `;
    resultContentDiv.appendChild(urlRow);

    const verdictRow = document.createElement('div');
    verdictRow.className = 'result-row';
    verdictRow.innerHTML = `
        <span class="result-label">Verdict:</span>
        <span class="result-value verdict-${result.verdict}">${result.verdict}</span>
    `;
    resultContentDiv.appendChild(verdictRow);

    const scoreRow = document.createElement('div');
    scoreRow.className = 'result-row';
    scoreRow.innerHTML = `
        <span class="result-label">Score:</span>
        <span class="result-value">${(result.score * 100).toFixed(2)}%</span>
    `;
    resultContentDiv.appendChild(scoreRow);

    const scoreBarContainer = document.createElement('div');
    scoreBarContainer.className = 'score-bar-container';
    const scoreBar = document.createElement('div');
    scoreBar.className = `score-bar score-bar-${result.verdict}`;
    const scorePercentage = Math.min(100, Math.max(0, result.score * 100));
    scoreBar.style.width = `${scorePercentage}%`;
    scoreBarContainer.appendChild(scoreBar);
    resultContentDiv.appendChild(scoreBarContainer);

    const reasonsRow = document.createElement('div');
    reasonsRow.className = 'result-row';
    reasonsRow.innerHTML = `
        <span class="result-label">Reasons:</span>
        <span class="result-value"><ul class="reasons-list">${result.reasons.map(r => `<li>${r}</li>`).join('')}</ul></span>
    `;
    resultContentDiv.appendChild(reasonsRow);

    resultContainer.style.display = 'block';
  }
});