import { useState } from 'react';
import GeneralSettings from '../components/settings/GeneralSettings';
import ChangePassword from '../components/settings/ChangePassword';
import DeleteAccount from '../components/settings/DeleteAccount';

const settingsSections = [
    { id: 'general', label: 'General Settings', component: GeneralSettings },
    { id: 'password', label: 'Change Password', component: ChangePassword },
    { id: 'delete', label: 'Delete Account', component: DeleteAccount },
];

export default function Settings() {
    const [activeSection, setActiveSection] = useState(settingsSections[0].id);
    const ActiveComponent = settingsSections.find(s => s.id === activeSection).component;

    return (
        <div className="w-full">
            <header className="bg-darken-evo py-8 border-b border-border">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <p className="text-sm text-white/50 mb-1">Home / Account Settings</p>
                    <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                    <p className="text-sm text-white/70">Update your account and profile data</p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
                            {settingsSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`text-sm font-medium py-2 px-3 rounded-lg whitespace-nowrap transition ${activeSection === section.id
                                        ? 'bg-primary text-white'
                                        : 'text-white/70 hover:bg-background/50'
                                        }`}
                                >
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="md:col-span-3">
                        <ActiveComponent />
                    </div>
                </div>
            </div>
        </div>
    );
}