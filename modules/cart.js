/**
 * CART MANAGEMENT
 * All shopping cart operations with validation
 */

let cart = storage.get('cabeusCartFull', {});

const CartManager = {
  add(id, quantity = 1) {
    try {
      if (!PRODUCTS[id]) {
        console.error(`Product ${id} not found`);
        return false;
      }
      const max = getMaxAvailable(PRODUCTS[id]);
      if (max <= 0) {
        alert('Товар недоступен');
        return false;
      }
      const current = Number(cart[id] || 0);
      if (current + quantity > max) {
        alert(`Максимум: ${max} ${getUnit(PRODUCTS[id])}`);
        return false;
      }
      cart[id] = current + quantity;
      this.save();
      return true;
    } catch (e) {
      console.error('CartManager.add error:', e);
      return false;
    }
  },

  remove(id) {
    try {
      delete cart[id];
      this.save();
    } catch (e) {
      console.error('CartManager.remove error:', e);
    }
  },

  setQty(id, qty) {
    try {
      const q = Math.max(1, parseInt(qty, 10) || 1);
      const max = getMaxAvailable(PRODUCTS[id]);
      cart[id] = q > max ? max : q;
      this.save();
    } catch (e) {
      console.error('CartManager.setQty error:', e);
    }
  },

  changeQty(id, delta) {
    try {
      const current = Number(cart[id] || 1);
      this.setQty(id, Math.max(1, current + delta));
    } catch (e) {
      console.error('CartManager.changeQty error:', e);
    }
  },

  save() {
    try {
    storage.set('cabeusCartFull', cart);
    } catch (e) {
      console.error('CartManager.save error:', e);
    }
  },

  clear() {
    cart = {};
    this.save();
  },

  getTotal() {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      return sum + (Number(PRODUCTS[id]?.price || 0) * Number(qty || 0));
    }, 0);
  },

  getItems() {
    return Object.entries(cart).filter(([id, qty]) => PRODUCTS[id] && Number(qty) > 0);
  },

  getCount() {
    return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
  }
};

window.CartManager = CartManager;
window.cart = cart;
