const GOOGLE_CLIENT_ID = '1629709103-c7ltm86t4lbiaaqi7igedtsadjosqrdj.apps.googleusercontent.com';

const state = {
  entries: [],
  limit: Number(localStorage.getItem('carbLimit') || 30),
  driveFileId: localStorage.getItem('driveFileId') || '',
};

const els = {
  dailyTotal: document.getElementById('dailyTotal'),
  dailyStatus: document.getElementById('dailyStatus'),
  limitRange: document.getElementById('limitRange'),
  limitLabel: document.getElementById('limitLabel'),
  limitMeter: document.getElementById('limitMeter'),
  limitHint: document.getElementById('limitHint'),
  productName: document.getElementById('productName'),
  gramsConsumed: document.getElementById('gramsConsumed'),
  carbsPer100: document.getElementById('carbsPer100'),
  carbsPerPortion: document.getElementById('carbsPerPortion'),
  portionGrams: document.getElementById('portionGrams'),
  notes: document.getElementById('notes'),
  addEntry: document.getElementById('addEntry'),
  nutritionPhoto: document.getElementById('nutritionPhoto'),
  scanResult: document.getElementById('scanResult'),
  entriesList: document.getElementById('entriesList'),
  syncDrive: document.getElementById('syncDrive'),
  openKeyboard: document.getElementById('openKeyboard'),
  closeKeyboard: document.getElementById('closeKeyboard'),
  keyboardSheet: document.getElementById('keyboardSheet'),
  keyboardGrid: document.getElementById('keyboardGrid'),
};

const today = () => new Date().toISOString().slice(0, 10);

function load() {
  state.entries = JSON.parse(localStorage.getItem('carbEntries') || '[]');
  els.limitRange.value = String(state.limit);
  render();
}

function saveLocal() {
  localStorage.setItem('carbEntries', JSON.stringify(state.entries));
}

function calcCarbs({ grams, carbsPer100, carbsPerPortion, portionGrams }) {
  if (carbsPer100 > 0) return (grams / 100) * carbsPer100;
  if (carbsPerPortion > 0 && portionGrams > 0) return (grams / portionGrams) * carbsPerPortion;
  return 0;
}

function render() {
  const total = state.entries.filter((e) => e.date === today()).reduce((sum, e) => sum + e.carbs, 0);
  const ratio = state.limit === 0 ? 1 : total / state.limit;
  const meterPercent = state.limit === 0 ? 100 : Math.min(100, Math.max(0, ratio * 100));

  els.dailyTotal.textContent = `${total.toFixed(1)}g`;
  els.limitLabel.textContent = `${state.limit}g`;
  els.limitMeter.style.width = `${meterPercent}%`;
  const remaining = state.limit - total;
  els.limitHint.textContent =
    remaining >= 0 ? `${remaining.toFixed(1)}g remaining today` : `${Math.abs(remaining).toFixed(1)}g over today`;

  if (total > state.limit) {
    els.dailyStatus.textContent = 'Exceeded limit';
    els.dailyStatus.style.background = 'rgba(194, 65, 60, 0.22)';
    els.dailyStatus.style.color = '#ffd7d4';
  } else if (ratio >= 0.8) {
    els.dailyStatus.textContent = 'Near limit';
    els.dailyStatus.style.background = 'rgba(217, 154, 43, 0.24)';
    els.dailyStatus.style.color = '#ffe0a3';
  } else {
    els.dailyStatus.textContent = 'Within limit';
    els.dailyStatus.style.background = 'rgba(223, 241, 238, 0.16)';
    els.dailyStatus.style.color = '#b9f2e8';
  }

  els.entriesList.innerHTML = '';
  state.entries
    .filter((e) => e.date === today())
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${entry.name || 'Unnamed item'}</strong><small>${entry.grams}g | ${entry.date}</small></div><div>${entry.carbs.toFixed(1)}g carbs</div>`;
      els.entriesList.appendChild(li);
    });
}

function addEntry() {
  const payload = {
    name: els.productName.value.trim(),
    grams: Number(els.gramsConsumed.value || 0),
    carbsPer100: Number(els.carbsPer100.value || 0),
    carbsPerPortion: Number(els.carbsPerPortion.value || 0),
    portionGrams: Number(els.portionGrams.value || 0),
    notes: els.notes.value.trim(),
    date: today(),
  };
  payload.carbs = calcCarbs(payload);

  if (!payload.grams || payload.carbs < 0) {
    alert('Please provide grams and at least one carb reference value.');
    return;
  }

  state.entries.push(payload);
  saveLocal();
  render();

  ['productName', 'gramsConsumed', 'carbsPer100', 'carbsPerPortion', 'portionGrams', 'notes'].forEach((key) => {
    els[key].value = '';
  });
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
      els.carbsPer100.value = String(per100Value);
      els.scanResult.textContent = `Detected about ${per100Value}g carbs per 100g. Please verify.`;
    } else {
      els.scanResult.textContent = 'Could not confidently read carbs. Please enter manually.';
    }
  } catch {
    els.scanResult.textContent = 'Scan failed. Please enter values manually.';
  }
}

function buildKeyboard() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'Back'];
  keys.forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = key;
    btn.addEventListener('click', () => {
      if (key === 'Back') {
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
async function getToken() {
  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (resp) => {
        if (resp.error) reject(resp);
        else resolve(resp.access_token);
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function findOrCreateFile(token) {
  if (state.driveFileId) return state.driveFileId;
  const listResp = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=name='carbculator_entries.json'+and+trashed=false&fields=files(id,name)",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await listResp.json();
  if (data.files?.[0]?.id) {
    state.driveFileId = data.files[0].id;
    localStorage.setItem('driveFileId', state.driveFileId);
    return state.driveFileId;
  }

  const metadata = { name: 'carbculator_entries.json', mimeType: 'application/json' };
  const content = JSON.stringify({ entries: state.entries });
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

async function syncToDrive() {
  try {
    els.syncDrive.disabled = true;
    els.syncDrive.textContent = 'Syncing...';
    const token = await getToken();
    const fileId = await findOrCreateFile(token);
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries: state.entries, updatedAt: new Date().toISOString() }),
    });
    els.syncDrive.textContent = 'Synced';
    setTimeout(() => (els.syncDrive.textContent = 'Sync Google Drive'), 1500);
  } catch (err) {
    alert(`Drive sync failed: ${err.message || 'Unknown error'}`);
    els.syncDrive.textContent = 'Sync Google Drive';
  } finally {
    els.syncDrive.disabled = false;
  }
}

els.limitRange.addEventListener('input', () => {
  state.limit = Number(els.limitRange.value);
  localStorage.setItem('carbLimit', String(state.limit));
  render();
});
els.addEntry.addEventListener('click', addEntry);
els.nutritionPhoto.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) scanNutrition(file);
});
els.syncDrive.addEventListener('click', syncToDrive);
els.openKeyboard.addEventListener('click', () => openKeyboard(true));
els.closeKeyboard.addEventListener('click', () => openKeyboard(false));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

buildKeyboard();
load();
