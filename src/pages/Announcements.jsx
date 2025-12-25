import { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Calendar, ExternalLink, Search, Sparkles, X } from "lucide-react";
import { useAnnouncementStore } from "../store/announcementStore";

const formatLongDate = (val) => {
    if (!val) return "";
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

const getPlainText = (html) => {
    if (!html) return "";
    return String(html)
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const SkeletonCard = () => (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] animate-pulse">
        <div className="h-44 bg-white/5" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-white/10 rounded w-4/5" />
            <div className="h-3 bg-white/10 rounded w-3/5" />
            <div className="h-9 bg-white/10 rounded w-full" />
        </div>
    </div>
);

function AnnouncementCard({ item, onOpen, faded }) {
    const title = item?.title || "Announcement";
    const dateLabel = formatLongDate(item?.date || item?.createdAt);
    const snippet = getPlainText(item?.content || "").slice(0, 140);

    return (
        <button
            onClick={() => onOpen(item)}
            className={`group w-full text-left rounded-2xl overflow-hidden border border-white/10 bg-white/[0.035] hover:bg-white/[0.06] transition shadow-[0_20px_90px_rgba(0,0,0,0.4)] ${faded ? "opacity-70 hover:opacity-100" : ""
                }`}
        >
            <div className="relative">
                {item?.imageURL ? (
                    <img
                        src={item.imageURL}
                        alt={title}
                        className="h-44 w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="h-44 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 text-[11px] text-white/75">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/10 px-2 py-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {dateLabel}
                        </span>

                        {faded && (
                            <span className="rounded-full px-2 py-1 bg-white/10 border border-white/10 text-white/60">
                                Older
                            </span>
                        )}
                    </div>

                    <div className="mt-2 text-white font-extrabold text-lg line-clamp-2 group-hover:text-primary transition">
                        {title}
                    </div>
                </div>
            </div>

            <div className="p-4">
                <div className="text-white/70 text-sm line-clamp-2">
                    {snippet || "Open to read more."}
                </div>

                <div className="mt-4 flex justify-end">
                    <span className="text-primary text-sm font-semibold">Open</span>
                </div>
            </div>
        </button>
    );
}

export default function Announcements() {
    const { items, loading } = useAnnouncementStore();
    const [detail, setDetail] = useState(null);
    const [query, setQuery] = useState("");

    const sorted = useMemo(() => {
        const all = Array.isArray(items) ? items : [];
        return [...all].sort((a, b) => {
            const da = (a?.date || a?.createdAt)?.toDate?.() || new Date(a?.date || a?.createdAt || 0);
            const db = (b?.date || b?.createdAt)?.toDate?.() || new Date(b?.date || b?.createdAt || 0);
            return db - da;
        });
    }, [items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return sorted;

        return sorted.filter((a) => {
            const t = (a?.title || "").toLowerCase();
            const c = getPlainText(a?.content || "").toLowerCase();
            return t.includes(q) || c.includes(q);
        });
    }, [sorted, query]);

    return (
        <div className="w-full pt-20 md:pt-24">
            <header className="bg-darken-evo border-b border-border py-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-start gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>

                        <div>
                            <p className="text-sm text-white/50 mb-1">Home / Announcements</p>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Announcements
                            </h1>
                            <p className="text-sm text-white/70">
                                Important updates, releases and client communications
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 max-w-xl relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search announcements..."
                            className="w-full rounded-xl bg-black/20 border border-border pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                {loading || items === null ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="text-white font-semibold text-lg mb-1">
                            No announcements found
                        </div>
                        <div className="text-white/60 text-sm">
                            Try adjusting your search keywords.
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((a, idx) => (
                            <AnnouncementCard
                                key={a.id}
                                item={a}
                                onOpen={setDetail}
                                faded={idx >= 6}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Transition appear show={Boolean(detail)} as={Fragment}>
                <Dialog as="div" className="relative z-[80]" onClose={() => setDetail(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/75" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="min-h-full flex items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="transition duration-200 ease-out"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="transition duration-150 ease-in"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1118] shadow-2xl overflow-hidden">
                                    <div className="relative">
                                        {detail?.imageURL ? (
                                            <img
                                                src={detail.imageURL}
                                                alt={detail.title}
                                                className="h-56 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-40 bg-gradient-to-br from-white/10 to-transparent" />
                                        )}

                                        <button
                                            onClick={() => setDetail(null)}
                                            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>

                                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                                            <h2 className="text-2xl font-extrabold text-white">
                                                {detail?.title}
                                            </h2>
                                            <p className="text-white/70 text-xs mt-1">
                                                {formatLongDate(detail?.date || detail?.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {detail?.content ? (
                                            <div
                                                className="prose prose-invert max-w-none text-sm leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: detail.content }}
                                            />
                                        ) : (
                                            <div className="text-white/70 text-sm">
                                                No content provided.
                                            </div>
                                        )}

                                        {detail?.packURL && (
                                            <a
                                                href={detail.packURL}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 mt-6 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]"
                                            >
                                                View Marketing Pack
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
