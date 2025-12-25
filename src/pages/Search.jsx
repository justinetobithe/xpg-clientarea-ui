import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Search as SearchIcon,
    Sparkles,
    Megaphone,
    Gamepad2,
    Folder,
    FileText,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import PageShell from "../components/common/PageShell";
import { useSearchQuery } from "../hooks/useSearchQuery";

function useQueryParam(name) {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search).get(name) || "", [search, name]);
}

function escRegExp(s) {
    return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text = "", q = "" }) {
    const query = String(q || "").trim();
    const value = String(text || "");
    if (!query || query.length < 1) return <>{value}</>;

    const re = new RegExp(`(${escRegExp(query)})`, "ig");
    const parts = value.split(re);

    return (
        <>
            {parts.map((p, i) => {
                const isHit = re.test(p);
                re.lastIndex = 0;
                return isHit ? (
                    <span
                        key={i}
                        className="rounded-md bg-primary/20 px-1.5 py-0.5 text-primary font-semibold"
                    >
                        {p}
                    </span>
                ) : (
                    <span key={i}>{p}</span>
                );
            })}
        </>
    );
}

function StatPill({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
            <Icon className="h-4 w-4 text-white/70" />
            <div className="text-xs text-white/60">{label}</div>
            <div className="text-xs font-semibold text-white">{value}</div>
        </div>
    );
}

function EmptyCard({ icon: Icon, title, desc }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white/70" />
                </div>
                <div>
                    <div className="text-white font-semibold">{title}</div>
                    <div className="text-white/60 text-sm mt-1">{desc}</div>
                </div>
            </div>
        </div>
    );
}

function GameCard({ g, q }) {
    const [open, setOpen] = useState(false);

    const title = g.name || g.title || g.game_name || "Untitled";
    const img = g.imageURL || g.cover || g.thumbnail || "";
    const sections = Array.isArray(g.sections) ? g.sections : [];

    const hasNested = sections.some((s) => Array.isArray(s.files) && s.files.length > 0);

    return (
        <div className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/20 overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
            <div className="flex gap-4 p-5">
                <div className="w-24 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                    {img ? (
                        <img src={img} alt={title} className="w-full h-full object-cover block" loading="lazy" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="h-6 w-6 text-white/40" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-white font-semibold text-lg truncate">
                                <Highlight text={title} q={q} />
                            </div>
                            <div className="text-white/60 text-sm mt-1">
                                {hasNested ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Folder className="h-4 w-4 text-white/60" />
                                        Matching sections/files found
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-white/50" />
                                        No matching sections/files in this game
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                            <Link
                                to={`/game/${g.id}`}
                                className="inline-flex items-center justify-center rounded-xl bg-primary text-black font-bold px-4 py-2 text-sm hover:opacity-90 transition"
                            >
                                Open
                            </Link>

                            {sections.length > 0 ? (
                                <button
                                    onClick={() => setOpen((v) => !v)}
                                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 transition"
                                >
                                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {open ? (
                <div className="border-t border-white/10 px-5 py-5 bg-black/15">
                    <div className="space-y-4">
                        {sections.length === 0 ? (
                            <div className="text-white/60 text-sm">No sections found.</div>
                        ) : (
                            sections.map((s) => {
                                const secTitle = s.name || s.title || "Section";
                                const files = Array.isArray(s.files) ? s.files : [];
                                return (
                                    <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-white font-semibold">
                                                <Highlight text={secTitle} q={q} />
                                            </div>
                                            <div className="text-xs text-white/50">
                                                {files.length} file{files.length === 1 ? "" : "s"}
                                            </div>
                                        </div>

                                        {files.length === 0 ? (
                                            <div className="text-white/60 text-sm mt-2">No matching files.</div>
                                        ) : (
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {files.map((f) => {
                                                    const fname = f.name || f.filename || f.title || "File";
                                                    const fdesc = f.description || "";
                                                    return (
                                                        <div
                                                            key={f.id}
                                                            className="rounded-xl border border-white/10 bg-black/25 p-3 hover:bg-black/35 transition"
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                <div className="mt-0.5 h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                                    <FileText className="h-4 w-4 text-white/70" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-white/90 text-sm font-semibold truncate">
                                                                        <Highlight text={fname} q={q} />
                                                                    </div>
                                                                    {fdesc ? (
                                                                        <div className="text-white/60 text-xs mt-1 line-clamp-2">
                                                                            <Highlight text={fdesc} q={q} />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-white/50 text-xs mt-1">No description.</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default function Search() {
    const q = useQueryParam("q");
    const { isLoading, error, matchedAnnouncements, matchedGames, totalCount } = useSearchQuery(q);

    const headerRight = (
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-4 py-2">
            <SearchIcon className="h-4 w-4 text-white/70" />
            <span className="text-sm text-white/70">
                Query: <span className="text-white font-semibold">{q || "-"}</span>
            </span>
        </div>
    );

    const announcementsCount = matchedAnnouncements?.length || 0;
    const gamesCount = matchedGames?.length || 0;

    return (
        <PageShell
            crumb="Home / Search"
            title="Search"
            subtitle="Search announcements, games, sections and files."
            right={headerRight}
        >
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-black/20 to-black/30 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                    <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="text-white font-semibold text-xl">
                                {q ? (
                                    <>
                                        Results for <span className="text-primary">{q}</span>
                                    </>
                                ) : (
                                    "Start searching"
                                )}
                            </div>
                            <div className="text-white/60 text-sm mt-1">
                                {q ? "Showing matched content across your client area." : "Use the navbar search bar and press Enter."}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatPill icon={Megaphone} label="Announcements" value={announcementsCount} />
                        <StatPill icon={Gamepad2} label="Games" value={gamesCount} />
                        <StatPill icon={SearchIcon} label="Total" value={q ? totalCount : 0} />
                    </div>
                </div>
            </div>

            {!q ? (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EmptyCard
                        icon={SearchIcon}
                        title="Search anything"
                        desc="Try game names, announcement titles, section names, or file names."
                    />
                    <EmptyCard
                        icon={Sparkles}
                        title="Pro tip"
                        desc="Use short keywords like “baccarat”, “pack”, “thumbnail”, “promo”, etc."
                    />
                </div>
            ) : null}

            {q && isLoading ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-white/70 text-sm">
                    Searching...
                </div>
            ) : null}

            {q && !isLoading && error ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-red-400 text-sm">
                    {error?.message || "Search failed"}
                </div>
            ) : null}

            {q && !isLoading && !error && totalCount === 0 ? (
                <div className="mt-6">
                    <EmptyCard
                        icon={SearchIcon}
                        title="No results"
                        desc={`No results found for "${q}". Try a shorter keyword.`}
                    />
                </div>
            ) : null}

            {q && !isLoading && !error && totalCount > 0 ? (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-white font-semibold text-lg">
                                    Announcements <span className="text-white/50">({announcementsCount})</span>
                                </div>
                                <Link to="/announcements" className="text-primary text-sm font-semibold hover:opacity-80">
                                    View all
                                </Link>
                            </div>

                            {announcementsCount === 0 ? (
                                <div className="text-white/60 text-sm">No matching announcements.</div>
                            ) : (
                                <div className="space-y-3">
                                    {matchedAnnouncements.map((a) => {
                                        const title = a.title || a.name || "Untitled";
                                        const body = a.body || a.content || a.description || "";
                                        return (
                                            <Link
                                                key={a.id}
                                                to={`/announcement/${a.id}`}
                                                className="group block rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition p-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                                        <Megaphone className="h-5 w-5 text-white/70 group-hover:text-primary transition" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-white font-semibold line-clamp-2">
                                                            <Highlight text={title} q={q} />
                                                        </div>
                                                        <div className="text-white/60 text-sm line-clamp-2 mt-1">
                                                            <Highlight text={body} q={q} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                            <div className="text-white font-semibold text-lg">
                                Games <span className="text-white/50">({gamesCount})</span>
                            </div>
                            <div className="text-white/60 text-sm mt-1">
                                Expand a game to view matched sections and files.
                            </div>
                        </div>

                        {gamesCount === 0 ? (
                            <EmptyCard icon={Gamepad2} title="No matching games" desc="Try a different keyword." />
                        ) : (
                            <div className="space-y-4">
                                {matchedGames.map((g) => (
                                    <GameCard key={g.id} g={g} q={q} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </PageShell>
    );
}
