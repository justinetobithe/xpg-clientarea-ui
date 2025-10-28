import React from "react";
import { Box, Chip, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from "@mui/material";

export default function CookiePolicy() {
    return (
        <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label="Last updated: Oct 2025" size="small" sx={{ bgcolor: "#23b0ff", color: "#0b0d13", fontWeight: 800, height: 22 }} />
                <Chip label="XPG Client Area" size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
            </Stack>

            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>Cookie Policy</Typography>
            <Typography sx={{ mb: 2 }}>
                We use cookies and similar technologies to operate the Client Area, remember preferences, analyze performance, and keep accounts secure. You can manage cookies in your browser settings. Disabling essential cookies may impact functionality.
            </Typography>

            <Paper variant="outlined" sx={{ bgcolor: "transparent", borderColor: "rgba(255,255,255,0.08)", mb: 2 }}>
                <Table size="small" sx={{ "& th, & td": { borderColor: "rgba(255,255,255,0.06)" } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Purpose</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Examples</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>Essential</TableCell>
                            <TableCell>Authentication, session management, security</TableCell>
                            <TableCell>auth_session, csrf_token</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Preferences</TableCell>
                            <TableCell>Language, UI settings</TableCell>
                            <TableCell>lang, theme_mode</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Analytics</TableCell>
                            <TableCell>Usage metrics to improve performance and content</TableCell>
                            <TableCell>analytics_id, perf_sample</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>Managing Cookies</Typography>
            <Typography>
                Most browsers allow you to block or delete cookies. You can also use built-in privacy modes or dedicated extensions to limit tracking.
            </Typography>
        </Box>
    );
}
