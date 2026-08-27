import { create } from 'zustand';

const CART_KEY = 'medmarket_cart';

// Cart uses localStorage — survives tab close and aligns with auth token persistence.
// Previously sessionStorage; migrated so cart persists across hard refreshes.
function saveCart(state) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({
      items: state.items,
      storeId: state.storeId,
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
    if (storeId && storeId !== item.storeId) {
      const newState = { items: [{ ...item, qty: 1, _key: key }], storeId: item.storeId, storeName: item.storeName };
      set(newState); saveCart(newState);
      return { switched: true };
    }
    const existing = items.find(i => i._key === key);
    let newItems;
    if (existing) {
      const maxQty = item.availableQty ?? existing.availableQty ?? Infinity;
      newItems = items.map(i => i._key === key ? { ...i, qty: Math.min(existing.qty + 1, maxQty) } : i);
    } else {
      newItems = [...items, { ...item, qty: 1, _key: key }];
    }
    const newState = { items: newItems, storeId: item.storeId || storeId, storeName: item.storeName || get().storeName };
    set(newState); saveCart(newState);
    return { switched: false };
  },

  removeItem: (id) => {
    const state = get();
    const newItems = state.items.filter(i =>
      i._key !== id && i._key !== `inv:${id}` && i._key !== `med:${id}` &&
      i.inventoryId !== id && i.medicineId !== id
    );
    const newState = {
      items: newItems,
      storeId:   newItems.length ? state.storeId   : null,
      storeName: newItems.length ? state.storeName : null,
    };
    set(newState); saveCart(newState);
  },

  updateQty: (id, qty) => {
    if (qty <= 0) { get().removeItem(id); return; }
    const state = get();
    const newItems = state.items.map(i => {
      const matches = i._key === id || i._key === `inv:${id}` || i._key === `med:${id}` || i.inventoryId === id || i.medicineId === id;
      if (!matches) return i;
      return { ...i, qty: Math.min(qty, i.availableQty ?? Infinity) };
    });
    const newState = { ...state, items: newItems };
    set(newState); saveCart(newState);
  },

  clearCart: () => {
    const newState = { items: [], storeId: null, storeName: null };
    set(newState); saveCart(newState);
  },

  // ── OOS remediation ────────────────────────────────────────────────────────
  // Called by Checkout when the backend rejects an order due to stock issues.
  // Marks affected items so the UI can render a warning banner + remove action.
  flagUnavailable: (inventoryIds) => {
    const state = get();
    const idSet = new Set(inventoryIds);
    const newItems = state.items.map(i =>
      idSet.has(i.inventoryId) ? { ...i, _unavailable: true } : i
    );
    const newState = { ...state, items: newItems };
    set(newState); saveCart(newState);
  },

  // Clears all OOS flags (called after user removes unavailable items or tries again)
  clearFlags: () => {
    const state = get();
    const newItems = state.items.map(({ _unavailable, ...i }) => i);
    const newState = { ...state, items: newItems };
    set(newState); saveCart(newState);
  },

  // Convenience: remove all items that are flagged unavailable
  removeUnavailable: () => {
    const state = get();
    const newItems = state.items.filter(i => !i._unavailable);
    const newState = {
      items: newItems,
      storeId:   newItems.length ? state.storeId   : null,
      storeName: newItems.length ? state.storeName : null,
    };
    set(newState); saveCart(newState);
  },
}));

export default useCartStore;
