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
                        <label
                            key={name}
                            className="flex items-center gap-2 text-sm text-white/90"
                        >
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

                <div className="text-primary font-bold mb-1">Follow Us</div>
                <div className="text-sm text-white/80">
                    @XPG Live
                    <br />
                    @xpg.live
                </div>

                <div className="h-px bg-white/10 my-3" />

                <div className="text-primary font-bold mb-1">Contact Us</div>
                <div className="text-sm text-white/80">
                    Missing a file? Send your request to
                    <br />
                    xpg@live.com
                </div>
            </div>
        </aside>
    );
}
