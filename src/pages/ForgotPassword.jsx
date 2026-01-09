import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fieldset, Field, Input, Label } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "../contexts/ToastContext";

const schema = z.object({
    email: z.string().email("Please enter a valid email"),
});

function toUserMessage(err) {
    const code = err?.code ? String(err.code) : "";
    if (code === "auth/user-not-found") return "If this email exists, we sent a reset link.";
    if (code === "auth/invalid-email") return "Please enter a valid email.";
    if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";
    return "Unable to send reset email. Please try again.";
}

export default function ForgotPassword() {
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
            const continueUrl = `${window.location.origin}/login`;
            await sendPasswordResetEmail(auth, cleanEmail, { url: continueUrl });

            setSent(true);
            showToast({
                variant: "success",
                title: "Email sent",
                description: "If the email exists, you will receive a reset link shortly.",
            });
        } catch (e) {
            const msg = toUserMessage(e);
            setErr(msg);
            showToast({
                variant: "error",
                title: "Reset failed",
                description: msg,
            });
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

                <h1 className="text-center text-xl font-semibold text-white mb-2">Reset password</h1>
                <p className="text-center text-white/70 text-sm mb-6">Enter your email and we’ll send you a reset link.</p>

                {sent ? (
                    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="text-white/90 font-semibold">Check your inbox</div>
                        <div className="text-white/70 text-sm mt-1">If the email exists, you will receive a reset link shortly.</div>

                        <div className="mt-5 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => nav("/login")}
                                className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
                            >
                                Back to login
                            </button>

                            <Link
                                to="/register"
                                className="w-full text-center rounded-md border border-white/15 bg-transparent px-6 py-3 text-base font-semibold text-white/90 hover:bg-white/5"
                            >
                                Create an account
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Fieldset className="space-y-5">
                            <Field>
                                <Label className="sr-only">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="Enter email"
                                    {...register("email")}
                                    className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                                />
                                {errors.email && <div className="text-sm text-red-400 mt-1">{errors.email.message}</div>}
                            </Field>

                            {err && <div className="text-sm text-red-400">{err}</div>}

                            <button
                                disabled={isSubmitting}
                                className="w-fit mx-auto block mt-2 rounded-md bg-primary px-9 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                            >
                                {isSubmitting ? "Sending..." : "Send reset link"}
                            </button>
                        </Fieldset>
                    </form>
                )}

                <div className="text-center text-sm mt-6">
                    <Link to="/login" className="text-primary hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
