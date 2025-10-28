import React, { createContext, useContext, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const SnackbarContext = createContext();

export function useSnackbar() {
    return useContext(SnackbarContext);
}

export function SnackbarProvider({ children }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("info");

    const showSnackbar = (msg, type = "info") => {
        setMessage(msg);
        setSeverity(type);
        setOpen(true);
    };

    const handleClose = (_, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
}
