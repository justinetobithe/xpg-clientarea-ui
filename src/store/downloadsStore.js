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
            set({ error: null });
            await addDoc(collection(db, "downloads"), {
                ...payload,
                downloadedAt: serverTimestamp()
            });
        } catch (e) {
            set({ error: e?.message || "Failed to store download" });
        }
    },

    startUserDownloadsListener: (userId, pageSize = 5) => {
        if (!userId) return;

        get().stopUserDownloadsListener();
        set({ loading: true, error: null });

        const orderedQuery = query(
            collection(db, "downloads"),
            where("userId", "==", userId),
            orderBy("downloadedAt", "desc"),
            limit(pageSize)
        );

        const simpleQuery = query(
            collection(db, "downloads"),
            where("userId", "==", userId),
            limit(pageSize)
        );

        const attachListener = (q, sortClient = false) =>
            onSnapshot(
                q,
                (snap) => {
                    let rows = snap.docs.map((d) => ({
                        id: d.id,
                        ...d.data()
                    }));

                    if (sortClient) {
                        rows.sort((a, b) => {
                            const ad = a.downloadedAt?.toMillis?.() || 0;
                            const bd = b.downloadedAt?.toMillis?.() || 0;
                            return bd - ad;
                        });
                    }

                    set({ downloads: rows, loading: false });
                },
                (err) => {
                    if (err?.code === "failed-precondition") {
                        const unsubFallback = attachListener(simpleQuery, true);
                        set({ unsub: unsubFallback, error: null });
                        return;
                    }

                    set({
                        error: err?.message || "Failed to load downloads",
                        loading: false
                    });
                }
            );

        const unsub = attachListener(orderedQuery);
        set({ unsub });
    },

    stopUserDownloadsListener: () => {
        const { unsub } = get();
        if (unsub) unsub();
        set({ unsub: null });
    }
}));
