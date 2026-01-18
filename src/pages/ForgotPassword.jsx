import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fieldset, Field, Input, Label } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../contexts/ToastContext";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import axios from "axios";
import { useTranslation } from "react-i18next";

const schema = z.object({
    email: z.string().email("Please enter a valid email"),
});

function makeToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ForgotPassword() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const { showToast } = useToast();
    const [err, setErr] = useState("");
    const [sent, setSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
    });

    const onSubmit = async ({ email }) => {
        setErr("");
        const cleanEmail = String(email || "").trim().toLowerCase();

        try {
            const token = makeToken();
            const now = Date.now();
            const expiresAt = Timestamp.fromMillis(now + 30 * 60 * 1000);

            await setDoc(doc(db, "password_reset_tokens", token), {
                email: cleanEmail,
                status: "pending",
                createdAt: serverTimestamp(),
                expiresAt,
                usedAt: null,
            });

            const clientUrl = import.meta.env.VITE_XPG_CLIENTAREA_URL || window.location.origin;
            const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
            const expiryMinutes = 30;

            await axios.post(`${import.meta.env.VITE_XPG_API_URL}/api/send-mail`, {
                full_name: t("auth.forgot.email.fullName"),
                email: cleanEmail,
                subject: t("auth.forgot.email.subject"),
                body: `
          <p>${t("auth.forgot.email.body.hello")}</p>
          <p>${t("auth.forgot.email.body.receivedRequest")}</p>
          <p>${t("auth.forgot.email.body.validFor", { minutes: expiryMinutes })}</p>
          <p style="margin:16px 0;">
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;background:#FF8D47;color:#fff;">
              ${t("auth.forgot.email.body.cta")}
            </a>
          </p>
          <p style="font-size:12px;margin:6px 0;">
            ${t("auth.forgot.email.body.fallback")} <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p>${t("auth.forgot.email.body.ignore")}</p>
          <p style="margin-top: 16px;"><strong>${t("auth.forgot.email.body.signature")}</strong></p>
        `,
            });

            setSent(true);
            showToast({
                variant: "success",
                title: t("auth.forgot.toast.sentTitle"),
                description: t("auth.forgot.toast.sentDesc"),
            });
        } catch (e) {
            const msg = t("auth.forgot.errors.failedGeneric");
            setErr(msg);
            showToast({ variant: "error", title: t("auth.forgot.toast.failedTitle"), description: msg });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-foreground">
            <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-xl opacity-60" />
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative w-[94%] max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10">
                <div className="flex flex-col items-center gap-3 mb-6">
                    <img src="/image/logo-white.png" alt="Logo" className="h-[90px]" />
                </div>

                <h1 className="text-center text-xl font-semibold text-white mb-2">{t("auth.forgot.title")}</h1>
                <p className="text-center text-white/70 text-sm mb-6">{t("auth.forgot.subtitle")}</p>

                {sent ? (
                    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="text-white/90 font-semibold">{t("auth.forgot.sent.title")}</div>
                        <div className="text-white/70 text-sm mt-1">{t("auth.forgot.sent.subtitle")}</div>

                        <div className="mt-5 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => nav("/login")}
                                className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
                            >
                                {t("auth.forgot.sent.backToLogin")}
                            </button>

                            <Link
                                to="/register"
                                className="w-full text-center rounded-md border border-white/15 bg-transparent px-6 py-3 text-base font-semibold text-white/90 hover:bg-white/5"
                            >
                                {t("auth.forgot.sent.createAccount")}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Fieldset className="space-y-5">
                            <Field>
                                <Label className="sr-only">{t("auth.forgot.labels.email")}</Label>
                                <Input
                                    type="email"
                                    placeholder={t("auth.forgot.placeholders.email")}
                                    {...register("email")}
                                    className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                                />
                                {errors.email && (
                                    <div className="text-sm text-red-400 mt-1">
                                        {errors.email.message || t("auth.forgot.errors.invalidEmail")}
                                    </div>
                                )}
                            </Field>

                            {err && <div className="text-sm text-red-400">{err}</div>}

                            <button
                                disabled={isSubmitting}
                                className="w-fit mx-auto block mt-2 rounded-md bg-primary px-9 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                            >
                                {isSubmitting ? t("auth.forgot.button.sending") : t("auth.forgot.button.send")}
                            </button>
                        </Fieldset>
                    </form>
                )}

                <div className="text-center text-sm mt-6">
                    <Link to="/login" className="text-primary hover:underline">
                        {t("auth.forgot.links.backToLogin")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
