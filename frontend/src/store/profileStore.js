import { create } from 'zustand';

export const useProfileStore = create((set) => ({
  activeProfile: null,
  profiles: [],

  setActiveProfile: (profile) => set({ activeProfile: profile }),
  setProfiles: (profiles) => set({ profiles }),
  addProfile: (profile) =>
    set((state) => ({
      profiles: [...state.profiles, profile],
      activeProfile: profile,
    })),
}));
