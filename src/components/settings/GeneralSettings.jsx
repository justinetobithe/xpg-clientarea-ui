import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Listbox, Fieldset, Field, Input, Label, Switch } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

import allTimezones from '../../timezone.json';

const departments = [
    "Operations",
    "Game Development",
    "Compliance & Legal",
    "Finance & Accounting",
    "Marketing & Promotions",
    "Player Support",
    "IT & Infrastructure",
    "Product Management",
    "Sales & Business Development",
    "HR & Talent Acquisition",
    "Executive Management",
    "Other"
];

const formatTimezone = (tz) => {
    return tz.replace(/_/g, ' ');
};

const formattedTimezones = allTimezones.map(formatTimezone);

export default function GeneralSettings() {
    const user = useAuthStore((s) => s.user);
    const updateUserDetails = useAuthStore((s) => s.updateUserDetails);

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [company, setCompany] = useState(user?.company || '');
    const initialDepartment = departments.includes(user?.department) ? user.department : departments[departments.length - 1];
    const [department, setDepartment] = useState(initialDepartment);

    const initialTimezone = formattedTimezones.includes(user?.timezone) ? user.timezone : formattedTimezones[0];
    const [timezone, setTimezone] = useState(initialTimezone);
    const [subscribed, setSubscribed] = useState(user?.subscribedToNewsletter || false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const handleSave = () => {
        setIsSaving(true);
        setSaveMessage("");
        setTimeout(() => {
            updateUserDetails({
                name,
                email,
                company,
                department,
                timezone,
                subscribedToNewsletter: subscribed
            });
            setIsSaving(false);
            setSaveMessage("Details updated successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        }, 1000);
    };

    const InputField = ({ label, value, onChange, type = "text", disabled = false }) => (
        <Field className="flex flex-col mb-4">
            <Label className="text-sm font-medium text-white mb-1">{label}</Label>
            <Input
                type={type}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full bg-input rounded-lg py-2 px-3 text-sm text-white border border-border focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 h-[40px]"
            />
        </Field>
    );

    const SelectDropdown = ({ label, selected, setSelected, options }) => (
        <Field className="flex flex-col mb-4">
            <Label className="text-sm font-medium text-white mb-1">{label}</Label>
            <Listbox value={selected} onChange={setSelected}>
                <div className="relative w-full">
                    <Listbox.Button
                        className="relative w-full cursor-default rounded-lg bg-input py-2 pl-3 pr-10 text-left text-sm text-white border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition h-[40px]"
                    >
                        <span className="block">{selected}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border z-20">
                        {options.map((option) => (
                            <Listbox.Option
                                key={option}
                                className={({ active }) =>
                                    `relative cursor-default select-none py-2 px-3 text-sm ${active ? 'bg-primary/50 text-white' : 'text-white'
                                    }`
                                }
                                value={option}
                            >
                                {option}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </div>
            </Listbox>
        </Field>
    );

    return (
        <Fieldset className="bg-card p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">
                <InputField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <InputField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

                <SelectDropdown label="Timezone" selected={timezone} setSelected={setTimezone} options={formattedTimezones} />
                <InputField label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
                <SelectDropdown label="Department" selected={department} setSelected={setDepartment} options={departments} />

                <Field className="flex flex-col justify-end">
                    <Label className="text-sm font-medium text-white mb-1">Subscribed to newsletter?</Label>
                    <div className="flex items-center h-[40px] pt-1">
                        <Switch
                            checked={subscribed}
                            onChange={setSubscribed}
                            className={`${subscribed ? 'bg-primary' : 'bg-gray-600'} 
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card mr-3`}
                        >
                            <span
                                className={`${subscribed ? 'translate-x-6' : 'translate-x-1'}
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                        <span className='text-sm text-white/70'>{subscribed ? 'Yes' : 'No'}</span>
                    </div>
                </Field>
            </div>

            <p className="text-xs text-white/70 mt-6 mb-4">Please note if you change your email address, you will be logged out until you have verified the new email address.</p>

            <div className="flex justify-end items-center">
                {saveMessage && <span className="text-sm text-green-400 mr-4">{saveMessage}</span>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </Fieldset>
    );
}