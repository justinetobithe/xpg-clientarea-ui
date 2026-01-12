import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { useToast } from "../contexts/ToastContext";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const nav = useNavigate();
    const { showToast } = useToast();

    const token = params.get("token") || "";
    const [loading, setLoading] = useState(true);
    const [docData, setDocData] = useState(null);
    const [status, setStatus] = useState("loading");
    const [expiresText, setExpiresText] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isValidToken = useMemo(() => token.length >= 20, [token]);

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            if (!isValidToken) {
                setStatus("invalid");
                setLoading(false);
                return;
            }

            try {
                const ref = doc(db, "password_reset_tokens", token);
                const snap = await getDoc(ref);

                if (!mounted) return;

                if (!snap.exists()) {
                    setStatus("not_found");
                    setLoading(false);
                    return;
                }

                const data = snap.data();
                setDocData(data);

                const expiresAt = data?.expiresAt?.toDate ? data.expiresAt.toDate().getTime() : 0;
                const usedAt = data?.usedAt ? true : false;

                if (expiresAt) {
                    setExpiresText(new Date(expiresAt).toLocaleString());
                }

                if (usedAt || data?.status === "used") {
                    setStatus("used");
                    setLoading(false);
                    return;
                }

                if (expiresAt && Date.now() > expiresAt) {
                    setStatus("expired");
                    setLoading(false);
                    return;
                }

                setStatus("ok");
                setLoading(false);
            } catch {
                setStatus("error");
                setLoading(false);
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, [token, isValidToken]);

    const submit = async () => {
        if (submitting) return;

        if (!password || password.length < 8) {
            showToast({ variant: "error", title: "Invalid password", description: "Password must be at least 8 characters." });
            return;
        }
        if (password !== confirm) {
            showToast({ variant: "error", title: "Mismatch", description: "Passwords do not match." });
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_XPG_API_URL}/resetPasswordWithToken`, {
                token,
                newPassword: password,
            });

            await updateDoc(doc(db, "password_reset_tokens", token), {
                status: "used",
                usedAt: serverTimestamp(),
            });

            showToast({ variant: "success", title: "Password updated", description: "You can now login with your new password." });
            nav("/login");
        } catch (e) {
            const msg = e?.response?.data?.error || "Reset failed. Link may be expired or invalid.";
            showToast({ variant: "error", title: "Reset failed", description: msg });
        } finally {
            setSubmitting(false);
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

                <h1 className="text-center text-xl font-semibold text-white mb-2">Set new password</h1>

                {loading ? (
                    <div className="text-center text-white/70">Loading…</div>
                ) : status !== "ok" ? (
                    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="text-white/90 font-semibold">
                            {status === "invalid" && "Invalid link"}
                            {status === "not_found" && "Link not found"}
                            {status === "expired" && "Link expired"}
                            {status === "used" && "Link already used"}
                            {status === "error" && "Something went wrong"}
                        </div>

                        <div className="text-white/70 text-sm mt-2">
                            {expiresText ? `Validity: ${expiresText}` : ""}
                        </div>

                        <div className="mt-5 flex flex-col gap-3">
                            <Link
                                to="/forgot-password"
                                className="w-full text-center rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
                            >
                                Request new reset link
                            </Link>

                            <Link
                                to="/login"
                                className="w-full text-center rounded-md border border-white/15 bg-transparent px-6 py-3 text-base font-semibold text-white/90 hover:bg-white/5"
                            >
                                Back to login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                            <div className="text-white/90 font-semibold">Link is valid</div>
                            <div className="text-white/70 text-sm mt-1">
                                Email: {docData?.email || "—"}
                            </div>
                            <div className="text-white/70 text-sm mt-1">
                                Valid until: {expiresText || "—"}
                            </div>
                            <div className="text-white/70 text-sm mt-1">
                                Status: {docData?.status || "pending"}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New password (min 8 chars)"
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full rounded-md border border-input bg-background/10 px-4 py-3 text-base text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <button
                            disabled={submitting}
                            onClick={submit}
                            className="w-full rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                            {submitting ? "Updating..." : "Update password"}
                        </button>

                        <div className="text-center text-sm">
                            <Link to="/login" className="text-primary hover:underline">
                                Back to login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
