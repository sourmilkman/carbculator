const GOOGLE_CLIENT_ID = '1629709103-c7ltm86t4lbiaaqi7igedtsadjosqrdj.apps.googleusercontent.com';
const DRIVE_FILENAME = 'carbculator_entries.json';
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

// Keto macro defaults: ~5% carbs, ~20% protein, ~75% fat of a 2000 kcal/day reference.
const MACROS = ['carbs', 'fat', 'protein'];
const MACRO_LABEL = { carbs: 'carbs', fat: 'fat', protein: 'protein' };
const DEFAULT_LIMITS = { carbs: 30, fat: 165, protein: 100, calories: 2000 };

// Calorie split for a strict ketogenic diet.
const KETO_KCAL_PCT = { carbs: 5, protein: 20, fat: 75 };
const KCAL_PER_G = { carbs: 4, protein: 4, fat: 9 };

const storedLimits = JSON.parse(localStorage.getItem('macroLimits') || 'null');
const legacyCarbLimit = Number(localStorage.getItem('carbLimit') || 0);

const state = {
  entries: JSON.parse(localStorage.getItem('carbEntries') || '[]'),
  products: JSON.parse(localStorage.getItem('carbProducts') || '{}'), // keyed by barcode
  limits: storedLimits
    ? { ...DEFAULT_LIMITS, ...storedLimits }
    : { ...DEFAULT_LIMITS, ...(legacyCarbLimit ? { carbs: legacyCarbLimit } : {}) },
  lockRatios: localStorage.getItem('lockRatios') === '1',
  driveFileId: localStorage.getItem('driveFileId') || '',
  theme: localStorage.getItem('carbTheme') || (prefersDark ? 'dark' : 'light'),
  token: '',
  tokenExpiry: 0,
  activeTab: 'add',
};

const $ = (id) => document.getElementById(id);
const els = {
  themeToggle: $('themeToggle'), themeToggleLabel: $('themeToggleLabel'),
  // per-macro hero elements
  totals:      { carbs: $('carbsTotal'),      fat: $('fatTotal'),      protein: $('proteinTotal'),      calories: $('caloriesTotal') },
  statuses:    { carbs: $('carbsStatus'),     fat: $('fatStatus'),     protein: $('proteinStatus'),     calories: $('caloriesStatus') },
  limitRanges: { carbs: $('carbsLimitRange'), fat: $('fatLimitRange'), protein: $('proteinLimitRange'), calories: $('caloriesLimitRange') },
  limitLabels: { carbs: $('carbsLimitLabel'), fat: $('fatLimitLabel'), protein: $('proteinLimitLabel'), calories: $('caloriesLimitLabel') },
  meters:      { carbs: $('carbsMeter'),      fat: $('fatMeter'),      protein: $('proteinMeter'),      calories: $('caloriesMeter') },
  hints:       { carbs: $('carbsHint'),       fat: $('fatHint'),       protein: $('proteinHint'),       calories: $('caloriesHint') },
  lockRatios: $('lockRatios'), lockRatiosLabel: $('lockRatiosLabel'),

  barcode: $('barcode'), productName: $('productName'),
  gramsConsumed: $('gramsConsumed'),
  carbsPer100: $('carbsPer100'), fatPer100: $('fatPer100'), proteinPer100: $('proteinPer100'),
  carbsPerPortion: $('carbsPerPortion'), fatPerPortion: $('fatPerPortion'), proteinPerPortion: $('proteinPerPortion'),
  carbsPerPiece: $('carbsPerPiece'), fatPerPiece: $('fatPerPiece'), proteinPerPiece: $('proteinPerPiece'),
  portionGrams: $('portionGrams'),
  pieces: $('pieces'), totalPieces: $('totalPieces'),
  notes: $('notes'),
  addEntry: $('addEntry'), saveProduct: $('saveProduct'), nutritionPhoto: $('nutritionPhoto'),
  scanResult: $('scanResult'), carbPreview: $('carbPreview'),
  entriesList: $('entriesList'),
  syncDrive: $('syncDrive'), syncStatus: $('syncStatus'),
  scanBarcode: $('scanBarcode'), scannerOverlay: $('scannerOverlay'),
  scannerVideo: $('scannerVideo'), scannerHint: $('scannerHint'),
  closeScanner: $('closeScanner'),
  libraryList: $('libraryList'), librarySearch: $('librarySearch'),
  historyList: $('historyList'),
  suggestList: $('suggestList'), suggestRemaining: $('suggestRemaining'),
  suggestLacking: $('suggestLacking'), refreshSuggest: $('refreshSuggest'),
  toast: $('toast'),
};

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fieldKey = (macro, suffix) => macro + cap(suffix); // e.g. carbsPer100

function toast(msg, ms = 1800) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.add('hidden'), ms);
}

function derivePerPiece(f, macro) {
  const manual = Number(f[fieldKey(macro, 'PerPiece')]) || 0;
  if (manual > 0) return manual;
  const tp = Number(f.totalPieces) || 0;
  if (tp <= 0) return 0;
  const cpp = Number(f[fieldKey(macro, 'PerPortion')]) || 0;
  if (cpp > 0) return cpp / tp;
  const pg = Number(f.portionGrams) || 0;
  const c100 = Number(f[fieldKey(macro, 'Per100')]) || 0;
  if (pg > 0 && c100 > 0) return (pg * c100 / 100) / tp;
  return 0;
}

function calcMacro(f, macro) {
  const grams = Number(f.grams) || 0;
  const pieces = Number(f.pieces) || 0;
  const perPiece = derivePerPiece(f, macro);
  if (pieces > 0 && perPiece > 0) return pieces * perPiece;
  const c100 = Number(f[fieldKey(macro, 'Per100')]) || 0;
  if (c100 > 0 && grams > 0) return (grams / 100) * c100;
  const cpp = Number(f[fieldKey(macro, 'PerPortion')]) || 0;
  const pg = Number(f.portionGrams) || 0;
  if (cpp > 0 && pg > 0 && grams > 0) return (grams / pg) * cpp;
  return 0;
}

function calcAllMacros(f) {
  const out = {};
  MACROS.forEach((m) => { out[m] = calcMacro(f, m); });
  return out;
}

function readForm() {
  const f = {
    barcode: els.barcode.value.trim(),
    name: els.productName.selectedIndex > 0
      ? els.productName.options[els.productName.selectedIndex].textContent.trim()
      : '',
    grams: Number(els.gramsConsumed.value || 0),
    portionGrams: Number(els.portionGrams.value || 0),
    pieces: Number(els.pieces.value || 0),
    totalPieces: Number(els.totalPieces.value || 0),
    notes: els.notes.value.trim(),
  };
  MACROS.forEach((m) => {
    f[fieldKey(m, 'Per100')] = Number(els[fieldKey(m, 'Per100')].value || 0);
    f[fieldKey(m, 'PerPortion')] = Number(els[fieldKey(m, 'PerPortion')].value || 0);
    f[fieldKey(m, 'PerPiece')] = Number(els[fieldKey(m, 'PerPiece')].value || 0);
  });
  return f;
}

function clearForm() {
  const keys = ['barcode', 'productName', 'gramsConsumed', 'portionGrams',
                'pieces', 'totalPieces', 'notes'];
  MACROS.forEach((m) => {
    keys.push(fieldKey(m, 'Per100'), fieldKey(m, 'PerPortion'), fieldKey(m, 'PerPiece'));
  });
  keys.forEach((k) => { if (els[k]) els[k].value = ''; });
  els.scanResult.textContent = 'Scan a barcode — saved products auto-fill. New ones look up Open Food Facts.';
  updatePreview();
}

function applyProduct(p) {
  if (!p) return;
  if (p.barcode) els.productName.value = p.barcode;
  if (p.portionGrams) els.portionGrams.value = String(p.portionGrams);
  if (p.totalPieces) els.totalPieces.value = String(p.totalPieces);
  MACROS.forEach((m) => {
    ['Per100', 'PerPortion', 'PerPiece'].forEach((suf) => {
      const k = fieldKey(m, suf);
      if (p[k]) els[k].value = String(p[k]);
    });
  });
  updatePreview();
}

function populateProductDropdown() {
  const sel = els.productName;
  const current = sel.value;
  sel.innerHTML = '<option value="">Select a product…</option>';
  Object.values(state.products)
    .filter((p) => p.name)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.barcode || '';
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  sel.value = current;
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  els.themeToggle.checked = state.theme === 'dark';
  els.themeToggleLabel.textContent = state.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function updatePreview() {
  const f = readForm();
  const macros = calcAllMacros(f);
  const kcal = MACROS.reduce((sum, m) => sum + macros[m] * KCAL_PER_G[m], 0);
  const parts = MACROS.map((m) => `${macros[m].toFixed(1)}g ${MACRO_LABEL[m]}`);
  let txt = `${parts.join(' · ')} · ${Math.round(kcal)} kcal for this entry`;

  const perPieceCarbs = derivePerPiece(f, 'carbs');
  if (perPieceCarbs > 0) {
    txt += ` · each piece ≈ ${perPieceCarbs.toFixed(2)}g carbs`;
    const remaining = state.limits.carbs - dailyTotal('carbs');
    if (remaining > 0) {
      const safe = Math.floor(remaining / perPieceCarbs);
      txt += ` · ${safe} piece${safe === 1 ? '' : 's'} left within today's carb limit`;
    }
  }
  els.carbPreview.textContent = txt;
}

function dailyTotal(macro, date = today()) {
  return state.entries
    .filter((e) => e.date === date)
    .reduce((s, e) => s + (Number(e[macro]) || 0), 0);
}

function dailyCalories(date = today()) {
  return state.entries
    .filter((e) => e.date === date)
    .reduce((s, e) => s + MACROS.reduce((sum, m) => sum + (Number(e[m]) || 0) * KCAL_PER_G[m], 0), 0);
}

function statusFor(total, limit) {
  const ratio = limit === 0 ? 1 : total / limit;
  if (total > limit) return { cls: 'bad', label: 'Exceeded limit' };
  if (ratio >= 0.8) return { cls: 'warn', label: 'Near limit' };
  return { cls: 'ok', label: 'Within limit' };
}

function renderHero() {
  MACROS.forEach((m) => {
    const total = dailyTotal(m);
    const limit = state.limits[m];
    const ratio = limit === 0 ? 1 : total / limit;
    const meterPercent = limit === 0 ? 100 : Math.min(100, Math.max(0, ratio * 100));

    els.totals[m].textContent = `${total.toFixed(1)}g`;
    els.limitLabels[m].textContent = `${limit}g`;
    els.meters[m].style.width = `${meterPercent}%`;
    const remaining = limit - total;
    els.hints[m].textContent = remaining >= 0
      ? `${remaining.toFixed(1)}g remaining today`
      : `${Math.abs(remaining).toFixed(1)}g over today`;

    const s = statusFor(total, limit);
    const pill = els.statuses[m];
    pill.classList.remove('ok', 'warn', 'bad');
    pill.classList.add(s.cls);
    pill.textContent = s.label;

    const card = pill.closest('.macro-card');
    if (card) {
      card.classList.remove('ok', 'warn', 'bad');
      card.classList.add(s.cls);
    }
  });

  // Calories (derived from macros)
  const calTotal = dailyCalories();
  const calLimit = state.limits.calories;
  const calRatio = calLimit === 0 ? 1 : calTotal / calLimit;
  const calMeterPct = calLimit === 0 ? 100 : Math.min(100, Math.max(0, calRatio * 100));

  els.totals.calories.textContent = `${Math.round(calTotal)} kcal`;
  els.limitLabels.calories.textContent = `${calLimit} kcal`;
  els.meters.calories.style.width = `${calMeterPct}%`;
  const calRemaining = calLimit - calTotal;
  els.hints.calories.textContent = calRemaining >= 0
    ? `${Math.round(calRemaining)} kcal remaining today`
    : `${Math.round(Math.abs(calRemaining))} kcal over today`;

  const calS = statusFor(calTotal, calLimit);
  const calPill = els.statuses.calories;
  calPill.classList.remove('ok', 'warn', 'bad');
  calPill.classList.add(calS.cls);
  calPill.textContent = calS.label;

  const calCard = calPill.closest('.macro-card');
  if (calCard) {
    calCard.classList.remove('ok', 'warn', 'bad');
    calCard.classList.add(calS.cls);
  }
}

function entryMacroSummary(entry) {
  const kcal = MACROS.reduce((sum, m) => sum + (Number(entry[m]) || 0) * KCAL_PER_G[m], 0);
  return MACROS.map((m) => `${(Number(entry[m]) || 0).toFixed(1)}g ${MACRO_LABEL[m]}`).join(' · ') +
    ` · ${Math.round(kcal)} kcal`;
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
        <small class="entry-macros">${entryMacroSummary(entry)}</small>
      </div>
      <div class="entry-side">
        <span class="entry-carbs">${(Number(entry.carbs) || 0).toFixed(1)}g</span>
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
    const macroText = MACROS.map((m) => `${Number(p[fieldKey(m, 'Per100')]) || 0}g ${MACRO_LABEL[m]}`).join(' · ');
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="entry-main">
        <strong>${escapeHtml(p.name || 'Unnamed')}</strong>
        <small>${p.barcode || ''} · per 100g: ${macroText}</small>
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
    const d = (days[e.date] = days[e.date] || { carbs: 0, fat: 0, protein: 0, count: 0 });
    MACROS.forEach((m) => { d[m] += Number(e[m]) || 0; });
    d.count += 1;
  });
  const sorted = Object.entries(days).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  els.historyList.innerHTML = '';
  if (!sorted.length) {
    els.historyList.innerHTML = '<li class="empty">No history yet.</li>';
    return;
  }
  sorted.forEach(([date, totals]) => {
    const calTotal = MACROS.reduce((sum, m) => sum + (totals[m] || 0) * KCAL_PER_G[m], 0);
    const calS = statusFor(calTotal, state.limits.calories);
    const pills = [
      ...MACROS.map((m) => {
        const s = statusFor(totals[m], state.limits[m]);
        return `<span class="status-pill ${s.cls}" title="${MACRO_LABEL[m]}">${MACRO_LABEL[m].charAt(0).toUpperCase()}: ${totals[m].toFixed(1)}g</span>`;
      }),
      `<span class="status-pill ${calS.cls}" title="calories">kcal: ${Math.round(calTotal)}</span>`,
    ].join('');
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="entry-main">
        <strong>${date}</strong>
        <small>${totals.count} entries</small>
      </div>
      <div class="entry-side macro-pills">
        ${pills}
      </div>`;
    els.historyList.appendChild(li);
  });
}

function remainingMacros() {
  const out = {};
  MACROS.forEach((m) => { out[m] = state.limits[m] - dailyTotal(m); });
  return out;
}

function lackingMacro(remaining) {
  let best = null;
  let bestPct = -Infinity;
  MACROS.forEach((m) => {
    const limit = state.limits[m] || 0;
    if (limit <= 0) return;
    const pct = remaining[m] / limit;
    if (pct > bestPct) { bestPct = pct; best = m; }
  });
  return best;
}

function suggestionForProduct(p, remaining) {
  // Use per-100g values; fall back to deriving per-100g from per-portion + portionGrams.
  const per100 = {};
  MACROS.forEach((m) => {
    const direct = Number(p[fieldKey(m, 'Per100')]) || 0;
    if (direct > 0) { per100[m] = direct; return; }
    const cpp = Number(p[fieldKey(m, 'PerPortion')]) || 0;
    const pg = Number(p.portionGrams) || 0;
    per100[m] = cpp > 0 && pg > 0 ? (cpp / pg) * 100 : 0;
  });
  const hasAny = MACROS.some((m) => per100[m] > 0);
  if (!hasAny) return null;

  let maxGrams = Infinity;
  let blockingMacro = null;
  MACROS.forEach((m) => {
    if (per100[m] <= 0) return;
    if (remaining[m] <= 0) { maxGrams = 0; blockingMacro = m; return; }
    const cap = (remaining[m] * 100) / per100[m];
    if (cap < maxGrams) { maxGrams = cap; blockingMacro = m; }
  });
  if (!Number.isFinite(maxGrams) || maxGrams <= 0) return null;

  // Round down to a friendly number.
  const rounded = maxGrams >= 100 ? Math.floor(maxGrams / 10) * 10
                : maxGrams >= 20  ? Math.floor(maxGrams / 5)  * 5
                                  : Math.floor(maxGrams);
  const grams = Math.max(1, rounded);

  const contribution = {};
  MACROS.forEach((m) => { contribution[m] = (grams * (per100[m] || 0)) / 100; });

  return { product: p, grams, per100, contribution, blockingMacro };
}

function renderSuggestions() {
  const remaining = remainingMacros();
  const remTxt = MACROS.map((m) => `${remaining[m].toFixed(1)}g ${MACRO_LABEL[m]}`).join(' · ');
  els.suggestRemaining.textContent = `Remaining today: ${remTxt}`;

  const products = Object.values(state.products);
  els.suggestList.innerHTML = '';

  const allOver = MACROS.every((m) => remaining[m] <= 0);
  if (allOver) {
    els.suggestLacking.textContent = "You've hit every macro limit for today. Maybe call it a day.";
    els.suggestList.innerHTML = '<li class="empty">Nothing fits — every macro is at or over its limit.</li>';
    return;
  }
  if (!products.length) {
    els.suggestLacking.textContent = 'Save some products to your library first, then come back.';
    els.suggestList.innerHTML = '<li class="empty">No saved products yet.</li>';
    return;
  }

  const lack = lackingMacro(remaining);
  els.suggestLacking.textContent = lack
    ? `Most room left in: ${MACRO_LABEL[lack]} (${remaining[lack].toFixed(1)}g). Foods rich in ${MACRO_LABEL[lack]} ranked first.`
    : 'Showing what fits within your remaining budget.';

  const suggestions = products
    .map((p) => suggestionForProduct(p, remaining))
    .filter(Boolean);

  if (!suggestions.length) {
    els.suggestList.innerHTML = '<li class="empty">No saved product fits in your remaining budget.</li>';
    return;
  }

  // Score: prioritise (1) closing the lacking macro, (2) "purity" of the lacking macro per gram.
  suggestions.forEach((s) => {
    if (lack) {
      const lackKcalDensity = (s.per100[lack] || 0) * KCAL_PER_G[lack];
      const totalKcalDensity = MACROS.reduce(
        (sum, m) => sum + (s.per100[m] || 0) * KCAL_PER_G[m], 0);
      s.purity = totalKcalDensity > 0 ? lackKcalDensity / totalKcalDensity : 0;
      s.score = (s.contribution[lack] || 0) * (0.5 + s.purity);
    } else {
      s.purity = 0;
      s.score = MACROS.reduce((sum, m) => sum + (s.contribution[m] || 0), 0);
    }
  });
  suggestions.sort((a, b) => b.score - a.score);

  const top = suggestions.slice(0, 10);
  top.forEach((s) => {
    const p = s.product;
    const portionTxt = p.portionGrams ? ` (${(s.grams / p.portionGrams).toFixed(1)} portions)` : '';
    const contribKcal = MACROS.reduce((sum, m) => sum + s.contribution[m] * KCAL_PER_G[m], 0);
    const contribTxt = MACROS
      .map((m) => `+${s.contribution[m].toFixed(1)}g ${MACRO_LABEL[m]}`)
      .join(' · ') + ` · ${Math.round(contribKcal)} kcal`;
    const purityBadge = lack && s.purity >= 0.5
      ? ` <span class="purity-badge">${Math.round(s.purity * 100)}% ${MACRO_LABEL[lack]}</span>`
      : '';
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="entry-main">
        <strong>${escapeHtml(p.name || p.barcode || 'Unnamed')}${purityBadge}</strong>
        <small>Eat up to <strong>${s.grams}g</strong>${portionTxt}</small>
        <small class="entry-macros">${contribTxt}</small>
      </div>
      <div class="entry-side">
        <button class="btn ghost" data-suggest="${p.barcode}" data-grams="${s.grams}">Log this</button>
      </div>`;
    els.suggestList.appendChild(li);
  });
}

function renderAll() {
  renderHero();
  renderToday();
  populateProductDropdown();
  renderLibrary();
  renderHistory();
  renderSuggestions();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function persist() {
  localStorage.setItem('carbEntries', JSON.stringify(state.entries));
  localStorage.setItem('carbProducts', JSON.stringify(state.products));
  localStorage.setItem('macroLimits', JSON.stringify(state.limits));
}

function productPayload(f) {
  const p = {
    barcode: f.barcode,
    name: f.name,
    portionGrams: f.portionGrams,
    totalPieces: f.totalPieces,
    lastUsed: Date.now(),
  };
  MACROS.forEach((m) => {
    ['Per100', 'PerPortion', 'PerPiece'].forEach((suf) => {
      const k = fieldKey(m, suf);
      p[k] = f[k];
    });
  });
  return p;
}

function addEntry() {
  const f = readForm();
  const macros = calcAllMacros(f);
  const usingPieces = f.pieces > 0 && (f.carbsPerPiece > 0 || f.fatPerPiece > 0 || f.proteinPerPiece > 0);
  if (!usingPieces && (!f.grams || f.grams <= 0)) {
    toast('Enter grams consumed (or pieces + carbs/piece).');
    return;
  }
  if (macros.carbs <= 0 && macros.fat <= 0 && macros.protein <= 0) {
    toast('Enter at least one macro (per 100g, per portion, or per piece).');
    return;
  }

  const entry = { id: uid(), date: today(), ...f, ...macros };
  state.entries.push(entry);

  if (f.barcode) {
    state.products[f.barcode] = productPayload(f);
  }

  persist();
  renderAll();
  clearForm();
  const kcal = MACROS.reduce((sum, m) => sum + macros[m] * KCAL_PER_G[m], 0);
  toast(`Added ${macros.carbs.toFixed(1)}g carbs · ${macros.fat.toFixed(1)}g fat · ${macros.protein.toFixed(1)}g protein · ${Math.round(kcal)} kcal`);
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
    const n = p.nutriments || {};
    return {
      name: p.product_name || p.generic_name || '',
      carbsPer100: Number(n['carbohydrates_100g']) || 0,
      fatPer100: Number(n['fat_100g']) || 0,
      proteinPer100: Number(n['proteins_100g']) || 0,
      carbsPerPortion: Number(n['carbohydrates_serving']) || 0,
      fatPerPortion: Number(n['fat_serving']) || 0,
      proteinPerPortion: Number(n['proteins_serving']) || 0,
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
  if (off && (off.carbsPer100 || off.carbsPerPortion || off.fatPer100 || off.proteinPer100)) {
    applyProduct(off);
    els.scanResult.textContent = `Found: ${off.name || 'product'}. Verify and add grams.`;
  } else {
    els.scanResult.textContent = 'New barcode — enter macros manually. It will be saved for next time.';
    els.carbsPer100.focus();
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
function extractMacroPer100(rawText, keywords) {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const kw = keywords.join('|');
  const patterns = [
    new RegExp(`(?:${kw})[^\\d]{0,40}(\\d+[.,]?\\d*)\\s*g[^\\d]{0,40}(?:per\\s*)?100\\s*g`, 'i'),
    new RegExp(`(?:per\\s*)?100\\s*g[^\\d]{0,60}(?:${kw})[^\\d]{0,40}(\\d+[.,]?\\d*)\\s*g`, 'i'),
    new RegExp(`(?:${kw})[^\\d]{0,40}(\\d+[.,]?\\d*)\\s*g`, 'i'),
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
    const text = result.data.text;
    const carbs = extractMacroPer100(text, ['carbohydrate', 'carbohydrates', 'carbs']);
    const fat = extractMacroPer100(text, ['fat', 'total fat']);
    const protein = extractMacroPer100(text, ['protein', 'proteins']);
    const found = [];
    if (carbs > 0) { els.carbsPer100.value = String(carbs); found.push(`carbs ${carbs}g`); }
    if (fat > 0)   { els.fatPer100.value = String(fat);     found.push(`fat ${fat}g`); }
    if (protein > 0) { els.proteinPer100.value = String(protein); found.push(`protein ${protein}g`); }
    if (found.length) {
      els.scanResult.textContent = `Detected per 100g: ${found.join(', ')}. Verify before adding.`;
      updatePreview();
    } else {
      els.scanResult.textContent = 'Could not read macros. Enter manually.';
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
    if (data.limits && typeof data.limits === 'object') {
      state.limits = { ...DEFAULT_LIMITS, ...state.limits, ...data.limits };
      MACROS.forEach((m) => {
        if (els.limitRanges[m]) els.limitRanges[m].value = String(state.limits[m]);
      });
      if (els.limitRanges.calories) els.limitRanges.calories.value = String(state.limits.calories);
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
      body: JSON.stringify({
        entries: state.entries,
        products: state.products,
        limits: state.limits,
        updatedAt: new Date().toISOString(),
      }),
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
  if (name === 'suggest') renderSuggestions();
}

// ---------- Wire up ----------
MACROS.forEach((m) => {
  els.limitRanges[m].value = String(state.limits[m]);
});
els.limitRanges.calories.value = String(state.limits.calories);
applyTheme();
renderAll();

function rebalanceLimitsFrom(driver) {
  const driverGrams = state.limits[driver];
  if (!driverGrams || driverGrams <= 0) return;
  const totalKcal = (driverGrams * KCAL_PER_G[driver]) / (KETO_KCAL_PCT[driver] / 100);
  MACROS.forEach((m) => {
    if (m === driver) return;
    const grams = Math.round((totalKcal * (KETO_KCAL_PCT[m] / 100)) / KCAL_PER_G[m]);
    const max = Number(els.limitRanges[m].max) || grams;
    const clamped = Math.max(0, Math.min(max, grams));
    state.limits[m] = clamped;
    els.limitRanges[m].value = String(clamped);
  });
}

function applyLockState() {
  els.lockRatios.checked = state.lockRatios;
  els.lockRatiosLabel.textContent = state.lockRatios ? 'Keto ratios locked' : 'Lock keto ratios';
  document.querySelector('.macros')?.classList.toggle('locked', state.lockRatios);
}

MACROS.forEach((m) => {
  els.limitRanges[m].addEventListener('input', () => {
    state.limits[m] = Number(els.limitRanges[m].value);
    if (state.lockRatios) rebalanceLimitsFrom(m);
    persist();
    renderHero();
    renderHistory();
    updatePreview();
  });
});

els.limitRanges.calories.addEventListener('input', () => {
  state.limits.calories = Number(els.limitRanges.calories.value);
  persist();
  renderHero();
  renderHistory();
});

els.lockRatios.addEventListener('change', () => {
  state.lockRatios = els.lockRatios.checked;
  localStorage.setItem('lockRatios', state.lockRatios ? '1' : '0');
  applyLockState();
  if (state.lockRatios) {
    rebalanceLimitsFrom('carbs');
    persist();
    renderHero();
    renderHistory();
    updatePreview();
    toast('Keto ratios locked — carbs drive fat & protein.');
  } else {
    toast('Ratios unlocked.');
  }
});

applyLockState();

els.themeToggle.addEventListener('change', () => {
  state.theme = els.themeToggle.checked ? 'dark' : 'light';
  localStorage.setItem('carbTheme', state.theme);
  applyTheme();
});
els.addEntry.addEventListener('click', addEntry);
els.saveProduct.addEventListener('click', () => {
  const f = readForm();
  if (!f.barcode) { toast('Scan or enter a barcode first.'); els.barcode.focus(); return; }
  const hasAny = MACROS.some((m) =>
    f[fieldKey(m, 'Per100')] > 0 || f[fieldKey(m, 'PerPortion')] > 0 || f[fieldKey(m, 'PerPiece')] > 0);
  if (!hasAny) { toast('Enter at least one macro value.'); return; }
  state.products[f.barcode] = productPayload(f);
  persist();
  renderLibrary();
  const label = f.name || f.barcode;
  clearForm();
  els.scanResult.textContent = `✓ Saved "${label}" to library. Ready for the next product.`;
  toast(`✓ Saved ${label} to library`, 2800);
  scheduleSync();
});
els.nutritionPhoto.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) scanNutrition(file);
});
els.syncDrive.addEventListener('click', () => syncToDrive({ interactive: !state.token }));
els.scanBarcode.addEventListener('click', openScanner);
els.closeScanner.addEventListener('click', closeScanner);

const previewInputs = ['gramsConsumed', 'portionGrams', 'pieces', 'totalPieces'];
MACROS.forEach((m) => {
  previewInputs.push(fieldKey(m, 'Per100'), fieldKey(m, 'PerPortion'), fieldKey(m, 'PerPiece'));
});
previewInputs.forEach((k) => {
  if (els[k]) els[k].addEventListener('input', updatePreview);
});

els.barcode.addEventListener('change', () => {
  const v = els.barcode.value.trim();
  if (v.length >= 6) handleBarcode(v);
});
els.productName.addEventListener('change', () => {
  const barcode = els.productName.value;
  if (!barcode) return;
  const p = state.products[barcode];
  if (p) {
    els.barcode.value = barcode;
    applyProduct(p);
    els.gramsConsumed.focus();
  }
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
    const f = readForm();
    const anyPerPiece = MACROS.some((m) => derivePerPiece(f, m) > 0);
    if (!anyPerPiece) {
      toast('Add total pieces (or carbs/fat/protein per piece) so I can calculate.');
      els.totalPieces.focus();
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

els.refreshSuggest.addEventListener('click', renderSuggestions);
els.suggestList.addEventListener('click', (e) => {
  const code = e.target.dataset.suggest;
  if (!code) return;
  const grams = Number(e.target.dataset.grams) || 0;
  const p = state.products[code];
  if (!p) return;
  setActiveTab('add');
  els.barcode.value = code;
  applyProduct(p);
  if (grams > 0) els.gramsConsumed.value = String(grams);
  updatePreview();
  els.gramsConsumed.focus();
});

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
