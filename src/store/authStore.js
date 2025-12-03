import { create } from "zustand";

export const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    setUser: (user) => {
        set({ user, loading: false }); 
        import('./gamesStore').then(({ useGamesStore }) => {
            useGamesStore.getState().startGamesListener();
        });
    },
    clearUser: () => {
        set({ user: null, loading: false }); 
        import('./gamesStore').then(({ useGamesStore }) => {
            useGamesStore.getState().startGamesListener();
        });
    }
}));