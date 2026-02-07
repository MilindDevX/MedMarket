import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
  toasts: [],

  add: (toast) => {
    const id = ++toastId;
    const t = { id, type: 'info', duration: 3500, ...toast };
    set({ toasts: [...get().toasts, t] });
    if (t.duration > 0) {
      setTimeout(() => get().remove(id), t.duration);
    }
    return id;
  },

  remove: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),

  success: (message, opts = {}) => get().add({ type: 'success', message, ...opts }),
  error:   (message, opts = {}) => get().add({ type: 'error',   message, duration: 5000, ...opts }),
  info:    (message, opts = {}) => get().add({ type: 'info',    message, ...opts }),
  warning: (message, opts = {}) => get().add({ type: 'warning', message, ...opts }),
}));

export default useToastStore;
