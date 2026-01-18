import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

function AnnouncementSkeletonCard() {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 animate-pulse">
            <div className="flex gap-4">
                <div className="h-20 w-32 rounded-xl bg-white/10 shrink-0" />
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

const toText = (html = "") => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const formatDate = (val) => {
    if (!val) return "";
    if (val?.toDate) return val.toDate().toLocaleDateString();
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString();
};

const formatLongDate = (val) => {
    if (!val) return "";
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { year: "numeric", month: "long", day: "2-digit" });
};

export default function AnnouncementsPanel({ items = [], loading = false, error = null, skeletonCount = 3 }) {
    const { t } = useTranslation();
    const [detail, setDetail] = useState(null);
    const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);

    const Card = ({ a }) => {
        const dateLabel = formatDate(a.date || a.createdAt);
        const title = a.title || t("announcements.untitled");
        const desc = toText(a.description || a.content || "");

        return (
            <button
                type="button"
                onClick={() => setDetail(a)}
                className="w-full text-left group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition overflow-hidden"
            >
                <div className="flex gap-4 p-5 md:p-6">
                    <div className="h-20 w-32 md:h-24 md:w-40 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
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
                                <span className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white/70">
                                    {dateLabel}
                                </span>
                            )}
                        </div>

                        {!!desc && <div className="text-xs md:text-sm text-white/70 line-clamp-2 mt-2">{desc}</div>}

                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs text-primary font-semibold group-hover:underline">
                                {t("announcements.openDetails")}
                            </span>
                            {a.ctaLabel && a.ctaURL && <span className="text-[11px] text-white/50">• {a.ctaLabel}</span>}
                        </div>
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 h-full min-h-[560px] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <div className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </span>
                        {t("announcements.title")}
                    </div>
                    <div className="text-xs text-white/60 mt-1">{t("announcements.subtitle")}</div>
                </div>

                <Link to="/announcements" className="text-xs text-primary hover:underline font-semibold">
                    {t("announcements.seeMore")}
                </Link>
            </div>

            <div className="flex-1 min-h-0">
                {loading && (
                    <div className="space-y-3 md:space-y-4">
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                            <AnnouncementSkeletonCard key={i} />
                        ))}
                    </div>
                )}

                {!loading && error && <div className="text-sm text-red-400 py-6 text-center">{error}</div>}

                {!loading && !error && list.length === 0 && (
                    <div className="text-sm text-white/60 py-8 text-center">{t("announcements.empty")}</div>
                )}

                {!loading && !error && list.length > 0 && (
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
                            <div className="px-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-xs font-semibold text-white/70">{t("announcements.swipe")}</div>
                                    <div className="flex gap-1.5">
                                        {list.slice(0, 6).map((a, i) => (
                                            <span key={a.id || i} className="h-1.5 w-1.5 rounded-full bg-white/25" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 px-5 pb-1 overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
                                {list.map((a) => (
                                    <div key={a.id} className="snap-start shrink-0 w-[92%] sm:w-[80%]">
                                        <Card a={a} />
                                    </div>
                                ))}
                            </div>

                            <div className="px-5 mt-3 text-[11px] text-white/50">{t("announcements.swipeHint")}</div>
                        </div>
                    </>
                )}
            </div>

            <Transition appear show={Boolean(detail)} as={Fragment}>
                <Dialog as="div" className="relative z-[80]" onClose={() => setDetail(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/75" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="min-h-full flex items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="transition duration-200 ease-out"
                                enterFrom="opacity-0 scale-95 translate-y-1"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="transition duration-150 ease-in"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 translate-y-1"
                            >
                                <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f1118] shadow-2xl">
                                    <div className="relative">
                                        {detail?.imageURL ? (
                                            <div className="h-56 md:h-72 bg-black/40">
                                                <img
                                                    src={detail.imageURL}
                                                    alt={detail?.title || t("announcements.modal.fallbackTitle")}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-44 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                                        <button
                                            type="button"
                                            onClick={() => setDetail(null)}
                                            className="absolute top-3 right-3 rounded-full p-2 bg-black/40 border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>

                                        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                                            <Dialog.Title className="text-xl md:text-2xl font-extrabold text-white leading-snug">
                                                {detail?.title || t("announcements.modal.fallbackTitle")}
                                            </Dialog.Title>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className="text-[11px] px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white/70">
                                                    {formatLongDate(detail?.date || detail?.createdAt)}
                                                </span>
                                                {detail?.category && (
                                                    <span className="text-[11px] px-2 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary">
                                                        {String(detail.category)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 md:p-6">
                                        {detail?.content ? (
                                            <div
                                                className="prose prose-invert max-w-none text-sm md:text-[15px] leading-relaxed prose-p:my-3 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-li:my-1 prose-h1:text-white prose-h2:text-white prose-h3:text-white"
                                                dangerouslySetInnerHTML={{ __html: detail.content }}
                                            />
                                        ) : (
                                            <div className="text-white/80 text-sm">
                                                {toText(detail?.description || "") || t("announcements.modal.noContent")}
                                            </div>
                                        )}

                                        {(detail?.ctaLabel && detail?.ctaURL) || detail?.packURL ? (
                                            <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                                {detail?.ctaLabel && detail?.ctaURL && (
                                                    <a
                                                        href={detail.ctaURL}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-black font-bold px-4 py-2.5 text-sm hover:opacity-90 transition"
                                                    >
                                                        {detail.ctaLabel}
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}

                                                {detail?.packURL && (
                                                    <a
                                                        href={detail.packURL}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] text-white font-semibold px-4 py-2.5 text-sm hover:bg-white/[0.06] transition"
                                                    >
                                                        {t("announcements.modal.viewMarketingPack")}
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
