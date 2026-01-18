import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field, Fieldset, Input, Label } from "@headlessui/react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";

export default function DeleteAccount() {
    const { t } = useTranslation();
    const deleteAccount = useAuthStore((s) => s.deleteAccount);
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [deleteStorage, setDeleteStorage] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);

    const handleDelete = async () => {
        setMsg("");
        setIsError(false);

        if (!password) {
            setMsg(t("settings.deleteAccount.messages.passwordRequired"));
            setIsError(true);
            return;
        }

        const ok = window.confirm(t("settings.deleteAccount.confirm"));
        if (!ok) return;

        setIsDeleting(true);
        try {
            await deleteAccount(password, { deleteStorage });
            navigate("/login");
        } catch (e) {
            setMsg(e?.message || String(e) || t("settings.deleteAccount.messages.failed"));
            setIsError(true);
        } finally {
            setIsDeleting(false);
            setTimeout(() => setMsg(""), 6000);
        }
    };

    return (
        <Fieldset className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/30">
                    <AlertTriangle className="h-5 w-5 text-red-300" />
                </span>
                <div>
                    <div className="text-white font-semibold text-lg">{t("settings.deleteAccount.title")}</div>
                    <div className="text-white/60 text-sm">{t("settings.deleteAccount.subtitle")}</div>
                </div>
            </div>

            <div className="text-white/70 text-sm mb-6">
                {t("settings.deleteAccount.warningPrefix")}{" "}
                <span className="text-red-300 font-semibold">{t("settings.deleteAccount.irreversible")}</span>.
            </div>

            <Field className="flex flex-col mb-4 max-w-md">
                <Label className="text-sm font-medium text-white mb-1">{t("settings.deleteAccount.fields.password")}</Label>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-input rounded-lg py-2 px-3 text-sm text-white border border-border focus:outline-none focus:ring-1 focus:ring-red-400 h-[40px]"
                />
            </Field>

            <div className="flex items-center gap-3 mb-6">
                <input
                    id="deleteStorage"
                    type="checkbox"
                    checked={deleteStorage}
                    onChange={(e) => setDeleteStorage(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-input"
                />
                <label htmlFor="deleteStorage" className="text-sm text-white/70">
                    {t("settings.deleteAccount.fields.deleteStorage")}
                </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 transition disabled:opacity-50"
                    type="button"
                >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isDeleting ? t("settings.deleteAccount.button.deleting") : t("settings.deleteAccount.button.delete")}
                </button>

                {msg && <div className={`text-sm ${isError ? "text-red-400" : "text-emerald-400"}`}>{msg}</div>}
            </div>
        </Fieldset>
    );
}
