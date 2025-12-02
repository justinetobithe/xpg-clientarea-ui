export default function Home() {
    return (
        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto w-full">
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
                <div className="relative h-[220px] md:h-[320px]">
                    <img src="/image/bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                        <div className="text-sm md:text-base tracking-widest text-white/70 mb-2">
                            WELCOME TO THE
                        </div>
                        <div className="text-3xl md:text-5xl font-extrabold text-white">
                            CLIENT AREA
                        </div>
                        <div className="text-white/80 text-base md:text-lg mt-3 max-w-2xl">
                            Your central place for XPG marketing assets, demos, game info, and partner resources.
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="text-lg font-semibold mb-4">Recent Downloads</div>
                    <div className="space-y-3 text-sm text-white/80">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between bg-background/30 rounded-lg px-3 py-2">
                                <div>
                                    <div className="font-medium text-white">File {i + 1}</div>
                                    <div className="text-white/60">2025-10-01</div>
                                </div>
                                <button className="text-primary font-semibold">Download</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="text-lg font-semibold mb-4">All Games</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {[
                            "Baccarat",
                            "Blackjack",
                            "Roulette",
                            "Andar Bahar",
                            "Teen Patti",
                            "32 Cards",
                            "Sic Bo",
                            "Dragon Tiger"
                        ].map((g) => (
                            <div key={g} className="bg-background/30 rounded-xl p-3 text-center text-white font-medium">
                                {g}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
