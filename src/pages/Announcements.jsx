import { useEffect, useMemo, useState } from "react";
import { Calendar, Search, Sparkles, Image as ImageIcon, BookOpen, ArrowUpRight } from "lucide-react";
import { useAnnouncementStore } from "../store/announcementStore";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const cx = (...classes) => classes.filter(Boolean).join(" ");

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

const pickCtaUrl = (item) => {
    const v =
        item?.ctaURL ??
        item?.ctaUrl ??
        item?.marketingPackURL ??
        item?.marketingPackUrl ??
        item?.marketing_pack_url ??
        item?.packURL ??
        item?.packUrl ??
        "";
    return typeof v === "string" ? v.trim() : "";
};

const isExternalUrl = (url) => /^https?:\/\//i.test(url);

const SkeletonCard = () => (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] animate-pulse">
        <div className="h-56 bg-white/5" />
        <div className="p-5 space-y-3">
            <div className="h-7 bg-white/10 rounded w-4/5" />
            <div className="h-4 bg-white/10 rounded w-3/5" />
            <div className="h-12 bg-white/10 rounded w-full" />
            <div className="h-12 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-32" />
        </div>
    </div>
);

function ActionRow({ icon: Icon, label, href, to }) {
    const base = cx(
        "w-full inline-flex items-center gap-3 rounded-2xl",
        "bg-white/[0.03] hover:bg-white/[0.07] transition px-4 py-3 text-left"
    );

    const content = (
        <>
            <span className="h-9 w-9 rounded-xl bg-white/[0.08] grid place-items-center shrink-0">
                <Icon className="h-5 w-5 text-white/90" />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-primary truncate">{label}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-white/55 shrink-0" />
        </>
    );

    if (href) {
        if (isExternalUrl(href)) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={base}
                    onClick={(e) => e.stopPropagation()}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link to={href} className={base} onClick={(e) => e.stopPropagation()}>
                {content}
            </Link>
        );
    }

    return (
        <Link to={to} className={base} onClick={(e) => e.stopPropagation()}>
            {content}
        </Link>
    );
}
 
function AnnouncementCard({ item }) {
    const { t } = useTranslation();

    const title = item?.title || t("announcements.page.fallbackTitle");
    const dateLabel = formatLongDate(item?.date || item?.createdAt);
    const snippet = getPlainText(getAnnouncementHTML(item)).slice(0, 120);

    const ctaLabel = item?.ctaLabel || "View Marketing Pack";
    const ctaURL = pickCtaUrl(item);

    return (
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition shadow-[0_22px_90px_rgba(0,0,0,0.45)]">
            <div className="relative">
                {item?.imageURL ? (
                    <img src={item.imageURL} alt={title} className="h-56 w-full object-cover" loading="lazy" />
                ) : (
                    <div className="h-56 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            </div>

            <div className="p-5">
                <div className="text-white font-extrabold text-xl leading-snug line-clamp-2 break-words">{title}</div>

                <div className="mt-2 text-sm text-white/70 line-clamp-2 min-h-[40px] break-words">
                    {snippet || t("announcements.page.openToReadMore")}
                </div>

                <div className="mt-4 space-y-2">
                    {!!ctaURL && <ActionRow icon={ImageIcon} label={ctaLabel} href={ctaURL} />}
                    <ActionRow icon={BookOpen} label={t("announcements.page.open") || "Read Announcement"} to={`/announcement/${item.id}`} />
                </div>

                <div className="mt-4 flex items-center gap-2 text-white/55 text-xs">
                    <Calendar className="h-4 w-4" />
                    <span>{dateLabel}</span>
                </div>
            </div>
        </div>
    );
}

export default function Announcements() {
    const { t } = useTranslation();
    const { items, loading, startAnnouncementsListener, stopAnnouncementsListener } = useAnnouncementStore();
    const [query, setQuery] = useState("");

    useEffect(() => {
        startAnnouncementsListener(50);
        return () => stopAnnouncementsListener();
    }, [startAnnouncementsListener, stopAnnouncementsListener]);

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <div className="text-white font-semibold text-lg mb-1">{t("announcements.page.empty.title")}</div>
                        <div className="text-white/80 text-sm">{t("announcements.page.empty.subtitle")}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((a) => (
                            <AnnouncementCard key={a.id} item={a} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
