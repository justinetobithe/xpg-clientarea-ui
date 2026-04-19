import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function AnnouncementSkeletonCard() {
    return (
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5 md:p-6 animate-pulse">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,123,29,0.10),transparent_30%)]" />
            <div className="relative flex gap-4">
                <div className="h-20 w-20 rounded-2xl bg-white/10 shrink-0 md:h-24 md:w-40" />
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
            className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                "bg-primary/12 border border-primary/30 text-primary",
                "hover:bg-primary/22 hover:border-primary/45 hover:scale-[1.02]"
            )}
            title={label}
        >
            <span className="truncate max-w-[180px]">{label}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
    );
}

export default function AnnouncementsPanel({ items = [], loading = false, error = null, skeletonCount = 3 }) {
    const { t } = useTranslation();
    const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);

    const Card = ({ a, index }) => {
        const dateLabel = formatDate(a.date || a.createdAt);
        const title = a.title || t("announcements.untitled");
        const desc = toText(a.description || a.content || "");

        return (
            <Link
                to={`/announcement/${a.id}`}
                className="block w-full group"
                style={{ animationDelay: `${index * 60}ms` }}
            >
                <div
                    className={cx(
                        "relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]",
                        "shadow-[0_16px_44px_-24px_rgba(0,0,0,0.9)] transition-all duration-300",
                        "hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.06]",
                        "hover:shadow-[0_22px_54px_-20px_rgba(255,123,29,0.18)]"
                    )}
                >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/12 blur-2xl" />
                        <div className="absolute inset-x-[-25%] top-0 h-full rotate-12 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                    </div>

                    <div className="relative flex gap-4 p-4 md:p-6">
                        <div className="h-24 w-24 md:h-24 md:w-40 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            {a.imageURL ? (
                                <img
                                    src={a.imageURL}
                                    alt={title}
                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="text-sm md:text-base font-bold text-white truncate">
                                    {title}
                                </div>

                                {!!dateLabel && (
                                    <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-black/35 border border-white/10 text-white/80 backdrop-blur-md">
                                        {dateLabel}
                                    </span>
                                )}
                            </div>

                            {!!desc && (
                                <div className="text-xs md:text-sm text-white/80 line-clamp-2 mt-2 leading-relaxed">
                                    {desc}
                                </div>
                            )}

                            <div className="mt-3 md:mt-4 flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2 text-xs text-primary font-semibold">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(255,123,29,0.75)]" />
                                    {t("announcements.openDetails")}
                                </span>

                                <CtaBadge label={a.ctaLabel} url={a.ctaURL} />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="relative overflow-hidden bg-card border border-border rounded-[26px] p-5 md:p-6 h-full md:min-h-[560px] flex flex-col shadow-[0_20px_60px_-28px_rgba(0,0,0,0.95)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,123,29,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_30%)]" />

            <div className="relative flex items-center justify-between mb-4 shrink-0">
                <div>
                    <div className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 shadow-[0_8px_22px_rgba(255,123,29,0.14)]">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </span>
                        {t("announcements.title")}
                    </div>
                    <div className="text-xs text-white/70 mt-1">{t("announcements.subtitle")}</div>
                </div>

                <Link
                    to="/announcements"
                    className="text-xs text-primary hover:text-primary/90 hover:underline font-semibold transition"
                >
                    {t("announcements.seeMore")}
                </Link>
            </div>

            <div className="relative flex-1 min-h-0">
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
                            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
                                {list.map((a, index) => (
                                    <Card key={a.id} a={a} index={index} />
                                ))}
                            </div>
                            <div className="h-6" />
                        </div>

                        <div className="md:hidden -mx-5">
                            <div
                                className="flex gap-4 px-5 pb-2 overflow-x-auto snap-x snap-mandatory"
                                style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
                            >
                                {list.map((a, index) => (
                                    <div key={a.id} className="snap-start shrink-0 w-[94%]">
                                        <Card a={a} index={index} />
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