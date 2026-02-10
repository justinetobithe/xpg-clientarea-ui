import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useGamesQuery } from "../../hooks/useGamesQuery";
import { useTranslation } from "react-i18next";

const TYPE_ORDER = ["Baccarat", "Teen Patti", "Roulette", "Blackjack", "Dragon Tiger", "Sic Bo", "Poker", "Andar Bahar", "Other"];

const CATEGORY_DEFS = [
    {
        id: "lobby-assets",
        label: "Lobby Assets",
        image: "/image/categories/lobby-assets.png",
        types: ["Lobby Assets", "Baccarat"],
    },
    {
        id: "roulette",
        label: "Roulette",
        image: "/image/categories/roulette.png",
        types: ["Roulette"],
    },
    {
        id: "blackjack",
        label: "Blackjack",
        image: "/image/categories/blackjack.png",
        types: ["Blackjack"],
    },
    {
        id: "baccarat",
        label: "Baccarat",
        image: "/image/categories/baccarat.png",
        types: ["Baccarat"],
    },
    {
        id: "dice-games",
        label: "Dice Games",
        image: "/image/categories/dice-games.png",
        types: ["Sic Bo"],
    },
    {
        id: "high-low",
        label: "High/Low",
        image: "/image/categories/high-low.png",
        types: ["Dragon Tiger", "Andar Bahar"],
    },
    {
        id: "poker",
        label: "Poker",
        image: "/image/categories/poker.png",
        types: ["Teen Patti", "Poker"],
    },
    {
        id: "turkish-tables",
        label: "Turkish Tables",
        image: "/image/categories/turkish-table.png",
        types: ["Turkish Tables"],
    },
];

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function useMobileViewportFix(enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        const setVars = () => {
            const h = window.innerHeight || 0;
            if (h) document.documentElement.style.setProperty("--app-vh", `${h * 0.01}px`);
            if (window.visualViewport?.height) {
                document.documentElement.style.setProperty("--vvh", `${window.visualViewport.height * 0.01}px`);
            }
        };
        setVars();
        const vv = window.visualViewport;
        const onVV = () => setVars();
        if (vv) {
            vv.addEventListener("resize", onVV);
            vv.addEventListener("scroll", onVV);
        }
        window.addEventListener("resize", setVars);
        window.addEventListener("orientationchange", setVars);
        return () => {
            window.removeEventListener("resize", setVars);
            window.removeEventListener("orientationchange", setVars);
            if (vv) {
                vv.removeEventListener("resize", onVV);
                vv.removeEventListener("scroll", onVV);
            }
        };
    }, [enabled]);
}

function usePageSize() {
    const [size, setSize] = useState(() => {
        const w = typeof window !== "undefined" ? window.innerWidth : 1200;
        if (w < 640) return 10;
        if (w < 1024) return 12;
        return 16;
    });

    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            const next = w < 640 ? 10 : w < 1024 ? 12 : 16;
            setSize(next);
        };
        window.addEventListener("resize", onResize, { passive: true });
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return size;
}

function normalize(s) {
    return String(s || "").toLowerCase().trim();
}

function getGameName(game, i18n, t) {
    const name = game?.[i18n.language]?.name || game?.name || game?.title || game?.game_name;
    return name || t("games.untitled");
}

const TURKISH_TABLE_GAME_NAMES = new Set([
    "royal blackjack",
    "turkish blackjack",
    "diamon blackjack",
    "diamond blackjack",
    "royal roulette",
]);

function detectTypeFromGame(game, i18n, t) {
    const rawName = getGameName(game, i18n, t);
    const n = normalize(rawName).replace(/\s+/g, " ");
    if (TURKISH_TABLE_GAME_NAMES.has(n)) return "Turkish Tables";
    if (n.includes("turkish")) return "Turkish Tables";
    if (n.includes("baccarat")) return "Baccarat";
    if (n.includes("teen patti") || n.includes("teenpatti")) return "Teen Patti";
    if (n.includes("roulette")) return "Roulette";
    if (n.includes("blackjack")) return "Blackjack";
    if (n.includes("dragon tiger") || n.includes("dragontiger")) return "Dragon Tiger";
    if (n.includes("andar bahar") || n.includes("andarbahar")) return "Andar Bahar";
    if (n.includes("sic bo") || n.includes("sicbo")) return "Sic Bo";
    if (n.includes("poker")) return "Poker";
    if (n.includes("lobby") || n.includes("asset") || n.includes("banner")) return "Lobby Assets";
    return "Other";
}

function GameCardSkeleton() {
    return (
        <div className="rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 animate-pulse">
            <div className="aspect-[16/10] bg-white/10" />
            <div className="px-3 py-3">
                <div className="h-4 bg-white/10 rounded w-4/5 mx-auto" />
            </div>
        </div>
    );
}

function GamesGridSkeleton({ count = 12 }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <GameCardSkeleton key={i} />
            ))}
        </div>
    );
}

function GameImage({ src, alt }) {
    const { t } = useTranslation();
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white/50 text-xs">
                {t("games.image.noImage")}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable="false"
        />
    );
}

function CategoryCard({ active, label, image, onClick, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "snap-start shrink-0 w-[60%] sm:w-[38%] lg:w-[26%]",
                "rounded-xl overflow-hidden border bg-white/[0.03] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] transition",
                "border-white/10 hover:-translate-y-0.5 hover:scale-[1.02]",
                active ? "ring-2 ring-primary" : ""
            )}
        >
            <div className="relative aspect-[16/9] bg-black/20 overflow-hidden">
                <GameImage src={image} alt={label} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/0 opacity-95" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                    <div className="text-white text-sm font-semibold truncate">{label}</div>
                    <div className="text-xs text-white/80 bg-black/35 px-2 py-1 rounded-md">{count}</div>
                </div>
            </div>
        </button>
    );
}

function GameCard({ to, imageURL, title }) {
    return (
        <Link
            to={to}
            className={cx(
                "group rounded-xl overflow-hidden border transition will-change-transform",
                "bg-white/[0.03] border-white/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] hover:shadow-primary/30",
                "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99]"
            )}
        >
            <div className="relative aspect-[16/10] bg-black/20 overflow-hidden">
                <GameImage src={imageURL} alt={title} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-90" />
            </div>
            <div className="px-3 py-3">
                <div className="text-center text-white text-sm font-semibold leading-tight truncate">{title}</div>
            </div>
        </Link>
    );
}

function Pagination({ page, totalPages, onPrev, onNext, onJump }) {
    const { t } = useTranslation();

    const pages = useMemo(() => {
        if (totalPages <= 1) return [];
        const out = new Set([1, totalPages, page, page - 1, page + 1, page - 2, page + 2]);
        return Array.from(out)
            .filter((n) => n >= 1 && n <= totalPages)
            .sort((a, b) => a - b);
    }, [page, totalPages]);

    if (totalPages <= 1) return null;

    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div
            className="mt-6 flex flex-col items-center gap-3"
            style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)",
                paddingLeft: "env(safe-area-inset-left)",
                paddingRight: "env(safe-area-inset-right)",
            }}
        >
            <div className="flex items-center justify-center gap-2 w-full">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={!canPrev}
                    className={cx(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
                        "border-white/15 bg-white/[0.03] text-white text-sm font-semibold",
                        "hover:bg-white/[0.06]",
                        !canPrev ? "opacity-40 cursor-not-allowed" : ""
                    )}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t("games.pagination.prev")}
                </button>

                <div className="text-xs text-white/70 px-2">
                    {t("games.pagination.page")} <span className="text-primary font-semibold">{page}</span> / {totalPages}
                </div>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canNext}
                    className={cx(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
                        "border-white/15 bg-white/[0.03] text-white text-sm font-semibold",
                        "hover:bg-white/[0.06]",
                        !canNext ? "opacity-40 cursor-not-allowed" : ""
                    )}
                >
                    {t("games.pagination.next")}
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
                {pages.map((p, idx) => {
                    const prev = pages[idx - 1];
                    const showDots = idx > 0 && prev && p - prev > 1;

                    return (
                        <span key={p} className="flex items-center gap-2">
                            {showDots ? <span className="text-white/40 text-sm">…</span> : null}
                            <button
                                type="button"
                                onClick={() => onJump(p)}
                                className={cx(
                                    "h-9 min-w-9 px-3 rounded-lg border text-sm font-semibold transition",
                                    p === page
                                        ? "bg-primary text-black border-primary"
                                        : "border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                                )}
                            >
                                {p}
                            </button>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

export default function GamesSection() {
    const { t, i18n } = useTranslation();
    const { data: allGames = [], isLoading, error } = useGamesQuery();

    useMobileViewportFix(true);

    const pageSize = usePageSize();

    const sortOptions = useMemo(
        () => [
            { value: "order-asc", label: t("games.sort.defaultOrder") },
            { value: "name-asc", label: t("games.sort.nameAsc") },
            { value: "name-desc", label: t("games.sort.nameDesc") },
            { value: "type-asc", label: t("games.sort.typeAsc") || "Type (A → Z)" },
        ],
        [t]
    );

    const [activeCategory, setActiveCategory] = useState("All");
    const [activeType, setActiveType] = useState("All");
    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState(sortOptions[0]);
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(1);

    const timerRef = useRef(null);
    const catTrackRef = useRef(null);

    const [canPrevCat, setCanPrevCat] = useState(false);
    const [canNextCat, setCanNextCat] = useState(false);

    useEffect(() => {
        setSortBy((cur) => sortOptions.find((o) => o.value === cur?.value) || sortOptions[0]);
    }, [sortOptions]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setInputValue(val);

        const trimmed = val.trim();
        if (timerRef.current) clearTimeout(timerRef.current);

        if (trimmed.length < 2) {
            setSearchTerm("");
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        timerRef.current = setTimeout(() => {
            setSearchTerm(trimmed);
            setIsSearching(false);
        }, 450);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const categoryCounts = useMemo(() => {
        const list = Array.isArray(allGames) ? allGames : [];
        const counts = new Map();
        for (const c of CATEGORY_DEFS) counts.set(c.id, 0);

        for (const g of list) {
            const type = detectTypeFromGame(g, i18n, t);
            for (const c of CATEGORY_DEFS) {
                if (c.types.includes(type)) counts.set(c.id, (counts.get(c.id) || 0) + 1);
            }
        }

        return counts;
    }, [allGames, i18n, t]);

    const availableTypes = useMemo(() => {
        const list = Array.isArray(allGames) ? allGames : [];
        const set = new Set();

        const allowedByCategory =
            activeCategory === "All"
                ? null
                : CATEGORY_DEFS.find((c) => c.id === activeCategory)?.types || null;

        for (const g of list) {
            const type = detectTypeFromGame(g, i18n, t);
            if (allowedByCategory && !allowedByCategory.includes(type)) continue;
            set.add(type);
        }

        const arr = Array.from(set);
        arr.sort((a, b) => {
            const ai = TYPE_ORDER.indexOf(a);
            const bi = TYPE_ORDER.indexOf(b);
            const ax = ai === -1 ? 999 : ai;
            const bx = bi === -1 ? 999 : bi;
            if (ax !== bx) return ax - bx;
            return a.localeCompare(b);
        });

        return ["All", ...arr];
    }, [allGames, activeCategory, i18n, t]);

    useEffect(() => {
        if (activeType !== "All" && !availableTypes.includes(activeType)) setActiveType("All");
    }, [availableTypes, activeType]);

    const updateCatArrows = useCallback(() => {
        const el = catTrackRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        const left = el.scrollLeft;
        setCanPrevCat(left > 2);
        setCanNextCat(max - left > 2);
    }, []);

    useEffect(() => {
        updateCatArrows();
        const el = catTrackRef.current;
        if (!el) return;

        const onScroll = () => updateCatArrows();
        el.addEventListener("scroll", onScroll, { passive: true });

        const ro = new ResizeObserver(() => updateCatArrows());
        ro.observe(el);

        return () => {
            el.removeEventListener("scroll", onScroll);
            ro.disconnect();
        };
    }, [updateCatArrows, allGames.length]);

    const scrollCatsBy = useCallback((dir) => {
        const el = catTrackRef.current;
        if (!el) return;
        const step = Math.max(280, Math.round(el.clientWidth * 0.9));
        el.scrollBy({ left: dir * step, behavior: "smooth" });
    }, []);

    const filteredGames = useMemo(() => {
        let list = Array.isArray(allGames) ? [...allGames] : [];

        const allowedByCategory =
            activeCategory === "All"
                ? null
                : CATEGORY_DEFS.find((c) => c.id === activeCategory)?.types || null;

        if (allowedByCategory) {
            list = list.filter((g) => allowedByCategory.includes(detectTypeFromGame(g, i18n, t)));
        }

        if (activeType !== "All") {
            list = list.filter((g) => detectTypeFromGame(g, i18n, t) === activeType);
        }

        if (searchTerm.length >= 2) {
            const lower = searchTerm.toLowerCase();
            list = list.filter((g) => normalize(getGameName(g, i18n, t)).includes(lower));
        }

        if (sortBy.value === "name-asc") {
            list.sort((a, b) => getGameName(a, i18n, t).localeCompare(getGameName(b, i18n, t)));
        } else if (sortBy.value === "name-desc") {
            list.sort((a, b) => getGameName(b, i18n, t).localeCompare(getGameName(a, i18n, t)));
        } else if (sortBy.value === "type-asc") {
            list.sort((a, b) => {
                const at = detectTypeFromGame(a, i18n, t);
                const bt = detectTypeFromGame(b, i18n, t);
                const ai = TYPE_ORDER.indexOf(at);
                const bi = TYPE_ORDER.indexOf(bt);
                const ax = ai === -1 ? 999 : ai;
                const bx = bi === -1 ? 999 : bi;
                if (ax !== bx) return ax - bx;
                return getGameName(a, i18n, t).localeCompare(getGameName(b, i18n, t));
            });
        } else {
            list.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
        }

        return list;
    }, [allGames, activeCategory, activeType, searchTerm, sortBy.value, i18n, t]);

    const showSkeleton = isLoading || isSearching;

    useEffect(() => {
        setPage(1);
    }, [activeCategory, activeType, searchTerm, sortBy.value, pageSize, allGames.length]);

    const totalPages = Math.max(1, Math.ceil(filteredGames.length / pageSize));
    const start = (page - 1) * pageSize;
    const pageSlice = filteredGames.slice(start, start + pageSize);

    const clearAll = () => {
        setActiveCategory("All");
        setActiveType("All");
        setInputValue("");
        setSearchTerm("");
        setIsSearching(false);
        setPage(1);
    };

    const orderedCategories = useMemo(() => {
        const turkish = CATEGORY_DEFS.find((c) => c.id === "turkish-tables");
        const rest = CATEGORY_DEFS.filter((c) => c.id !== "turkish-tables");
        return turkish ? [turkish, ...rest] : rest;
    }, []);

    return (
        <section className="mt-8 space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="text-lg font-semibold text-white">{t("games.categories.title") || "Categories"}</div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Prev categories"
                            disabled={!canPrevCat}
                            onClick={() => scrollCatsBy(-1)}
                            className={cx(
                                "inline-flex items-center justify-center h-9 w-9 rounded-lg",
                                "bg-white/[0.06] text-white/80 hover:bg-white/[0.10] hover:text-white transition",
                                !canPrevCat ? "opacity-40 cursor-not-allowed" : ""
                            )}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next categories"
                            disabled={!canNextCat}
                            onClick={() => scrollCatsBy(1)}
                            className={cx(
                                "inline-flex items-center justify-center h-9 w-9 rounded-lg",
                                "bg-white/[0.06] text-white/80 hover:bg-white/[0.10] hover:text-white transition",
                                !canNextCat ? "opacity-40 cursor-not-allowed" : ""
                            )}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {!showSkeleton && (
                    <div
                        ref={catTrackRef}
                        className={cx(
                            "flex gap-4 pb-1 overflow-x-auto",
                            "snap-x snap-mandatory",
                            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        )}
                        style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
                    >
                        <CategoryCard
                            active={activeCategory === "All"}
                            label={t("games.categories.all") || "All Games"}
                            image="/image/categories/all-games.png"
                            count={allGames.length}
                            onClick={() => setActiveCategory("All")}
                        />

                        {orderedCategories.map((c) => (
                            <CategoryCard
                                key={c.id}
                                active={activeCategory === c.id}
                                label={c.label}
                                image={c.image}
                                count={categoryCounts.get(c.id) || 0}
                                onClick={() => setActiveCategory(c.id)}
                            />
                        ))}
                    </div>
                )}

                {showSkeleton && <div className="text-sm text-white/60">{t("games.categories.loading") || "Loading..."}</div>}
            </div>

            <div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="text-lg font-semibold text-white min-w-0 truncate">
                            {(t("games.list.title") || "Games")}:{" "}
                            <span className="text-white/85">
                                {activeCategory === "All"
                                    ? t("games.categories.all") || "All Categories"
                                    : CATEGORY_DEFS.find((c) => c.id === activeCategory)?.label}
                            </span>
                            <span className="text-white/60"> · </span>
                            <span className="text-white/85">{activeType === "All" ? t("games.types.all") || "All Types" : activeType}</span>
                            <span className="text-white/60"> · </span>
                            <span className="text-white/85">{showSkeleton ? allGames.length : filteredGames.length}</span>
                        </div>

                        {(activeCategory !== "All" || activeType !== "All" || inputValue) && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] text-white text-xs font-semibold"
                            >
                                <X className="h-4 w-4" />
                                {t("games.list.clearAll") || "Clear"}
                            </button>
                        )}
                    </div>

                    <div
                        className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
                        style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
                    >
                        <div className="relative flex items-center flex-1 min-w-0">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleSearchChange}
                                placeholder={t("games.list.searchPlaceholder") || "Search games..."}
                                className="w-full bg-white/[0.03] rounded-lg py-2 pl-10 pr-10 text-sm text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary transition"
                                inputMode="search"
                                enterKeyHint="search"
                                autoCorrect="off"
                                autoCapitalize="none"
                            />
                            <Search className="absolute left-3 h-4 w-4 text-white/70" />
                            {inputValue ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInputValue("");
                                        setSearchTerm("");
                                        setIsSearching(false);
                                        setPage(1);
                                    }}
                                    className="absolute right-2 h-8 w-8 inline-flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white/80"
                                    aria-label="Clear"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>

                        <Listbox value={activeType} onChange={(v) => setActiveType(v)}>
                            {({ open }) => (
                                <div className="relative w-full sm:w-56 z-10">
                                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white/[0.03] py-2 pl-3 pr-10 text-left shadow-md focus:outline-none border border-white/10 text-white transition hover:bg-white/[0.05]">
                                        <span className="block truncate text-xs">{activeType === "All" ? t("games.types.all") || "All Types" : activeType}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronDown className={cx("h-5 w-5 text-gray-400 transition", open ? "rotate-180" : "")} />
                                        </span>
                                    </Listbox.Button>

                                    <Listbox.Options className="absolute mt-1 max-h-72 w-full overflow-auto rounded-md bg-[#151620] py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-white/10">
                                        {availableTypes.map((tp) => (
                                            <Listbox.Option
                                                key={tp}
                                                className={({ active }) =>
                                                    cx("relative cursor-default select-none py-2 px-4 text-xs", active ? "bg-primary/30 text-white" : "text-white")
                                                }
                                                value={tp}
                                            >
                                                {({ selected }) => (
                                                    <span className={cx("block truncate", selected ? "font-medium" : "font-normal")}>
                                                        {tp === "All" ? t("games.types.all") || "All Types" : tp}
                                                    </span>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            )}
                        </Listbox>

                        <Listbox value={sortBy} onChange={setSortBy}>
                            {({ open }) => (
                                <div className="relative w-full sm:w-56 z-10">
                                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white/[0.03] py-2 pl-3 pr-10 text-left shadow-md focus:outline-none border border-white/10 text-white transition hover:bg-white/[0.05]">
                                        <span className="block truncate text-xs">{sortBy.label}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronDown className={cx("h-5 w-5 text-gray-400 transition", open ? "rotate-180" : "")} />
                                        </span>
                                    </Listbox.Button>

                                    <Listbox.Options className="absolute mt-1 max-h-72 w-full overflow-auto rounded-md bg-[#151620] py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-white/10">
                                        {sortOptions.map((option) => (
                                            <Listbox.Option
                                                key={option.value}
                                                className={({ active }) =>
                                                    cx("relative cursor-default select-none py-2 px-4 text-xs", active ? "bg-primary/30 text-white" : "text-white")
                                                }
                                                value={option}
                                            >
                                                {({ selected }) => (
                                                    <span className={cx("block truncate", selected ? "font-medium" : "font-normal")}>
                                                        {option.label}
                                                    </span>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            )}
                        </Listbox>
                    </div>
                </div>

                {showSkeleton && <GamesGridSkeleton count={pageSize} />}

                {!showSkeleton && error && <div className="text-red-400 text-sm">{error?.message || t("games.list.failedToLoad")}</div>}

                {!showSkeleton && !error && allGames.length > 0 && filteredGames.length === 0 && (
                    <div className="text-white/70 text-sm">{t("games.list.noGamesFound") || "No games found."}</div>
                )}

                {!showSkeleton && !error && filteredGames.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {pageSlice.map((game) => (
                                <GameCard key={game.id} to={`/game/${game.id}`} imageURL={game.imageURL} title={getGameName(game, i18n, t)} />
                            ))}
                        </div>

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPrev={() => setPage((p) => Math.max(1, p - 1))}
                            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                            onJump={(p) => setPage(p)}
                        />
                    </>
                )}

                {!showSkeleton && !error && allGames.length === 0 && (
                    <div className="text-white/70 text-sm">{t("games.list.noGamesFound") || "No games found."}</div>
                )}
            </div>
        </section>
    );
}
