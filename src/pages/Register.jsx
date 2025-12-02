import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fieldset, Field, Input, Label } from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
        privacy: z.boolean()
    })
    .refine((v) => v.password === v.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    })
    .refine((v) => v.notice && v.privacy, {
        message: "Please accept required policies",
        path: ["privacy"]
    });

export default function Register() {
    const nav = useNavigate();
    const [err, setErr] = useState("");

    const {
        register,
        handleSubmit,
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
            privacy: false
        }
    });

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

    const onSubmit = (data) => {
        setErr("");
        registerMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-foreground">
            <div className="absolute inset-0 bg-[url('/image/bg.jpg')] bg-cover bg-center scale-110 blur-xl opacity-60" />
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative w-[94%] max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-8 md:p-10">
                <div className="flex flex-col items-center gap-3 mb-5">
                    <img src="/image/logo-white.png" alt="Logo" className="h-[80px]" />
                    <div className="text-sm tracking-widest text-white/80">CLIENT AREA</div>
                </div>

                <h1 className="text-center text-lg font-semibold text-white mb-4">
                    Please read before signing up
                </h1>

                <div className="text-sm leading-relaxed text-white/80 space-y-3 mb-6 max-h-48 overflow-auto pr-2 scrollbar-hide">
                    <p>The Client Area contains marketing assets, demos and other useful data for our games and brands.</p>
                    <p>You must be a customer to access the system. Only company emails are allowed.</p>
                    <p>Your application will be reviewed before access is granted.</p>
                    <p>Please do not share assets externally without permission.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Fieldset className="space-y-4">
                        <Field>
                            <Label className="sr-only">Full name</Label>
                            <Input
                                placeholder="Full name"
                                {...register("fullName")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.fullName && (
                                <div className="text-sm text-red-400 mt-1">{errors.fullName.message}</div>
                            )}
                        </Field>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field>
                                <Label className="sr-only">Company</Label>
                                <Input
                                    placeholder="Company"
                                    {...register("company")}
                                    className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                                />
                                {errors.company && (
                                    <div className="text-sm text-red-400 mt-1">{errors.company.message}</div>
                                )}
                            </Field>

                            <Field>
                                <Label className="sr-only">Department</Label>
                                <Input
                                    placeholder="Department"
                                    {...register("department")}
                                    className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                                />
                                {errors.department && (
                                    <div className="text-sm text-red-400 mt-1">{errors.department.message}</div>
                                )}
                            </Field>
                        </div>

                        <Field>
                            <Label className="sr-only">Email</Label>
                            <Input
                                placeholder="Email"
                                {...register("email")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.email && (
                                <div className="text-sm text-red-400 mt-1">{errors.email.message}</div>
                            )}
                        </Field>

                        <Field>
                            <Label className="sr-only">Password</Label>
                            <Input
                                type="password"
                                placeholder="Password"
                                {...register("password")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.password && (
                                <div className="text-sm text-red-400 mt-1">{errors.password.message}</div>
                            )}
                        </Field>

                        <Field>
                            <Label className="sr-only">Confirm password</Label>
                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                {...register("confirmPassword")}
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            {errors.confirmPassword && (
                                <div className="text-sm text-red-400 mt-1">
                                    {errors.confirmPassword.message}
                                </div>
                            )}
                        </Field>

                        <label className="flex items-center gap-3 text-sm text-white/90">
                            <input type="checkbox" {...register("newsletter")} />
                            Subscribe to the newsletter?
                        </label>

                        <label className="flex items-center gap-3 text-sm text-white/90">
                            <input type="checkbox" {...register("notice")} />
                            I have read and understood the full notice
                        </label>

                        <label className="flex items-center gap-3 text-sm text-white/90">
                            <input type="checkbox" {...register("privacy")} />
                            I agree to the privacy policy
                        </label>

                        {(errors.privacy || err) && (
                            <div className="text-sm text-red-400 pt-1">
                                {errors.privacy?.message || err}
                            </div>
                        )}

                        <button
                            disabled={registerMutation.isPending}
                            className="w-fit mx-auto block mt-1 rounded-md bg-primary px-7 py-2.5 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                            {registerMutation.isPending ? "Registering..." : "Register"}
                        </button>
                    </Fieldset>
                </form>

                <div className="text-center text-sm mt-7 text-white/80">
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
