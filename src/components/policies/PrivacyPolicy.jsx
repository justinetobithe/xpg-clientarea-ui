import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

export default function PrivacyPolicy() {
    return (
        <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label="Last updated: Oct 2025" size="small" sx={{ bgcolor: "#23b0ff", color: "#0b0d13", fontWeight: 800, height: 22 }} />
                <Chip label="XPG Client Area" size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
            </Stack>

            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>Privacy Policy</Typography>
            <Typography sx={{ mb: 2 }}>
                This policy describes how we collect, use, and protect information in connection with the XPG Client Area. The Client Area is intended for authorized business partners and contains marketing assets, demos, and related materials.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>Information We Collect</Typography>
            <Typography sx={{ mb: 1 }}>
                Account data such as name, company, department, and business email. Usage data such as pages viewed, downloads, device, and approximate region. Operational logs for security and fraud prevention.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>How We Use Information</Typography>
            <Typography sx={{ mb: 1 }}>
                To provide secure access, personalize content, deliver notices, improve performance, and comply with legal obligations. We may aggregate usage data to understand product adoption and content quality.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>Sharing</Typography>
            <Typography sx={{ mb: 1 }}>
                We do not sell personal data. Limited sharing may occur with infrastructure providers, analytics, or anti-abuse services under contracts requiring confidentiality and appropriate safeguards.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>Security</Typography>
            <Typography sx={{ mb: 1 }}>
                Access is authenticated and monitored. Data is transmitted over TLS and stored with role-based controls. Incidents are reviewed and mitigated according to internal procedures.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>Retention</Typography>
            <Typography sx={{ mb: 1 }}>
                We retain account and audit records for as long as necessary to provide the service and meet legal and contractual requirements. You may request deletion subject to applicable obligations.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>Your Choices</Typography>
            <Typography sx={{ mb: 1 }}>
                You can update profile details, opt out of marketing emails, and request access or deletion of your data by contacting your XPG representative.
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 2 }}>Contact</Typography>
            <Typography>
                For privacy inquiries, contact privacy@xpg.com.
            </Typography>
        </Box>
    );
}
