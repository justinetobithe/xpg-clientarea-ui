import { useEffect, useMemo, useState } from "react";
import { FileText, FileImage, File, Loader2, DownloadCloud, Download } from "lucide-react";
import { getAuth } from "firebase/auth";
import { useDownloadsStore } from "../../store/downloadsStore";
import { getExt, isImage, buildDownloadUrl, storagePathFromFirebaseUrl, downloadViaIframe } from "../../utils/fileUtils";
import { sleep } from "../../utils/utils";
import { useTranslation } from "react-i18next";

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function RecentDownloadSkeletonRow() {
    return (
        <div className="hidden md:grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-white/10" />
            <div className="space-y-2">
                <div className="h-4 w-11/12 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/10 rounded" />
            </div>
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-9 w-9 bg-white/10 rounded-xl justify-self-end" />
        </div>
    );
}

function RecentDownloadSkeletonCard() {
    return (
        <div className="md:hidden px-4 py-3 animate-pulse">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 w-11/12 bg-white/10 rounded" />
                        <div className="h-3 w-7/12 bg-white/10 rounded" />
                        <div className="h-3 w-5/12 bg-white/10 rounded" />
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-white/10" />
                </div>
            </div>
        </div>
    );
}

function TooltipIconButton({ label, disabled, onClick, children }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onClick={onClick}
            className={cx(
                "relative group inline-flex items-center justify-center",
                "h-10 w-10 rounded-xl border border-white/10 bg-white/[0.05]",
                "hover:bg-white/[0.10] active:bg-white/[0.12] transition-all duration-200",
                "text-primary shadow-[0_10px_24px_-18px_rgba(255,123,29,0.45)]",
                disabled ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.03]"
            )}
            aria-label={label}
            title={label}
        >
            {children}
            <span
                className={cx(
                    "pointer-events-none absolute -top-9 right-0 z-10",
                    "whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] text-white",
                    "opacity-0 translate-y-1 transition",
                    "group-hover:opacity-100 group-hover:translate-y-0",
                    "hidden md:block"
                )}
                role="tooltip"
            >
                {label}
            </span>
        </button>
    );
}

export default function RecentDownloadsPanel({ items = [], loading = false, error = null, skeletonCount = 5 }) {
    const { t } = useTranslation();
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

    const formatDownloadedAt = (f) => {
        const d = f?.downloadedAt?.toDate ? f.downloadedAt.toDate() : null;
        if (!d) return "";
        return d.toLocaleString();
    };

    const handleDownload = async (f) => {
        const name = f.fileName || t("downloads.untitled");
        const stableKey = stableKeyOf(f);
        if (!stableKey) return;

        setDownloadingKey(stableKey);

        try {
            const storagePath = f.storagePath || (f.fileURL ? storagePathFromFirebaseUrl(f.fileURL) : null);

            if (!storagePath) {
                alert(t("downloads.missingStoragePath"));
                return;
            }

            const auth = getAuth();
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                alert(t("downloads.notAuthenticated"));
                return;
            }

            const url = buildDownloadUrl(storagePath, name, token);
            if (!url) {
                alert(t("downloads.missingDownloadUrl"));
                return;
            }

            downloadViaIframe(url);

            await sleep(1200);

            await upsertDownload({
                userId: f.userId,
                fileName: f.fileName,
                fileURL: f.fileURL || null,
                storagePath,
                thumbURL: f.thumbURL || f.thumb || f.thumbnail || null,
                sectionTitle: f.sectionTitle || f._sectionTitle || "",
                fileKey: storagePath,
            });

            await sleep(300);
        } catch (e) {
            alert(e?.message || t("downloads.downloadFailed"));
        } finally {
            setDownloadingKey((cur) => (cur === stableKey ? null : cur));
        }
    };

    const desktopMaxItems = 5;
    const mobileMaxItems = 10;

    const mobileVisibleCards = 5;
    const mobileRowHeight = 112;
    const mobileScrollHeight = mobileVisibleCards * mobileRowHeight;

    const desktopItems = Array.isArray(items) ? items.slice(0, desktopMaxItems) : [];
    const mobileItems = Array.isArray(items) ? items.slice(0, mobileMaxItems) : [];

    const showMobileScroller = !loading && !error && mobileItems.length > 0;

    return (
        <div className="relative overflow-hidden bg-card border border-border rounded-[26px] p-5 md:p-6 h-full min-h-[560px] flex flex-col shadow-[0_20px_60px_-28px_rgba(0,0,0,0.95)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,123,29,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_30%)]" />

            <div className="relative flex items-center justify-between mb-4 shrink-0">
                <div>
                    <div className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 shadow-[0_8px_22px_rgba(255,123,29,0.14)]">
                            <DownloadCloud className="h-4 w-4 text-primary" />
                        </span>
                        {t("downloads.title")}
                    </div>
                    <div className="text-xs text-white/60 mt-1">{t("downloads.subtitle")}</div>
                </div>
            </div>

            <div className="relative rounded-[22px] overflow-hidden border border-white/10 bg-background/10 flex-1 min-h-0">
                <div className="hidden md:grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3 text-xs font-bold text-white/80 bg-white/[0.05] backdrop-blur-sm">
                    <div />
                    <div>{t("downloads.table.filename")}</div>
                    <div>{t("downloads.table.downloaded")}</div>
                    <div className="text-right" />
                </div>

                {loading &&
                    Array.from({ length: skeletonCount }).map((_, i) => (
                        <div key={i}>
                            <RecentDownloadSkeletonRow />
                            <RecentDownloadSkeletonCard />
                        </div>
                    ))}

                {!loading && error && <div className="text-sm text-red-400 py-6 text-center">{error}</div>}

                {!loading && !error && items.length === 0 && (
                    <div className="text-sm text-white/60 py-6 text-center">{t("downloads.empty")}</div>
                )}

                {showMobileScroller && (
                    <div className="md:hidden border-t border-white/10">
                        <div
                            className="px-4 pt-3 pb-2 flex items-center justify-between"
                            style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
                        >
                            <div className="text-xs font-semibold text-white/70">{t("downloads.recent")}</div>
                            <div className="text-[11px] text-white/50">
                                {t("downloads.showing", { count: Math.min(mobileItems.length, mobileMaxItems), plus: mobileItems.length >= mobileMaxItems ? "+" : "" })}
                            </div>
                        </div>

                        <div className="overflow-y-auto px-0" style={{ maxHeight: `${mobileScrollHeight}px`, WebkitOverflowScrolling: "touch" }}>
                            {mobileItems.map((f, idx) => {
                                const name = f.fileName || t("downloads.untitled");
                                const ext = getExt(name);
                                const thumb = f.thumbURL || f.thumb || f.thumbnail || (isImage(ext) ? f.fileURL : null);

                                const stableKey = stableKeyOf(f);
                                const isDownloading = !!stableKey && downloadingKey === stableKey;

                                const downloadedAt = formatDownloadedAt(f);
                                const sectionTitle = (f.sectionTitle || f._sectionTitle || "").toString();

                                const icon = thumb ? (
                                    <img src={thumb} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                                ) : ext === "PDF" ? (
                                    <FileText size={20} className="text-white/70" />
                                ) : isImage(ext) ? (
                                    <FileImage size={20} className="text-white/70" />
                                ) : (
                                    <File size={20} className="text-white/70" />
                                );

                                return (
                                    <div
                                        key={stableKey || `${name}-${idx}`}
                                        className="px-4 py-2"
                                        style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
                                    >
                                        <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.06] hover:border-primary/25">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10">
                                                    {icon}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-white leading-snug break-words whitespace-normal">
                                                        {name}
                                                    </div>
                                                    <div className="mt-1 text-xs text-white/60">
                                                        {sectionTitle ? <span className="break-words">{sectionTitle}</span> : <span>{t("downloads.dash")}</span>}
                                                        {ext ? <span>{` • ${ext}`}</span> : null}
                                                    </div>

                                                    <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="text-white/50">{t("downloads.table.downloaded")}</span>
                                                            <span className="text-white/80 text-right break-words">{downloadedAt || t("downloads.dash")}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <TooltipIconButton
                                                    label={isDownloading ? t("downloads.downloading") : t("downloads.download")}
                                                    disabled={isDownloading}
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (isDownloading) return;
                                                        await handleDownload(f);
                                                    }}
                                                >
                                                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                                </TooltipIconButton>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!loading &&
                    !error &&
                    desktopItems.map((f, idx) => {
                        const name = f.fileName || t("downloads.untitled");
                        const ext = getExt(name);
                        const thumb = f.thumbURL || f.thumb || f.thumbnail || (isImage(ext) ? f.fileURL : null);

                        const stableKey = stableKeyOf(f);
                        const isDownloading = !!stableKey && downloadingKey === stableKey;

                        const rowBg = idx % 2 === 0 ? "bg-white/[0.025]" : "bg-white/[0.05]";
                        const downloadedAt = formatDownloadedAt(f);
                        const sectionTitle = (f.sectionTitle || f._sectionTitle || "").toString();

                        const icon = thumb ? (
                            <img src={thumb} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                        ) : ext === "PDF" ? (
                            <FileText size={20} className="text-white/70" />
                        ) : isImage(ext) ? (
                            <FileImage size={20} className="text-white/70" />
                        ) : (
                            <File size={20} className="text-white/70" />
                        );

                        return (
                            <div
                                key={stableKey || `${name}-${idx}`}
                                className={cx(
                                    "hidden md:grid grid-cols-[56px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3 transition",
                                    rowBg,
                                    "hover:bg-white/[0.07]"
                                )}
                            >
                                <div className="flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 h-11 w-11">
                                    {icon}
                                </div>

                                <div className="min-w-0 pr-2">
                                    <div
                                        className="text-sm font-semibold text-white leading-snug break-words whitespace-normal line-clamp-3"
                                        title={name}
                                    >
                                        {name}
                                    </div>
                                    <div className="text-xs text-white/60 truncate mt-0.5">
                                        {sectionTitle}
                                        {ext ? ` • ${ext}` : ""}
                                    </div>
                                </div>

                                <div className="text-xs text-white/80 whitespace-nowrap">{downloadedAt}</div>

                                <div className="text-right">
                                    <TooltipIconButton
                                        label={isDownloading ? t("downloads.downloading") : t("downloads.download")}
                                        disabled={isDownloading}
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isDownloading) return;
                                            await handleDownload(f);
                                        }}
                                    >
                                        {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                    </TooltipIconButton>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}