import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Grid,
    Paper,
    Stack,
    Typography,
    Button,
    Skeleton,
    Divider,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

function toDate(ts) {
    return ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
}

export default function AnnouncementDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [list, setList] = useState(null);

    useEffect(() => {
        if (!id) return;
        getDoc(doc(db, "announcements", id))
            .then((snap) => setItem(snap.exists() ? { id: snap.id, ...snap.data() } : null))
            .catch(() => setItem(null));
    }, [id]);

    useEffect(() => {
        const qCol = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(
            qCol,
            (snap) => {
                const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setList(arr);
            },
            () => setList([])
        );
        return () => unsub();
    }, []);

    const recommended = useMemo(() => {
        const all = Array.isArray(list) ? list : [];
        const others = all.filter((a) => a.id !== id);
        const currTags = new Set((item?.tags || []).map((t) => String(t).toLowerCase()));
        const primary = others.filter((a) =>
            (a.tags || []).some((t) => currTags.has(String(t).toLowerCase()))
        );
        const merged = [...primary, ...others].filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i);
        return merged.slice(0, 6);
    }, [list, id, item]);

    return (
        <Box sx={{ minHeight: "50dvh", bgcolor: "#0b0d13", marginTop: 10 }}>
            <Box sx={{ maxWidth: 1180, mx: "auto", px: { xs: 2, md: 0 } }}>
                <Button
                    size="small"
                    startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigate("/announcements")}
                    sx={{ mb: 2, color: "#ffb86b" }}
                >
                    Back to Announcements
                </Button>
            </Box>

            <Box sx={{ maxWidth: 1180, mx: "auto", px: { xs: 2, md: 0 }, pb: 6 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ bgcolor: "#111318", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {item ? (
                                <>
                                    {item.imageURL ? (
                                        <Box sx={{ width: "100%", bgcolor: "#0b0d13" }}>
                                            <img
                                                src={item.imageURL}
                                                alt={item.title}
                                                style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
                                            />
                                        </Box>
                                    ) : null}

                                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                                        <Typography sx={{ color: "#fff", fontSize: 24, fontWeight: 900, mb: 0.5 }}>
                                            {item.title || "Announcement"}
                                        </Typography>
                                        <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12, mb: 2 }}>
                                            {toDate(item.date || item.createdAt).toLocaleString()}
                                        </Typography>

                                        {item.content ? (
                                            <Box
                                                sx={{
                                                    color: "rgba(255,255,255,0.92)",
                                                    "& a": { color: "#69c0ff" },
                                                    "& p": { margin: 0, mb: 1.25 },
                                                    "& ul": { margin: 0, pl: 3, mb: 1.25 },
                                                }}
                                                dangerouslySetInnerHTML={{ __html: item.content }}
                                            />
                                        ) : (
                                            <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>
                                                No content provided.
                                            </Typography>
                                        )}

                                        {item.packURL && (
                                            <Button
                                                component="a"
                                                href={item.packURL}
                                                target="_blank"
                                                rel="noreferrer"
                                                variant="outlined"
                                                startIcon={<OpenInNewIcon />}
                                                sx={{
                                                    mt: 2,
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
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ p: 3 }}>
                                    <Skeleton variant="rectangular" height={260} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 2 }} />
                                    <Skeleton width="60%" />
                                    <Skeleton width="40%" />
                                    <Skeleton width="90%" />
                                    <Skeleton width="85%" />
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ bgcolor: "#111318", border: "1px solid rgba(255,255,255,0.08)", p: 2 }}>
                            <Typography sx={{ color: "#fff", fontWeight: 900, mb: 1 }}>Recommended</Typography>
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1 }} />
                            <Stack spacing={1.5}>
                                {(recommended || []).map((a) => {
                                    const img = a.imageURL || a.cover || a.thumbnail || "";
                                    return (
                                        <Box
                                            key={a.id}
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "88px 1fr",
                                                gap: 1,
                                                alignItems: "center",
                                                cursor: "pointer",
                                                "&:hover .tt": { color: "#ffb86b" },
                                            }}
                                            onClick={() => navigate(`/announcements/${a.id}`)}
                                        >
                                            <Box sx={{ width: 88, height: 60, bgcolor: "#1b202b", overflow: "hidden" }}>
                                                {img ? (
                                                    <img
                                                        alt={a.title}
                                                        src={img}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                    />
                                                ) : (
                                                    <Box sx={{ width: "100%", height: "100%", background: "linear-gradient(45deg,#202737,#232a3b)" }} />
                                                )}
                                            </Box>
                                            <Box>
                                                <Typography className="tt" sx={{ color: "#fff", fontWeight: 700 }} noWrap>
                                                    {a.title}
                                                </Typography>
                                                <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                                                    {toDate(a.date || a.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                {recommended && recommended.length === 0 && (
                                    <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>No recommendations yet.</Typography>
                                )}
                                {!recommended && (
                                    <>
                                        <Skeleton variant="rectangular" height={60} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                                        <Skeleton variant="rectangular" height={60} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                                        <Skeleton variant="rectangular" height={60} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                                    </>
                                )}
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
