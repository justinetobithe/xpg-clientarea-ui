import React, { useState } from "react";
import {
  Box, Container, Grid, Paper, Typography, Stack, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, Button, IconButton
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";

const ROADMAP = {
  now: [
    { id: "rm-1", title: "Live Blackjack Revamp", tag: "Live", progress: 65, summary: "UI refresh, new tables, studio lighting updates." },
    { id: "rm-2", title: "Client Area UX Pass", tag: "Web", progress: 45, summary: "Faster navigation, search improvements, skeletons." }
  ],
  next: [
    { id: "rm-3", title: "NovaPlay Jackpot Series", tag: "RNG", progress: 20, summary: "Linked jackpots across top titles." },
    { id: "rm-4", title: "Partner Analytics Beta", tag: "Tools", progress: 10, summary: "Self-serve dashboards for campaign ROI." }
  ],
  later: [
    { id: "rm-5", title: "Edge Streaming Optimizations", tag: "Infra", progress: 5, summary: "Adaptive routing for APAC and LATAM." }
  ]
};

function CardItem({ it, onOpen }) {
  return (
    <Box
      onClick={() => onOpen(it)}
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: "#161b25",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "transform .18s ease, box-shadow .18s ease",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 18px 40px rgba(0,0,0,0.35)" },
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Typography sx={{ color: "#fff", fontWeight: 900 }}>{it.title}</Typography>
        <Chip label={it.tag} size="small" sx={{ bgcolor: "#23b0ff", color: "#0b0d13", fontWeight: 800, height: 22 }} />
      </Stack>
      <Typography sx={{ color: "rgba(255,255,255,0.85)", mb: 1 }}>{it.summary}</Typography>
      <LinearProgress variant="determinate" value={it.progress} sx={{ height: 8, borderRadius: 1 }} />
      <Chip label="Available Soon" size="small" sx={{ position: "absolute", top: 10, right: 10, bgcolor: "#ff4d4f", color: "#fff", fontWeight: 800, height: 22 }} />
    </Box>
  );
}

function Lane({ title, items, onOpen }) {
  return (
    <Paper sx={{ p: 2, bgcolor: "#141824", border: "1px solid rgba(255,255,255,0.06)", minHeight: 240 }}>
      <Typography sx={{ color: "#fff", fontWeight: 900, mb: 1.5 }}>{title}</Typography>
      <Stack spacing={1.5}>
        {items.map(it => <CardItem key={it.id} it={it} onOpen={onOpen} />)}
        {items.length === 0 && <Box sx={{ color: "rgba(255,255,255,0.7)" }}>No items</Box>}
      </Stack>
    </Paper>
  );
}

export default function Roadmap() {
  const [detail, setDetail] = useState(null);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#0b0d13" }}>
      <Box sx={{ position: "relative", height: { xs: 220, md: 280 }, backgroundImage: `url(/image/clientarea-bg.png)`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", px: 2, "&::before": { content: '""', position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 50% 10%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)" } }}>
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900, zIndex: 1, letterSpacing: 0.4 }}>Roadmap</Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}><Lane title="Now" items={ROADMAP.now} onOpen={setDetail} /></Grid>
          <Grid item xs={12} md={4}><Lane title="Next" items={ROADMAP.next} onOpen={setDetail} /></Grid>
          <Grid item xs={12} md={4}><Lane title="Later" items={ROADMAP.later} onOpen={setDetail} /></Grid>
        </Grid>
      </Container>

      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        fullWidth
        maxWidth="sm"
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
        <DialogContent sx={{ px: 3, pt: 1, pb: 3 }}>
          <Box sx={{ border: "1px dashed rgba(255,255,255,0.15)", p: 2, borderRadius: 1, background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0))" }}>
            <Typography sx={{ color: "#ffb86b", fontWeight: 800, mb: 0.75 }}>Available Soon</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
              Detailed milestone pages, progress history, and change logs are coming soon.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              sx={{ color: "#ffb86b", border: "1px solid rgba(255,255,255,0.18)", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}
              disabled
            >
              View Full Spec
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#ff8d47", color: "#0b0d13", fontWeight: 900, "&:hover": { bgcolor: "#ff9f1a" } }}
              onClick={() => setDetail(null)}
            >
              Close
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
