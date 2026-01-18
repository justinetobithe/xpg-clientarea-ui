import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Switch, Fieldset, Field, Input, Label } from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { enableRememberMe } from "../lib/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../contexts/ToastContext";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "react-i18next";

const PENDING_KEY = "xpg_registration_pending_email";

function toUserMessage(err, t) {
    const code = err?.code ? String(err.code) : "";
    if (code === "auth/invalid-credential") return t("auth.login.errors.invalidCredentials");
    if (code === "auth/user-not-found") return t("auth.login.errors.invalidCredentials");
    if (code === "auth/wrong-password") return t("auth.login.errors.invalidCredentials");
    if (code === "auth/too-many-requests") return t("auth.login.errors.tooManyRequests");
    return t("auth.login.errors.failedGeneric");
}

export default function Login() {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [err, setErr] = useState("");

    const hydrateUserProfile = useAuthStore((s) => s.hydrateUserProfile);

    const [pendingEmail, setPendingEmail] = useState(() => {
        try {
            return localStorage.getItem(PENDING_KEY) || "";
        } catch {
            return "";
        }
    });

    const hasPending = useMemo(() => !!pendingEmail, [pendingEmail]);

    const schema = useMemo(
        () =>
            z.object({
                email: z.string().email(t("auth.login.errors.invalidEmail")),
                password: z.string().min(6, t("auth.login.errors.passwordMin")),
                remember: z.boolean().optional()
            }),
        [t]
    );

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        setValue: setFormValue
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "", remember: false }
    });

    const remember = watch("remember");
    const typedEmail = watch("email");

    useEffect(() => {
        try {
            const v = localStorage.getItem(PENDING_KEY) || "";
            setPendingEmail(v);
            if (v) setFormValue("email", v);
        } catch { }
    }, [setFormValue]);

    const loginMutation = useMutation({
        mutationFn: async ({ email, password, remember }) => {
            const cleanEmail = String(email || "").trim().toLowerCase();
            await enableRememberMe(remember);

            const cred = await signInWithEmailAndPassword(auth, cleanEmail, String(password || ""));
            await hydrateUserProfile(cred.user);

            const st = useAuthStore.getState();
            const hasAccess = st.profile?.access === true;

            if (!hasAccess) {
                await signOut(auth).catch(() => { });
                throw new Error("NOT_APPROVED");
            }

            return { email: cleanEmail };
        },
        onSuccess: () => {
            setErr("");
            try {
                localStorage.removeItem(PENDING_KEY);
            } catch { }
            setPendingEmail("");

            showToast({
                variant: "success",
                title: t("auth.login.toast.welcomeTitle"),
                description: t("auth.login.toast.welcomeDesc")
            });
        },
        onError: (error) => {
            const msg =
                error?.message === "NOT_APPROVED" ? t("auth.login.errors.notApproved") : toUserMessage(error, t);

            setErr(msg);

            showToast({
                variant: error?.message === "NOT_APPROVED" ? "warning" : "error",
                title: error?.message === "NOT_APPROVED" ? t("auth.login.toast.pendingTitle") : t("auth.login.toast.failedTitle"),
                description: msg
            });
        }
    });

    const onSubmit = (data) => {
        setErr("");
        loginMutation.mutate(data);
    };

    const clearPending = () => {
        try {
            localStorage.removeItem(PENDING_KEY);
        } catch { }
        setPendingEmail("");
        setErr("");
    };

    const showPendingCard =
        hasPending && (!typedEmail || String(typedEmail).trim().toLowerCase() === String(pendingEmail).toLowerCase());

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-foreground">
            <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-xl opacity-60" />
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative w-[94%] max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10 lg:p-12">
                <div className="flex flex-col items-center gap-3 mb-8">
                    <img src="/image/logo-white.png" alt="Logo" className="h-[90px]" />
                </div>

                <h1 className="text-center text-xl font-semibold text-white mb-7">{t("auth.login.title")}</h1>

                {showPendingCard && (
                    <div className="mb-6 rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="text-white/80 text-sm">{t("auth.login.pendingTitle")}</div>
                        <div className="text-white font-semibold break-all">{pendingEmail}</div>
                        <div className="text-white/60 text-xs mt-2">{t("auth.login.pendingHint")}</div>
                        <button type="button" onClick={clearPending} className="mt-3 text-sm text-primary hover:underline">
                            {t("auth.login.useAnotherAccount")}
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Fieldset className="space-y-5">
                        <Field>
                            <Label className="sr-only">Email</Label>
                            <Input
                                type="email"
                                placeholder={t("auth.login.placeholders.email")}
                                {...register("email")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.email && <div className="text-sm text-red-400 mt-1">{errors.email.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Password</Label>
                            <Input
                                type="password"
                                placeholder={t("auth.login.placeholders.password")}
                                {...register("password")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.password && <div className="text-sm text-red-400 mt-1">{errors.password.message}</div>}
                        </Field>

                        <div className="flex items-center gap-3 pt-1">
                            <Switch
                                checked={remember}
                                onChange={(v) => setValue("remember", v)}
                                className={`${remember ? "bg-primary" : "bg-muted"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                            >
                                <span className={`${remember ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                            </Switch>
                            <span className="text-sm text-white/90">{t("auth.login.remember")}</span>
                        </div>

                        {err && <div className="text-sm text-red-400 pt-1">{err}</div>}

                        <button
                            disabled={loginMutation.isPending}
                            className="w-fit mx-auto block mt-2 rounded-md bg-primary px-9 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                            {loginMutation.isPending ? t("auth.login.button.loggingIn") : t("auth.login.button.login")}
                        </button>
                    </Fieldset>
                </form>

                <div className="text-center text-sm mt-6">
                    <Link to="/forgot-password" className="text-primary hover:underline">
                        {t("auth.login.links.forgot")}
                    </Link>
                </div>

                <div className="text-center text-sm mt-8 text-white/80">{t("auth.login.links.createAccount")}</div>
                <div className="text-center mt-2">
                    <Link to="/register" className="text-sm text-primary hover:underline">
                        {t("auth.login.links.register")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
