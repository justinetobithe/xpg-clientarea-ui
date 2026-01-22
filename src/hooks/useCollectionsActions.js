import { useCallback, useMemo, useState } from "react";
import { useFakeProgress } from "./useFakeProgress";

export function useCollectionsActions({
    collections = [],
    collectionItems = {},
    itemsLoading = {},
    loadCollectionItems,
    createCollection,
    addFileToCollection,
    userId,
    gameId,
    t,
}) {
    const [creatingForFile, setCreatingForFile] = useState(null);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [creatingCollection, setCreatingCollection] = useState(false);
    const [createStage, setCreateStage] = useState("");
    const createProg = useFakeProgress(creatingCollection);

    const [addingMap, setAddingMap] = useState({});
    const [addedFlash, setAddedFlash] = useState({});

    const fileToCollectionPayload = useCallback(
        (f) => ({
            fileName: f._name,
            fileURL: f._url,
            thumbURL: f._thumb || null,
            ext: f._ext,
            size: f._size || null,
            dimensions: f._dimensions || f.dimensions || null,
            gameId,
            sectionId: f._sectionId || null,
            sectionTitle: f._sectionTitle || null,
            storagePath: f.storagePath || f._storagePath || null,
        }),
        [gameId]
    );

    const membershipMap = useMemo(() => {
        const map = new Map();
        Object.entries(collectionItems || {}).forEach(([collectionId, items]) => {
            (items || []).forEach((it) => {
                const key = it?.fileURL;
                if (!key) return;
                if (!map.has(key)) map.set(key, new Set());
                map.get(key).add(collectionId);
            });
        });
        return map;
    }, [collectionItems]);

    const isInCollection = useCallback(
        (collectionId, file) => {
            const url = file?._url || file?.url || file?.fileURL || null;
            if (!url) return false;
            const set = membershipMap.get(url);
            return !!set && set.has(collectionId);
        },
        [membershipMap]
    );

    const ensureItemsLoaded = useCallback(
        async (collectionId) => {
            if (!collectionId) return;
            if (collectionItems[collectionId]) return;
            if (itemsLoading[collectionId]) return;
            await loadCollectionItems(collectionId);
        },
        [collectionItems, itemsLoading, loadCollectionItems]
    );

    const addToExistingCollection = useCallback(
        async (collectionId, file) => {
            if (!collectionId) return;
            const url = file?._url || file?.url || file?.fileURL || null;
            if (!url) return;

            const busyKey = `${collectionId}::${url}`;
            if (addingMap[busyKey]) return;

            await ensureItemsLoaded(collectionId);

            if (isInCollection(collectionId, file)) {
                setAddedFlash((p) => ({ ...p, [busyKey]: "already" }));
                setTimeout(() => {
                    setAddedFlash((p) => {
                        const n = { ...p };
                        delete n[busyKey];
                        return n;
                    });
                }, 700);
                return;
            }

            setAddingMap((p) => ({ ...p, [busyKey]: true }));
            try {
                await addFileToCollection(collectionId, fileToCollectionPayload(file));
                setAddedFlash((p) => ({ ...p, [busyKey]: "added" }));
                setTimeout(() => {
                    setAddedFlash((p) => {
                        const n = { ...p };
                        delete n[busyKey];
                        return n;
                    });
                }, 900);
            } finally {
                setAddingMap((p) => {
                    const n = { ...p };
                    delete n[busyKey];
                    return n;
                });
            }
        },
        [addFileToCollection, addingMap, ensureItemsLoaded, fileToCollectionPayload, isInCollection]
    );

    const createAndAddCollection = useCallback(
        async (file) => {
            if (!userId || creatingCollection) return;

            setCreatingCollection(true);
            setCreateStage(t("gameDetails.collections.stages.creating"));
            try {
                createProg.setPct(10);

                const name = newCollectionName.trim() || t("gameDetails.collections.newCollectionFallback");
                const id = await createCollection(userId, name);

                if (!id) {
                    await createProg.finishTo(100);
                    return;
                }

                setCreateStage(t("gameDetails.collections.stages.addingFile"));
                createProg.setPct(65);
                await addFileToCollection(id, fileToCollectionPayload(file));

                setCreateStage(t("gameDetails.collections.stages.done"));
                await createProg.finishTo(100);

                setCreatingForFile(null);
                setNewCollectionName("");
            } catch (e) {
                alert(e?.message || t("gameDetails.alerts.createCollectionFailed"));
            } finally {
                await new Promise((r) => setTimeout(r, 150));
                setCreateStage("");
                setCreatingCollection(false);
                createProg.setPct(0);
            }
        },
        [
            userId,
            creatingCollection,
            t,
            createProg,
            newCollectionName,
            createCollection,
            addFileToCollection,
            fileToCollectionPayload,
        ]
    );

    return {
        creatingForFile,
        setCreatingForFile,
        newCollectionName,
        setNewCollectionName,
        creatingCollection,
        createStage,
        createProg,
        addingMap,
        addedFlash,

        ensureItemsLoaded,
        isInCollection,
        addToExistingCollection,
        createAndAddCollection,
    };
}
