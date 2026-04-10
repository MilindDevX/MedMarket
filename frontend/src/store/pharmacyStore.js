import { create } from 'zustand';
import { mockApplications } from '../data/mockData';

const usePharmacyStore = create((set, get) => ({
  applications: mockApplications,

  approve: (id) => set(state => ({
    applications: state.applications.map(a =>
      a.id === id ? { ...a, status: 'approved', decidedAt: new Date().toISOString() } : a
    )
  })),

  reject: (id, reason) => set(state => ({
    applications: state.applications.map(a =>
      a.id === id ? { ...a, status: 'rejected', rejectionReason: reason, decidedAt: new Date().toISOString() } : a
    )
  })),

  suspend: (id) => set(state => ({
    applications: state.applications.map(a =>
      a.id === id ? { ...a, status: 'suspended' } : a
    )
  })),

  reinstate: (id) => set(state => ({
    applications: state.applications.map(a =>
      a.id === id ? { ...a, status: 'approved' } : a
    )
  })),

  getById: (id) => get().applications.find(a => a.id === id),
}));

export default usePharmacyStore;
