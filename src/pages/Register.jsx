import { useEffect, useMemo, useRef, useState } from "react";
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

const PENDING_KEY = "xpg_registration_pending_email";

const schema = z
    .object({
        fullName: z.string().min(2, "Full name is required"),
        company: z.string().min(2, "Company is required"),
        department: z.string().min(2, "Department is required"),
        email: z.string().email("Valid email required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm your password"),
        newsletter: z.boolean().optional(),
        notice: z.boolean(),
        privacy: z.boolean(),
        recaptchaToken: z.string().min(1, "Please complete the reCAPTCHA"),
    })
    .refine((v) => v.password === v.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
    .refine((v) => v.notice && v.privacy, {
        message: "Please accept required policies",
        path: ["privacy"],
    });

function toUserMessage(err) {
    const code = err?.code ? String(err.code) : "";
    if (code === "auth/email-already-in-use") return "This email is already in use. Please use another email or log in.";
    if (code === "auth/invalid-email") return "Invalid email address.";
    if (code === "auth/weak-password") return "Password is too weak.";
    return "Unable to register. Please try again.";
}

async function verifyRecaptchaToken(token) {
    const url = import.meta.env.VITE_VERIFY_RECAPTCHA_URL;
    if (!url) throw new Error("RECAPTCHA_VERIFY_URL_MISSING");

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) throw new Error("RECAPTCHA_INVALID");
    return true;
}

export default function Register() {
    const nav = useNavigate();
    const { openDialog } = useDialog();
    const { showToast } = useToast();

    const recaptchaRef = useRef(null);

    const [err, setErr] = useState("");
    const [userIPInfo, setUserIPInfo] = useState(null);

    const [submittedEmail, setSubmittedEmail] = useState(() => {
        try {
            return localStorage.getItem(PENDING_KEY) || "";
        } catch {
            return "";
        }
    });

    const isPendingScreen = useMemo(() => !!submittedEmail, [submittedEmail]);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                if (!alive) return;

                setUserIPInfo({
                    ip: data.ip || null,
                    city: data.city || null,
                    region: data.region || null,
                    country: data.country_name || null,
                    loc: data.loc || null,
                });
            } catch {
                if (!alive) return;
                setUserIPInfo(null);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
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
            recaptchaToken: "",
        },
    });

    const recaptchaToken = watch("recaptchaToken");

    const registerMutation = useMutation({
        mutationFn: async (form) => {
            await verifyRecaptchaToken(form.recaptchaToken);

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
                ip: userIPInfo?.ip || null,
                location: {
                    city: userIPInfo?.city || null,
                    region: userIPInfo?.region || null,
                    country: userIPInfo?.country || null,
                    coordinates: userIPInfo?.loc || null,
                },
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
                title: "Registration submitted",
                description: "Your account is pending admin approval.",
                variant: "success",
            });
        },
        onError: (error) => {
            recaptchaRef.current?.reset?.();
            setValue("recaptchaToken", "");

            const msg =
                error?.message === "RECAPTCHA_VERIFY_URL_MISSING"
                    ? "reCAPTCHA is not configured. Please contact the administrator."
                    : error?.message === "RECAPTCHA_INVALID"
                        ? "reCAPTCHA failed. Please try again."
                        : toUserMessage(error);

            setErr(msg);

            showToast({
                title: "Registration failed",
                description: msg,
                variant: "error",
            });
        },
    });

    const onSubmit = (data) => {
        setErr("");
        registerMutation.mutate(data);
    };

    const handleOpenCookiePolicy = (e) => {
        e.preventDefault();
        openDialog("Cookie Policy", <CookiePolicy />);
    };

    const handleOpenPrivacyPolicy = (e) => {
        e.preventDefault();
        openDialog("Privacy Policy", <PrivacyPolicy />);
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

                    <h1 className="text-center text-xl font-semibold text-white mb-2">Request submitted</h1>
                    <p className="text-center text-white/80 text-sm">Your account is pending admin approval.</p>

                    <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="text-white/80 text-sm">Submitted email</div>
                        <div className="text-white font-semibold break-all">{submittedEmail}</div>
                        <div className="text-white/60 text-xs mt-2">Once approved, you can sign in and the system will grant access automatically.</div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        <button onClick={handleGoLogin} className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90">
                            Go to login
                        </button>

                        <button
                            onClick={handleClearPending}
                            className="w-full rounded-md border border-white/15 bg-transparent px-6 py-3 text-base font-semibold text-white/90 hover:bg-white/5"
                        >
                            Submit another request
                        </button>
                    </div>

                    <div className="text-center text-sm mt-6 text-white/70">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary hover:underline">
                            Sign in
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

                <h1 className="text-center text-xl font-semibold text-white mb-5">Please read before signing up</h1>

                <div className="text-sm leading-relaxed text-white/80 space-y-3 mb-7 max-h-56 overflow-auto pr-2 scrollbar-hide">
                    <p>The Client Area contains marketing assets, demos and other useful data for our games and brands.</p>
                    <p>You must be a customer to access the system. Only company emails are allowed.</p>
                    <p>Your application will be reviewed before access is granted.</p>
                    <p>Please do not share assets externally without permission.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Fieldset className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field className="md:col-span-2">
                            <Label className="sr-only">Full name</Label>
                            <Input
                                placeholder="Full name"
                                {...register("fullName")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.fullName && <div className="text-sm text-red-400 mt-1">{errors.fullName.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Company</Label>
                            <Input
                                placeholder="Company"
                                {...register("company")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.company && <div className="text-sm text-red-400 mt-1">{errors.company.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Department</Label>
                            <Input
                                placeholder="Department"
                                {...register("department")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.department && <div className="text-sm text-red-400 mt-1">{errors.department.message}</div>}
                        </Field>

                        <Field className="md:col-span-2">
                            <Label className="sr-only">Email</Label>
                            <Input
                                placeholder="Email"
                                {...register("email")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.email && <div className="text-sm text-red-400 mt-1">{errors.email.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Password</Label>
                            <Input
                                type="password"
                                placeholder="Password"
                                {...register("password")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.password && <div className="text-sm text-red-400 mt-1">{errors.password.message}</div>}
                        </Field>

                        <Field>
                            <Label className="sr-only">Confirm password</Label>
                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                {...register("confirmPassword")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.confirmPassword && <div className="text-sm text-red-400 mt-1">{errors.confirmPassword.message}</div>}
                        </Field>

                        <div className="md:col-span-2 space-y-3 pt-1">
                            <label className="flex items-center gap-3 text-sm text-white/90">
                                <input type="checkbox" {...register("newsletter")} />
                                Subscribe to the newsletter?
                            </label>

                            <label className="flex items-center gap-3 text-sm text-white/90">
                                <input type="checkbox" {...register("notice")} />
                                I have read and understood the full{" "}
                                <button type="button" onClick={handleOpenCookiePolicy} className="text-primary hover:underline">
                                    Cookie Policy
                                </button>
                            </label>

                            <label className="flex items-center gap-3 text-sm text-white/90">
                                <input type="checkbox" {...register("privacy")} />
                                I agree to the{" "}
                                <button type="button" onClick={handleOpenPrivacyPolicy} className="text-primary hover:underline">
                                    Privacy Policy
                                </button>
                            </label>

                            {(errors.privacy || err) && <div className="text-sm text-red-400 pt-1">{errors.privacy?.message || err}</div>}
                        </div>

                        <div className="md:col-span-2 pt-2 flex flex-col items-center gap-3">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                                onChange={(token) => setValue("recaptchaToken", token || "", { shouldValidate: true })}
                                onExpired={() => setValue("recaptchaToken", "", { shouldValidate: true })}
                                theme="dark"
                            />
                            {errors.recaptchaToken && <div className="text-sm text-red-400">{errors.recaptchaToken.message}</div>}
                        </div>

                        <div className="md:col-span-2 pt-2 flex flex-col items-center gap-4">
                            <button
                                disabled={registerMutation.isPending || !recaptchaToken}
                                className="w-fit mx-auto block rounded-md bg-primary px-9 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                            >
                                {registerMutation.isPending ? "Registering..." : "Request access"}
                            </button>
                        </div>
                    </Fieldset>
                </form>

                <div className="text-center text-sm mt-8 text-white/80">Already have an account?</div>
                <div className="text-center mt-2">
                    <Link to="/login" className="text-sm text-primary hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
