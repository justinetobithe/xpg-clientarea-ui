import { useMemo, useState } from "react";
import { Calendar, Search, Sparkles, ArrowUpRight } from "lucide-react";
import { useAnnouncementStore } from "../store/announcementStore";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const formatLongDate = (val) => {
    if (!val) return "";
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
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

function CtaBadge({ label, url }) {
    if (!label || !url) return null;

    const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/35 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/25 hover:border-primary/50 transition"
            title={label}
        >
            <span className="truncate max-w-[180px]">{label}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
    );
}

function AnnouncementCard({ item, faded }) {
    const { t } = useTranslation();

    const title = item?.title || t("announcements.page.fallbackTitle");
    const dateLabel = formatLongDate(item?.date || item?.createdAt);
    const snippet = getPlainText(getAnnouncementHTML(item)).slice(0, 140);

    return (
        <Link
            to={`/announcement/${item.id}`}
            className={[
                "group block w-full text-left rounded-2xl overflow-hidden border border-white/10 bg-white/[0.035] hover:bg-white/[0.06] transition shadow-[0_20px_90px_rgba(0,0,0,0.4)]",
                faded ? "opacity-80 hover:opacity-100" : "",
            ].join(" ")}
        >
            <div className="relative">
                {item?.imageURL ? (
                    <img src={item.imageURL} alt={title} className="h-44 w-full object-cover" loading="lazy" />
                ) : (
                    <div className="h-44 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 text-[11px] text-white/90 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 border border-white/15 px-2 py-1">
                            <Calendar className="h-3.5 w-3.5 text-white" />
                            <span className="text-white">{dateLabel}</span>
                        </span>

                        {faded ? (
                            <span className="rounded-full px-2 py-1 bg-white/10 border border-white/15 text-white/80">
                                {t("announcements.page.older")}
                            </span>
                        ) : null}
                    </div>

                    <div className="mt-2 text-white font-extrabold text-lg leading-snug line-clamp-2 group-hover:text-primary transition break-words">
                        {title}
                    </div>
                </div>
            </div>

            <div className="p-4">
                <div className="text-white/85 text-sm line-clamp-2 break-words">
                    {snippet || t("announcements.page.openToReadMore")}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <CtaBadge label={item?.ctaLabel} url={item?.ctaURL} />
                    <span className="text-primary text-sm font-semibold">{t("announcements.page.open")}</span>
                </div>
            </div>
        </Link>
    );
}

export default function Announcements() {
    const { t } = useTranslation();
    const { items, loading } = useAnnouncementStore();
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
            const tt = (a?.title || "").toLowerCase();
            const c = getPlainText(getAnnouncementHTML(a)).toLowerCase();
            return tt.includes(q) || c.includes(q);
        });
    }, [sorted, query]);

    return (
        <div className="w-full pt-20 md:pt-24 pb-[env(safe-area-inset-bottom)]">
            <header className="bg-darken-evo border-b border-border py-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-start gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/35 flex items-center justify-center shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm text-white/80 mb-1">{t("announcements.page.crumb")}</p>
                            <h1 className="text-3xl font-extrabold text-white mb-2 break-words">{t("announcements.page.title")}</h1>
                            <p className="text-sm text-white/85 break-words">{t("announcements.page.subtitle")}</p>
                        </div>
                    </div>

                    <div className="mt-6 max-w-xl relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("announcements.page.searchPlaceholder")}
                            className="w-full rounded-xl bg-black/25 border border-white/15 pl-9 pr-3 py-2.5 text-[16px] md:text-sm text-white placeholder:text-white/60 outline-none focus:ring-1 focus:ring-primary"
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
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <div className="text-white font-semibold text-lg mb-1">{t("announcements.page.empty.title")}</div>
                        <div className="text-white/80 text-sm">{t("announcements.page.empty.subtitle")}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((a, idx) => (
                            <AnnouncementCard key={a.id} item={a} faded={idx >= 6} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
