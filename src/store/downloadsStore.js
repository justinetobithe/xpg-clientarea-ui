import { create } from "zustand";
import {
    doc,
    setDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const hashString = (str = "") => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
    return (h >>> 0).toString(36);
};

const makeDownloadDocId = (userId, fileKey) => `${userId}_${hashString(fileKey)}`;

export const useDownloadsStore = create((set, get) => ({
    downloads: [],
    loading: false,
    error: null,
    unsub: null,

    upsertDownload: async (payload) => {
        try {
            set({ error: null });

            const userId = payload?.userId;
            const fileKey = payload?.fileKey || payload?.storagePath || payload?.fileURL || payload?.fileName || "";
            if (!userId || !fileKey) throw new Error("Missing userId or fileKey");

            const id = makeDownloadDocId(userId, fileKey);

            await setDoc(
                doc(db, "downloads", id),
                {
                    ...payload,
                    fileKey,
                    downloadedAt: serverTimestamp()
                },
                { merge: true }
            );
        } catch (e) {
            set({ error: e?.message || "Failed to store download" });
        }
    },

    addDownload: async (payload) => {
        return await get().upsertDownload(payload);
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
                    let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
                    set({ error: err?.message || "Failed to load downloads", loading: false });
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
