import { create } from 'zustand';

// Minimal in-memory store used only by Checkout to surface the placed order ID
// immediately after POST /orders without waiting for a refetch.
// MyOrders and OrderTracking always read from the real API via hooks.
const useOrderStore = create((set, _get) => ({
  recentOrderId: null,

  addOrder: (order) => {
    set({ recentOrderId: order?.id || null });
  },

  clearRecentOrder: () => set({ recentOrderId: null }),
}));

export default useOrderStore;
