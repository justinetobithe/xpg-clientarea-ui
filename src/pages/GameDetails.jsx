import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tab, Popover, Transition } from "@headlessui/react";
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
    Check
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useGameDetailsStore } from "../store/gameDetailsStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useCollectionsStore } from "../store/collectionsStore";
import HeroBanner from "../components/common/HeroBanner";
import FiltersPanel from "../components/game-details/FiltersPanel";
import PreviewModal from "../components/game-details/PreviewModal";
import {
    PAGE_SIZE,
    COLS,
    getExt,
    isImage,
    isPDF,
    flattenSectionsToFiles,
    collectExtensions,
    collectSectionNames
} from "../utils/fileUtils";

export default function GameDetails() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const addDownload = useDownloadsStore((s) => s.addDownload);

    const collections = useCollectionsStore((s) => s.collections) || [];
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
        stopRelatedListener
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
        if (!user) return;
        startRelatedListener(gameId, user);
        return () => stopRelatedListener();
    }, [user, gameId, startRelatedListener, stopRelatedListener]);

    useEffect(() => {
        const t = inputValue.trim();
        const id = setTimeout(() => setSearchTerm(t), 450);
        return () => clearTimeout(id);
    }, [inputValue]);

    const hero = useMemo(
        () => game?.bannerURL || game?.imageURL || "",
        [game]
    );
    const allSectionNames = useMemo(
        () => collectSectionNames(sections),
        [sections]
    );
    const allExtensions = useMemo(
        () => collectExtensions(sections),
        [sections]
    );
    const flatFiles = useMemo(
        () => flattenSectionsToFiles(sections),
        [sections]
    );

    const filteredFiles = useMemo(() => {
        const nameFilter = searchTerm.toLowerCase();

        let arr = flatFiles.filter((r) => {
            const secOK =
                selectedSectionNames.size === 0 ||
                selectedSectionNames.has(r._sectionTitle);
            const extOK =
                selectedExts.size === 0 || (r._ext && selectedExts.has(r._ext));
            const nameOK = !nameFilter || r._name.toLowerCase().includes(nameFilter);
            return secOK && extOK && nameOK;
        });

        if (sortBy === "alpha") {
            arr.sort((a, b) =>
                a._name.localeCompare(b._name, undefined, {
                    sensitivity: "base",
                    numeric: true
                })
            );
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

    useEffect(
        () => setPage(1),
        [searchTerm, sortBy, selectedSectionNames, selectedExts]
    );

    const openPreviewAt = useCallback((globalIndex) => {
        setPreviewIndex(globalIndex);
        setPreviewOpen(true);
    }, []);

    const handleDownload = async (file) => {
        const url = file?._url || file?.url;
        const name = file?._name || file?.name || "download";
        if (!url) return;

        if (user?.uid) {
            addDownload({
                userId: user.uid,
                gameId,
                sectionId: file?._sectionId || null,
                sectionTitle: file?._sectionTitle || null,
                fileName: name,
                fileURL: url,
                ext: file?._ext || getExt(name),
                size: file?._size || null,
                thumbURL: file?._thumb || null
            });
        }

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("download error", e);
        }
    };

    const fileToCollectionPayload = (f) => ({
        fileName: f._name,
        fileURL: f._url,
        thumbURL: f._thumb || null,
        ext: f._ext,
        size: f._size || null,
        gameId,
        sectionId: f._sectionId || null,
        sectionTitle: f._sectionTitle || null
    });

    const addToExistingCollection = async (collectionId, file) => {
        await addFileToCollection(collectionId, fileToCollectionPayload(file));
    };

    const createAndAddCollection = async (file) => {
        if (!user?.uid) return;
        const name = newCollectionName.trim() || "New Collection";
        const id = await createCollection(user.uid, name);
        if (id) await addFileToCollection(id, fileToCollectionPayload(file));
        setCreatingForFile(null);
        setNewCollectionName("");
    };

    if (error) {
        return (
            <div className="max-w-6xl mx-auto pt-24 pb-10 px-4 text-center text-red-400 text-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0d13] text-white">
            <HeroBanner
                image={hero}
                overlayClassName="bg-gradient-to-b from-black/5 via-black/35 to-black/70"
            />

            <div className="w-full px-4 md:px-6 lg:max-w-6xl lg:mx-auto py-6">
                <div className="mb-4">
                    {loadingGame || !game ? (
                        <div className="space-y-2">
                            <div className="h-7 w-2/3 bg-white/10 rounded" />
                            <div className="h-4 w-4/5 bg-white/5 rounded" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl md:text-3xl font-extrabold">
                                {game?.name}
                            </h1>
                            {!!game?.description && (
                                <p className="text-sm text-white/80 mt-1">
                                    {game.description}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <Tab.Group>
                    <Tab.List className="flex gap-2 mb-4">
                        {["Assets", "Related"].map((t) => (
                            <Tab key={t} as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        className={`px-4 py-2 rounded-md text-sm font-semibold border transition ${selected
                                                ? "bg-primary text-black border-primary"
                                                : "bg-transparent text-white/80 border-white/20 hover:bg-white/5"
                                            }`}
                                    >
                                        {t}
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

                                <div
                                    className={
                                        showLeftFilters ? "lg:col-span-9" : "lg:col-span-12"
                                    }
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-3">
                                        <div className="relative w-full md:max-w-xs">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60"
                                                size={16}
                                            />
                                            <input
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                placeholder="Search"
                                                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-white text-black outline-none"
                                            />
                                        </div>

                                        <button
                                            onClick={() => setShowLeftFilters((v) => !v)}
                                            className="text-sm text-white/80 hover:text-white w-fit"
                                        >
                                            {showLeftFilters ? "Hide Filters" : "Show Filters"}
                                        </button>

                                        <div className="md:ml-auto">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="bg-[#111318] border border-white/20 rounded-md px-3 py-2 text-sm outline-none"
                                            >
                                                <option value="recent">Recently Updated</option>
                                                <option value="alpha">Alphabetical</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="border border-white/10 bg-[#111318] rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <div className="min-w-[900px]">
                                                <div
                                                    className="grid text-xs font-bold text-white/80 bg-[#161922] px-4 py-2 border-b border-white/10"
                                                    style={{ gridTemplateColumns: COLS }}
                                                >
                                                    <div />
                                                    <div>Preview</div>
                                                    <div>File Name</div>
                                                    <div>Details</div>
                                                    <div className="text-right pr-2">Actions</div>
                                                </div>

                                                {(loadingSections || loadingGame) && (
                                                    <div className="p-4 space-y-3">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} className="h-14 bg-white/5 rounded" />
                                                        ))}
                                                    </div>
                                                )}

                                                {!(loadingSections || loadingGame) &&
                                                    pageFiles.length === 0 && (
                                                        <div className="p-6 text-white/70 text-sm">
                                                            No files found.
                                                        </div>
                                                    )}

                                                {!(loadingSections || loadingGame) &&
                                                    pageFiles.map((f, idx) => {
                                                        const globalIndex =
                                                            (page - 1) * PAGE_SIZE + idx;
                                                        const ext = getExt(f._name, f._ext);
                                                        const showImg =
                                                            isImage(ext) && (f._thumb || f._url);
                                                        const showPdf = isPDF(ext);

                                                        return (
                                                            <div
                                                                key={`${f._name}-${idx}`}
                                                                className="grid items-center px-4 py-3 border-b border-white/5"
                                                                style={{ gridTemplateColumns: COLS }}
                                                            >
                                                                <div className="flex items-center justify-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="accent-primary"
                                                                    />
                                                                </div>

                                                                <button
                                                                    onClick={() => openPreviewAt(globalIndex)}
                                                                    className="relative h-[64px] w-[120px] mx-auto flex items-center justify-center group"
                                                                >
                                                                    {showImg ? (
                                                                        <img
                                                                            src={f._thumb || f._url}
                                                                            alt=""
                                                                            className="h-[64px] w-[120px] object-contain"
                                                                            loading="lazy"
                                                                        />
                                                                    ) : showPdf ? (
                                                                        <FileText
                                                                            className="text-red-400"
                                                                            size={22}
                                                                        />
                                                                    ) : (
                                                                        <div className="flex flex-col items-center text-white/80">
                                                                            <File size={20} />
                                                                            <div className="text-[10px] mt-1">
                                                                                {ext || "FILE"}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {showImg && (
                                                                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                                            <ZoomIn
                                                                                size={18}
                                                                                className="drop-shadow"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                <div className="min-w-0 px-3">
                                                                    <div className="flex items-start gap-2 font-semibold text-sm">
                                                                        {showPdf ? (
                                                                            <FileText
                                                                                size={16}
                                                                                className="text-white/70 mt-0.5 flex-shrink-0"
                                                                            />
                                                                        ) : isImage(ext) ? (
                                                                            <FileImage
                                                                                size={16}
                                                                                className="text-white/70 mt-0.5 flex-shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <File
                                                                                size={16}
                                                                                className="text-white/70 mt-0.5 flex-shrink-0"
                                                                            />
                                                                        )}

                                                                        <span className="break-words whitespace-normal leading-snug line-clamp-3">
                                                                            {f._name}
                                                                        </span>
                                                                    </div>

                                                                    <div className="text-xs text-white/60 mt-1 break-words whitespace-normal">
                                                                        {f._sectionTitle} • {ext || "—"}
                                                                    </div>
                                                                </div>

                                                                <div className="text-xs text-white/70 pr-3">
                                                                    {!!f._size && (
                                                                        <div className="truncate">{f._size}</div>
                                                                    )}
                                                                    {!!f._date && (
                                                                        <div className="truncate">
                                                                            Added{" "}
                                                                            {new Date(
                                                                                f._date
                                                                            ).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-col items-end gap-2">
                                                                    <div className="grid grid-cols-2 gap-2 w-[220px]">
                                                                        <button
                                                                            onClick={() => handleDownload(f)}
                                                                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-primary text-black text-xs font-bold hover:opacity-90"
                                                                        >
                                                                            <Download size={14} />
                                                                            Download
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                openPreviewAt(globalIndex)
                                                                            }
                                                                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-white/30 text-white text-xs font-semibold hover:bg-white/5"
                                                                        >
                                                                            <Eye size={14} />
                                                                            Preview
                                                                        </button>
                                                                    </div>

                                                                    <Popover className="relative w-[220px]">
                                                                        <Popover.Button className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded border border-white/30 text-white text-xs font-semibold hover:bg-white/5 w-full">
                                                                            <PlusSquare size={14} />
                                                                            Add to Collection
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
                                                                                <div className="px-2 py-1 text-xs font-bold text-white/70">
                                                                                    Add to:
                                                                                </div>

                                                                                <div className="max-h-48 overflow-y-auto">
                                                                                    {collections.length === 0 && (
                                                                                        <div className="px-3 py-2 text-xs text-white/60">
                                                                                            No collections yet.
                                                                                        </div>
                                                                                    )}

                                                                                    {collections.map((c) => (
                                                                                        <button
                                                                                            key={c.id}
                                                                                            onClick={() =>
                                                                                                addToExistingCollection(
                                                                                                    c.id,
                                                                                                    f
                                                                                                )
                                                                                            }
                                                                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                                                                                        >
                                                                                            <span className="truncate">
                                                                                                {c.name}
                                                                                            </span>
                                                                                            <Check
                                                                                                size={14}
                                                                                                className="opacity-70"
                                                                                            />
                                                                                        </button>
                                                                                    ))}
                                                                                </div>

                                                                                <div className="border-t border-white/10 my-2" />

                                                                                {creatingForFile?.id !== f.id ? (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setCreatingForFile(f);
                                                                                            setNewCollectionName("");
                                                                                        }}
                                                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                                                                                    >
                                                                                        <FolderPlus size={16} />
                                                                                        Create Collection
                                                                                    </button>
                                                                                ) : (
                                                                                    <div className="p-2 space-y-2">
                                                                                        <input
                                                                                            autoFocus
                                                                                            value={newCollectionName}
                                                                                            onChange={(e) =>
                                                                                                setNewCollectionName(
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                            placeholder="Collection name"
                                                                                            className="w-full px-3 py-2 text-sm rounded-md bg-white text-black outline-none"
                                                                                        />
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            <button
                                                                                                onClick={() =>
                                                                                                    createAndAddCollection(f)
                                                                                                }
                                                                                                className="px-3 py-2 rounded-md bg-primary text-black text-xs font-bold"
                                                                                            >
                                                                                                Create
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    setCreatingForFile(null);
                                                                                                    setNewCollectionName("");
                                                                                                }}
                                                                                                className="px-3 py-2 rounded-md border border-white/30 text-white text-xs font-semibold"
                                                                                            >
                                                                                                Cancel
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </Popover.Panel>
                                                                        </Transition>
                                                                    </Popover>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-primary font-bold text-sm">
                                            Page {page} of {totalPages}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                disabled={page <= 1}
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 text-white text-sm disabled:opacity-40 hover:bg-white/5"
                                            >
                                                <ChevronLeft size={16} />
                                                Prev
                                            </button>

                                            <button
                                                disabled={page >= totalPages}
                                                onClick={() =>
                                                    setPage((p) => Math.min(totalPages, p + 1))
                                                }
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 text-white text-sm disabled:opacity-40 hover:bg-white/5"
                                            >
                                                Next
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tab.Panel>

                        <Tab.Panel>
                            <div className="mt-4">
                                {loadingRelated && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="h-40 bg-white/5 rounded-xl" />
                                        ))}
                                    </div>
                                )}

                                {!loadingRelated && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {promotionGames.map((g) => (
                                            <button
                                                key={g.id}
                                                onClick={() => {
                                                    window.scrollTo(0, 0);
                                                    navigate(`/game/${g.id}`);
                                                }}
                                                className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden hover:scale-[1.03] transition"
                                            >
                                                <div className="aspect-[16/9] bg-black/40">
                                                    <img
                                                        src={
                                                            g.imageURL ||
                                                            "https://via.placeholder.com/300?text=No+Image"
                                                        }
                                                        alt={g.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="p-2 text-sm font-semibold text-left">
                                                    {g.name}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>

            <PreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                files={filteredFiles}
                index={previewIndex}
                setIndex={setPreviewIndex}
                onDownload={handleDownload}
            />
        </div>
    );
}
