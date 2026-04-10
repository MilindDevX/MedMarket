import { create } from 'zustand';
import { mockInventory } from '../data/mockData';

const useInventoryStore = create((set, get) => ({
  inventory: mockInventory,

  addItem: (item) => set(s => ({ inventory: [item, ...s.inventory] })),

  updateItem: (id, changes) => set(s => ({
    inventory: s.inventory.map(i => i.id === id ? { ...i, ...changes } : i)
  })),

  deleteItem: (id) => set(s => ({
    inventory: s.inventory.filter(i => i.id !== id)
  })),

  updatePrice: (id, price) => set(s => ({
    inventory: s.inventory.map(i => i.id === id ? { ...i, price } : i)
  })),

  getAlerts: () => get().inventory.filter(i =>
    ['expiring-soon', 'expiring-critical', 'expired', 'low'].includes(i.status)
  ),
}));

export default useInventoryStore;
