import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Container, Grid, Paper, Stack, Typography, Button, IconButton, Divider, Skeleton
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GameGrid from "../components/GameGrid";

function HScroll({ children, height }) {
  const ref = useRef(null);
  const scrollBy = (dx) => ref.current?.scrollBy({ left: dx, behavior: "smooth" });
  return (
    <Box sx={{ position: "relative" }}>
      <IconButton onClick={() => scrollBy(-600)} sx={{ position: "absolute", left: -12, top: "40%", zIndex: 2, bgcolor: "rgba(0,0,0,0.6)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" }, display: { xs: "none", md: "flex" } }}>
        <ChevronLeftIcon />
      </IconButton>
      <Box ref={ref} sx={{ display: "flex", gap: 16 / 2, overflowX: "auto", scrollBehavior: "smooth", py: 1, px: 1, height }}>
        {children}
      </Box>
      <IconButton onClick={() => scrollBy(600)} sx={{ position: "absolute", right: -12, top: "40%", zIndex: 2, bgcolor: "rgba(0,0,0,0.6)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" }, display: { xs: "none", md: "flex" } }}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}

function formatDT(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${date}  ${time}`;
}

export default function Home() {
  const { i18n } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [bannerHome, setBannerHome] = useState(null);
  const [bannerGames, setBannerGames] = useState(null);

  const [brands, setBrands] = useState(null);
  const [downloads, setDownloads] = useState(null);
  const [ann, setAnn] = useState(null);

  useEffect(() => {
    const qHome = query(collection(db, "banners"), where("page", "==", "Home"));
    const qGames = query(collection(db, "banners"), where("page", "==", "Games"));
    const unsubHome = onSnapshot(qHome, (snap) => setBannerHome(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }));
    const unsubGames = onSnapshot(qGames, (snap) => setBannerGames(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }));
    return () => { unsubHome(); unsubGames(); };
  }, []);

  useEffect(() => {
    const qb = query(collection(db, "brands"), orderBy("order", "asc"));
    const unsubB = onSnapshot(qb, (snap) => setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubB();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) { setDownloads([]); return; }

    const qd = query(
      collection(db, "downloads"),
      where("userId", "==", currentUser.uid),
      // orderBy("downloadedAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(
      qd,
      (snap) => setDownloads(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("downloads listener error:", err); 
        setDownloads([]);
      }
    );

    return () => unsub();
  }, [currentUser?.uid]);


  useEffect(() => {
    const qa = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(12));
    const unsubA = onSnapshot(qa, (snap) => setAnn(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubA();
  }, []);

  const banner = bannerHome || bannerGames;
  const heroImage = banner?.image || "/image/bg_1000x500.jpg";
  const title = banner?.[i18n.language]?.text || banner?.text || "";
  const subText = banner?.[i18n.language]?.subText || banner?.subText || "";

  const buildForcedDownloadURL = (rawUrl, filename = "download") => {
    try {
      const u = new URL(rawUrl);
      u.searchParams.set("alt", "media");
      u.searchParams.set("response-content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      return u.toString();
    } catch {
      return rawUrl;
    }
  };

  const triggerImmediateDownload = (url, filename) => {
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", filename || "download");
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = (d) => {
    const url = d.fileURL;
    const name = d.fileName || "download";
    if (!url) return;
    const forced = buildForcedDownloadURL(url, name);
    triggerImmediateDownload(forced, name);
  };
 
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#0b0d13" }}>
      <Box
        sx={{
          position: "relative",
          height: { xs: 520, md: 640, lg: 720 },
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: { xs: "center", md: "center" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)" }} />
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 1100, px: 2 }}>
          {!!title && (
            <Typography variant="h1" sx={{ fontSize: { xs: 36, sm: 44, md: 64 }, fontWeight: 900, letterSpacing: 0.2, color: "#fff", mb: subText ? 1.5 : 0 }}>
              {title}
            </Typography>
          )}
          {!!subText && (
            <Typography sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "rgba(255,255,255,0.92)" }}>
              {subText}
            </Typography>
          )}
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, mt: { xs: 3, md: 4 }, pb: { xs: 8, md: 10 } }}>
        <Typography sx={{ color: "#fff", fontWeight: 800, mb: 1.5, fontSize: 20 }}>Brands</Typography>
        {!brands ? (
          <HScroll height="160px">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={260} height={150} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1 }} />
            ))}
          </HScroll>
        ) : (
          <HScroll height="160px">
            {brands.map(b => (
              <Paper key={b.id} sx={{ width: 260, height: 150, overflow: "hidden", bgcolor: "#141824", border: "1px solid rgba(255,255,255,0.06)" }}>
                {b.imageURL ? (
                  <Box sx={{ width: "100%", height: "100%", backgroundImage: `url(${b.imageURL})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                ) : (
                  <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>{b.name || "Brand"}</Box>
                )}
              </Paper>
            ))}
          </HScroll>
        )}

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 0, bgcolor: "#141824", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
              <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ color: "#fff", fontWeight: 700 }}>Recent Downloads</Typography>
              </Box>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
              <Box sx={{ maxHeight: 320, overflowY: "auto", px: 2, py: 1 }}>
                {!downloads ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
                      <Skeleton variant="rectangular" width={36} height={28} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="70%" />
                        <Skeleton width="40%" />
                      </Box>
                      <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                    </Stack>
                  ))
                ) : downloads.length === 0 ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.75)", py: 2 }}>No downloads yet.</Typography>
                ) : (
                  downloads.map(d => (
                    <Stack key={d.id} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, color: "rgba(255,255,255,0.9)" }}>
                      <Box sx={{ width: 36, height: 28, bgcolor: "#1d2230", borderRadius: 1 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13 }}>{d.fileName || "File"}</Typography>
                        <Typography sx={{ fontSize: 11, opacity: 0.7 }}>{formatDT(d.downloadedAt || new Date())}</Typography>
                      </Box>
                      <IconButton size="small" component="a" href={d.fileURL || "#"} target="_blank" rel="noreferrer" sx={{ color: "#ffb86b" }}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDownload(d)} sx={{ color: "#ffb86b" }}>
                        <DownloadOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 0, bgcolor: "#141824", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
              <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ color: "#fff", fontWeight: 700 }}>Announcements For You</Typography>
                <Button size="small" variant="text" onClick={() => navigate("/announcements")}>View All</Button>
              </Box>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
              <Box sx={{ maxHeight: 320, overflowY: "auto", px: 2, py: 1 }}>
                {!ann ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Stack key={i} direction="row" spacing={1.5} sx={{ py: 1 }}>
                      <Skeleton variant="rectangular" width={120} height={72} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="80%" />
                        <Skeleton width="50%" />
                        <Skeleton width="40%" />
                      </Box>
                    </Stack>
                  ))
                ) : ann.length === 0 ? (
                  <Typography sx={{ color: "rgba(255,255,255,0.75)", py: 2 }}>No announcements yet.</Typography>
                ) : (
                  ann.map(a => (
                    <Stack key={a.id} direction="row" spacing={1.5} sx={{ py: 1 }}>
                      <Box sx={{ width: 120, height: 72, bgcolor: "#1d2230", borderRadius: 1, overflow: "hidden" }}>
                        {a.imageURL ? (
                          <Box sx={{ width: "100%", height: "100%", backgroundImage: `url(${a.imageURL})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        ) : null}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{a.title || "Announcement"}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                          <Button size="small" variant="outlined" onClick={() => navigate(`/announcements/${a.id}`)} startIcon={<ArticleOutlinedIcon />} sx={{ borderColor: "rgba(255,255,255,0.18)", color: "#ffb86b", textTransform: "none", height: 28 }}>
                            Read Announcement
                          </Button>
                          {a.packURL && (
                            <Button size="small" variant="outlined" component="a" href={a.packURL} target="_blank" rel="noreferrer" startIcon={<Inventory2OutlinedIcon />} sx={{ borderColor: "rgba(255,255,255,0.18)", color: "#ffb86b", textTransform: "none", height: 28 }}>
                              View Marketing Pack
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 6, md: 8 } }} id="all-games">
          <GameGrid />
        </Box>
      </Container>
    </Box>
  );
}
