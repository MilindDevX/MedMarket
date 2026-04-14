import { create } from 'zustand';

const useOrderStore = create((set, get) => ({
  recentOrderId: null,

  addOrder: (order) => {
    set({ recentOrderId: order?.id || null });
  },

  clearRecentOrder: () => set({ recentOrderId: null }),
}));

export default useOrderStore;
