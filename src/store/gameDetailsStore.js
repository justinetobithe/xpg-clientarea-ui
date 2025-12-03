import { create } from "zustand";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

export const useGameDetailsStore = create((set, get) => ({
    game: null,
    sections: [],
    promotionGames: [],
    loadingGame: true,
    loadingSections: true,
    loadingRelated: true,
    error: null,
    relatedUnsub: null,

    fetchGame: async (gameId) => {
        if (!gameId) return;
        set({ loadingGame: true, error: null });
        try {
            const snap = await getDoc(doc(db, "games", gameId));
            if (!snap.exists()) {
                set({ game: null, loadingGame: false, error: "Game not found" });
                return;
            }
            set({ game: { id: snap.id, ...snap.data() }, loadingGame: false });
        } catch {
            set({ game: null, loadingGame: false, error: "Error fetching game" });
        }
    },

    fetchSections: async (gameId, user) => {
        if (!gameId || !user) return;
        set({ loadingSections: true, error: null });
        try {
            const sectSnap = await getDocs(
                query(collection(db, "sections"), where("gameId", "==", gameId))
            );

            let raw = sectSnap.docs.map((d) => {
                const data = d.data() || {};
                const s = data.section || {};
                return {
                    sectionId: d.id,
                    title: data.title || s.title || "Untitled Section",
                    files: data.files || s.files || [],
                    order:
                        typeof data.order === "number"
                            ? data.order
                            : typeof s.order === "number"
                                ? s.order
                                : 999
                };
            });

            if (user.role !== "super admin") {
                const permSnap = await getDocs(
                    query(
                        collection(db, "permissions"),
                        where("userId", "==", user.uid),
                        where("gameId", "==", gameId),
                        where("view", "==", true)
                    )
                );
                const allowed = new Set(
                    permSnap.docs.map((d) => d.data()?.sectionId).filter(Boolean)
                );
                raw = raw.filter((s) => allowed.has(s.sectionId));
            }

            raw.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            set({ sections: raw, loadingSections: false });
        } catch {
            set({ sections: [], loadingSections: false });
        }
    },

    startRelatedListener: async (gameId, user) => {
        if (!user) return;
        const { relatedUnsub } = get();
        if (relatedUnsub) return;

        set({ loadingRelated: true });

        try {
            let qGames;

            if (user.role === "super admin") {
                qGames = query(
                    collection(db, "games"),
                    orderBy("createdAt", "desc"),
                    limit(12)
                );
            } else {
                const accessSnap = await getDocs(
                    query(
                        collection(db, "permissions"),
                        where("userId", "==", user.uid),
                        where("view", "==", true)
                    )
                );
                const gids = Array.from(
                    new Set(accessSnap.docs.map((d) => d.data()?.gameId).filter(Boolean))
                );

                if (gids.length === 0) {
                    set({ promotionGames: [], loadingRelated: false });
                    return;
                }

                qGames = query(
                    collection(db, "games"),
                    orderBy("createdAt", "desc"),
                    limit(20)
                );
            }

            const unsub = onSnapshot(
                qGames,
                (snap) => {
                    const list = snap.docs
                        .map((d) => ({ id: d.id, ...d.data() }))
                        .filter((g) => g.id !== gameId);

                    set({
                        promotionGames: list.slice(0, 12),
                        loadingRelated: false
                    });
                },
                () => set({ promotionGames: [], loadingRelated: false })
            );

            set({ relatedUnsub: unsub });
        } catch {
            set({ promotionGames: [], loadingRelated: false });
        }
    },

    stopRelatedListener: () => {
        const { relatedUnsub } = get();
        if (relatedUnsub) relatedUnsub();
        set({ relatedUnsub: null });
    }
}));
