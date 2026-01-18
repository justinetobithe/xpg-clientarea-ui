import { useTranslation } from "react-i18next";

export default function Footer() {
    const { t } = useTranslation();

    const certUrl =
        "https://firebasestorage.googleapis.com/v0/b/xpg-system.firebasestorage.app/o/files%2FiTech%20Certificate.pdf?alt=media&token=27702b7e-a90b-491f-8732-7f85ce4288c9";

    return (
        <footer className="bg-black/90 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-12 text-center">
                <div className="flex flex-col items-center">
                    <img src="/image/logo-white.png" alt="XPG" className="h-10 md:h-12 object-contain" />
                </div>

                <div className="mt-6 text-[11px] md:text-xs leading-relaxed text-white/70 max-w-4xl mx-auto">
                    {t("footer.disclaimer")}
                </div>

                <div className="mt-3 text-[12px] md:text-sm font-semibold text-white/85">
                    {t("footer.copyright")}
                </div>

                <div className="mt-8 flex items-center justify-center">
                    <a
                        href={certUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={t("footer.certTitle")}
                        className="inline-flex items-center justify-center hover:opacity-90 transition"
                    >
                        <img
                            src="/image/itech-lab-icon.png"
                            alt={t("footer.certAlt")}
                            className="h-14 md:h-16 object-contain opacity-95"
                            style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                        />
                    </a>
                </div>
            </div>
        </footer>
    );
}
