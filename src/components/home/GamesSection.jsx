import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useGamesQuery } from "../../hooks/useGamesQuery";
import { useTranslation } from "react-i18next";

const TYPE_ORDER = ["Baccarat", "Teen Patti", "Roulette", "Blackjack", "Dragon Tiger", "Sic Bo", "Poker", "Other"];

function IconButton({ label, onClick, disabled, children }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={[
                "inline-flex items-center justify-center h-9 w-9 rounded-lg",
                "bg-white/[0.06] text-white/80",
                "hover:bg-white/[0.10] hover:text-white transition",
                disabled ? "opacity-40 cursor-not-allowed" : ""
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function getGameName(g, t) {
    return g?.name || g?.title || g?.game_name || t("games.untitled");
}

function normalize(s) {
    return String(s || "").toLowerCase().trim();
}

function detectTypeFromGame(game, t) {
    const n = normalize(getGameName(game, t)).replace(/\s+/g, " ");

    if (n.includes("baccarat")) return "Baccarat";
    if (n.includes("teen patti") || n.includes("teenpatti")) return "Teen Patti";
    if (n.includes("roulette")) return "Roulette";
    if (n.includes("blackjack")) return "Blackjack";
    if (n.includes("dragon tiger") || n.includes("dragontiger")) return "Dragon Tiger";
    if (n.includes("sic bo") || n.includes("sicbo")) return "Sic Bo";
    if (n.includes("poker")) return "Poker";

    return "Other";
}

function GameCardSkeleton() {
    return (
        <div className="rounded-xl overflow-hidden shadow-lg bg-background/40 border border-border/50 animate-pulse">
            <div className="aspect-video bg-white/10" />
            <div className="p-3">
                <div className="h-4 bg-white/10 rounded w-3/4 mx-auto" />
            </div>
        </div>
    );
}

function GamesGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <GameCardSkeleton key={i} />
            ))}
        </div>
    );
}

function MobilePagination({ page, totalPages, onPrev, onNext, onJump }) {
    const { t } = useTranslation();

    const pages = useMemo(() => {
        const out = new Set([1, totalPages, page, page - 1, page + 1]);
        return Array.from(out)
            .filter((n) => n >= 1 && n <= totalPages)
            .sort((a, b) => a - b);
    }, [page, totalPages]);

    if (totalPages <= 1) return null;

    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div className="md:hidden mt-5 flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 w-full">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={!canPrev}
                    className={[
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
                        "border-white/15 bg-white/[0.03] text-white text-sm font-semibold",
                        "hover:bg-white/[0.06]",
                        !canPrev ? "opacity-40 cursor-not-allowed" : ""
                    ].join(" ")}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t("games.pagination.prev")}
                </button>

                <div className="text-xs text-white/70 px-2">
                    {t("games.pagination.page")} <span className="text-white font-semibold">{page}</span> / {totalPages}
                </div>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canNext}
                    className={[
                        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
                        "border-white/15 bg-white/[0.03] text-white text-sm font-semibold",
                        "hover:bg-white/[0.06]",
                        !canNext ? "opacity-40 cursor-not-allowed" : ""
                    ].join(" ")}
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
                                className={[
                                    "h-9 min-w-9 px-3 rounded-lg border text-sm font-semibold",
                                    "border-white/15 bg-white/[0.03] hover:bg-white/[0.06]",
                                    p === page ? "text-black bg-primary border-primary" : "text-white"
                                ].join(" ")}
                            >
                                {p}
                            </button>
                        </span>
                    );
                })}
            </div>

            <div className="text-[11px] text-white/50">{t("games.pagination.mobileHint")}</div>
        </div>
    );
}

function GameImage({ src, alt }) {
    const { t } = useTranslation();
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.06] text-white/50 text-xs">
                {t("games.image.noImage")}
            </div>
        );
    }

    return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />;
}

export default function GamesSection() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: allGames = [], isLoading, error } = useGamesQuery();

    const sortOptions = useMemo(
        () => [
            { value: "order-asc", label: t("games.sort.defaultOrder") },
            { value: "name-asc", label: t("games.sort.nameAsc") },
            { value: "name-desc", label: t("games.sort.nameDesc") }
        ],
        [t]
    );

    const [activeType, setActiveType] = useState("All");
    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState(sortOptions[0]);
    const [isSearching, setIsSearching] = useState(false);
    const [mobilePage, setMobilePage] = useState(1);

    const timerRef = useRef(null);
    const typesTrackRef = useRef(null);

    const [canPrevTypes, setCanPrevTypes] = useState(false);
    const [canNextTypes, setCanNextTypes] = useState(false);

    useEffect(() => {
        setSortBy((cur) => {
            const next = sortOptions.find((o) => o.value === cur?.value) || sortOptions[0];
            return next;
        });
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

    const typeCards = useMemo(() => {
        const list = Array.isArray(allGames) ? allGames : [];
        const map = new Map();

        for (const g of list) {
            const type = detectTypeFromGame(g, t);
            if (!map.has(type)) {
                map.set(type, { type, id: type, name: type, imageURL: g?.imageURL || null, count: 1 });
            } else {
                const cur = map.get(type);
                cur.count += 1;
                if (!cur.imageURL && g?.imageURL) cur.imageURL = g.imageURL;
            }
        }

        const arr = Array.from(map.values());
        arr.sort((a, b) => {
            const ai = TYPE_ORDER.indexOf(a.type);
            const bi = TYPE_ORDER.indexOf(b.type);
            const ax = ai === -1 ? 999 : ai;
            const bx = bi === -1 ? 999 : bi;
            if (ax !== bx) return ax - bx;
            return a.type.localeCompare(b.type);
        });

        return arr;
    }, [allGames, t]);

    const updateTypesArrows = useCallback(() => {
        const el = typesTrackRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        const left = el.scrollLeft;
        setCanPrevTypes(left > 2);
        setCanNextTypes(max - left > 2);
    }, []);

    useEffect(() => {
        updateTypesArrows();
        const el = typesTrackRef.current;
        if (!el) return;

        const onScroll = () => updateTypesArrows();
        el.addEventListener("scroll", onScroll, { passive: true });

        const ro = new ResizeObserver(() => updateTypesArrows());
        ro.observe(el);

        return () => {
            el.removeEventListener("scroll", onScroll);
            ro.disconnect();
        };
    }, [updateTypesArrows, typeCards.length]);

    const scrollTypesBy = useCallback((dir) => {
        const el = typesTrackRef.current;
        if (!el) return;
        const step = Math.max(260, Math.round(el.clientWidth * 0.9));
        el.scrollBy({ left: dir * step, behavior: "smooth" });
    }, []);

    const games = useMemo(() => {
        let filtered = Array.isArray(allGames) ? [...allGames] : [];

        if (activeType !== "All") {
            filtered = filtered.filter((g) => detectTypeFromGame(g, t) === activeType);
        }

        if (searchTerm.length >= 2) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((g) => getGameName(g, t).toLowerCase().includes(lower));
        }

        if (sortBy.value === "name-asc") {
            filtered.sort((a, b) => getGameName(a, t).localeCompare(getGameName(b, t)));
        } else if (sortBy.value === "name-desc") {
            filtered.sort((a, b) => getGameName(b, t).localeCompare(getGameName(a, t)));
        } else {
            filtered.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
        }

        return filtered;
    }, [allGames, activeType, searchTerm, sortBy.value, t]);

    const showSkeleton = isLoading || isSearching;

    const MOBILE_PAGE_SIZE = 10;
    const mobileTotalPages = Math.max(1, Math.ceil(games.length / MOBILE_PAGE_SIZE));
    const mobileStart = (mobilePage - 1) * MOBILE_PAGE_SIZE;
    const mobileSlice = games.slice(mobileStart, mobileStart + MOBILE_PAGE_SIZE);

    useEffect(() => {
        setMobilePage(1);
    }, [searchTerm, sortBy.value, allGames.length, activeType]);

    return (
        <section className="mt-8 space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-white">{t("games.types.title")}</div>
                    <div className="flex items-center gap-2">
                        <IconButton label={t("games.types.prev")} onClick={() => scrollTypesBy(-1)} disabled={!canPrevTypes}>
                            <ChevronLeft className="h-5 w-5" />
                        </IconButton>
                        <IconButton label={t("games.types.next")} onClick={() => scrollTypesBy(1)} disabled={!canNextTypes}>
                            <ChevronRight className="h-5 w-5" />
                        </IconButton>
                    </div>
                </div>

                {showSkeleton && <div className="text-sm text-white/60">{t("games.types.loading")}</div>}

                {!showSkeleton && typeCards.length === 0 && <div className="text-sm text-white/60">{t("games.types.empty")}</div>}

                {!showSkeleton && typeCards.length > 0 && (
                    <div className="-mx-0">
                        <div
                            ref={typesTrackRef}
                            className={[
                                "flex gap-4 pb-1 overflow-x-auto",
                                "snap-x snap-mandatory",
                                "[-webkit-overflow-scrolling:touch]",
                                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            ].join(" ")}
                        >
                            {typeCards.map((tc) => (
                                <div key={tc.id} className="snap-start shrink-0 w-[48%] sm:w-[32%] lg:w-[24%]">
                                    <button
                                        type="button"
                                        onClick={() => setActiveType(tc.type)}
                                        className={[
                                            "group rounded-xl overflow-hidden shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.03]",
                                            "bg-background/50 border border-border/50 block w-full text-left",
                                            activeType === tc.type ? "ring-2 ring-primary" : ""
                                        ].join(" ")}
                                    >
                                        <div className="aspect-video relative overflow-hidden bg-white/[0.03]">
                                            <GameImage src={tc.imageURL} alt={tc.type} />
                                        </div>
                                        <div className="p-3 text-center text-white text-sm font-medium truncate">{tc.type}</div>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 text-[11px] text-white/50">{t("games.types.swipeHint")}</div>
                    </div>
                )}
            </div>

            <div>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="text-lg font-semibold text-white min-w-0 truncate">
                            {activeType === "All" ? t("games.list.allGames") : t("games.list.typeGames", { type: activeType })} (
                            {showSkeleton ? allGames.length : games.length})
                        </div>

                        {activeType !== "All" && (
                            <button
                                type="button"
                                onClick={() => setActiveType("All")}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] text-white text-xs font-semibold"
                            >
                                <X className="h-4 w-4" />
                                {t("games.list.clearType")}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex items-center flex-1">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleSearchChange}
                                placeholder={t("games.list.searchPlaceholder")}
                                className="w-full bg-background/30 rounded-lg py-2 pl-10 pr-3 text-sm text-white border border-border focus:outline-none focus:ring-1 focus:ring-primary transition"
                            />
                            <Search className="absolute left-3 h-4 w-4 text-white/70" />
                        </div>

                        <Listbox value={sortBy} onChange={setSortBy}>
                            {({ open }) => (
                                <div className="relative w-48 z-10">
                                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-background/30 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none border border-border text-white transition hover:bg-background/40">
                                        <span className="block truncate text-xs">{sortBy.label}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronDown className={`h-5 w-5 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
                                        </span>
                                    </Listbox.Button>

                                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border">
                                        {sortOptions.map((option) => (
                                            <Listbox.Option
                                                key={option.value}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 px-4 text-xs ${active ? "bg-primary/50 text-white" : "text-white"}`
                                                }
                                                value={option}
                                            >
                                                {({ selected }) => (
                                                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{option.label}</span>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            )}
                        </Listbox>
                    </div>
                </div>

                {showSkeleton && <GamesGridSkeleton count={8} />}

                {!showSkeleton && error && (
                    <div className="text-red-400 text-sm">{error?.message || t("games.list.failedToLoad")}</div>
                )}

                {!showSkeleton && !error && allGames.length > 0 && games.length === 0 && (
                    <div className="text-white/70 text-sm">{t("games.list.noGamesFound")}</div>
                )}

                {!showSkeleton && !error && games.length > 0 && (
                    <div className="hidden md:grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {games.map((g) => (
                            <Link
                                key={g.id}
                                to={`/game/${g.id}`}
                                className="group rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.03] bg-background/50 border border-border/50 block"
                            >
                                <div className="aspect-video relative overflow-hidden bg-white/[0.03]">
                                    <GameImage src={g.imageURL} alt={getGameName(g, t)} />
                                </div>
                                <div className="p-3 text-center text-white text-sm font-medium truncate">{getGameName(g, t)}</div>
                            </Link>
                        ))}
                    </div>
                )}

                {!showSkeleton && !error && games.length > 0 && (
                    <>
                        <div className="md:hidden grid grid-cols-2 gap-4">
                            {mobileSlice.map((g) => (
                                <Link
                                    key={g.id}
                                    to={`/game/${g.id}`}
                                    className="group rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.03] bg-background/50 border border-border/50 block"
                                >
                                    <div className="aspect-video relative overflow-hidden bg-white/[0.03]">
                                        <GameImage src={g.imageURL} alt={getGameName(g, t)} />
                                    </div>
                                    <div className="p-3 text-center text-white text-sm font-medium truncate">{getGameName(g, t)}</div>
                                </Link>
                            ))}
                        </div>

                        <MobilePagination
                            page={mobilePage}
                            totalPages={mobileTotalPages}
                            onPrev={() => setMobilePage((p) => Math.max(1, p - 1))}
                            onNext={() => setMobilePage((p) => Math.min(mobileTotalPages, p + 1))}
                            onJump={(p) => setMobilePage(p)}
                        />
                    </>
                )}

                {!showSkeleton && !error && allGames.length === 0 && (
                    <div className="text-white/70 text-sm">{t("games.list.noGamesFound")}</div>
                )}
            </div>
        </section>
    );
}
