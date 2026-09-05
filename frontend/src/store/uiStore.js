import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light',
      activeLanguage: 'en-IN',

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setActiveLanguage: (activeLanguage) => set({ activeLanguage }),
    }),
    {
      name: 'mediora-ui-store',
    }
  )
);
