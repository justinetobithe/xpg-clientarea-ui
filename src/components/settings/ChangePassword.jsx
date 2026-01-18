import { useState } from "react";
import { Fieldset, Field, Input, Label } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";

export default function ChangePassword() {
    const { t } = useTranslation();
    const changePassword = useAuthStore((s) => s.changePassword);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleSave = async () => {
        setMessage("");
        setIsError(false);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage(t("settings.changePassword.messages.required"));
            setIsError(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage(t("settings.changePassword.messages.mismatch"));
            setIsError(true);
            return;
        }

        setIsSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            setMessage(t("settings.changePassword.messages.success"));
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (e) {
            setMessage(e?.message || String(e) || t("settings.changePassword.messages.failed"));
            setIsError(true);
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(""), 5000);
        }
    };

    const PasswordInputField = ({ label, value, onChange }) => (
        <Field className="flex flex-col">
            <Label className="text-sm font-medium text-white mb-1">{label}</Label>
            <Input
                type="password"
                value={value}
                onChange={onChange}
                className="w-full bg-input rounded-lg py-2 px-3 text-sm text-white border border-border focus:outline-none focus:ring-1 focus:ring-primary h-[40px]"
            />
        </Field>
    );

    return (
        <Fieldset className="bg-card p-6 rounded-2xl border border-border">
            <div className="text-white font-semibold text-lg mb-1">{t("settings.changePassword.title")}</div>
            <div className="text-white/60 text-sm mb-6">{t("settings.changePassword.subtitle")}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">
                <PasswordInputField
                    label={t("settings.changePassword.fields.current")}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <div className="hidden md:block" />
                <PasswordInputField
                    label={t("settings.changePassword.fields.new")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordInputField
                    label={t("settings.changePassword.fields.confirm")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-6">
                {message && (
                    <div className={`text-sm ${isError ? "text-red-400" : "text-emerald-400"}`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-black font-bold py-2.5 px-6 rounded-xl transition disabled:opacity-50"
                    type="button"
                >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSaving ? t("settings.changePassword.button.saving") : t("settings.changePassword.button.save")}
                </button>
            </div>
        </Fieldset>
    );
}
