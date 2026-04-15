let currentProxy = null;

// Proxy authentication support
chrome.webRequest.onAuthRequired.addListener(
  (details, callback) => {
    if (currentProxy && currentProxy.username && currentProxy.password) {
      callback({
        authCredentials: {
          username: currentProxy.username,
          password: currentProxy.password
        }
      });
    } else {
      callback({});
    }
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"]
);

// Set proxy or Direct
async function setProxy(proxyConfig) {
  currentProxy = proxyConfig;

  const config = proxyConfig && proxyConfig.host ? {
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        scheme: proxyConfig.scheme || "http",
        host: proxyConfig.host,
        port: parseInt(proxyConfig.port)
      },
      bypassList: ["<local>"]
    }
  } : { mode: "direct" };

  await chrome.proxy.settings.set({ value: config, scope: "regular" });
  console.log("Proxy set to:", proxyConfig ? `${proxyConfig.host}:${proxyConfig.port}` : "Direct");
}

// Load saved proxy on startup
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get('currentProxy');
  if (data.currentProxy) {
    setProxy(data.currentProxy);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get('currentProxy');
  if (data.currentProxy) {
    setProxy(data.currentProxy);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setProxy") {
    setProxy(message.proxy);
    sendResponse({ success: true });
  }
  return true;
});
