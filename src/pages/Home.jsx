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
        if (!user?.uid) return;
        startUserDownloadsListener(user.uid, 5);
        return () => stopUserDownloadsListener();
    }, [user?.uid, startUserDownloadsListener, stopUserDownloadsListener]);

    useEffect(() => {
        startAnnouncementsListener(3);
        return () => stopAnnouncementsListener();
    }, [startAnnouncementsListener, stopAnnouncementsListener]);

    return (
        <div className="w-full">
            <HeroBanner image="/image/welcome-banner.png" className="-mt-16 md:-mt-20">
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="text-sm md:text-base tracking-widest text-white/70 mb-2">
                        WELCOME TO THE
                    </div>
                    <div className="text-3xl md:text-6xl font-extrabold text-white">
                        CLIENT AREA
                    </div>
                </div>
            </HeroBanner>

            <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RecentDownloadsPanel
                        items={downloads}
                        loading={loadingDownloads}
                        error={downloadsError}
                    />
                    <AnnouncementsPanel
                        items={announcements}
                        loading={loadingAnnouncements}
                        error={announcementsError}
                    />
                </div>

                <GamesSection />
            </div>
        </div>
    );
}
