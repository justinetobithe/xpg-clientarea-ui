import { create } from "zustand";
import { collection, onSnapshot, query, orderBy, limit as fbLimit } from "firebase/firestore";
import { db } from "../firebase";

const numOrBig = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 999999999;
};

export const useLiveGamesStore = create((set, get) => ({
    items: [],
    loading: false,
    error: null,
    unsub: null,
    activeLimit: null,

    startLiveGamesListener: (pageSize = 30) => {
        const prev = get().unsub;
        if (prev && get().activeLimit === pageSize) return;
        if (prev) prev();

        set({ loading: true, error: null, unsub: null, activeLimit: pageSize });

        const colRef = collection(db, "liveGames");

        const qPriority = query(colRef, orderBy("priority", "asc"), orderBy("createdAt", "desc"), fbLimit(pageSize));
        const qCreated = query(colRef, orderBy("createdAt", "desc"), fbLimit(pageSize));

        const attach = (q, clientSort) =>
            onSnapshot(
                q,
                (snap) => {
                    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

                    if (clientSort) {
                        list.sort((a, b) => {
                            const ap = numOrBig(a.priority);
                            const bp = numOrBig(b.priority);
                            if (ap !== bp) return ap - bp;

                            const at = a.createdAt?.toMillis?.() || 0;
                            const bt = b.createdAt?.toMillis?.() || 0;
                            return bt - at;
                        });
                    }

                    set({ items: list, loading: false, error: null });
                },
                (err) => {
                    if (err?.code === "failed-precondition") {
                        const u = attach(qCreated, true);
                        set({ unsub: u, error: null });
                        return;
                    }

                    set({ items: [], loading: false, error: err?.message || "Failed to load live games" });
                }
            );

        const unsub = attach(qPriority, false);
        set({ unsub });
    },

    stopLiveGamesListener: () => {
        const prev = get().unsub;
        if (prev) prev();
        set({ unsub: null, activeLimit: null, loading: false, error: null, items: [] });
    }
}));
