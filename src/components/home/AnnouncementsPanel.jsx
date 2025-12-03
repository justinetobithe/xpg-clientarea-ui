import { Link } from "react-router-dom";

export default function AnnouncementsPanel({ items = [] }) {
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
                {items.length === 0 && (
                    <div className="text-sm text-white/60 py-6 text-center">
                        No announcements yet.
                    </div>
                )}

                {items.map((a) => (
                    <div
                        key={a.id}
                        className="flex gap-3 bg-background/25 rounded-xl p-3"
                    >
                        <div className="w-28 h-16 md:w-32 md:h-20 rounded-lg overflow-hidden shrink-0 bg-black/40">
                            {a.image && (
                                <img
                                    src={a.image}
                                    alt={a.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                                {a.title}
                            </div>

                            {a.body && (
                                <div className="text-xs text-white/70 line-clamp-2 mt-1">
                                    {a.body}
                                </div>
                            )}

                            <div className="text-[11px] text-white/50 mt-2">
                                {a.date}
                            </div>

                            <div className="flex items-center gap-3 mt-2">
                                {a.links?.map((l) => (
                                    <Link
                                        key={l.label}
                                        to={l.to}
                                        className="text-xs text-primary font-semibold hover:underline"
                                    >
                                        {l.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
