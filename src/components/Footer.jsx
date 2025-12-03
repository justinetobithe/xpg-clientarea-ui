export default function Footer() {
    return (
        <footer className="border-border bg-black/90">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                    <img src="/image/logo-white.png" alt="XPG" className="h-9 md:h-10 object-contain" />
                    <div className="text-xs tracking-[0.25em] text-white/70">CLIENT AREA</div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-90">
                    <img src="/image/gibraltar.png" alt="Gibraltar" className="h-6 md:h-7 object-contain" />
                    <img src="/image/MGA-New-Grayscale.png" alt="MGA" className="h-6 md:h-7 object-contain" />
                    <img src="/image/ecogra.png" alt="eCOGRA" className="h-6 md:h-7 object-contain" />
                    <img src="/image/responsible-gaming.png" alt="Responsible Gaming" className="h-6 md:h-7 object-contain" />
                    <img src="/image/be-gamble-aware-gray-footer.png" alt="BeGambleAware" className="h-6 md:h-7 object-contain" />
                    <img src="/image/gambling-commission.png" alt="Gambling Commission" className="h-6 md:h-7 object-contain" />
                </div>

                <div className="mt-6 text-[11px] md:text-xs leading-relaxed text-white/60 max-w-4xl mx-auto">
                    XPG’s logo and brand materials are intellectual property of XPG and may not be copied,
                    reproduced, distributed, or displayed without written permission. Access to this Client Area
                    is restricted to approved partners and customers only. Any unauthorized sharing, re-hosting,
                    or distribution of marketing assets, game media, or confidential materials is strictly prohibited.
                    By using this portal you agree to comply with applicable regulations and responsible gaming
                    standards. For support, licensing, and compliance information, please contact your XPG account
                    manager.
                </div>

                <div className="mt-6 text-[11px] md:text-xs text-white/50">
                    Copyright © 2008 – 2025 XPG. All Rights Reserved.
                </div>
            </div>
        </footer>
    );
}
