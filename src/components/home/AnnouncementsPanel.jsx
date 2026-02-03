import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function AnnouncementSkeletonCard() {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 animate-pulse">
            <div className="flex gap-4">
                <div className="h-20 w-20 rounded-xl bg-white/10 shrink-0 md:h-24 md:w-40" />
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-5/6" />
                    <div className="h-3 bg-white/10 rounded w-24 mt-2" />
                </div>
            </div>
        </div>
    );
}

const toText = (html = "") => String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const formatDate = (val) => {
    if (!val) return "";
    if (val?.toDate) return val.toDate().toLocaleDateString();
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
};

export default function AnnouncementsPanel({ items = [], loading = false, error = null, skeletonCount = 3 }) {
    const { t } = useTranslation();
    const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);

    const Card = ({ a }) => {
        const dateLabel = formatDate(a.date || a.createdAt);
        const title = a.title || t("announcements.untitled");
        const desc = toText(a.description || a.content || "");

        return (
            <Link
                to={`/announcement/${a.id}`}
                className="block w-full group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition overflow-hidden"
            >
                <div className="flex gap-4 p-4 md:p-6">
                    <div className="h-24 w-24 md:h-24 md:w-40 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                        {a.imageURL ? (
                            <img
                                src={a.imageURL}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/0" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="text-sm md:text-base font-semibold text-white truncate">{title}</div>

                            {!!dateLabel && (
                                <span className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white/80">
                                    {dateLabel}
                                </span>
                            )}
                        </div>

                        {!!desc && <div className="text-xs md:text-sm text-white/85 line-clamp-2 mt-2">{desc}</div>}

                        <div className="mt-3 md:mt-4 flex items-center gap-2">
                            <span className="text-xs text-primary font-semibold group-hover:underline">
                                {t("announcements.openDetails")}
                            </span>
                            {a.ctaLabel && a.ctaURL ? <span className="text-[11px] text-white/60">• {a.ctaLabel}</span> : null}
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 h-full md:min-h-[560px] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <div className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </span>
                        {t("announcements.title")}
                    </div>
                    <div className="text-xs text-white/70 mt-1">{t("announcements.subtitle")}</div>
                </div>

                <Link to="/announcements" className="text-xs text-primary hover:underline font-semibold">
                    {t("announcements.seeMore")}
                </Link>
            </div>

            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="space-y-3 md:space-y-4">
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                            <AnnouncementSkeletonCard key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-400 py-6 text-center">{error}</div>
                ) : list.length === 0 ? (
                    <div className="text-sm text-white/70 py-8 text-center">{t("announcements.empty")}</div>
                ) : (
                    <>
                        <div className="hidden md:flex flex-col gap-4 h-full">
                            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                                <div className="grid gap-4">
                                    {list.map((a) => (
                                        <Card key={a.id} a={a} />
                                    ))}
                                </div>
                            </div>
                            <div className="h-6" />
                        </div>

                        <div className="md:hidden -mx-5">
                            <div
                                className="flex gap-4 px-5 pb-2 overflow-x-auto snap-x snap-mandatory"
                                style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
                            >
                                {list.map((a) => (
                                    <div key={a.id} className="snap-start shrink-0 w-[94%]">
                                        <Card a={a} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
