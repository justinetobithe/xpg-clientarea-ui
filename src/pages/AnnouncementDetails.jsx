import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ExternalLink, Sparkles } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAnnouncementStore } from "../store/announcementStore";
import { toDate } from "../utils/utils";
import { useTranslation } from "react-i18next";

const getAnnouncementHTML = (item) => {
    if (!item) return "";
    const v =
        item?.content ??
        item?.contentHtml ??
        item?.contentHTML ??
        item?.details ??
        item?.description ??
        item?.body ??
        item?.html ??
        item?.text ??
        "";
    return typeof v === "string" ? v : "";
};

const forceWhiteHtml = (html) => {
    if (!html) return "";
    return String(html)
        .replace(/color\s*:\s*[^;"]+;?/gi, "")
        .replace(/background-color\s*:\s*[^;"]+;?/gi, "")
        .replace(/style="\s*"/gi, "");
};

const RecommendedSkeleton = () => (
    <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 items-center animate-pulse">
                <div className="col-span-1 h-16 bg-white/10 rounded-xl" />
                <div className="col-span-2 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-4/5" />
                    <div className="h-3 bg-white/10 rounded w-2/5" />
                </div>
            </div>
        ))}
    </div>
);

export default function AnnouncementDetails() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const list = useAnnouncementStore((s) => s.items);

    const [item, setItem] = useState(null);
    const [loadingItem, setLoadingItem] = useState(true);

    useEffect(() => {
        if (!id) {
            setItem(null);
            setLoadingItem(false);
            return;
        }

        setLoadingItem(true);
        getDoc(doc(db, "announcements", id))
            .then((snap) => {
                setItem(snap.exists() ? { id: snap.id, ...snap.data() } : null);
                setLoadingItem(false);
            })
            .catch(() => {
                setItem(null);
                setLoadingItem(false);
            });
    }, [id]);

    const recommended = useMemo(() => {
        if (!Array.isArray(list) || !item) return [];
        const others = list.filter((a) => a.id !== id);
        const currTags = new Set((item?.tags || []).map((tt) => String(tt).toLowerCase()));
        const primary = others.filter((a) => (a.tags || []).some((tt) => currTags.has(String(tt).toLowerCase())));
        const merged = [...primary, ...others].filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);
        return merged.slice(0, 6);
    }, [list, id, item]);

    const displayDate = item ? toDate(item.date || item.createdAt).toLocaleString() : "";
    const html = useMemo(() => forceWhiteHtml(getAnnouncementHTML(item)), [item]);

    return (
        <div className="w-full pt-20 md:pt-24 pb-[env(safe-area-inset-bottom)]">
            <header className="relative bg-darken-evo border-b border-border py-10 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,123,29,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_30%)]" />
                <div className="relative max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/35 flex items-center justify-center shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm text-white/90 mb-1">
                                    {t("announcements.page.crumb")} / {t("announcements.details.crumb")}
                                </p>

                                <h1 className="text-2xl md:text-3xl font-extrabold text-white break-words">
                                    {loadingItem ? t("announcements.details.loadingTitle") : item?.title || t("announcements.details.fallbackTitle")}
                                </h1>

                                <div className="mt-2 flex items-center gap-2 text-white text-xs">
                                    <Calendar className="h-4 w-4 text-white" />
                                    <span className="break-words">{loadingItem ? "" : displayDate}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/announcements")}
                            className="hidden md:inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-black/30 px-4 py-2.5 text-white hover:bg-black/40 hover:border-primary/25 transition shrink-0"
                            type="button"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("announcements.details.back")}
                        </button>
                    </div>

                    <div className="md:hidden mt-4">
                        <button
                            onClick={() => navigate("/announcements")}
                            className="inline-flex items-center text-sm font-semibold text-primary hover:opacity-80 transition"
                            type="button"
                        >
                            <ArrowLeft className="w-3 h-3 mr-1" />
                            {t("announcements.details.backToAnnouncements")}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8">
                        <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,123,29,0.10),transparent_30%)]" />
                            {loadingItem ? (
                                <div className="relative p-6">
                                    <div className="h-64 bg-white/5 rounded-2xl mb-4 animate-pulse" />
                                    <div className="h-8 bg-white/10 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-white/10 rounded w-1/3 mb-6" />
                                    <div className="space-y-3">
                                        <div className="h-4 bg-white/10 rounded" />
                                        <div className="h-4 bg-white/10 rounded w-11/12" />
                                        <div className="h-4 bg-white/10 rounded w-10/12" />
                                        <div className="h-4 bg-white/10 rounded w-full" />
                                    </div>
                                </div>
                            ) : item ? (
                                <>
                                    {item.imageURL ? (
                                        <div className="relative w-full bg-black overflow-hidden">
                                            <img
                                                src={item.imageURL}
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
                                                draggable={false}
                                            />
                                            <div className="relative w-full flex items-center justify-center">
                                                <img
                                                    src={item.imageURL}
                                                    alt={item.title || t("announcements.details.fallbackTitle")}
                                                    className="w-full h-auto max-h-[60vh] object-contain block transition duration-700 hover:scale-[1.01]"
                                                    loading="lazy"
                                                    draggable={false}
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                                        </div>
                                    ) : null}

                                    <div className="relative p-6">
                                        <h2 className="text-white text-2xl font-extrabold mb-2 break-words">
                                            {item.title || t("announcements.details.fallbackTitle")}
                                        </h2>

                                        <div className="flex items-center gap-2 text-white text-xs mb-5">
                                            <Calendar className="h-4 w-4 text-white" />
                                            <span>{displayDate}</span>
                                        </div>

                                        {html ? (
                                            <div
                                                className="text-white leading-relaxed"
                                                style={{ color: "#fff" }}
                                                dangerouslySetInnerHTML={{ __html: html }}
                                            />
                                        ) : (
                                            <p className="text-white">{t("announcements.details.noContent")}</p>
                                        )}

                                        {item.packURL ? (
                                            <a
                                                href={item.packURL}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.10] hover:border-primary/25 transition w-full sm:w-auto"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                {t("announcements.details.viewMarketingPack")}
                                            </a>
                                        ) : null}
                                    </div>
                                </>
                            ) : (
                                <div className="relative p-6 text-center">
                                    <h1 className="text-white text-2xl font-extrabold mb-2">{t("announcements.details.notFound.title")}</h1>
                                    <p className="text-white">{t("announcements.details.notFound.subtitle")}</p>
                                    <div className="mt-5">
                                        <Link
                                            to="/announcements"
                                            className="inline-flex items-center justify-center rounded-2xl bg-primary text-black font-bold px-5 py-2.5 hover:opacity-90 transition"
                                        >
                                            {t("announcements.details.backToAnnouncements")}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.45)] p-4 overflow-hidden">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,123,29,0.10),transparent_30%)]" />
                            <div className="relative">
                                <h2 className="text-white font-extrabold mb-2">{t("announcements.details.recommended.title")}</h2>
                                <div className="border-t border-white/10 mb-4" />

                                {!Array.isArray(list) ? (
                                    <RecommendedSkeleton />
                                ) : recommended.length > 0 ? (
                                    <div className="space-y-3">
                                        {recommended.map((a, index) => (
                                            <button
                                                key={a.id}
                                                onClick={() => navigate(`/announcement/${a.id}`)}
                                                className="w-full text-left grid grid-cols-3 gap-3 items-center hover:bg-white/5 hover:border-primary/20 p-2 -m-2 rounded-2xl border border-transparent transition-all duration-300"
                                                type="button"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className="col-span-1 h-16 w-full bg-black/30 overflow-hidden rounded-xl border border-white/10">
                                                    {a.imageURL || a.cover || a.thumbnail ? (
                                                        <img
                                                            alt={a.title || t("announcements.details.fallbackTitle")}
                                                            src={a.imageURL || a.cover || a.thumbnail}
                                                            className="w-full h-full object-cover block transition duration-500 hover:scale-[1.04]"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800" />
                                                    )}
                                                </div>

                                                <div className="col-span-2">
                                                    <p className="text-white font-semibold line-clamp-2 hover:text-primary transition">
                                                        {a.title || t("announcements.details.fallbackTitle")}
                                                    </p>
                                                    <p className="text-white/75 text-xs mt-0.5">
                                                        {toDate(a.date || a.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white">{t("announcements.details.recommended.empty")}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .force-white, .force-white * { color: #fff !important; }
                `}
            </style>
        </div>
    );
}