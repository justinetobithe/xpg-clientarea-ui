import { useMemo, useState } from "react";
import GeneralSettings from "../components/settings/GeneralSettings";
import ChangePassword from "../components/settings/ChangePassword";
import DeleteAccount from "../components/settings/DeleteAccount";

const settingsSections = [
    { id: "general", label: "General Settings", component: GeneralSettings },
    { id: "password", label: "Change Password", component: ChangePassword },
    { id: "delete", label: "Delete Account", component: DeleteAccount },
];

export default function Settings() {
    const [activeSection, setActiveSection] = useState(settingsSections[0].id);

    const ActiveComponent = useMemo(() => {
        return (
            settingsSections.find((s) => s.id === activeSection)?.component ||
            settingsSections[0].component
        );
    }, [activeSection]);

    return (
        <div className="w-full pt-20 md:pt-24">
            <header className="bg-darken-evo py-8 border-b border-border">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <p className="text-sm text-white/50 mb-1">
                        Home / Account Settings
                    </p>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Account Settings
                    </h1>
                    <p className="text-sm text-white/70">
                        Update your account and profile data
                    </p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 w-full">
                <div className="flex flex-col md:flex-row md:gap-8 md:items-start">
                    <aside className="md:w-56 md:shrink-0 md:sticky md:top-24">
                        <nav className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                            {settingsSections.map((section) => {
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={[
                                            "text-sm font-medium py-2.5 px-4 rounded-lg whitespace-nowrap transition text-left",
                                            isActive
                                                ? "bg-primary text-black shadow-md"
                                                : "text-white/70 hover:bg-white/5 hover:text-white",
                                        ].join(" ")}
                                    >
                                        {section.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    <main className="flex-1 min-w-0">
                        <ActiveComponent />
                    </main>
                </div>
            </div>
        </div>
    );
}
