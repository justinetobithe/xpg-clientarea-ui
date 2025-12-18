import { useMemo, useState } from "react";
import { FileText, FileImage, File, Loader2 } from "lucide-react";
import { useDownloadsStore } from "../../store/downloadsStore";

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

const buildDownloadUrl = (storagePath, filename) => {
    const base = import.meta.env.VITE_DOWNLOAD_FILE_URL;
    if (!base) throw new Error("Missing VITE_DOWNLOAD_FILE_URL");
    return `${base}?path=${encodeURIComponent(storagePath)}&name=${encodeURIComponent(filename || "download")}`;
};

const storagePathFromFirebaseUrl = (fileURL) => {
    try {
        const u = new URL(fileURL);
        const m = u.pathname.match(/\/o\/(.+)$/);
        if (!m) return null;
        return decodeURIComponent(m[1]);
    } catch {
        return null;
    }
};

const downloadViaIframe = (url) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => {
        try {
            iframe.remove();
        } catch { }
    }, 60000);
};

export default function RecentDownloadsPanel({ items = [], loading = false, error = null, skeletonCount = 5 }) {
    const upsertDownload = useDownloadsStore((s) => s.upsertDownload);
    const [downloadingId, setDownloadingId] = useState(null);

    const idOf = useMemo(() => (f) => f?.id || f?.storagePath || f?.fileURL || f?.fileName || "", []);

    const handleDownload = async (f) => {
        const name = f.fileName || "download";
        const rowId = idOf(f);
        setDownloadingId(rowId);

        try {
            await upsertDownload({
                userId: f.userId,
                fileName: f.fileName,
                fileURL: f.fileURL || null,
                storagePath: f.storagePath || null,
                thumbURL: f.thumbURL || f.thumb || f.thumbnail || null,
                sectionTitle: f.sectionTitle || f._sectionTitle || "",
                fileKey: f.storagePath || f.fileURL || name
            });

            const storagePath = f.storagePath || (f.fileURL ? storagePathFromFirebaseUrl(f.fileURL) : null);

            if (!storagePath) {
                alert("Missing storagePath and cannot extract it from fileURL.");
                return;
            }

            const url = buildDownloadUrl(storagePath, name);
            downloadViaIframe(url);
        } catch (e) {
            alert(e?.message || "Download failed");
        } finally {
            setDownloadingId((cur) => (cur === rowId ? null : cur));
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <div className="text-lg font-semibold mb-4 text-white">Recent Downloads</div>

            <div className="rounded-xl overflow-hidden border border-white/10 bg-background/10">
                <div className="grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3 text-xs font-bold text-white/80 bg-white/5">
                    <div />
                    <div>Filename</div>
                    <div>Downloaded</div>
                    <div className="text-right" />
                </div>

                {loading && Array.from({ length: skeletonCount }).map((_, i) => <RecentDownloadSkeletonRow key={i} />)}

                {!loading && error && <div className="text-sm text-red-400 py-6 text-center">{error}</div>}

                {!loading && !error && items.length === 0 && (
                    <div className="text-sm text-white/60 py-6 text-center">No downloads yet.</div>
                )}

                {!loading &&
                    !error &&
                    items.map((f, idx) => {
                        const name = f.fileName || "Untitled";
                        const ext = getExt(name);
                        const thumb = f.thumbURL || f.thumb || f.thumbnail || (isImage(ext) ? f.fileURL : null);
                        const rowId = idOf(f);
                        const isDownloading = downloadingId === rowId;

                        return (
                            <div
                                key={rowId}
                                className={[
                                    "grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3",
                                    idx % 2 === 0 ? "bg-white/[0.02]" : "bg-white/[0.06]"
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-center">
                                    {thumb ? (
                                        <img src={thumb} alt="" className="h-10 w-10 rounded object-cover" loading="lazy" />
                                    ) : ext === "PDF" ? (
                                        <FileText size={20} className="text-white/70" />
                                    ) : isImage(ext) ? (
                                        <FileImage size={20} className="text-white/70" />
                                    ) : (
                                        <File size={20} className="text-white/70" />
                                    )}
                                </div>

                                <div className="min-w-0 pr-2">
                                    <div className="text-sm font-semibold text-white leading-snug break-words whitespace-normal line-clamp-3" title={name}>
                                        {name}
                                    </div>
                                    <div className="text-xs text-white/60 truncate mt-0.5">
                                        {(f.sectionTitle || f._sectionTitle || "").toString()}
                                        {ext ? ` • ${ext}` : ""}
                                    </div>
                                </div>

                                <div className="text-xs text-white/80 whitespace-nowrap">
                                    {f.downloadedAt?.toDate ? f.downloadedAt.toDate().toLocaleString() : ""}
                                </div>

                                <div className="text-right">
                                    <button
                                        type="button"
                                        disabled={isDownloading}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isDownloading) return;
                                            await handleDownload(f);
                                        }}
                                        className={[
                                            "text-sm font-semibold text-primary hover:underline inline-flex items-center justify-end gap-2",
                                            isDownloading ? "opacity-70 cursor-not-allowed" : ""
                                        ].join(" ")}
                                    >
                                        {isDownloading && <Loader2 size={16} className="animate-spin" />}
                                        {isDownloading ? "Downloading" : "Download"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
