import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "../components/common/PageShell";
import GeneralSettings from "../components/settings/GeneralSettings";
import ChangePassword from "../components/settings/ChangePassword";
import DeleteAccount from "../components/settings/DeleteAccount";

export default function Settings() {
    const { t } = useTranslation();

    const settingsSections = useMemo(
        () => [
            { id: "general", label: t("settings.sections.general"), component: GeneralSettings },
            { id: "password", label: t("settings.sections.password"), component: ChangePassword },
            { id: "delete", label: t("settings.sections.delete"), component: DeleteAccount }
        ],
        [t]
    );

    const [activeSection, setActiveSection] = useState(settingsSections[0].id);

    const ActiveComponent = useMemo(() => {
        return (
            settingsSections.find((s) => s.id === activeSection)?.component ||
            settingsSections[0].component
        );
    }, [activeSection, settingsSections]);

    return (
        <PageShell
            crumb={t("settings.crumb")}
            title={t("settings.title")}
            subtitle={t("settings.subtitle")}
        >
            <div className="flex flex-col md:flex-row md:gap-8 md:items-start">
                <aside className="md:w-64 md:shrink-0 md:sticky md:top-24">
                    <div className="rounded-2xl border border-border bg-card p-3">
                        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                            {settingsSections.map((section) => {
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={[
                                            "text-sm font-semibold py-2.5 px-4 rounded-xl whitespace-nowrap transition text-left",
                                            isActive
                                                ? "bg-primary text-black shadow-md"
                                                : "text-white/70 hover:bg-white/5 hover:text-white"
                                        ].join(" ")}
                                        type="button"
                                    >
                                        {section.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                        <ActiveComponent />
                    </div>
                </main>
            </div>
        </PageShell>
    );
}
