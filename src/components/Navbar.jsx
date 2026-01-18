import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dialog, Transition, Menu as HMenu } from "@headlessui/react";
import {
    Menu,
    Search,
    User,
    X,
    LogOut,
    Settings,
    LayoutGrid,
    Loader2,
    ChevronRight,
    Languages,
    Check,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCollectionsStore } from "../store/collectionsStore";
import { useLiveGamesStore } from "../store/liveGamesStore";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useTranslation } from "react-i18next";
import * as Flags from "country-flag-icons/react/3x2";
import { LANGUAGES, DEFAULT_LANG_CODE } from "../languages";

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function FlagIcon({ country, className }) {
    const Key = String(country || "").toUpperCase();
    const Comp = Flags?.[Key];
    if (!Comp) return <div className={cx("h-4 w-6 rounded-sm bg-white/10", className)} />;
    return <Comp className={className} />;
}

function MobileSectionTitle({ children }) {
    return <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/45">{children}</div>;
}

function MobileRow({ label, onClick, right }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "w-full text-left px-2 py-3 rounded-xl transition",
                "hover:bg-white/[0.06] active:bg-white/[0.08]",
                "flex items-center justify-between gap-3"
            )}
        >
            <span className="text-[18px] font-semibold text-white">{label}</span>
            {right || <ChevronRight className="h-5 w-5 text-white/35" />}
        </button>
    );
}

function DesktopLanguageMenu({ t, selectedLang, onChangeLanguage }) {
    return (
        <HMenu as="div" className="relative">
            <HMenu.Button
                className={cx(
                    "group flex items-center gap-2 rounded-xl border transition",
                    "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
                    "px-3 py-2.5"
                )}
                title={t("navbar.language.title")}
                type="button"
            >
                <FlagIcon country={selectedLang?.country} className="rounded-sm h-[18px] w-7" />
                <span className="text-sm font-semibold text-white/90">{selectedLang?.code?.toUpperCase()}</span>
                <Languages className="h-4 w-4 text-white/55 group-hover:text-white/75" />
            </HMenu.Button>

            <Transition
                as={Fragment}
                enter="transition duration-150 ease-out"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-100 ease-in"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
            >
                <HMenu.Items className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-white/10 focus:outline-none">
                    <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/50 font-bold">
                            {t("navbar.language.header")}
                        </div>
                        <div className="text-[13px] text-white/70 mt-1">{t("navbar.language.subtitle")}</div>
                    </div>

                    <div className="max-h-80 overflow-auto p-2">
                        {LANGUAGES.map((l) => {
                            const active = l.code === selectedLang?.code;
                            return (
                                <HMenu.Item key={l.code}>
                                    {({ active: hover }) => (
                                        <button
                                            type="button"
                                            onClick={() => onChangeLanguage(l.code)}
                                            className={cx(
                                                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition",
                                                hover ? "bg-white/[0.06]" : "",
                                                active ? "bg-primary/10" : ""
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FlagIcon country={l.country} className="h-5 w-8 rounded-md shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-white truncate">{l.label}</div>
                                                    <div className="text-xs text-white/55">{l.code.toUpperCase()}</div>
                                                </div>
                                            </div>

                                            {active ? (
                                                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-primary text-black">
                                                    {t("navbar.language.active")}
                                                </span>
                                            ) : null}
                                        </button>
                                    )}
                                </HMenu.Item>
                            );
                        })}
                    </div>
                </HMenu.Items>
            </Transition>
        </HMenu>
    );
}

function MobileLanguagePickerModal({ open, onClose, t, selectedLang, onSelect }) {
    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-end justify-center p-3">
                    <Transition.Child
                        as={Fragment}
                        enter="transition duration-200 ease-out"
                        enterFrom="translate-y-6 opacity-0"
                        enterTo="translate-y-0 opacity-100"
                        leave="transition duration-150 ease-in"
                        leaveFrom="translate-y-0 opacity-100"
                        leaveTo="translate-y-6 opacity-0"
                    >
                        <Dialog.Panel className="w-full max-w-sm rounded-3xl bg-[#151620] border border-white/10 shadow-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <Dialog.Title className="text-white font-semibold text-lg">
                                        {t("navbar.language.header")}
                                    </Dialog.Title>
                                    <div className="text-white/60 text-sm mt-0.5">{t("navbar.language.subtitle")}</div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-full p-2 text-white/70 hover:bg-white/10"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-2 max-h-[70vh] overflow-auto">
                                {LANGUAGES.map((l) => {
                                    const active = l.code === selectedLang?.code;
                                    return (
                                        <button
                                            key={l.code}
                                            type="button"
                                            onClick={() => onSelect(l.code)}
                                            className={cx(
                                                "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-2xl text-left transition",
                                                active ? "bg-primary/15" : "hover:bg-white/[0.06]"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FlagIcon country={l.country} className="h-5 w-8 rounded-md shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-white truncate">{l.label}</div>
                                                    <div className="text-xs text-white/55">{l.code.toUpperCase()}</div>
                                                </div>
                                            </div>

                                            {active ? (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-primary text-black">
                                                        {t("navbar.language.active")}
                                                    </span>
                                                    <Check className="h-4 w-4 text-primary" />
                                                </div>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}

export default function Navbar() {
    const { t, i18n } = useTranslation();

    const [open, setOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const [searchNavLoading, setSearchNavLoading] = useState(false);

    const [langPickerOpen, setLangPickerOpen] = useState(false);

    const timerRef = useRef(null);

    const { pathname } = useLocation();
    const nav = useNavigate();

    const clearUser = useAuthStore((s) => s.clearUser);
    const user = useAuthStore((s) => s.user);
    const userId = user?.uid;

    const collections = useCollectionsStore((s) => s.collections);
    const startUserCollectionsListener = useCollectionsStore((s) => s.startUserCollectionsListener);
    const stopUserCollectionsListener = useCollectionsStore((s) => s.stopUserCollectionsListener);
    const clearCollectionsState = useCollectionsStore((s) => s.clearCollectionsState);
    const toggleDrawer = useCollectionsStore((s) => s.toggleDrawer);

    const liveGames = useLiveGamesStore((s) => s.items);
    const liveGamesLoading = useLiveGamesStore((s) => s.loading);
    const startLiveGamesListener = useLiveGamesStore((s) => s.startLiveGamesListener);
    const stopLiveGamesListener = useLiveGamesStore((s) => s.stopLiveGamesListener);

    const xpgLiveBase = (import.meta.env.VITE_XPG_LIVE_URL || "https://xpg.live").replace(/\/+$/, "");

    const resolvedLang = (i18n.resolvedLanguage || i18n.language || DEFAULT_LANG_CODE || "en").split("-")[0];

    const selectedLang = useMemo(() => {
        return (
            LANGUAGES.find((l) => l.code === resolvedLang) ||
            LANGUAGES.find((l) => l.code === DEFAULT_LANG_CODE) ||
            LANGUAGES[0]
        );
    }, [resolvedLang]);

    const changeLanguage = async (code) => {
        try {
            await i18n.changeLanguage(code);
        } catch { }
    };

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY || 0);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setScrollY(0);
        window.scrollTo(0, 0);
    }, [pathname]);

    useEffect(() => {
        if (userId) {
            startUserCollectionsListener(userId);
            return;
        }
        stopUserCollectionsListener();
        clearCollectionsState();
    }, [userId, startUserCollectionsListener, stopUserCollectionsListener, clearCollectionsState]);

    useEffect(() => {
        startLiveGamesListener(30);
        return () => stopLiveGamesListener();
    }, [startLiveGamesListener, stopLiveGamesListener]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const collectionsCount = collections?.length || 0;
    const isTop = scrollY < 10;

    const onLogout = async () => {
        if (logoutLoading) return;
        setLogoutLoading(true);
        try {
            await signOut(auth);
            stopUserCollectionsListener();
            clearCollectionsState();
            clearUser();
            nav("/login");
        } finally {
            setLogoutLoading(false);
        }
    };

    const goSearch = (closeMobile = false) => {
        const q = String(searchValue || "").trim();
        if (!q) return;
        if (searchNavLoading || logoutLoading) return;

        if (timerRef.current) clearTimeout(timerRef.current);

        setSearchNavLoading(true);
        timerRef.current = setTimeout(() => {
            if (closeMobile) setOpen(false);
            nav(`/search?q=${encodeURIComponent(q)}`);
            setSearchNavLoading(false);
        }, 450);
    };

    const openLiveGame = useCallback(
        (id) => {
            if (!id) return;
            window.open(`${xpgLiveBase}/live-games/${id}`, "_blank", "noopener,noreferrer");
        },
        [xpgLiveBase]
    );

    const mobilePrimaryLinks = useMemo(
        () => [
            { label: t("navbar.links.home"), to: "/" },
            { label: t("navbar.links.announcements"), to: "/announcements" },
            { label: t("navbar.links.apiDocs"), to: "/game/Pw1UU7RW513n9SNsPXPQ" },
        ],
        [t]
    );

    const mobileOtherLinks = useMemo(
        () => [
            { label: t("navbar.links.announcements"), to: "/announcements" },
            { label: t("navbar.links.apiDocs"), to: "/game/Pw1UU7RW513n9SNsPXPQ" },
            { label: t("navbar.links.settings"), to: "/settings" },
        ],
        [t]
    );

    return (
        <>
            <header
                className={cx(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    isTop ? "bg-transparent" : "bg-black/80 backdrop-blur-md shadow-lg"
                )}
            >
                <div className="px-4 md:px-10 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setOpen(true)} className="md:hidden text-white" type="button">
                            <Menu size={26} />
                        </button>

                        <Link to="/" className="flex items-center gap-3 shrink-0">
                            <img src="/image/logo-white.png" className="h-8 md:h-11" alt="logo" />
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className={cx(
                                    "text-base font-semibold tracking-wide transition hover:opacity-80",
                                    pathname === "/" ? "text-primary" : "text-white"
                                )}
                            >
                                {t("navbar.links.home")}
                            </Link>

                            <Link
                                to="/announcements"
                                className={cx(
                                    "text-base font-semibold tracking-wide transition hover:opacity-80",
                                    pathname === "/announcements" ? "text-primary" : "text-white"
                                )}
                            >
                                {t("navbar.links.announcements")}
                            </Link>

                            <Link
                                to="/game/Pw1UU7RW513n9SNsPXPQ"
                                className={cx(
                                    "text-base font-semibold tracking-wide transition hover:opacity-80",
                                    pathname === "/game/Pw1UU7RW513n9SNsPXPQ" ? "text-primary" : "text-white"
                                )}
                            >
                                {t("navbar.links.apiDocs")}
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <button
                            onClick={toggleDrawer}
                            className="md:hidden relative flex items-center justify-center bg-primary text-primary-foreground h-9 w-9 rounded-md"
                            type="button"
                        >
                            <LayoutGrid size={18} />
                            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                                {collectionsCount}
                            </span>
                        </button>

                        <button
                            onClick={toggleDrawer}
                            className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-md text-sm"
                            type="button"
                        >
                            {t("navbar.collections")}
                            <span className="bg-black text-white text-xs rounded-full px-2">{collectionsCount}</span>
                        </button>

                        <div className="hidden md:flex items-center bg-white rounded-md overflow-hidden">
                            <input
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") goSearch(false);
                                }}
                                disabled={logoutLoading}
                                className="px-3 py-2 text-sm text-black outline-none w-60 disabled:opacity-70"
                                placeholder={t("navbar.searchPlaceholder")}
                            />

                            <button
                                type="button"
                                onClick={() => goSearch(false)}
                                disabled={logoutLoading || !String(searchValue || "").trim()}
                                className="px-2 text-black disabled:opacity-70"
                            >
                                {searchNavLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
                            </button>
                        </div>

                        <div className="hidden md:block">
                            <DesktopLanguageMenu t={t} selectedLang={selectedLang} onChangeLanguage={changeLanguage} />
                        </div>

                        <HMenu as="div" className="relative hidden md:block">
                            <HMenu.Button className="text-white flex items-center gap-2" type="button">
                                <User size={22} />
                            </HMenu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition duration-150 ease-out"
                                enterFrom="opacity-0 translate-y-1"
                                enterTo="opacity-100 translate-y-0"
                                leave="transition duration-100 ease-in"
                                leaveFrom="opacity-100 translate-y-0"
                                leaveTo="opacity-0 translate-y-1"
                            >
                                <HMenu.Items className="absolute right-0 mt-3 w-56 rounded-xl bg-card shadow-xl p-2 focus:outline-none">
                                    <div className="px-3 py-2 text-sm text-white/70">
                                        {user?.displayName || user?.email || t("navbar.accountFallback")}
                                    </div>

                                    <HMenu.Item>
                                        {({ active }) => (
                                            <Link
                                                to="/settings"
                                                className={cx(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white",
                                                    active ? "bg-white/5" : ""
                                                )}
                                            >
                                                <Settings size={16} /> {t("navbar.links.settings")}
                                            </Link>
                                        )}
                                    </HMenu.Item>

                                    <HMenu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={onLogout}
                                                disabled={logoutLoading}
                                                className={cx(
                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white disabled:opacity-60",
                                                    active ? "bg-white/5" : ""
                                                )}
                                                type="button"
                                            >
                                                {logoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut size={16} />}
                                                {t("navbar.logout")}
                                            </button>
                                        )}
                                    </HMenu.Item>
                                </HMenu.Items>
                            </Transition>
                        </HMenu>
                    </div>
                </div>
            </header>

            <Transition show={open} as={Fragment}>
                <Dialog
                    onClose={(v) => {
                        setOpen(v);
                        if (!v) setLangPickerOpen(false);
                    }}
                    className="relative z-50 md:hidden"
                >
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/70" />
                    </Transition.Child>

                    <Transition.Child
                        as={Fragment}
                        enter="transition duration-200 ease-out"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition duration-200 ease-in"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-sm bg-[#1f2230] text-white shadow-2xl overflow-hidden">
                            <div className="px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src="/image/logo-white.png" className="h-8" alt="logo" />
                                    <div className="text-white/70 text-sm font-semibold">{t("navbar.clientArea")}</div>
                                </div>

                                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white" type="button">
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="px-6 pb-6 space-y-6 overflow-y-auto h-[calc(100vh-76px)]">
                                <div className="space-y-2">
                                    <MobileSectionTitle>{t("navbar.language.header")}</MobileSectionTitle>

                                    <button
                                        type="button"
                                        onClick={() => setLangPickerOpen(true)}
                                        className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 hover:bg-white/[0.06] transition"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FlagIcon country={selectedLang?.country} className="h-5 w-8 rounded-md shrink-0" />
                                            <div className="min-w-0 text-left">
                                                <div className="text-sm font-semibold text-white truncate">{selectedLang?.label}</div>
                                                <div className="text-xs text-white/55">{selectedLang?.code?.toUpperCase()}</div>
                                            </div>
                                        </div>

                                        <div className="inline-flex items-center gap-2">
                                            <Languages className="h-4 w-4 text-white/60" />
                                            <ChevronRight className="h-5 w-5 text-white/35" />
                                        </div>
                                    </button>
                                </div>

                                <div className="h-px bg-white/10" />

                                <div className="space-y-1">
                                    {mobilePrimaryLinks.map((l) => (
                                        <MobileRow
                                            key={l.to}
                                            label={l.label}
                                            onClick={() => {
                                                setOpen(false);
                                                nav(l.to);
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="h-px bg-white/10" />

                                <div className="space-y-2">
                                    <MobileSectionTitle>{t("navbar.mobile.liveGames")}</MobileSectionTitle>

                                    {liveGamesLoading ? (
                                        <div className="text-white/60 text-sm px-2 py-2">{t("navbar.loading")}</div>
                                    ) : null}

                                    {!liveGamesLoading && (!liveGames || liveGames.length === 0) ? (
                                        <div className="text-white/60 text-sm px-2 py-2">{t("navbar.mobile.noLiveGames")}</div>
                                    ) : null}

                                    {!liveGamesLoading && liveGames?.length > 0 ? (
                                        <div className="space-y-1">
                                            {liveGames.slice(0, 12).map((lg) => (
                                                <button
                                                    key={lg.id}
                                                    type="button"
                                                    onClick={() => openLiveGame(lg.id)}
                                                    className="w-full text-left px-2 py-3 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.08] transition flex items-center justify-between gap-3"
                                                >
                                                    <span className="text-white font-semibold text-[16px] truncate">
                                                        {lg.name || t("games.untitled")}
                                                    </span>
                                                    <span className="text-[11px] text-white/55 px-2 py-1 rounded-full bg-black/30 shrink-0">
                                                        {t("navbar.open")}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="h-px bg-white/10" />

                                <div className="space-y-2">
                                    <MobileSectionTitle>{t("navbar.mobile.other")}</MobileSectionTitle>

                                    <div className="space-y-1">
                                        {mobileOtherLinks.map((l) => (
                                            <MobileRow
                                                key={l.to}
                                                label={l.label}
                                                onClick={() => {
                                                    setOpen(false);
                                                    nav(l.to);
                                                }}
                                            />
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOpen(false);
                                                toggleDrawer();
                                            }}
                                            className="w-full text-left px-2 py-3 rounded-xl hover:bg-primary/10 active:bg-primary/15 transition flex items-center justify-between gap-3"
                                        >
                                            <span className="text-primary font-bold text-[16px]">{t("navbar.collections")}</span>
                                            <span className="bg-primary text-black text-xs rounded-full px-2.5 py-1">{collectionsCount}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={onLogout}
                                            disabled={logoutLoading}
                                            className={cx(
                                                "w-full text-left px-2 py-3 rounded-xl transition flex items-center gap-3",
                                                "hover:bg-white/[0.06] active:bg-white/[0.08]",
                                                logoutLoading ? "opacity-60" : ""
                                            )}
                                        >
                                            {logoutLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut size={18} />}
                                            <span className="text-white/90 font-semibold text-[16px]">{t("navbar.logout")}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <MobileLanguagePickerModal
                                open={langPickerOpen}
                                onClose={() => setLangPickerOpen(false)}
                                t={t}
                                selectedLang={selectedLang}
                                onSelect={async (code) => {
                                    await changeLanguage(code);
                                    setLangPickerOpen(false);
                                }}
                            />
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </>
    );
}
