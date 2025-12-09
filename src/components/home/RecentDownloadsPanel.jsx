import { Link } from "react-router-dom";
import { FileText, FileImage, File } from "lucide-react";

function RecentDownloadSkeletonRow() {
    return (
        <div className="grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3 animate-pulse">
            <div className="h-10 w-10 rounded bg-white/10" />
            <div className="space-y-2">
                <div className="h-4 w-11/12 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/10 rounded" />
            </div>
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-3 w-14 bg-white/10 rounded justify-self-end" />
        </div>
    );
}

const IMAGE_EXTS = new Set(["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"]);

const getExt = (name = "") => {
    const n = name.toString();
    if (!n.includes(".")) return "";
    return n.split(".").pop().toUpperCase();
};

const isImage = (ext) => IMAGE_EXTS.has((ext || "").toUpperCase());

export default function RecentDownloadsPanel({
    items = [],
    loading = false,
    error = null,
    skeletonCount = 5
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <div className="text-lg font-semibold mb-4 text-white">
                Recent Downloads
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 bg-background/10">
                <div className="grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3 text-xs font-bold text-white/80 bg-white/5">
                    <div />
                    <div>Filename</div>
                    <div>Downloaded</div>
                    <div className="text-right" />
                </div>

                {loading &&
                    Array.from({ length: skeletonCount }).map((_, i) => (
                        <RecentDownloadSkeletonRow key={i} />
                    ))}

                {!loading && error && (
                    <div className="text-sm text-red-400 py-6 text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && items.length === 0 && (
                    <div className="text-sm text-white/60 py-6 text-center">
                        No downloads yet.
                    </div>
                )}

                {!loading && !error &&
                    items.map((f, idx) => {
                        const name = f.fileName || "Untitled";
                        const ext = getExt(name);
                        const thumb =
                            f.thumbURL ||
                            f.thumb ||
                            f.thumbnail ||
                            (isImage(ext) ? f.fileURL : null);

                        return (
                            <div
                                key={f.id}
                                className={[
                                    "grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3",
                                    idx % 2 === 0 ? "bg-white/[0.02]" : "bg-white/[0.06]"
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-center">
                                    {thumb ? (
                                        <img
                                            src={thumb}
                                            alt=""
                                            className="h-10 w-10 rounded object-cover"
                                            loading="lazy"
                                        />
                                    ) : ext === "PDF" ? (
                                        <FileText size={20} className="text-white/70" />
                                    ) : isImage(ext) ? (
                                        <FileImage size={20} className="text-white/70" />
                                    ) : (
                                        <File size={20} className="text-white/70" />
                                    )}
                                </div>

                                <div className="min-w-0 pr-2">
                                    <div
                                        className="text-sm font-semibold text-white leading-snug break-words whitespace-normal line-clamp-3"
                                        title={name}
                                    >
                                        {name}
                                    </div>
                                    <div className="text-xs text-white/60 truncate mt-0.5">
                                        {(f.sectionTitle || f._sectionTitle || "").toString()}
                                        {ext ? ` • ${ext}` : ""}
                                    </div>
                                </div>

                                <div className="text-xs text-white/80 whitespace-nowrap">
                                    {f.downloadedAt?.toDate
                                        ? f.downloadedAt.toDate().toLocaleString()
                                        : ""}
                                </div>

                                <div className="text-right">
                                    <Link
                                        to={f.fileURL || "#"}
                                        className="text-sm font-semibold text-primary hover:underline"
                                    >
                                        Download
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
