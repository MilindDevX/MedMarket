import { create } from 'zustand';

const CART_KEY = 'medmarket_cart';

function saveCart(state) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({
      items:     state.items,
      storeId:   state.storeId,
      storeName: state.storeName,
    }));
  } catch {}
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Consistent item identity: inventoryId for store items, medicineId for browse items
function itemKey(item) {
  return item.inventoryId ? `inv:${item.inventoryId}` : `med:${item.medicineId}`;
}

const saved = loadCart();

const useCartStore = create((set, get) => ({
  items:     saved?.items     || [],
  storeId:   saved?.storeId   || null,
  storeName: saved?.storeName || null,

  addItem: (item) => {
    const { items, storeId } = get();
    const key = itemKey(item);

    // Different store — clear and start fresh
    if (storeId && storeId !== item.storeId) {
      const newState = {
        items: [{ ...item, qty: 1, _key: key }],
        storeId:   item.storeId,
        storeName: item.storeName,
      };
      set(newState);
      saveCart(newState);
      return { switched: true };
    }

    const existing = items.find(i => i._key === key);
    let newItems;

    if (existing) {
      const maxQty = item.availableQty ?? existing.availableQty ?? Infinity;
      const newQty = Math.min(existing.qty + 1, maxQty);
      newItems = items.map(i => i._key === key ? { ...i, qty: newQty } : i);
    } else {
      newItems = [...items, { ...item, qty: 1, _key: key }];
    }

    const newState = {
      items: newItems,
      storeId:   item.storeId   || storeId,
      storeName: item.storeName || get().storeName,
    };
    set(newState);
    saveCart(newState);
    return { switched: false };
  },

  removeItem: (id) => {
    // id can be inventoryId, medicineId, or _key
    const state = get();
    const newItems = state.items.filter(i =>
      i._key !== id &&
      i._key !== `inv:${id}` &&
      i._key !== `med:${id}` &&
      i.inventoryId !== id &&
      i.medicineId  !== id
    );
    const newState = {
      items:     newItems,
      storeId:   newItems.length ? state.storeId   : null,
      storeName: newItems.length ? state.storeName : null,
    };
    set(newState);
    saveCart(newState);
  },

  updateQty: (id, qty) => {
    if (qty <= 0) { get().removeItem(id); return; }
    const state   = get();
    const newItems = state.items.map(i => {
      const matches = i._key === id || i._key === `inv:${id}` || i._key === `med:${id}` || i.inventoryId === id || i.medicineId === id;
      if (!matches) return i;
      const maxQty = i.availableQty ?? Infinity;
      return { ...i, qty: Math.min(qty, maxQty) };
    });
    const newState = { ...state, items: newItems };
    set(newState);
    saveCart(newState);
  },

  clearCart: () => {
    const newState = { items: [], storeId: null, storeName: null };
    set(newState);
    saveCart(newState);
  },
}));

export default useCartStore;
