import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot,
    addDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import {
    Box, Typography, Grid, Card, CardActionArea, CardMedia,
    FormControl, InputLabel, Select, MenuItem, Skeleton, Button, Stack,
    TextField, InputAdornment, Paper, Checkbox, FormControlLabel, Divider, Chip,
    Dialog, DialogTitle, DialogContent, IconButton
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

const getExt = (name, fallback = "") => {
    if (!name) return fallback.toUpperCase();
    const n = name.toString();
    if (n.includes(".")) return n.split(".").pop().toUpperCase();
    return fallback.toUpperCase();
};

const IMAGE_EXTS = new Set(["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"]);
const isImage = (ext) => IMAGE_EXTS.has((ext || "").toUpperCase());
const isPDF = (ext) => (ext || "").toUpperCase() === "PDF";

export default function GameDetails() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { i18n } = useTranslation();

    const [game, setGame] = useState(null);
    const [sections, setSections] = useState([]);
    const [promotionGames, setPromotionGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [error, setError] = useState(null);

    const [tab, setTab] = useState("assets");
    const [showLeftFilters, setShowLeftFilters] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("recent");

    const [selectedSectionNames, setSelectedSectionNames] = useState(new Set());
    const [selectedExts, setSelectedExts] = useState(new Set());
    const [page, setPage] = useState(1);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        if (!gameId) return;
        (async () => {
            try {
                setLoading(true);
                const snap = await getDoc(doc(db, "games", gameId));
                if (!snap.exists()) { setError("Game not found"); setLoading(false); return; }
                setGame({ id: snap.id, ...snap.data() });
            } catch {
                setError("Error fetching game");
            } finally {
                setLoading(false);
            }
        })();
    }, [gameId]);

    useEffect(() => {
        if (!gameId || !currentUser) return;
        (async () => {
            try {
                setLoading(true);
                const sectSnap = await getDocs(query(collection(db, "sections"), where("gameId", "==", gameId)));
                let raw = sectSnap.docs.map((d) => {
                    const data = d.data() || {};
                    const s = data.section || {};
                    return {
                        sectionId: d.id,
                        title: data.title || s.title || "Untitled Section",
                        files: data.files || s.files || [],
                        order: typeof data.order === "number" ? data.order : (typeof s.order === "number" ? s.order : 999),
                    };
                });
                if (currentUser.role !== "super admin") {
                    const permSnap = await getDocs(
                        query(collection(db, "permissions"),
                            where("userId", "==", currentUser.uid),
                            where("gameId", "==", gameId),
                            where("view", "==", true))
                    );
                    const allowed = new Set(permSnap.docs.map((d) => d.data()?.sectionId).filter(Boolean));
                    raw = raw.filter((s) => allowed.has(s.sectionId));
                }
                raw.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
                setSections(raw);
            } catch {
                setSections([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [gameId, currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        let unsub;
        (async () => {
            try {
                let qGames;
                if (currentUser.role === "super admin") {
                    qGames = query(collection(db, "games"), orderBy("createdAt", "desc"), limit(12));
                } else {
                    const accessSnap = await getDocs(
                        query(collection(db, "permissions"), where("userId", "==", currentUser.uid), where("view", "==", true))
                    );
                    const gids = Array.from(new Set(accessSnap.docs.map((d) => d.data()?.gameId).filter(Boolean)));
                    if (gids.length === 0) { setPromotionGames([]); return; }
                    qGames = query(collection(db, "games"), orderBy("createdAt", "desc"), limit(20));
                }
                unsub = onSnapshot(qGames, (snap) => {
                    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => g.id !== gameId);
                    setPromotionGames(list.slice(0, 12));
                });
            } catch {
                setPromotionGames([]);
            }
        })();
        return () => { if (typeof unsub === "function") unsub(); };
    }, [currentUser, gameId]);

    useEffect(() => {
        const url = game?.bannerURL ?? game?.imageURL;
        if (!url) { setImageLoaded(true); return; }
        const img = new Image();
        img.src = url;
        img.onload = () => setImageLoaded(true);
        img.onerror = () => setImageLoaded(true);
    }, [game]);

    const hero = useMemo(() => game?.bannerURL || game?.imageURL || "", [game]);

    const allSectionNames = useMemo(() => sections.map(s => s.title).filter(Boolean), [sections]);

    const allExtensions = useMemo(() => {
        const s = new Set();
        sections.forEach(sec => (sec.files || []).forEach(f => {
            const n = (f?.name || f?.filename || "").toString();
            const ext = n.includes(".") ? n.split(".").pop().toUpperCase() : (f?.ext || f?.type || "").toString().toUpperCase();
            if (ext) s.add(ext);
        }));
        return Array.from(s).sort();
    }, [sections]);

    const flatFiles = useMemo(() => {
        const out = [];
        sections.forEach(sec => {
            (sec.files || []).forEach(f => {
                const n = (f?.name || f?.filename || "").toString();
                const ext = n.includes(".") ? n.split(".").pop().toUpperCase() : (f?.ext || f?.type || "").toString().toUpperCase();
                out.push({
                    ...f,
                    _sectionTitle: sec.title,
                    _sectionId: sec.sectionId,
                    _ext: ext,
                    _size: f?.sizeText || f?.size || "",
                    _date: f?.addedAt?.toDate?.() || f?.createdAt?.toDate?.() || null,
                    _name: n || "Untitled",
                    _thumb: f?.thumb || f?.thumbnail || null,
                    _url: f?.previewURL || f?.url || f?.downloadURL || f?.image || ""
                });
            });
        });
        return out;
    }, [sections]);

    const filteredFiles = useMemo(() => {
        const nameFilter = searchTerm.trim().toLowerCase();
        let arr = flatFiles.filter(r => {
            const secOK = selectedSectionNames.size === 0 || selectedSectionNames.has(r._sectionTitle);
            const extOK = selectedExts.size === 0 || (r._ext && selectedExts.has(r._ext));
            const nameOK = !nameFilter || r._name.toLowerCase().includes(nameFilter);
            return secOK && extOK && nameOK;
        });
        if (sortBy === "alpha") {
            arr.sort((a, b) => a._name.localeCompare(b._name, undefined, { sensitivity: "base", numeric: true }));
        } else {
            arr.sort((a, b) => {
                const ad = a._date ? +a._date : 0;
                const bd = b._date ? +b._date : 0;
                return bd - ad;
            });
        }
        return arr;
    }, [flatFiles, selectedSectionNames, selectedExts, searchTerm, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE));
    const pageFiles = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredFiles.slice(start, start + PAGE_SIZE);
    }, [filteredFiles, page]);

    useEffect(() => { setPage(1); }, [searchTerm, sortBy, selectedSectionNames, selectedExts]);

    const openPreviewAt = useCallback((globalIndex) => {
        setPreviewIndex(globalIndex);
        setPreviewOpen(true);
    }, []);

    useEffect(() => {
        if (!previewOpen) return;
        const onKey = (e) => {
            if (e.key === "ArrowLeft") setPreviewIndex((i) => Math.max(0, i - 1));
            if (e.key === "ArrowRight") setPreviewIndex((i) => Math.min(filteredFiles.length - 1, i + 1));
            if (e.key === "Escape") setPreviewOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [previewOpen, filteredFiles.length]);

    if (error) {
        return (
            <Box sx={{ maxWidth: 1280, mx: "auto", pt: 10, pb: 5, color: "#fff" }}>
                <Typography variant="h5" color="error" align="center">{error}</Typography>
            </Box>
        );
    }

    const currentPreview = filteredFiles[previewIndex];

    const buildForcedDownloadURL = (rawUrl, filename = "download") => {
        try {
            const u = new URL(rawUrl);
            u.searchParams.set("alt", "media");
            const dispo = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
            u.searchParams.set("response-content-disposition", dispo);
            return u.toString();
        } catch {
            return rawUrl;
        }
    };

    const handleDownload = async (file) => {
        const url = file?._url || file?.url;
        const name = file?._name || file?.name || "download";
        if (!url) return;

        if (currentUser?.uid) {
            addDoc(collection(db, "downloads"), {
                userId: currentUser.uid,
                gameId,
                sectionId: file?._sectionId || null,
                sectionTitle: file?._sectionTitle || null,
                fileName: name,
                fileURL: url,
                ext: file?._ext || getExt(name),
                size: file?._size || null,
                downloadedAt: serverTimestamp(),
            }).catch(() => { });
        }

        const forced = buildForcedDownloadURL(url, name);
        const a = document.createElement("a");
        a.href = forced;
        a.setAttribute("download", name);
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };


    return (
        <>
            <Box sx={{ minHeight: "100dvh", bgcolor: "#0b0d13" }}>
                <Box
                    sx={{
                        position: "relative",
                        height: { xs: 520, md: 640, lg: 720 },
                        backgroundImage: `url(${hero})`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: { xs: "center", md: "center" },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        px: 2
                    }}
                >
                    {loading || !imageLoaded ? (
                        <Skeleton variant="rectangular" sx={{ width: "100%", height: { xs: 200, sm: 450, md: 600 } }} />
                    ) : hero ? (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)"
                            }}
                        />
                    ) : null}
                </Box>

                <Box sx={{ bgcolor: "#0b0d13", py: { xs: 3, md: 5 } }}>
                    <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 0 } }}>
                        {loading ? (
                            <>
                                <Skeleton variant="text" sx={{ fontSize: 28, width: "60%", bgcolor: "rgba(255,255,255,0.08)" }} />
                                <Skeleton variant="text" sx={{ fontSize: 16, width: "80%", bgcolor: "rgba(255,255,255,0.06)" }} />
                            </>
                        ) : (
                            <>
                                <Typography variant="h3" sx={{ fontSize: 24, fontWeight: 800, color: "#fff", mb: .5 }}>
                                    {game?.[i18n.language]?.name || game?.name}
                                </Typography>
                                {!!(game?.description || game?.[i18n.language]?.description) && (
                                    <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.8)", mb: 2 }}>
                                        {game?.[i18n.language]?.description || game?.description}
                                    </Typography>
                                )}
                            </>
                        )}

                        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, mb: 2 }}>
                            <Button
                                variant={tab === "assets" ? "contained" : "outlined"}
                                size="small"
                                onClick={() => setTab("assets")}
                                sx={{
                                    textTransform: "none", bgcolor: tab === "assets" ? "#ff8d47" : "transparent", color: tab === "assets" ? "#0b0d13" : "#d0d3d9",
                                    "&:hover": { bgcolor: tab === "assets" ? "#ff9f1a" : "rgba(255,255,255,0.08)" }, borderColor: "rgba(255,255,255,0.18)"
                                }}
                            >
                                Assets
                            </Button>
                            <Button
                                variant={tab === "related" ? "contained" : "outlined"}
                                size="small"
                                onClick={() => setTab("related")}
                                sx={{
                                    textTransform: "none", bgcolor: tab === "related" ? "#ff8d47" : "transparent", color: tab === "related" ? "#0b0d13" : "#d0d3d9",
                                    "&:hover": { bgcolor: tab === "related" ? "#ff9f1a" : "rgba(255,255,255,0.08)" }, borderColor: "rgba(255,255,255,0.18)"
                                }}
                            >
                                Related
                            </Button>
                        </Stack>

                        {tab === "assets" ? (
                            <Grid container spacing={2.5}>
                                {showLeftFilters && (
                                    <Grid item xs={12} md={3}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                bgcolor: "#111318",
                                                color: "#fff",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                p: 2,
                                                position: { md: "sticky" },
                                                top: { md: 24 }
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 800, mb: 1, color: "#ff9f1a" }}>File Types</Typography>
                                            <Box sx={{ mb: 2, pl: .5 }}>
                                                {allSectionNames.map((name) => (
                                                    <FormControlLabel
                                                        key={name}
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={selectedSectionNames.has(name)}
                                                                onChange={(e) => {
                                                                    const next = new Set(selectedSectionNames);
                                                                    e.target.checked ? next.add(name) : next.delete(name);
                                                                    setSelectedSectionNames(next);
                                                                }}
                                                                sx={{ color: "#fff" }}
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{name}</Typography>}
                                                    />
                                                ))}
                                            </Box>

                                            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1.5 }} />

                                            <Typography sx={{ fontWeight: 800, mb: 1, color: "#ff9f1a" }}>File Tags</Typography>
                                            <Box sx={{ pl: .5 }}>
                                                {allExtensions.map((ext) => (
                                                    <FormControlLabel
                                                        key={ext}
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={selectedExts.has(ext)}
                                                                onChange={(e) => {
                                                                    const next = new Set(selectedExts);
                                                                    e.target.checked ? next.add(ext) : next.delete(ext);
                                                                    setSelectedExts(next);
                                                                }}
                                                                sx={{ color: "#fff" }}
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{ext}</Typography>}
                                                    />
                                                ))}
                                            </Box>

                                            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1.5 }} />

                                            <Box>
                                                <Typography sx={{ fontWeight: 800, color: "#ff9f1a", mb: .5 }}>Follow Us</Typography>
                                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                                                    @XPG Live<br />@xpg.live
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1.5 }} />

                                            <Box>
                                                <Typography sx={{ fontWeight: 800, color: "#ff9f1a", mb: .5 }}>Contact Us</Typography>
                                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                                                    Missing a file? Send your request to<br />xpg@live.com
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                )}

                                <Grid item xs={12} md={showLeftFilters ? 9 : 12}>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr auto auto",
                                            gap: 1.5,
                                            alignItems: "center",
                                            mb: 1.5
                                        }}
                                    >
                                        <TextField
                                            size="small"
                                            placeholder="Search"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ maxWidth: 320 }}
                                        />

                                        <Button
                                            size="small"
                                            onClick={() => setShowLeftFilters((v) => !v)}
                                            sx={{ textTransform: "none", color: "#d0d3d9" }}
                                        >
                                            {showLeftFilters ? "Hide Filters" : "Show Filters"}
                                        </Button>

                                        <FormControl size="small" sx={{ minWidth: 160, justifySelf: "end" }}>
                                            <InputLabel sx={{ color: "#d0d3d9" }}>Sort By</InputLabel>
                                            <Select
                                                value={sortBy}
                                                label="Sort By"
                                                onChange={(e) => setSortBy(e.target.value)}
                                                sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" } }}
                                            >
                                                <MenuItem value="alpha">Alphabetical</MenuItem>
                                                <MenuItem value="recent">Recently Updated</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box
                                        sx={{
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            bgcolor: "#111318"
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "40px 120px 1fr 220px 220px",
                                                gap: 0,
                                                alignItems: "center",
                                                px: 2,
                                                py: 1,
                                                bgcolor: "#161922",
                                                color: "rgba(255,255,255,0.8)",
                                                borderBottom: "1px solid rgba(255,255,255,0.08)",
                                                fontSize: 12,
                                                fontWeight: 700
                                            }}
                                        >
                                            <Box />
                                            <Box>Preview</Box>
                                            <Box>File Name</Box>
                                            <Box>Details</Box>
                                            <Box>Actions</Box>
                                        </Box>

                                        {loading ? (
                                            Array.from({ length: 6 }).map((_, i) => (
                                                <Box key={i} sx={{ px: 2, py: 1.2, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                                    <Skeleton variant="rectangular" height={56} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
                                                </Box>
                                            ))
                                        ) : pageFiles.length === 0 ? (
                                            <Box sx={{ p: 3 }}>
                                                <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>No files found.</Typography>
                                            </Box>
                                        ) : (
                                            pageFiles.map((f, idx) => {
                                                const globalIndex = (page - 1) * PAGE_SIZE + idx;
                                                const ext = getExt(f._name, f._ext);
                                                const showImg = isImage(ext) && (f._thumb || f._url);
                                                const showPdf = isPDF(ext);

                                                return (
                                                    <Box
                                                        key={`${f._name}-${idx}`}
                                                        sx={{
                                                            display: "grid",
                                                            gridTemplateColumns: "40px 120px 1fr 220px 220px",
                                                            alignItems: "center",
                                                            gap: 0,
                                                            px: 2,
                                                            py: 1.5,
                                                            borderBottom: "1px solid rgba(255,255,255,0.06)"
                                                        }}
                                                    >
                                                        <Box>
                                                            <Checkbox size="small" sx={{ color: "#fff" }} />
                                                        </Box>

                                                        <Box
                                                            onClick={() => openPreviewAt(globalIndex)}
                                                            sx={{
                                                                position: "relative",
                                                                height: 60,
                                                                width: 108,
                                                                bgcolor: "#0f121a",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                overflow: "hidden",
                                                                cursor: "pointer",
                                                                border: "1px solid rgba(255,255,255,0.06)"
                                                            }}
                                                        >
                                                            {showImg ? (
                                                                <img
                                                                    alt=""
                                                                    src={f._thumb || f._url}
                                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                />
                                                            ) : showPdf ? (
                                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#E53935", width: "100%", height: "100%" }}>
                                                                    <PictureAsPdfIcon />
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "rgba(255,255,255,0.8)", gap: .5 }}>
                                                                    <InsertDriveFileIcon />
                                                                    <Typography sx={{ fontSize: 10, opacity: .9 }}>{ext || "FILE"}</Typography>
                                                                </Box>
                                                            )}

                                                            <Box
                                                                sx={{
                                                                    position: "absolute",
                                                                    inset: 0,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    opacity: 0,
                                                                    transition: "opacity .2s",
                                                                    bgcolor: "rgba(0,0,0,0.35)",
                                                                    "&:hover": { opacity: 1 }
                                                                }}
                                                            >
                                                                <ZoomInIcon sx={{ color: "#fff" }} />
                                                            </Box>
                                                        </Box>

                                                        <Box sx={{ pl: 2, minWidth: 0 }}>
                                                            <Typography noWrap sx={{ color: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 0.75 }}>
                                                                {showPdf ? <PictureAsPdfIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }} /> : isImage(ext) ? <ImageIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }} /> : <InsertDriveFileIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }} />}
                                                                {f._name}
                                                            </Typography>
                                                            <Typography noWrap sx={{ color: "rgba(255,255,255,0.6)", fontSize: 11, mt: .25 }}>
                                                                {f._sectionTitle} • {ext || "—"}
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ pr: 2 }}>
                                                            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                                                                {f._size ? `${f._size}` : ""}{f._size && "  |  "}
                                                                {f._date ? `Added ${new Date(f._date).toLocaleDateString()}` : ""}
                                                            </Typography>
                                                            {f.badge || f.tag ? (
                                                                <Chip size="small" label={f.badge || f.tag} sx={{ mt: .75, bgcolor: "#ff9f1a", color: "#0b0d13", height: 20 }} />
                                                            ) : null}
                                                        </Box>

                                                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                startIcon={<DownloadIcon />}
                                                                sx={{ bgcolor: "#ff8d47", color: "#0b0d13", fontWeight: 800, "&:hover": { bgcolor: "#ff9f1a" } }}
                                                                onClick={() => handleDownload(f)}
                                                            >
                                                                Download
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<VisibilityIcon />}
                                                                sx={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
                                                                onClick={() => openPreviewAt(globalIndex)}
                                                            >
                                                                Preview
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<PlaylistAddIcon />}
                                                                sx={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
                                                            >
                                                                Add to Collection
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                );
                                            })
                                        )}
                                    </Box>

                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
                                        <Typography sx={{ color: "#ff9f1a", fontWeight: 700, fontSize: 14 }}>
                                            Page {page} of {totalPages}
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                disabled={page <= 1}
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                startIcon={<ChevronLeftIcon />}
                                                sx={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
                                            >
                                                Prev
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                disabled={page >= totalPages}
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                endIcon={<ChevronRightIcon />}
                                                sx={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
                                            >
                                                Next
                                            </Button>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                {loading ? (
                                    <Grid container spacing={3} justifyContent="center">
                                        {[...Array(4)].map((_, i) => (
                                            <Grid item key={i} xs={6} sm={4} md={3}>
                                                <Skeleton variant="rectangular" sx={{ height: { xs: 120, md: 160 }, bgcolor: "rgba(255,255,255,0.08)" }} />
                                                <Skeleton variant="text" sx={{ fontSize: 16, mt: 1, bgcolor: "rgba(255,255,255,0.06)" }} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Grid container spacing={3} justifyContent="center">
                                        {promotionGames.map((g) => (
                                            <Grid item key={g.id} xs={6} sm={4} md={3}>
                                                <Card
                                                    sx={{ transition: ".25s", "&:hover": { transform: "scale(1.04)" }, overflow: "hidden", bgcolor: "#111318", border: "1px solid rgba(255,255,255,0.08)" }}
                                                    onClick={() => { window.scrollTo(0, 0); setTab("assets"); navigate(`/game/${g.id}`); }}
                                                >
                                                    <CardActionArea sx={{ height: { xs: 120, md: 160 } }}>
                                                        <CardMedia
                                                            component="img"
                                                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            image={g.imageURL || "https://via.placeholder.com/300?text=No+Image"}
                                                            alt={g?.[i18n.language]?.name || g?.name}
                                                        />
                                                    </CardActionArea>
                                                </Card>
                                                <Typography variant="h6" sx={{ fontSize: { xs: 16, lg: 18 }, color: "#fff", p: 1 }}>
                                                    {g?.[i18n.language]?.name || g?.name}
                                                </Typography>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Dialog
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    fullWidth
                    maxWidth="lg"
                    PaperProps={{ sx: { bgcolor: "#111318", border: "1px solid rgba(255,255,255,0.08)" } }}
                >
                    <DialogTitle sx={{ bgcolor: "rgba(255,255,255,0.04)", px: 2 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {isPDF(getExt(currentPreview?._name, currentPreview?._ext)) ? (
                                    <PictureAsPdfIcon sx={{ color: "#ff9f1a" }} />
                                ) : isImage(getExt(currentPreview?._name, currentPreview?._ext)) ? (
                                    <ImageIcon sx={{ color: "#ff9f1a" }} />
                                ) : (
                                    <InsertDriveFileIcon sx={{ color: "#ff9f1a" }} />
                                )}
                                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>
                                    {currentPreview?._name || ""}
                                    {currentPreview?._ext ? `  |  ${getExt(currentPreview?._name, currentPreview?._ext)}` : ""}
                                    {currentPreview?._size ? `  |  ${currentPreview._size}` : ""}
                                    {currentPreview?._date ? `  |  Added ${new Date(currentPreview._date).toLocaleString()}` : ""}
                                    {filteredFiles.length ? `  |  ${previewIndex + 1} of ${filteredFiles.length}` : ""}
                                </Typography>
                            </Stack>
                            <IconButton aria-label="close" onClick={() => setPreviewOpen(false)} sx={{ color: "rgba(255,255,255,0.85)" }}>
                                <CloseIcon />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Box sx={{ position: "relative" }}>
                            <IconButton
                                aria-label="prev"
                                onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                                disabled={previewIndex <= 0}
                                sx={{
                                    position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)",
                                    bgcolor: "rgba(0,0,0,0.55)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" }, zIndex: 2
                                }}
                            >
                                <ChevronLeftIcon />
                            </IconButton>

                            <IconButton
                                aria-label="next"
                                onClick={() => setPreviewIndex((i) => Math.min(filteredFiles.length - 1, i + 1))}
                                disabled={previewIndex >= filteredFiles.length - 1}
                                sx={{
                                    position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
                                    bgcolor: "rgba(0,0,0,0.55)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" }, zIndex: 2
                                }}
                            >
                                <ChevronRightIcon />
                            </IconButton>

                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#0b0d13" }}>
                                {isImage(getExt(currentPreview?._name, currentPreview?._ext)) && currentPreview?._url ? (
                                    <img
                                        alt={currentPreview?._name || ""}
                                        src={currentPreview._url}
                                        style={{ width: "100%", height: "auto", maxHeight: "70vh", objectFit: "contain" }}
                                    />
                                ) : isPDF(getExt(currentPreview?._name, currentPreview?._ext)) && currentPreview?._url ? (
                                    <iframe
                                        title={currentPreview?._name || "PDF"}
                                        src={`${currentPreview._url}#toolbar=1&navpanes=0`}
                                        style={{ width: "100%", height: "70vh", border: 0 }}
                                    />
                                ) : (
                                    <Box sx={{ width: "100%", height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, color: "rgba(255,255,255,0.85)" }}>
                                        <InsertDriveFileIcon sx={{ fontSize: 48, opacity: .85 }} />
                                        <Typography>No inline preview for this file type.</Typography>
                                    </Box>
                                )}
                            </Box>

                            <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: "center" }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<PlaylistAddIcon />}
                                    sx={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
                                >
                                    Add to Collection
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    sx={{ bgcolor: "#ff8d47", color: "#0b0d13", fontWeight: 800, "&:hover": { bgcolor: "#ff9f1a" } }}
                                    onClick={() => handleDownload(currentPreview)}
                                >
                                    Download
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<VisibilityIcon />}
                                    sx={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}
                                    onClick={() => setPreviewOpen(false)}
                                >
                                    Close Preview
                                </Button>
                            </Stack>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box >
        </>
    );
}
