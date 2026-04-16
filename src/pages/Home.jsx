import { useEffect } from "react";
import RecentDownloadsPanel from "../components/home/RecentDownloadsPanel";
import AnnouncementsPanel from "../components/home/AnnouncementsPanel";
import GamesSection from "../components/home/GamesSection";
import HeroBanner from "../components/common/HeroBanner";
import { useAuthStore } from "../store/authStore";
import { useDownloadsStore } from "../store/downloadsStore";
import { useAnnouncementStore } from "../store/announcementStore";
import { useTranslation } from "react-i18next";

function useMobileViewportFix(enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const setVars = () => {
            const h = window.innerHeight || 0;
            if (h) {
                document.documentElement.style.setProperty("--app-vh", `${h * 0.01}px`);
            }
            if (window.visualViewport?.height) {
                document.documentElement.style.setProperty("--vvh", `${window.visualViewport.height * 0.01}px`);
            }
        };

        setVars();

        const vv = window.visualViewport;
        const onVV = () => setVars();

        if (vv) {
            vv.addEventListener("resize", onVV);
            vv.addEventListener("scroll", onVV);
        }

        window.addEventListener("resize", setVars);
        window.addEventListener("orientationchange", setVars);

        return () => {
            window.removeEventListener("resize", setVars);
            window.removeEventListener("orientationchange", setVars);
            if (vv) {
                vv.removeEventListener("resize", onVV);
                vv.removeEventListener("scroll", onVV);
            }
        };
    }, [enabled]);
}

export default function Home() {
    const { t } = useTranslation();
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

    useMobileViewportFix(true);

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
        <div className="w-full min-h-[calc(var(--vvh,var(--app-vh,1vh))*100)] bg-[#0b0d13] overflow-x-hidden">
            <HeroBanner
                image="/image/welcome-banner.png"
                className="mt-0"
                imgClassName="object-[center_20%] sm:object-center"
                overlayClassName="bg-gradient-to-b from-black/35 via-black/60 to-black/85"
                heightClassName="h-[170px] xs:h-[190px] sm:h-[260px] md:h-[420px] lg:h-[680px]"
                priority
            >
                <div
                    className="flex h-full items-start justify-center px-4 pt-16 sm:items-center sm:pt-0"
                    style={{
                        paddingTop: "calc(env(safe-area-inset-top) + 52px)",
                        paddingLeft: "calc(16px + env(safe-area-inset-left))",
                        paddingRight: "calc(16px + env(safe-area-inset-right))",
                    }}
                >
                    <div className="w-full max-w-[92vw] text-center sm:max-w-[88vw]">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 backdrop-blur-sm sm:mb-3 sm:px-4">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
                            <span className="text-[9px] font-semibold tracking-[0.18em] text-white/75 sm:text-[11px] sm:tracking-[0.28em] md:text-xs">
                                {t("home.welcomeBadge")}
                            </span>
                        </div>

                        <h1 className="text-[24px] font-black leading-[1.02] tracking-tight xs:text-[28px] sm:text-5xl md:text-6xl lg:text-[4.5rem]">
                            <span className="block break-words bg-gradient-to-r from-white via-amber-200 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_14px_40px_rgba(0,0,0,0.95)]">
                                {t("home.title")}
                            </span>
                        </h1>
                    </div>
                </div>
            </HeroBanner>

            <div
                className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 md:px-8 sm:py-8"
                style={{
                    paddingLeft: "calc(16px + env(safe-area-inset-left))",
                    paddingRight: "calc(16px + env(safe-area-inset-right))",
                    paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
                }}
            >
                <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 sm:gap-6 md:grid-cols-2 md:gap-8">
                    <div className="min-w-0">
                        <RecentDownloadsPanel items={downloads} loading={loadingDownloads} error={downloadsError} />
                    </div>
                    <div className="min-w-0">
                        <AnnouncementsPanel items={announcements} loading={loadingAnnouncements} error={announcementsError} />
                    </div>
                </div>

                <GamesSection />
            </div>
        </div>
    );
}