import { useEffect, useMemo, useState } from "react";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

function Section({ title, open, onToggle, children, badge }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.04]"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="text-primary font-bold truncate">{title}</div>
                    {typeof badge !== "undefined" ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/40 text-white/75 border border-white/10">
                            {badge}
                        </span>
                    ) : null}
                </div>
                <ChevronDown
                    className={[
                        "h-4 w-4 text-white/70 transition-transform",
                        open ? "rotate-180" : "rotate-0"
                    ].join(" ")}
                />
            </button>

            <div className={open ? "px-4 pb-4" : "hidden"}>{children}</div>
        </div>
    );
}

export default function FiltersPanel({
    allSectionNames = [],
    allExtensions = [],
    selectedSectionNames,
    setSelectedSectionNames,
    selectedExts,
    setSelectedExts
}) {
    const { t } = useTranslation();

    const [openMobile, setOpenMobile] = useState({
        sections: true,
        tags: true,
        follow: false,
        contact: false
    });

    const selectedSectionsCount = useMemo(
        () => (selectedSectionNames?.size ? selectedSectionNames.size : 0),
        [selectedSectionNames]
    );

    const selectedTagsCount = useMemo(() => (selectedExts?.size ? selectedExts.size : 0), [selectedExts]);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 1024) {
                setOpenMobile((p) => ({ ...p, sections: true, tags: true, follow: true, contact: true }));
            }
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const toggleSectionName = (name, checked) => {
        const next = new Set(selectedSectionNames);
        checked ? next.add(name) : next.delete(name);
        setSelectedSectionNames(next);
    };

    const toggleExt = (ext, checked) => {
        const next = new Set(selectedExts);
        checked ? next.add(ext) : next.delete(ext);
        setSelectedExts(next);
    };

    const selectedBadge = (count) => (count ? t("filtersPanel.selectedBadge", { count }) : undefined);

    return (
        <aside className="lg:col-span-3">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-4 lg:sticky lg:top-6">
                <div className="hidden lg:block">
                    <div className="text-primary font-bold mb-2">{t("filtersPanel.fileTypes")}</div>

                    <div className="space-y-2 mb-4">
                        {allSectionNames.map((name) => (
                            <label key={name} className="flex items-center gap-2 text-sm text-white/90">
                                <input
                                    type="checkbox"
                                    checked={selectedSectionNames.has(name)}
                                    onChange={(e) => toggleSectionName(name, e.target.checked)}
                                    className="accent-primary"
                                />
                                <span className="truncate">{name}</span>
                            </label>
                        ))}
                    </div>

                    <div className="h-px bg-white/10 my-3" />

                    <div className="text-primary font-bold mb-2">{t("filtersPanel.fileTags")}</div>

                    <div className="space-y-2 mb-4">
                        {allExtensions.map((ext) => (
                            <label key={ext} className="flex items-start gap-2 text-sm text-white/90 leading-snug break-words">
                                <input
                                    type="checkbox"
                                    checked={selectedExts.has(ext)}
                                    onChange={(e) => toggleExt(ext, e.target.checked)}
                                    className="accent-primary flex-shrink-0 mt-0.5"
                                />
                                <span className="break-all">{ext}</span>
                            </label>
                        ))}
                    </div>

                    <div className="h-px bg-white/10 my-3" />

                    <div className="text-primary font-bold mb-2">{t("filtersPanel.followUs")}</div>

                    <div className="grid grid-cols-3 gap-2">
                        <a
                            href="https://www.facebook.com/XPG.live.now"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                            aria-label={t("filtersPanel.social.facebook")}
                        >
                            <Facebook size={16} />
                            <span className="text-xs font-semibold">FB</span>
                        </a>

                        <a
                            href="https://x.com/XPG_live"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                            aria-label={t("filtersPanel.social.twitter")}
                        >
                            <Twitter size={16} />
                            <span className="text-xs font-semibold">X</span>
                        </a>

                        <a
                            href="https://www.instagram.com/xpg_live/"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                            aria-label={t("filtersPanel.social.instagram")}
                        >
                            <Instagram size={16} />
                            <span className="text-xs font-semibold">IG</span>
                        </a>
                    </div>

                    <div className="mt-3 text-sm text-white/75">
                        <div className="font-semibold text-white/90">{t("filtersPanel.social.handleTitle")}</div>
                        <div className="text-white/70">{t("filtersPanel.social.handleSub")}</div>
                    </div>

                    <div className="h-px bg-white/10 my-3" />

                    <div className="text-primary font-bold mb-2">{t("filtersPanel.contactUs")}</div>

                    <div className="space-y-2 text-sm text-white/80">
                        <a
                            href="tel:+421911628998"
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:text-white"
                        >
                            <Phone size={16} className="text-white/70" />
                            <span>{t("filtersPanel.contact.phone")}</span>
                        </a>

                        <a
                            href="mailto:info@xprogaming.com?subject=XPG%20File%20Request"
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:text-white"
                        >
                            <Mail size={16} className="text-white/70" />
                            <span>{t("filtersPanel.contact.email")}</span>
                        </a>

                        <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                            <MapPin size={16} className="text-white/70 mt-0.5" />
                            <span>{t("filtersPanel.contact.location")}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:hidden space-y-3">
                    <Section
                        title={t("filtersPanel.fileTypes")}
                        badge={selectedBadge(selectedSectionsCount)}
                        open={openMobile.sections}
                        onToggle={() => setOpenMobile((p) => ({ ...p, sections: !p.sections }))}
                    >
                        <div className="space-y-2">
                            {allSectionNames.map((name) => (
                                <label key={name} className="flex items-center gap-2 text-sm text-white/90">
                                    <input
                                        type="checkbox"
                                        checked={selectedSectionNames.has(name)}
                                        onChange={(e) => toggleSectionName(name, e.target.checked)}
                                        className="accent-primary"
                                    />
                                    <span className="truncate">{name}</span>
                                </label>
                            ))}
                        </div>
                    </Section>

                    <Section
                        title={t("filtersPanel.fileTags")}
                        badge={selectedBadge(selectedTagsCount)}
                        open={openMobile.tags}
                        onToggle={() => setOpenMobile((p) => ({ ...p, tags: !p.tags }))}
                    >
                        <div className="space-y-2">
                            {allExtensions.map((ext) => (
                                <label key={ext} className="flex items-start gap-2 text-sm text-white/90 leading-snug break-words">
                                    <input
                                        type="checkbox"
                                        checked={selectedExts.has(ext)}
                                        onChange={(e) => toggleExt(ext, e.target.checked)}
                                        className="accent-primary flex-shrink-0 mt-0.5"
                                    />
                                    <span className="break-all">{ext}</span>
                                </label>
                            ))}
                        </div>
                    </Section>

                    <Section
                        title={t("filtersPanel.followUs")}
                        open={openMobile.follow}
                        onToggle={() => setOpenMobile((p) => ({ ...p, follow: !p.follow }))}
                    >
                        <div className="grid grid-cols-3 gap-2 pt-2">
                            <a
                                href="https://www.facebook.com/XPG.live.now"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                                aria-label={t("filtersPanel.social.facebook")}
                            >
                                <Facebook size={16} />
                                <span className="text-xs font-semibold">FB</span>
                            </a>

                            <a
                                href="https://x.com/XPG_live"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                                aria-label={t("filtersPanel.social.twitter")}
                            >
                                <Twitter size={16} />
                                <span className="text-xs font-semibold">X</span>
                            </a>

                            <a
                                href="https://www.instagram.com/xpg_live/"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-white/80 hover:text-white hover:bg-white/[0.06]"
                                aria-label={t("filtersPanel.social.instagram")}
                            >
                                <Instagram size={16} />
                                <span className="text-xs font-semibold">IG</span>
                            </a>
                        </div>

                        <div className="mt-3 text-sm text-white/75">
                            <div className="font-semibold text-white/90">{t("filtersPanel.social.handleTitle")}</div>
                            <div className="text-white/70">{t("filtersPanel.social.handleSub")}</div>
                        </div>
                    </Section>

                    <Section
                        title={t("filtersPanel.contactUs")}
                        open={openMobile.contact}
                        onToggle={() => setOpenMobile((p) => ({ ...p, contact: !p.contact }))}
                    >
                        <div className="space-y-2 pt-2 text-sm text-white/80">
                            <a
                                href="tel:+421911628998"
                                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:text-white"
                            >
                                <Phone size={16} className="text-white/70" />
                                <span>{t("filtersPanel.contact.phone")}</span>
                            </a>

                            <a
                                href="mailto:info@xprogaming.com?subject=XPG%20File%20Request"
                                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] hover:text-white"
                            >
                                <Mail size={16} className="text-white/70" />
                                <span>{t("filtersPanel.contact.email")}</span>
                            </a>

                            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                <MapPin size={16} className="text-white/70 mt-0.5" />
                                <span>{t("filtersPanel.contact.location")}</span>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </aside>
    );
}
