import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Switch, Fieldset, Field, Input, Label } from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { enableRememberMe } from "../lib/auth";
import { useAuthStore } from "../store/authStore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../contexts/ToastContext";

const partners = [
    "/image/gibraltar.png",
    "/image/MGA-New-Grayscale.png",
    "/image/responsible-gaming.png",
    "/image/be-gamble-aware-gray-footer.png",
    "/image/ecogra.png",
    "/image/gambling-commission.png"
];

const schema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    remember: z.boolean().optional()
});

export default function Login() {
    const nav = useNavigate();
    const setUser = useAuthStore((s) => s.setUser);
    const [err, setErr] = useState("");
    const { showToast } = useToast();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "", remember: false }
    });

    const remember = watch("remember");

    const loginMutation = useMutation({
        mutationFn: async ({ email, password, remember }) => {
            await enableRememberMe(remember);
            const cred = await signInWithEmailAndPassword(auth, email, password);

            const snap = await getDoc(doc(db, "users", cred.user.uid));

            let hasAccess = false;
            if (snap.exists()) {
                const v = snap.data()?.access;
                hasAccess = v === true || v === "true";
            }

            return { user: cred.user, hasAccess };
        },
        onSuccess: async ({ user, hasAccess }) => {
            if (hasAccess) {
                setUser(user);
                showToast({ variant: "success", title: "Login successful", description: "Welcome back!" });
                nav("/");
                return;
            }

            await signOut(auth);
            setErr("Your account is pending approval.");
            showToast({
                variant: "warning",
                title: "Approval required",
                description: "Your account needs to be approved by an administrator before you can log in."
            });
        },
        onError: () => {
            setErr("Invalid email or password.");
            showToast({ variant: "error", title: "Login failed", description: "Invalid email or password. Please try again." });
        }
    });

    const onSubmit = (data) => {
        setErr("");
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-foreground">
            <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-xl opacity-60" />
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative w-[94%] max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10 lg:p-12">
                <div className="flex flex-col items-center gap-3 mb-8">
                    <img src="/image/logo-black.png" alt="Logo" className="h-[90px]" />
                </div>

                <h1 className="text-center text-xl font-semibold text-white mb-7">Client login</h1>

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

                        <Field>
                            <Label className="sr-only">Password</Label>
                            <Input
                                type="password"
                                placeholder="Enter password"
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
                            <span className="text-sm text-white/90">Remember me on this device</span>
                        </div>

                        {err && <div className="text-sm text-red-400 pt-1">{err}</div>}

                        <button
                            disabled={loginMutation.isPending}
                            className="w-fit mx-auto block mt-2 rounded-md bg-primary px-9 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                            {loginMutation.isPending ? "Logging in..." : "Login"}
                        </button>
                    </Fieldset>
                </form>

                <div className="text-center text-sm mt-6">
                    <button className="text-primary hover:underline">Forgot password?</button>
                </div>

                <div className="text-center text-sm mt-8 text-white/80">Create an account?</div>
                <div className="text-center mt-2">
                    <Link to="/register" className="text-sm text-primary hover:underline">
                        Register for a new account
                    </Link>
                </div>
            </div>
        </div>
    );
}
