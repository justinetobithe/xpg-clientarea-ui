import React, { useMemo, useState } from "react";
import {
  Box, Container, Grid, Paper, Typography, TextField, InputAdornment, Chip,
  Button, Dialog, DialogTitle, DialogContent, Stack, IconButton
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";

const DUMMY_BRANDS = [
  { id: "xpg", name: "XPG", tagline: "Premium Live Studio", logo: "/image/brands/xpg.png", banner: "/image/brands/xpg-banner.jpg", category: "Studios" },
  { id: "nova", name: "NovaPlay", tagline: "Next-Gen RNG", logo: "/image/brands/nova.png", banner: "/image/brands/nova-banner.jpg", category: "RNG" },
  { id: "luna", name: "LunaLabs", tagline: "Interactive Tools", logo: "/image/brands/luna.png", banner: "/image/brands/luna-banner.jpg", category: "Tools" },
  { id: "zen", name: "ZenBet", tagline: "Seamless Mobile", logo: "/image/brands/zen.png", banner: "/image/brands/zen-banner.jpg", category: "Mobile" },
  { id: "atlas", name: "Atlas", tagline: "Infrastructure Edge", logo: "/image/brands/atlas.png", banner: "/image/brands/atlas-banner.jpg", category: "Infra" }
];

export default function Brands() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DUMMY_BRANDS;
    return DUMMY_BRANDS.filter(b =>
      b.name.toLowerCase().includes(s) ||
      b.tagline.toLowerCase().includes(s) ||
      (b.category || "").toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#0b0d13" }}>
      <Box sx={{ position: "relative", height: { xs: 260, md: 320 }, backgroundImage: `url(/image/clientarea-bg.png)`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", px: 2, "&::before": { content: '""', position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 50% 10%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)" } }}>
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900, zIndex: 1, letterSpacing: 0.4 }}>Brands</Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <TextField
          fullWidth
          placeholder="Search brands"
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "24px", height: 40, fontSize: 13 } }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
        />

        <Grid container spacing={2.5}>
          {filtered.map(b => (
            <Grid key={b.id} item xs={12} sm={6} md={4} lg={3}>
              <Paper
                onClick={() => setActive(b)}
                sx={{
                  cursor: "pointer",
                  overflow: "hidden",
                  bgcolor: "#0f1218",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "transform .18s ease, box-shadow .18s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }
                }}
              >
                <Box sx={{ position: "relative", height: 156, bgcolor: "#121724" }}>
                  <img alt={b.name} src={b.banner} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.95 }} />
                  {b.category ? (
                    <Chip label={b.category} size="small" sx={{ position: "absolute", top: 10, left: 10, bgcolor: "#23b0ff", color: "#0b0d13", fontWeight: 800, height: 22 }} />
                  ) : null}
                  <Chip label="Available Soon" size="small" sx={{ position: "absolute", top: 10, right: 10, bgcolor: "#ff4d4f", color: "#fff", fontWeight: 800, height: 22 }} />
                  <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0))" }} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.5, py: 1.5, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Box component="img" src={b.logo} alt={b.name} sx={{ width: 42, height: 42, objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 900, lineHeight: 1.1 }}>{b.name}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 12, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{b.tagline}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}

          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 4, textAlign: "center", color: "rgba(255,255,255,0.7)" }}>No brands found</Box>
            </Grid>
          )}
        </Grid>
      </Container>

      <Dialog
        open={Boolean(active)}
        onClose={() => setActive(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { bgcolor: "#111318", border: "1px solid rgba(255,255,255,0.08)" } }}
      >
        <DialogTitle sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
              {active?.name || ""}
            </Typography>
            <IconButton onClick={() => setActive(null)} sx={{ color: "rgba(255,255,255,0.85)" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1, pb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
            <img src={active?.logo} alt={active?.name} style={{ width: 40, height: 40, objectFit: "contain" }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800 }}>{active?.name}</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{active?.tagline}</Typography>
            </Box>
          </Box>
          <Box sx={{ border: "1px dashed rgba(255,255,255,0.15)", p: 2, borderRadius: 1, background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0))" }}>
            <Typography sx={{ color: "#ffb86b", fontWeight: 800, mb: 0.75 }}>Available Soon</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.85)" }}>
              Dedicated brand pages are on the way. You’ll soon be able to explore showcases, assets, and partner details here.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              sx={{ color: "#ffb86b", border: "1px solid rgba(255,255,255,0.18)", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}
              disabled
            >
              Visit Brand Site
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#ff8d47", color: "#0b0d13", fontWeight: 900, "&:hover": { bgcolor: "#ff9f1a" } }}
              onClick={() => setActive(null)}
            >
              Close
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
