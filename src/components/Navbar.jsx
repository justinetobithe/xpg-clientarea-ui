import { Fragment, useEffect, useState } from "react";
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
    Loader2
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCollectionsStore } from "../store/collectionsStore";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const games = [
    "Baccarat",
    "Blackjack",
    "Roulette",
    "Andar Bahar",
    "Teen Patti",
    "32 Cards",
    "Sic Bo",
    "Dragon Tiger"
];

const other = ["Announcements", "Settings", "What’s New?"];

const brands = [
    "XPG Live",
    "XPG Slots",
    "XPG Virtuals",
    "XPG White Label",
    "EU Studios",
    "HTML5 Client"
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const { pathname } = useLocation();
    const nav = useNavigate();
    const clearUser = useAuthStore((s) => s.clearUser);
    const user = useAuthStore((s) => s.user);
    const userId = user?.uid;

    const collections = useCollectionsStore((s) => s.collections);
    const startUserCollectionsListener = useCollectionsStore(
        (s) => s.startUserCollectionsListener
    );
    const stopUserCollectionsListener = useCollectionsStore(
        (s) => s.stopUserCollectionsListener
    );
    const toggleDrawer = useCollectionsStore((s) => s.toggleDrawer);

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
        if (!userId) return;
        startUserCollectionsListener(userId);
        return () => stopUserCollectionsListener();
    }, [userId, startUserCollectionsListener, stopUserCollectionsListener]);

    const navItem = (to, label) => (
        <Link
            to={to}
            className={`text-base font-semibold tracking-wide transition hover:opacity-80 ${pathname === to ? "text-primary" : "text-white"
                }`}
        >
            {label}
        </Link>
    );

    const onLogout = async () => {
        if (logoutLoading) return;
        setLogoutLoading(true);
        try {
            await signOut(auth);
            clearUser();
            nav("/login");
        } finally {
            setLogoutLoading(false);
        }
    };

    const isTop = scrollY < 10;
    const collectionsCount = collections?.length || 0;

    return (
        <>
            {logoutLoading && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
                    <div className="flex flex-col items-center gap-3 rounded-lg bg-[#1c1d26] px-6 py-5 border border-border">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                        <span className="text-sm text-white/90">Logging out...</span>
                    </div>
                </div>
            )}

            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isTop
                        ? "bg-transparent border-b border-transparent shadow-none"
                        : "bg-black/80 backdrop-blur-md border-b border-border shadow-lg"
                    }`}
            >
                <div className="px-4 md:px-10 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setOpen(true)}
                            className="md:hidden text-white"
                        >
                            <Menu size={26} />
                        </button>

                        <Link to="/" className="flex items-center gap-3 shrink-0">
                            <img src="/image/logo-white.png" className="h-8 md:h-11" />
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            {navItem("/", "Home")}
                            {navItem("/announcements", "Announcement")}
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
                            <span className="bg-black text-white text-xs rounded-full px-2">
                                {collectionsCount}
                            </span>
                        </button>

                        <div className="hidden md:flex items-center bg-white rounded-md overflow-hidden">
                            <input
                                className="px-3 py-2 text-sm text-black outline-none w-60"
                                placeholder="Search..."
                            />
                            <div className="px-2 text-black">
                                <Search size={16} />
                            </div>
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
                                <HMenu.Items className="absolute right-0 mt-3 w-56 rounded-xl border border-border bg-card shadow-xl p-2 focus:outline-none">
                                    <div className="px-3 py-2 text-sm text-white/70">
                                        {user?.displayName || user?.email || "Account"}
                                    </div>

                                    <HMenu.Item>
                                        {({ active }) => (
                                            <Link
                                                to="/settings"
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${active ? "bg-white/5" : ""
                                                    }`}
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
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${active ? "bg-white/5" : ""
                                                    } disabled:opacity-60`}
                                            >
                                                {logoutLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <LogOut size={16} />
                                                )}
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
                        <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-sm bg-[#23232f] text-white shadow-2xl">
                            <div className="px-6 py-5 flex items-center justify-between border-b border-white/10">
                                <img src="/image/logo-white.png" className="h-8" />
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-white/80 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-7">
                                <div className="space-y-3">
                                    <button
                                        className="w-full text-left font-semibold text-primary text-2xl"
                                        onClick={() => {
                                            setOpen(false);
                                            nav("/");
                                        }}
                                    >
                                        Home
                                    </button>
                                    <button
                                        className="w-full text-left text-white/90 text-xl"
                                        onClick={() => {
                                            setOpen(false);
                                            nav("/announcements");
                                        }}
                                    >
                                        Announcements
                                    </button>
                                </div>

                                <div className="border-t border-white/10" />

                                <div>
                                    <div className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">
                                        Games
                                    </div>
                                    <div className="space-y-2 text-white/90 text-lg">
                                        {games.map((g) => (
                                            <div key={g}>{g}</div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/10" />

                                <div>
                                    <div className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">
                                        Other
                                    </div>
                                    <div className="space-y-2 text-white/90 text-lg">
                                        {other.map((o) => (
                                            <div key={o}>{o}</div>
                                        ))}

                                        <button
                                            onClick={() => {
                                                setOpen(false);
                                                toggleDrawer();
                                            }}
                                            className="w-full text-left flex items-center justify-between text-lg mt-1"
                                        >
                                            <span>Collections</span>
                                            <span className="bg-primary text-black text-xs rounded-full px-2 py-0.5">
                                                {collectionsCount}
                                            </span>
                                        </button>

                                        <button
                                            onClick={onLogout}
                                            disabled={logoutLoading}
                                            className="w-full text-left flex items-center gap-2 text-white/90 text-lg disabled:opacity-60 mt-3"
                                        >
                                            {logoutLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <LogOut size={20} />
                                            )}
                                            Logout
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
