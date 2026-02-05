import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound({
    title = "Page not found",
    message = "The page you are looking for doesn’t exist or was moved.",
    showBack = true,
}) {
    const navigate = useNavigate();

    const hint = useMemo(() => {
        const t = String(title || "").toLowerCase();
        if (t.includes("game")) return "Please check the game id in the URL and try again.";
        return "Please check the URL and try again.";
    }, [title]);

    return (
        <div className="min-h-[calc(var(--vvh,1vh)*100)] bg-[#0b0d13] text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_25%_0%,rgba(255,166,0,0.18),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_80%_30%,rgba(255,255,255,0.07),transparent_55%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/75" />
            </div>

            <div className="relative max-w-3xl mx-auto px-4 pt-16 pb-12 md:pt-20">
                <div className="flex justify-center">
                    <img src="/image/logo-white.png" alt="Logo" className="h-[90px]" />
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl overflow-hidden">
                    <div className="px-6 py-7 md:px-10 md:py-10">
                        <div className="flex flex-col items-center text-center">
                            <div className="text-[72px] md:text-[92px] leading-none font-black tracking-tight text-white/10 select-none">
                                404
                            </div>

                            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold">{title}</h1>
                            <p className="mt-2 text-sm md:text-base text-white/70 max-w-xl">{message}</p>

                            <div className="mt-5 w-full max-w-xl rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
                                {hint}
                            </div>

                            <div className="mt-7 w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {showBack && (
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] hover:bg-white/[0.06] px-4 py-3 font-semibold transition"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-black px-4 py-3 font-extrabold hover:opacity-90 transition"
                                >
                                    <Home className="h-4 w-4" />
                                    Home
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/search")}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] hover:bg-white/[0.06] px-4 py-3 font-semibold transition"
                                >
                                    <Search className="h-4 w-4" />
                                    Search
                                </button>
                            </div>

                            <div className="mt-8 text-xs text-white/40">
                                If this keeps happening, the item may have been removed or your account may not have access.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-white/35">
                    © {new Date().getFullYear()} XPG
                </div>
            </div>
        </div>
    );
}
