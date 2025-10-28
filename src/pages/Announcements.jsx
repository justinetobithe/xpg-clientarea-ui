import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Grid,
    Paper,
    Stack,
    Typography,
    Chip,
    Button,
    IconButton,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

function isRecent(ts) {
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return Date.now() - d.getTime() < 14 * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

function formatLongDate(ts) {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function Row({ title, items, onOpen }) {
    const [page, setPage] = useState(0);
    const pageSize = 4;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const visible = useMemo(() => items.slice(page * pageSize, page * pageSize + pageSize), [items, page]);

    return (
        <Box sx={{ mt: 4 }}>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 20, mb: 1.5 }}>{title}</Typography>

            <Box sx={{ position: "relative" }}>
                {totalPages > 1 && (
                    <IconButton
                        aria-label="prev"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        sx={{
                            position: "absolute",
                            zIndex: 2,
                            top: "44%",
                            left: -8,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                )}

                <Grid container spacing={2}>
                    {visible.map((a) => {
                        const img = a?.imageURL || a?.cover || a?.thumbnail || "";
                        return (
                            <Grid item key={a.id} xs={12} sm={6} md={3}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        position: "relative",
                                        overflow: "hidden",
                                        bgcolor: "#0f1218",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    <Box sx={{ position: "relative", height: 150, bgcolor: "#1b202b" }}>
                                        {img ? (
                                            <img
                                                src={img}
                                                alt={a.title || "Announcement cover"}
                                                loading="lazy"
                                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                onClick={() => onOpen(a)}
                                            />
                                        ) : (
                                            <Box
                                                onClick={() => onOpen(a)}
                                                sx={{
                                                    height: "100%",
                                                    width: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "rgba(255,255,255,0.5)",
                                                    fontSize: 12,
                                                    letterSpacing: 0.3,
                                                    cursor: "pointer",
                                                    background:
                                                        "repeating-linear-gradient(45deg, #202737, #202737 10px, #232a3b 10px, #232a3b 20px)",
                                                }}
                                            >
                                                No Image
                                            </Box>
                                        )}

                                        {isRecent(a.createdAt || a.date) && (
                                            <Chip
                                                size="small"
                                                icon={<NewReleasesIcon sx={{ fontSize: 16 }} />}
                                                label="New"
                                                sx={{
                                                    position: "absolute",
                                                    top: 8,
                                                    right: 8,
                                                    height: 22,
                                                    bgcolor: "#ff4d4f",
                                                    color: "#fff",
                                                    "& .MuiChip-icon": { color: "#fff" },
                                                }}
                                            />
                                        )}
                                    </Box>

                                    <Box sx={{ p: 1.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "#fff", fontWeight: 900, lineHeight: 1.25 }}
                                            noWrap
                                            title={a.title}
                                        >
                                            {a.title || "Untitled"}
                                        </Typography>

                                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mt: 0.5 }}>
                                            {formatLongDate(a.date || a.createdAt || new Date())}
                                        </Typography>

                                        <Stack spacing={1} sx={{ mt: 1.25 }}>
                                            <Button
                                                size="small"
                                                onClick={() => onOpen(a)}
                                                startIcon={<ArticleOutlinedIcon sx={{ fontSize: 18 }} />}
                                                sx={{
                                                    justifyContent: "flex-start",
                                                    color: "#ffb86b",
                                                    border: "1px solid rgba(255,255,255,0.12)",
                                                    textTransform: "none",
                                                    fontWeight: 700,
                                                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                                                }}
                                                variant="outlined"
                                                fullWidth
                                            >
                                                Read Announcement
                                            </Button>

                                            {a.packURL && (
                                                <Button
                                                    size="small"
                                                    component="a"
                                                    href={a.packURL}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    startIcon={<Inventory2OutlinedIcon sx={{ fontSize: 18 }} />}
                                                    sx={{
                                                        justifyContent: "flex-start",
                                                        color: "#ffb86b",
                                                        border: "1px solid rgba(255,255,255,0.12)",
                                                        textTransform: "none",
                                                        fontWeight: 700,
                                                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                                                    }}
                                                    variant="outlined"
                                                    fullWidth
                                                >
                                                    View Marketing Pack
                                                </Button>
                                            )}
                                        </Stack>
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}

                    {items.length === 0 && (
                        <Grid item xs={12}>
                            <Typography sx={{ color: "rgba(255,255,255,0.7)", py: 3, textAlign: "center" }}>
                                Nothing here yet.
                            </Typography>
                        </Grid>
                    )}
                </Grid>

                {totalPages > 1 && (
                    <IconButton
                        aria-label="next"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        sx={{
                            position: "absolute",
                            zIndex: 2,
                            top: "44%",
                            right: -8,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}

export default function Announcements() {
    const [items, setItems] = useState(null);
    const [detail, setDetail] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const qCol = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(
            qCol,
            (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setItems(list);
            },
            () => setItems([])
        );
        return () => unsub();
    }, []);

    const grouped = useMemo(() => {
        const all = Array.isArray(items) ? items : [];
        const newReleases = all.filter(
            (a) =>
                (a.category || "").toLowerCase().includes("new") ||
                (a.tags || []).map(String).some((t) => t.toLowerCase() === "new") ||
                isRecent(a.createdAt || a.date)
        );
        const recentlyUpdated = all.filter(
            (a) =>
                (a.category || "").toLowerCase().includes("updated") ||
                (a.tags || []).map(String).some((t) => t.toLowerCase() === "updated")
        );
        const otherIds = new Set([...newReleases, ...recentlyUpdated].map((x) => x.id));
        const otherNews = all.filter((a) => !otherIds.has(a.id));
        return { newReleases, recentlyUpdated, otherNews };
    }, [items]);

    return (
        <Box sx={{ minHeight: "100dvh", bgcolor: "#0b0d13", marginTop: 10 }}>
            <Box sx={{ maxWidth: 1180, mx: "auto", px: { xs: 2, md: 0 }, pt: 4 }}>
                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: 26, md: 34 } }}>
                    Client Area Announcements
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.8)", mt: 1 }}>
                    Stay informed with the latest news, events, and updates.
                </Typography>
            </Box>

            <Box sx={{ maxWidth: 1180, mx: "auto", px: { xs: 2, md: 0 }, py: 4 }}>
                {!items ? (
                    <Grid container spacing={2}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Paper sx={{ overflow: "hidden", bgcolor: "#0f1218", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <Skeleton variant="rectangular" height={150} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                                    <Box sx={{ p: 1.5 }}>
                                        <Skeleton width="80%" />
                                        <Skeleton width="60%" />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <>
                        <Row title="New Releases" items={grouped.newReleases} onOpen={setDetail} />
                        <Row title="Recently Updated" items={grouped.recentlyUpdated} onOpen={setDetail} />
                        <Row title="Other News" items={grouped.otherNews} onOpen={setDetail} />
                    </>
                )}
            </Box>

            <Box sx={{ textAlign: "center", py: 6 }}>
                <img src="/image/xpg-footer-logo.svg" alt="XPG" style={{ height: 48, opacity: 0.9 }} />
            </Box>

            <Dialog
                open={Boolean(detail)}
                onClose={() => setDetail(null)}
                fullWidth
                maxWidth="md"
                PaperProps={{ sx: { bgcolor: "#111318", border: "1px solid rgba(255,255,255,0.08)" } }}
            >
                <DialogTitle sx={{ px: 2, py: 1.5 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                            {detail?.title || ""}
                        </Typography>
                        <IconButton onClick={() => setDetail(null)} sx={{ color: "rgba(255,255,255,0.85)" }}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ px: 0, pb: 3 }}>
                    {detail?.imageURL ? (
                        <Box sx={{ width: "100%", bgcolor: "#0b0d13" }}>
                            <img
                                alt={detail.title}
                                src={detail.imageURL}
                                style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                            />
                        </Box>
                    ) : null}

                    <Box sx={{ px: 3, pt: 2 }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 12, mb: 1 }}>
                            {formatLongDate(detail?.date || detail?.createdAt || new Date())}
                        </Typography>

                        {detail?.content ? (
                            <Box
                                sx={{
                                    color: "rgba(255,255,255,0.9)",
                                    "& a": { color: "#69c0ff" },
                                    "& p": { margin: 0, mb: 1 },
                                }}
                                dangerouslySetInnerHTML={{ __html: detail.content }}
                            />
                        ) : null}

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    if (detail?.id) navigate(`/announcements/${detail.id}`);
                                }}
                                sx={{ bgcolor: "#ff8d47", color: "#0b0d13", fontWeight: 800, "&:hover": { bgcolor: "#ff9f1a" } }}
                            >
                                View Details Page
                            </Button>
                            {detail?.packURL && (
                                <Button
                                    component="a"
                                    href={detail.packURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    variant="outlined"
                                    startIcon={<OpenInNewIcon />}
                                    sx={{
                                        color: "#ffb86b",
                                        border: "1px solid rgba(255,255,255,0.18)",
                                        textTransform: "none",
                                        fontWeight: 800,
                                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                                    }}
                                >
                                    View Marketing Pack
                                </Button>
                            )}
                        </Stack>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
