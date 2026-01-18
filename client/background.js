const API = "http://127.0.0.1:8000/analyze";
let popupPort = null;

chrome.runtime.onConnect.addListener(port => {
  if (port.name === "popup") {
    chrome.storage.session.get(['lastResult']).then(result => {
      if (result.lastResult) {
        port.postMessage({ type: "ANALYSIS_RESULT", result: result.lastResult });
      }
    });
    popupPort = port;
    port.onDisconnect.addListener(() => {
      popupPort = null;
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "ANALYZE_DOM") {
    handleDomAnalysis(message, sender);
  } else if (message.type === "MANUAL_CHECK") {
    handleManualCheck(message, sender);
  }
});

async function handleDomAnalysis(message, sender) {
  const { url, html, tabId } = message;

  try {
    const params = new URLSearchParams({ url: url, html: html });
    const fullUrl = `${API}?${params.toString()}`;
    console.log(`Sending ANALYZE_DOM request to: ${fullUrl}`);

    const res = await fetch(fullUrl);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    await chrome.storage.session.set({ lastResult: data });

    if (popupPort) {
      popupPort.postMessage({ type: "ANALYSIS_RESULT", result: data });
    }

    if (data.verdict === "phishing" && tabId) {
      chrome.tabs.sendMessage(tabId, { type: "STOP_MONITORING" });
      await chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL("warning.html") + "?url=" + encodeURIComponent(url)
      });
    }

  } catch (error) {
    console.error("Background script: Fetch error during analysis:", error);
    if (popupPort) {
      popupPort.postMessage({ type: "ERROR", error: error.message });
    }
  }
}

async function handleManualCheck(message, sender) {
  const { url } = message;

  try {
    const params = new URLSearchParams({ url: url });
    const fullUrl = `${API}?${params.toString()}`;
    console.log(`Sending MANUAL_CHECK request to: ${fullUrl}`);

    const res = await fetch(fullUrl);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    await chrome.storage.session.set({ lastResult: data });

    if (popupPort) {
      popupPort.postMessage({ type: "ANALYSIS_RESULT", result: data });
    }

  } catch (error) {
    console.error("Background script: Fetch error during manual check:", error);
    if (popupPort) {
      popupPort.postMessage({ type: "ERROR", error: error.message });
    }
  }
}