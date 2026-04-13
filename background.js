let currentProxy = null;

// Listen for auth requests (for proxies with username:password)
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

// Function to apply proxy
async function setProxy(proxyConfig) {
  currentProxy = proxyConfig;

  let config = { mode: "direct" };

  if (proxyConfig && proxyConfig.host) {
    const scheme = proxyConfig.scheme || "http";

    config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: scheme,
          host: proxyConfig.host,
          port: parseInt(proxyConfig.port)
        },
        bypassList: proxyConfig.bypass || ["<local>"]
      }
    };
  }

  await chrome.proxy.settings.set({
    value: config,
    scope: "regular"
  });

  console.log("Proxy set to:", proxyConfig ? `${proxyConfig.host}:${proxyConfig.port}` : "Direct");
}

// Load saved proxy on startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("currentProxy", (data) => {
    if (data.currentProxy) {
      setProxy(data.currentProxy);
    }
  });
});
