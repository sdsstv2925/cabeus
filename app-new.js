/**
 * CABEUS CATALOG - REFACTORED ENTRY POINT
 * Global functions and initialization.
 *
 * Load order (see index.html):
 *   1. products.js
 *   2. modules/utils.js
 *   3. modules/cart.js
 *   4. modules/filters.js
 *   5. modules/render.js
 *   6. modules/routing.js
 *   7. app-new.js  ← this file
 */

/* ─── View state ─────────────────────────────────────────────────── */

let view = storage.get('cabeusView') || 'grid';

/* ─── Smart search (complete implementation) ─────────────────────── */

function normText(v) {
  return rawNorm(v).replace(/\.(?!\d)/g, ' ').replace(/(?<!\d)\./g, ' ').replace(/\s+/g, ' ').trim();
}

const SYNONYMS = {
  шкаф: ['шкаф','шкафы','настенный','телекоммуникационный','rack','рэковый'],
  стойка: ['стойка','стойки','rack'],
  кабель: ['кабель','cable','провод'],
  патч: ['патч','patch','панель','панели'],
  корд: ['корд','cord'],
  розетка: ['розетка','розетки'],
  черный: ['черный','чёрный','black','bk'],
  синий: ['синий','blue','bl'],
  белый: ['белый','white','wh'],
  серый: ['серый','gray','grey'],
  стекло: ['стекло','glass'],
  металл: ['металл','metal']
};

function productSearchText(p) {
  return normText([
    p.name, p.article, p.code, p.type, p.section, p.subsection, p.producer,
    p.u && p.u + 'u', p.u && p.u + ' u', p.u && p.u + 'ю',
    p.ports && p.ports + 'порт', p.ports && p.ports + ' портов',
    p.cat && 'cat' + p.cat, p.cat && 'кат' + p.cat,
    p.shield, p.color,
    p.depth && p.depth + ' глубина', p.width && p.width + ' ширина', p.door
  ].filter(Boolean).join(' '));
}

function fieldContainsExactDecimal(p, t) {
  const re = new RegExp('(^|[^0-9])' + t.replace('.', '\\.') + '\\s*(m|м|метр|метра|метров)?([^0-9]|$)', 'i');
  return re.test([p.name, p.article, p.code].join(' '));
}

function tokenMatch(text, p, t) {
  if (/^\d+\.\d+$/.test(t)) return fieldContainsExactDecimal(p, t);
  if (SYNONYMS[t]) return SYNONYMS[t].some(x => text.includes(x));
  if (/^\d+$/.test(t)) {
    if (p.u === t || p.ports === t || p.depth === t || p.width === t) return true;
    const re = new RegExp('(^|\\s)' + t + '(u|ю|порт|портов|м|m)?(\\s|$)', 'i');
    return re.test(text);
  }
  if (/^cat\d+$/i.test(t)) return text.includes(t) || text.includes(t.replace('cat', 'кат'));
  return text.includes(t);
}

function matchesSmartSearch(p, q) {
  const tokens = searchTokens(q);
  if (!tokens.length) return true;
  const text = productSearchText(p);
  return tokens.every(t => tokenMatch(text, p, t));
}

/* ─── Override FilterEngine methods with complete implementations ── */

FilterEngine.applyFilters = function () {
  try {
    const searchEl = document.getElementById('search');
    const q = searchEl ? searchEl.value.trim() : '';
    const s = (document.getElementById('sectionFilter')?.value || currentSection || '');
    const sub = (document.getElementById('subFilter')?.value || currentSubsection || '');
    const t = document.getElementById('typeFilter')?.value || '';
    const st = document.getElementById('stockFilter')?.value || '';
    const w = document.getElementById('warrantyFilter')?.value || '';
    const u = document.getElementById('uFilter')?.value || '';
    const ports = document.getElementById('portsFilter')?.value || '';
    const cat = document.getElementById('catFilter')?.value || '';
    const sh = document.getElementById('shieldFilter')?.value || '';
    const color = document.getElementById('colorFilter')?.value || '';
    const depth = document.getElementById('depthFilter')?.value || '';
    const minP = +(document.getElementById('minPrice')?.value || 0) || 0;
    const maxP = +(document.getElementById('maxPrice')?.value || 0) || Infinity;

    filtered = PRODUCTS.filter(p =>
      matchesSmartSearch(p, q) &&
      (!s || p.section === s) &&
      (!sub || p.subsection === sub) &&
      (!t || p.type === t) &&
      (!w || p.warranty === w) &&
      (!u || p.u === u) &&
      (!ports || p.ports === ports) &&
      (!cat || p.cat === cat) &&
      (!sh || p.shield === sh) &&
      (!color || p.color === color) &&
      (!depth || p.depth === depth) &&
      Number(p.price || 0) >= minP &&
      Number(p.price || 0) <= maxP &&
      (!st || (
        st === 'stock'   ? Number(p.qty || 0) > 0 :
        st === 'transit' ? (Number(p.qty || 0) > 0 || Number(p.transit || 0) > 0) :
        /* order */        Number(p.qty || 0) === 0 && Number(p.transit || 0) === 0
      ))
    );
    page = 1;
    updateFilterSummary();
    return filtered;
  } catch (e) {
    console.error('applyFilters error:', e);
    return [];
  }
};

FilterEngine.updateDynamicFilters = function () {
  try {
    const sec = document.getElementById('sectionFilter')?.value || currentSection || '';
    const sub = document.getElementById('subFilter')?.value || currentSubsection || '';
    const list = PRODUCTS.filter(p => (!sec || p.section === sec) && (!sub || p.subsection === sub));

    function fillDynamic(id, key, placeholder) {
      const el = document.getElementById(id);
      if (!el) return;
      const vals = [...new Set(list.map(p => p[key]).filter(v => v !== '' && v != null))]
        .sort((a, b) => String(a).localeCompare(String(b), 'ru', { numeric: true }));
      const old = el.value;
      el.innerHTML = `<option value="">${placeholder}</option>` +
        vals.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
      el.value = vals.includes(old) ? old : '';
    }

    fillDynamic('typeFilter',    'type',    'Любой тип');
    fillDynamic('warrantyFilter','warranty','Любая');
    fillDynamic('uFilter',       'u',       'U');
    fillDynamic('portsFilter',   'ports',   'Количество');
    fillDynamic('catFilter',     'cat',     'Категория');
    fillDynamic('colorFilter',   'color',   'Цвет');
    fillDynamic('depthFilter',   'depth',   'Глубина');
    fillDynamic('widthFilter',   'width',   'Ширина');
    fillDynamic('doorFilter',    'door',    'Тип двери');
  } catch (e) {
    console.error('updateDynamicFilters error:', e);
  }
};

/* ─── Render (delegates to RenderEngine) ─────────────────────────── */

function render() {
  RenderEngine.render();
}

/* ─── Filter helpers ─────────────────────────────────────────────── */

function activeFilterCount() {
  let n = 0;
  ['sectionFilter','subFilter','typeFilter','stockFilter','minPrice','maxPrice',
   'warrantyFilter','uFilter','portsFilter','catFilter','shieldFilter','colorFilter','depthFilter'
  ].forEach(id => { const el = document.getElementById(id); if (el && el.value) n++; });
  return n;
}

function updateFilterSummary() {
  const el = document.getElementById('filterSummary');
  if (!el) return;
  const n = activeFilterCount();
  el.textContent = n ? `Активно: ${n}` : 'Компактный режим';
}

function applyFilters() {
  FilterEngine.updateDynamicFilters();
  FilterEngine.applyFilters();
  render();
}

function onSectionChange() {
  const sectionFilter = document.getElementById('sectionFilter');
  const subFilter = document.getElementById('subFilter');
  if (!sectionFilter || !subFilter) return;
  const s = sectionFilter.value;
  currentSection = s;
  currentSubsection = '';
  subFilter.innerHTML = '<option value="">Все подразделы</option>';
  [...new Set(PRODUCTS.filter(p => !s || p.section === s).map(p => p.subsection).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .forEach(v => subFilter.insertAdjacentHTML('beforeend', `<option value="${esc(v)}">${esc(v)}</option>`));
  FilterEngine.updateDynamicFilters();
  FilterEngine.applyFilters();
  render();
}

function onSubsectionChange() {
  const subFilter = document.getElementById('subFilter');
  if (subFilter) currentSubsection = subFilter.value;
  FilterEngine.updateDynamicFilters();
  FilterEngine.applyFilters();
  render();
}

function clearFilters() {
  // Clear refinement filters but preserve section/subsection navigation context
  document.querySelectorAll(
    '.filters input:not(#sectionFilter):not(#subFilter), .filters select:not(#sectionFilter):not(#subFilter)'
  ).forEach(el => { el.value = ''; });
  updateFilterSummary();
  FilterEngine.applyFilters();
  render();
}

function toggleFilterPanel() {
  const box = document.getElementById('filtersBox');
  if (!box) return;
  box.classList.toggle('collapsed');
  const collapsed = box.classList.contains('collapsed');
  const btn = document.getElementById('filterToggle');
  if (btn) btn.textContent = collapsed ? 'Развернуть' : 'Свернуть';
}

/* ─── View switcher ──────────────────────────────────────────────── */

function setView(v) {
  view = v === 'list' ? 'list' : 'grid';
  storage.set('cabeusView', view);
  const container = document.getElementById('products');
  if (container) { container.classList.remove('grid', 'list'); container.classList.add(view); }
  const gb = document.getElementById('gridBtn'), lb = document.getElementById('listBtn');
  if (gb) gb.classList.toggle('active', view === 'grid');
  if (lb) lb.classList.toggle('active', view === 'list');
  if (document.readyState !== 'loading') render();
}

/* ─── Navigation ─────────────────────────────────────────────────── */

function showHome() {
  currentSection = '';
  currentSubsection = '';
  filtered = [];
  document.getElementById('homeLanding')?.classList.remove('hidden');
  document.getElementById('shopPage')?.classList.add('hidden');
  const products = document.getElementById('products');
  if (products) products.innerHTML = '';
  const pager = document.getElementById('pager');
  if (pager) pager.innerHTML = '';
  const resultCount = document.getElementById('resultCount');
  if (resultCount) resultCount.textContent = '0';
}

function goHome() {
  showHome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCatalogDrawer() {
  document.getElementById('catalogDrawer')?.classList.add('open');
}

function closeCatalogDrawer() {
  document.getElementById('catalogDrawer')?.classList.remove('open');
}

function toggleCatSection(btn) {
  btn.closest('.cat-section')?.classList.toggle('open');
}

function chooseCatalog(sec, sub) {
  const targetSub = sub || '';
  currentSection = sec || '';
  currentSubsection = targetSub;
  closeCatalogDrawer();
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
  const sectionFilter = document.getElementById('sectionFilter');
  if (sectionFilter) sectionFilter.value = currentSection;
  onSectionChange();
  currentSubsection = targetSub;
  const subFilter = document.getElementById('subFilter');
  if (subFilter) subFilter.value = targetSub;
  FilterEngine.updateDynamicFilters();
  const title = document.getElementById('categoryTitle');
  if (title) title.textContent = targetSub ? `${currentSection} / ${targetSub}` : currentSection;
  FilterEngine.applyFilters();
  render();
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
}

function runHomeSearch() {
  const v = (document.getElementById('homeSearch')?.value || '').trim();
  closeCatalogDrawer();
  document.getElementById('homeLanding')?.classList.add('hidden');
  document.getElementById('shopPage')?.classList.remove('hidden');
  currentSection = '';
  currentSubsection = '';
  const sectionFilter = document.getElementById('sectionFilter');
  const subFilter = document.getElementById('subFilter');
  if (sectionFilter) sectionFilter.value = '';
  if (subFilter) subFilter.value = '';
  onSectionChange();
  const searchEl = document.getElementById('search');
  if (searchEl) searchEl.value = v;
  const title = document.getElementById('categoryTitle');
  if (title) title.textContent = v ? 'Поиск: ' + v : 'Все разделы';
  FilterEngine.applyFilters();
  render();
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
}

/* ─── Category tree ─────────────────────────────────────────────── */

function renderCategoryTree() {
  const groups = {};
  PRODUCTS.forEach(p => {
    const sec = p.section || 'Без категории';
    const sub = p.subsection || 'Без подраздела';
    groups[sec] = groups[sec] || { count: 0, subs: {} };
    groups[sec].count++;
    groups[sec].subs[sub] = (groups[sec].subs[sub] || 0) + 1;
  });
  const html = Object.entries(groups)
    .sort((a, b) => a[0].localeCompare(b[0], 'ru'))
    .map(([sec, data]) =>
      `<div class="cat-section">` +
      `<button class="cat-title" type="button" onclick="toggleCatSection(this)">` +
      `<span>${esc(sec)}</span><small>${data.count}</small></button>` +
      `<div class="sub-list">` +
      `<button type="button" onclick="chooseCatalog('${esc(sec)}','')">Все товары раздела · ${data.count}</button>` +
      Object.entries(data.subs).sort((a, b) => a[0].localeCompare(b[0], 'ru'))
        .map(([sub, c]) => `<button type="button" onclick="chooseCatalog('${esc(sec)}','${esc(sub)}')">${esc(sub)} · ${c}</button>`)
        .join('') +
      `</div></div>`
    ).join('');
  ['categoryTree', 'categoryTreeDrawer'].forEach(id => {
    const root = document.getElementById(id);
    if (root) root.innerHTML = html;
  });
}

/* ─── Cart ───────────────────────────────────────────────────────── */

function saveCart() {
  CartManager.save();
  updateCartCount();
}

function updateCartCount() {
  const n = CartManager.getCount();
  const el = document.getElementById('cartCount');
  if (el) el.textContent = n;
  const elM = document.getElementById('cartCountMobile');
  if (elM) elM.textContent = n;
}

function addToCart(id) {
  const el = document.getElementById('q' + id);
  const q = Math.max(1, parseInt(el?.value || '1', 10));
  CartManager.add(id, q);
  updateCartCount();
  showCartToast();
}

function showCartToast(message) {
  const el = document.getElementById('cartToast');
  if (!el) return;
  el.textContent = message || 'Товар добавлен в корзину';
  el.classList.add('show');
  clearTimeout(window.__cartToastTimer);
  window.__cartToastTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

window.qtyStep = (inputId, delta) => {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.value = Math.max(1, parseInt(el.value || '1', 10) + delta);
};

function openCart() {
  const items = CartManager.getItems();
  let total = 0;
  const rows = items.map(([id, qty]) => {
    const p = PRODUCTS[id];
    const unit = p.unit || 'шт.';
    const sum = Number(p.price || 0) * Number(qty || 0);
    total += sum;
    return `<div class="cart-row">` +
      `<div><div class="cart-name">${esc(p.article)}</div><div class="cart-sub">${esc(p.name)}</div></div>` +
      `<div class="cart-controls">` +
      `<input type="number" min="1" value="${qty}" onchange="CartManager.setQty(${id},Math.max(1,+this.value||1));updateCartCount();openCart()">` +
      `<span class="cart-unit">${esc(unit)}</span>` +
      `<div class="cart-sum">${rub.format(sum)}</div>` +
      `<button class="icon-btn" onclick="CartManager.remove(${id});updateCartCount();openCart()">×</button>` +
      `</div></div>`;
  }).join('');
  const cartItems = document.getElementById('cartItems');
  if (cartItems) {
    cartItems.innerHTML = rows
      ? `<div class="cart-list">${rows}</div>`
      : '<div class="empty-cart">Корзина пока пустая. Откройте каталог и добавьте товары.</div>';
  }
  const cartTotal = document.getElementById('cartTotal');
  if (cartTotal) cartTotal.textContent = rub.format(total);
  updateEmailLink();
  document.getElementById('cartModal')?.classList.add('open');
}

function closeCart() {
  document.getElementById('cartModal')?.classList.remove('open');
}

function requestText() {
  let total = 0;
  const lines = ['Здравствуйте! Прошу выставить счёт по позициям:', ''];
  CartManager.getItems().forEach(([id, qty]) => {
    const p = PRODUCTS[id];
    if (!p) return;
    const sum = Number(p.price || 0) * Number(qty || 0);
    total += sum;
    lines.push(`${p.article} — ${p.name} — ${qty} ${p.unit || 'шт.'} × ${rub.format(p.price)} = ${rub.format(sum)}`);
  });
  lines.push('', `Итого: ${rub.format(total)}`);
  const comment = document.getElementById('comment');
  const c = comment?.value.trim();
  if (c) lines.push('', 'Комментарий: ' + c);
  return lines.join('\n');
}

function updateEmailLink() {
  const emailLink = document.getElementById('emailLink');
  if (emailLink) {
    emailLink.href = 'mailto:sales@cabeus.ru?subject=' +
      encodeURIComponent('Заявка на счет Cabeus') +
      '&body=' + encodeURIComponent(requestText());
  }
}

function copyRequest() {
  navigator.clipboard?.writeText(requestText());
  const copied = document.getElementById('copied');
  if (copied) copied.classList.remove('hidden');
  updateEmailLink();
}

/* ─── Product modal ──────────────────────────────────────────────── */

function stockTag(p) {
  const unit = esc(p.unit || 'шт.');
  const transitQty = Number(p.transit || 0);
  const transitDate = p.nearTransit ? esc(p.nearTransit) : '';
  if (Number(p.qty || 0) > 0) return `<span class="tag ok">В наличии: ${p.qty} ${unit}</span>`;
  if (transitQty > 0) {
    return `<span class="tag">Нет в наличии</span>` +
      `<span class="tag warn">Транзит: ${transitQty} ${unit}</span>` +
      (transitDate ? `<span class="tag warn">Дата: ${transitDate}</span>` : '');
  }
  return `<span class="tag">Нет в наличии</span>`;
}

function cleanSpecs(p) {
  const unit = p.unit || 'шт.';
  const availRows = [];
  if (Number(p.qty || 0) > 0) {
    availRows.push(['Наличие', `В наличии: ${p.qty} ${unit}`]);
  } else {
    availRows.push(['Наличие', 'Нет в наличии']);
    if (Number(p.transit || 0) > 0) availRows.push(['Транзит', `${p.transit} ${unit}`]);
    if (p.nearTransit) availRows.push(['Дата транзита', p.nearTransit]);
  }
  const rows = [
    ['Артикул', p.article], ['Код', p.code], ['Раздел', p.section], ['Подраздел', p.subsection],
    ...availRows,
    ['Цена', rub.format(p.price)], ['Гарантия', p.warranty], ['Производитель', p.producer],
    ['Вес, кг', p.w], ['U', p.u], ['Порты', p.ports], ['Категория', p.cat ? ('Cat' + p.cat) : ''],
    ['Экранирование', p.shield], ['Цвет', p.color],
    ['Ширина, мм', p.width], ['Глубина, мм', p.depth], ['Дверь', p.door]
  ];
  return rows.filter(([, v]) => v !== '' && v != null && v !== 0 && v !== '0');
}

function openProduct(id) {
  const p = PRODUCTS[id];
  if (!p) return;
  const specs = cleanSpecs(p);
  // Remove brand prefix and article from display name; escape regex metacharacters in article
  let shortN = String(p.name || '').replace(/^Cabeus\s+/i, '');
  if (p.article) {
    const articleEscaped = String(p.article).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    shortN = shortN.replace(new RegExp(articleEscaped, 'g'), '');
  }
  shortN = shortN.replace(/\s+/g, ' ').trim();
  const photo = p.img ? `<div class="product-detail-photo"><img src="${p.img}" alt="${esc(p.name || p.article || '')}"></div>` : '';
  const productContent = document.getElementById('productContent');
  if (!productContent) return;
  productContent.innerHTML =
    `<div class="product-head"><div style="flex:1">` +
    `<p class="muted">Каталог / ${esc(p.article)}</p>` +
    `<h2>${esc(p.article)}</h2>` +
    `<div class="compact-name">${esc(shortN)}</div>` +
    `</div><div class="close" onclick="closeProduct()">×</div></div>` +
    `<div class="product-body">${photo}` +
    `<div class="price">${rub.format(p.price)}</div>` +
    `<div class="avail">${stockTag(p)}</div>` +
    `<div class="specs">${specs.map(([k, v]) => `<div class="spec"><small>${esc(k)}</small>${esc(v)}</div>`).join('')}</div>` +
    `<button class="btn full" onclick="addToCart(${p.id})">Добавить в корзину</button>` +
    `</div>`;
  const productModal = document.getElementById('productModal');
  if (!productModal) return;
  const box = productModal.querySelector('.box');
  if (box) box.classList.add('product-box');
  productModal.classList.add('open');
}

function closeProduct() {
  const productModal = document.getElementById('productModal');
  if (!productModal) return;
  productModal.classList.remove('open');
  const box = productModal.querySelector('.box');
  if (box) box.classList.remove('product-box');
}

/* ─── Initialize ─────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Stats
    const statProducts = document.getElementById('statProducts');
    if (statProducts) statProducts.textContent = PRODUCTS.length.toLocaleString('ru-RU');
    const statSections = document.getElementById('statSections');
    if (statSections) statSections.textContent = [...new Set(PRODUCTS.map(p => p.section).filter(Boolean))].length;
    const statStock = document.getElementById('statStock');
    if (statStock) statStock.textContent = PRODUCTS.filter(p => Number(p.qty || 0) > 0).length.toLocaleString('ru-RU');
    const statTransit = document.getElementById('statTransit');
    if (statTransit) statTransit.textContent = PRODUCTS.filter(p => Number(p.transit || 0) > 0).length.toLocaleString('ru-RU');

    // Section filter
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
      const secs = [...new Set(PRODUCTS.map(p => p.section).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'ru'));
      secs.forEach(s => sectionFilter.insertAdjacentHTML('beforeend', `<option value="${esc(s)}">${esc(s)}</option>`));
    }

    // Category tree
    renderCategoryTree();

    // View preference
    setView(view);

    // Cart count
    updateCartCount();

    // Show home
    showHome();

    // Initial dynamic filters
    FilterEngine.updateDynamicFilters();

  } catch (e) {
    console.error('App init error:', e);
  }
});

console.log('✅ Cabeus refactored app loaded successfully');
console.log('📦 Modules: utils, cart, filters, render, routing');
