import { create } from "zustand";
import {
    collection,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDocs
} from "firebase/firestore";
import { db } from "../firebase";

export const useCollectionsStore = create((set, get) => ({
    collections: [],
    loading: false,
    error: null,
    unsub: null,

    drawerOpen: false,
    openDrawer: () => set({ drawerOpen: true }),
    closeDrawer: () => set({ drawerOpen: false }),
    toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

    startUserCollectionsListener: (userId) => {
        if (!userId) return;
        get().stopUserCollectionsListener();
        set({ loading: true, error: null });

        const qCol = query(
            collection(db, "collections"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            qCol,
            (snap) => {
                const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                set({ collections: rows, loading: false });
            },
            (err) =>
                set({
                    error: err?.message || "Failed to load collections",
                    loading: false
                })
        );

        set({ unsub });
    },

    stopUserCollectionsListener: () => {
        const { unsub } = get();
        if (unsub) unsub();
        set({ unsub: null });
    },

    createCollection: async (userId, name = "New Collection") => {
        if (!userId) return null;
        const ref = await addDoc(collection(db, "collections"), {
            userId,
            name,
            isCompleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return ref.id;
    },

    renameCollection: async (collectionId, name) => {
        if (!collectionId) return;
        await updateDoc(doc(db, "collections", collectionId), {
            name,
            updatedAt: serverTimestamp()
        });
    },

    deleteCollection: async (collectionId) => {
        if (!collectionId) return;
        await deleteDoc(doc(db, "collections", collectionId));
    },

    markCollectionCompleted: async (collectionId, isCompleted = true) => {
        if (!collectionId) return;
        await updateDoc(doc(db, "collections", collectionId), {
            isCompleted,
            updatedAt: serverTimestamp()
        });
    },

    addFileToCollection: async (collectionId, filePayload) => {
        if (!collectionId || !filePayload?.fileURL) return;

        const itemsRef = collection(db, "collections", collectionId, "items");
        const existing = await getDocs(
            query(itemsRef, where("fileURL", "==", filePayload.fileURL))
        );
        if (!existing.empty) return;

        await addDoc(itemsRef, {
            ...filePayload,
            addedAt: serverTimestamp()
        });

        await updateDoc(doc(db, "collections", collectionId), {
            updatedAt: serverTimestamp()
        });
    }
}));
