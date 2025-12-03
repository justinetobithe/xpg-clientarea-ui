import React, { useMemo, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from '@headlessui/react';
import { X, ExternalLink } from 'lucide-react';
import Row from "../components/Row";
import { useAnnouncementStore } from "../store/announcementStore";
import { isRecent, formatLongDate } from "../utils/utils";

const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden shadow-xl bg-[#0f1218] border border-white/10 animate-pulse">
        <div className="h-40 bg-white/5" />
        <div className="p-4">
            <div className="h-4 bg-white/10 rounded w-4/5 mb-2" />
            <div className="h-3 bg-white/10 rounded w-3/5 mb-4" />
            <div className="h-8 bg-white/10 rounded w-full" />
            <div className="h-8 bg-white/10 rounded w-full mt-2" />
        </div>
    </div>
);

export default function Announcements() {
    const { items, loading } = useAnnouncementStore();
    const [detail, setDetail] = useState(null);
    const navigate = useNavigate();

    const grouped = useMemo(() => {
        const all = Array.isArray(items) ? items : [];
        const newReleases = all.filter(
            (a) =>
                (a.category || "").toLowerCase().includes("new") ||
                (a.tags || []).map(String).some((t) => t.toLowerCase() === "new") ||
                isRecent(a.createdAt || a.date)
        );
        const recentlyUpdated = all.filter(
            (a) =>
                (a.category || "").toLowerCase().includes("updated") ||
                (a.tags || []).map(String).some((t) => t.toLowerCase() === "updated")
        );
        const otherIds = new Set([...newReleases, ...recentlyUpdated].map((x) => x.id));
        const otherNews = all.filter((a) => !otherIds.has(a.id));
        return { newReleases, recentlyUpdated, otherNews };
    }, [items]);

    return (
        <div className="min-h-screen bg-[#0b0d13] pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <h1 className="text-white font-extrabold text-3xl sm:text-4xl">
                    Client Area Announcements
                </h1>
                <p className="text-white/80 mt-1">
                    Stay informed with the latest news, events, and updates.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading || items === null ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        <Row title="New Releases" items={grouped.newReleases} onOpen={setDetail} />
                        <Row title="Recently Updated" items={grouped.recentlyUpdated} onOpen={setDetail} />
                        <Row title="Other News" items={grouped.otherNews} onOpen={setDetail} />
                    </>
                )}
            </div>
 
            <Transition appear show={Boolean(detail)} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setDetail(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-75" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-[#111318] p-0 text-left align-middle shadow-2xl transition-all border border-white/10">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white p-4 border-b border-white/10 flex justify-between items-center">
                                        {detail?.title || "Announcement Details"}
                                        <button
                                            type="button"
                                            className="text-white/80 hover:text-white transition"
                                            onClick={() => setDetail(null)}
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </Dialog.Title>

                                    <div className="py-0">
                                        {detail?.imageURL && (
                                            <div className="w-full bg-[#0b0d13]">
                                                <img
                                                    alt={detail.title}
                                                    src={detail.imageURL}
                                                    className="w-full h-auto block object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="p-6">
                                            <p className="text-white/70 text-xs mb-3">
                                                {formatLongDate(detail?.date || detail?.createdAt || new Date())}
                                            </p>

                                            {detail?.content ? (
                                                <div
                                                    className="text-white/90 prose prose-invert max-w-none text-sm leading-relaxed announcement-content [&>p]:mb-3 [&>a]:text-blue-400"
                                                    dangerouslySetInnerHTML={{ __html: detail.content }}
                                                />
                                            ) : (
                                                <p className="text-white/80">No content provided.</p>
                                            )}

                                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (detail?.id) navigate(`/announcements/${detail.id}`);
                                                        setDetail(null);
                                                    }}
                                                    className="w-full sm:w-auto flex-1 justify-center inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-gray-900 bg-[#ff8d47] hover:bg-[#ff9f1a] transition"
                                                >
                                                    View Details Page
                                                </button>
                                                {detail?.packURL && (
                                                    <a
                                                        href={detail.packURL}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="w-full sm:w-auto flex-1 justify-center inline-flex items-center px-4 py-2 border border-white/20 text-sm font-bold rounded-md text-amber-300 hover:bg-white/10 transition"
                                                    >
                                                        <ExternalLink className="w-5 h-5 mr-1" />
                                                        View Marketing Pack
                                                    </a>
                                                )}
                                            </div>
                                        </div>
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