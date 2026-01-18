import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fieldset, Field, Input, Label } from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDialog } from "../contexts/DialogContext";
import { useToast } from "../contexts/ToastContext";
import CookiePolicy from "../components/CookiePolicy";
import PrivacyPolicy from "../components/PrivacyPolicy";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslation } from "react-i18next";

const PENDING_KEY = "xpg_registration_pending_email";

function toUserMessage(err, t) {
    const code = err?.code ? String(err.code) : "";
    if (code === "auth/email-already-in-use") return t("auth.register.errors.emailInUse");
    if (code === "auth/invalid-email") return t("auth.register.errors.invalidEmail");
    if (code === "auth/weak-password") return t("auth.register.errors.weakPassword");
    return t("auth.register.errors.failedGeneric");
}

async function verifyRecaptchaToken(token) {
    const url = import.meta.env.VITE_VERIFY_RECAPTCHA_URL;
    if (!url) throw new Error("RECAPTCHA_VERIFY_URL_MISSING");

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) throw new Error("RECAPTCHA_INVALID");
    return true;
}

async function fetchIpInfo() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        return {
            ip: data.ip || null,
            city: data.city || null,
            region: data.region || null,
            country: data.country_name || null,
            loc: data.loc || null
        };
    } catch {
        return null;
    }
}

export default function Register() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const { openDialog } = useDialog();
    const { showToast } = useToast();

    const recaptchaRef = useRef(null);
    const recaptchaHostRef = useRef(null);

    const [err, setErr] = useState("");
    const [userIPInfo, setUserIPInfo] = useState(null);
    const [recaptchaReady, setRecaptchaReady] = useState(false);

    const [submittedEmail, setSubmittedEmail] = useState(() => {
        try {
            return localStorage.getItem(PENDING_KEY) || "";
        } catch {
            return "";
        }
    });

    const isPendingScreen = useMemo(() => !!submittedEmail, [submittedEmail]);

    const schema = useMemo(
        () =>
            z
                .object({
                    fullName: z.string().min(2, t("auth.register.errors.fullNameRequired")),
                    company: z.string().min(2, t("auth.register.errors.companyRequired")),
                    department: z.string().min(2, t("auth.register.errors.departmentRequired")),
                    email: z.string().email(t("auth.register.errors.emailValid")),
                    password: z.string().min(6, t("auth.register.errors.passwordMin")),
                    confirmPassword: z.string().min(6, t("auth.register.errors.confirmPassword")),
                    newsletter: z.boolean().optional(),
                    notice: z.boolean(),
                    privacy: z.boolean(),
                    recaptchaToken: z.string().min(1, t("auth.register.errors.recaptchaComplete"))
                })
                .refine((v) => v.password === v.confirmPassword, {
                    message: t("auth.register.errors.passwordMismatch"),
                    path: ["confirmPassword"]
                })
                .refine((v) => v.notice && v.privacy, {
                    message: t("auth.register.errors.policiesRequired"),
                    path: ["privacy"]
                }),
        [t]
    );

    useEffect(() => {
        let cancelled = false;

        const enable = () => {
            if (!cancelled) setRecaptchaReady(true);
        };

        const idle = (cb) => {
            if (typeof window.requestIdleCallback === "function") {
                window.requestIdleCallback(cb, { timeout: 1200 });
            } else {
                setTimeout(cb, 700);
            }
        };

        const onFirstInteraction = () => {
            window.removeEventListener("pointerdown", onFirstInteraction);
            window.removeEventListener("keydown", onFirstInteraction);
            idle(enable);
        };

        window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
        window.addEventListener("keydown", onFirstInteraction);

        const observer =
            "IntersectionObserver" in window
                ? new IntersectionObserver(
                    (entries) => {
                        if (entries.some((e) => e.isIntersecting)) {
                            enable();
                            observer.disconnect();
                        }
                    },
                    { rootMargin: "250px" }
                )
                : null;

        if (observer && recaptchaHostRef.current) observer.observe(recaptchaHostRef.current);

        idle(enable);

        return () => {
            cancelled = true;
            window.removeEventListener("pointerdown", onFirstInteraction);
            window.removeEventListener("keydown", onFirstInteraction);
            if (observer) observer.disconnect();
        };
    }, []);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: "",
            company: "",
            department: "",
            email: "",
            password: "",
            confirmPassword: "",
            newsletter: false,
            notice: false,
            privacy: false,
            recaptchaToken: ""
        }
    });

    const recaptchaToken = watch("recaptchaToken");

    const registerMutation = useMutation({
        mutationFn: async (form) => {
            await verifyRecaptchaToken(form.recaptchaToken);

            const ipInfo = userIPInfo || (await fetchIpInfo());
            if (!userIPInfo) setUserIPInfo(ipInfo);

            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("opid", "desc"), limit(1));
            const snap = await getDocs(q);

            let latestOpid = 0;
            if (!snap.empty) latestOpid = snap.docs[0].data()?.opid || 0;
            const newOpid = latestOpid + 1;

            const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
            await updateProfile(cred.user, { displayName: form.fullName });

            await setDoc(doc(db, "users", cred.user.uid), {
                fullName: form.fullName,
                company: form.company,
                department: form.department,
                email: form.email,
                role: "user",
                access: false,
                newsletter: !!form.newsletter,
                createdAt: new Date().toISOString(),
                status: "pending",
                uid: cred.user.uid,
                id: cred.user.uid,
                opid: newOpid,
                ip: ipInfo?.ip || null,
                location: {
                    city: ipInfo?.city || null,
                    region: ipInfo?.region || null,
                    country: ipInfo?.country || null,
                    coordinates: ipInfo?.loc || null
                }
            });

            await signOut(auth);
            return { email: form.email };
        },
        onSuccess: ({ email }) => {
            try {
                localStorage.setItem(PENDING_KEY, email);
            } catch { }

            setSubmittedEmail(email);
            setErr("");

            showToast({
                title: t("auth.register.toast.submittedTitle"),
                description: t("auth.register.toast.submittedDesc"),
                variant: "success"
            });
        },
        onError: (error) => {
            recaptchaRef.current?.reset?.();
            setValue("recaptchaToken", "");

            const msg =
                error?.message === "RECAPTCHA_VERIFY_URL_MISSING"
                    ? t("auth.register.errors.recaptchaMissing")
                    : error?.message === "RECAPTCHA_INVALID"
                        ? t("auth.register.errors.recaptchaInvalid")
                        : toUserMessage(error, t);

            setErr(msg);

            showToast({
                title: t("auth.register.toast.failedTitle"),
                description: msg,
                variant: "error"
            });
        }
    });

    const onSubmit = useCallback(
        (data) => {
            setErr("");
            registerMutation.mutate(data);
        },
        [registerMutation]
    );

    const handleOpenCookiePolicy = (e) => {
        e.preventDefault();
        openDialog(t("auth.register.policy.cookie"), <CookiePolicy />);
    };

    const handleOpenPrivacyPolicy = (e) => {
        e.preventDefault();
        openDialog(t("auth.register.policy.privacy"), <PrivacyPolicy />);
    };

    const handleGoLogin = () => {
        nav("/login");
    };

    const handleClearPending = () => {
        try {
            localStorage.removeItem(PENDING_KEY);
        } catch { }
        setSubmittedEmail("");
    };

    if (isPendingScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-foreground">
                <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-xl opacity-60" />
                <div className="absolute inset-0 bg-black/70" />

                <div className="relative w-[94%] max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10">
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <img src="/image/logo-white.png" alt="Logo" className="h-[90px]" />
                    </div>

                    <h1 className="text-center text-xl font-semibold text-white mb-2">{t("auth.register.pending.title")}</h1>
                    <p className="text-center text-white/80 text-sm">{t("auth.register.pending.subtitle")}</p>

                    <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="text-white/80 text-sm">{t("auth.register.pending.cardTitle")}</div>
                        <div className="text-white font-semibold break-all">{submittedEmail}</div>
                        <div className="text-white/60 text-xs mt-2">{t("auth.register.pending.hint")}</div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            onClick={handleGoLogin}
                            className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
                        >
                            {t("auth.register.pending.goLogin")}
                        </button>

                        <button
                            onClick={handleClearPending}
                            className="w-full rounded-md border border-white/15 bg-transparent px-6 py-3 text-base font-semibold text-white/90 hover:bg-white/5"
                        >
                            {t("auth.register.pending.submitAnother")}
                        </button>
                    </div>

                    <div className="text-center text-sm mt-6 text-white/70">
                        {t("auth.register.pending.alreadyHave")}{" "}
                        <Link to="/login" className="text-primary hover:underline">
                            {t("auth.register.pending.signIn")}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-foreground">
            <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-xl opacity-60" />
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative w-[94%] max-w-3xl rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10 lg:p-12">
                <div className="flex flex-col items-center gap-3 mb-6">
                    <img src="/image/logo-white.png" alt="Logo" className="h-[90px]" />
                </div>

                <h1 className="text-center text-xl font-semibold text-white mb-5">{t("auth.register.title")}</h1>

                <div className="text-sm leading-relaxed text-white/80 space-y-3 mb-7 max-h-56 overflow-auto pr-2 scrollbar-hide">
                    <p>{t("auth.register.intro.p1")}</p>
                    <p>{t("auth.register.intro.p2")}</p>
                    <p>{t("auth.register.intro.p3")}</p>
                    <p>{t("auth.register.intro.p4")}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Fieldset className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field className="md:col-span-2">
                            <Label className="sr-only">Full name</Label>
                            <Input
                                placeholder={t("auth.register.placeholders.fullName")}
                                {...register("fullName")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.fullName && <div className="text-sm text-red-400 mt-1">{errors.fullName.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Company</Label>
                            <Input
                                placeholder={t("auth.register.placeholders.company")}
                                {...register("company")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.company && <div className="text-sm text-red-400 mt-1">{errors.company.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Department</Label>
                            <Input
                                placeholder={t("auth.register.placeholders.department")}
                                {...register("department")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.department && <div className="text-sm text-red-400 mt-1">{errors.department.message}</div>}
                        </Field>

                        <Field className="md:col-span-2">
                            <Label className="sr-only">Email</Label>
                            <Input
                                placeholder={t("auth.register.placeholders.email")}
                                {...register("email")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.email && <div className="text-sm text-red-400 mt-1">{errors.email.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Password</Label>
                            <Input
                                type="password"
                                placeholder={t("auth.register.placeholders.password")}
                                {...register("password")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.password && <div className="text-sm text-red-400 mt-1">{errors.password.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Confirm password</Label>
                            <Input
                                type="password"
                                placeholder={t("auth.register.placeholders.confirmPassword")}
                                {...register("confirmPassword")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.confirmPassword && <div className="text-sm text-red-400 mt-1">{errors.confirmPassword.message}</div>}
                        </Field>

                        <div className="md:col-span-2 space-y-3 pt-1">
                            <label className="flex items-center gap-3 text-sm text-white/90">
                                <input type="checkbox" {...register("newsletter")} />
                                {t("auth.register.checkbox.newsletter")}
                            </label>

                            <label className="flex items-center gap-3 text-sm text-white/90">
                                <input type="checkbox" {...register("notice")} />
                                <span>{t("auth.register.checkbox.noticePrefix")}&nbsp;</span>
                                <button type="button" onClick={handleOpenCookiePolicy} className="text-primary hover:underline">
                                    {t("auth.register.policy.cookie")}
                                </button>
                            </label>

                            <label className="flex items-center gap-3 text-sm text-white/90">
                                <input type="checkbox" {...register("privacy")} />
                                <span>{t("auth.register.checkbox.privacyPrefix")}&nbsp;</span>
                                <button type="button" onClick={handleOpenPrivacyPolicy} className="text-primary hover:underline">
                                    {t("auth.register.policy.privacy")}
                                </button>
                            </label>

                            {(errors.privacy || err) && <div className="text-sm text-red-400 pt-1">{errors.privacy?.message || err}</div>}
                        </div>

                        <div ref={recaptchaHostRef} className="md:col-span-2 pt-2 flex flex-col items-center gap-3 min-h-[92px]">
                            {recaptchaReady ? (
                                <ReCAPTCHA
                                    ref={recaptchaRef}
                                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                                    onChange={(token) => setValue("recaptchaToken", token || "", { shouldValidate: true })}
                                    onExpired={() => setValue("recaptchaToken", "", { shouldValidate: true })}
                                    theme="dark"
                                />
                            ) : (
                                <div className="text-sm text-white/70">{t("auth.register.recaptcha.loading")}</div>
                            )}
                            {errors.recaptchaToken && <div className="text-sm text-red-400">{errors.recaptchaToken.message}</div>}
                        </div>

                        <div className="md:col-span-2 pt-2 flex flex-col items-center gap-4">
                            <button
                                disabled={registerMutation.isPending || !recaptchaToken}
                                className="w-fit mx-auto block rounded-md bg-primary px-9 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                            >
                                {registerMutation.isPending ? t("auth.register.button.registering") : t("auth.register.button.requestAccess")}
                            </button>
                        </div>
                    </Fieldset>
                </form>

                <div className="text-center text-sm mt-8 text-white/80">{t("auth.register.footer.alreadyHave")}</div>
                <div className="text-center mt-2">
                    <Link to="/login" className="text-sm text-primary hover:underline">
                        {t("auth.register.footer.signIn")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
