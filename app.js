const GOOGLE_CLIENT_ID = '1629709103-c7ltm86t4lbiaaqi7igedtsadjosqrdj.apps.googleusercontent.com';
const DRIVE_FILENAME = 'carbculator_entries.json';
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const KETO_INGREDIENTS = [
  { id: 'keto-egg-large', name: 'Egg, whole', servingName: '1 large egg', servingGrams: 50, caloriesPer100: 143, fatPer100: 9.5, proteinPer100: 12.6, carbsPer100: 0.7, netCarbsPer100: 0.7, tags: ['breakfast', 'protein'] },
  { id: 'keto-bacon-streaky', name: 'Streaky bacon', servingName: '2 rashers', servingGrams: 45, caloriesPer100: 393, fatPer100: 37.0, proteinPer100: 13.0, carbsPer100: 1.4, netCarbsPer100: 1.4, tags: ['breakfast', 'meat'] },
  { id: 'keto-avocado', name: 'Avocado', servingName: '1/2 avocado', servingGrams: 75, caloriesPer100: 160, fatPer100: 14.7, proteinPer100: 2.0, carbsPer100: 8.5, netCarbsPer100: 1.8, tags: ['produce', 'fat'] },
  { id: 'keto-butter', name: 'Butter', servingName: '1 tbsp', servingGrams: 14, caloriesPer100: 717, fatPer100: 81.1, proteinPer100: 0.9, carbsPer100: 0.1, netCarbsPer100: 0.1, tags: ['fat', 'dairy'] },
  { id: 'keto-double-cream', name: 'Double cream', servingName: '2 tbsp', servingGrams: 30, caloriesPer100: 467, fatPer100: 50.5, proteinPer100: 1.7, carbsPer100: 1.6, netCarbsPer100: 1.6, tags: ['dairy', 'fat'] },
  { id: 'keto-mature-cheddar', name: 'Mature cheddar', servingName: '30g slice', servingGrams: 30, caloriesPer100: 416, fatPer100: 34.0, proteinPer100: 25.0, carbsPer100: 0.1, netCarbsPer100: 0.1, tags: ['dairy', 'cheese'] },
  { id: 'keto-cream-cheese', name: 'Cream cheese', servingName: '2 tbsp', servingGrams: 30, caloriesPer100: 342, fatPer100: 34.0, proteinPer100: 6.2, carbsPer100: 4.1, netCarbsPer100: 4.1, tags: ['dairy', 'cheese'] },
  { id: 'keto-mozzarella', name: 'Mozzarella', servingName: '50g', servingGrams: 50, caloriesPer100: 300, fatPer100: 22.4, proteinPer100: 22.2, carbsPer100: 2.2, netCarbsPer100: 2.2, tags: ['dairy', 'cheese'] },
  { id: 'keto-halloumi', name: 'Halloumi', servingName: '50g', servingGrams: 50, caloriesPer100: 321, fatPer100: 25.0, proteinPer100: 22.0, carbsPer100: 2.2, netCarbsPer100: 2.2, tags: ['dairy', 'cheese'] },
  { id: 'keto-olive-oil', name: 'Olive oil', servingName: '1 tbsp', servingGrams: 14, caloriesPer100: 884, fatPer100: 100.0, proteinPer100: 0.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fat', 'pantry'] },
  { id: 'keto-mayonnaise', name: 'Mayonnaise', servingName: '1 tbsp', servingGrams: 14, caloriesPer100: 680, fatPer100: 75.0, proteinPer100: 1.0, carbsPer100: 0.6, netCarbsPer100: 0.6, tags: ['fat', 'condiment'] },
  { id: 'keto-chicken-thigh', name: 'Chicken thigh, cooked', servingName: '1 thigh', servingGrams: 90, caloriesPer100: 209, fatPer100: 10.9, proteinPer100: 26.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-salmon', name: 'Salmon fillet', servingName: '1 fillet', servingGrams: 120, caloriesPer100: 208, fatPer100: 13.4, proteinPer100: 20.4, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fish', 'protein'] },
  { id: 'keto-tuna', name: 'Tuna, canned in spring water', servingName: '1 drained tin', servingGrams: 120, caloriesPer100: 116, fatPer100: 0.8, proteinPer100: 25.5, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fish', 'protein'] },
  { id: 'keto-beef-steak', name: 'Beef steak, cooked', servingName: '1 steak', servingGrams: 170, caloriesPer100: 271, fatPer100: 19.0, proteinPer100: 25.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-pork-belly', name: 'Pork belly, cooked', servingName: '100g', servingGrams: 100, caloriesPer100: 518, fatPer100: 53.0, proteinPer100: 9.3, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'fat'] },
  { id: 'keto-beef-mince-20', name: 'Beef mince, 20% fat', servingName: '100g', servingGrams: 100, caloriesPer100: 254, fatPer100: 20.0, proteinPer100: 17.2, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-salami', name: 'Salami', servingName: '30g', servingGrams: 30, caloriesPer100: 407, fatPer100: 34.0, proteinPer100: 22.0, carbsPer100: 1.6, netCarbsPer100: 1.6, tags: ['meat', 'snack'] },
  { id: 'keto-greek-yogurt', name: 'Greek yogurt, full-fat plain', servingName: '100g', servingGrams: 100, caloriesPer100: 97, fatPer100: 5.0, proteinPer100: 9.0, carbsPer100: 3.6, netCarbsPer100: 3.6, tags: ['dairy', 'breakfast'] },
  { id: 'keto-almonds', name: 'Almonds', servingName: '30g handful', servingGrams: 30, caloriesPer100: 579, fatPer100: 49.9, proteinPer100: 21.2, carbsPer100: 21.6, netCarbsPer100: 9.5, tags: ['nuts', 'snack'] },
  { id: 'keto-walnuts', name: 'Walnuts', servingName: '30g handful', servingGrams: 30, caloriesPer100: 654, fatPer100: 65.2, proteinPer100: 15.2, carbsPer100: 13.7, netCarbsPer100: 7.0, tags: ['nuts', 'snack'] },
  { id: 'keto-macadamias', name: 'Macadamia nuts', servingName: '30g handful', servingGrams: 30, caloriesPer100: 718, fatPer100: 75.8, proteinPer100: 7.9, carbsPer100: 13.8, netCarbsPer100: 5.2, tags: ['nuts', 'snack'] },
  { id: 'keto-chia', name: 'Chia seeds', servingName: '1 tbsp', servingGrams: 12, caloriesPer100: 486, fatPer100: 30.7, proteinPer100: 16.5, carbsPer100: 42.1, netCarbsPer100: 7.7, tags: ['seeds', 'pantry'] },
  { id: 'keto-spinach', name: 'Spinach', servingName: '1 large handful', servingGrams: 30, caloriesPer100: 23, fatPer100: 0.4, proteinPer100: 2.9, carbsPer100: 3.6, netCarbsPer100: 1.4, tags: ['veg', 'produce'] },
  { id: 'keto-broccoli', name: 'Broccoli', servingName: '80g', servingGrams: 80, caloriesPer100: 34, fatPer100: 0.4, proteinPer100: 2.8, carbsPer100: 6.6, netCarbsPer100: 4.0, tags: ['veg', 'produce'] },
  { id: 'keto-cauliflower', name: 'Cauliflower', servingName: '80g', servingGrams: 80, caloriesPer100: 25, fatPer100: 0.3, proteinPer100: 1.9, carbsPer100: 5.0, netCarbsPer100: 3.0, tags: ['veg', 'produce'] },
  { id: 'keto-cucumber', name: 'Cucumber', servingName: '80g', servingGrams: 80, caloriesPer100: 15, fatPer100: 0.1, proteinPer100: 0.7, carbsPer100: 3.6, netCarbsPer100: 3.1, tags: ['veg', 'produce'] },
  { id: 'keto-olives', name: 'Olives', servingName: '30g', servingGrams: 30, caloriesPer100: 145, fatPer100: 15.3, proteinPer100: 1.0, carbsPer100: 3.8, netCarbsPer100: 0.5, tags: ['snack', 'fat'] },
  { id: 'keto-whole-milk-latte', name: 'Whole milk', servingName: '12oz latte milk (300ml)', servingGrams: 309, alternateServings: [{ name: '8oz flat white milk (240ml)', grams: 247 }], caloriesPer100: 64, fatPer100: 3.6, proteinPer100: 3.3, carbsPer100: 4.8, netCarbsPer100: 4.8, tags: ['dairy', 'milk', 'latte', 'flat white', 'flatwhite', 'coffee', '240ml', '300ml'] },
  { id: 'keto-lamb-chop', name: 'Lamb chop, cooked', servingName: '1 chop', servingGrams: 100, caloriesPer100: 294, fatPer100: 21.0, proteinPer100: 25.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-lamb-mince-20', name: 'Lamb mince, 20% fat', servingName: '100g', servingGrams: 100, caloriesPer100: 282, fatPer100: 22.0, proteinPer100: 18.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-pork-chop', name: 'Pork chop, cooked', servingName: '1 chop', servingGrams: 150, caloriesPer100: 231, fatPer100: 14.0, proteinPer100: 25.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-turkey-breast', name: 'Turkey breast, cooked', servingName: '100g', servingGrams: 100, caloriesPer100: 135, fatPer100: 1.0, proteinPer100: 30.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-chicken-breast', name: 'Chicken breast, cooked', servingName: '1 breast', servingGrams: 150, caloriesPer100: 165, fatPer100: 3.6, proteinPer100: 31.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['meat', 'protein'] },
  { id: 'keto-sardines', name: 'Sardines, canned', servingName: '1 tin', servingGrams: 90, caloriesPer100: 208, fatPer100: 11.5, proteinPer100: 24.6, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fish', 'protein'] },
  { id: 'keto-mackerel', name: 'Mackerel, cooked', servingName: '1 fillet', servingGrams: 100, caloriesPer100: 305, fatPer100: 25.0, proteinPer100: 19.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fish', 'protein', 'fat'] },
  { id: 'keto-cod', name: 'Cod fillet, cooked', servingName: '1 fillet', servingGrams: 140, caloriesPer100: 105, fatPer100: 0.9, proteinPer100: 23.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fish', 'protein'] },
  { id: 'keto-feta', name: 'Feta cheese', servingName: '40g', servingGrams: 40, caloriesPer100: 264, fatPer100: 21.3, proteinPer100: 14.2, carbsPer100: 4.1, netCarbsPer100: 4.1, tags: ['dairy', 'cheese'] },
  { id: 'keto-brie', name: 'Brie', servingName: '30g', servingGrams: 30, caloriesPer100: 334, fatPer100: 27.7, proteinPer100: 20.8, carbsPer100: 0.5, netCarbsPer100: 0.5, tags: ['dairy', 'cheese'] },
  { id: 'keto-parmesan', name: 'Parmesan', servingName: '15g grated', servingGrams: 15, caloriesPer100: 431, fatPer100: 29.0, proteinPer100: 38.0, carbsPer100: 4.1, netCarbsPer100: 4.1, tags: ['dairy', 'cheese'] },
  { id: 'keto-goats-cheese', name: 'Goats cheese', servingName: '40g', servingGrams: 40, caloriesPer100: 364, fatPer100: 30.0, proteinPer100: 22.0, carbsPer100: 2.5, netCarbsPer100: 2.5, tags: ['dairy', 'cheese'] },
  { id: 'keto-sour-cream', name: 'Sour cream', servingName: '2 tbsp', servingGrams: 30, caloriesPer100: 198, fatPer100: 19.0, proteinPer100: 2.4, carbsPer100: 4.6, netCarbsPer100: 4.6, tags: ['dairy', 'fat'] },
  { id: 'keto-coconut-cream', name: 'Coconut cream', servingName: '2 tbsp', servingGrams: 30, caloriesPer100: 330, fatPer100: 34.7, proteinPer100: 3.6, carbsPer100: 6.7, netCarbsPer100: 6.7, tags: ['fat', 'pantry', 'dairy-free'] },
  { id: 'keto-coconut-oil', name: 'Coconut oil', servingName: '1 tbsp', servingGrams: 14, caloriesPer100: 862, fatPer100: 100.0, proteinPer100: 0.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fat', 'pantry'] },
  { id: 'keto-ghee', name: 'Ghee', servingName: '1 tbsp', servingGrams: 14, caloriesPer100: 900, fatPer100: 100.0, proteinPer100: 0.0, carbsPer100: 0.0, netCarbsPer100: 0.0, tags: ['fat', 'dairy', 'pantry'] },
  { id: 'keto-pecans', name: 'Pecans', servingName: '30g handful', servingGrams: 30, caloriesPer100: 691, fatPer100: 72.0, proteinPer100: 9.2, carbsPer100: 13.9, netCarbsPer100: 4.3, tags: ['nuts', 'snack'] },
  { id: 'keto-brazil-nuts', name: 'Brazil nuts', servingName: '30g handful', servingGrams: 30, caloriesPer100: 659, fatPer100: 67.1, proteinPer100: 14.3, carbsPer100: 11.7, netCarbsPer100: 4.2, tags: ['nuts', 'snack'] },
  { id: 'keto-pumpkin-seeds', name: 'Pumpkin seeds', servingName: '30g', servingGrams: 30, caloriesPer100: 559, fatPer100: 49.0, proteinPer100: 30.0, carbsPer100: 10.7, netCarbsPer100: 4.7, tags: ['seeds', 'snack'] },
  { id: 'keto-flaxseed', name: 'Ground flaxseed', servingName: '1 tbsp', servingGrams: 10, caloriesPer100: 534, fatPer100: 42.2, proteinPer100: 18.3, carbsPer100: 28.9, netCarbsPer100: 1.6, tags: ['seeds', 'pantry'] },
  { id: 'keto-asparagus', name: 'Asparagus', servingName: '80g', servingGrams: 80, caloriesPer100: 20, fatPer100: 0.1, proteinPer100: 2.2, carbsPer100: 3.9, netCarbsPer100: 1.8, tags: ['veg', 'produce'] },
  { id: 'keto-green-beans', name: 'Green beans', servingName: '80g', servingGrams: 80, caloriesPer100: 31, fatPer100: 0.1, proteinPer100: 1.8, carbsPer100: 7.0, netCarbsPer100: 3.6, tags: ['veg', 'produce'] },
  { id: 'keto-raspberries', name: 'Raspberries', servingName: '50g', servingGrams: 50, caloriesPer100: 52, fatPer100: 0.7, proteinPer100: 1.2, carbsPer100: 11.9, netCarbsPer100: 5.4, tags: ['berries', 'fruit'] },
].map((item) => ({ ...item, source: 'USDA FoodData Central or typical UK retail nutrition averages; verify packaged brands.' }));

const ketoIngredientMap = Object.fromEntries(KETO_INGREDIENTS.map((item) => [item.id, item]));
const INGREDIENT_CATEGORY_ORDER = [
  'Breakfast',
  'Dairy and coffee',
  'Meat',
  'Fish',
  'Fats and condiments',
  'Nuts and seeds',
  'Vegetables',
  'Fruit',
];

const state = {
  entries: JSON.parse(localStorage.getItem('carbEntries') || '[]'),
  products: JSON.parse(localStorage.getItem('carbProducts') || '{}'), // keyed by barcode
  limit: Number(localStorage.getItem('carbLimit') || 30),
  driveFileId: localStorage.getItem('driveFileId') || '',
  theme: localStorage.getItem('carbTheme') || (prefersDark ? 'dark' : 'light'),
  token: '',
  tokenExpiry: 0,
  activeTab: 'add',
  activeIngredientId: '',
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
  carbsPerPiece: $('carbsPerPiece'), pieces: $('pieces'), totalPieces: $('totalPieces'),
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

function derivePerPiece({ carbsPerPiece, carbsPerPortion, portionGrams, carbsPer100, totalPieces }) {
  const manual = Number(carbsPerPiece) || 0;
  if (manual > 0) return manual;
  const tp = Number(totalPieces) || 0;
  if (tp <= 0) return 0;
  const cpp = Number(carbsPerPortion) || 0;
  if (cpp > 0) return cpp / tp;
  const pg = Number(portionGrams) || 0;
  const c100 = Number(carbsPer100) || 0;
  if (pg > 0 && c100 > 0) return (pg * c100 / 100) / tp;
  return 0;
}

function calcCarbs(f) {
  const grams = Number(f.grams) || 0;
  const pieces = Number(f.pieces) || 0;
  const perPiece = derivePerPiece(f);
  if (pieces > 0 && perPiece > 0) return pieces * perPiece;
  if (Number(f.carbsPer100) > 0 && grams > 0) return (grams / 100) * Number(f.carbsPer100);
  if (Number(f.carbsPerPortion) > 0 && Number(f.portionGrams) > 0 && grams > 0)
    return (grams / Number(f.portionGrams)) * Number(f.carbsPerPortion);
  return 0;
}

function readForm() {
  const ingredient = state.activeIngredientId ? ketoIngredientMap[state.activeIngredientId] : null;
  const grams = Number(els.gramsConsumed.value || 0);
  return {
    barcode: els.barcode.value.trim(),
    name: els.productName.value.trim(),
    grams,
    carbsPer100: Number(els.carbsPer100.value || 0),
    carbsPerPortion: Number(els.carbsPerPortion.value || 0),
    portionGrams: Number(els.portionGrams.value || 0),
    carbsPerPiece: Number(els.carbsPerPiece.value || 0),
    pieces: Number(els.pieces.value || 0),
    totalPieces: Number(els.totalPieces.value || 0),
    notes: els.notes.value.trim(),
    ingredientId: ingredient?.id || '',
    calories: ingredient && grams > 0 ? (grams / 100) * ingredient.caloriesPer100 : 0,
    fat: ingredient && grams > 0 ? (grams / 100) * ingredient.fatPer100 : 0,
    protein: ingredient && grams > 0 ? (grams / 100) * ingredient.proteinPer100 : 0,
    totalCarbs: ingredient && grams > 0 ? (grams / 100) * ingredient.carbsPer100 : 0,
  };
}

function clearForm() {
  state.activeIngredientId = '';
  ['barcode', 'productName', 'gramsConsumed', 'carbsPer100',
   'carbsPerPortion', 'portionGrams', 'carbsPerPiece', 'pieces', 'totalPieces', 'notes']
    .forEach((k) => (els[k].value = ''));
  els.scanResult.textContent = 'Scan a barcode — saved products auto-fill. New ones look up Open Food Facts.';
  updatePreview();
}

function applyProduct(p) {
  if (!p) return;
  state.activeIngredientId = '';
  if (p.name) els.productName.value = p.name;
  if (p.carbsPer100) els.carbsPer100.value = String(p.carbsPer100);
  if (p.carbsPerPortion) els.carbsPerPortion.value = String(p.carbsPerPortion);
  if (p.portionGrams) els.portionGrams.value = String(p.portionGrams);
  if (p.carbsPerPiece) els.carbsPerPiece.value = String(p.carbsPerPiece);
  if (p.totalPieces) els.totalPieces.value = String(p.totalPieces);
  updatePreview();
}

function applyIngredient(item) {
  if (!item) return;
  const alternateText = item.alternateServings?.length
    ? `; also ${item.alternateServings.map((serving) => `${serving.name} = ${serving.grams}g`).join(', ')}`
    : '';
  state.activeIngredientId = item.id;
  els.barcode.value = '';
  els.productName.value = item.name;
  els.carbsPer100.value = String(item.netCarbsPer100);
  els.carbsPerPortion.value = String(+((item.servingGrams / 100) * item.netCarbsPer100).toFixed(2));
  els.portionGrams.value = String(item.servingGrams);
  els.carbsPerPiece.value = '';
  els.pieces.value = '';
  els.totalPieces.value = '';
  els.gramsConsumed.value = String(item.servingGrams);
  els.notes.value = `${item.servingName}${alternateText}; ${formatMacroLine(item)}`;
  updatePreview();
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  els.themeToggle.checked = state.theme === 'dark';
  els.themeToggleLabel.textContent = state.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function updatePreview() {
  const f = readForm();
  const c = calcCarbs(f);
  const perPiece = derivePerPiece(f);
  let txt = `${c.toFixed(1)}g carbs for this entry`;
  if (perPiece > 0) {
    txt += ` · each piece ≈ ${perPiece.toFixed(2)}g`;
    const remaining = state.limit - dailyTotal();
    if (perPiece > 0 && remaining > 0) {
      const safe = Math.floor(remaining / perPiece);
      txt += ` · ${safe} piece${safe === 1 ? '' : 's'} left within today's limit`;
    }
  }
  els.carbPreview.textContent = txt;
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

function formatMacroLine(item) {
  return `${item.caloriesPer100} kcal | F ${item.fatPer100}g | P ${item.proteinPer100}g | net C ${item.netCarbsPer100}g per 100g`;
}

function ingredientCategory(item) {
  const tags = new Set(item.tags || []);
  if (tags.has('breakfast') && !tags.has('dairy')) return 'Breakfast';
  if (tags.has('dairy') || tags.has('cheese') || tags.has('milk')) return 'Dairy and coffee';
  if (tags.has('meat')) return 'Meat';
  if (tags.has('fish') || tags.has('seafood')) return 'Fish';
  if (tags.has('fat') || tags.has('condiment')) return 'Fats and condiments';
  if (tags.has('nuts') || tags.has('seeds')) return 'Nuts and seeds';
  if (tags.has('veg') || tags.has('produce')) return 'Vegetables';
  if (tags.has('fruit') || tags.has('berries')) return 'Fruit';
  return 'Other';
}

function ingredientMatches(item, query) {
  const haystack = `${item.name} ${ingredientCategory(item)} ${item.tags.join(' ')} ${item.servingName}`.toLowerCase();
  return !query || haystack.includes(query);
}

function ingredientListItem(item, buttonLabel = 'Use') {
  const alternateText = item.alternateServings?.length
    ? `; ${item.alternateServings.map((serving) => `${serving.name}: ${((serving.grams / 100) * item.netCarbsPer100).toFixed(1)}g net`).join('; ')}`
    : '';
  return `
    <div class="entry-main">
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(formatMacroLine(item))}</small>
      <small>${escapeHtml(item.servingName)}: ${((item.servingGrams / 100) * item.netCarbsPer100).toFixed(1)}g net carbs${escapeHtml(alternateText)}</small>
    </div>
    <div class="entry-side">
      <button class="btn ghost" data-use-ingredient="${item.id}">${buttonLabel}</button>
    </div>`;
}

function renderLibrary() {
  const q = (els.librarySearch.value || '').toLowerCase();
  const products = Object.values(state.products)
    .filter((p) => !q || (p.name || '').toLowerCase().includes(q) || (p.barcode || '').includes(q))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '') || (b.lastUsed || 0) - (a.lastUsed || 0));
  const ingredients = KETO_INGREDIENTS
    .filter((item) => ingredientMatches(item, q))
    .slice()
    .sort((a, b) => {
      const categoryDiff = INGREDIENT_CATEGORY_ORDER.indexOf(ingredientCategory(a)) - INGREDIENT_CATEGORY_ORDER.indexOf(ingredientCategory(b));
      return categoryDiff || a.name.localeCompare(b.name);
    });
  els.libraryList.innerHTML = '';
  if (!products.length && !ingredients.length) {
    els.libraryList.innerHTML = '<li class="empty">No saved products or keto staples match that search.</li>';
    return;
  }
  if (products.length) {
    const header = document.createElement('li');
    header.className = 'library-category';
    header.textContent = 'Saved products';
    els.libraryList.appendChild(header);
  }
  products.forEach((p) => {
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
  let activeCategory = '';
  ingredients.forEach((item) => {
    const category = ingredientCategory(item);
    if (category !== activeCategory) {
      activeCategory = category;
      const header = document.createElement('li');
      header.className = 'library-category';
      header.textContent = category;
      els.libraryList.appendChild(header);
    }
    const li = document.createElement('li');
    li.innerHTML = ingredientListItem(item);
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
      totalPieces: f.totalPieces,
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
     '\r\n--foo\r\nContent-Type: application/json\r\n\r\n',
     JSON.stringify({ entries: state.entries, products: state.products, ketoIngredients: KETO_INGREDIENTS }),
     '\r\n--foo--'],
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
      body: JSON.stringify({
        entries: state.entries,
        products: state.products,
        ketoIngredients: KETO_INGREDIENTS,
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
els.saveProduct.addEventListener('click', () => {
  const f = readForm();
  if (!f.barcode) { toast('Scan or enter a barcode first.'); els.barcode.focus(); return; }
  if (!f.carbsPer100 && !f.carbsPerPortion && !f.carbsPerPiece) {
    toast('Enter at least one carb value.'); return;
  }
  state.products[f.barcode] = {
    barcode: f.barcode,
    name: f.name,
    carbsPer100: f.carbsPer100,
    carbsPerPortion: f.carbsPerPortion,
    portionGrams: f.portionGrams,
    carbsPerPiece: f.carbsPerPiece,
    totalPieces: f.totalPieces,
    lastUsed: Date.now(),
  };
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

['carbsPer100', 'carbsPerPortion', 'portionGrams', 'gramsConsumed', 'carbsPerPiece', 'pieces', 'totalPieces'].forEach((k) => {
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
    const perPiece = derivePerPiece(readForm());
    if (perPiece <= 0) {
      toast('Add total pieces (or carbs per piece) so I can calculate.');
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
  const ingredientId = e.target.dataset.useIngredient;
  if (ingredientId) {
    setActiveTab('add');
    applyIngredient(ketoIngredientMap[ingredientId]);
    els.gramsConsumed.focus();
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
