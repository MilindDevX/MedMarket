import { create } from 'zustand';
import { mockConsumerOrders } from '../data/mockData';

const useOrderStore = create((set, get) => ({
  orders: [...mockConsumerOrders],

  addOrder: (order) => {
    set({ orders: [order, ...get().orders] });
  },

  getOrder: (id) => get().orders.find(o => o.id === id),

  updateStatus: (id, status) => {
    set({ orders: get().orders.map(o => o.id === id ? { ...o, status } : o) });
  },
}));

export default useOrderStore;
