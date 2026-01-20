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
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getAuth } from "firebase/auth";
import { useAuthStore } from "../store/authStore";
import { useGameDetailsStore } from "../store/gameDetailsStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useCollectionsStore } from "../store/collectionsStore";
import HeroBanner from "../components/common/HeroBanner";
import FiltersPanel from "../components/game-details/FiltersPanel";
import PreviewModal from "../components/game-details/PreviewModal";
import {
    PAGE_SIZE,
    getExt,
    isImage,
    isPDF,
    flattenSectionsToFiles,
    collectExtensions,
    collectSectionNames,
} from "../utils/fileUtils";
import { useTranslation } from "react-i18next";

const TABLE_COLS = "44px 160px minmax(260px, 1fr) 160px minmax(240px, 280px)";

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function ProgressBar({ value }) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${v}%` }} />
        </div>
    );
}

function useFakeProgress(active) {
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
                if (p >= 90) return p;
                const bump = p < 35 ? 7 : p < 70 ? 3 : 1;
                return Math.min(90, p + bump);
            });
        }, 140);

        return () => {
            if (tRef.current) clearInterval(tRef.current);
            tRef.current = null;
        };
    }, [active]);

    const finishTo = async (target = 100) => {
        setPct(target);
        await new Promise((r) => setTimeout(r, 250));
    };

    return { pct, setPct, finishTo };
}

const buildDownloadUrl = (storagePath, filename) => {
    const base = import.meta.env.VITE_DOWNLOAD_FILE_URL;
    if (!base) throw new Error("Missing VITE_DOWNLOAD_FILE_URL");
    return `${base}?path=${encodeURIComponent(storagePath)}&name=${encodeURIComponent(filename || "download")}`;
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

const downloadViaIframe = async (storagePath, filename) => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken?.();
    if (!token) throw new Error("Not authenticated");

    const url = buildDownloadUrl(storagePath, filename);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);

    const blob = await res.blob();
    saveAs(blob, filename || "download");
};

const fetchBlobFromCloudDownload = async (storagePath, filename) => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken?.();
    if (!token) throw new Error("Not authenticated");

    const url = buildDownloadUrl(storagePath, filename);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    return await res.blob();
};

function useMobileViewportFix(enabled) {
    useEffect(() => {
        if (!enabled) return;

        const setVh = () => {
            const h = window.innerHeight || 0;
            if (h) document.documentElement.style.setProperty("--app-vh", `${h * 0.01}px`);
            if (window.visualViewport?.height) {
                document.documentElement.style.setProperty("--vvh", `${window.visualViewport.height * 0.01}px`);
            }
        };

        setVh();

        const vv = window.visualViewport;
        const onVV = () => setVh();
        if (vv) {
            vv.addEventListener("resize", onVV);
            vv.addEventListener("scroll", onVV);
        }

        window.addEventListener("resize", setVh);
        window.addEventListener("orientationchange", setVh);

        return () => {
            window.removeEventListener("resize", setVh);
            window.removeEventListener("orientationchange", setVh);
            if (vv) {
                vv.removeEventListener("resize", onVV);
                vv.removeEventListener("scroll", onVV);
            }
        };
    }, [enabled]);
}

function useBodyScrollLock(locked) {
    useEffect(() => {
        if (!locked) return;

        const prevOverflow = document.body.style.overflow;
        const prevTouch = document.body.style.touchAction;

        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.touchAction = prevTouch;
        };
    }, [locked]);
}

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
        collections.forEach((c) => {
            if (c?.id) ensureItemsLoaded(c.id);
        });
    }, [open, collections, ensureItemsLoaded]);

    const panelHeight = "calc(var(--vvh, var(--app-vh, 1vh)) * 100)";
    const contentMax = "min(85dvh, min(85svh, calc(var(--vvh, var(--app-vh, 1vh)) * 85)))";

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[80]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-end justify-center" style={{ height: panelHeight }}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 translate-y-6"
                        enterTo="opacity-100 translate-y-0"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-6"
                    >
                        <Dialog.Panel
                            className={cx(
                                "w-full max-w-md rounded-t-2xl border border-white/10 bg-[#0f121a]",
                                "shadow-2xl overflow-hidden flex flex-col"
                            )}
                            style={{
                                maxHeight: contentMax,
                                paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
                            }}
                        >
                            <div
                                className="px-4 pt-4 pb-3 border-b border-white/10"
                                style={{ paddingTop: "calc(16px + env(safe-area-inset-top))" }}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <Dialog.Title className="text-base font-extrabold text-white">
                                        {t("gameDetails.collections.sheet.title")}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="h-9 w-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] grid place-items-center shrink-0"
                                    >
                                        <X className="h-5 w-5 text-white/80" />
                                    </button>
                                </div>

                                <div className="mt-1 text-xs text-white/60">{t("gameDetails.collections.sheet.subtitle")}</div>
                            </div>

                            <div
                                className="flex-1 min-h-0 px-4 py-3 overflow-y-auto overscroll-contain"
                                style={{ WebkitOverflowScrolling: "touch" }}
                            >
                                {collections.length === 0 ? (
                                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
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
                                                        "w-full rounded-xl border px-4 py-3 text-left transition",
                                                        "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                                                        "flex items-center justify-between gap-3",
                                                        busy ? "opacity-60" : ""
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-white truncate">
                                                            {c.name || t("gameDetails.collections.untitled")}
                                                        </div>
                                                        <div className="text-[11px] text-white/55 mt-0.5 truncate">
                                                            {inCol ? t("gameDetails.collections.alreadyIn") : t("gameDetails.collections.tapToAdd")}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {busy ? <Loader2 className="h-4 w-4 animate-spin text-white/80" /> : null}
                                                        {inCol ? (
                                                            <Check className="h-5 w-5 text-emerald-400" />
                                                        ) : (
                                                            <PlusSquare className="h-5 w-5 text-white/60" />
                                                        )}
                                                        {flash === "added" ? (
                                                            <span className="text-[10px] text-emerald-300">{t("gameDetails.collections.added")}</span>
                                                        ) : null}
                                                        {flash === "already" ? (
                                                            <span className="text-[10px] text-white/60">{t("gameDetails.collections.already")}</span>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="px-4 pt-3 border-t border-white/10 bg-[#0f121a]">
                                {!isCreatingThis ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreatingForFile(file);
                                            setNewCollectionName("");
                                        }}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-black font-extrabold py-3"
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
                                            className="w-full px-4 py-3 text-sm rounded-xl bg-white text-black outline-none"
                                            disabled={creatingCollection}
                                            inputMode="text"
                                            autoCorrect="off"
                                            autoCapitalize="sentences"
                                            enterKeyHint="done"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") createAndAddCollection(file);
                                            }}
                                        />

                                        {creatingCollection ? (
                                            <div className="space-y-1">
                                                <ProgressBar value={createProg.pct} />
                                                <div className="text-[11px] text-white/60 flex items-center justify-between">
                                                    <span className="truncate">{createStage || t("gameDetails.collections.processing")}</span>
                                                    <span className="shrink-0">{Math.min(99, Math.round(createProg.pct))}%</span>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => createAndAddCollection(file)}
                                                disabled={creatingCollection}
                                                className="rounded-xl bg-primary text-black font-extrabold py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
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
                                                className="rounded-xl border border-white/20 text-white font-semibold py-3 disabled:opacity-60 hover:bg-white/5"
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

function AddToCollectionInline({
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
}) {
    const { t } = useTranslation();

    return (
        <Popover className="relative w-full">
            {({ open }) => (
                <>
                    <Popover.Button
                        onClick={() => {
                            if (!open) {
                                collections.forEach((c) => {
                                    if (c?.id) ensureItemsLoaded(c.id);
                                });
                            }
                        }}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/30 text-white text-xs font-semibold hover:bg-white/5 w-full"
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
                        <Popover.Panel className="absolute right-0 mt-2 w-[260px] rounded-xl border border-border bg-card shadow-xl p-2 z-20">
                            <div className="px-2 py-1 text-xs font-bold text-white/70">{t("gameDetails.collections.addTo")}</div>

                            <div className="max-h-48 overflow-y-auto">
                                {collections.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-white/60">{t("gameDetails.collections.empty")}</div>
                                )}

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
                                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5",
                                                inCol ? "text-emerald-200" : "text-white",
                                                busy ? "opacity-60" : ""
                                            )}
                                        >
                                            <span className="truncate">{c.name || t("gameDetails.collections.untitled")}</span>

                                            <span className="flex items-center gap-2">
                                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                {inCol ? <Check size={16} className="text-emerald-400" /> : <PlusSquare size={16} className="opacity-60" />}
                                                {flash === "added" ? (
                                                    <span className="text-[10px] text-emerald-300">{t("gameDetails.collections.added")}</span>
                                                ) : null}
                                                {flash === "already" ? (
                                                    <span className="text-[10px] text-white/60">{t("gameDetails.collections.already")}</span>
                                                ) : null}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="border-t border-white/10 my-2" />

                            {creatingForFile?.id !== file.id ? (
                                <button
                                    onClick={() => {
                                        setCreatingForFile(file);
                                        setNewCollectionName("");
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                                >
                                    <FolderPlus size={16} />
                                    {t("gameDetails.collections.createCollection")}
                                </button>
                            ) : (
                                <div className="p-2 space-y-2">
                                    <input
                                        autoFocus
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        placeholder={t("gameDetails.collections.namePlaceholder")}
                                        className="w-full px-3 py-2 text-sm rounded-md bg-white text-black outline-none"
                                        disabled={creatingCollection}
                                        inputMode="text"
                                        autoCorrect="off"
                                        autoCapitalize="sentences"
                                        enterKeyHint="done"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") createAndAddCollection(file);
                                        }}
                                    />

                                    {creatingCollection && (
                                        <div className="space-y-1">
                                            <ProgressBar value={createProg.pct} />
                                            <div className="text-[11px] text-white/60 flex items-center justify-between">
                                                <span className="truncate">{createStage || t("gameDetails.collections.processing")}</span>
                                                <span>{Math.min(99, Math.round(createProg.pct))}%</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => createAndAddCollection(file)}
                                            disabled={creatingCollection}
                                            className="px-3 py-2 rounded-md bg-primary text-black text-xs font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2"
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
                                            className="px-3 py-2 rounded-md border border-white/30 text-white text-xs font-semibold disabled:opacity-60"
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

    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [showLeftFilters, setShowLeftFilters] = useState(true);
    const [selectedSectionNames, setSelectedSectionNames] = useState(new Set());
    const [selectedExts, setSelectedExts] = useState(new Set());
    const [page, setPage] = useState(1);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [creatingForFile, setCreatingForFile] = useState(null);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [selectedKeys, setSelectedKeys] = useState(() => new Set());
    const [zipping, setZipping] = useState(false);

    const [creatingCollection, setCreatingCollection] = useState(false);
    const [createStage, setCreateStage] = useState("");
    const createProg = useFakeProgress(creatingCollection);

    const [addingMap, setAddingMap] = useState({});
    const [addedFlash, setAddedFlash] = useState({});
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

    useEffect(() => {
        if (!user || !gameId) return;
        const currentName = game?.name || "";
        startRelatedListener(gameId, user, currentName);
        return () => stopRelatedListener();
    }, [user, gameId, game?.name, startRelatedListener, stopRelatedListener]);

    useEffect(() => {
        const t0 = inputValue.trim();
        const id = setTimeout(() => setSearchTerm(t0), 450);
        return () => clearTimeout(id);
    }, [inputValue]);

    const hero = useMemo(() => game?.bannerURL || game?.imageURL || "", [game]);

    const allSectionNames = useMemo(() => collectSectionNames(sections), [sections]);
    const allExtensions = useMemo(() => collectExtensions(sections), [sections]);
    const flatFiles = useMemo(() => flattenSectionsToFiles(sections), [sections]);

    const filteredFiles = useMemo(() => {
        const nameFilter = searchTerm.toLowerCase();

        let arr = flatFiles.filter((r) => {
            const secOK = selectedSectionNames.size === 0 || selectedSectionNames.has(r._sectionTitle);
            const extOK = selectedExts.size === 0 || (r._ext && selectedExts.has(r._ext));
            const nameOK = !nameFilter || r._name.toLowerCase().includes(nameFilter);
            return secOK && extOK && nameOK;
        });

        if (sortBy === "alpha") {
            arr.sort((a, b) => a._name.localeCompare(b._name, undefined, { sensitivity: "base", numeric: true }));
        } else {
            arr.sort((a, b) => {
                const ad = a._date ? +a._date : 0;
                const bd = b._date ? +b._date : 0;
                return bd - ad;
            });
        }

        return arr;
    }, [flatFiles, selectedSectionNames, selectedExts, searchTerm, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE));

    const pageFiles = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredFiles.slice(start, start + PAGE_SIZE);
    }, [filteredFiles, page]);

    useEffect(() => setPage(1), [searchTerm, sortBy, selectedSectionNames, selectedExts]);

    useEffect(() => {
        setSelectedKeys(new Set());
    }, [searchTerm, sortBy, selectedSectionNames, selectedExts, page]);

    const openPreviewAt = useCallback((globalIndex) => {
        setPreviewIndex(globalIndex);
        setPreviewOpen(true);
    }, []);

    const fileKey = (f, idx) => String(f?.id || `${f?._sectionId || "sec"}::${f?._name || "file"}::${idx}`);
    const isSelected = (k) => selectedKeys.has(k);

    const toggleSelected = (k) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
        });
    };

    const clearSelected = () => setSelectedKeys(new Set());

    const selectedFiles = useMemo(() => {
        if (!selectedKeys.size) return [];
        const keysSet = selectedKeys;
        const currentList = filteredFiles;
        const arr = [];
        for (let i = 0; i < currentList.length; i += 1) {
            const f = currentList[i];
            const k = fileKey(f, i);
            if (keysSet.has(k)) arr.push({ f, i, k });
        }
        return arr;
    }, [selectedKeys, filteredFiles]);

    const fileToCollectionPayload = (f) => ({
        fileName: f._name,
        fileURL: f._url,
        thumbURL: f._thumb || null,
        ext: f._ext,
        size: f._size || null,
        gameId,
        sectionId: f._sectionId || null,
        sectionTitle: f._sectionTitle || null,
        storagePath: f.storagePath || f._storagePath || null,
    });

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

    const ensureItemsLoaded = async (collectionId) => {
        if (!collectionId) return;
        if (collectionItems[collectionId]) return;
        if (itemsLoading[collectionId]) return;
        await loadCollectionItems(collectionId);
    };

    const addToExistingCollection = async (collectionId, file) => {
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
    };

    const createAndAddCollection = async (file) => {
        if (!user?.uid || creatingCollection) return;

        setCreatingCollection(true);
        setCreateStage(t("gameDetails.collections.stages.creating"));
        try {
            createProg.setPct(10);
            const name = newCollectionName.trim() || t("gameDetails.collections.newCollectionFallback");
            const id = await createCollection(user.uid, name);

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
    };

    const openMobileAddToCollection = (file) => {
        setSheetFile(file);
        setMobileSheetOpen(true);
    };

    const handleDownload = async (file) => {
        try {
            const url = file?._url || file?.url || file?.fileURL;
            const name = file?._name || file?.name || file?.fileName || t("gameDetails.download.defaultName");

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
                    thumbURL: file?._thumb || null,
                    storagePath: file?.storagePath || file?._storagePath || null,
                });
            }

            const storagePath = file?.storagePath || file?._storagePath || (url ? storagePathFromFirebaseUrl(url) : null);
            if (!storagePath) {
                alert(t("gameDetails.alerts.missingStoragePath"));
                return;
            }

            await downloadViaIframe(storagePath, name);
        } catch (e) {
            alert(e?.message || t("gameDetails.alerts.downloadFailed"));
        }
    };

    const downloadSelectedAsZip = async () => {
        if (!selectedFiles.length || zipping) return;

        setZipping(true);
        try {
            const zip = new JSZip();
            const folderName = (game?.name || t("gameDetails.zip.assetsFallback")).replace(/[^\w.\-]+/g, "_").slice(0, 50);
            const folder = zip.folder(folderName) || zip;

            const seen = new Map();

            for (let idx = 0; idx < selectedFiles.length; idx += 1) {
                const { f } = selectedFiles[idx];
                const url = f?._url || f?.url || f?.fileURL || null;
                const baseName = f?._name || f?.name || f?.fileName || `file-${idx + 1}`;
                const ext = getExt(baseName, f?._ext).toLowerCase();

                const safeBase = String(baseName).replace(/[^\w.\-]+/g, "_");
                let finalName = ext && !safeBase.toLowerCase().endsWith(`.${ext}`) ? `${safeBase}.${ext}` : safeBase;

                const cnt = seen.get(finalName) || 0;
                if (cnt > 0) {
                    const dot = finalName.lastIndexOf(".");
                    const namePart = dot > 0 ? finalName.slice(0, dot) : finalName;
                    const extPart = dot > 0 ? finalName.slice(dot) : "";
                    finalName = `${namePart} (${cnt + 1})${extPart}`;
                }
                seen.set(finalName, cnt + 1);

                const storagePath = f?.storagePath || f?._storagePath || (url ? storagePathFromFirebaseUrl(url) : null);
                if (!storagePath) continue;

                const blob = await fetchBlobFromCloudDownload(storagePath, finalName);
                folder.file(finalName, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);
            clearSelected();
        } catch (e) {
            alert(e?.message || t("gameDetails.alerts.zipFailed"));
        } finally {
            setZipping(false);
        }
    };

    const mobileToolbarRef = useRef(null);
    const [mobileToolbarH, setMobileToolbarH] = useState(0);

    useEffect(() => {
        const el = mobileToolbarRef.current;
        if (!el) return;

        const ro = new ResizeObserver(() => {
            setMobileToolbarH(el.getBoundingClientRect().height || 0);
        });
        ro.observe(el);
        setMobileToolbarH(el.getBoundingClientRect().height || 0);

        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!mobileSheetOpen && !previewOpen) return;
        const onFocusIn = () => {
            setTimeout(() => {
                window.scrollTo({ top: window.scrollY, behavior: "instant" });
            }, 0);
        };
        document.addEventListener("focusin", onFocusIn);
        return () => document.removeEventListener("focusin", onFocusIn);
    }, [mobileSheetOpen, previewOpen]);

    const pageBottomPad = `calc(${mobileToolbarH}px + env(safe-area-inset-bottom) + 16px)`;

    if (error) {
        return <div className="max-w-6xl mx-auto pt-24 pb-10 px-4 text-center text-red-400 text-lg">{error}</div>;
    }

    return (
        <div className="min-h-[calc(var(--vvh, var(--app-vh, 1vh))*100)] bg-[#0b0d13] text-white overflow-x-hidden">
            <HeroBanner image={hero} overlayClassName="bg-gradient-to-b from-black/5 via-black/35 to-black/70" />

            <div className="w-full px-4 md:px-6 lg:max-w-7xl lg:mx-auto py-6" style={{ paddingBottom: pageBottomPad }}>
                <div className="mb-4">
                    {loadingGame || !game ? (
                        <div className="space-y-2">
                            <div className="h-7 w-2/3 bg-white/10 rounded" />
                            <div className="h-4 w-4/5 bg-white/5 rounded" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl md:text-3xl font-extrabold">{game?.name}</h1>
                            {!!game?.description && <p className="text-sm text-white/80 mt-1">{game.description}</p>}
                        </>
                    )}
                </div>

                <Tab.Group>
                    <Tab.List className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                        {[t("gameDetails.tabs.assets"), t("gameDetails.tabs.related")].map((tt) => (
                            <Tab key={tt} as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={cx(
                                            "px-4 py-2 rounded-md text-sm font-semibold border transition whitespace-nowrap",
                                            selected ? "bg-primary text-black border-primary" : "bg-transparent text-white/80 border-white/20 hover:bg-white/5"
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
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {showLeftFilters && (
                                    <FiltersPanel
                                        allSectionNames={allSectionNames}
                                        allExtensions={allExtensions}
                                        selectedSectionNames={selectedSectionNames}
                                        setSelectedSectionNames={setSelectedSectionNames}
                                        selectedExts={selectedExts}
                                        setSelectedExts={setSelectedExts}
                                    />
                                )}

                                <div className={showLeftFilters ? "lg:col-span-9 min-w-0" : "lg:col-span-12 min-w-0"}>
                                    <div className="flex flex-col gap-2 mb-3 min-w-0">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 min-w-0">
                                            <div className="relative w-full md:max-w-xs min-w-0">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60" size={16} />
                                                <input
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    placeholder={t("gameDetails.search.placeholder")}
                                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-white text-black outline-none"
                                                    inputMode="search"
                                                    enterKeyHint="search"
                                                    autoCorrect="off"
                                                    autoCapitalize="none"
                                                />
                                            </div>

                                            <button onClick={() => setShowLeftFilters((v) => !v)} className="text-sm text-white/80 hover:text-white w-fit">
                                                {showLeftFilters ? t("gameDetails.filters.hide") : t("gameDetails.filters.show")}
                                            </button>

                                            <div className="md:ml-auto flex items-center gap-2 flex-wrap">
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="bg-[#111318] border border-white/20 rounded-md px-3 py-2 text-sm outline-none"
                                                >
                                                    <option value="recent">{t("gameDetails.sort.recent")}</option>
                                                    <option value="alpha">{t("gameDetails.sort.alpha")}</option>
                                                </select>

                                                <button
                                                    type="button"
                                                    disabled={!selectedFiles.length || zipping}
                                                    onClick={downloadSelectedAsZip}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-black text-sm font-extrabold disabled:opacity-50"
                                                >
                                                    {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />}
                                                    {t("gameDetails.zip.button", { count: selectedFiles.length || 0 })}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={!selectedFiles.length || zipping}
                                                    onClick={clearSelected}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/25 text-white text-sm font-semibold disabled:opacity-50 hover:bg-white/5"
                                                >
                                                    {t("gameDetails.selection.clear")}
                                                </button>
                                            </div>
                                        </div>

                                        {!!selectedFiles.length && (
                                            <div className="text-xs text-white/70">{t("gameDetails.selection.selected", { count: selectedFiles.length })}</div>
                                        )}
                                    </div>

                                    <div className="border border-white/10 bg-[#111318] rounded-xl overflow-hidden min-w-0">
                                        <div className="w-full min-w-0 overflow-x-hidden">
                                            <div
                                                className="hidden md:grid text-xs font-bold text-white/80 bg-[#161922] px-4 py-2 border-b border-white/10"
                                                style={{ gridTemplateColumns: TABLE_COLS }}
                                            >
                                                <div />
                                                <div>{t("gameDetails.table.preview")}</div>
                                                <div>{t("gameDetails.table.fileName")}</div>
                                                <div>{t("gameDetails.table.details")}</div>
                                                <div className="text-right pr-2">{t("gameDetails.table.actions")}</div>
                                            </div>

                                            {(loadingSections || loadingGame) && (
                                                <div className="p-4 space-y-3">
                                                    {Array.from({ length: 6 }).map((_, i) => (
                                                        <div key={i} className="h-14 bg-white/5 rounded" />
                                                    ))}
                                                </div>
                                            )}

                                            {!(loadingSections || loadingGame) && pageFiles.length === 0 && (
                                                <div className="p-6 text-white/70 text-sm">{t("gameDetails.empty.noFiles")}</div>
                                            )}

                                            {!(loadingSections || loadingGame) &&
                                                pageFiles.map((f, idx) => {
                                                    const globalIndex = (page - 1) * PAGE_SIZE + idx;
                                                    const ext = getExt(f._name, f._ext);
                                                    const showImg = isImage(ext) && (f._thumb || f._url);
                                                    const showPdf = isPDF(ext);
                                                    const k = fileKey(f, globalIndex);

                                                    return (
                                                        <div
                                                            key={k}
                                                            className="md:grid flex flex-col md:items-center px-4 py-3 border-b border-white/5 min-w-0"
                                                            style={{ gridTemplateColumns: TABLE_COLS }}
                                                        >
                                                            <div className="hidden md:flex items-center justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="accent-primary"
                                                                    checked={isSelected(k)}
                                                                    onChange={() => toggleSelected(k)}
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-3 md:hidden mb-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="accent-primary"
                                                                    checked={isSelected(k)}
                                                                    onChange={() => toggleSelected(k)}
                                                                />
                                                                <div className="text-xs text-white/60">
                                                                    {t("gameDetails.mobile.actionsBelow")} •{" "}
                                                                    <span className="text-white/80 font-semibold">{t("gameDetails.collections.addToCollection")}</span>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => openPreviewAt(globalIndex)}
                                                                className="relative h-[64px] w-[140px] mx-auto flex items-center justify-center group"
                                                                type="button"
                                                            >
                                                                {showImg ? (
                                                                    <div className="w-[140px] h-[64px] flex items-center justify-center">
                                                                        <img src={f._thumb || f._url} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
                                                                    </div>
                                                                ) : showPdf ? (
                                                                    <FileText className="text-red-400" size={22} />
                                                                ) : (
                                                                    <div className="flex flex-col items-center text-white/80">
                                                                        <File size={20} />
                                                                        <div className="text-[10px] mt-1">{ext || t("gameDetails.file.fileLabel")}</div>
                                                                    </div>
                                                                )}

                                                                {showImg && (
                                                                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                                        <ZoomIn size={18} className="drop-shadow" />
                                                                    </div>
                                                                )}
                                                            </button>

                                                            <div className="min-w-0 px-0 md:px-3 mt-2 md:mt-0">
                                                                <div className="flex items-start gap-2 font-semibold text-sm min-w-0">
                                                                    {showPdf ? (
                                                                        <FileText size={16} className="text-white/70 mt-0.5 flex-shrink-0" />
                                                                    ) : isImage(ext) ? (
                                                                        <FileImage size={16} className="text-white/70 mt-0.5 flex-shrink-0" />
                                                                    ) : (
                                                                        <File size={16} className="text-white/70 mt-0.5 flex-shrink-0" />
                                                                    )}

                                                                    <span className="min-w-0 break-words whitespace-normal leading-snug line-clamp-3">{f._name}</span>
                                                                </div>

                                                                <div className="text-xs text-white/60 mt-1 break-words whitespace-normal">
                                                                    {f._sectionTitle} • {ext || t("gameDetails.file.dash")}
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-white/70 pr-0 md:pr-3 min-w-0 mt-2 md:mt-0">
                                                                {!!f._size && <div className="truncate">{f._size}</div>}
                                                                {!!f._date && (
                                                                    <div className="truncate">{t("gameDetails.file.added", { date: new Date(f._date).toLocaleDateString() })}</div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col gap-2 min-w-0 mt-3 md:mt-0 items-center md:items-end">
                                                                <div className="w-full max-w-[340px] mx-auto md:mx-0">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                                                        <button
                                                                            onClick={() => handleDownload(f)}
                                                                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-black text-xs font-extrabold hover:opacity-90"
                                                                            type="button"
                                                                        >
                                                                            <Download size={14} />
                                                                            {t("gameDetails.actions.download")}
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openPreviewAt(globalIndex)}
                                                                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/30 text-white text-xs font-semibold hover:bg-white/5"
                                                                            type="button"
                                                                        >
                                                                            <Eye size={14} />
                                                                            {t("gameDetails.actions.preview")}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="w-full max-w-[340px] mx-auto md:mx-0 hidden md:block">
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

                                                                <div className="md:hidden w-full max-w-[340px] mx-auto">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openMobileAddToCollection(f)}
                                                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white text-sm font-semibold"
                                                                    >
                                                                        <PlusSquare className="h-4 w-4 text-white/80" />
                                                                        {t("gameDetails.collections.addToCollection")}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                                        <div className="text-primary font-bold text-sm">{t("gameDetails.pagination.pageOf", { page, total: totalPages })}</div>

                                        <div className="flex gap-2">
                                            <button
                                                disabled={page <= 1}
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 text-white text-sm disabled:opacity-40 hover:bg-white/5"
                                                type="button"
                                            >
                                                <ChevronLeft size={16} />
                                                {t("gameDetails.pagination.prev")}
                                            </button>

                                            <button
                                                disabled={page >= totalPages}
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 text-white text-sm disabled:opacity-40 hover:bg-white/5"
                                                type="button"
                                            >
                                                {t("gameDetails.pagination.next")}
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        ref={mobileToolbarRef}
                                        className="md:hidden fixed left-0 right-0 bottom-0 z-[40] border-t border-white/10 bg-black/75 backdrop-blur-md"
                                        style={{
                                            paddingBottom: "env(safe-area-inset-bottom)",
                                            paddingLeft: "env(safe-area-inset-left)",
                                            paddingRight: "env(safe-area-inset-right)",
                                        }}
                                    >
                                        <div className="px-4 py-3 flex items-center justify-between gap-3">
                                            <div className="text-xs text-white/70 min-w-0 truncate">
                                                {selectedFiles.length
                                                    ? t("gameDetails.selection.selected", { count: selectedFiles.length })
                                                    : t("gameDetails.selection.none")}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={clearSelected}
                                                    disabled={!selectedFiles.length || zipping}
                                                    className="px-3 py-2 rounded-lg border border-white/20 text-white text-xs font-semibold disabled:opacity-50 hover:bg-white/5"
                                                >
                                                    {t("gameDetails.selection.clear")}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={downloadSelectedAsZip}
                                                    disabled={!selectedFiles.length || zipping}
                                                    className="px-3 py-2 rounded-lg bg-primary text-black text-xs font-extrabold disabled:opacity-50 inline-flex items-center gap-2"
                                                >
                                                    {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
                                                    {t("gameDetails.zip.button", { count: selectedFiles.length || 0 })}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tab.Panel>

                        <Tab.Panel>
                            <div className="mt-4">
                                {loadingRelated && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="h-44 bg-white/5 rounded-2xl border border-white/10" />
                                        ))}
                                    </div>
                                )}

                                {!loadingRelated && promotionGames.length === 0 && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                                        <div className="text-lg font-extrabold text-white">{t("gameDetails.related.empty.title")}</div>
                                        <div className="text-sm text-white/65 mt-2">
                                            {t("gameDetails.related.empty.subtitle", { name: game?.name || t("gameDetails.related.empty.this") })}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate("/")}
                                            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-black font-extrabold"
                                        >
                                            {t("gameDetails.related.empty.browseAll")}
                                        </button>
                                    </div>
                                )}

                                {!loadingRelated && promotionGames.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {promotionGames.map((g) => (
                                            <button
                                                key={g.id}
                                                onClick={() => {
                                                    window.scrollTo(0, 0);
                                                    navigate(`/game/${g.id}`);
                                                }}
                                                className="group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                                                type="button"
                                            >
                                                <div className="aspect-[16/9] bg-black/40 overflow-hidden">
                                                    <img
                                                        src={g.imageURL || "https://via.placeholder.com/300?text=No+Image"}
                                                        alt={g.name}
                                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="p-3 text-sm font-extrabold text-left text-white truncate">{g.name}</div>
                                                <div className="px-3 pb-3 text-[11px] text-white/60 text-left">{t("gameDetails.related.viewAssets")}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                files={filteredFiles}
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
