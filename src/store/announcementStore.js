import { create } from "zustand";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export const useAnnouncementStore = create((set, get) => ({
    items: [],
    loading: true,
    error: null,
    unsub: null,

    startAnnouncementsListener: () => {
        const { unsub } = get();
        if (unsub) {
            unsub();
            set({ unsub: null });
        }

        set({ loading: true, error: null });

        const qCol = query(collection(db, "announcements"), orderBy("createdAt", "desc"));

        const newUnsub = onSnapshot(
            qCol,
            (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                set({
                    items: list,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                console.error("Error fetching announcements:", error);
                set({
                    items: [],
                    loading: false,
                    error: error?.message || "Failed to load announcements",
                });
            }
        );

        set({ unsub: newUnsub });
    },

    stopAnnouncementsListener: () => {
        const { unsub } = get();
        if (unsub) {
            unsub();
            set({ unsub: null, items: [], loading: false, error: null });
        }
    }
}));