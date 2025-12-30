import { createContext, useCallback, useContext, useEffect, useRef, useState, Fragment } from "react";
import { Transition } from "@headlessui/react";
import { CheckCircle2, Info, AlertTriangle, X as XIcon, Loader2 } from "lucide-react";

const ToastContext = createContext(null);

const variantStyles = {
    success: "border-emerald-500/70 bg-emerald-950/90 text-emerald-50",
    error: "border-red-500/70 bg-red-950/90 text-red-50",
    warning: "border-amber-500/70 bg-amber-950/90 text-amber-50",
    info: "border-sky-500/70 bg-sky-950/90 text-sky-50"
};

const variantIcon = {
    success: CheckCircle2,
    error: XIcon,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2
};

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

function ToastItem({ toast, onClose }) {
    const Icon = variantIcon[toast.variant] || CheckCircle2;

    return (
        <Transition
            as={Fragment}
            appear
            show
            enter="transform transition ease-out duration-200"
            enterFrom="translate-y-2 opacity-0 scale-95"
            enterTo="translate-y-0 opacity-100 scale-100"
            leave="transform transition ease-in duration-150"
            leaveFrom="translate-y-0 opacity-100 scale-100"
            leaveTo="translate-y-2 opacity-0 scale-95"
        >
            <div
                className={[
                    "pointer-events-auto rounded-md border shadow-lg px-4 py-3 text-sm",
                    toast.variant === "loading" ? "border-white/15 bg-black/85 text-white" : variantStyles[toast.variant] || variantStyles.success
                ].join(" ")}
            >
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                        <Icon className={toast.variant === "loading" ? "h-5 w-5 animate-spin text-primary" : "h-5 w-5"} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {toast.title ? <div className="font-semibold mb-0.5">{toast.title}</div> : null}
                        {toast.description ? <div className="text-xs opacity-90">{toast.description}</div> : null}

                        {toast.variant === "loading" ? (
                            <div className="mt-2">
                                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-[width] duration-150"
                                        style={{ width: `${clamp(toast.progress ?? 0, 0, 100)}%` }}
                                    />
                                </div>
                                <div className="mt-1 text-[11px] text-white/70">
                                    {Math.min(99, Math.round(clamp(toast.progress ?? 0, 0, 100)))}%
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={() => onClose(toast.id)}
                        className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium opacity-70 hover:opacity-100 hover:bg-white/10"
                        aria-label="Close toast"
                        title="Close"
                    >
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Transition>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        ({ title, description, variant = "success", duration = 4000 }) => {
            const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
            setToasts((prev) => [...prev, { id, title, description, variant, progress: null }]);

            if (duration !== Infinity) {
                window.setTimeout(() => removeToast(id), duration);
            }

            return id;
        },
        [removeToast]
    );

    const showProgressToast = useCallback(
        ({ title, description, initialProgress = 8 }) => {
            const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
            setToasts((prev) => [
                ...prev,
                { id, title, description, variant: "loading", progress: clamp(initialProgress, 0, 100) }
            ]);
            return id;
        },
        []
    );

    const updateToast = useCallback((id, patch) => {
        if (!id) return;
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    }, []);

    const finishToast = useCallback(
        async (id, { title, description, variant = "success", duration = 2500 } = {}) => {
            if (!id) return;
            updateToast(id, { progress: 100 });
            await new Promise((r) => setTimeout(r, 180));
            updateToast(id, { variant, title, description, progress: null });
            if (duration !== Infinity) {
                window.setTimeout(() => removeToast(id), duration);
            }
        },
        [removeToast, updateToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, showProgressToast, updateToast, finishToast, removeToast }}>
            {children}

            <div className="pointer-events-none fixed bottom-4 right-4 left-4 sm:left-auto z-[9999] flex justify-center sm:justify-end">
                <div className="w-full max-w-sm space-y-2">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onClose={removeToast} />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}
