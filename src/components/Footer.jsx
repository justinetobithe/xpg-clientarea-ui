import { useTranslation } from "react-i18next";

export default function Footer() {
    const { t } = useTranslation();

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
                    <img
                        src="/image/itech-lab-icon.png"
                        alt={t("footer.certAlt")}
                        title={t("footer.certTitle")}
                        className="h-14 md:h-16 object-contain opacity-95"
                        style={{ filter: "grayscale(1) brightness(3) contrast(1.05)" }}
                    />
                </div>
            </div>
        </footer>
    );
}
