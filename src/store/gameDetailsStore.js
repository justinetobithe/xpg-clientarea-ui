import { create } from "zustand";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebase";

const norm = (s) => String(s || "").toLowerCase().trim();

const truthy = (v) => v === true || v === "true" || v === 1;

const isHidden = (g) => g?.hidden === true || g?.hidden === "true" || g?.hidden === 1;

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
        "fantan",
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

const getRoleId = (user) => String(user?.role_id || "").trim();

const getSectionIdFromPerm = (p) => {
    const v = p?.sectionId ?? p?.section_id ?? p?.section ?? "";
    const s = String(v || "").trim();
    return s || "";
};

const getGameIdFromPerm = (p) => {
    const v = p?.gameId ?? p?.game_id ?? p?.game ?? "";
    const s = String(v || "").trim();
    return s || "";
};

async function getAllowedForRole(roleId) {
    const rid = String(roleId || "").trim();
    if (!rid) return { gameIds: new Set(), sectionIdsByGame: new Map() };

    const snap = await getDocs(
        query(collection(db, "permissionss"), where("role_id", "==", rid), where("view", "==", true), limit(5000))
    );

    const gameIds = new Set();
    const sectionIdsByGame = new Map();

    snap.docs.forEach((d) => {
        const p = d.data() || {};
        const gid = getGameIdFromPerm(p);
        if (!gid) return;

        gameIds.add(gid);

        const sid = getSectionIdFromPerm(p);
        if (!sid) return;

        if (!sectionIdsByGame.has(gid)) sectionIdsByGame.set(gid, new Set());
        sectionIdsByGame.get(gid).add(sid);
    });

    return { gameIds, sectionIdsByGame };
}

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
            const snap = await getDoc(doc(db, "games", String(gameId)));
            if (!snap.exists()) {
                set({ game: null, loadingGame: false, error: "GAME_NOT_FOUND" });
                return;
            }
            set({ game: { id: snap.id, ...snap.data() }, loadingGame: false, error: null });
        } catch {
            set({ game: null, loadingGame: false, error: "Error fetching game" });
        }
    },

    fetchSections: async (gameId, user) => {
        const gid = String(gameId || "").trim();
        const rid = getRoleId(user);

        if (!gid || !user?.uid) return;

        set({ loadingSections: true });

        try {
            const sectSnap = await getDocs(query(collection(db, "sections"), where("gameId", "==", gid)));

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
                                : 999,
                };
            });

            if (!rid) {
                set((state) => ({
                    sections: [],
                    loadingSections: false,
                    error: state.error === "GAME_NOT_FOUND" ? state.error : "No role assigned to your account.",
                }));
                return;
            }

            const { gameIds, sectionIdsByGame } = await getAllowedForRole(rid);

            if (!gameIds.has(gid)) {
                set((state) => ({
                    sections: [],
                    loadingSections: false,
                    error:
                        state.error === "GAME_NOT_FOUND"
                            ? state.error
                            : "No access to this game. Ask admin to grant game permissions.",
                }));
                return;
            }

            const allowedSectionIds = sectionIdsByGame.get(gid);
            if (allowedSectionIds && allowedSectionIds.size) {
                raw = raw.filter((s) => allowedSectionIds.has(String(s.sectionId)));
            }

            raw.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

            set((state) => ({
                sections: raw,
                loadingSections: false,
                error: state.error === "GAME_NOT_FOUND" ? state.error : null,
            }));
        } catch {
            set((state) => ({
                sections: [],
                loadingSections: false,
                error: state.error === "GAME_NOT_FOUND" ? state.error : "Error fetching sections",
            }));
        }
    },

    startRelatedListener: async (gameId, user, currentGameName = "") => {
        const gid = String(gameId || "").trim();
        const rid = getRoleId(user);

        if (!user?.uid) return;

        const { relatedUnsub } = get();
        if (relatedUnsub) return;

        set({ loadingRelated: true });

        const familyKey = detectFamilyKey(currentGameName);

        try {
            if (!rid) {
                set({ promotionGames: [], loadingRelated: false });
                return;
            }

            const { gameIds } = await getAllowedForRole(rid);

            if (!gameIds.size) {
                set({ promotionGames: [], loadingRelated: false });
                return;
            }

            const qGames = query(collection(db, "games"), orderBy("createdAt", "desc"), limit(120));

            const unsub = onSnapshot(
                qGames,
                (snap) => {
                    const list = snap.docs
                        .map((d) => ({ id: d.id, ...d.data() }))
                        .filter((g) => !isHidden(g))
                        .filter((g) => String(g.id) !== gid)
                        .filter((g) => gameIds.has(String(g.id)))
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
    },
}));