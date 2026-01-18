import React from "react";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
    const { t } = useTranslation();

    return (
        <div>
            <div className="flex space-x-2 mb-4">
                <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold bg-[#23b0ff] text-[#0b0d13]">
                    {t("policies.meta.lastUpdated", { date: t("policies.meta.updatedDate") })}
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium bg-white/10 text-white/90">
                    {t("policies.meta.product")}
                </span>
            </div>

            <h1 className="text-xl font-extrabold mb-3 text-white">{t("policies.privacy.title")}</h1>
            <p className="mb-4 text-white/90">{t("policies.privacy.intro")}</p>

            <div className="space-y-4">
                <section>
                    <h2 className="text-base font-bold text-white mb-1">{t("policies.privacy.sections.collect.title")}</h2>
                    <p className="text-white/90">{t("policies.privacy.sections.collect.body")}</p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">{t("policies.privacy.sections.use.title")}</h2>
                    <p className="text-white/90">{t("policies.privacy.sections.use.body")}</p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">{t("policies.privacy.sections.sharing.title")}</h2>
                    <p className="text-white/90">{t("policies.privacy.sections.sharing.body")}</p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">{t("policies.privacy.sections.security.title")}</h2>
                    <p className="text-white/90">{t("policies.privacy.sections.security.body")}</p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">{t("policies.privacy.sections.retention.title")}</h2>
                    <p className="text-white/90">{t("policies.privacy.sections.retention.body")}</p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">{t("policies.privacy.sections.choices.title")}</h2>
                    <p className="text-white/90">{t("policies.privacy.sections.choices.body")}</p>
                </section>

                <section>
                    <h2 className="text-base font-bold text-white mb-1">{t("policies.privacy.sections.contact.title")}</h2>
                    <p className="text-white/90">{t("policies.privacy.sections.contact.body")}</p>
                </section>
            </div>
        </div>
    );
}
