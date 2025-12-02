import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Register() {
    const nav = useNavigate();
    const [err, setErr] = useState("");

    const [form, setForm] = useState({
        fullName: "",
        company: "",
        department: "",
        email: "",
        password: "",
        confirmPassword: "",
        newsletter: false,
        notice: false,
        privacy: false
    });

    const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const registerMutation = useMutation({
        mutationFn: async (form) => {
            const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
            await updateProfile(cred.user, { displayName: form.fullName });

            await setDoc(doc(db, "clients", cred.user.uid), {
                fullName: form.fullName,
                company: form.company,
                department: form.department,
                email: form.email,
                newsletter: form.newsletter,
                createdAt: new Date().toISOString(),
                status: "pending"
            });

            return cred.user;
        },
        onSuccess: () => nav("/login"),
        onError: () => setErr("Unable to register. Try another email.")
    });

    const onSubmit = (e) => {
        e.preventDefault();
        setErr("");

        if (form.password !== form.confirmPassword) {
            setErr("Passwords do not match.");
            return;
        }
        if (!form.notice || !form.privacy) {
            setErr("Please accept required policies.");
            return;
        }

        registerMutation.mutate(form);
    };

    return (
        <div className="min-h-screen text-foreground flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-lg opacity-70" />
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative w-[94%] max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10">
                <div className="flex flex-col items-center gap-3 mb-5">
                    <img src="/image/logo-white.png" alt="Logo" className="h-[80px]" />
                    <div className="text-sm tracking-widest opacity-70">CLIENT AREA</div>
                </div>

                <h1 className="text-center text-base font-semibold mb-4">
                    Please read before signing up
                </h1>

                <div className="text-sm leading-relaxed opacity-85 space-y-3 mb-6 max-h-48 overflow-auto pr-2 scrollbar-hide">
                    <p>The Client Area contains marketing assets, demos and other useful data for our games and brands.</p>
                    <p>You must be a customer to access the system. Only company emails are allowed.</p>
                    <p>Your application will be reviewed before access is granted.</p>
                    <p>Please do not share assets externally without permission.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <input
                        className="w-full rounded-md border border-input bg-background/40 px-4 py-3 text-base"
                        placeholder="Full name"
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            className="w-full rounded-md border border-input bg-background/40 px-4 py-3 text-base"
                            placeholder="Company"
                            value={form.company}
                            onChange={(e) => set("company", e.target.value)}
                        />
                        <input
                            className="w-full rounded-md border border-input bg-background/40 px-4 py-3 text-base"
                            placeholder="Department"
                            value={form.department}
                            onChange={(e) => set("department", e.target.value)}
                        />
                    </div>

                    <input
                        className="w-full rounded-md border border-input bg-background/40 px-4 py-3 text-base"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                    />

                    <input
                        type="password"
                        className="w-full rounded-md border border-input bg-background/40 px-4 py-3 text-base"
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                    />

                    <input
                        type="password"
                        className="w-full rounded-md border border-input bg-background/40 px-4 py-3 text-base"
                        placeholder="Confirm Password"
                        value={form.confirmPassword}
                        onChange={(e) => set("confirmPassword", e.target.value)}
                    />

                    <label className="flex items-center gap-3 text-sm opacity-90">
                        <input
                            type="checkbox"
                            checked={form.newsletter}
                            onChange={(e) => set("newsletter", e.target.checked)}
                        />
                        Subscribe to the newsletter?
                    </label>

                    <label className="flex items-center gap-3 text-sm opacity-90">
                        <input
                            type="checkbox"
                            checked={form.notice}
                            onChange={(e) => set("notice", e.target.checked)}
                        />
                        I have read and understood the full notice
                    </label>

                    <label className="flex items-center gap-3 text-sm opacity-90">
                        <input
                            type="checkbox"
                            checked={form.privacy}
                            onChange={(e) => set("privacy", e.target.checked)}
                        />
                        I agree to the privacy policy
                    </label>

                    {err && <div className="text-sm text-red-400 pt-1">{err}</div>}

                    <button
                        disabled={registerMutation.isPending}
                        className="w-fit mx-auto block mt-1 rounded-md bg-primary px-7 py-2.5 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                        {registerMutation.isPending ? "Registering..." : "Register"}
                    </button>
                </form>

                <div className="text-center text-sm mt-7 opacity-80">
                    Already have an account?
                </div>
                <div className="text-center mt-2">
                    <Link to="/login" className="text-sm text-primary hover:underline">
                        Return to login page
                    </Link>
                </div>
            </div>
        </div>
    );
}
