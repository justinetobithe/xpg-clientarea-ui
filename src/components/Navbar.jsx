import { Fragment, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dialog, Transition, Menu as HMenu, Popover } from "@headlessui/react";
import {
    Menu,
    Search,
    User,
    X,
    ChevronDown,
    LogOut,
    Settings,
    LayoutGrid
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

const other = ["Roadmap", "Announcements", "Settings", "What’s New?"];

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

    const { pathname } = useLocation();
    const nav = useNavigate();
    const clearUser = useAuthStore((s) => s.clearUser);
    const user = useAuthStore((s) => s.user);

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
        if (!user?.uid) return;
        startUserCollectionsListener(user.uid);
        return () => stopUserCollectionsListener();
    }, [user?.uid, startUserCollectionsListener, stopUserCollectionsListener]);

    const navItem = (to, label) => (
        <Link
            to={to}
            className={`text-lg font-semibold tracking-wide transition hover:opacity-80 ${pathname === to ? "text-primary" : "text-white"
                }`}
        >
            {label}
        </Link>
    );

    const onLogout = async () => {
        await signOut(auth);
        clearUser();
        nav("/login");
    };

    const isTop = scrollY < 10;
    const collectionsCount = collections?.length || 0;

    return (
        <>
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

                            <Popover className="relative">
                                <Popover.Button className="flex items-center gap-2 text-lg font-semibold tracking-wide text-white hover:opacity-80">
                                    Brands <ChevronDown size={18} />
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
                                    <Popover.Panel className="absolute left-0 mt-3 w-56 rounded-xl border border-border bg-card shadow-xl p-2">
                                        <div className="flex flex-col">
                                            {brands.map((b) => (
                                                <Link
                                                    key={b}
                                                    to="/brands"
                                                    className="px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/5 hover:text-white"
                                                >
                                                    {b}
                                                </Link>
                                            ))}
                                        </div>
                                    </Popover.Panel>
                                </Transition>
                            </Popover>

                            {navItem("/announcements", "Announcement")}
                            {navItem("/roadmap", "Roadmap")}
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
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${active ? "bg-white/5" : ""
                                                    }`}
                                            >
                                                <LogOut size={16} /> Logout
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
                        <Dialog.Panel className="fixed left-0 top-0 h-full w-[82%] bg-[#2b2a36] p-6 overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <img src="/image/logo-white.png" className="h-8" />
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-white"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="text-primary font-semibold text-xl mb-2">
                                <Link to="/" onClick={() => setOpen(false)}>
                                    Home
                                </Link>
                            </div>

                            <div className="border-t border-white/20 my-4" />

                            <div className="text-white text-xl font-semibold mb-3">
                                Games
                            </div>
                            <div className="space-y-2 text-white/90 text-lg">
                                {games.map((g) => (
                                    <div key={g}>{g}</div>
                                ))}
                            </div>

                            <div className="border-t border-white/20 my-6" />

                            <div className="text-white text-xl font-semibold mb-3">
                                Brands
                            </div>
                            <div className="space-y-2 text-white/90 text-lg">
                                {brands.map((b) => (
                                    <div key={b}>{b}</div>
                                ))}
                            </div>

                            <div className="border-t border-white/20 my-6" />

                            <div className="text-white text-xl font-semibold mb-3">
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
                                    className="text-left w-full text-white/90 text-lg"
                                >
                                    Collections ({collectionsCount})
                                </button>

                                <button onClick={onLogout} className="text-left w-full">
                                    Logout
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </>
    );
}
