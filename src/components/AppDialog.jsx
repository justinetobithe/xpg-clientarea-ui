import React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Stack, Typography, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDialog } from "../contexts/DialogContext";

export default function DialogHost() {
    const { open, title, content, closeDialog, maxWidth } = useDialog();
    return (
        <Dialog open={open} onClose={closeDialog} fullWidth maxWidth={maxWidth} PaperProps={{ sx: { bgcolor: "#111318", border: "1px solid rgba(255,255,255,0.08)" } }}>
            <DialogTitle sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
                    <IconButton aria-label="close" onClick={closeDialog} sx={{ color: "rgba(255,255,255,0.8)" }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                <Box sx={{ color: "rgba(255,255,255,0.88)" }}>{content}</Box>
            </DialogContent>
        </Dialog>
    );
}
