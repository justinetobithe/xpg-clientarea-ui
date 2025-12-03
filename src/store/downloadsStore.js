import { create } from "zustand";
import {
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

export const useDownloadsStore = create((set, get) => ({
    downloads: [],
    loading: false,
    error: null,
    unsub: null,

    addDownload: async (payload) => {
        try {
            await addDoc(collection(db, "downloads"), {
                ...payload,
                downloadedAt: serverTimestamp()
            });
        } catch (e) {
            set({ error: e?.message || "Failed to store download" });
        }
    },

    startUserDownloadsListener: (userId, pageSize = 50) => {
        if (!userId) return;
        get().stopUserDownloadsListener();

        set({ loading: true, error: null });

        const q = query(
            collection(db, "downloads"),
            where("userId", "==", userId),
            orderBy("downloadedAt", "desc"),
            limit(pageSize)
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const rows = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data()
                }));
                set({ downloads: rows, loading: false });
            },
            (err) => {
                set({
                    error: err?.message || "Failed to load downloads",
                    loading: false
                });
            }
        );

        set({ unsub });
    },

    stopUserDownloadsListener: () => {
        const { unsub } = get();
        if (unsub) unsub();
        set({ unsub: null });
    }
}));
