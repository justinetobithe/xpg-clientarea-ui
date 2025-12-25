import { useState } from "react";
import { Fieldset, Field, Input, Label } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function ChangePassword() {
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
            setMessage("All fields are required.");
            setIsError(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("New passwords do not match.");
            setIsError(true);
            return;
        }

        setIsSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            setMessage("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (e) {
            setMessage(e?.message || String(e) || "Failed to change password");
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
            <div className="text-white font-semibold text-lg mb-1">Change Password</div>
            <div className="text-white/60 text-sm mb-6">For security, we’ll verify your current password first.</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">
                <PasswordInputField label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <div className="hidden md:block" />
                <PasswordInputField label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <PasswordInputField label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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
                >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </Fieldset>
    );
}
