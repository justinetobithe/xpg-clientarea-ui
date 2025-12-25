import { create } from "zustand";
import { collection, onSnapshot, query, orderBy, limit as fbLimit } from "firebase/firestore";
import { db } from "../firebase";

export const useAnnouncementStore = create((set, get) => ({
    items: [],
    loading: false,
    error: null,
    unsub: null,
    activeLimit: null,

    startAnnouncementsListener: (pageSize = 5) => {
        const prev = get().unsub;
        if (prev && get().activeLimit === pageSize) return;
        if (prev) prev();

        set({ loading: true, error: null, unsub: null, activeLimit: pageSize });

        const base = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const qCol = pageSize ? query(base, fbLimit(pageSize)) : base;

        const unsub = onSnapshot(
            qCol,
            (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                set({ items: list, loading: false, error: null });
            },
            (err) => {
                set({ items: [], loading: false, error: err?.message || "Failed to load announcements" });
            }
        );

        set({ unsub });
    },

    stopAnnouncementsListener: () => {
        const prev = get().unsub;
        if (prev) prev();
        set({ unsub: null, activeLimit: null });
    }
}));
