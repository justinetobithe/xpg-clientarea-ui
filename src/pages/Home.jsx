import RecentDownloadsPanel from "../components/home/RecentDownloadsPanel";
import AnnouncementsPanel from "../components/home/AnnouncementsPanel";
import GamesSection from "../components/home/GamesSection";

export default function Home() {
    const recentDownloads = [
        { id: 1, name: "Baccarat_Assets_Pack.zip", date: "2025-10-01", url: "#" },
        { id: 2, name: "Roulette_Logo_AI.ai", date: "2025-10-01", url: "#" },
        { id: 3, name: "Blackjack_Banner.psd", date: "2025-10-01", url: "#" },
        { id: 4, name: "DragonTiger_Video.mp4", date: "2025-10-01", url: "#" },
        { id: 5, name: "SicBo_KeyVisual.png", date: "2025-10-01", url: "#" }
    ];

    const announcements = [
        {
            id: 1,
            title: "Lightning Roulette Assets Updated!",
            body: "New key visuals, thumbnails and promo pack have been added to the portal.",
            date: "Nov 21, 2025",
            image: "/image/welcome-banner.png",
            links: [
                { label: "Read Announcement", to: "/announcements" },
                { label: "View Marketing Pack", to: "/brands" }
            ]
        },
        {
            id: 2,
            title: "New Baccarat Dealer Shots",
            body: "Fresh studio shots are now available for all partners.",
            date: "Nov 10, 2025",
            image: "/image/welcome-banner.png",
            links: [{ label: "Download Pack", to: "/brands" }]
        }
    ];

    return (
        <div className="w-full">
            <section className="relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden border-b border-border">
                <div className="relative h-[320px] md:h-[650px]">
                    <img
                        src="/image/welcome-banner.png"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                        <div className="text-sm md:text-base tracking-widest text-white/70 mb-2">
                            WELCOME TO THE
                        </div>
                        <div className="text-3xl md:text-6xl font-extrabold text-white">
                            CLIENT AREA
                        </div>
                    </div>
                </div>
            </section>

            <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RecentDownloadsPanel items={recentDownloads} />
                    <AnnouncementsPanel items={announcements} />
                </div>

                <GamesSection />
            </div>
        </div>
    );
}