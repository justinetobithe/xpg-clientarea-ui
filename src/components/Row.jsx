import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FileText, Archive, Sparkles } from "lucide-react";
import { isRecent, formatLongDate } from "../utils/utils";
import { useTranslation } from "react-i18next";

export default function Row({ title, items, onOpen }) {
    const { t } = useTranslation();
    const [page, setPage] = useState(0);
    const pageSize = 4;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const visible = useMemo(() => items.slice(page * pageSize, page * pageSize + pageSize), [items, page]);

    return (
        <div className="mt-8">
            <h2 className="text-white font-extrabold text-xl mb-4">{title}</h2>

            <div className="relative">
                {totalPages > 1 && (
                    <button
                        aria-label={t("row.prev")}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="absolute z-10 top-1/2 -translate-y-1/2 -left-3 p-2 rounded-full text-white bg-black/60 transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/80"
                        type="button"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {visible.map((a) => {
                        const img = a?.imageURL || a?.cover || a?.thumbnail || "";
                        const isNew = isRecent(a.createdAt || a.date);
                        return (
                            <div
                                key={a.id}
                                className="rounded-xl overflow-hidden shadow-xl bg-gray-900 border border-white/10 hover:border-orange-400 transition duration-300"
                            >
                                <div className="relative h-40 bg-gray-800">
                                    {img ? (
                                        <img
                                            src={img}
                                            alt={a.title || t("row.announcementCoverAlt")}
                                            loading="lazy"
                                            className="w-full h-full object-cover block cursor-pointer transition duration-300 hover:scale-[1.02]"
                                            onClick={() => onOpen(a)}
                                        />
                                    ) : (
                                        <div
                                            onClick={() => onOpen(a)}
                                            className="h-full w-full flex items-center justify-center text-sm tracking-wider text-white/50 cursor-pointer bg-gradient-to-br from-[#202737] to-[#232a3b]"
                                        >
                                            {t("row.noImage")}
                                        </div>
                                    )}

                                    {isNew && (
                                        <span className="absolute top-2 right-2 flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
                                            <Sparkles className="w-4 h-4 mr-1" />
                                            {t("row.new")}
                                        </span>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 title={a.title} className="text-white font-extrabold text-base leading-snug truncate mb-1">
                                        {a.title || t("announcements.untitled")}
                                    </h3>

                                    <p className="text-white/60 text-xs mb-3">
                                        {formatLongDate(a.date || a.createdAt || new Date())}
                                    </p>

                                    <div className="space-y-2">
                                        <button
                                            onClick={() => onOpen(a)}
                                            className="flex items-center justify-start w-full text-sm font-bold px-3 py-2 rounded-lg text-amber-300 border border-white/10 hover:bg-white/10 transition"
                                            type="button"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            {t("row.readAnnouncement")}
                                        </button>

                                        {a.packURL && (
                                            <a
                                                href={a.packURL}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-start w-full text-sm font-bold px-3 py-2 rounded-lg text-amber-300 border border-white/10 hover:bg-white/10 transition"
                                            >
                                                <Archive className="w-4 h-4 mr-2" />
                                                {t("row.viewMarketingPack")}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {items.length === 0 && (
                        <div className="col-span-4 text-white/70 py-6 text-center">
                            {t("row.empty")}
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <button
                        aria-label={t("row.next")}
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="absolute z-10 top-1/2 -translate-y-1/2 -right-3 p-2 rounded-full text-white bg-black/60 transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/80"
                        type="button"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
