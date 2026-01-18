import { useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Listbox, Fieldset, Field, Input, Label, Switch } from "@headlessui/react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import allTimezones from "../../timezone.json";

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

const formatTimezone = (tz) => String(tz || "").replace(/_/g, " ");
const formattedTimezones = allTimezones.map(formatTimezone);

export default function GeneralSettings() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const updateUserDetails = useAuthStore((s) => s.updateUserDetails);

    const initialDepartment = useMemo(() => {
        const d = user?.department || "";
        return departments.includes(d) ? d : departments[departments.length - 1];
    }, [user?.department]);

    const initialTimezone = useMemo(() => {
        const tz = user?.timezone || "";
        return formattedTimezones.includes(tz) ? tz : formattedTimezones[0];
    }, [user?.timezone]);

    const [name, setName] = useState(user?.name || user?.displayName || "");
    const [email] = useState(user?.email || "");
    const [company, setCompany] = useState(user?.company || "");
    const [department, setDepartment] = useState(initialDepartment);
    const [timezone, setTimezone] = useState(initialTimezone);
    const [subscribed, setSubscribed] = useState(!!user?.subscribedToNewsletter);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage("");
        setIsError(false);
        try {
            await updateUserDetails({
                name,
                company,
                department,
                timezone,
                subscribedToNewsletter: subscribed
            });
            setSaveMessage(t("settings.general.messages.success"));
        } catch (e) {
            setSaveMessage(e?.message || String(e) || t("settings.general.messages.failed"));
            setIsError(true);
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(""), 4000);
        }
    };

    const InputField = ({ label, value, onChange, type = "text", disabled = false }) => (
        <Field className="flex flex-col">
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
        <Field className="flex flex-col">
            <Label className="text-sm font-medium text-white mb-1">{label}</Label>
            <Listbox value={selected} onChange={setSelected}>
                <div className="relative w-full">
                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-input py-2 pl-3 pr-10 text-left text-sm text-white border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition h-[40px]">
                        <span className="block truncate">{selected}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>

                    <Listbox.Options className="absolute mt-2 max-h-64 w-full overflow-auto rounded-xl bg-[#0f1118] py-1 text-base shadow-lg ring-1 ring-black/30 focus:outline-none sm:text-sm border border-white/10 z-20">
                        {options.map((option) => (
                            <Listbox.Option
                                key={option}
                                className={({ active }) =>
                                    `relative cursor-default select-none py-2 px-3 text-sm ${active ? "bg-primary/25 text-white" : "text-white/85"
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
        <Fieldset className="bg-card p-6 rounded-2xl border border-border">
            <div className="text-white font-semibold text-lg mb-1">{t("settings.general.title")}</div>
            <div className="text-white/60 text-sm mb-6">{t("settings.general.subtitle")}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">
                <InputField
                    label={t("settings.general.fields.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <InputField label={t("settings.general.fields.email")} value={email} onChange={() => { }} disabled />

                <SelectDropdown
                    label={t("settings.general.fields.timezone")}
                    selected={timezone}
                    setSelected={setTimezone}
                    options={formattedTimezones}
                />
                <InputField
                    label={t("settings.general.fields.company")}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                />

                <SelectDropdown
                    label={t("settings.general.fields.department")}
                    selected={department}
                    setSelected={setDepartment}
                    options={departments.map((d) => t(`settings.general.departments.${d}`))}
                />

                <Field className="flex flex-col justify-end">
                    <Label className="text-sm font-medium text-white mb-1">{t("settings.general.fields.newsletter")}</Label>
                    <div className="flex items-center h-[40px] pt-1">
                        <Switch
                            checked={subscribed}
                            onChange={setSubscribed}
                            className={`${subscribed ? "bg-primary" : "bg-gray-600"
                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card mr-3`}
                        >
                            <span
                                className={`${subscribed ? "translate-x-6" : "translate-x-1"
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                        <span className="text-sm text-white/70">
                            {subscribed ? t("settings.general.yes") : t("settings.general.no")}
                        </span>
                    </div>
                </Field>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                {saveMessage && (
                    <span className={`text-sm ${isError ? "text-red-400" : "text-emerald-400"}`}>{saveMessage}</span>
                )}

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-black font-bold py-2.5 px-6 rounded-xl transition disabled:opacity-50"
                    type="button"
                >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSaving ? t("settings.general.button.saving") : t("settings.general.button.save")}
                </button>
            </div>
        </Fieldset>
    );
}
