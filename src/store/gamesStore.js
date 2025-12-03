import { create } from "zustand";
import { collection, onSnapshot, query, orderBy, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthStore } from "./authStore";

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

export const useGamesStore = create((set, get) => ({
    games: [],
    loading: true,
    error: null,
    unsubs: [],

    startGamesListener: () => {
        const { unsubs } = get();
        if (unsubs.length > 0) {
            unsubs.forEach(unsub => unsub());
            set({ unsubs: [] });
        }

        const { user: currentUser, loading: authLoading } = useAuthStore.getState();

        if (authLoading || !currentUser) {
            if (!currentUser && !authLoading) {
                set({ games: [], loading: false, error: null });
            }
            return;
        }

        set({ loading: true, error: null });

        if (currentUser.role === "super admin") {
            const qGames = query(collection(db, "games"), orderBy("order", "asc"));
            const unsub = onSnapshot(
                qGames,
                (snap) => {
                    const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    const visible = raw.filter((g) => g.hidden !== true && g.hidden !== "true" && g.hidden !== 1);
                    set({ games: visible, loading: false, error: null, unsubs: [unsub] });
                },
                (err) => {
                    set({ games: [], loading: false, error: err?.message || "Failed to load games (Admin)" });
                }
            );
            set({ unsubs: [unsub] });
            return;
        }

        const qPerm = query(
            collection(db, "permissions"),
            where("userId", "==", currentUser.uid),
            where("view", "==", true)
        );

        const unsubPerm = onSnapshot(
            qPerm,
            async (permSnap) => {
                const gameIds = Array.from(new Set(permSnap.docs.map((d) => d.data()?.gameId).filter(Boolean)));

                if (gameIds.length === 0) {
                    set({ games: [], loading: false, error: null, unsubs: [unsubPerm] });
                    return;
                }

                const ID_LIMIT = 10;
                const chunks = chunk(gameIds, ID_LIMIT);

                try {
                    const allGameDocs = [];
                    await Promise.all(
                        chunks.map(async (c) => {
                            const qG = query(collection(db, "games"), where("id", "in", c));
                            const s = await getDocs(qG);
                            s.forEach((d) => allGameDocs.push({ id: d.id, ...d.data() }));
                        })
                    );

                    allGameDocs.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
                    const visible = allGameDocs.filter((g) => g.hidden !== true && g.hidden !== "true" && g.hidden !== 1);

                    set({ games: visible, loading: false, error: null, unsubs: [unsubPerm] });

                } catch (e) {
                    console.error("Error fetching chunked games, falling back to client-side filtering:", e);

                    const qAll = query(collection(db, "games"), orderBy("order", "asc"));

                    const unsubAll = onSnapshot(qAll, (snap) => {
                        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
                            .filter((g) => gameIds.includes(g.id));

                        const visible = list.filter((g) => g.hidden !== true && g.hidden !== "true" && g.hidden !== 1);
                        set({ games: visible, loading: false, error: null, unsubs: [unsubPerm, unsubAll] });
                    }, (err) => {
                        set({ games: [], loading: false, error: err?.message || "Failed to load games (Fallback)" });
                    });
                    set({ unsubs: [unsubPerm, unsubAll] });
                }
            },
            (err) => {
                set({ games: [], loading: false, error: err?.message || "Failed to load permissions" });
            }
        );

        set((state) => ({ unsubs: [...state.unsubs, unsubPerm] }));
    },

    stopGamesListener: () => {
        const { unsubs } = get();
        unsubs.forEach(unsub => unsub());
        set({ unsubs: [] });
    }
}));