/**
 * ROUTING ENGINE
 * URL/hash navigation and state management
 */

const RouterEngine = {
  parseRoute() {
    const hash = String(location.hash || '').replace(/^#/, '');
    if (!hash || hash === 'home') return { view: 'home' };
    const qs = new URLSearchParams(hash);
    if (hash.startsWith('section=')) return { view: 'section', section: decodeURIComponent(qs.get('section')) };
    if (hash.startsWith('catalog=')) return { view: 'catalog', section: decodeURIComponent(qs.get('catalog')), subsection: decodeURIComponent(qs.get('sub')), page: Number(qs.get('page')) || 1 };
    if (hash.startsWith('search=')) return { view: 'search', query: decodeURIComponent(qs.get('search') || ''), page: Number(qs.get('page')) || 1 };
    if (hash.startsWith('product=')) return { view: 'product', id: Number(qs.get('product')) || 0 };
    if (hash === 'cart') return { view: 'cart' };
    return { view: 'home' };
  },

  hashFor(st) {
    if (!st || st.view === 'home') return '#home';
    if (st.view === 'section') return '#section=' + encodeURIComponent(st.section || '');
    if (st.view === 'catalog') return '#catalog=' + encodeURIComponent(st.section || '') + '&sub=' + encodeURIComponent(st.subsection || '') + '&page=' + (Number(st.page) || 1);
    if (st.view === 'search') return '#search=' + encodeURIComponent(st.query || '') + '&page=' + (Number(st.page) || 1);
    if (st.view === 'product') return '#product=' + encodeURIComponent(st.id || 0);
    if (st.view === 'cart') return '#cart';
    return '#home';
  },

  pushRoute(st, replace = false) {
    try {
      const url = location.pathname + location.search + this.hashFor(st);
      if (replace) history.replaceState(st, '', url);
      else history.pushState(st, '', url);
    } catch (e) {
      console.warn('Routing error:', e.message);
    }
  },

  goHome() {
    currentSection = '';
    currentSubsection = '';
    page = 1;
    filtered = [];
    document.getElementById('homeLanding')?.classList.remove('hidden');
    document.getElementById('shopPage')?.classList.add('hidden');
    this.pushRoute({ view: 'home' }, false);
    window.scrollTo(0, 0);
  },

  chooseCatalog(sec, sub) {
    currentSection = sec || '';
    currentSubsection = sub || '';
    page = 1;
    FilterEngine.applyFilters();
    document.getElementById('homeLanding')?.classList.add('hidden');
    document.getElementById('shopPage')?.classList.remove('hidden');
    RenderEngine.render();
    this.pushRoute({ view: 'catalog', section: sec, subsection: sub, page: 1 }, false);
    window.scrollTo(0, 0);
  },

  runSearch(q) {
    const query = (q || document.getElementById('search')?.value || '').trim();
    if (!query) { this.goHome(); return; }
    currentSection = '';
    currentSubsection = '';
    page = 1;
    FilterEngine.applyFilters();
    document.getElementById('homeLanding')?.classList.add('hidden');
    document.getElementById('shopPage')?.classList.remove('hidden');
    RenderEngine.render();
    this.pushRoute({ view: 'search', query, page: 1 }, false);
    window.scrollTo(0, 0);
  },

  openProduct(id) {
    const p = PRODUCTS[id];
    if (!p) { console.warn('Product not found:', id); return; }
    alert(`${p.article}\n${p.name}\nЦена: ${formatMoney(p.price)}\n${getStockLabel(p)}`);
  },

  setCatalogPage(n) {
    page = Number(n) || 1;
    RenderEngine.render();
    window.scrollTo(0, 0);
  }
};

window.RouterEngine = RouterEngine;
