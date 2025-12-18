import { Download, FileText, ShieldCheck } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black/90 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-12 text-center">
                <div className="flex flex-col items-center">
                    <img
                        src="/image/logo-white.png"
                        alt="XPG"
                        className="h-10 md:h-12 object-contain"
                    />

                    <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="h-9 w-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                            <FileText size={16} className="text-white/80" />
                        </div>
                        <div className="h-9 w-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                            <Download size={16} className="text-white/80" />
                        </div>
                        <div className="h-9 w-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                            <ShieldCheck size={16} className="text-white/80" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-[11px] md:text-xs leading-relaxed text-white/70 max-w-4xl mx-auto">
                    XPG Live&apos;s logo and graphic materials are the exclusive intellectual property of XPG Live and may not
                    be copied, reproduced, distributed, or displayed without prior written consent from XPG Live. XPG Live
                    operates in full compliance with gaming regulations across multiple jurisdictions. We are committed to
                    protecting your privacy.
                </div>

                <div className="mt-3 text-[12px] md:text-sm font-semibold text-white/85">
                    Copyright © 2008 - 2025 XPG. All Rights Reserved.
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                    <img
                        src="/image/gibraltar.png"
                        alt="Gibraltar"
                        className="h-6 md:h-7 object-contain opacity-90"
                        style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                    />
                    <img
                        src="/image/MGA-New-Grayscale.png"
                        alt="MGA"
                        className="h-6 md:h-7 object-contain opacity-90"
                        style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                    />
                    <img
                        src="/image/responsible-gaming.png"
                        alt="Responsible Gaming"
                        className="h-6 md:h-7 object-contain opacity-90"
                        style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                    />
                    <img
                        src="/image/be-gamble-aware-gray-footer.png"
                        alt="BeGambleAware"
                        className="h-6 md:h-7 object-contain opacity-90"
                        style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                    />
                    <img
                        src="/image/ecogra.png"
                        alt="eCOGRA"
                        className="h-6 md:h-7 object-contain opacity-90"
                        style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                    />
                    <img
                        src="/image/gambling-commission.png"
                        alt="Gambling Commission"
                        className="h-6 md:h-7 object-contain opacity-90"
                        style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                    />
                </div>
            </div>
        </footer>
    );
}
