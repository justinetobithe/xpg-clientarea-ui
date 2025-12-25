import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Search } from "lucide-react";
import { useGamesQuery } from "../../hooks/useGamesQuery";

const sortOptions = [
    { value: "order-asc", label: "Default Order" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" }
];

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

export default function GamesSection() {
    const { data: allGames = [], isLoading, error } = useGamesQuery();

    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState(sortOptions[0]);
    const [isSearching, setIsSearching] = useState(false);

    const timerRef = useRef(null);

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
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const games = useMemo(() => {
        let filtered = [...allGames];

        if (searchTerm.length >= 2) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((g) =>
                (g.name || g.title || g.game_name || "Untitled")
                    .toLowerCase()
                    .includes(lower)
            );
        }

        if (sortBy.value === "name-asc") {
            filtered.sort((a, b) =>
                (a.name || a.title || "").localeCompare(b.name || b.title || "")
            );
        } else if (sortBy.value === "name-desc") {
            filtered.sort((a, b) =>
                (b.name || b.title || "").localeCompare(a.name || a.title || "")
            );
        }

        return filtered;
    }, [allGames, searchTerm, sortBy.value]);

    const showSkeleton = isLoading || isSearching;

    return (
        <section className="mt-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                <div className="text-lg font-semibold text-white">
                    All Games ({showSkeleton ? allGames.length : games.length})
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex items-center flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleSearchChange}
                            placeholder="Search games..."
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
                                        <ChevronDown
                                            className={`h-5 w-5 text-gray-400 transition ${open ? "rotate-180" : ""
                                                }`}
                                        />
                                    </span>
                                </Listbox.Button>

                                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border">
                                    {sortOptions.map((option) => (
                                        <Listbox.Option
                                            key={option.value}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 px-4 text-xs ${active
                                                    ? "bg-primary/50 text-white"
                                                    : "text-white"
                                                }`
                                            }
                                            value={option}
                                        >
                                            {({ selected }) => (
                                                <span
                                                    className={`block truncate ${selected
                                                        ? "font-medium"
                                                        : "font-normal"
                                                        }`}
                                                >
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

            {showSkeleton && <GamesGridSkeleton count={8} />}

            {!showSkeleton && error && (
                <div className="text-red-400 text-sm">
                    {error?.message || "Failed to load games"}
                </div>
            )}

            {!showSkeleton && !error && allGames.length > 0 && games.length === 0 && (
                <div className="text-white/70 text-sm">
                    No games found matching "{searchTerm}".
                </div>
            )}

            {!showSkeleton && !error && games.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {games.map((g) => (
                        <Link
                            key={g.id}
                            to={`/game/${g.id}`}
                            className="group rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.03] bg-background/50 border border-border/50 block"
                        >
                            <div className="aspect-video relative overflow-hidden">
                                {g.imageURL ? (
                                    <img
                                        src={g.imageURL}
                                        alt={g.name || g.title || g.game_name || "Game Image"}
                                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white/50 text-xs">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="p-3 text-center text-white text-sm font-medium truncate">
                                {g.name || g.title || g.game_name || "Untitled"}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!showSkeleton && !error && allGames.length === 0 && (
                <div className="text-white/70 text-sm">No games found.</div>
            )}
        </section>
    );
}
