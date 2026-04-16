import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, Tab, Popover, Transition } from "@headlessui/react";
import {
    Search,
    Download,
    Eye,
    PlusSquare,
    FileText,
    FileImage,
    File,
    ZoomIn,
    ChevronLeft,
    ChevronRight,
    FolderPlus,
    Check,
    Loader2,
    X,
} from "lucide-react";
import { saveAs } from "file-saver";

import { useAuthStore } from "../store/authStore";
import { useGameDetailsStore } from "../store/gameDetailsStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useCollectionsStore } from "../store/collectionsStore";

import HeroBanner from "../components/common/HeroBanner";
import FiltersPanel from "../components/game-details/FiltersPanel";
import PreviewModal from "../components/game-details/PreviewModal";

import {
    collectExtensions,
    collectSectionNames,
    flattenSectionsToFiles,
    getExt,
    isImage,
    isPDF,
    storagePathFromFirebaseUrl,
} from "../utils/fileUtils";

import { fetchDownloadBlob } from "../utils/downloadService";
import { useTranslation } from "react-i18next";

import { cx, formatDimensions } from "../utils/ui";
import ProgressBar from "../components/common/ProgressBar";
import { useMobileViewportFix } from "../hooks/useMobileViewportFix";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useCollectionsActions } from "../hooks/useCollectionsActions";
import { useGameFiles } from "../hooks/useGameFiles";
import { useZipDownload } from "../hooks/useZipDownload";

import NotFound from "./NotFound";

const TABLE_COLS = "44px 150px minmax(240px, 1fr) 150px minmax(220px, 272px)";

const getFileName = (f) => String(f?._name || f?.name || f?.fileName || "").trim();
const getFileUrl = (f) => String(f?._url || f?.url || f?.fileURL || f?.fileUrl || "").trim();
const getStoragePath = (f) => String(f?.storagePath || f?._storagePath || "").trim();

const isValidDisplayFile = (f) => {
    const name = getFileName(f);
    const url = getFileUrl(f);
    const storagePath = getStoragePath(f);

    if (!name) return false;
    if (name.toLowerCase() === "untitled") return false;
    if (!url && !storagePath) return false;

    return true;
};

function MobileCollectionSheet({
    open,
    onClose,
    collections,
    file,
    ensureItemsLoaded,
    isInCollection,
    addToExistingCollection,
    creatingForFile,
    setCreatingForFile,
    newCollectionName,
    setNewCollectionName,
    creatingCollection,
    createStage,
    createProg,
    createAndAddCollection,
    addingMap,
    addedFlash,
}) {
    const { t } = useTranslation();
    const url = file?._url || file?.url || file?.fileURL || "";
    const isCreatingThis = creatingForFile?.id === file?.id;

    useBodyScrollLock(open);
    useMobileViewportFix(open);

    useEffect(() => {
        if (!open) return;
        collections.forEach((c) => c?.id && ensureItemsLoaded(c.id));
    }, [open, collections, ensureItemsLoaded]);

    const panelHeight = "calc(var(--vvh, var(--app-vh, 1vh)) * 100)";
    const contentMax = "min(88dvh, min(88svh, calc(var(--vvh, var(--app-vh, 1vh)) * 88)))";

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[90]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-end justify-center" style={{ height: panelHeight }}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 translate-y-8"
                        enterTo="opacity-100 translate-y-0"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-8"
                    >
                        <Dialog.Panel
                            className="flex w-full max-w-md flex-col overflow-hidden rounded-t-[24px] border border-white/10 bg-[#0f121a] shadow-2xl"
                            style={{ maxHeight: contentMax, paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                        >
                            <div
                                className="border-b border-white/10 px-4 pb-3 pt-4"
                                style={{ paddingTop: "calc(16px + env(safe-area-inset-top))" }}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <Dialog.Title className="text-base font-extrabold text-white">
                                        {t("gameDetails.collections.sheet.title")}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.10]"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="mt-1 text-xs text-white/60">{t("gameDetails.collections.sheet.subtitle")}</div>
                            </div>

                            <div
                                className="min-h-0 flex-1 overflow-y-auto px-4 py-3 overscroll-contain"
                                style={{ WebkitOverflowScrolling: "touch" }}
                            >
                                {collections.length === 0 ? (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                                        {t("gameDetails.collections.empty")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {collections.map((c) => {
                                            const busyKey = `${c.id}::${url}`;
                                            const inCol = isInCollection(c.id, file);
                                            const busy = !!addingMap[busyKey];
                                            const flash = addedFlash[busyKey];

                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => addToExistingCollection(c.id, file)}
                                                    disabled={busy}
                                                    className={cx(
                                                        "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition",
                                                        "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                                                        busy ? "opacity-60" : ""
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-white">
                                                            {c.name || t("gameDetails.collections.untitled")}
                                                        </div>
                                                        <div className="mt-0.5 truncate text-[11px] text-white/55">
                                                            {inCol
                                                                ? t("gameDetails.collections.alreadyIn")
                                                                : t("gameDetails.collections.tapToAdd")}
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {busy ? <Loader2 className="h-4 w-4 animate-spin text-white/80" /> : null}
                                                        {inCol ? (
                                                            <Check className="h-5 w-5 text-emerald-400" />
                                                        ) : (
                                                            <PlusSquare className="h-5 w-5 text-white/60" />
                                                        )}
                                                        {flash === "added" ? (
                                                            <span className="text-[10px] text-emerald-300">
                                                                {t("gameDetails.collections.added")}
                                                            </span>
                                                        ) : null}
                                                        {flash === "already" ? (
                                                            <span className="text-[10px] text-white/60">
                                                                {t("gameDetails.collections.already")}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/10 bg-[#0f121a] px-4 pt-3">
                                {!isCreatingThis ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreatingForFile(file);
                                            setNewCollectionName("");
                                        }}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-extrabold text-black"
                                    >
                                        <FolderPlus className="h-5 w-5" />
                                        {t("gameDetails.collections.createNew")}
                                    </button>
                                ) : (
                                    <div className="space-y-2 pb-1">
                                        <input
                                            autoFocus
                                            value={newCollectionName}
                                            onChange={(e) => setNewCollectionName(e.target.value)}
                                            placeholder={t("gameDetails.collections.namePlaceholder")}
                                            className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-black outline-none"
                                            disabled={creatingCollection}
                                            inputMode="text"
                                            autoCorrect="off"
                                            autoCapitalize="sentences"
                                            enterKeyHint="done"
                                            onKeyDown={(e) => e.key === "Enter" && createAndAddCollection(file)}
                                        />

                                        {creatingCollection ? (
                                            <div className="space-y-1">
                                                <ProgressBar value={createProg.pct} />
                                                <div className="flex items-center justify-between text-[11px] text-white/60">
                                                    <span className="truncate">
                                                        {createStage || t("gameDetails.collections.processing")}
                                                    </span>
                                                    <span className="shrink-0">{Math.min(99, Math.round(createProg.pct))}%</span>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => createAndAddCollection(file)}
                                                disabled={creatingCollection}
                                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-extrabold text-black disabled:opacity-60"
                                            >
                                                {creatingCollection ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                                                {t("gameDetails.collections.create")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (creatingCollection) return;
                                                    setCreatingForFile(null);
                                                    setNewCollectionName("");
                                                }}
                                                disabled={creatingCollection}
                                                className="rounded-2xl border border-white/20 py-3 font-semibold text-white disabled:opacity-60 hover:bg-white/5"
                                            >
                                                {t("gameDetails.collections.cancel")}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}

function AddToCollectionInline(props) {
    const { t } = useTranslation();
    const {
        file,
        collections,
        ensureItemsLoaded,
        isInCollection,
        addToExistingCollection,
        creatingForFile,
        setCreatingForFile,
        newCollectionName,
        setNewCollectionName,
        creatingCollection,
        createStage,
        createProg,
        createAndAddCollection,
        addingMap,
        addedFlash,
    } = props;

    return (
        <Popover className="relative w-full">
            {({ open }) => (
                <>
                    <Popover.Button
                        onClick={() => {
                            if (!open) collections.forEach((c) => c?.id && ensureItemsLoaded(c.id));
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5"
                    >
                        <PlusSquare size={14} />
                        {t("gameDetails.collections.addToCollection")}
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition duration-150 ease-out"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition duration-100 ease-in"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute right-0 z-20 mt-2 w-[270px] rounded-2xl border border-white/10 bg-[#141821] p-2 shadow-xl">
                            <div className="px-2 py-1 text-xs font-bold text-white/70">
                                {t("gameDetails.collections.addTo")}
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {collections.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-white/60">
                                        {t("gameDetails.collections.empty")}
                                    </div>
                                ) : null}

                                {collections.map((c) => {
                                    const url = file?._url || file?.url || file?.fileURL || "";
                                    const busyKey = `${c.id}::${url}`;
                                    const inCol = isInCollection(c.id, file);
                                    const busy = !!addingMap[busyKey];
                                    const flash = addedFlash[busyKey];

                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => addToExistingCollection(c.id, file)}
                                            disabled={busy}
                                            className={cx(
                                                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/5",
                                                inCol ? "text-emerald-200" : "text-white",
                                                busy ? "opacity-60" : ""
                                            )}
                                        >
                                            <span className="truncate">{c.name || t("gameDetails.collections.untitled")}</span>
                                            <span className="flex items-center gap-2">
                                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                {inCol ? (
                                                    <Check size={16} className="text-emerald-400" />
                                                ) : (
                                                    <PlusSquare size={16} className="opacity-60" />
                                                )}
                                                {flash === "added" ? (
                                                    <span className="text-[10px] text-emerald-300">
                                                        {t("gameDetails.collections.added")}
                                                    </span>
                                                ) : null}
                                                {flash === "already" ? (
                                                    <span className="text-[10px] text-white/60">
                                                        {t("gameDetails.collections.already")}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="my-2 border-t border-white/10" />

                            {creatingForFile?.id !== file?.id ? (
                                <button
                                    onClick={() => {
                                        setCreatingForFile(file);
                                        setNewCollectionName("");
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white hover:bg-white/5"
                                >
                                    <FolderPlus size={16} />
                                    {t("gameDetails.collections.createCollection")}
                                </button>
                            ) : (
                                <div className="space-y-2 p-2">
                                    <input
                                        autoFocus
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        placeholder={t("gameDetails.collections.namePlaceholder")}
                                        className="w-full rounded-xl bg-white px-3 py-2 text-sm text-black outline-none"
                                        disabled={creatingCollection}
                                        inputMode="text"
                                        autoCorrect="off"
                                        autoCapitalize="sentences"
                                        enterKeyHint="done"
                                        onKeyDown={(e) => e.key === "Enter" && createAndAddCollection(file)}
                                    />

                                    {creatingCollection ? (
                                        <div className="space-y-1">
                                            <ProgressBar value={createProg.pct} />
                                            <div className="flex items-center justify-between text-[11px] text-white/60">
                                                <span className="truncate">
                                                    {createStage || t("gameDetails.collections.processing")}
                                                </span>
                                                <span>{Math.min(99, Math.round(createProg.pct))}%</span>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => createAndAddCollection(file)}
                                            disabled={creatingCollection}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-black disabled:opacity-60"
                                        >
                                            {creatingCollection ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            {t("gameDetails.collections.create")}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (creatingCollection) return;
                                                setCreatingForFile(null);
                                                setNewCollectionName("");
                                            }}
                                            disabled={creatingCollection}
                                            className="rounded-xl border border-white/30 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                        >
                                            {t("gameDetails.collections.cancel")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}

function FilePreviewBox({ file, ext, onPreview }) {
    const showImg = isImage(ext) && (file._thumb || file._url);
    const showPdf = isPDF(ext);

    return (
        <button
            onClick={onPreview}
            className="group relative mx-auto flex h-[78px] w-full max-w-[160px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0d1017]"
            type="button"
        >
            {showImg ? (
                <img
                    src={file._thumb || file._url}
                    alt=""
                    className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.03]"
                    loading="lazy"
                />
            ) : showPdf ? (
                <FileText className="text-red-400" size={24} />
            ) : (
                <div className="flex flex-col items-center text-white/80">
                    <File size={22} />
                    <div className="mt-1 text-[10px]">{ext || "FILE"}</div>
                </div>
            )}

            {showImg ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                    <ZoomIn size={18} className="drop-shadow" />
                </div>
            ) : null}
        </button>
    );
}

export default function GameDetails() {
    const { t } = useTranslation();
    const { gameId } = useParams();
    const navigate = useNavigate();

    const user = useAuthStore((s) => s.user);
    const addDownload = useDownloadsStore((s) => s.addDownload);

    const collections = useCollectionsStore((s) => s.collections) || [];
    const collectionItems = useCollectionsStore((s) => s.collectionItems) || {};
    const itemsLoading = useCollectionsStore((s) => s.itemsLoading) || {};
    const loadCollectionItems = useCollectionsStore((s) => s.loadCollectionItems);
    const createCollection = useCollectionsStore((s) => s.createCollection);
    const addFileToCollection = useCollectionsStore((s) => s.addFileToCollection);

    const {
        game,
        sections,
        promotionGames,
        loadingGame,
        loadingSections,
        loadingRelated,
        error,
        fetchGame,
        fetchSections,
        startRelatedListener,
        stopRelatedListener,
    } = useGameDetailsStore();

    const [showLeftFilters, setShowLeftFilters] = useState(true);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [zipping, setZipping] = useState(false);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const [sheetFile, setSheetFile] = useState(null);

    useMobileViewportFix(true);

    useEffect(() => window.scrollTo(0, 0), []);

    useEffect(() => {
        if (!gameId) return;
        fetchGame(gameId);
    }, [gameId, fetchGame]);

    useEffect(() => {
        if (!gameId || !user) return;
        fetchSections(gameId, user);
    }, [gameId, user, fetchSections]);

    const relatedListenerKeyRef = useRef("");

    useEffect(() => {
        if (!user?.uid || !gameId) return;
        if (loadingGame) return;
        if (!game?.name) return;

        const nextKey = `${user.uid}::${gameId}::${game.name}`;

        if (relatedListenerKeyRef.current === nextKey) return;

        stopRelatedListener();
        relatedListenerKeyRef.current = nextKey;
        startRelatedListener(gameId, user, game.name);

        return () => {
            stopRelatedListener();
            relatedListenerKeyRef.current = "";
        };
    }, [user?.uid, user, gameId, game?.name, loadingGame, startRelatedListener, stopRelatedListener]);

    const hero = useMemo(() => game?.bannerURL || game?.imageURL || "", [game]);
    const allSectionNames = useMemo(() => collectSectionNames(sections), [sections]);
    const allExtensions = useMemo(() => collectExtensions(sections), [sections]);
    const flatFiles = useMemo(() => flattenSectionsToFiles(sections), [sections]);

    const safeFlatFiles = useMemo(() => {
        const list = Array.isArray(flatFiles) ? flatFiles : [];
        return list.filter(isValidDisplayFile);
    }, [flatFiles]);

    const files = useGameFiles({ flatFiles: safeFlatFiles });

    const {
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
    } = useCollectionsActions({
        collections,
        collectionItems,
        itemsLoading,
        loadCollectionItems,
        createCollection,
        addFileToCollection,
        userId: user?.uid,
        gameId,
        t,
    });

    const { downloadSelectedAsZip } = useZipDownload({ t });

    const openPreviewAt = useCallback((globalIndex) => {
        setPreviewIndex(globalIndex);
        setPreviewOpen(true);
    }, []);

    const openMobileAddToCollection = (file) => {
        setSheetFile(file);
        setMobileSheetOpen(true);
    };

    const handleDownload = async (file) => {
        try {
            const url = file?._url || file?.url || file?.fileURL || "";
            const name = file?._name || file?.name || file?.fileName || t("gameDetails.download.defaultName");

            const resolvedStoragePath =
                file?.storagePath || file?._storagePath || (url ? storagePathFromFirebaseUrl(url) : null) || null;

            if (user?.uid) {
                addDownload({
                    userId: user.uid,
                    gameId,
                    sectionId: file?._sectionId || null,
                    sectionTitle: file?._sectionTitle || null,
                    fileName: name,
                    fileURL: url || null,
                    ext: file?._ext || getExt(name),
                    size: file?._size || null,
                    dimensions: file?._dimensions || file?.dimensions || null,
                    thumbURL: file?._thumb || null,
                    storagePath: resolvedStoragePath,
                });
            }

            if (resolvedStoragePath) {
                const blob = await fetchDownloadBlob(resolvedStoragePath, name);
                saveAs(blob, name || "download");
                return;
            }

            if (!url) {
                alert(t("gameDetails.alerts.missingStoragePath"));
                return;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to download file");
            const blob = await res.blob();
            saveAs(blob, name || "download");
        } catch (e) {
            alert(e?.message || t("gameDetails.alerts.downloadFailed"));
        }
    };

    const mobileToolbarRef = useRef(null);
    const [mobileToolbarH, setMobileToolbarH] = useState(0);

    useEffect(() => {
        const el = mobileToolbarRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setMobileToolbarH(el.getBoundingClientRect().height || 0));
        ro.observe(el);
        setMobileToolbarH(el.getBoundingClientRect().height || 0);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!mobileSheetOpen && !previewOpen) return;
        const onFocusIn = () => setTimeout(() => window.scrollTo({ top: window.scrollY, behavior: "instant" }), 0);
        document.addEventListener("focusin", onFocusIn);
        return () => document.removeEventListener("focusin", onFocusIn);
    }, [mobileSheetOpen, previewOpen]);

    const pageBottomPad = `calc(${mobileToolbarH}px + env(safe-area-inset-bottom) + 20px)`;

    if (!loadingGame && error === "GAME_NOT_FOUND") {
        return <NotFound title="Game not found" message="This game does not exist (or was removed). Please search again." />;
    }

    if (error) {
        return <div className="mx-auto max-w-6xl px-4 pb-10 pt-24 text-center text-lg text-red-400">{error}</div>;
    }

    return (
        <div className="min-h-[calc(var(--vvh,var(--app-vh,1vh))*100)] overflow-x-hidden bg-[#0b0d13] text-white">
            <HeroBanner
                image={hero}
                overlayClassName="bg-gradient-to-b from-black/5 via-black/45 to-[#0b0d13]"
                fallbackAspect="21/9"
                heightClassName="h-[180px] xs:h-[210px] sm:h-[280px] md:h-[360px] lg:h-[420px]"
                imgClassName="object-center"
                priority
            />

            <div
                className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 md:px-6 md:py-6"
                style={{
                    paddingLeft: "calc(16px + env(safe-area-inset-left))",
                    paddingRight: "calc(16px + env(safe-area-inset-right))",
                    paddingBottom: pageBottomPad,
                }}
            >
                <div className="mb-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                    {loadingGame || !game ? (
                        <div className="space-y-3">
                            <div className="h-7 w-2/3 rounded bg-white/10" />
                            <div className="h-4 w-4/5 rounded bg-white/5" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-[22px] font-extrabold leading-tight sm:text-3xl">{game?.name}</h1>
                            {!!game?.description && (
                                <p className="mt-2 max-w-4xl text-sm leading-6 text-white/75 sm:text-[15px]">
                                    {game.description}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <Tab.Group>
                    <Tab.List className="mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {[t("gameDetails.tabs.assets"), t("gameDetails.tabs.related")].map((tt) => (
                            <Tab key={tt} as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={cx(
                                            "whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                                            selected
                                                ? "border-primary bg-primary text-black"
                                                : "border-white/15 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]"
                                        )}
                                    >
                                        {tt}
                                    </button>
                                )}
                            </Tab>
                        ))}
                    </Tab.List>

                    <Tab.Panels>
                        <Tab.Panel>
                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
                                {showLeftFilters && (
                                    <FiltersPanel
                                        allSectionNames={allSectionNames}
                                        allExtensions={allExtensions}
                                        selectedSectionNames={files.selectedSectionNames}
                                        setSelectedSectionNames={files.setSelectedSectionNames}
                                        selectedExts={files.selectedExts}
                                        setSelectedExts={files.setSelectedExts}
                                    />
                                )}

                                <div className={showLeftFilters ? "min-w-0 lg:col-span-9" : "min-w-0 lg:col-span-12"}>
                                    <div className="mb-4 rounded-[24px] border border-white/10 bg-[#111318] p-3 sm:p-4">
                                        <div className="flex min-w-0 flex-col gap-3">
                                            <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
                                                <div className="relative w-full min-w-0 xl:max-w-sm">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60" size={16} />
                                                    <input
                                                        value={files.inputValue}
                                                        onChange={(e) => files.setInputValue(e.target.value)}
                                                        placeholder={t("gameDetails.search.placeholder")}
                                                        className="w-full rounded-xl bg-white py-3 pl-10 pr-3 text-sm text-black outline-none"
                                                        inputMode="search"
                                                        enterKeyHint="search"
                                                        autoCorrect="off"
                                                        autoCapitalize="none"
                                                    />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => setShowLeftFilters((v) => !v)}
                                                        className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06] hover:text-white"
                                                    >
                                                        {showLeftFilters ? t("gameDetails.filters.hide") : t("gameDetails.filters.show")}
                                                    </button>

                                                    <select
                                                        value={files.sortBy}
                                                        onChange={(e) => files.setSortBy(e.target.value)}
                                                        className="rounded-xl border border-white/15 bg-[#171b24] px-3 py-2 text-sm text-white outline-none"
                                                    >
                                                        <option value="recent">{t("gameDetails.sort.recent")}</option>
                                                        <option value="alpha">{t("gameDetails.sort.alpha")}</option>
                                                    </select>
                                                </div>

                                                <div className="flex flex-col gap-2 sm:flex-row xl:ml-auto">
                                                    <button
                                                        type="button"
                                                        disabled={!files.selectedFiles.length || zipping}
                                                        onClick={() =>
                                                            downloadSelectedAsZip({
                                                                selectedFiles: files.selectedFiles,
                                                                gameName: game?.name,
                                                                setZipping,
                                                                onDone: files.clearSelected,
                                                                onError: (e) => alert(e?.message || t("gameDetails.alerts.zipFailed")),
                                                            })
                                                        }
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-black disabled:opacity-50"
                                                    >
                                                        {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />}
                                                        {t("gameDetails.zip.button", { count: files.selectedFiles.length || 0 })}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={!files.selectedFiles.length || zipping}
                                                        onClick={files.clearSelected}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-white/[0.06]"
                                                    >
                                                        {t("gameDetails.selection.clear")}
                                                    </button>
                                                </div>
                                            </div>

                                            {!!files.selectedFiles.length && (
                                                <div className="text-xs text-white/65">
                                                    {t("gameDetails.selection.selected", { count: files.selectedFiles.length })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111318] min-w-0">
                                        <div className="w-full min-w-0 overflow-x-hidden">
                                            <div
                                                className="hidden border-b border-white/10 bg-[#161922] px-4 py-3 text-xs font-bold text-white/80 md:grid"
                                                style={{ gridTemplateColumns: TABLE_COLS }}
                                            >
                                                <div />
                                                <div>{t("gameDetails.table.preview")}</div>
                                                <div>{t("gameDetails.table.fileName")}</div>
                                                <div>{t("gameDetails.table.details")}</div>
                                                <div className="pr-2 text-right">{t("gameDetails.table.actions")}</div>
                                            </div>

                                            {loadingSections || loadingGame ? (
                                                <div className="space-y-3 p-4">
                                                    {Array.from({ length: 6 }).map((_, i) => (
                                                        <div key={i} className="h-24 rounded-2xl bg-white/5 md:h-14" />
                                                    ))}
                                                </div>
                                            ) : null}

                                            {!(loadingSections || loadingGame) && files.pageFiles.length === 0 ? (
                                                <div className="p-6 text-sm text-white/70">{t("gameDetails.empty.noFiles")}</div>
                                            ) : null}

                                            {!(loadingSections || loadingGame)
                                                ? files.pageFiles.map((f, idx) => {
                                                    const globalIndex = (files.page - 1) * 10 + idx;
                                                    const ext = getExt(f._name, f._ext);
                                                    const showPdf = isPDF(ext);
                                                    const k = files.fileKey(f, globalIndex);
                                                    const dims = formatDimensions(f?._dimensions || f?.dimensions);

                                                    return (
                                                        <div
                                                            key={k}
                                                            className="border-b border-white/5 px-3 py-3 last:border-b-0 md:grid md:items-center md:px-4"
                                                            style={{ gridTemplateColumns: TABLE_COLS }}
                                                        >
                                                            <div className="mb-3 hidden items-center justify-center md:flex md:mb-0">
                                                                <input
                                                                    type="checkbox"
                                                                    className="accent-primary"
                                                                    checked={files.selectedKeys.has(k)}
                                                                    onChange={() => files.toggleSelected(k)}
                                                                />
                                                            </div>

                                                            <div className="mb-3 flex items-center gap-3 md:hidden">
                                                                <input
                                                                    type="checkbox"
                                                                    className="accent-primary"
                                                                    checked={files.selectedKeys.has(k)}
                                                                    onChange={() => files.toggleSelected(k)}
                                                                />
                                                                <div className="text-xs text-white/60">
                                                                    {t("gameDetails.mobile.actionsBelow")} •{" "}
                                                                    <span className="font-semibold text-white/80">
                                                                        {t("gameDetails.collections.addToCollection")}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="md:mx-auto">
                                                                <FilePreviewBox file={f} ext={ext} onPreview={() => openPreviewAt(globalIndex)} />
                                                            </div>

                                                            <div className="mt-3 min-w-0 md:mt-0 md:px-3">
                                                                <div className="flex min-w-0 items-start gap-2 text-sm font-semibold">
                                                                    {showPdf ? (
                                                                        <FileText size={16} className="mt-0.5 shrink-0 text-white/70" />
                                                                    ) : isImage(ext) ? (
                                                                        <FileImage size={16} className="mt-0.5 shrink-0 text-white/70" />
                                                                    ) : (
                                                                        <File size={16} className="mt-0.5 shrink-0 text-white/70" />
                                                                    )}

                                                                    <span className="min-w-0 break-words leading-snug text-white">
                                                                        {f._name}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-1 break-words text-xs text-white/55">
                                                                    {f._sectionTitle} • {ext || t("gameDetails.file.dash")}
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 min-w-0 text-xs text-white/70 md:mt-0 md:pr-3">
                                                                {!!f._size ? <div className="truncate">{f._size}</div> : null}
                                                                {!!dims ? <div className="truncate">{dims}</div> : null}
                                                                {!!f._date ? (
                                                                    <div className="truncate">
                                                                        {t("gameDetails.file.added", {
                                                                            date: new Date(f._date).toLocaleDateString(),
                                                                        })}
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            <div className="mt-4 flex min-w-0 flex-col gap-2 md:mt-0 md:items-end">
                                                                <div className="grid w-full max-w-[360px] grid-cols-1 gap-2 sm:grid-cols-2 md:max-w-[272px]">
                                                                    <button
                                                                        onClick={() => handleDownload(f)}
                                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-extrabold text-black hover:opacity-90"
                                                                        type="button"
                                                                    >
                                                                        <Download size={14} />
                                                                        {t("gameDetails.actions.download")}
                                                                    </button>

                                                                    <button
                                                                        onClick={() => openPreviewAt(globalIndex)}
                                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.1]"
                                                                        type="button"
                                                                    >
                                                                        <Eye size={14} />
                                                                        {t("gameDetails.actions.preview")}
                                                                    </button>
                                                                </div>

                                                                <div className="hidden w-full max-w-[272px] md:block">
                                                                    <AddToCollectionInline
                                                                        file={f}
                                                                        collections={collections}
                                                                        ensureItemsLoaded={ensureItemsLoaded}
                                                                        isInCollection={isInCollection}
                                                                        addToExistingCollection={addToExistingCollection}
                                                                        creatingForFile={creatingForFile}
                                                                        setCreatingForFile={setCreatingForFile}
                                                                        newCollectionName={newCollectionName}
                                                                        setNewCollectionName={setNewCollectionName}
                                                                        creatingCollection={creatingCollection}
                                                                        createStage={createStage}
                                                                        createProg={createProg}
                                                                        createAndAddCollection={createAndAddCollection}
                                                                        addingMap={addingMap}
                                                                        addedFlash={addedFlash}
                                                                    />
                                                                </div>

                                                                <div className="w-full md:hidden">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openMobileAddToCollection(f)}
                                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.03] px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.06]"
                                                                    >
                                                                        <PlusSquare className="h-4 w-4 text-white/80" />
                                                                        {t("gameDetails.collections.addToCollection")}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                                : null}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-sm font-bold text-primary">
                                            {t("gameDetails.pagination.pageOf", { page: files.page, total: files.totalPages })}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                disabled={files.page <= 1}
                                                onClick={() => files.setPage((p) => Math.max(1, p - 1))}
                                                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.03] px-3 py-2 text-sm text-white disabled:opacity-40 hover:bg-white/[0.06]"
                                                type="button"
                                            >
                                                <ChevronLeft size={16} />
                                                {t("gameDetails.pagination.prev")}
                                            </button>

                                            <button
                                                disabled={files.page >= files.totalPages}
                                                onClick={() => files.setPage((p) => Math.min(files.totalPages, p + 1))}
                                                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.03] px-3 py-2 text-sm text-white disabled:opacity-40 hover:bg-white/[0.06]"
                                                type="button"
                                            >
                                                {t("gameDetails.pagination.next")}
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        ref={mobileToolbarRef}
                                        className="fixed bottom-0 left-0 right-0 z-[40] border-t border-white/10 bg-black/75 backdrop-blur-md md:hidden"
                                        style={{
                                            paddingBottom: "env(safe-area-inset-bottom)",
                                            paddingLeft: "env(safe-area-inset-left)",
                                            paddingRight: "env(safe-area-inset-right)",
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                                            <div className="min-w-0 truncate text-xs text-white/70">
                                                {files.selectedFiles.length
                                                    ? t("gameDetails.selection.selected", { count: files.selectedFiles.length })
                                                    : t("gameDetails.selection.none")}
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={files.clearSelected}
                                                    disabled={!files.selectedFiles.length || zipping}
                                                    className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-white/5"
                                                >
                                                    {t("gameDetails.selection.clear")}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        downloadSelectedAsZip({
                                                            selectedFiles: files.selectedFiles,
                                                            gameName: game?.name,
                                                            setZipping,
                                                            onDone: files.clearSelected,
                                                            onError: (e) => alert(e?.message || t("gameDetails.alerts.zipFailed")),
                                                        })
                                                    }
                                                    disabled={!files.selectedFiles.length || zipping}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-black disabled:opacity-50"
                                                >
                                                    {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
                                                    {t("gameDetails.zip.button", { count: files.selectedFiles.length || 0 })}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tab.Panel>

                        <Tab.Panel>
                            <div className="mt-4">
                                {loadingRelated ? (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="h-44 rounded-[24px] border border-white/10 bg-white/5" />
                                        ))}
                                    </div>
                                ) : null}

                                {!loadingRelated && promotionGames.length === 0 ? (
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-center">
                                        <div className="text-lg font-extrabold text-white">
                                            {t("gameDetails.related.empty.title")}
                                        </div>
                                        <div className="mt-2 text-sm text-white/65">
                                            {t("gameDetails.related.empty.subtitle", {
                                                name: game?.name || t("gameDetails.related.empty.this"),
                                            })}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate("/")}
                                            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 font-extrabold text-black"
                                        >
                                            {t("gameDetails.related.empty.browseAll")}
                                        </button>
                                    </div>
                                ) : null}

                                {!loadingRelated && promotionGames.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                                        {promotionGames.map((g) => (
                                            <button
                                                key={g.id}
                                                onClick={() => {
                                                    window.scrollTo(0, 0);
                                                    navigate(`/game/${g.id}`);
                                                }}
                                                className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] text-left transition hover:bg-white/[0.06]"
                                                type="button"
                                            >
                                                <div className="aspect-[16/10] overflow-hidden bg-black/40">
                                                    <img
                                                        src={g.imageURL || "https://via.placeholder.com/300?text=No+Image"}
                                                        alt={g.name}
                                                        className="h-full w-full object-cover object-center transition group-hover:scale-[1.03]"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="p-3">
                                                    <div className="truncate text-sm font-extrabold text-white">{g.name}</div>
                                                    <div className="mt-1 text-[11px] text-white/60">
                                                        {t("gameDetails.related.viewAssets")}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>

            <MobileCollectionSheet
                open={mobileSheetOpen}
                onClose={() => {
                    setMobileSheetOpen(false);
                    setSheetFile(null);
                    setCreatingForFile(null);
                    setNewCollectionName("");
                }}
                collections={collections}
                file={sheetFile}
                ensureItemsLoaded={ensureItemsLoaded}
                isInCollection={isInCollection}
                addToExistingCollection={addToExistingCollection}
                creatingForFile={creatingForFile}
                setCreatingForFile={setCreatingForFile}
                newCollectionName={newCollectionName}
                setNewCollectionName={setNewCollectionName}
                creatingCollection={creatingCollection}
                createStage={createStage}
                createProg={createProg}
                createAndAddCollection={createAndAddCollection}
                addingMap={addingMap}
                addedFlash={addedFlash}
            />

            <PreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                files={files.filteredFiles}
                index={previewIndex}
                setIndex={setPreviewIndex}
                onDownload={handleDownload}
                collections={collections}
                ensureItemsLoaded={ensureItemsLoaded}
                isInCollection={isInCollection}
                addToExistingCollection={addToExistingCollection}
                creatingForFile={creatingForFile}
                setCreatingForFile={setCreatingForFile}
                newCollectionName={newCollectionName}
                setNewCollectionName={setNewCollectionName}
                creatingCollection={creatingCollection}
                createStage={createStage}
                createProg={createProg}
                createAndAddCollection={createAndAddCollection}
                addingMap={addingMap}
                addedFlash={addedFlash}
            />
        </div>
    );
}