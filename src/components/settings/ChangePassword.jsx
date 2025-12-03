import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Fieldset, Field, Input, Label } from '@headlessui/react';

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

        if (newPassword !== confirmPassword) {
            setMessage("New passwords do not match.");
            setIsError(true);
            return;
        }

        if (!currentPassword || !newPassword) {
            setMessage("All fields are required.");
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
        } catch (error) {
            setMessage(error);
            setIsError(true);
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(""), 5000);
        }
    };

    const PasswordInputField = ({ label, value, onChange }) => (
        <Field className="flex flex-col mb-4">
            <Label className="text-sm font-medium text-white mb-1">{label}</Label>
            <Input
                type="password"
                value={value}
                onChange={onChange}
                className="w-full bg-input rounded-lg py-2 px-3 text-sm text-white border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
        </Field>
    );

    return (
        <Fieldset className="bg-card p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">
                <PasswordInputField label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <div />
                <PasswordInputField label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <PasswordInputField label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <div className="flex justify-end items-center mt-6">
                {message && (
                    <span className={`text-sm mr-4 ${isError ? 'text-red-400' : 'text-green-400'}`}>
                        {message}
                    </span>
                )}
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