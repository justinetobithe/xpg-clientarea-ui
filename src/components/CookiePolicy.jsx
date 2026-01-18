import React from "react";
import { useTranslation } from "react-i18next";

export default function CookiePolicy() {
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

            <h1 className="text-xl font-extrabold mb-3 text-white">{t("policies.cookie.title")}</h1>
            <p className="mb-4 text-white/90">{t("policies.cookie.intro")}</p>

            <div className="border border-white/10 rounded-lg overflow-hidden mb-4">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-white">
                                {t("policies.cookie.table.type")}
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-white">
                                {t("policies.cookie.table.purpose")}
                            </th>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-white">
                                {t("policies.cookie.table.examples")}
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5 bg-transparent text-white/80">
                        <tr>
                            <td className="px-4 py-3 whitespace-nowrap">{t("policies.cookie.rows.essential.type")}</td>
                            <td className="px-4 py-3">{t("policies.cookie.rows.essential.purpose")}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{t("policies.cookie.rows.essential.examples")}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 whitespace-nowrap">{t("policies.cookie.rows.preferences.type")}</td>
                            <td className="px-4 py-3">{t("policies.cookie.rows.preferences.purpose")}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{t("policies.cookie.rows.preferences.examples")}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 whitespace-nowrap">{t("policies.cookie.rows.analytics.type")}</td>
                            <td className="px-4 py-3">{t("policies.cookie.rows.analytics.purpose")}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{t("policies.cookie.rows.analytics.examples")}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 className="text-base font-bold mt-4 text-white">{t("policies.cookie.managing.title")}</h2>
            <p className="text-white/90">{t("policies.cookie.managing.body")}</p>
        </div>
    );
}
