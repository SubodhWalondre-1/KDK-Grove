import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: (token, user) => set({ token, user }),

      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem('mediora-auth');
      },

      get isAuthenticated() {
        return !!get().token;
      },
    }),
    {
      name: 'mediora-auth',
    },
  ),
);
