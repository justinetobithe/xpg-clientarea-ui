import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAnnouncementStore } from "../store/announcementStore";
import { toDate } from "../utils/utils";
import PageShell from "../components/common/PageShell";

const RecommendedSkeleton = () => (
    <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center animate-pulse">
                <div className="col-span-1 h-16 bg-white/10 rounded" />
                <div className="col-span-2 space-y-1">
                    <div className="h-4 bg-white/10 rounded w-4/5" />
                    <div className="h-3 bg-white/10 rounded w-2/5" />
                </div>
            </div>
        ))}
    </div>
);

export default function AnnouncementDetails() {
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
        const currTags = new Set((item?.tags || []).map((t) => String(t).toLowerCase()));

        const primary = others.filter((a) =>
            (a.tags || []).some((t) => currTags.has(String(t).toLowerCase()))
        );

        const merged = [...primary, ...others].filter(
            (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i
        );

        return merged.slice(0, 6);
    }, [list, id, item]);

    const displayDate = item ? toDate(item.date || item.createdAt).toLocaleString() : "";

    const headerRight = (
        <button
            onClick={() => navigate("/announcements")}
            className="hidden md:inline-flex items-center gap-2 rounded-xl border border-border bg-black/20 px-4 py-2 text-white/80 hover:text-white hover:bg-black/30 transition"
        >
            <ArrowLeft className="h-4 w-4" />
            Back
        </button>
    );

    return (
        <PageShell
            crumb="Home / Announcements / Details"
            title={loadingItem ? "Loading..." : item?.title || "Announcement"}
            subtitle={loadingItem ? "" : displayDate}
            right={headerRight}
        >
            <div className="md:hidden mb-5">
                <button
                    onClick={() => navigate("/announcements")}
                    className="inline-flex items-center text-sm font-semibold text-primary hover:opacity-80 transition"
                >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to Announcements
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                    <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                        {loadingItem ? (
                            <div className="p-6">
                                <div className="h-64 bg-white/5 rounded-lg mb-4 animate-pulse" />
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
                                    <div className="w-full bg-black/30">
                                        <img
                                            src={item.imageURL}
                                            alt={item.title || "Announcement"}
                                            className="w-full h-auto block object-cover"
                                        />
                                    </div>
                                ) : null}

                                <div className="p-6">
                                    <h1 className="text-white text-2xl font-extrabold mb-1">
                                        {item.title || "Announcement"}
                                    </h1>

                                    <p className="text-white/70 text-xs mb-4">{displayDate}</p>

                                    {item.content ? (
                                        <div
                                            className="text-white/90 prose prose-invert max-w-none text-sm leading-relaxed [&>p]:mb-3 [&>ul]:pl-5 [&>ul]:mb-3 [&>a]:text-blue-400"
                                            dangerouslySetInnerHTML={{ __html: item.content }}
                                        />
                                    ) : (
                                        <p className="text-white/80">No content provided.</p>
                                    )}

                                    {item.packURL ? (
                                        <a
                                            href={item.packURL}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-6 inline-flex items-center px-4 py-2 border border-white/20 text-sm font-bold rounded-xl text-primary hover:bg-white/10 transition"
                                        >
                                            <ExternalLink className="w-5 h-5 mr-2" />
                                            View Marketing Pack
                                        </a>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <div className="p-6 text-center">
                                <h1 className="text-white text-2xl font-extrabold mb-2">
                                    Announcement Not Found
                                </h1>
                                <p className="text-white/70">
                                    The requested announcement could not be loaded.
                                </p>
                                <div className="mt-5">
                                    <Link
                                        to="/announcements"
                                        className="inline-flex items-center justify-center rounded-xl bg-primary text-black font-bold px-5 py-2.5 hover:opacity-90 transition"
                                    >
                                        Back to Announcements
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-4">
                    <div className="bg-card rounded-2xl border border-border shadow-lg p-4">
                        <h2 className="text-white font-extrabold mb-2">Recommended</h2>
                        <div className="border-t border-white/10 mb-4" />

                        {!Array.isArray(list) ? (
                            <RecommendedSkeleton />
                        ) : recommended.length > 0 ? (
                            <div className="space-y-3">
                                {recommended.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => navigate(`/announcement/${a.id}`)}
                                        className="w-full text-left grid grid-cols-3 gap-3 items-center hover:bg-white/5 p-2 -m-2 rounded-xl transition"
                                    >
                                        <div className="col-span-1 h-14 w-full bg-black/30 overflow-hidden rounded-lg border border-white/10">
                                            {a.imageURL || a.cover || a.thumbnail ? (
                                                <img
                                                    alt={a.title || "Announcement"}
                                                    src={a.imageURL || a.cover || a.thumbnail}
                                                    className="w-full h-full object-cover block"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800" />
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-white font-semibold line-clamp-2 hover:text-primary transition">
                                                {a.title || "Announcement"}
                                            </p>
                                            <p className="text-white/60 text-xs mt-0.5">
                                                {toDate(a.date || a.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/70">No recommendations yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
