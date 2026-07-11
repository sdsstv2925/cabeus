/**
 * CABEUS CATALOG - REFACTORED
 * Main initialization and event handlers
 * 
 * MODULES LOADED:
 * 1. modules/utils.js       - Utilities & helpers
 * 2. modules/cart.js        - Cart management
 * 3. modules/filters.js     - Filtering engine
 * 4. modules/render.js      - Rendering engine
 * 5. modules/routing.js     - Routing engine
 */

// Global window handlers for buttons and inputs
window.qtyStep = (inputId, delta) => {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.value = Math.max(1, parseInt(el.value || '1', 10) + delta);
};

window.toggleView = () => {
  const view = localStorage.getItem('cabeusView') || 'grid';
  localStorage.setItem('cabeusView', view === 'grid' ? 'list' : 'grid');
  location.reload();
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Load view preference
    const view = localStorage.getItem('cabeusView') || 'grid';
    const products = document.getElementById('products');
    if (products) {
      products.className = view;
    }

    // Initialize filters
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
      sectionFilter.innerHTML = '<option value="">Все разделы</option>' +
        unique(PRODUCTS, 'section').map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
      sectionFilter.addEventListener('change', () => {
        FilterEngine.updateDynamicFilters();
        FilterEngine.applyFilters();
        RenderEngine.render();
      });
    }

    // Initialize search
    const search = document.getElementById('search');
    if (search) {
      search.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          RouterEngine.runSearch();
        }
      });
    }

    // Initial render
    FilterEngine.applyFilters();
    RenderEngine.render();

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      const route = RouterEngine.parseRoute();
      if (route.view === 'home') RouterEngine.goHome();
      else if (route.view === 'catalog') RouterEngine.chooseCatalog(route.section, route.subsection);
      else if (route.view === 'search') RouterEngine.runSearch(route.query);
    });

  } catch (e) {
    console.error('App initialization error:', e);
    alert('Ошибка при загрузке приложения. Обновите страницу.');
  }
});

console.log('✅ Cabeus refactored app loaded successfully');
console.log('📦 Modules: utils, cart, filters, render, routing');
console.log('🚀 Ready to use: CartManager, FilterEngine, RenderEngine, RouterEngine');
