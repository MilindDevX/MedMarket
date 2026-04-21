/**
 * cartStore — unit tests
 *
 * Tests add/remove/update/clear and the cross-store switching rule:
 * adding an item from a different store should clear the cart and start fresh.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock sessionStorage before importing the store
const storage = {};
vi.stubGlobal('sessionStorage', {
  getItem:    (k) => storage[k] ?? null,
  setItem:    (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; },
});

// Import AFTER stubbing sessionStorage so the module sees the mock
const { default: useCartStore } = await import('../store/cartStore.js');

const ITEM_A = {
  inventoryId: 'inv-001', medicineId: 'med-1', name: 'Paracetamol 500',
  storeId: 'store-1', storeName: 'MediCare Pharma', unitPrice: 25, availableQty: 50,
};
const ITEM_B = {
  inventoryId: 'inv-002', medicineId: 'med-2', name: 'Ibuprofen 400',
  storeId: 'store-1', storeName: 'MediCare Pharma', unitPrice: 40, availableQty: 30,
};
const ITEM_OTHER_STORE = {
  inventoryId: 'inv-003', medicineId: 'med-3', name: 'Vitamin C 500',
  storeId: 'store-2', storeName: 'HealthPlus', unitPrice: 60, availableQty: 20,
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('starts with an empty cart', () => {
    const { items, storeId } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(storeId).toBeNull();
  });

  it('adds an item and sets storeId', () => {
    useCartStore.getState().addItem(ITEM_A);
    const { items, storeId } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(1);
    expect(storeId).toBe('store-1');
  });

  it('increments quantity when the same item is added twice', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_A);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
  });

  it('does not exceed availableQty', () => {
    const limitedItem = { ...ITEM_A, availableQty: 2 };
    useCartStore.getState().addItem(limitedItem);
    useCartStore.getState().addItem(limitedItem);
    useCartStore.getState().addItem(limitedItem); // 3rd add should cap at 2
    const { items } = useCartStore.getState();
    expect(items[0].qty).toBe(2);
  });

  it('adds different items from the same store', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_B);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
  });

  it('clears cart and switches store when item from different store is added', () => {
    useCartStore.getState().addItem(ITEM_A);
    const result = useCartStore.getState().addItem(ITEM_OTHER_STORE);
    const { items, storeId } = useCartStore.getState();
    expect(result.switched).toBe(true);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Vitamin C 500');
    expect(storeId).toBe('store-2');
  });

  it('removes an item by inventoryId', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_B);
    useCartStore.getState().removeItem('inv-001');
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].inventoryId).toBe('inv-002');
  });

  it('clears storeId when last item is removed', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().removeItem('inv-001');
    const { items, storeId } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(storeId).toBeNull();
  });

  it('updates quantity with updateQty', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().updateQty('inv-001', 5);
    const { items } = useCartStore.getState();
    expect(items[0].qty).toBe(5);
  });

  it('removes item when updateQty is called with 0', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().updateQty('inv-001', 0);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it('clearCart resets all state', () => {
    useCartStore.getState().addItem(ITEM_A);
    useCartStore.getState().addItem(ITEM_B);
    useCartStore.getState().clearCart();
    const { items, storeId, storeName } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(storeId).toBeNull();
    expect(storeName).toBeNull();
  });
});
