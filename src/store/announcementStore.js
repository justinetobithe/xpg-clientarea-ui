import { create } from "zustand";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export const useAnnouncementStore = create((set, get) => ({
    items: [],
    loading: false,
    error: null,
    unsub: null,

    startAnnouncementsListener: (pageSize = 5) => {
        const prev = get().unsub;
        if (prev) prev();

        set({ loading: true, error: null });

        const qCol = query(
            collection(db, "announcements"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            qCol,
            (snap) => {
                const list = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data()
                }));
                set({
                    items: pageSize ? list.slice(0, pageSize) : list,
                    loading: false,
                    error: null
                });
            },
            (err) => {
                set({
                    items: [],
                    loading: false,
                    error: err?.message || "Failed to load announcements"
                });
            }
        );

        set({ unsub });
    },

    stopAnnouncementsListener: () => {
        const prev = get().unsub;
        if (prev) prev();
        set({ unsub: null });
    }
}));
