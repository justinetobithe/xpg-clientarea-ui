import { useMemo, useState } from "react";
import { FileText, FileImage, File, Loader2, DownloadCloud } from "lucide-react";
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
    if (!base) return null;
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function RecentDownloadsPanel({ items = [], loading = false, error = null, skeletonCount = 5 }) {
    const upsertDownload = useDownloadsStore((s) => s.upsertDownload);
    const [downloadingKey, setDownloadingKey] = useState(null);

    const stableKeyOf = useMemo(
        () => (f) =>
            f?.fileKey ||
            f?.storagePath ||
            (f?.fileURL ? storagePathFromFirebaseUrl(f.fileURL) || f.fileURL : "") ||
            f?.fileName ||
            "",
        []
    );

    const handleDownload = async (f) => {
        const name = f.fileName || "download";
        const stableKey = stableKeyOf(f);
        if (!stableKey) return;

        setDownloadingKey(stableKey);

        try {
            const storagePath = f.storagePath || (f.fileURL ? storagePathFromFirebaseUrl(f.fileURL) : null);

            if (!storagePath) {
                alert("Missing storagePath and cannot extract it from fileURL.");
                return;
            }

            await upsertDownload({
                userId: f.userId,
                fileName: f.fileName,
                fileURL: f.fileURL || null,
                storagePath,
                thumbURL: f.thumbURL || f.thumb || f.thumbnail || null,
                sectionTitle: f.sectionTitle || f._sectionTitle || "",
                fileKey: storagePath
            });

            const url = buildDownloadUrl(storagePath, name);
            if (!url) {
                alert("Missing VITE_DOWNLOAD_FILE_URL");
                return;
            }

            downloadViaIframe(url);
            await sleep(800);
        } catch (e) {
            alert(e?.message || "Download failed");
        } finally {
            setDownloadingKey((cur) => (cur === stableKey ? null : cur));
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
                            <DownloadCloud className="h-4 w-4 text-primary" />
                        </span>
                        Recent Downloads
                    </div>
                    <div className="text-xs text-white/60 mt-1">Quick access to your latest downloaded assets</div>
                </div>

                {/* <div className="text-xs text-white/60 font-semibold">
                    {Array.isArray(items) ? items.length : 0}
                </div> */}
            </div>

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

                        const stableKey = stableKeyOf(f);
                        const isDownloading = !!stableKey && downloadingKey === stableKey;

                        return (
                            <div
                                key={stableKey || `${name}-${idx}`}
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
