const state = {
  entries: [],
  productsByName: {},
  productsByBarcode: {},
  limit: Number(localStorage.getItem('carbLimit') || 30),
  driveFileId: localStorage.getItem('driveFileId') || '',
  editingEntryId: null,
  scannerStream: null,
  scannerTimer: null,
};

const els = {
  dailyTotal: document.getElementById('dailyTotal'),
  dailyStatus: document.getElementById('dailyStatus'),
  limitRange: document.getElementById('limitRange'),
  limitLabel: document.getElementById('limitLabel'),
  barcode: document.getElementById('barcode'),
  scanBarcode: document.getElementById('scanBarcode'),
  stopBarcodeScan: document.getElementById('stopBarcodeScan'),
  barcodeVideo: document.getElementById('barcodeVideo'),
  barcodeScannerWrap: document.getElementById('barcodeScannerWrap'),
  barcodeStatus: document.getElementById('barcodeStatus'),
  productName: document.getElementById('productName'),
  productOptions: document.getElementById('productOptions'),
  gramsConsumed: document.getElementById('gramsConsumed'),
  carbsPer100: document.getElementById('carbsPer100'),
  carbsPerPortion: document.getElementById('carbsPerPortion'),
  portionGrams: document.getElementById('portionGrams'),
  notes: document.getElementById('notes'),
  addEntry: document.getElementById('addEntry'),
  cancelEdit: document.getElementById('cancelEdit'),
  nutritionPhoto: document.getElementById('nutritionPhoto'),
  scanResult: document.getElementById('scanResult'),
  entriesList: document.getElementById('entriesList'),
  syncDrive: document.getElementById('syncDrive'),
  googleClientId: document.getElementById('googleClientId'),
  driveLoadStatus: document.getElementById('driveLoadStatus'),
  openKeyboard: document.getElementById('openKeyboard'),
  closeKeyboard: document.getElementById('closeKeyboard'),
  keyboardSheet: document.getElementById('keyboardSheet'),
  keyboardGrid: document.getElementById('keyboardGrid'),
  installApp: document.getElementById('installApp'),
};

const today = () => new Date().toISOString().slice(0, 10);
const normalizeName = (name) => (name || '').trim().toLowerCase();
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

let deferredInstallPrompt = null;

function load() {
  state.entries = JSON.parse(localStorage.getItem('carbEntries') || '[]');
  els.googleClientId.value = localStorage.getItem('googleClientId') || '';
  els.limitRange.value = String(state.limit);
  rebuildProductCatalog();
  renderProductOptions();
  render();
}

function saveLocal() {
  localStorage.setItem('carbEntries', JSON.stringify(state.entries));
}

function calcCarbs({ grams, carbsPer100, carbsPerPortion, portionGrams }) {
  if (carbsPer100 > 0) return round1((grams / 100) * carbsPer100);
  if (carbsPerPortion > 0 && portionGrams > 0) return round1((grams / portionGrams) * carbsPerPortion);
  return 0;
}

function rebuildProductCatalog() {
  state.productsByName = {};
  state.productsByBarcode = {};
  state.entries.forEach((entry) => {
    if (!entry?.name?.trim()) return;
    const profile = {
      name: entry.name,
      barcode: entry.barcode || '',
      carbsPer100: round1(entry.carbsPer100 || 0),
      carbsPerPortion: round1(entry.carbsPerPortion || 0),
      portionGrams: round1(entry.portionGrams || 0),
      notes: entry.notes || '',
      updatedAt: entry.updatedAt || entry.createdAt || entry.date,
    };
    state.productsByName[normalizeName(entry.name)] = profile;
    if (entry.barcode) state.productsByBarcode[entry.barcode] = profile;
  });
}

function renderProductOptions() {
  els.productOptions.innerHTML = '';
  Object.values(state.productsByName)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((product) => {
      const option = document.createElement('option');
      option.value = product.name;
      option.label = product.carbsPer100 > 0 ? `${product.name} (${product.carbsPer100.toFixed(1)}g / 100g)` : product.name;
      els.productOptions.appendChild(option);
    });
}

function applyProfile(profile, { fillName = true } = {}) {
  if (!profile) return;
  if (fillName) els.productName.value = profile.name || '';
  if (profile.barcode) els.barcode.value = profile.barcode;
  if (profile.carbsPer100) els.carbsPer100.value = profile.carbsPer100.toFixed(1);
  if (profile.carbsPerPortion) els.carbsPerPortion.value = profile.carbsPerPortion.toFixed(1);
  if (profile.portionGrams) els.portionGrams.value = profile.portionGrams.toFixed(1);
  if (profile.notes && !els.notes.value) els.notes.value = profile.notes;
}

function applyNamePreset() {
  const profile = state.productsByName[normalizeName(els.productName.value)];
  if (profile) applyProfile(profile, { fillName: false });
}

function applyBarcodePreset() {
  const barcode = els.barcode.value.trim();
  if (!barcode) return;
  const profile = state.productsByBarcode[barcode];
  if (profile) {
    applyProfile(profile);
    els.barcodeStatus.textContent = `Found saved product for barcode ${barcode}.`;
  } else {
    els.barcodeStatus.textContent = `No saved product for barcode ${barcode}. Add once and it will auto-fill next time.`;
  }
}

function render() {
  const total = round1(state.entries.filter((e) => e.date === today()).reduce((sum, e) => sum + round1(e.carbs), 0));
  els.dailyTotal.textContent = `${total.toFixed(1)}g`;
  const ratio = state.limit === 0 ? 1 : total / state.limit;
  if (total > state.limit) {
    els.dailyStatus.textContent = 'Exceeded limit';
    els.dailyStatus.style.background = '#4a1418';
    els.dailyStatus.style.color = '#ffb9c0';
  } else if (ratio >= 0.8) {
    els.dailyStatus.textContent = 'Near limit';
    els.dailyStatus.style.background = '#4b390f';
    els.dailyStatus.style.color = '#ffd88f';
  } else {
    els.dailyStatus.textContent = 'Within limit';
    els.dailyStatus.style.background = '#123825';
    els.dailyStatus.style.color = '#8cf6c5';
  }

  els.entriesList.innerHTML = '';
  state.entries
    .filter((e) => e.date === today())
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <strong>${entry.name || 'Unnamed item'}</strong>
          <small>${round1(entry.grams).toFixed(1)}g • ${entry.date}${entry.barcode ? ` • ${entry.barcode}` : ''}</small>
          <div class="entry-actions">
            <button class="btn small" type="button" data-action="edit" data-id="${entry.id}">Edit</button>
            <button class="btn small ghost" type="button" data-action="delete" data-id="${entry.id}">Delete</button>
          </div>
        </div>
        <div>${round1(entry.carbs).toFixed(1)}g carbs</div>`;
      els.entriesList.appendChild(li);
    });

  els.limitLabel.textContent = `${state.limit}g`;
}

function resetForm() {
  state.editingEntryId = null;
  els.addEntry.textContent = 'Add to daily total';
  els.cancelEdit.classList.add('hidden');
  ['barcode', 'productName', 'gramsConsumed', 'carbsPer100', 'carbsPerPortion', 'portionGrams', 'notes'].forEach((k) => {
    els[k].value = '';
  });
}

function beginEdit(entryId) {
  const entry = state.entries.find((e) => e.id === entryId);
  if (!entry) return;
  state.editingEntryId = entryId;
  els.addEntry.textContent = 'Save entry changes';
  els.cancelEdit.classList.remove('hidden');
  els.barcode.value = entry.barcode || '';
  els.productName.value = entry.name || '';
  els.gramsConsumed.value = round1(entry.grams).toFixed(1);
  els.carbsPer100.value = round1(entry.carbsPer100).toFixed(1);
  els.carbsPerPortion.value = entry.carbsPerPortion ? round1(entry.carbsPerPortion).toFixed(1) : '';
  els.portionGrams.value = entry.portionGrams ? round1(entry.portionGrams).toFixed(1) : '';
  els.notes.value = entry.notes || '';
}

async function saveEntry() {
  const payload = {
    id: state.editingEntryId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    barcode: els.barcode.value.trim(),
    name: els.productName.value.trim(),
    grams: round1(els.gramsConsumed.value),
    carbsPer100: round1(els.carbsPer100.value),
    carbsPerPortion: round1(els.carbsPerPortion.value),
    portionGrams: round1(els.portionGrams.value),
    notes: els.notes.value.trim(),
    date: today(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  payload.carbs = calcCarbs(payload);

  if (!payload.grams || (!payload.carbsPer100 && !(payload.carbsPerPortion && payload.portionGrams))) {
    alert('Please provide grams and carb reference values.');
    return;
  }

  const idx = state.entries.findIndex((e) => e.id === payload.id);
  if (idx >= 0) {
    payload.createdAt = state.entries[idx].createdAt || payload.createdAt;
    state.entries[idx] = payload;
  } else {
    state.entries.push(payload);
  }

  rebuildProductCatalog();
  renderProductOptions();
  saveLocal();
  render();
  resetForm();
  await syncAfterMutation();
}

async function deleteEntry(entryId) {
  const entry = state.entries.find((e) => e.id === entryId);
  if (!entry) return;
  if (!confirm(`Delete ${entry.name || 'this entry'}?`)) return;
  state.entries = state.entries.filter((e) => e.id !== entryId);
  rebuildProductCatalog();
  renderProductOptions();
  saveLocal();
  render();
  if (state.editingEntryId === entryId) resetForm();
  await syncAfterMutation();
}

async function syncAfterMutation() {
  if (!els.googleClientId.value.trim()) return;
  try {
    await syncToDrive({ silent: true });
  } catch {
    // local save already succeeded
  }
}

async function scanNutrition(file) {
  els.scanResult.textContent = 'Reading label...';
  try {
    const result = await Tesseract.recognize(file, 'eng');
    const text = result.data.text.replace(/\s+/g, ' ');

    const per100Match =
      text.match(/carbohydrate[s]?[^\d]*(\d+[\.,]?\d*)\s*g[^\d]{0,20}(100\s*g|per\s*100)/i) ||
      text.match(/(100\s*g|per\s*100)[^\d]{0,30}carbohydrate[s]?[^\d]*(\d+[\.,]?\d*)\s*g/i);

    const anyCarbMatch = text.match(/carbohydrate[s]?[^\d]*(\d+[\.,]?\d*)\s*g/i);

    const per100Value = per100Match
      ? Number((per100Match[1] || per100Match[2]).replace(',', '.'))
      : anyCarbMatch
        ? Number(anyCarbMatch[1].replace(',', '.'))
        : 0;

    if (per100Value > 0) {
      els.carbsPer100.value = round1(per100Value).toFixed(1);
      els.scanResult.textContent = `Detected ≈ ${round1(per100Value).toFixed(1)}g carbs per 100g. Please verify.`;
    } else {
      els.scanResult.textContent = 'Could not confidently read carbs. Please enter values manually.';
    }
  } catch {
    els.scanResult.textContent = 'Scan failed. Please enter values manually.';
  }
}

async function startBarcodeScan() {
  if (!('BarcodeDetector' in window)) {
    els.barcodeStatus.textContent = 'Barcode scanning not supported on this browser. Enter barcode manually.';
    return;
  }

  try {
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    state.scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    els.barcodeVideo.srcObject = state.scannerStream;
    els.barcodeScannerWrap.classList.remove('hidden');
    els.barcodeStatus.textContent = 'Scanning barcode…';

    state.scannerTimer = setInterval(async () => {
      try {
        const codes = await detector.detect(els.barcodeVideo);
        if (!codes.length) return;
        const value = codes[0].rawValue;
        if (!value) return;
        els.barcode.value = value;
        applyBarcodePreset();
        stopBarcodeScan();
      } catch {
        // keep scanning
      }
    }, 400);
  } catch {
    els.barcodeStatus.textContent = 'Camera access failed. Enter barcode manually.';
  }
}

function stopBarcodeScan() {
  if (state.scannerTimer) clearInterval(state.scannerTimer);
  state.scannerTimer = null;
  if (state.scannerStream) {
    state.scannerStream.getTracks().forEach((track) => track.stop());
  }
  state.scannerStream = null;
  els.barcodeVideo.srcObject = null;
  els.barcodeScannerWrap.classList.add('hidden');
}

function buildKeyboard() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  keys.forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = key;
    btn.addEventListener('click', () => {
      if (key === '⌫') {
        els.gramsConsumed.value = els.gramsConsumed.value.slice(0, -1);
        return;
      }
      if (key === '.' && els.gramsConsumed.value.includes('.')) return;
      els.gramsConsumed.value += key;
    });
    els.keyboardGrid.appendChild(btn);
  });
}

function openKeyboard(open) {
  els.keyboardSheet.classList.toggle('hidden', !open);
  els.keyboardSheet.setAttribute('aria-hidden', String(!open));
}

let tokenClient;
async function getToken({ silent = false } = {}) {
  const clientId = els.googleClientId.value.trim();
  if (!clientId) throw new Error('Add Google OAuth Client ID first.');
  localStorage.setItem('googleClientId', clientId);

  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (resp) => {
        if (resp.error) reject(resp);
        else resolve(resp.access_token);
      },
    });
    tokenClient.requestAccessToken({ prompt: silent ? '' : 'consent' });
  });
}

async function findFile(token) {
  if (state.driveFileId) return state.driveFileId;
  const listResp = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=name='carbculator_entries.json'+and+trashed=false&fields=files(id,name)",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await listResp.json();
  if (data.files?.[0]?.id) {
    state.driveFileId = data.files[0].id;
    localStorage.setItem('driveFileId', state.driveFileId);
  }
  return state.driveFileId;
}

async function createFile(token) {
  const metadata = { name: 'carbculator_entries.json', mimeType: 'application/json' };
  const content = JSON.stringify({ entries: state.entries, updatedAt: new Date().toISOString() });
  const body = new Blob(
    [
      '--foo_bar_baz\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      '\r\n--foo_bar_baz\r\nContent-Type: application/json\r\n\r\n',
      content,
      '\r\n--foo_bar_baz--',
    ],
    { type: 'multipart/related; boundary=foo_bar_baz' },
  );

  const createResp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/related; boundary=foo_bar_baz',
    },
    body,
  });
  const created = await createResp.json();
  state.driveFileId = created.id;
  localStorage.setItem('driveFileId', state.driveFileId);
  return state.driveFileId;
}

function mergeEntries(localEntries, remoteEntries) {
  const combined = [...localEntries, ...remoteEntries].map((entry) => ({
    ...entry,
    id: entry.id || `${entry.createdAt || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }));
  const dedup = new Map();
  combined.forEach((entry) => {
    const key = [
      entry.id || '',
      entry.name || '',
      entry.date || '',
      round1(entry.grams).toFixed(1),
      round1(entry.carbs).toFixed(1),
      entry.createdAt || '',
    ].join('|');
    dedup.set(key, entry);
  });
  return Array.from(dedup.values());
}

async function loadFromDriveOnStart() {
  if (!els.googleClientId.value.trim()) return;
  els.driveLoadStatus.textContent = 'Checking Google Drive for saved products…';
  try {
    const token = await getToken({ silent: true });
    const fileId = await findFile(token);
    if (!fileId) {
      els.driveLoadStatus.textContent = 'No Drive file found yet. Add your first entry to create one.';
      return;
    }

    const readResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readResp.json();
    const remoteEntries = Array.isArray(data.entries) ? data.entries : [];

    state.entries = mergeEntries(state.entries, remoteEntries);
    saveLocal();
    rebuildProductCatalog();
    renderProductOptions();
    render();
    els.driveLoadStatus.textContent = `Loaded ${remoteEntries.length} entries from Drive.`;
  } catch {
    els.driveLoadStatus.textContent = 'Drive preload skipped (sign-in required or unavailable).';
  }
}

async function syncToDrive({ silent = false } = {}) {
  try {
    els.syncDrive.disabled = true;
    els.syncDrive.textContent = 'Syncing...';
    const token = await getToken({ silent });
    let fileId = await findFile(token);
    if (!fileId) fileId = await createFile(token);

    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries: state.entries, updatedAt: new Date().toISOString() }),
    });
    els.syncDrive.textContent = 'Synced ✓';
    setTimeout(() => (els.syncDrive.textContent = 'Sync Google Drive'), 1500);
  } catch (err) {
    if (!silent) alert(`Drive sync failed: ${err.message || 'Unknown error'}`);
    els.syncDrive.textContent = 'Sync Google Drive';
    throw err;
  } finally {
    els.syncDrive.disabled = false;
  }
}

async function triggerInstall() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installApp.classList.add('hidden');
}

els.limitRange.addEventListener('input', () => {
  state.limit = Number(els.limitRange.value);
  localStorage.setItem('carbLimit', String(state.limit));
  render();
});
els.addEntry.addEventListener('click', saveEntry);
els.cancelEdit.addEventListener('click', resetForm);
els.productName.addEventListener('change', applyNamePreset);
els.productName.addEventListener('blur', applyNamePreset);
els.barcode.addEventListener('change', applyBarcodePreset);
els.scanBarcode.addEventListener('click', startBarcodeScan);
els.stopBarcodeScan.addEventListener('click', stopBarcodeScan);
els.nutritionPhoto.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) scanNutrition(file);
});
els.syncDrive.addEventListener('click', () => syncToDrive({ silent: false }));
els.openKeyboard.addEventListener('click', () => openKeyboard(true));
els.closeKeyboard.addEventListener('click', () => openKeyboard(false));
els.entriesList.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const entryId = button.dataset.id;
  if (button.dataset.action === 'edit') beginEdit(entryId);
  if (button.dataset.action === 'delete') deleteEntry(entryId);
});
els.installApp.addEventListener('click', triggerInstall);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  els.installApp.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
  els.installApp.classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

buildKeyboard();
load();
loadFromDriveOnStart();
