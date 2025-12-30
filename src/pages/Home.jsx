import { useEffect } from "react";
import RecentDownloadsPanel from "../components/home/RecentDownloadsPanel";
import AnnouncementsPanel from "../components/home/AnnouncementsPanel";
import GamesSection from "../components/home/GamesSection";
import HeroBanner from "../components/common/HeroBanner";
import { useAuthStore } from "../store/authStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useAnnouncementStore } from "../store/announcementStore";

export default function Home() {
    const user = useAuthStore((s) => s.user);

    const downloads = useDownloadsStore((s) => s.downloads);
    const loadingDownloads = useDownloadsStore((s) => s.loading);
    const downloadsError = useDownloadsStore((s) => s.error);
    const startUserDownloadsListener = useDownloadsStore((s) => s.startUserDownloadsListener);
    const stopUserDownloadsListener = useDownloadsStore((s) => s.stopUserDownloadsListener);

    const announcements = useAnnouncementStore((s) => s.items);
    const loadingAnnouncements = useAnnouncementStore((s) => s.loading);
    const announcementsError = useAnnouncementStore((s) => s.error);
    const startAnnouncementsListener = useAnnouncementStore((s) => s.startAnnouncementsListener);
    const stopAnnouncementsListener = useAnnouncementStore((s) => s.stopAnnouncementsListener);

    useEffect(() => {
        if (!user?.uid) {
            stopUserDownloadsListener();
            return;
        }
        startUserDownloadsListener(user.uid, 10);
        return () => stopUserDownloadsListener();
    }, [user?.uid, startUserDownloadsListener, stopUserDownloadsListener]);

    useEffect(() => {
        startAnnouncementsListener(8);
        return () => stopAnnouncementsListener();
    }, [startAnnouncementsListener, stopAnnouncementsListener]);

    return (
        <div className="w-full">
            <HeroBanner image="/image/welcome-banner.png" className="-mt-16 md:-mt-20">
                <div className="h-full flex items-center justify-center px-6">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/40 px-5 py-1.5 mb-4 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
                            <span className="text-[11px] md:text-xs font-semibold tracking-[0.32em] text-white/70">
                                WELCOME TO THE
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-tight">
                            <span className="block bg-gradient-to-r from-white via-amber-200 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_14px_40px_rgba(0,0,0,0.95)]">
                                CLIENT AREA
                            </span>
                        </h1>
                    </div>
                </div>
            </HeroBanner>

            <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RecentDownloadsPanel items={downloads} loading={loadingDownloads} error={downloadsError} />
                    <AnnouncementsPanel items={announcements} loading={loadingAnnouncements} error={announcementsError} />
                </div>

                <GamesSection />
            </div>
        </div>
    );
}
