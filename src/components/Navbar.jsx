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
    ChevronRight
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCollectionsStore } from "../store/collectionsStore";
import { useLiveGamesStore } from "../store/liveGamesStore";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const [searchNavLoading, setSearchNavLoading] = useState(false);

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
            { label: "Home", to: "/" },
            { label: "Announcements", to: "/announcements" },
            { label: "API Documents", to: "/game/Pw1UU7RW513n9SNsPXPQ" }
        ],
        []
    );

    const mobileOtherLinks = useMemo(
        () => [
            { label: "Announcements", to: "/announcements" },
            { label: "API Documents", to: "/game/Pw1UU7RW513n9SNsPXPQ" },
            { label: "Settings", to: "/settings" }
        ],
        []
    );

    const MobileRow = ({ label, onClick, right }) => (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full text-left px-2 py-3 rounded-xl transition",
                "hover:bg-white/[0.06] active:bg-white/[0.08]",
                "flex items-center justify-between gap-3"
            ].join(" ")}
        >
            <span className="text-[18px] font-semibold text-white">{label}</span>
            {right || <ChevronRight className="h-5 w-5 text-white/35" />}
        </button>
    );

    const MobileSectionTitle = ({ children }) => (
        <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/45">{children}</div>
    );

    return (
        <>
            <header
                className={[
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    isTop ? "bg-transparent" : "bg-black/80 backdrop-blur-md shadow-lg"
                ].join(" ")}
            >
                <div className="px-4 md:px-10 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setOpen(true)} className="md:hidden text-white">
                            <Menu size={26} />
                        </button>

                        <Link to="/" className="flex items-center gap-3 shrink-0">
                            <img src="/image/logo-white.png" className="h-8 md:h-11" alt="logo" />
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className={[
                                    "text-base font-semibold tracking-wide transition hover:opacity-80",
                                    pathname === "/" ? "text-primary" : "text-white"
                                ].join(" ")}
                            >
                                Home
                            </Link>

                            <Link
                                to="/announcements"
                                className={[
                                    "text-base font-semibold tracking-wide transition hover:opacity-80",
                                    pathname === "/announcements" ? "text-primary" : "text-white"
                                ].join(" ")}
                            >
                                Announcements
                            </Link>

                            <Link
                                to="/game/Pw1UU7RW513n9SNsPXPQ"
                                className={[
                                    "text-base font-semibold tracking-wide transition hover:opacity-80",
                                    pathname === "/game/Pw1UU7RW513n9SNsPXPQ" ? "text-primary" : "text-white"
                                ].join(" ")}
                            >
                                API Documents
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <button
                            onClick={toggleDrawer}
                            className="md:hidden relative flex items-center justify-center bg-primary text-primary-foreground h-9 w-9 rounded-md"
                        >
                            <LayoutGrid size={18} />
                            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                                {collectionsCount}
                            </span>
                        </button>

                        <button
                            onClick={toggleDrawer}
                            className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-md text-sm"
                        >
                            Collections
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
                                placeholder="Search..."
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

                        <HMenu as="div" className="relative hidden md:block">
                            <HMenu.Button className="text-white flex items-center gap-2">
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
                                    <div className="px-3 py-2 text-sm text-white/70">{user?.displayName || user?.email || "Account"}</div>

                                    <HMenu.Item>
                                        {({ active }) => (
                                            <Link
                                                to="/settings"
                                                className={[
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white",
                                                    active ? "bg-white/5" : ""
                                                ].join(" ")}
                                            >
                                                <Settings size={16} /> Settings
                                            </Link>
                                        )}
                                    </HMenu.Item>

                                    <HMenu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={onLogout}
                                                disabled={logoutLoading}
                                                className={[
                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white",
                                                    active ? "bg-white/5" : "",
                                                    "disabled:opacity-60"
                                                ].join(" ")}
                                            >
                                                {logoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut size={16} />}
                                                Logout
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
                <Dialog onClose={setOpen} className="relative z-50 md:hidden">
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
                        <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-sm bg-[#1f2230] text-white shadow-2xl">
                            <div className="px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src="/image/logo-white.png" className="h-8" alt="logo" />
                                    <div className="text-white/70 text-sm font-semibold">Client Area</div>
                                </div>

                                <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="px-6 pb-6 space-y-6">
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
                                    <MobileSectionTitle>Live Games</MobileSectionTitle>

                                    {liveGamesLoading && <div className="text-white/60 text-sm px-2 py-2">Loading...</div>}

                                    {!liveGamesLoading && (!liveGames || liveGames.length === 0) && (
                                        <div className="text-white/60 text-sm px-2 py-2">No live games found.</div>
                                    )}

                                    {!liveGamesLoading && liveGames?.length > 0 && (
                                        <div className="space-y-1">
                                            {liveGames.slice(0, 12).map((lg) => (
                                                <button
                                                    key={lg.id}
                                                    type="button"
                                                    onClick={() => openLiveGame(lg.id)}
                                                    className="w-full text-left px-2 py-3 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.08] transition flex items-center justify-between gap-3"
                                                >
                                                    <span className="text-white font-semibold text-[16px] truncate">{lg.name || "Untitled"}</span>
                                                    <span className="text-[11px] text-white/55 px-2 py-1 rounded-full bg-black/30 shrink-0">
                                                        Open
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-white/10" />

                                <div className="space-y-2">
                                    <MobileSectionTitle>Other</MobileSectionTitle>

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
                                            <span className="text-primary font-bold text-[16px]">Collections</span>
                                            <span className="bg-primary text-black text-xs rounded-full px-2.5 py-1">{collectionsCount}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={onLogout}
                                            disabled={logoutLoading}
                                            className={[
                                                "w-full text-left px-2 py-3 rounded-xl transition flex items-center gap-3",
                                                "hover:bg-white/[0.06] active:bg-white/[0.08]",
                                                logoutLoading ? "opacity-60" : ""
                                            ].join(" ")}
                                        >
                                            {logoutLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut size={18} />}
                                            <span className="text-white/90 font-semibold text-[16px]">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </>
    );
}
