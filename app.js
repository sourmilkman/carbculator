const GOOGLE_CLIENT_ID = '1629709103-c7ltm86t4lbiaaqi7igedtsadjosqrdj.apps.googleusercontent.com';
const DRIVE_FILENAME = 'carbculator_entries.json';
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const state = {
  entries: JSON.parse(localStorage.getItem('carbEntries') || '[]'),
  products: JSON.parse(localStorage.getItem('carbProducts') || '{}'), // keyed by barcode
  limit: Number(localStorage.getItem('carbLimit') || 30),
  driveFileId: localStorage.getItem('driveFileId') || '',
  theme: localStorage.getItem('carbTheme') || (prefersDark ? 'dark' : 'light'),
  token: '',
  tokenExpiry: 0,
  activeTab: 'add',
};

const $ = (id) => document.getElementById(id);
const els = {
  dailyTotal: $('dailyTotal'), dailyStatus: $('dailyStatus'),
  themeToggle: $('themeToggle'), themeToggleLabel: $('themeToggleLabel'),
  limitRange: $('limitRange'), limitLabel: $('limitLabel'),
  limitMeter: $('limitMeter'), limitHint: $('limitHint'),
  barcode: $('barcode'), productName: $('productName'),
  gramsConsumed: $('gramsConsumed'), carbsPer100: $('carbsPer100'),
  carbsPerPortion: $('carbsPerPortion'), portionGrams: $('portionGrams'),
  carbsPerPiece: $('carbsPerPiece'), pieces: $('pieces'),
  notes: $('notes'),
  addEntry: $('addEntry'), nutritionPhoto: $('nutritionPhoto'),
  scanResult: $('scanResult'), carbPreview: $('carbPreview'),
  entriesList: $('entriesList'),
  syncDrive: $('syncDrive'), syncStatus: $('syncStatus'),
  scanBarcode: $('scanBarcode'), scannerOverlay: $('scannerOverlay'),
  scannerVideo: $('scannerVideo'), scannerHint: $('scannerHint'),
  closeScanner: $('closeScanner'),
  libraryList: $('libraryList'), librarySearch: $('librarySearch'),
  historyList: $('historyList'),
  toast: $('toast'),
};

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function toast(msg, ms = 1800) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.add('hidden'), ms);
}

function calcCarbs({ grams, carbsPer100, carbsPerPortion, portionGrams, carbsPerPiece, pieces }) {
  grams = Number(grams) || 0;
  pieces = Number(pieces) || 0;
  carbsPerPiece = Number(carbsPerPiece) || 0;
  if (pieces > 0 && carbsPerPiece > 0) return pieces * carbsPerPiece;
  if (Number(carbsPer100) > 0 && grams > 0) return (grams / 100) * Number(carbsPer100);
  if (Number(carbsPerPortion) > 0 && Number(portionGrams) > 0 && grams > 0)
    return (grams / Number(portionGrams)) * Number(carbsPerPortion);
  return 0;
}

function readForm() {
  return {
    barcode: els.barcode.value.trim(),
    name: els.productName.value.trim(),
    grams: Number(els.gramsConsumed.value || 0),
    carbsPer100: Number(els.carbsPer100.value || 0),
    carbsPerPortion: Number(els.carbsPerPortion.value || 0),
    portionGrams: Number(els.portionGrams.value || 0),
    carbsPerPiece: Number(els.carbsPerPiece.value || 0),
    pieces: Number(els.pieces.value || 0),
    notes: els.notes.value.trim(),
  };
}

function clearForm() {
  ['barcode', 'productName', 'gramsConsumed', 'carbsPer100',
   'carbsPerPortion', 'portionGrams', 'carbsPerPiece', 'pieces', 'notes']
    .forEach((k) => (els[k].value = ''));
  els.scanResult.textContent = 'Scan a barcode — saved products auto-fill. New ones look up Open Food Facts.';
  updatePreview();
}

function applyProduct(p) {
  if (!p) return;
  if (p.name) els.productName.value = p.name;
  if (p.carbsPer100) els.carbsPer100.value = String(p.carbsPer100);
  if (p.carbsPerPortion) els.carbsPerPortion.value = String(p.carbsPerPortion);
  if (p.portionGrams) els.portionGrams.value = String(p.portionGrams);
  if (p.carbsPerPiece) els.carbsPerPiece.value = String(p.carbsPerPiece);
  updatePreview();
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  els.themeToggle.checked = state.theme === 'dark';
  els.themeToggleLabel.textContent = state.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function updatePreview() {
  const c = calcCarbs(readForm());
  els.carbPreview.textContent = `${c.toFixed(1)}g carbs for this entry`;
}

function dailyTotal(date = today()) {
  return state.entries
    .filter((e) => e.date === date)
    .reduce((s, e) => s + (Number(e.carbs) || 0), 0);
}

function renderHero() {
  const total = dailyTotal();
  const ratio = state.limit === 0 ? 1 : total / state.limit;
  const meterPercent = state.limit === 0 ? 100 : Math.min(100, Math.max(0, ratio * 100));

  els.dailyTotal.textContent = `${total.toFixed(1)}g`;
  els.limitLabel.textContent = `${state.limit}g`;
  els.limitMeter.style.width = `${meterPercent}%`;
  const remaining = state.limit - total;
  els.limitHint.textContent = remaining >= 0
    ? `${remaining.toFixed(1)}g remaining today`
    : `${Math.abs(remaining).toFixed(1)}g over today`;

  els.dailyStatus.classList.remove('ok', 'warn', 'bad');
  if (total > state.limit) {
    els.dailyStatus.textContent = 'Exceeded limit';
    els.dailyStatus.classList.add('bad');
  } else if (ratio >= 0.8) {
    els.dailyStatus.textContent = 'Near limit';
    els.dailyStatus.classList.add('warn');
  } else {
    els.dailyStatus.textContent = 'Within limit';
    els.dailyStatus.classList.add('ok');
  }
}

function renderToday() {
  els.entriesList.innerHTML = '';
  const todays = state.entries.filter((e) => e.date === today()).slice().reverse();
  if (!todays.length) {
    els.entriesList.innerHTML = '<li class="empty">No entries yet — scan a barcode to start.</li>';
    return;
  }
  todays.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="entry-main">
        <strong>${escapeHtml(entry.name || 'Unnamed item')}</strong>
        <small>${entry.pieces > 0 ? entry.pieces + ' pcs' : entry.grams + 'g'}${entry.notes ? ' · ' + escapeHtml(entry.notes) : ''}</small>
      </div>
      <div class="entry-side">
        <span class="entry-carbs">${entry.carbs.toFixed(1)}g</span>
        <button class="icon-btn" data-del="${entry.id}" aria-label="Delete">×</button>
      </div>`;
    els.entriesList.appendChild(li);
  });
}

function renderLibrary() {
  const q = (els.librarySearch.value || '').toLowerCase();
  const items = Object.values(state.products)
    .filter((p) => !q || (p.name || '').toLowerCase().includes(q) || (p.barcode || '').includes(q))
    .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  els.libraryList.innerHTML = '';
  if (!items.length) {
    els.libraryList.innerHTML = '<li class="empty">No saved products yet.</li>';
    return;
  }
  items.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="entry-main">
        <strong>${escapeHtml(p.name || 'Unnamed')}</strong>
        <small>${p.barcode || ''} · ${p.carbsPer100 || 0}g/100g</small>
      </div>
      <div class="entry-side">
        <button class="btn ghost" data-use="${p.barcode}">Use</button>
        <button class="icon-btn" data-delprod="${p.barcode}" aria-label="Delete">×</button>
      </div>`;
    els.libraryList.appendChild(li);
  });
}

function renderHistory() {
  const days = {};
  state.entries.forEach((e) => {
    days[e.date] = (days[e.date] || 0) + (Number(e.carbs) || 0);
  });
  const sorted = Object.entries(days).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  els.historyList.innerHTML = '';
  if (!sorted.length) {
    els.historyList.innerHTML = '<li class="empty">No history yet.</li>';
    return;
  }
  sorted.forEach(([date, total]) => {
    const li = document.createElement('li');
    const status = total > state.limit ? 'bad' : total / state.limit >= 0.8 ? 'warn' : 'ok';
    li.innerHTML = `
      <div class="entry-main">
        <strong>${date}</strong>
        <small>${state.entries.filter((e) => e.date === date).length} entries</small>
      </div>
      <div class="entry-side">
        <span class="status-pill ${status}">${total.toFixed(1)}g</span>
      </div>`;
    els.historyList.appendChild(li);
  });
}

function renderAll() {
  renderHero();
  renderToday();
  renderLibrary();
  renderHistory();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function persist() {
  localStorage.setItem('carbEntries', JSON.stringify(state.entries));
  localStorage.setItem('carbProducts', JSON.stringify(state.products));
}

function addEntry() {
  const f = readForm();
  const carbs = calcCarbs(f);
  const usingPieces = f.pieces > 0 && f.carbsPerPiece > 0;
  if (!usingPieces && (!f.grams || f.grams <= 0)) {
    toast('Enter grams consumed (or pieces + carbs/piece).');
    return;
  }
  if (carbs <= 0) {
    toast('Enter carbs/100g, per portion, or per piece.');
    return;
  }

  const entry = { id: uid(), date: today(), carbs, ...f };
  state.entries.push(entry);

  if (f.barcode) {
    state.products[f.barcode] = {
      barcode: f.barcode,
      name: f.name,
      carbsPer100: f.carbsPer100,
      carbsPerPortion: f.carbsPerPortion,
      portionGrams: f.portionGrams,
      carbsPerPiece: f.carbsPerPiece,
      lastUsed: Date.now(),
    };
  }

  persist();
  renderAll();
  clearForm();
  toast(`Added ${carbs.toFixed(1)}g carbs`);
  scheduleSync();
}

function deleteEntry(id) {
  state.entries = state.entries.filter((e) => e.id !== id);
  persist();
  renderAll();
  scheduleSync();
}

function deleteProduct(barcode) {
  delete state.products[barcode];
  persist();
  renderLibrary();
  scheduleSync();
}

// ---------- Open Food Facts ----------
async function lookupOpenFoodFacts(barcode) {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await r.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const carbs = Number(p.nutriments?.['carbohydrates_100g']) || 0;
    return {
      name: p.product_name || p.generic_name || '',
      carbsPer100: carbs,
      carbsPerPortion: Number(p.nutriments?.['carbohydrates_serving']) || 0,
      portionGrams: Number(p.serving_quantity) || 0,
    };
  } catch {
    return null;
  }
}

async function handleBarcode(code) {
  els.barcode.value = code;
  const saved = state.products[code];
  if (saved) {
    applyProduct(saved);
    els.scanResult.textContent = `Recognised: ${saved.name || code}. Enter grams.`;
    els.gramsConsumed.focus();
    return;
  }
  els.scanResult.textContent = 'Looking up Open Food Facts…';
  const off = await lookupOpenFoodFacts(code);
  if (off && (off.carbsPer100 || off.carbsPerPortion)) {
    applyProduct(off);
    els.scanResult.textContent = `Found: ${off.name || 'product'}. Verify and add grams.`;
  } else {
    els.scanResult.textContent = 'New barcode — enter carbs manually. It will be saved for next time.';
    els.productName.focus();
  }
}

// ---------- Barcode scanner ----------
let scannerStream = null;
let zxingControls = null;
let nativeDetector = null;

async function openScanner() {
  els.scannerOverlay.classList.remove('hidden');
  els.scannerHint.textContent = 'Starting camera…';
  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    els.scannerVideo.srcObject = scannerStream;
    await els.scannerVideo.play();
    els.scannerHint.textContent = 'Point camera at a barcode';

    if ('BarcodeDetector' in window) {
      nativeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
      });
      detectLoop();
    } else if (window.ZXingBrowser) {
      const reader = new ZXingBrowser.BrowserMultiFormatReader();
      zxingControls = await reader.decodeFromStream(scannerStream, els.scannerVideo, (result) => {
        if (result) onBarcodeDetected(result.getText());
      });
    } else {
      els.scannerHint.textContent = 'Scanner unavailable — type the barcode manually.';
    }
  } catch (err) {
    els.scannerHint.textContent = `Camera unavailable: ${err.message || err}`;
  }
}

async function detectLoop() {
  if (!nativeDetector || els.scannerOverlay.classList.contains('hidden')) return;
  try {
    const codes = await nativeDetector.detect(els.scannerVideo);
    if (codes && codes[0]) {
      onBarcodeDetected(codes[0].rawValue);
      return;
    }
  } catch { /* ignore */ }
  requestAnimationFrame(detectLoop);
}

function onBarcodeDetected(code) {
  if (!code) return;
  closeScanner();
  toast(`Scanned ${code}`);
  setActiveTab('add');
  handleBarcode(code);
}

function closeScanner() {
  els.scannerOverlay.classList.add('hidden');
  if (zxingControls) { try { zxingControls.stop(); } catch {} zxingControls = null; }
  nativeDetector = null;
  if (scannerStream) {
    scannerStream.getTracks().forEach((t) => t.stop());
    scannerStream = null;
  }
}

// ---------- Nutrition label OCR ----------
function extractCarbsPer100(rawText) {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const patterns = [
    /carbohydrate[s]?[^\d]{0,40}(\d+[.,]?\d*)\s*g[^\d]{0,40}(?:per\s*)?100\s*g/i,
    /(?:per\s*)?100\s*g[^\d]{0,60}carbohydrate[s]?[^\d]{0,40}(\d+[.,]?\d*)\s*g/i,
    /carbohydrate[s]?[^\d]{0,40}(\d+[.,]?\d*)\s*g/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const v = Number(m[1].replace(',', '.'));
      if (Number.isFinite(v) && v > 0) return v;
    }
  }
  return 0;
}

async function scanNutrition(file) {
  els.scanResult.textContent = 'Reading label…';
  try {
    const result = await Tesseract.recognize(file, 'eng');
    const v = extractCarbsPer100(result.data.text);
    if (v > 0) {
      els.carbsPer100.value = String(v);
      els.scanResult.textContent = `Detected ~${v}g carbs per 100g. Verify before adding.`;
      updatePreview();
    } else {
      els.scanResult.textContent = 'Could not read carbs. Enter manually.';
    }
  } catch {
    els.scanResult.textContent = 'Scan failed.';
  }
}

// ---------- Google Drive sync ----------
let tokenClient;
function getToken(interactive = false) {
  return new Promise((resolve, reject) => {
    if (state.token && Date.now() < state.tokenExpiry - 5000) return resolve(state.token);
    if (!window.google?.accounts?.oauth2) return reject(new Error('Google library not loaded'));
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (resp) => {
        if (resp.error) return reject(resp);
        state.token = resp.access_token;
        state.tokenExpiry = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
        resolve(state.token);
      },
    });
    tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
  });
}

async function findOrCreateFile(token) {
  if (state.driveFileId) return state.driveFileId;
  const list = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILENAME}'+and+trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((r) => r.json());
  if (list.files?.[0]?.id) {
    state.driveFileId = list.files[0].id;
    localStorage.setItem('driveFileId', state.driveFileId);
    return state.driveFileId;
  }
  const metadata = { name: DRIVE_FILENAME, mimeType: 'application/json' };
  const body = new Blob(
    ['--foo\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n', JSON.stringify(metadata),
     '\r\n--foo\r\nContent-Type: application/json\r\n\r\n', '{}', '\r\n--foo--'],
    { type: 'multipart/related; boundary=foo' },
  );
  const created = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/related; boundary=foo' },
    body,
  }).then((r) => r.json());
  state.driveFileId = created.id;
  localStorage.setItem('driveFileId', state.driveFileId);
  return state.driveFileId;
}

async function pullFromDrive(token, fileId) {
  try {
    const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return;
    const data = await r.json();
    if (Array.isArray(data.entries)) {
      const ids = new Set(state.entries.map((e) => e.id));
      data.entries.forEach((e) => { if (e.id && !ids.has(e.id)) state.entries.push(e); });
    }
    if (data.products && typeof data.products === 'object') {
      Object.entries(data.products).forEach(([code, p]) => {
        const local = state.products[code];
        if (!local || (p.lastUsed || 0) > (local.lastUsed || 0)) state.products[code] = p;
      });
    }
    persist();
  } catch { /* ignore */ }
}

async function syncToDrive({ interactive = false } = {}) {
  if (!els.syncDrive) return;
  try {
    els.syncDrive.disabled = true;
    els.syncDrive.textContent = 'Syncing…';
    const token = await getToken(interactive);
    const fileId = await findOrCreateFile(token);
    await pullFromDrive(token, fileId);
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: state.entries, products: state.products, updatedAt: new Date().toISOString() }),
    });
    els.syncDrive.textContent = 'Synced ✓';
    els.syncStatus.textContent = `Last synced ${new Date().toLocaleTimeString()}`;
    renderAll();
    setTimeout(() => (els.syncDrive.textContent = 'Sync Drive'), 1500);
  } catch (err) {
    els.syncStatus.textContent = `Sync failed: ${err.message || err.error || 'sign in'}`;
    els.syncDrive.textContent = 'Sync Drive';
  } finally {
    els.syncDrive.disabled = false;
  }
}

let syncTimer = null;
function scheduleSync() {
  if (!state.token) return; // only auto-sync after first manual sign-in
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncToDrive(), 2500);
}

// ---------- Tabs ----------
function setActiveTab(name) {
  state.activeTab = name;
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((p) =>
    p.classList.toggle('hidden', p.dataset.panel !== name));
}

// ---------- Wire up ----------
els.limitRange.value = String(state.limit);
applyTheme();
renderAll();

els.limitRange.addEventListener('input', () => {
  state.limit = Number(els.limitRange.value);
  localStorage.setItem('carbLimit', String(state.limit));
  renderHero();
  renderHistory();
});
els.themeToggle.addEventListener('change', () => {
  state.theme = els.themeToggle.checked ? 'dark' : 'light';
  localStorage.setItem('carbTheme', state.theme);
  applyTheme();
});
els.addEntry.addEventListener('click', addEntry);
els.nutritionPhoto.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) scanNutrition(file);
});
els.syncDrive.addEventListener('click', () => syncToDrive({ interactive: !state.token }));
els.scanBarcode.addEventListener('click', openScanner);
els.closeScanner.addEventListener('click', closeScanner);

['carbsPer100', 'carbsPerPortion', 'portionGrams', 'gramsConsumed', 'carbsPerPiece', 'pieces'].forEach((k) => {
  els[k].addEventListener('input', updatePreview);
});
els.barcode.addEventListener('change', () => {
  const v = els.barcode.value.trim();
  if (v.length >= 6) handleBarcode(v);
});
document.querySelectorAll('[data-portion]').forEach((b) => {
  b.addEventListener('click', () => {
    const mult = Number(b.dataset.portion);
    const pg = Number(els.portionGrams.value || 0);
    if (pg > 0) {
      els.gramsConsumed.value = String(+(pg * mult).toFixed(1));
    } else {
      els.gramsConsumed.value = String(+(100 * mult).toFixed(1));
      toast('No portion grams set — using 100g.');
    }
    updatePreview();
  });
});
document.querySelectorAll('[data-pieces]').forEach((b) => {
  b.addEventListener('click', () => {
    els.pieces.value = b.dataset.pieces;
    if (!Number(els.carbsPerPiece.value)) {
      toast('Set carbs per piece for this product.');
      els.carbsPerPiece.focus();
    }
    updatePreview();
  });
});

document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => setActiveTab(t.dataset.tab));
});

els.entriesList.addEventListener('click', (e) => {
  const id = e.target.dataset.del;
  if (id) deleteEntry(id);
});
els.libraryList.addEventListener('click', (e) => {
  const use = e.target.dataset.use;
  const del = e.target.dataset.delprod;
  if (use) {
    const p = state.products[use];
    if (p) { setActiveTab('add'); els.barcode.value = use; applyProduct(p); els.gramsConsumed.focus(); }
  }
  if (del) deleteProduct(del);
});
els.librarySearch.addEventListener('input', renderLibrary);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// Try a silent token grab once GIS is ready, then pull existing data.
window.addEventListener('load', () => {
  setTimeout(async () => {
    try {
      await getToken(false);
      await syncToDrive();
    } catch { /* user can sign in manually */ }
  }, 800);
});
