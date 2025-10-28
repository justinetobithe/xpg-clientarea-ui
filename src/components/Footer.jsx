import React, { useEffect, useState } from "react";
import { Box, Typography, Link as MuiLink, Container, Stack } from "@mui/material";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { useDialog } from "../contexts/DialogContext";
import PrivacyPolicy from "./policies/PrivacyPolicy";
import CookiePolicy from "./policies/CookiePolicy";

export default function Footer() {
    const [privacyFile, setPrivacyFile] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const { openDialog } = useDialog();

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "files"), where("type", "==", "iTech Cert")), (snap) => {
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setCertificate(docs[0] || null);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "files"), where("type", "==", "privacy_policy")), (snap) => {
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setPrivacyFile(docs[0] || null);
        });
        return () => unsub();
    }, []);

    const logoStyle = {
        height: 34,
        width: "auto",
        objectFit: "contain",
        filter: "grayscale(100%) opacity(0.8)",
        transition: "filter .2s ease, transform .2s ease",
        "&:hover": { filter: "grayscale(0%) opacity(1)", transform: "translateY(-2px)" }
    };

    const openPrivacy = () => {
        openDialog({ title: "Privacy Policy", content: <PrivacyPolicy />, maxWidth: "md" });
    };

    const openCookies = () => {
        openDialog({ title: "Cookie Policy", content: <CookiePolicy />, maxWidth: "md" });
    };

    return (
        <Box component="footer" sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", bgcolor: "#0b0d13" }}>
            <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 }, textAlign: "center", color: "rgba(255,255,255,0.8)" }}>
                <Box sx={{ mb: 2 }}>
                    <Link to="/" aria-label="XPG Home">
                        <Box component="img" src="/image/xpg-logo-clientarea.png" alt="XPG Client Area" sx={{ height: 48 }} />
                    </Link>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4, md: 5 }} alignItems="center" justifyContent="center" sx={{ mb: 3, flexWrap: "wrap" }}>
                    <Box component="img" src="/image/compliance/ecogra.png" alt="eCOGRA" sx={logoStyle} />
                    <Box component="img" src="/image/compliance/gambleaware.png" alt="GambleAware" sx={logoStyle} />
                    <Box component="img" src="/image/compliance/gamstop.png" alt="GAMSTOP" sx={logoStyle} />
                    <Box component="img" src="/image/compliance/mga.png" alt="MGA" sx={logoStyle} />
                    <Box component="img" src="/image/compliance/gambling-commission.png" alt="Gambling Commission" sx={logoStyle} />
                    <Box component="img" src="/image/compliance/18plus.png" alt="18+" sx={logoStyle} />
                    {certificate?.fileUrl && (
                        <MuiLink href={certificate.fileUrl} target="_blank" rel="noopener noreferrer" underline="none" sx={{ lineHeight: 0 }}>
                            <Box component="img" src="/image/itech-lab-icon.png" alt="iTech Labs Certificate" sx={{ ...logoStyle, height: 48 }} />
                        </MuiLink>
                    )}
                </Stack>

                <Typography variant="body2" sx={{ maxWidth: 980, mx: "auto", fontSize: 13, color: "#9B9B9B", lineHeight: 1.6 }}>
                    XPG’s brand, logos, and game artwork are proprietary materials and may not be copied, reproduced, distributed, or displayed without prior written permission from XPG. Access to this Client Area is intended for authorized business partners. XPG products are certified in selected jurisdictions and operated under licenses held by our clients where required by local law. For details on how we collect and process personal data, read our{" "}
                    <MuiLink component="button" onClick={openPrivacy} sx={{ color: "#5BC2E7" }}>
                        Privacy Policy
                    </MuiLink>
                    . Learn what cookies we use in our{" "}
                    <MuiLink component="button" onClick={openCookies} sx={{ color: "#5BC2E7" }}>
                        Cookie Policy
                    </MuiLink>
                    . XPG is committed to responsible gaming—see{" "}
                    <MuiLink component={Link} to="/responsible-gaming" sx={{ color: "#5BC2E7" }}>
                        resources here
                    </MuiLink>
                    .
                </Typography>

                <Typography variant="caption" sx={{ display: "block", mt: 3, color: "rgba(255,255,255,0.6)" }}>
                    © {new Date().getFullYear()} XPG — Client Area
                </Typography>
            </Container>
        </Box>
    );
}
