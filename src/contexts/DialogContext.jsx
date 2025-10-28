import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
    const [state, setState] = useState({ open: false, title: "", content: null, maxWidth: "md" });

    const openDialog = useCallback(({ title, content, maxWidth = "md" }) => {
        setState({ open: true, title, content, maxWidth });
    }, []);

    const closeDialog = useCallback(() => setState((s) => ({ ...s, open: false })), []);

    const value = useMemo(() => ({ ...state, openDialog, closeDialog }), [state, openDialog, closeDialog]);

    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function useDialog() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error("useDialog must be used within DialogProvider");
    return ctx;
}
