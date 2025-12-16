import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"; 
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

export const useCollectionsStore = create(
    persist(
        (set, get) => ({
            collections: [],
            collectionItems: {},
            itemsLoading: {},
            loading: false,
            error: null,
            unsub: null,

            drawerOpen: false,
            openDrawer: () => set({ drawerOpen: true }),
            closeDrawer: () => set({ drawerOpen: false }),
            toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

            startUserCollectionsListener: (userId) => {
                if (!userId) return;

                const { unsub: existingUnsub } = get();
                if (existingUnsub) existingUnsub();

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
                        set((state) => ({
                            collections: rows.map((c) => {
                                const items = state.collectionItems[c.id];
                                const itemCount =
                                    typeof c.itemCount === "number"
                                        ? c.itemCount
                                        : items
                                            ? items.length
                                            : null;
                                return { ...c, itemCount };
                            }),
                            loading: false
                        }));
                    },
                    (err) => {
                        set({
                            error: err?.message || "Failed to load collections",
                            loading: false
                        });
                    }
                );

                set({ unsub });
            },

            stopUserCollectionsListener: () => {
                const { unsub } = get();
                if (unsub) unsub();
                set({ unsub: null });
            },

            loadCollectionItems: async (collectionId) => {
                if (!collectionId) return;

                const state = get();
                if (state.itemsLoading[collectionId]) return;

                set({
                    itemsLoading: {
                        ...state.itemsLoading,
                        [collectionId]: true
                    }
                });

                try {
                    const itemsRef = collection(db, "collections", collectionId, "items");
                    const snap = await getDocs(itemsRef);
                    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

                    set((prev) => ({
                        collectionItems: {
                            ...prev.collectionItems,
                            [collectionId]: items
                        },
                        itemsLoading: {
                            ...prev.itemsLoading,
                            [collectionId]: false
                        },
                        collections: prev.collections.map((c) =>
                            c.id === collectionId ? { ...c, itemCount: items.length } : c
                        )
                    }));
                } catch (e) {
                    set((prev) => ({
                        itemsLoading: {
                            ...prev.itemsLoading,
                            [collectionId]: false
                        }
                    }));
                }
            },

            createCollection: async (userId, name = "New Collection") => {
                if (!userId) return null;

                const now = new Date();

                const ref = await addDoc(collection(db, "collections"), {
                    userId,
                    name,
                    isCompleted: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                set((state) => ({
                    collections: [
                        {
                            id: ref.id,
                            userId,
                            name,
                            isCompleted: false,
                            createdAt: now,
                            updatedAt: now,
                            itemCount: 0
                        },
                        ...state.collections
                    ]
                }));

                return ref.id;
            },

            renameCollection: async (collectionId, name) => {
                if (!collectionId) return;

                const now = new Date();

                set((state) => ({
                    collections: state.collections.map((c) =>
                        c.id === collectionId ? { ...c, name, updatedAt: now } : c
                    )
                }));

                await updateDoc(doc(db, "collections", collectionId), {
                    name,
                    updatedAt: serverTimestamp()
                });
            },

            deleteCollection: async (collectionId) => {
                if (!collectionId) return;

                set((state) => {
                    const { [collectionId]: _, ...restItems } = state.collectionItems;
                    const { [collectionId]: __, ...restLoading } = state.itemsLoading;
                    return {
                        collections: state.collections.filter((c) => c.id !== collectionId),
                        collectionItems: restItems,
                        itemsLoading: restLoading
                    };
                });

                await deleteDoc(doc(db, "collections", collectionId));
            },

            markCollectionCompleted: async (collectionId, isCompleted = true) => {
                if (!collectionId) return;

                const now = new Date();

                set((state) => ({
                    collections: state.collections.map((c) =>
                        c.id === collectionId ? { ...c, isCompleted, updatedAt: now } : c
                    )
                }));

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

                const ref = await addDoc(itemsRef, {
                    ...filePayload,
                    addedAt: serverTimestamp()
                });

                const now = new Date();

                set((state) => {
                    const prevItems = state.collectionItems[collectionId] || [];
                    const updatedItems = [{ id: ref.id, ...filePayload, addedAt: now }, ...prevItems];
                    return {
                        collectionItems: {
                            ...state.collectionItems,
                            [collectionId]: updatedItems
                        },
                        collections: state.collections.map((c) =>
                            c.id === collectionId
                                ? { ...c, itemCount: (c.itemCount || 0) + 1 }
                                : c
                        )
                    };
                });

                await updateDoc(doc(db, "collections", collectionId), {
                    updatedAt: serverTimestamp()
                });
            },

            removeItemFromCollection: async (collectionId, itemId) => {
                if (!collectionId || !itemId) return;

                await deleteDoc(doc(db, "collections", collectionId, "items", itemId));

                set((state) => {
                    const prevItems = state.collectionItems[collectionId] || [];
                    const updatedItems = prevItems.filter((it) => it.id !== itemId);
                    return {
                        collectionItems: {
                            ...state.collectionItems,
                            [collectionId]: updatedItems
                        },
                        collections: state.collections.map((c) =>
                            c.id === collectionId
                                ? {
                                    ...c,
                                    itemCount: Math.max(
                                        typeof c.itemCount === "number"
                                            ? c.itemCount - 1
                                            : updatedItems.length,
                                        0
                                    )
                                }
                                : c
                        )
                    };
                });

                await updateDoc(doc(db, "collections", collectionId), {
                    updatedAt: serverTimestamp()
                });
            }
        }),
        {
            name: "xpg-collections",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                collections: state.collections,
                collectionItems: state.collectionItems
            })
        }
    )
);

