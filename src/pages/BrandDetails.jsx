import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Container, Grid, Paper, Typography, Stack, Button, Chip } from "@mui/material";

const DUMMY_BRANDS = [
    { id: "xpg", name: "XPG", tagline: "Premium Live Studio", logo: "/image/brands/xpg.png", banner: "/image/brands/xpg-banner.jpg", category: "Studios", description: "High-quality live dealer experiences, multi-language studios, and premium operation tooling.", links: [{ label: "Brand Kit", href: "#" }, { label: "Logo Pack", href: "#" }, { label: "Guidelines", href: "#" }] },
    { id: "nova", name: "NovaPlay", tagline: "Next-Gen RNG", logo: "/image/brands/nova.png", banner: "/image/brands/nova-banner.jpg", category: "RNG", description: "RNG portfolio built for engagement and speed. Optimized for mobile.", links: [{ label: "RNG Assets", href: "#" }] },
    { id: "luna", name: "LunaLabs", tagline: "Interactive Tools", logo: "/image/brands/luna.png", banner: "/image/brands/luna-banner.jpg", category: "Tools", description: "Creative suite for marketing teams to build, preview, and export campaigns.", links: [{ label: "Tooling Overview", href: "#" }] },
    { id: "zen", name: "ZenBet", tagline: "Seamless Mobile", logo: "/image/brands/zen.png", banner: "/image/brands/zen-banner.jpg", category: "Mobile", description: "Mobile-first solutions with animations, low-latency streaming, and caching.", links: [{ label: "Mobile Guidelines", href: "#" }] },
    { id: "atlas", name: "Atlas", tagline: "Infrastructure Edge", logo: "/image/brands/atlas.png", banner: "/image/brands/atlas-banner.jpg", category: "Infra", description: "Infrastructure to scale globally with observability and edge routing.", links: [{ label: "Infra Overview", href: "#" }] }
];

export default function BrandDetails() {
    const { id } = useParams();
    const brand = useMemo(() => DUMMY_BRANDS.find(b => b.id === id), [id]);
    return (
        <Box sx={{ minHeight: "100dvh", bgcolor: "#0b0d13" }}>
            <Box sx={{ position: "relative", height: { xs: 280, md: 360 }, backgroundImage: `url(${brand?.banner || "/image/clientarea-bg.png"})`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "flex-end", justifyContent: "stretch" }}>
                <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)" }} />
                <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, pb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box component="img" src={brand?.logo} alt={brand?.name} sx={{ width: 72, height: 72, objectFit: "contain" }} />
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="h4" sx={{ color: "#fff", fontWeight: 800 }}>{brand?.name || "Brand"}</Typography>
                                {brand?.category ? <Chip size="small" label={brand.category} sx={{ bgcolor: "#23b0ff", color: "#0b0d13", fontWeight: 800, height: 22 }} /> : null}
                            </Stack>
                            <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>{brand?.tagline}</Typography>
                        </Box>
                    </Stack>
                </Container>
            </Box>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, bgcolor: "#141824", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <Typography sx={{ color: "#fff", fontWeight: 800, mb: 1.5 }}>Overview</Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.85)" }}>{brand?.description}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: "#141824", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <Typography sx={{ color: "#fff", fontWeight: 800, mb: 1.5 }}>Assets</Typography>
                            <Stack spacing={1}>
                                {(brand?.links || []).map((l) => (
                                    <Button key={l.label} variant="outlined" size="small" href={l.href} sx={{ justifyContent: "flex-start" }}>{l.label}</Button>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: "#141824", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <Typography sx={{ color: "#fff", fontWeight: 800, mb: 1.5 }}>Media</Typography>
                            <Grid container spacing={2}>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <Grid key={i} item xs={6} md={4} lg={3}>
                                        <Box sx={{ height: 160, borderRadius: 1, bgcolor: "#0f121a", backgroundImage: `url(/image/mock/${i}.jpg)`, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid rgba(255,255,255,0.06)" }} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
