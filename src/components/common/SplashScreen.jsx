import { useEffect, useState } from "react";

function LoadingDots() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 450);
        return () => clearInterval(id);
    }, []);

    return <span className="inline-block w-[28px] text-left">{["", ".", "..", "..."][step]}</span>;
}

export default function SplashScreen({
    title = "Client Area",
    subtitle = "Preparing your workspace and syncing content",
    logoSrc = "/image/logo-white.png",
    logoAlt = "XPG Client Area",
    loadingLabel = "Loading",
}) {
    return (
        <div
            className="relative min-h-[calc(var(--vvh,var(--app-vh,1vh))*100)] overflow-hidden bg-[#07090f] text-foreground"
            style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
                paddingLeft: "env(safe-area-inset-left)",
                paddingRight: "env(safe-area-inset-right)",
            }}
        >
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,140,0,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,70,0,0.10),transparent_30%),linear-gradient(180deg,#05070c_0%,#090b13_50%,#05070c_100%)]" />
                <div className="absolute -left-20 top-[8%] h-64 w-64 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
                <div className="absolute right-[-60px] top-[18%] h-72 w-72 rounded-full bg-amber-400/10 blur-3xl animate-pulse" />
                <div className="absolute bottom-[8%] left-[10%] h-72 w-72 rounded-full bg-red-500/10 blur-3xl animate-pulse" />
                <div className="absolute bottom-[-60px] right-[8%] h-80 w-80 rounded-full bg-orange-600/10 blur-3xl animate-pulse" />
                <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center opacity-[0.08] scale-110" />
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative z-10 flex min-h-[calc(var(--vvh,var(--app-vh,1vh))*100)] items-center justify-center px-4 py-8 sm:px-6">
                <div className="w-full max-w-[420px]">
                    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                        <div className="absolute -top-16 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-orange-400/10 blur-3xl" />

                        <div className="flex flex-col items-center px-6 py-10 sm:px-8 sm:py-12">
                            <div className="relative mb-6 flex h-[120px] w-full items-center justify-center sm:h-[132px]">
                                <div className="absolute h-24 w-24 rounded-full bg-orange-400/10 blur-2xl animate-pulse" />
                                <img
                                    src={logoSrc}
                                    alt={logoAlt}
                                    className="relative h-[88px] w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:h-[96px]"
                                    draggable={false}
                                />
                            </div>

                            <div className="text-center">
                                <div className="bg-gradient-to-r from-white via-white to-white/75 bg-clip-text text-[16px] font-semibold tracking-[0.24em] text-transparent uppercase sm:text-[17px]">
                                    {title}
                                </div>

                                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-400" />
                                    </span>
                                    <span>
                                        {loadingLabel}
                                        <LoadingDots />
                                    </span>
                                </div>

                                <div className="mt-4 text-xs leading-6 text-white/45 sm:text-[13px]">
                                    {subtitle}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                            <div className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 animate-[loader-slide_1.6s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes loader-slide {
                    0% {
                        transform: translateX(-110%);
                    }
                    50% {
                        transform: translateX(70%);
                    }
                    100% {
                        transform: translateX(220%);
                    }
                }
            `}</style>
        </div>
    );
}