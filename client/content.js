let observer = null;
let debounceTimer = null;
let isMonitoring = false;

function sendAnalysisRequest() {
  const html = document.documentElement.outerHTML;
  chrome.runtime.sendMessage({
    type: "ANALYZE_DOM",
    url: location.href,
    html: html,
    tabId: chrome.runtime.id 
  }).catch(error => {
    console.debug("Content script: Background not ready, message not sent.");
  });
}

function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

const observerCallback = debounce(() => {
  if (isMonitoring) {
    sendAnalysisRequest();
  }
}, 500); 

function startObserver() {
  if (!observer && !isMonitoring) {
    observer = new MutationObserver(observerCallback);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
    isMonitoring = true;
    console.log("TrustScreen: Started monitoring DOM changes.");
  }
}

function stopObserver() {
  if (observer && isMonitoring) {
    observer.disconnect();
    observer = null;
    clearTimeout(debounceTimer);
    debounceTimer = null;
    isMonitoring = false;
    console.log("TrustScreen: Stopped monitoring DOM changes.");
  }
}

startObserver();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STOP_MONITORING") {
    stopObserver();
  } else if (message.type === "START_MONITORING") {
    startObserver();
  }
});