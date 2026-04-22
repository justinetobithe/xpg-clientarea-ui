import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useGamesQuery } from "../../hooks/useGamesQuery";
import { useTranslation } from "react-i18next";

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function useMobileViewportFix(enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const setVars = () => {
            const h = window.innerHeight || 0;
            if (h) {
                document.documentElement.style.setProperty("--app-vh", `${h * 0.01}px`);
            }
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
        if (w < 480) return 8;
        if (w < 640) return 10;
        if (w < 1024) return 12;
        return 16;
    });

    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            const next = w < 480 ? 8 : w < 640 ? 10 : w < 1024 ? 12 : 16;
            setSize(next);
        };

        window.addEventListener("resize", onResize, { passive: true });
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return size;
}

function normalize(value) {
    return String(value || "").toLowerCase().trim();
}

function normalizeCategory(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function slugify(value) {
    return normalizeCategory(value)
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getGameName(game, i18n, t) {
    const name = game?.[i18n.language]?.name || game?.name || game?.title || game?.game_name;
    return name || t("games.untitled");
}

function getGameCategoryName(game) {
    if (typeof game?.category === "string") return normalizeCategory(game.category);
    return normalizeCategory(game?.category?.name);
}

function getGameCategorySlug(game) {
    const categorySlug = game?.category?.slug;
    if (categorySlug) return String(categorySlug).trim().toLowerCase();
    return slugify(getGameCategoryName(game));
}

function getGameCategoryId(game) {
    return String(game?.categoryId || game?.category?.id || "").trim();
}

function isCategoryVisible(category) {
    return category?.showInClientArea !== false;
}

const LOCAL_CATEGORY_IMAGE_MAP = {
    "all-games": "/image/categories/all-games-banner.png",
    ganamos: "/image/categories/ganamos-banner.png",
    "lobby-assets": "/image/categories/lobby-assets-banner.png",
    roulette: "/image/categories/roulette-banner.png",
    blackjack: "/image/categories/blackjack-banner.png",
    baccarat: "/image/categories/baccarat-banner.png",
    "dice-games": "/image/categories/dice-games-banner.png",
    "high-low": "/image/categories/high-low-banner.png",
    poker: "/image/categories/poker-banner.png",
    "dealer-cutouts": "/image/categories/dealer-cutouts.png",
    "turkish-tables": "/image/categories/turkish-table.png",
    "andar-bahar": "/image/categories/high-low-banner.png",
    "dragon-tiger": "/image/categories/high-low-banner.png",
    "sic-bo": "/image/categories/dice-games-banner.png",
    "teen-patti": "/image/categories/poker-banner.png",
    document: "/image/categories/lobby-assets-banner.png",
    "32-cards": "/image/categories/32-cards-banner.png",
};

function getCategoryImage(category) {
    const slug = String(category?.slug || "").trim().toLowerCase();
    if (category?.bannerURL) return category.bannerURL;
    if (LOCAL_CATEGORY_IMAGE_MAP[slug]) return LOCAL_CATEGORY_IMAGE_MAP[slug];
    return "/image/categories/all-games-banner.png";
}

function matchesCategory(game, category) {
    if (!game || !category) return false;

    const gameCategoryId = getGameCategoryId(game);
    const categoryId = String(category.id || "").trim();
    if (gameCategoryId && categoryId && gameCategoryId === categoryId) return true;

    const gameCategorySlug = getGameCategorySlug(game);
    const categorySlug = String(category.slug || "").trim().toLowerCase();
    if (gameCategorySlug && categorySlug && gameCategorySlug === categorySlug) return true;

    const gameCategoryName = normalize(getGameCategoryName(game));
    const categoryName = normalize(category.name);
    return !!gameCategoryName && !!categoryName && gameCategoryName === categoryName;
}

function GameCardSkeleton() {
    return (
        <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 animate-pulse">
            <div className="aspect-[16/11] bg-white/10" />
            <div className="p-3 sm:p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
        </div>
    );
}

function GamesGridSkeleton({ count = 12 }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <GameCardSkeleton key={i} />
            ))}
        </div>
    );
}

function GameImage({ src, alt }) {
    const { t } = useTranslation();
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    if (!src || failed) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white/50 text-[10px] sm:text-xs">
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
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.06]"
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
                "snap-start shrink-0 w-[78%] xs:w-[68%] sm:w-[44%] md:w-[34%] lg:w-[26%]",
                "rounded-xl overflow-hidden border bg-white/[0.03] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] transition-transform duration-200 will-change-transform origin-center",
                "border-white/10 hover:-translate-y-1 hover:scale-[1.02]",
                active ? "ring-2 ring-primary" : ""
            )}
        >
            <div className="relative aspect-[16/9] bg-black/20 overflow-hidden">
                <GameImage src={image} alt={label} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/0 opacity-95" />
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                    <div className="text-white text-xs sm:text-sm font-semibold leading-tight line-clamp-2 text-left">
                        {label}
                    </div>
                    <div className="shrink-0 text-[10px] sm:text-xs text-white/80 bg-black/35 px-2 py-1 rounded-md">
                        {count}
                    </div>
                </div>
            </div>
        </button>
    );
}

function GameCard({ to, imageURL, title, categoryLabel }) {
    return (
        <Link
            to={to}
            className={cx(
                "group relative min-w-0 overflow-hidden rounded-2xl border",
                "border-white/10 bg-white/[0.03] backdrop-blur-sm",
                "shadow-[0_18px_44px_-22px_rgba(0,0,0,0.95)] transition-all duration-300",
                "hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-20px_rgba(255,123,29,0.20)] hover:border-primary/35",
                "active:scale-[0.99]"
            )}
        >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-x-[-20%] top-0 h-full rotate-12 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            </div>

            <div className="relative aspect-[16/11] overflow-hidden bg-black/30">
                <GameImage src={imageURL} alt={title} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute left-3 top-3">
                    <div className="inline-flex items-center rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md">
                        {categoryLabel || "Assets"}
                    </div>
                </div>
            </div>

            <div className="relative p-3 sm:p-4">
                <div className="mb-2 line-clamp-2 text-sm font-extrabold leading-tight text-white text-center sm:text-[15px]">
                    {title}
                </div>
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
            <div className="flex items-center justify-center gap-2 w-full flex-wrap sm:flex-nowrap">
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

                <div className="text-xs text-white/70 px-2 text-center">
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
    const { data, isLoading, error } = useGamesQuery();
    const rawGames = data?.games || [];
    const rawCategories = data?.categories || [];

    useMobileViewportFix(true);

    const pageSize = usePageSize();

    const sortOptions = useMemo(
        () => [
            { value: "order-asc", label: t("games.sort.defaultOrder") },
            { value: "name-asc", label: t("games.sort.nameAsc") },
            { value: "name-desc", label: t("games.sort.nameDesc") },
            { value: "category-asc", label: t("games.sort.typeAsc") || "Category (A → Z)" },
        ],
        [t]
    );

    const visibleCategories = useMemo(() => {
        return Array.isArray(rawCategories) ? rawCategories.filter(isCategoryVisible) : [];
    }, [rawCategories]);

    const dynamicCategories = useMemo(() => {
        const normalizedCategories = Array.isArray(visibleCategories) ? [...visibleCategories] : [];
        const prepared = normalizedCategories.map((category) => {
            const count = rawGames.filter((game) => matchesCategory(game, category)).length;

            return {
                id: String(category.id || "").trim(),
                slug: String(category.slug || slugify(category.name)).trim().toLowerCase(),
                label: normalizeCategory(category.name),
                image: getCategoryImage(category),
                count,
                raw: category,
            };
        });

        const allGamesCategory = prepared.find((c) => c.slug === "all-games" || normalize(c.label) === "all games");
        const ganamosCategory = prepared.find((c) => c.slug === "ganamos");
        const turkishTablesCategory = prepared.find((c) => c.slug === "turkish-tables");

        const rest = prepared
            .filter(
                (c) =>
                    c.id !== allGamesCategory?.id &&
                    c.id !== ganamosCategory?.id &&
                    c.id !== turkishTablesCategory?.id
            )
            .sort((a, b) => a.label.localeCompare(b.label));

        const ordered = [];
        if (allGamesCategory) ordered.push(allGamesCategory);
        if (ganamosCategory) ordered.push(ganamosCategory);
        if (turkishTablesCategory) ordered.push(turkishTablesCategory);
        ordered.push(...rest);

        if (!allGamesCategory) {
            ordered.unshift({
                id: "__all_games__",
                slug: "all-games",
                label: "All Games",
                image: LOCAL_CATEGORY_IMAGE_MAP["all-games"],
                count: rawGames.length,
                raw: null,
            });
        }

        return ordered;
    }, [visibleCategories, rawGames]);

    const allGamesCategoryKey = useMemo(() => {
        const found = dynamicCategories.find((c) => c.slug === "all-games" || normalize(c.label) === "all games");
        return found?.id || "__all_games__";
    }, [dynamicCategories]);

    const availableTypes = useMemo(
        () => [
            "All",
            ...dynamicCategories
                .filter((c) => c.id !== allGamesCategoryKey)
                .map((c) => c.label),
        ],
        [dynamicCategories, allGamesCategoryKey]
    );

    const [activeCategory, setActiveCategory] = useState("__all_games__");
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

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        setActiveCategory(allGamesCategoryKey);
    }, [allGamesCategoryKey]);

    useEffect(() => {
        if (activeCategory !== allGamesCategoryKey && !dynamicCategories.some((c) => c.id === activeCategory)) {
            setActiveCategory(allGamesCategoryKey);
        }
    }, [activeCategory, dynamicCategories, allGamesCategoryKey]);

    useEffect(() => {
        if (activeType !== "All" && !availableTypes.includes(activeType)) {
            setActiveType("All");
        }
    }, [activeType, availableTypes]);

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
    }, [updateCatArrows, dynamicCategories.length]);

    const scrollCatsBy = useCallback((dir) => {
        const el = catTrackRef.current;
        if (!el) return;
        const step = Math.max(220, Math.round(el.clientWidth * 0.9));
        el.scrollBy({ left: dir * step, behavior: "smooth" });
    }, []);

    const filteredGames = useMemo(() => {
        let list = Array.isArray(rawGames) ? [...rawGames] : [];

        if (activeCategory !== allGamesCategoryKey) {
            const selectedCategory = dynamicCategories.find((c) => c.id === activeCategory)?.raw || null;
            if (selectedCategory) {
                list = list.filter((g) => matchesCategory(g, selectedCategory));
            }
        }

        if (activeType !== "All") {
            list = list.filter((g) => normalize(getGameCategoryName(g)) === normalize(activeType));
        }

        if (searchTerm.length >= 2) {
            const lower = searchTerm.toLowerCase();
            list = list.filter((g) => {
                const name = normalize(getGameName(g, i18n, t));
                const category = normalize(getGameCategoryName(g));
                return name.includes(lower) || category.includes(lower);
            });
        }

        if (sortBy.value === "name-asc") {
            list.sort((a, b) => getGameName(a, i18n, t).localeCompare(getGameName(b, i18n, t)));
        } else if (sortBy.value === "name-desc") {
            list.sort((a, b) => getGameName(b, i18n, t).localeCompare(getGameName(a, i18n, t)));
        } else if (sortBy.value === "category-asc") {
            list.sort((a, b) => {
                const ac = getGameCategoryName(a);
                const bc = getGameCategoryName(b);
                const byCategory = ac.localeCompare(bc);
                if (byCategory !== 0) return byCategory;
                return getGameName(a, i18n, t).localeCompare(getGameName(b, i18n, t));
            });
        } else {
            list.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
        }

        return list;
    }, [rawGames, activeCategory, activeType, searchTerm, sortBy.value, dynamicCategories, allGamesCategoryKey, i18n, t]);

    const showSkeleton = isLoading || isSearching;

    useEffect(() => {
        setPage(1);
    }, [activeCategory, activeType, searchTerm, sortBy.value, pageSize, rawGames.length]);

    const totalPages = Math.max(1, Math.ceil(filteredGames.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pageSlice = filteredGames.slice(start, start + pageSize);

    const clearAll = () => {
        setActiveCategory(allGamesCategoryKey);
        setActiveType("All");
        setInputValue("");
        setSearchTerm("");
        setIsSearching(false);
        setPage(1);
    };

    return (
        <section className="mt-6 sm:mt-8 space-y-6 sm:space-y-8 min-w-0">
            <div className="min-w-0">
                <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="text-base sm:text-lg font-semibold text-white">
                        {t("games.categories.title") || "Categories"}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                    <div className="pt-2">
                        <div
                            ref={catTrackRef}
                            className={cx(
                                "flex gap-3 sm:gap-4 px-1 pt-2 pb-3 overflow-x-auto min-w-0",
                                "snap-x snap-mandatory",
                                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            )}
                            style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
                        >
                            {dynamicCategories.map((c) => (
                                <CategoryCard
                                    key={c.id}
                                    active={activeCategory === c.id}
                                    label={c.label}
                                    image={c.image}
                                    count={c.count}
                                    onClick={() => setActiveCategory(c.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {showSkeleton && <div className="text-sm text-white/60">{t("games.categories.loading") || "Loading..."}</div>}
            </div>

            <div className="min-w-0">
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex flex-col gap-2 min-w-0">
                        <div className="min-w-0 max-w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                            <div className="text-base sm:text-lg font-semibold text-white leading-snug break-words">
                                {(t("games.list.title") || "Games")}:{" "}
                                <span className="text-white/85">
                                    {dynamicCategories.find((c) => c.id === activeCategory)?.label || "All Games"}
                                </span>
                                <span className="text-white/60"> · </span>
                                <span className="text-white/85">
                                    {activeType === "All" ? t("games.types.all") || "All Types" : activeType}
                                </span>
                                <span className="text-white/60"> · </span>
                                <span className="text-white/85">{showSkeleton ? rawGames.length : filteredGames.length}</span>
                            </div>
                        </div>

                        {(activeCategory !== allGamesCategoryKey || activeType !== "All" || inputValue) && (
                            <div>
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] text-white text-xs font-semibold"
                                >
                                    <X className="h-4 w-4" />
                                    {t("games.list.clearAll") || "Clear"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div
                        className="flex flex-col gap-3 w-full"
                        style={{
                            paddingLeft: "env(safe-area-inset-left)",
                            paddingRight: "env(safe-area-inset-right)",
                        }}
                    >
                        <div className="relative flex items-center w-full min-w-0">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => {
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
                                }}
                                placeholder={t("games.list.searchPlaceholder") || "Search games..."}
                                className="w-full min-w-0 bg-white/[0.03] rounded-xl py-3 pl-10 pr-10 text-sm text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary transition"
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full items-start">
                            <Listbox value={activeType} onChange={(v) => setActiveType(v)}>
                                {({ open }) => (
                                    <div className={cx("relative isolate w-full", open ? "z-[70]" : "z-[20]")}>
                                        <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white/[0.03] py-3 pl-3 pr-10 text-left shadow-md focus:outline-none border border-white/10 text-white transition hover:bg-white/[0.05]">
                                            <span className="block truncate text-sm">
                                                {activeType === "All" ? t("games.types.all") || "All Types" : activeType}
                                            </span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronDown className={cx("h-5 w-5 text-gray-400 transition", open ? "rotate-180" : "")} />
                                            </span>
                                        </Listbox.Button>

                                        <Listbox.Options className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto overflow-x-hidden rounded-xl bg-[#151620] py-1 text-base shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 focus:outline-none sm:text-sm">
                                            {availableTypes.map((tp) => (
                                                <Listbox.Option
                                                    key={tp}
                                                    className={({ active }) =>
                                                        cx(
                                                            "relative cursor-default select-none py-3 px-4 text-sm leading-tight",
                                                            active ? "bg-primary/30 text-white" : "text-white"
                                                        )
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
                                    <div className={cx("relative isolate w-full", open ? "z-[70]" : "z-[10]")}>
                                        <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white/[0.03] py-3 pl-3 pr-10 text-left shadow-md focus:outline-none border border-white/10 text-white transition hover:bg-white/[0.05]">
                                            <span className="block truncate text-sm">{sortBy.label}</span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronDown className={cx("h-5 w-5 text-gray-400 transition", open ? "rotate-180" : "")} />
                                            </span>
                                        </Listbox.Button>

                                        <Listbox.Options className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto overflow-x-hidden rounded-xl bg-[#151620] py-1 text-base shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 focus:outline-none sm:text-sm">
                                            {sortOptions.map((option) => (
                                                <Listbox.Option
                                                    key={option.value}
                                                    className={({ active }) =>
                                                        cx(
                                                            "relative cursor-default select-none py-3 px-4 text-sm leading-tight",
                                                            active ? "bg-primary/30 text-white" : "text-white"
                                                        )
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
                </div>

                {showSkeleton && <GamesGridSkeleton count={pageSize} />}

                {!showSkeleton && error && <div className="text-red-400 text-sm">{error?.message || t("games.list.failedToLoad")}</div>}

                {!showSkeleton && !error && rawGames.length > 0 && filteredGames.length === 0 && (
                    <div className="text-white/70 text-sm">{t("games.list.noGamesFound") || "No games found."}</div>
                )}

                {!showSkeleton && !error && filteredGames.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 min-w-0">
                            {pageSlice.map((game) => (
                                <GameCard
                                    key={game.id}
                                    to={`/game/${game.id}`}
                                    imageURL={game.imageURL}
                                    title={getGameName(game, i18n, t)}
                                    categoryLabel={getGameCategoryName(game)}
                                />
                            ))}
                        </div>

                        <Pagination
                            page={safePage}
                            totalPages={totalPages}
                            onPrev={() => setPage((p) => Math.max(1, p - 1))}
                            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                            onJump={(p) => setPage(p)}
                        />
                    </>
                )}

                {!showSkeleton && !error && rawGames.length === 0 && (
                    <div className="text-white/70 text-sm">{t("games.list.noGamesFound") || "No games found."}</div>
                )}
            </div>
        </section>
    );
}