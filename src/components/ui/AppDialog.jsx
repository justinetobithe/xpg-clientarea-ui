import React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const AppDialog = ({ isOpen, title, children, onClose }) => {
    return (
        <Dialog open={isOpen} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {title}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>{children}</DialogContent>
        </Dialog>
    );
};

export default AppDialog;
