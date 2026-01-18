import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    X,
    Plus,
    CheckCircle2,
    Circle,
    Trash2,
    Pencil,
    Loader2,
    FileImage,
    FileText,
    File,
    Download,
    Check,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getAuth } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { useCollectionsStore } from "../store/collectionsStore";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../contexts/ToastContext";
import { getExt, isImage, isPDF, parseSizeToBytes, formatBytes } from "../utils/fileUtils";

const safeKey = (item, i) =>
    `${String(item?.id || item?.storagePath || item?.fileURL || item?.fileName || "item")}::${String(i)}`;

const safeZipName = (name) =>
    String(name || "collection")
        .replace(/[^\w.\-]+/g, "_")
        .slice(0, 50);

const safeFileName = (baseName, ext) => {
    const safeBase = String(baseName || "file").replace(/[^\w.\-]+/g, "_");
    if (!ext) return safeBase;
    const lower = safeBase.toLowerCase();
    const withDot = `.${ext.toLowerCase()}`;
    return lower.endsWith(withDot) ? safeBase : `${safeBase}${withDot}`;
};

function useFakeProgress(active, onTick) {
    const [pct, setPct] = useState(0);
    const tRef = useRef(null);

    useEffect(() => {
        if (!active) {
            setPct(0);
            if (tRef.current) clearInterval(tRef.current);
            tRef.current = null;
            return;
        }

        setPct(8);
        if (tRef.current) clearInterval(tRef.current);

        tRef.current = setInterval(() => {
            setPct((p) => {
                if (p >= 92) return p;
                const bump = p < 40 ? 6 : p < 70 ? 3 : 1;
                const next = Math.min(92, p + bump);
                onTick?.(next);
                return next;
            });
        }, 140);

        return () => {
            if (tRef.current) clearInterval(tRef.current);
            tRef.current = null;
        };
    }, [active, onTick]);

    const finish = async () => {
        setPct(100);
        onTick?.(100);
        await new Promise((r) => setTimeout(r, 250));
        setPct(0);
    };

    return { pct, finish };
}

export default function CollectionsDrawer() {
    const { t } = useTranslation();
    const {
        drawerOpen,
        closeDrawer,
        collections,
        loading,
        createCollection,
        renameCollection,
        deleteCollection,
        markCollectionCompleted,
        collectionItems,
        itemsLoading,
        loadCollectionItems,
        removeItemFromCollection,
    } = useCollectionsStore();

    const user = useAuthStore((s) => s.user);
    const { showProgressToast, updateToast, finishToast } = useToast();

    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingOriginal, setEditingOriginal] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadError, setDownloadError] = useState("");

    const createToastIdRef = useRef(null);

    const createProg = useFakeProgress(creating, (p) => {
        const id = createToastIdRef.current;
        if (id) updateToast(id, { progress: p });
    });

    const sortedCollections = useMemo(() => {
        return [...(collections || [])].sort((a, b) => {
            const an = (a.name || "").toLowerCase();
            const bn = (b.name || "").toLowerCase();
            return an.localeCompare(bn);
        });
    }, [collections]);

    useEffect(() => {
        if (!drawerOpen) return;
        sortedCollections.forEach((c) => {
            if (c.id && !collectionItems?.[c.id]) loadCollectionItems(c.id);
        });
    }, [drawerOpen, sortedCollections, collectionItems, loadCollectionItems]);

    const globalStats = useMemo(() => {
        let fileCount = 0;
        let totalBytes = 0;
        Object.values(collectionItems || {}).forEach((items) => {
            if (!items) return;
            fileCount += items.length;
            items.forEach((it) => {
                totalBytes += parseSizeToBytes(it.size);
            });
        });
        return { fileCount, totalBytes };
    }, [collectionItems]);

    const startCreate = async () => {
        if (!user?.uid || creating) return;

        setDownloadError("");
        setCreating(true);

        const toastId = showProgressToast({
            title: t("collectionsDrawer.toast.create.title"),
            description: t("collectionsDrawer.toast.create.desc"),
            initialProgress: 8,
        });
        createToastIdRef.current = toastId;

        const defaultName = t("collectionsDrawer.defaults.newCollection");

        try {
            const newId = await createCollection(user.uid, defaultName);
            await createProg.finish();

            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.created.title"),
                description: t("collectionsDrawer.toast.created.desc"),
                variant: "success",
                duration: 2600,
            });

            createToastIdRef.current = null;

            if (newId) {
                setEditingId(newId);
                setEditingName(defaultName);
                setEditingOriginal(defaultName);
            }
        } catch (e) {
            createToastIdRef.current = null;
            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.createFailed.title"),
                description: e?.message || t("collectionsDrawer.common.somethingWentWrong"),
                variant: "error",
                duration: 4500,
            });
        } finally {
            setCreating(false);
        }
    };

    const startEdit = (c) => {
        const current = c?.name || "";
        setEditingId(c.id);
        setEditingName(current);
        setEditingOriginal(current);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName("");
        setEditingOriginal("");
    };

    const saveEdit = async (id) => {
        if (!id) return;
        const next = (editingName || "").trim();
        if (!next) return;

        if (next === (editingOriginal || "").trim()) {
            cancelEdit();
            return;
        }

        const toastId = showProgressToast({
            title: t("collectionsDrawer.toast.rename.title"),
            description: t("collectionsDrawer.toast.rename.desc"),
            initialProgress: 15,
        });

        setProcessingId(id);
        try {
            updateToast(toastId, { progress: 65 });
            await renameCollection(id, next);
            updateToast(toastId, { progress: 95 });
            cancelEdit();

            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.renamed.title"),
                description: t("collectionsDrawer.toast.renamed.desc"),
                variant: "success",
                duration: 2200,
            });
        } catch (e) {
            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.renameFailed.title"),
                description: e?.message || t("collectionsDrawer.common.somethingWentWrong"),
                variant: "error",
                duration: 4500,
            });
        } finally {
            setProcessingId(null);
        }
    };

    const onBlurEdit = async (id) => {
        if (!id) return;
        if (processingId === id) return;
        if (editingId !== id) return;

        const next = (editingName || "").trim();
        if (!next) return;

        if (next === (editingOriginal || "").trim()) {
            cancelEdit();
            return;
        }

        await saveEdit(id);
    };

    const toggleCompleted = async (c) => {
        if (!c?.id) return;

        const toastId = showProgressToast({
            title: t("collectionsDrawer.toast.updateStatus.title"),
            description: t("collectionsDrawer.toast.updateStatus.desc"),
            initialProgress: 18,
        });

        setProcessingId(c.id);
        try {
            updateToast(toastId, { progress: 70 });
            await markCollectionCompleted(c.id, !c.isCompleted);
            updateToast(toastId, { progress: 95 });

            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.updated.title"),
                description: t("collectionsDrawer.toast.updated.desc"),
                variant: "success",
                duration: 2200,
            });
        } catch (e) {
            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.updateFailed.title"),
                description: e?.message || t("collectionsDrawer.common.somethingWentWrong"),
                variant: "error",
                duration: 4500,
            });
        } finally {
            setProcessingId(null);
        }
    };

    const confirmDelete = (id) => setConfirmDeleteId(id);

    const performDelete = async () => {
        if (!confirmDeleteId) return;

        const id = confirmDeleteId;
        const toastId = showProgressToast({
            title: t("collectionsDrawer.toast.delete.title"),
            description: t("collectionsDrawer.toast.delete.desc"),
            initialProgress: 12,
        });

        setProcessingId(id);
        try {
            updateToast(toastId, { progress: 60 });
            await deleteCollection(id);
            updateToast(toastId, { progress: 95 });

            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.deleted.title"),
                description: t("collectionsDrawer.toast.deleted.desc"),
                variant: "success",
                duration: 2400,
            });
        } catch (e) {
            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.deleteFailed.title"),
                description: e?.message || t("collectionsDrawer.common.somethingWentWrong"),
                variant: "error",
                duration: 4500,
            });
        } finally {
            setProcessingId(null);
            setConfirmDeleteId(null);
        }
    };

    const toggleFiles = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
        if (!collectionItems?.[id]) loadCollectionItems(id);
    };

    const buildDownloadUrl = (storagePath, filename) => {
        const base = import.meta.env.VITE_DOWNLOAD_FILE_URL;
        if (!base) throw new Error(t("collectionsDrawer.errors.missingDownloadUrl"));
        return `${base}?path=${encodeURIComponent(storagePath)}&name=${encodeURIComponent(filename || t("collectionsDrawer.defaults.download"))}`;
    };

    const storagePathFromFirebaseUrl = (fileURL) => {
        try {
            const u = new URL(fileURL);
            const m = u.pathname.match(/\/o\/(.+)$/);
            if (!m) return null;
            return decodeURIComponent(m[1]);
        } catch {
            return null;
        }
    };

    const fetchBlobFromCloudDownload = async (storagePath, filename) => {
        const url = buildDownloadUrl(storagePath, filename);
        const a = getAuth();
        const token = await a.currentUser?.getIdToken?.();
        if (!token) throw new Error(t("collectionsDrawer.errors.notAuthenticated"));

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(t("collectionsDrawer.errors.downloadFailedWithStatus", { status: res.status }));
        return await res.blob();
    };

    const handlePrepareDownload = async (collection) => {
        const items = collectionItems?.[collection.id] || [];
        if (!items.length || downloadingId) return;

        setDownloadError("");
        setDownloadingId(collection.id);

        const cName = collection.name || t("collectionsDrawer.defaults.collectionTitle");
        const toastId = showProgressToast({
            title: t("collectionsDrawer.toast.prepare.title"),
            description: t("collectionsDrawer.toast.prepare.desc", { name: cName }),
            initialProgress: 10,
        });

        try {
            const zip = new JSZip();
            const folderName = safeZipName(collection.name || t("collectionsDrawer.defaults.collection"));
            const folder = zip.folder(folderName) || zip;

            const seenNames = new Map();

            for (let i = 0; i < items.length; i += 1) {
                const item = items[i];
                const baseName = item.fileName || `file-${i + 1}`;
                const ext = getExt(baseName, item.ext).toLowerCase();
                let fileName = safeFileName(baseName, ext);

                const count = seenNames.get(fileName) || 0;
                if (count > 0) {
                    const dot = fileName.lastIndexOf(".");
                    const namePart = dot > 0 ? fileName.slice(0, dot) : fileName;
                    const extPart = dot > 0 ? fileName.slice(dot) : "";
                    fileName = `${namePart} (${count + 1})${extPart}`;
                }
                seenNames.set(fileName, count + 1);

                const storagePath = item.storagePath || (item.fileURL ? storagePathFromFirebaseUrl(item.fileURL) : null);
                if (!storagePath) continue;

                const pct = Math.round(((i + 1) / items.length) * 90);
                updateToast(toastId, { progress: Math.max(10, Math.min(95, pct)) });

                const blob = await fetchBlobFromCloudDownload(storagePath, fileName);
                folder.file(fileName, blob);
            }

            updateToast(toastId, { progress: 96 });

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);

            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.downloadReady.title"),
                description: t("collectionsDrawer.toast.downloadReady.desc"),
                variant: "success",
                duration: 2600,
            });
        } catch (e) {
            setDownloadError(e?.message || t("collectionsDrawer.errors.prepareDownloadFailed"));
            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.prepareFailed.title"),
                description: e?.message || t("collectionsDrawer.common.somethingWentWrong"),
                variant: "error",
                duration: 5000,
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const removeItem = async (collectionId, itemId) => {
        if (!collectionId || !itemId) return;

        const toastId = showProgressToast({
            title: t("collectionsDrawer.toast.removeFile.title"),
            description: t("collectionsDrawer.toast.removeFile.desc"),
            initialProgress: 18,
        });

        setProcessingId(collectionId);
        try {
            updateToast(toastId, { progress: 70 });
            await removeItemFromCollection(collectionId, itemId);
            updateToast(toastId, { progress: 95 });

            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.removed.title"),
                description: t("collectionsDrawer.toast.removed.desc"),
                variant: "success",
                duration: 2200,
            });
        } catch (e) {
            await finishToast(toastId, {
                title: t("collectionsDrawer.toast.removeFailed.title"),
                description: e?.message || t("collectionsDrawer.common.somethingWentWrong"),
                variant: "error",
                duration: 4500,
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <Transition show={drawerOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={closeDrawer}>
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>

                <div className="fixed inset-0 flex justify-end">
                    <Transition.Child
                        as={Fragment}
                        enter="transform transition duration-200 ease-out"
                        enterFrom="translate-x-full"
                        enterTo="translate-x-0"
                        leave="transform transition duration-200 ease-in"
                        leaveFrom="translate-x-0"
                        leaveTo="translate-x-full"
                    >
                        <Dialog.Panel className="relative h-full w-full max-w-md bg-[#151620] border-l border-border shadow-xl flex flex-col">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div className="min-w-0">
                                    <Dialog.Title className="text-lg font-semibold text-white">
                                        {t("collectionsDrawer.title")}
                                    </Dialog.Title>
                                    <p className="text-xs text-white/60">{t("collectionsDrawer.subtitle")}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    className="rounded-full p-1.5 text-white/70 hover:bg-white/10"
                                    aria-label={t("collectionsDrawer.actions.close")}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
                                <div className="text-xs md:text-sm text-white/70">
                                    {t("collectionsDrawer.stats.totalCollections")}{" "}
                                    <span className="font-semibold text-white">{sortedCollections.length}</span>
                                    {globalStats.fileCount > 0 && (
                                        <span className="ml-2 text-white/60">
                                            • {t("collectionsDrawer.stats.files", { count: globalStats.fileCount })} •{" "}
                                            {formatBytes(globalStats.totalBytes)}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={startCreate}
                                    disabled={creating || !user}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                                >
                                    {creating ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                    )}
                                    {t("collectionsDrawer.actions.newCollection")}
                                </button>
                            </div>

                            {!!downloadError && (
                                <div className="px-5 pt-4">
                                    <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-xs text-red-100">
                                        {downloadError}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                {loading && sortedCollections.length === 0 && (
                                    <>
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="rounded-lg border border-border bg-white/5 px-4 py-3 animate-pulse">
                                                <div className="h-4 w-1/3 rounded bg-white/25 mb-2" />
                                                <div className="h-3 w-1/4 rounded bg-white/10" />
                                            </div>
                                        ))}
                                    </>
                                )}

                                {!loading && sortedCollections.length === 0 && (
                                    <div className="text-center text-sm text-white/60 py-10">
                                        {t("collectionsDrawer.empty")}
                                    </div>
                                )}

                                {sortedCollections.map((c) => {
                                    const isEditing = editingId === c.id;
                                    const busy = processingId === c.id;
                                    const isExpanded = !!expanded[c.id];
                                    const items = collectionItems?.[c.id] || [];
                                    const itemsBusy = !!itemsLoading?.[c.id];

                                    let collectionBytes = 0;
                                    items.forEach((it) => {
                                        collectionBytes += parseSizeToBytes(it.size);
                                    });

                                    return (
                                        <div key={c.id} className="rounded-xl border border-border bg-white/5 px-4 py-4 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 space-y-1 min-w-0">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                className="w-full rounded-md bg-black/60 border border-border px-2.5 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
                                                                value={editingName}
                                                                onChange={(e) => setEditingName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") saveEdit(c.id);
                                                                    if (e.key === "Escape") cancelEdit();
                                                                }}
                                                                onBlur={() => onBlurEdit(c.id)}
                                                                autoFocus
                                                                disabled={busy}
                                                            />

                                                            <button
                                                                type="button"
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => saveEdit(c.id)}
                                                                disabled={busy || !editingName.trim()}
                                                                className="inline-flex items-center justify-center rounded-md bg-primary px-2.5 py-2 text-xs font-bold text-black disabled:opacity-50"
                                                                title={t("collectionsDrawer.actions.save")}
                                                            >
                                                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={cancelEdit}
                                                                disabled={busy}
                                                                className="inline-flex items-center justify-center rounded-md border border-white/20 px-2.5 py-2 text-xs font-bold text-white/80 hover:bg-white/5 disabled:opacity-50"
                                                                title={t("collectionsDrawer.actions.cancel")}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="text-base font-semibold text-white break-words min-w-0">
                                                                {c.name || t("collectionsDrawer.defaults.untitledCollection")}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(c)}
                                                                disabled={busy}
                                                                className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                {t("collectionsDrawer.actions.rename")}
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="mt-0.5 text-xs text-white/70 flex flex-wrap items-center gap-2">
                                                        <span>
                                                            {c.isCompleted
                                                                ? t("collectionsDrawer.status.completed")
                                                                : t("collectionsDrawer.status.inProgress")}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] text-white/80">
                                                            {t("collectionsDrawer.stats.files", { count: items.length })}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] text-white/80">
                                                            {formatBytes(collectionBytes)}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFiles(c.id)}
                                                        disabled={itemsBusy}
                                                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                                                    >
                                                        {itemsBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                                        {isExpanded
                                                            ? t("collectionsDrawer.actions.hideFileDetails")
                                                            : t("collectionsDrawer.actions.showFileDetails")}
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleCompleted(c)}
                                                    disabled={busy}
                                                    className="flex-shrink-0 inline-flex items-center justify-center rounded-full p-1.5 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                                                    aria-label={t("collectionsDrawer.actions.toggleCompleted")}
                                                >
                                                    {c.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrepareDownload(c)}
                                                    disabled={downloadingId === c.id || items.length === 0 || itemsBusy}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs md:text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {downloadingId === c.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                    {t("collectionsDrawer.actions.prepareDownload")}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(c.id)}
                                                    disabled={busy}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-500/70 px-3 py-2 text-xs md:text-sm font-semibold text-red-100 hover:bg-red-500/10 disabled:opacity-60"
                                                >
                                                    {busy && confirmDeleteId === c.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                    {t("collectionsDrawer.actions.delete")}
                                                </button>
                                            </div>

                                            {isExpanded ? (
                                                <div className="mt-2 rounded-md bg-black/40 px-3 py-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-xs text-white/70">
                                                            {t("collectionsDrawer.files.title", { count: items.length })}
                                                        </div>
                                                        <div className="text-xs text-white/70">
                                                            {t("collectionsDrawer.files.totalSize", { size: formatBytes(collectionBytes) })}
                                                        </div>
                                                    </div>

                                                    {items.length === 0 && !itemsBusy ? (
                                                        <div className="text-xs text-white/50">{t("collectionsDrawer.files.empty")}</div>
                                                    ) : null}

                                                    {!itemsBusy && items.length > 0 ? (
                                                        <ul className="max-h-44 overflow-y-auto text-xs space-y-1.5">
                                                            {items.map((item, i) => {
                                                                const ext = getExt(item.fileName, item.ext);
                                                                const Icon = isImage(ext) ? FileImage : isPDF(ext) ? FileText : File;
                                                                const thumbSrc = item.thumbURL || (isImage(ext) ? item.fileURL : null);

                                                                return (
                                                                    <li key={safeKey(item, i)} className="flex items-center gap-3">
                                                                        <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-black/40 flex items-center justify-center">
                                                                            {thumbSrc ? (
                                                                                <img
                                                                                    src={thumbSrc}
                                                                                    alt={item.fileName || t("collectionsDrawer.files.filePreviewAlt")}
                                                                                    className="w-full h-full object-cover"
                                                                                    loading="lazy"
                                                                                />
                                                                            ) : (
                                                                                <Icon className="w-4 h-4 text-white/70" />
                                                                            )}
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="truncate text-[13px]">
                                                                                {item.fileName || t("collectionsDrawer.files.untitledFile")}
                                                                            </div>
                                                                            <div className="text-[11px] text-white/45 truncate">{item.sectionTitle || ""}</div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <span className="text-[11px] text-white/50">{item.size || ext || ""}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeItem(c.id, item.id)}
                                                                                className="p-1 rounded-full text-white/70 hover:bg-red-500/20 hover:text-red-200"
                                                                                aria-label={t("collectionsDrawer.actions.removeFile")}
                                                                            >
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <div className="text-xs text-white/60">{t("collectionsDrawer.files.loading")}</div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>

                            <Transition
                                show={!!confirmDeleteId}
                                as={Fragment}
                                enter="transition-opacity duration-150"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="transition-opacity duration-150"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
                                    <div className="rounded-lg border border-red-500/60 bg-red-950/95 px-4 py-3 text-xs text-red-50 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold mb-0.5">{t("collectionsDrawer.confirm.title")}</div>
                                            <div className="text-[11px] opacity-90">{t("collectionsDrawer.confirm.subtitle")}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="rounded-md border border-red-400/70 px-2.5 py-1 text-[11px] font-semibold hover:bg-red-900/80"
                                            >
                                                {t("collectionsDrawer.actions.cancel")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={performDelete}
                                                className="rounded-md bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-400"
                                            >
                                                {t("collectionsDrawer.actions.delete")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Transition>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
