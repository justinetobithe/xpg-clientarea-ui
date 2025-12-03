import { Link } from "react-router-dom";

export default function RecentDownloadsPanel({ items = [] }) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <div className="text-lg font-semibold mb-4 text-white">Recent Downloads</div>

            <div className="space-y-2">
                {items.length === 0 && (
                    <div className="text-sm text-white/60 py-6 text-center">
                        No downloads yet.
                    </div>
                )}

                {items.map((f) => (
                    <div
                        key={f.id}
                        className="flex items-center justify-between gap-3 bg-background/25 rounded-xl px-3 py-2.5"
                    >
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                                {f.name}
                            </div>
                            <div className="text-xs text-white/60 truncate">
                                {f.date}
                            </div>
                        </div>

                        <Link
                            to={f.url || "#"}
                            className="text-sm font-semibold text-primary hover:underline shrink-0"
                        >
                            Download
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
