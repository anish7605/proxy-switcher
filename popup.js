let proxies = [];
let currentProxy = null;
let editingIndex = -1;   // -1 = add new, >=0 = editing

const proxyListEl = document.getElementById('proxy-list');
const statusEl = document.getElementById('status');
const statusText = document.getElementById('status-text');
const modal = document.getElementById('add-modal');
const modalTitle = document.getElementById('modal-title');

// Load data
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
    proxyListEl.innerHTML = `<div class="empty-state">No proxies added yet.<br>Click + to add one.</div>`;
    return;
  }

  proxies.forEach((proxy, index) => {
    const isActive = currentProxy && currentProxy.host === proxy.host && currentProxy.port === proxy.port;

    const div = document.createElement('div');
    div.className = `proxy-item ${isActive ? 'active' : ''}`;

    div.innerHTML = `
      <div class="proxy-name">${proxy.name || 'Unnamed Proxy'}</div>
      <div class="proxy-info">${proxy.scheme || 'http'}://${proxy.host}:${proxy.port}${proxy.username ? ' • 🔒' : ''}</div>
      <div class="actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // Activate proxy
    div.addEventListener('click', (e) => {
      if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('delete-btn')) {
        switchToProxy(index);
      }
    });

    // Edit
    div.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      startEditMode(index);
    });

    // Delete
    div.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProxy(index);
    });

    proxyListEl.appendChild(div);
  });
}

function updateStatus() {
  statusEl.style.display = currentProxy ? 'flex' : 'none';
  if (currentProxy) {
    statusText.textContent = `✅ Active: ${currentProxy.host}:${currentProxy.port}`;
  }
}

// Switch to proxy
async function switchToProxy(index) {
  currentProxy = proxies[index];
  await chrome.storage.local.set({ currentProxy });
  chrome.runtime.sendMessage({ action: "setProxy", proxy: currentProxy });
  updateStatus();
  renderProxyList();
}

// ============== ADD MODE ==============
document.getElementById('add-btn').addEventListener('click', startAddMode);

function startAddMode() {
  editingIndex = -1;
  modalTitle.textContent = "Add New Proxy";
  clearModal();
  modal.style.display = 'flex';
  document.getElementById('proxy-name').focus();
}

// ============== EDIT MODE ==============
function startEditMode(index) {
  editingIndex = index;
  const proxy = proxies[index];

  modalTitle.textContent = "Edit Proxy";

  document.getElementById('proxy-name').value = proxy.name || '';
  document.getElementById('proxy-host').value = proxy.host || '';
  document.getElementById('proxy-port').value = proxy.port || 8080;
  document.getElementById('proxy-scheme').value = proxy.scheme || 'http';
  document.getElementById('proxy-username').value = proxy.username || '';
  document.getElementById('proxy-password').value = proxy.password || '';

  modal.style.display = 'flex';
}

// ============== SAVE (Add or Edit) ==============
document.getElementById('save-btn').addEventListener('click', async () => {
  const host = document.getElementById('proxy-host').value.trim();
  if (!host) {
    alert("Host / IP Address is required!");
    return;
  }

  const proxyData = {
    name: document.getElementById('proxy-name').value.trim() || "My Proxy",
    host: host,
    port: parseInt(document.getElementById('proxy-port').value) || 8080,
    scheme: document.getElementById('proxy-scheme').value,
    username: document.getElementById('proxy-username').value.trim(),
    password: document.getElementById('proxy-password').value.trim()
  };

  if (editingIndex >= 0) {
    proxies[editingIndex] = proxyData;        // Edit
  } else {
    proxies.push(proxyData);                  // Add new
  }

  await chrome.storage.local.set({ proxies });
  modal.style.display = 'none';
  clearModal();
  loadData();
});

document.getElementById('cancel-btn').addEventListener('click', () => {
  modal.style.display = 'none';
  clearModal();
});

function clearModal() {
  document.getElementById('proxy-name').value = '';
  document.getElementById('proxy-host').value = '';
  document.getElementById('proxy-port').value = '8080';
  document.getElementById('proxy-scheme').value = 'http';
  document.getElementById('proxy-username').value = '';
  document.getElementById('proxy-password').value = '';
}

// ============== DIRECT BUTTON ==============
document.getElementById('direct-btn').addEventListener('click', async () => {
  currentProxy = null;
  await chrome.storage.local.set({ currentProxy: null });
  chrome.runtime.sendMessage({ action: "setProxy", proxy: null });
  updateStatus();
  renderProxyList();
});

// ============== DELETE ==============
async function deleteProxy(index) {
  if (!confirm("Delete this proxy permanently?")) return;

  const wasActive = currentProxy && currentProxy.host === proxies[index].host && currentProxy.port === proxies[index].port;

  proxies.splice(index, 1);
  await chrome.storage.local.set({ proxies });

  if (wasActive) {
    currentProxy = null;
    await chrome.storage.local.set({ currentProxy: null });
    chrome.runtime.sendMessage({ action: "setProxy", proxy: null });
  }

  loadData();
}

// Initialize
loadData();
