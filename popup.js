let proxies = [];
let currentProxy = null;

const proxyListEl = document.getElementById('proxy-list');
const statusEl = document.getElementById('status');
const statusText = document.getElementById('status-text');
const modal = document.getElementById('add-modal');

async function loadData() {
  const data = await chrome.storage.local.get(['proxies', 'currentProxy']);
  proxies = data.proxies || [];
  currentProxy = data.currentProxy || null;
  renderProxyList();
  updateStatus();
}

function renderProxyList() {
  proxyListEl.innerHTML = '';

  if (proxies.length === 0) {
    proxyListEl.innerHTML = `<div style="text-align:center; padding:40px 20px; color:#94a3b8;">No proxies yet.<br>Click + to add one.</div>`;
    return;
  }

  proxies.forEach((proxy, index) => {
    const isActive = currentProxy && currentProxy.host === proxy.host && currentProxy.port === proxy.port;

    const div = document.createElement('div');
    div.className = `proxy-item ${isActive ? 'active' : ''}`;
    div.innerHTML = `
      <div class="proxy-name">${proxy.name || 'Unnamed'}</div>
      <div class="proxy-info">
        ${proxy.scheme || 'http'}://${proxy.host}:${proxy.port}
        ${proxy.username ? ' • 🔒' : ''}
      </div>
    `;

    div.addEventListener('click', () => switchToProxy(index));
    proxyListEl.appendChild(div);
  });
}

function updateStatus() {
  if (currentProxy) {
    statusText.textContent = `✅ Active: ${currentProxy.host}:${currentProxy.port}`;
    statusEl.style.display = 'flex';
  } else {
    statusEl.style.display = 'none';
  }
}

async function switchToProxy(index) {
  currentProxy = proxies[index];
  await chrome.storage.local.set({ currentProxy });
  await chrome.runtime.sendMessage({ action: "setProxy", proxy: currentProxy });
  updateStatus();
  renderProxyList();
}

document.getElementById('direct-btn').addEventListener('click', async () => {
  currentProxy = null;
  await chrome.storage.local.set({ currentProxy: null });
  await chrome.runtime.sendMessage({ action: "setProxy", proxy: null });
  updateStatus();
  renderProxyList();
});

// Modal controls
document.getElementById('add-btn').addEventListener('click', () => {
  modal.style.display = 'flex';
  document.getElementById('proxy-name').focus();
});

document.getElementById('cancel-btn').addEventListener('click', () => {
  modal.style.display = 'none';
  clearModal();
});

document.getElementById('save-btn').addEventListener('click', async () => {
  const name = document.getElementById('proxy-name').value.trim() || "My Proxy";
  const host = document.getElementById('proxy-host').value.trim();
  const port = parseInt(document.getElementById('proxy-port').value) || 8080;
  const scheme = document.getElementById('proxy-scheme').value;
  const username = document.getElementById('proxy-username').value.trim();
  const password = document.getElementById('proxy-password').value.trim();

  if (!host) {
    alert("Host / IP is required!");
    return;
  }

  const newProxy = { name, host, port, scheme, username, password };

  proxies.push(newProxy);
  await chrome.storage.local.set({ proxies });

  modal.style.display = 'none';
  clearModal();
  loadData();
});

function clearModal() {
  document.getElementById('proxy-name').value = '';
  document.getElementById('proxy-host').value = '';
  document.getElementById('proxy-port').value = '8080';
  document.getElementById('proxy-username').value = '';
  document.getElementById('proxy-password').value = '';
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    clearModal();
  }
});

loadData();
