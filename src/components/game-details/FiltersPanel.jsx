import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function FiltersPanel({
    allSectionNames = [],
    allExtensions = [],
    selectedSectionNames,
    setSelectedSectionNames,
    selectedExts,
    setSelectedExts
}) {
    return (
        <aside className="lg:col-span-3">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-4 sticky top-6">
                <div className="text-primary font-bold mb-2">File Types</div>

                <div className="space-y-2 mb-4">
                    {allSectionNames.map((name) => (
                        <label key={name} className="flex items-center gap-2 text-sm text-white/90">
                            <input
                                type="checkbox"
                                checked={selectedSectionNames.has(name)}
                                onChange={(e) => {
                                    const next = new Set(selectedSectionNames);
                                    e.target.checked ? next.add(name) : next.delete(name);
                                    setSelectedSectionNames(next);
                                }}
                                className="accent-primary"
                            />
                            <span className="truncate">{name}</span>
                        </label>
                    ))}
                </div>

                <div className="h-px bg-white/10 my-3" />

                <div className="text-primary font-bold mb-2">File Tags</div>

                <div className="space-y-2 mb-4">
                    {allExtensions.map((ext) => (
                        <label
                            key={ext}
                            className="flex items-start gap-2 text-sm text-white/90 leading-snug break-words"
                        >
                            <input
                                type="checkbox"
                                checked={selectedExts.has(ext)}
                                onChange={(e) => {
                                    const next = new Set(selectedExts);
                                    e.target.checked ? next.add(ext) : next.delete(ext);
                                    setSelectedExts(next);
                                }}
                                className="accent-primary flex-shrink-0 mt-0.5"
                            />
                            <span className="break-all">{ext}</span>
                        </label>
                    ))}
                </div>

                <div className="h-px bg-white/10 my-3" />

                <div className="text-primary font-bold mb-2">Follow Us</div>

                <div className="grid grid-cols-3 gap-2">
                    <a
                        href="https://www.facebook.com/XPG.live.now"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                        aria-label="Facebook"
                    >
                        <Facebook size={16} />
                        <span className="text-xs font-semibold">FB</span>
                    </a>

                    <a
                        href="https://x.com/XPG_live"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                        aria-label="X / Twitter"
                    >
                        <Twitter size={16} />
                        <span className="text-xs font-semibold">X</span>
                    </a>

                    <a
                        href="https://www.instagram.com/xpg_live/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                        aria-label="Instagram"
                    >
                        <Instagram size={16} />
                        <span className="text-xs font-semibold">IG</span>
                    </a>
                </div>

                <div className="mt-3 text-sm text-white/75">
                    <div className="font-semibold text-white/90">@XPG Live</div>
                    <div className="text-white/70">@xpg.live</div>
                </div>

                <div className="h-px bg-white/10 my-3" />

                <div className="text-primary font-bold mb-2">Contact Us</div>

                <div className="space-y-2 text-sm text-white/80">
                    <a
                        href="tel:+421911628998"
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:text-white"
                    >
                        <Phone size={16} className="text-white/70" />
                        <span>+421 911 628 998</span>
                    </a>

                    <a
                        href="mailto:info@xprogaming.com?subject=XPG%20File%20Request"
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:text-white"
                    >
                        <Mail size={16} className="text-white/70" />
                        <span>info@xprogaming.com</span>
                    </a>

                    <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                        <MapPin size={16} className="text-white/70 mt-0.5" />
                        <span>Bratislava, Slovakia</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
