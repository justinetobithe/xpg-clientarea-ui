import { create } from "zustand";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const norm = (s) => String(s || "").toLowerCase().trim();

const detectFamilyKey = (gameName) => {
    const n = norm(gameName);

    const keys = [
        "baccarat",
        "roulette",
        "blackjack",
        "sic bo",
        "sicbo",
        "dragon tiger",
        "dragontiger",
        "andar bahar",
        "andarbahar",
        "teenpatti",
        "teen patti",
        "poker",
        "bull bull",
        "bullbull",
        "mahjong",
        "fan tan",
        "fantan"
    ];

    for (const k of keys) {
        if (n.includes(k)) return k.replace(/\s+/g, "");
    }

    return "";
};

const matchFamily = (candidateName, familyKey) => {
    if (!familyKey) return true;
    const c = norm(candidateName).replace(/\s+/g, "");
    return c.includes(familyKey);
};

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
            const sectSnap = await getDocs(query(collection(db, "sections"), where("gameId", "==", gameId)));

            let raw = sectSnap.docs.map((d) => {
                const data = d.data() || {};
                const s = data.section || {};
                return {
                    sectionId: d.id,
                    title: data.title || s.title || "Untitled Section",
                    files: data.files || s.files || [],
                    order: typeof data.order === "number" ? data.order : typeof s.order === "number" ? s.order : 999
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

                const allowed = new Set(permSnap.docs.map((d) => d.data()?.sectionId).filter(Boolean));
                raw = raw.filter((s) => allowed.has(s.sectionId));
            }

            raw.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            set({ sections: raw, loadingSections: false });
        } catch {
            set({ sections: [], loadingSections: false });
        }
    },

    startRelatedListener: async (gameId, user, currentGameName = "") => {
        if (!user) return;

        const { relatedUnsub } = get();
        if (relatedUnsub) return;

        set({ loadingRelated: true });

        const familyKey = detectFamilyKey(currentGameName);

        try {
            let allowedGameIds = null;

            if (user.role !== "super admin") {
                const accessSnap = await getDocs(
                    query(collection(db, "permissions"), where("userId", "==", user.uid), where("view", "==", true))
                );

                allowedGameIds = new Set(accessSnap.docs.map((d) => d.data()?.gameId).filter(Boolean));

                if (!allowedGameIds.size) {
                    set({ promotionGames: [], loadingRelated: false });
                    return;
                }
            }

            const qGames = query(collection(db, "games"), orderBy("createdAt", "desc"), limit(80));

            const unsub = onSnapshot(
                qGames,
                (snap) => {
                    const list = snap.docs
                        .map((d) => ({ id: d.id, ...d.data() }))
                        .filter((g) => g.id !== gameId)
                        .filter((g) => (allowedGameIds ? allowedGameIds.has(g.id) : true))
                        .filter((g) => matchFamily(g?.name || "", familyKey))
                        .slice(0, 12);

                    set({ promotionGames: list, loadingRelated: false });
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
