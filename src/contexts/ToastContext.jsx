import { createContext, useCallback, useContext, useState, Fragment } from "react";
import { Transition } from "@headlessui/react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        ({ title, description, variant = "success", duration = 4000 }) => {
            const id = Date.now() + Math.random();
            setToasts((prev) => [...prev, { id, title, description, variant }]);

            if (duration !== Infinity) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }
        },
        [removeToast]
    );

    const getVariantStyles = (variant) => {
        if (variant === "error")
            return "border-red-500/70 bg-red-950/90 text-red-50";
        if (variant === "warning")
            return "border-amber-500/70 bg-amber-950/90 text-amber-50";
        if (variant === "info")
            return "border-sky-500/70 bg-sky-950/90 text-sky-50";
        return "border-emerald-500/70 bg-emerald-950/90 text-emerald-50";
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
 
            <div className="pointer-events-none fixed bottom-4 right-4 left-4 sm:left-auto z-[9999] flex justify-center sm:justify-end">
                <div className="w-full max-w-sm space-y-2">
                    {toasts.map((toast) => (
                        <Transition
                            key={toast.id}
                            as={Fragment}
                            appear
                            show
                            enter="transform transition ease-out duration-200"
                            enterFrom="translate-y-2 opacity-0 scale-95"
                            enterTo="translate-y-0 opacity-100 scale-100"
                        >
                            <div
                                className={
                                    "pointer-events-auto flex items-start gap-3 rounded-md border shadow-lg px-4 py-3 text-sm " +
                                    getVariantStyles(toast.variant)
                                }
                            >
                                <div className="flex-1">
                                    {toast.title && (
                                        <div className="font-semibold mb-0.5">{toast.title}</div>
                                    )}
                                    {toast.description && (
                                        <div className="text-xs opacity-90">
                                            {toast.description}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeToast(toast.id)}
                                    className="ml-2 text-xs font-medium opacity-70 hover:opacity-100"
                                >
                                    ✕
                                </button>
                            </div>
                        </Transition>
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used inside ToastProvider");
    }
    return ctx;
}
