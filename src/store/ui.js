import { create } from "zustand";

export const useUIStore = create((set) => ({
  error: null,
  joining: false,
  copied: false,
  loading: false, // For player loading state
  setError: (error) => set({ error }),
  setJoining: (joining) => set({ joining }),
  setLoading: (loading) => set({ loading }),
  flashCopied: () => {
    set({ copied: true });
    setTimeout(() => set({ copied: false }), 2000);
  },
}));