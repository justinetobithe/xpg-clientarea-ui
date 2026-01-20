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
    getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

const OPTIMISTIC_TTL_MS = 5 * 60 * 1000;

const tsToMillis = (v) => {
    if (!v) return 0;
    if (typeof v?.toMillis === "function") return v.toMillis();
    if (typeof v?.toDate === "function") return +v.toDate();
    if (v instanceof Date) return +v;
    const n = +v;
    return Number.isFinite(n) ? n : 0;
};

const normalizeCollection = (c, fallback = {}) => {
    const createdAt = c?.createdAt ?? fallback?.createdAt ?? null;
    const updatedAt = c?.updatedAt ?? fallback?.updatedAt ?? null;
    return { ...fallback, ...c, createdAt, updatedAt };
};

export const useCollectionsStore = create(
    persist(
        (set, get) => ({
            hasHydrated: false,
            setHasHydrated: (v) => set({ hasHydrated: !!v }),

            collections: [],
            collectionItems: {},
            itemsLoading: {},
            loading: false,
            error: null,

            drawerOpen: false,
            openDrawer: () => set({ drawerOpen: true }),
            closeDrawer: () => set({ drawerOpen: false }),
            toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

            unsub: null,
            activeUserId: null,

            startUserCollectionsListener: (userId) => {
                if (!userId) return;

                const { unsub, activeUserId } = get();
                if (unsub && activeUserId === userId) return;

                if (unsub) unsub();

                set({ loading: true, error: null, activeUserId: userId });

                const qCol = query(
                    collection(db, "collections"),
                    where("userId", "==", userId),
                    orderBy("createdAt", "desc")
                );

                const nextUnsub = onSnapshot(
                    qCol,
                    (snap) => {
                        const now = Date.now();
                        const serverRows = snap.docs.map((d) => ({
                            id: d.id,
                            ...d.data(),
                            __optimistic: false,
                            __optimisticAt: null,
                        }));

                        const serverIds = new Set(serverRows.map((c) => c.id));

                        set((state) => {
                            const keptOptimistic = (state.collections || []).filter((c) => {
                                if (!c?.__optimistic) return false;
                                if (serverIds.has(c.id)) return false;
                                const t = c.__optimisticAt ? +c.__optimisticAt : 0;
                                return t > 0 && now - t <= OPTIMISTIC_TTL_MS;
                            });

                            const merged = [];
                            for (const row of serverRows) {
                                const prev = (state.collections || []).find((x) => x.id === row.id) || {};
                                merged.push(normalizeCollection(row, prev));
                            }
                            for (const o of keptOptimistic) merged.push(o);

                            merged.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));

                            const withItemCount = merged.map((c) => {
                                const items = state.collectionItems?.[c.id];
                                const itemCount = typeof c.itemCount === "number" ? c.itemCount : items ? items.length : 0;
                                return { ...c, itemCount };
                            });

                            return { collections: withItemCount, loading: false, error: null };
                        });
                    },
                    async (err) => {
                        const msg = err?.message || "Failed to load collections";

                        set({ error: msg, loading: false });

                        const looksLikeIndex =
                            msg.includes("The query requires an index") ||
                            msg.includes("FAILED_PRECONDITION") ||
                            msg.includes("requires an index");

                        if (!looksLikeIndex) return;

                        try {
                            const fallbackQ = query(collection(db, "collections"), where("userId", "==", userId));
                            const snap = await getDocs(fallbackQ);
                            const rows = snap.docs
                                .map((d) => ({ id: d.id, ...d.data(), __optimistic: false, __optimisticAt: null }))
                                .sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));

                            set((state) => {
                                const withItemCount = rows.map((c) => {
                                    const items = state.collectionItems?.[c.id];
                                    const itemCount = typeof c.itemCount === "number" ? c.itemCount : items ? items.length : 0;
                                    return { ...c, itemCount };
                                });
                                return { collections: withItemCount, loading: false };
                            });
                        } catch { }
                    }
                );

                set({ unsub: nextUnsub });
            },

            stopUserCollectionsListener: () => {
                const { unsub } = get();
                if (unsub) unsub();
                set({ unsub: null, activeUserId: null, loading: false });
            },

            clearCollectionsState: () =>
                set({
                    collections: [],
                    collectionItems: {},
                    itemsLoading: {},
                    loading: false,
                    error: null,
                }),

            loadCollectionItems: async (collectionId) => {
                if (!collectionId) return;

                const state = get();
                if (state.itemsLoading?.[collectionId]) return;

                set({
                    itemsLoading: {
                        ...(state.itemsLoading || {}),
                        [collectionId]: true,
                    },
                });

                try {
                    const itemsRef = collection(db, "collections", collectionId, "items");
                    const snap = await getDocs(itemsRef);
                    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

                    set((prev) => ({
                        collectionItems: {
                            ...(prev.collectionItems || {}),
                            [collectionId]: items,
                        },
                        itemsLoading: {
                            ...(prev.itemsLoading || {}),
                            [collectionId]: false,
                        },
                        collections: (prev.collections || []).map((c) => (c.id === collectionId ? { ...c, itemCount: items.length } : c)),
                    }));
                } catch {
                    set((prev) => ({
                        itemsLoading: {
                            ...(prev.itemsLoading || {}),
                            [collectionId]: false,
                        },
                    }));
                }
            },

            createCollection: async (userId, name = "New Collection") => {
                if (!userId) return null;

                const now = new Date();
                const optimisticId = `optimistic-${now.getTime()}-${Math.random().toString(16).slice(2)}`;

                set((state) => ({
                    collections: [
                        {
                            id: optimisticId,
                            userId,
                            name,
                            isCompleted: false,
                            createdAt: now,
                            updatedAt: now,
                            itemCount: 0,
                            __optimistic: true,
                            __optimisticAt: Date.now(),
                        },
                        ...(state.collections || []),
                    ],
                }));

                try {
                    const ref = await addDoc(collection(db, "collections"), {
                        userId,
                        name,
                        isCompleted: false,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });

                    set((state) => ({
                        collections: (state.collections || []).map((c) => (c.id === optimisticId ? { ...c, id: ref.id } : c)),
                    }));

                    return ref.id;
                } catch (e) {
                    set((state) => ({
                        collections: (state.collections || []).filter((c) => c.id !== optimisticId),
                        error: e?.message || "Create collection failed",
                    }));
                    return null;
                }
            },

            renameCollection: async (collectionId, name) => {
                if (!collectionId) return;

                const now = new Date();

                set((state) => ({
                    collections: (state.collections || []).map((c) => (c.id === collectionId ? { ...c, name, updatedAt: now } : c)),
                }));

                try {
                    await updateDoc(doc(db, "collections", collectionId), { name, updatedAt: serverTimestamp() });
                } catch (e) {
                    set({ error: e?.message || "Rename failed" });
                }
            },

            deleteCollection: async (collectionId) => {
                if (!collectionId) return;

                set((state) => {
                    const { [collectionId]: _, ...restItems } = state.collectionItems || {};
                    const { [collectionId]: __, ...restLoading } = state.itemsLoading || {};
                    return {
                        collections: (state.collections || []).filter((c) => c.id !== collectionId),
                        collectionItems: restItems,
                        itemsLoading: restLoading,
                    };
                });

                try {
                    if (!String(collectionId).startsWith("optimistic-")) {
                        await deleteDoc(doc(db, "collections", collectionId));
                    }
                } catch (e) {
                    set({ error: e?.message || "Delete failed" });
                }
            },

            markCollectionCompleted: async (collectionId, isCompleted = true) => {
                if (!collectionId) return;

                const now = new Date();

                set((state) => ({
                    collections: (state.collections || []).map((c) => (c.id === collectionId ? { ...c, isCompleted, updatedAt: now } : c)),
                }));

                try {
                    await updateDoc(doc(db, "collections", collectionId), { isCompleted, updatedAt: serverTimestamp() });
                } catch (e) {
                    set({ error: e?.message || "Update failed" });
                }
            },

            addFileToCollection: async (collectionId, filePayload) => {
                if (!collectionId || !filePayload?.fileURL) return;

                const itemsRef = collection(db, "collections", collectionId, "items");

                try {
                    const existing = await getDocs(query(itemsRef, where("fileURL", "==", filePayload.fileURL)));
                    if (!existing.empty) return;

                    const ref = await addDoc(itemsRef, { ...filePayload, addedAt: serverTimestamp() });
                    const now = new Date();

                    set((state) => {
                        const prevItems = state.collectionItems?.[collectionId] || [];
                        const updatedItems = [{ id: ref.id, ...filePayload, addedAt: now }, ...prevItems];

                        return {
                            collectionItems: { ...(state.collectionItems || {}), [collectionId]: updatedItems },
                            collections: (state.collections || []).map((c) => (c.id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1 } : c)),
                        };
                    });

                    await updateDoc(doc(db, "collections", collectionId), { updatedAt: serverTimestamp() });
                } catch (e) {
                    set({ error: e?.message || "Add file failed" });
                }
            },

            removeItemFromCollection: async (collectionId, itemId) => {
                if (!collectionId || !itemId) return;

                try {
                    await deleteDoc(doc(db, "collections", collectionId, "items", itemId));

                    set((state) => {
                        const prevItems = state.collectionItems?.[collectionId] || [];
                        const updatedItems = prevItems.filter((it) => it.id !== itemId);

                        return {
                            collectionItems: { ...(state.collectionItems || {}), [collectionId]: updatedItems },
                            collections: (state.collections || []).map((c) =>
                                c.id === collectionId
                                    ? { ...c, itemCount: Math.max(typeof c.itemCount === "number" ? c.itemCount - 1 : updatedItems.length, 0) }
                                    : c
                            ),
                        };
                    });

                    await updateDoc(doc(db, "collections", collectionId), { updatedAt: serverTimestamp() });
                } catch (e) {
                    set({ error: e?.message || "Remove failed" });
                }
            },
        }),
        {
            name: "xpg-collections",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                collections: state.collections,
                collectionItems: state.collectionItems,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated?.(true);
            },
        }
    )
);
