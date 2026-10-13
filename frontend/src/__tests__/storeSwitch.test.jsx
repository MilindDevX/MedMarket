/**
 * StoreProfile — confirming "Switch store?" must replace the cart with the
 * chosen item, not leave it empty.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const STORE_B = {
  id: 'store-b', name: 'City Pharma', address_line: '1 Road', city: 'Pune', pincode: '411001',
  is_verified: true,
  inventory: [{
    id: 'inv-b1', medicine_id: 'med-9', quantity: 10, status: 'active', selling_price: '40',
    medicine: { name: 'Cetirizine 10', generic_name: 'Cetirizine', pack_size: '10 tabs', category: 'Allergy', mrp: '50' },
  }],
};

vi.mock('../hooks/useStoreDetail', () => ({
  useStoreDetail: () => ({ store: STORE_B, loading: false, error: null }),
}));

const { default: useCartStore } = await import('../store/cartStore.js');
const { default: StoreProfile } = await import('../pages/consumer/StoreProfile.jsx');

describe('StoreProfile store switch', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().addItem({
      medicineId: 'med-1', medicineName: 'Paracetamol', inventoryId: 'inv-a1',
      storeId: 'store-a', storeName: 'Old Store', price: 20, packSize: '10', availableQty: 5,
    });
  });

  it('replaces the cart with the new store item after confirming', () => {
    render(
      <MemoryRouter initialEntries={['/consumer/stores/store-b']}>
        <Routes><Route path="/consumer/stores/:storeId" element={<StoreProfile />} /></Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Switch store' }));

    const { items, storeId } = useCartStore.getState();
    expect(storeId).toBe('store-b');
    expect(items).toHaveLength(1);
    expect(items[0].inventoryId).toBe('inv-b1');
  });
});
