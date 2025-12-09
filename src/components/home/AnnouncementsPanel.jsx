import { Link } from "react-router-dom";

function AnnouncementSkeletonRow() {
    return (
        <div className="flex gap-3 bg-background/25 rounded-xl p-3 animate-pulse">
            <div className="w-28 h-16 md:w-32 md:h-20 rounded-lg shrink-0 bg-white/10" />
            <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-5/6" />
                <div className="h-3 bg-white/10 rounded w-24 mt-2" />
                <div className="flex gap-3 mt-2">
                    <div className="h-3 bg-white/10 rounded w-12" />
                    <div className="h-3 bg-white/10 rounded w-16" />
                </div>
            </div>
        </div>
    );
}

const toText = (html = "") =>
    html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const formatDate = (val) => {
    if (!val) return "";
    if (val?.toDate) return val.toDate().toLocaleDateString();
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
};

export default function AnnouncementsPanel({
    items = [],
    loading = false,
    error = null,
    skeletonCount = 3
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-white">
                    Announcements For You
                </div>
                <Link to="/announcements" className="text-xs text-primary hover:underline">
                    See More
                </Link>
            </div>

            <div className="space-y-3">
                {loading &&
                    Array.from({ length: skeletonCount }).map((_, i) => (
                        <AnnouncementSkeletonRow key={i} />
                    ))}

                {!loading && error && (
                    <div className="text-sm text-red-400 py-6 text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && items.length === 0 && (
                    <div className="text-sm text-white/60 py-6 text-center">
                        No announcements yet.
                    </div>
                )}

                {!loading && !error &&
                    items.map((a) => {
                        const desc = toText(a.description || "");
                        const dateLabel = formatDate(a.date || a.createdAt);

                        return (
                            <div
                                key={a.id}
                                className="flex gap-3 bg-background/25 rounded-xl p-3"
                            >
                                <div className="w-28 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden shrink-0 bg-black/40">
                                    {a.imageURL && (
                                        <img
                                            src={a.imageURL}
                                            alt={a.title || ""}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-white truncate">
                                        {a.title || "Untitled"}
                                    </div>

                                    {!!desc && (
                                        <div className="text-xs text-white/70 line-clamp-2 mt-1">
                                            {desc}
                                        </div>
                                    )}

                                    {!!dateLabel && (
                                        <div className="text-[11px] text-white/50 mt-2">
                                            {dateLabel}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mt-2">
                                        {a.ctaLabel && a.ctaURL && (
                                            <Link
                                                to={a.ctaURL}
                                                className="text-xs text-primary font-semibold hover:underline"
                                            >
                                                {a.ctaLabel}
                                            </Link>
                                        )}
                                        <Link
                                            to="/announcements"
                                            className="text-xs text-primary font-semibold hover:underline"
                                        >
                                            Read Announcement
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
