import React, { useEffect, useMemo, useState } from "react";
import {
    AppBar, Toolbar, Box, IconButton, Button, InputBase, Badge, Menu, MenuItem,
    Divider, useScrollTrigger, Drawer, List, ListItemButton, ListItemText,
    ListItemIcon, Typography, Stack, CircularProgress, useMediaQuery
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import DownloadForOfflineOutlinedIcon from "@mui/icons-material/DownloadForOfflineOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import dayjs from "dayjs";

export default function Header() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [downloads, setDownloads] = useState(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
    const isMdUp = useMediaQuery("(min-width:900px)");

    const nav = [
        { label: "Home", to: "/" },
        { label: "Brands", to: "/brands" },
        { label: "Announcements", to: "/announcements" },
        { label: "Roadmap", to: "/roadmap" }
    ];

    useEffect(() => {
        if (!currentUser) return;
        const qCol = query(
            collection(db, "downloads"),
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const unsub = onSnapshot(qCol, (snap) => {
            setDownloads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, () => setDownloads([]));
        return () => unsub();
    }, [currentUser]);

    const handleMenu = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const goAccount = () => {
        handleClose();
        navigate("/account-settings");
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            handleClose();
            navigate("/login");
        } catch {
            handleClose();
        }
    };

    const brand = useMemo(
        () => (
            <Box component={RouterLink} to="/" sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                <Box
                    component="img"
                    src="/image/xpg-logo-clientarea.png"
                    alt="Xpro Gaming"
                    sx={{ height: 36, mr: 1, display: { xs: "none", sm: "inline-flex" } }}
                />
            </Box>
        ),
        []
    );

    const downloadCount = downloads?.length || 0;

    return (
        <>
            <AppBar
                elevation={scrolled ? 4 : 0}
                position="fixed"
                sx={{
                    bgcolor: scrolled ? "rgba(14,16,22,0.9)" : "transparent",
                    backdropFilter: scrolled ? "saturate(180%) blur(8px)" : "none",
                    borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
                    transition: "background-color .2s ease, border-color .2s ease, backdrop-filter .2s ease"
                }}
            >
                <Toolbar sx={{ gap: 2 }}>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 0.5, display: { xs: "inline-flex", md: "none" } }}
                        onClick={() => setMobileOpen((s) => !s)}
                    >
                        <MenuIcon />
                    </IconButton>

                    {brand}

                    <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, ml: 2 }}>
                        {nav.map((n) => (
                            <Button key={n.to} component={RouterLink} to={n.to} sx={{ color: "rgba(255,255,255,0.9)", textTransform: "none" }}>
                                {n.label}
                            </Button>
                        ))}
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            width: { xs: 160, sm: 220, md: 320 }
                        }}
                    >
                        <SearchIcon sx={{ mr: 1, opacity: 0.8 }} />
                        <InputBase placeholder="Search" inputProps={{ "aria-label": "search" }} sx={{ color: "#fff", width: "100%" }} />
                    </Box>

                    <IconButton size="large" sx={{ ml: 1, color: "#fff" }} onClick={() => setDrawerOpen(true)}>
                        <Badge color="primary" badgeContent={downloadCount}>
                            <DownloadForOfflineOutlinedIcon />
                        </Badge>
                    </IconButton>

                    <IconButton size="large" sx={{ ml: 1, color: "#fff" }} component={RouterLink} to="/collections">
                        <Badge color="primary" badgeContent={0}>
                            <CollectionsBookmarkIcon />
                        </Badge>
                    </IconButton>

                    <IconButton size="large" sx={{ ml: 0.5, color: "#fff" }} onClick={handleMenu} aria-label="account menu">
                        <AccountCircle />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} keepMounted>
                        {currentUser ? (
                            <>
                                <MenuItem disabled>{currentUser.email}</MenuItem>
                                <Divider />
                                <MenuItem onClick={goAccount}>Account Settings</MenuItem>
                                <MenuItem onClick={handleLogout}>Sign out</MenuItem>
                            </>
                        ) : (
                            <>
                                <MenuItem onClick={() => { handleClose(); navigate("/login"); }}>Login</MenuItem>
                                <MenuItem onClick={() => { handleClose(); navigate("/register"); }}>Register</MenuItem>
                            </>
                        )}
                    </Menu>
                </Toolbar>

                {mobileOpen && (
                    <Box
                        sx={{
                            display: { md: "none" },
                            px: 2,
                            pb: 1,
                            bgcolor: scrolled ? "rgba(14,16,22,0.95)" : "rgba(14,16,22,0.6)",
                            borderTop: "1px solid rgba(255,255,255,0.08)"
                        }}
                    >
                        {nav.map((n) => (
                            <Button
                                key={n.to}
                                fullWidth
                                component={RouterLink}
                                to={n.to}
                                onClick={() => setMobileOpen(false)}
                                sx={{ justifyContent: "flex-start", color: "rgba(255,255,255,0.92)", textTransform: "none" }}
                            >
                                {n.label}
                            </Button>
                        ))}
                    </Box>
                )}
                <Toolbar sx={{ display: { xs: "block", md: "none" }, opacity: 0, pointerEvents: "none" }} />
            </AppBar>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: isMdUp ? 420 : "100%",
                        bgcolor: "#111318",
                        borderLeft: "1px solid rgba(255,255,255,0.08)"
                    }
                }}
            >
                <Box sx={{ p: 2, pb: 1 }}>
                    <Typography sx={{ fontWeight: 900, color: "#fff" }}>Recent Downloads</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                        Files you downloaded, newest first.
                    </Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                {!downloads ? (
                    <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={22} />
                    </Box>
                ) : downloads.length === 0 ? (
                    <Box sx={{ p: 3, color: "rgba(255,255,255,0.7)" }}>No downloads yet.</Box>
                ) : (
                    <List dense disablePadding>
                        {downloads.map((d) => (
                            <ListItemButton
                                key={d.id}
                                component="a"
                                href={d.downloadURL || "#"}
                                target="_blank"
                                rel="noreferrer"
                                sx={{ px: 2 }}
                            >
                                <ListItemIcon sx={{ minWidth: 34, color: "#ffb86b" }}>
                                    <DescriptionOutlinedIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                                            <Typography sx={{ color: "#fff" }} noWrap>
                                                {d.fileName || d.fileId || "File"}
                                            </Typography>
                                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                                                {dayjs((d.createdAt?.toDate && d.createdAt.toDate()) || d.createdAt || new Date()).format("MMM D, YYYY")}
                                            </Typography>
                                        </Stack>
                                    }
                                    secondary={
                                        <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }} noWrap>
                                            Section: {d.sectionId || "—"}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Drawer>
        </>
    );
}
