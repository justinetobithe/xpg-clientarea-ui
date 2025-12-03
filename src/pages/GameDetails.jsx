import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, Transition, Tab } from "@headlessui/react";
import {
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    PlusSquare,
    FileText,
    FileImage,
    File,
    ZoomIn
} from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthStore } from "../store/authStore";
import { useGameDetailsStore } from "../store/gameDetailsStore";

const PAGE_SIZE = 10;
const COLS = "48px 140px minmax(0, 1fr) 220px 240px";

const getExt = (name, fallback = "") => {
    if (!name) return fallback.toUpperCase();
    const n = name.toString();
    if (n.includes(".")) return n.split(".").pop().toUpperCase();
    return fallback.toUpperCase();
};

const IMAGE_EXTS = new Set(["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"]);
const isImage = (ext) => IMAGE_EXTS.has((ext || "").toUpperCase());
const isPDF = (ext) => (ext || "").toUpperCase() === "PDF";

export default function GameDetails() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

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

    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [showLeftFilters, setShowLeftFilters] = useState(true);
    const [selectedSectionNames, setSelectedSectionNames] = useState(new Set());
    const [selectedExts, setSelectedExts] = useState(new Set());
    const [page, setPage] = useState(1);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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

    const hero = useMemo(() => game?.bannerURL || game?.imageURL || "", [game]);

    const allSectionNames = useMemo(
        () => sections.map((s) => s.title).filter(Boolean),
        [sections]
    );

    const allExtensions = useMemo(() => {
        const s = new Set();
        sections.forEach((sec) =>
            (sec.files || []).forEach((f) => {
                const n = (f?.name || f?.filename || "").toString();
                const ext = n.includes(".")
                    ? n.split(".").pop().toUpperCase()
                    : (f?.ext || f?.type || "").toString().toUpperCase();
                if (ext) s.add(ext);
            })
        );
        return Array.from(s).sort();
    }, [sections]);

    const flatFiles = useMemo(() => {
        const out = [];
        sections.forEach((sec) => {
            (sec.files || []).forEach((f) => {
                const n = (f?.name || f?.filename || "").toString();
                const ext = n.includes(".")
                    ? n.split(".").pop().toUpperCase()
                    : (f?.ext || f?.type || "").toString().toUpperCase();

                out.push({
                    ...f,
                    _sectionTitle: sec.title,
                    _sectionId: sec.sectionId,
                    _ext: ext,
                    _size: f?.sizeText || f?.size || "",
                    _date:
                        f?.addedAt?.toDate?.() ||
                        f?.createdAt?.toDate?.() ||
                        null,
                    _name: n || "Untitled",
                    _thumb: f?.thumb || f?.thumbnail || null,
                    _url:
                        f?.previewURL ||
                        f?.url ||
                        f?.downloadURL ||
                        f?.image ||
                        ""
                });
            });
        });
        return out;
    }, [sections]);

    const filteredFiles = useMemo(() => {
        const nameFilter = searchTerm.trim().toLowerCase();
        let arr = flatFiles.filter((r) => {
            const secOK =
                selectedSectionNames.size === 0 ||
                selectedSectionNames.has(r._sectionTitle);

            const extOK =
                selectedExts.size === 0 ||
                (r._ext && selectedExts.has(r._ext));

            const nameOK =
                !nameFilter || r._name.toLowerCase().includes(nameFilter);

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

    useEffect(() => {
        setPage(1);
    }, [searchTerm, sortBy, selectedSectionNames, selectedExts]);

    const openPreviewAt = useCallback((globalIndex) => {
        setPreviewIndex(globalIndex);
        setPreviewOpen(true);
    }, []);

    useEffect(() => {
        if (!previewOpen) return;
        const onKey = (e) => {
            if (e.key === "ArrowLeft") setPreviewIndex((i) => Math.max(0, i - 1));
            if (e.key === "ArrowRight")
                setPreviewIndex((i) => Math.min(filteredFiles.length - 1, i + 1));
            if (e.key === "Escape") setPreviewOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [previewOpen, filteredFiles.length]);

    const currentPreview = filteredFiles[previewIndex];

    const buildForcedDownloadURL = (rawUrl, filename = "download") => {
        try {
            const u = new URL(rawUrl);
            u.searchParams.set("alt", "media");
            const dispo = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
            u.searchParams.set("response-content-disposition", dispo);
            return u.toString();
        } catch {
            return rawUrl;
        }
    };

    const handleDownload = async (file) => {
        const url = file?._url || file?.url;
        const name = file?._name || file?.name || "download";
        if (!url) return;

        if (user?.uid) {
            addDoc(collection(db, "downloads"), {
                userId: user.uid,
                gameId,
                sectionId: file?._sectionId || null,
                sectionTitle: file?._sectionTitle || null,
                fileName: name,
                fileURL: url,
                ext: file?._ext || getExt(name),
                size: file?._size || null,
                downloadedAt: serverTimestamp()
            }).catch(() => { });
        }

        const forced = buildForcedDownloadURL(url, name);
        const a = document.createElement("a");
        a.href = forced;
        a.setAttribute("download", name);
        a.rel = "noopener";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
            <section
                className="relative w-screen left-1/2 right-1/2 -mx-[50vw] h-[520px] md:h-[640px] lg:h-[720px] bg-cover bg-center"
                style={{ backgroundImage: hero ? `url(${hero})` : "none" }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
            </section>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
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
                        <Tab as={Fragment}>
                            {({ selected }) => (
                                <button
                                    className={`px-4 py-2 rounded-md text-sm font-semibold border transition ${selected
                                        ? "bg-primary text-black border-primary"
                                        : "bg-transparent text-white/80 border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    Assets
                                </button>
                            )}
                        </Tab>
                        <Tab as={Fragment}>
                            {({ selected }) => (
                                <button
                                    className={`px-4 py-2 rounded-md text-sm font-semibold border transition ${selected
                                        ? "bg-primary text-black border-primary"
                                        : "bg-transparent text-white/80 border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    Related
                                </button>
                            )}
                        </Tab>
                    </Tab.List>

                    <Tab.Panels>
                        <Tab.Panel>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {showLeftFilters && (
                                    <aside className="md:col-span-3">
                                        <div className="bg-[#111318] border border-white/10 rounded-xl p-4 sticky top-6">
                                            <div className="text-primary font-bold mb-2">
                                                File Types
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                {allSectionNames.map((name) => (
                                                    <label
                                                        key={name}
                                                        className="flex items-center gap-2 text-sm text-white/90"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSectionNames.has(name)}
                                                            onChange={(e) => {
                                                                const next = new Set(selectedSectionNames);
                                                                e.target.checked ? next.add(name) : next.delete(name);
                                                                setSelectedSectionNames(next);
                                                            }}
                                                            className="accent-primary"
                                                        />
                                                        {name}
                                                    </label>
                                                ))}
                                            </div>

                                            <div className="h-px bg-white/10 my-3" />

                                            <div className="text-primary font-bold mb-2">
                                                File Tags
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                {allExtensions.map((ext) => (
                                                    <label
                                                        key={ext}
                                                        className="flex items-center gap-2 text-sm text-white/90"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedExts.has(ext)}
                                                            onChange={(e) => {
                                                                const next = new Set(selectedExts);
                                                                e.target.checked ? next.add(ext) : next.delete(ext);
                                                                setSelectedExts(next);
                                                            }}
                                                            className="accent-primary"
                                                        />
                                                        {ext}
                                                    </label>
                                                ))}
                                            </div>

                                            <div className="h-px bg-white/10 my-3" />

                                            <div className="text-primary font-bold mb-1">
                                                Follow Us
                                            </div>
                                            <div className="text-sm text-white/80">
                                                @XPG Live
                                                <br />
                                                @xpg.live
                                            </div>

                                            <div className="h-px bg-white/10 my-3" />

                                            <div className="text-primary font-bold mb-1">
                                                Contact Us
                                            </div>
                                            <div className="text-sm text-white/80">
                                                Missing a file? Send your request to
                                                <br />
                                                xpg@live.com
                                            </div>
                                        </div>
                                    </aside>
                                )}

                                <div className={showLeftFilters ? "md:col-span-9" : "md:col-span-12"}>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-3">
                                        <div className="relative w-full md:max-w-xs">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60"
                                                size={16}
                                            />
                                            <input
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                                    <div>Actions</div>
                                                </div>

                                                {(loadingSections || loadingGame) && (
                                                    <div className="p-4 space-y-3">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} className="h-14 bg-white/5 rounded" />
                                                        ))}
                                                    </div>
                                                )}

                                                {!(loadingSections || loadingGame) && pageFiles.length === 0 && (
                                                    <div className="p-6 text-white/70 text-sm">
                                                        No files found.
                                                    </div>
                                                )}

                                                {!(loadingSections || loadingGame) &&
                                                    pageFiles.map((f, idx) => {
                                                        const globalIndex = (page - 1) * PAGE_SIZE + idx;
                                                        const ext = getExt(f._name, f._ext);
                                                        const showImg = isImage(ext) && (f._thumb || f._url);
                                                        const showPdf = isPDF(ext);

                                                        return (
                                                            <div
                                                                key={`${f._name}-${idx}`}
                                                                className="grid items-center px-4 py-3 border-b border-white/5"
                                                                style={{ gridTemplateColumns: COLS }}
                                                            >
                                                                <div className="flex items-center justify-center">
                                                                    <input type="checkbox" className="accent-primary" />
                                                                </div>

                                                                <button
                                                                    onClick={() => openPreviewAt(globalIndex)}
                                                                    className="relative h-[64px] w-[120px] rounded-md bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center group mx-auto"
                                                                >
                                                                    {showImg && (
                                                                        <img
                                                                            src={f._thumb || f._url}
                                                                            className="w-full h-full object-contain"
                                                                        />
                                                                    )}

                                                                    {showPdf && (
                                                                        <FileText className="text-red-400" size={22} />
                                                                    )}

                                                                    {!showImg && !showPdf && (
                                                                        <div className="flex flex-col items-center text-white/80">
                                                                            <File size={20} />
                                                                            <div className="text-[10px] mt-1">
                                                                                {ext || "FILE"}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                                        <ZoomIn size={18} />
                                                                    </div>
                                                                </button>

                                                                <div className="min-w-0 px-3">
                                                                    <div className="flex items-center gap-2 font-semibold text-sm truncate">
                                                                        {showPdf ? (
                                                                            <FileText size={16} className="text-white/70" />
                                                                        ) : isImage(ext) ? (
                                                                            <FileImage size={16} className="text-white/70" />
                                                                        ) : (
                                                                            <File size={16} className="text-white/70" />
                                                                        )}
                                                                        <span className="truncate">{f._name}</span>
                                                                    </div>
                                                                    <div className="text-xs text-white/60 truncate mt-0.5">
                                                                        {f._sectionTitle} • {ext || "—"}
                                                                    </div>
                                                                </div>

                                                                <div className="text-xs text-white/70 pr-3">
                                                                    {!!f._size && <div className="truncate">{f._size}</div>}
                                                                    {!!f._date && (
                                                                        <div className="truncate">
                                                                            Added {new Date(f._date).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                    {!!(f.badge || f.tag) && (
                                                                        <div className="inline-block mt-1 px-2 py-0.5 rounded bg-primary text-black font-bold text-[10px]">
                                                                            {f.badge || f.tag}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex gap-2 flex-wrap justify-end">
                                                                    <button
                                                                        onClick={() => handleDownload(f)}
                                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-black text-xs font-bold hover:opacity-90"
                                                                    >
                                                                        <Download size={14} />
                                                                        Download
                                                                    </button>

                                                                    <button
                                                                        onClick={() => openPreviewAt(globalIndex)}
                                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 text-white text-xs font-semibold hover:bg-white/5"
                                                                    >
                                                                        <Eye size={14} />
                                                                        Preview
                                                                    </button>

                                                                    <button
                                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 text-white text-xs font-semibold hover:bg-white/5"
                                                                    >
                                                                        <PlusSquare size={14} />
                                                                        Add to Collection
                                                                    </button>
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
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
                                                        src={g.imageURL || "https://via.placeholder.com/300?text=No+Image"}
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

            <Transition show={previewOpen} as={Fragment}>
                <Dialog onClose={() => setPreviewOpen(false)} className="relative z-50">
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/80" />
                    </Transition.Child>

                    <Transition.Child
                        as={Fragment}
                        enter="transition duration-200 ease-out"
                        enterFrom="opacity-0 translate-y-2 scale-95"
                        enterTo="opacity-100 translate-y-0 scale-100"
                        leave="transition duration-150 ease-in"
                        leaveFrom="opacity-100 translate-y-0 scale-100"
                        leaveTo="opacity-0 translate-y-2 scale-95"
                    >
                        <Dialog.Panel className="fixed inset-0 m-auto w-[94%] max-w-5xl h-[86vh] bg-[#111318] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    {isPDF(getExt(currentPreview?._name, currentPreview?._ext)) ? (
                                        <FileText className="text-primary" size={18} />
                                    ) : isImage(getExt(currentPreview?._name, currentPreview?._ext)) ? (
                                        <FileImage className="text-primary" size={18} />
                                    ) : (
                                        <File className="text-primary" size={18} />
                                    )}

                                    <div className="truncate max-w-[70vw]">
                                        {currentPreview?._name || ""}
                                        {currentPreview?._ext
                                            ? ` | ${getExt(currentPreview?._name, currentPreview?._ext)}`
                                            : ""}
                                        {currentPreview?._size ? ` | ${currentPreview._size}` : ""}
                                        {currentPreview?._date
                                            ? ` | Added ${new Date(currentPreview._date).toLocaleString()}`
                                            : ""}
                                        {filteredFiles.length
                                            ? ` | ${previewIndex + 1} of ${filteredFiles.length}`
                                            : ""}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setPreviewOpen(false)}
                                    className="text-white/80 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="relative flex-1 bg-black">
                                <button
                                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                                    disabled={previewIndex <= 0}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white disabled:opacity-30"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <button
                                    onClick={() =>
                                        setPreviewIndex((i) =>
                                            Math.min(filteredFiles.length - 1, i + 1)
                                        )
                                    }
                                    disabled={previewIndex >= filteredFiles.length - 1}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white disabled:opacity-30"
                                >
                                    <ChevronRight size={20} />
                                </button>

                                <div className="w-full h-full flex items-center justify-center">
                                    {isImage(getExt(currentPreview?._name, currentPreview?._ext)) &&
                                        currentPreview?._url ? (
                                        <img
                                            src={currentPreview._url}
                                            alt={currentPreview._name || ""}
                                            className="max-h-[70vh] w-auto object-contain"
                                        />
                                    ) : isPDF(getExt(currentPreview?._name, currentPreview?._ext)) &&
                                        currentPreview?._url ? (
                                        <iframe
                                            title={currentPreview?._name || "PDF"}
                                            src={`${currentPreview._url}#toolbar=1&navpanes=0`}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <div className="text-white/80 flex flex-col items-center gap-2">
                                            <File size={48} />
                                            <div>No inline preview for this file type.</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 border-t border-white/10 flex items-center justify-center gap-2">
                                <button className="inline-flex items-center gap-2 px-3 py-2 rounded border border-white/30 text-white text-sm hover:bg-white/5">
                                    <PlusSquare size={16} />
                                    Add to Collection
                                </button>

                                <button
                                    onClick={() => handleDownload(currentPreview)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-black font-bold text-sm hover:opacity-90"
                                >
                                    <Download size={16} />
                                    Download
                                </button>

                                <button
                                    onClick={() => setPreviewOpen(false)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded border border-white/30 text-white text-sm hover:bg-white/5"
                                >
                                    <Eye size={16} />
                                    Close Preview
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </div>
    );
}
