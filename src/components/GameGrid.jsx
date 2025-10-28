import React, { useState, useEffect, useMemo, startTransition, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { collection, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
    Box, Typography, Grid, Card, CardActionArea, CardMedia,
    InputAdornment, TextField, Autocomplete, Container, Skeleton, Chip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function GameGrid() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [filters, setFilters] = useState({
        search: "",
        sort: "createdAt-desc",
        uploadDate: [],
        promotions: [],
        dealer: [],
        category: [],
    });

    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    const [games, setGames] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredGames, setFilteredGames] = useState([]);

    const sortOptions = useMemo(
        () => [
            { value: "createdAt-desc", label: t("sort.newest") },
            { value: "name-asc", label: t("sort.alphabetically") },
        ],
        [t]
    );

    const uploadDateOptions = useMemo(
        () => [
            { value: "any", label: t("uploadDate.any") },
            { value: "lastWeek", label: t("uploadDate.lastWeek") },
            { value: "lastMonth", label: t("uploadDate.lastMonth") },
            { value: "last3Months", label: t("uploadDate.last3Months") },
            { value: "lastYear", label: t("uploadDate.lastYear") },
            { value: "last2Years", label: t("uploadDate.last2Years") },
        ],
        [t]
    );

    const promotionsOptions = useMemo(
        () => [
            { value: "christmas", label: t("promotions.christmas") },
            { value: "football", label: t("promotions.football") },
            { value: "halloween", label: t("promotions.halloween") },
            { value: "mobile", label: t("promotions.mobile") },
            { value: "promotions", label: t("promotions.promotions") },
            { value: "stValentine", label: t("promotions.stValentine") },
            { value: "summer", label: t("promotions.summer") },
        ],
        [t]
    );

    const dealerOptions = useMemo(
        () => [
            { value: "all", label: t("dealerOptions.all") },
            { value: "twentyFivePlus", label: t("dealerOptions.twentyFivePlus") },
            { value: "female", label: t("dealerOptions.female") },
            { value: "male", label: t("dealerOptions.male") },
        ],
        [t]
    );

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);

        if (currentUser.role === "super admin") {
            const qGames = query(collection(db, "games"), orderBy("createdAt", "desc"));
            const unsub = onSnapshot(
                qGames,
                (snap) => {
                    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                    const cats = [...new Set(list.map((g) => g.category).filter(Boolean))].sort((a, b) =>
                        a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
                    );
                    setGames(list);
                    setCategories(cats);
                    setLoading(false);
                },
                () => setLoading(false)
            );
            return () => unsub();
        }

        const qPerm = query(
            collection(db, "permissions"),
            where("userId", "==", currentUser.uid),
            where("view", "==", true)
        );

        const unsubPerm = onSnapshot(
            qPerm,
            async (permSnap) => {
                const ids = Array.from(new Set(permSnap.docs.map((d) => d.data()?.gameId).filter(Boolean)));
                if (ids.length === 0) {
                    setGames([]);
                    setCategories([]);
                    setLoading(false);
                    return;
                }

                const chunk = (arr, size) => {
                    const out = [];
                    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
                    return out;
                };

                if (ids.length <= 50) {
                    try {
                        const buckets = chunk(ids, 10);
                        const allDocs = [];
                        await Promise.all(
                            buckets.map(async (c) => {
                                const qG = query(collection(db, "games"), where("id", "in", c));
                                const s = await getDocs(qG);
                                s.forEach((d) => allDocs.push({ id: d.id, ...d.data() }));
                            })
                        );
                        allDocs.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
                        const cats = [...new Set(allDocs.map((g) => g.category).filter(Boolean))].sort((a, b) =>
                            a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
                        );
                        setGames(allDocs);
                        setCategories(cats);
                        setLoading(false);
                    } catch {
                        const qGames = query(collection(db, "games"), orderBy("createdAt", "desc"));
                        const unsubAll = onSnapshot(
                            qGames,
                            (snap) => {
                                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => ids.includes(g.id));
                                const cats = [...new Set(list.map((g) => g.category).filter(Boolean))].sort((a, b) =>
                                    a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
                                );
                                setGames(list);
                                setCategories(cats);
                                setLoading(false);
                            },
                            () => setLoading(false)
                        );
                        return () => unsubAll();
                    }
                } else {
                    const qGames = query(collection(db, "games"), orderBy("createdAt", "desc"));
                    const unsubAll = onSnapshot(
                        qGames,
                        (snap) => {
                            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => ids.includes(g.id));
                            const cats = [...new Set(list.map((g) => g.category).filter(Boolean))].sort((a, b) =>
                                a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
                            );
                            setGames(list);
                            setCategories(cats);
                            setLoading(false);
                        },
                        () => setLoading(false)
                    );
                    return () => unsubAll();
                }
            },
            () => setLoading(false)
        );

        return () => unsubPerm();
    }, [currentUser]);

    const debouncedSetSearch = useMemo(
        () =>
            debounce((term) => {
                startTransition(() => {
                    setFilters((prev) => ({ ...prev, search: term }));
                    setListLoading(false);
                });
            }, 300),
        []
    );
    useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

    const onSearchChange = (e) => {
        const term = e.target.value;
        setSearchInput(term);
        setListLoading(true);
        debouncedSetSearch(term);
    };

    const deferredSearch = useDeferredValue(filters.search);

    const filteredGamesMemo = useMemo(() => {
        if (loading) return [];
        const lcSearch = (deferredSearch || "").trim().toLowerCase();
        const lang = i18n.language;

        let out = games.filter((game) => {
            if (game.hidden === true) return false;
            const name = (game?.[lang]?.name || game?.name || "").toString();
            if (lcSearch && !name.toLowerCase().includes(lcSearch)) return false;
            if (filters.category.length > 0 && !filters.category.includes(game.category)) return false;
            if (filters.uploadDate.length > 0 && !filters.uploadDate.includes(game.uploadDate)) return false;
            if (filters.promotions.length > 0 && !filters.promotions.includes(game.promotion)) return false;
            if (filters.dealer.length > 0 && !filters.dealer.includes(game.dealer)) return false;
            return true;
        });

        if (filters.sort === "name-asc") {
            out.sort((a, b) =>
                (a?.[lang]?.name || a?.name || "")
                    .toString()
                    .localeCompare((b?.[lang]?.name || b?.name || "").toString(), undefined, {
                        sensitivity: "base",
                        numeric: true,
                    })
            );
        } else {
            out.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        }
        return out;
    }, [
        games,
        loading,
        filters.category,
        filters.uploadDate,
        filters.promotions,
        filters.dealer,
        filters.sort,
        deferredSearch,
        i18n.language,
    ]);

    useEffect(() => {
        setFilteredGames(filteredGamesMemo);
        if (!loading) setListLoading(false);
    }, [filteredGamesMemo, loading]);

    const showGridSkeleton = loading || listLoading;

    return (
        <Container maxWidth="xl" sx={{ pt: 2, pb: 6 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md="auto">
                    <Typography variant="h6" sx={{ color: "#9aa4ac", fontWeight: 700, mr: 2, whiteSpace: "nowrap" }}>
                        {t("gameGrid.allGames")}
                    </Typography>
                </Grid>

                <Grid item xs={12} md={7} lg={8}>
                    <Grid container spacing={2}>
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <Grid key={i} item xs={6} sm={6} md={3}>
                                    <Skeleton variant="rectangular" height={36} sx={{ borderRadius: "24px" }} />
                                </Grid>
                            ))
                        ) : (
                            <>
                                <Grid item xs={6} sm={6} md={3}>
                                    <Autocomplete
                                        options={categories}
                                        getOptionLabel={(o) => o}
                                        value={filters.category[0] || null}
                                        onChange={(_, v) => {
                                            setListLoading(true);
                                            setFilters((p) => ({ ...p, category: v ? [v] : [] }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Category"
                                                size="small"
                                                sx={{
                                                    "& .MuiOutlinedInput-root": { borderRadius: "24px", height: 36, fontSize: 12 },
                                                    "& .MuiInputLabel-root": { fontSize: 12 },
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={6} sm={6} md={3}>
                                    <Autocomplete
                                        options={sortOptions}
                                        getOptionLabel={(o) => o.label}
                                        value={sortOptions.find((o) => o.value === filters.sort) || null}
                                        onChange={(_, v) => {
                                            setListLoading(true);
                                            setFilters((p) => ({ ...p, sort: v ? v.value : "" }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={t("filters.label")}
                                                size="small"
                                                sx={{
                                                    "& .MuiOutlinedInput-root": { borderRadius: "24px", height: 36, fontSize: 12 },
                                                    "& .MuiInputLabel-root": { fontSize: 12 },
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={6} sm={6} md={3}>
                                    <Autocomplete
                                        options={uploadDateOptions}
                                        getOptionLabel={(o) => o.label}
                                        value={uploadDateOptions.find((o) => o.value === filters.uploadDate[0]) || null}
                                        onChange={(_, v) => {
                                            setListLoading(true);
                                            setFilters((p) => ({ ...p, uploadDate: v ? [v.value] : [] }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={t("uploadDate.label")}
                                                size="small"
                                                sx={{
                                                    "& .MuiOutlinedInput-root": { borderRadius: "24px", height: 36, fontSize: 12 },
                                                    "& .MuiInputLabel-root": { fontSize: 12 },
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={6} sm={6} md={3}>
                                    <Autocomplete
                                        options={promotionsOptions}
                                        getOptionLabel={(o) => o.label}
                                        value={promotionsOptions.find((o) => o.value === filters.promotions[0]) || null}
                                        onChange={(_, v) => {
                                            setListLoading(true);
                                            setFilters((p) => ({ ...p, promotions: v ? [v.value] : [] }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={t("promotions.label")}
                                                size="small"
                                                sx={{
                                                    "& .MuiOutlinedInput-root": { borderRadius: "24px", height: 36, fontSize: 12 },
                                                    "& .MuiInputLabel-root": { fontSize: 12 },
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Grid>

                <Grid item xs={12} md>
                    {loading ? (
                        <Skeleton variant="rectangular" height={36} sx={{ borderRadius: "24px" }} />
                    ) : (
                        <TextField
                            fullWidth
                            placeholder={t("gameGrid.search")}
                            size="small"
                            value={searchInput}
                            onChange={onSearchChange}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "24px", height: 36, fontSize: 13 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                </Grid>
            </Grid>

            {showGridSkeleton ? (
                <Grid container spacing={2.5} sx={{ mt: 1 }}>
                    {[...Array(12)].map((_, i) => (
                        <Grid key={i} item xs={6} sm={4} md={3} lg={3} xl={2.4}>
                            <Card sx={{ bgcolor: "#161922", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <Skeleton variant="rectangular" height={180} />
                                <Box sx={{ p: 1.2 }}>
                                    <Skeleton variant="text" width="70%" />
                                    <Skeleton variant="text" width="40%" />
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={2.5} sx={{ mt: 1 }}>
                    {filteredGames.map((game) => {
                        const name = (game?.[i18n.language]?.name || game?.name || "Game").toString();
                        const provider = (game?.provider || "").toString();
                        const badge = game.tag || game.badge || game.status;
                        return (
                            <Grid key={game.id} item xs={6} sm={4} md={3} lg={3} xl={2.4}>
                                <Card
                                    onClick={() => navigate(`/game/${game.id}`)}
                                    sx={{
                                        cursor: "pointer",
                                        bgcolor: "#161922",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                        transition: "transform .18s ease",
                                        "&:hover": { transform: "translateY(-2px)" },
                                    }}
                                >
                                    <Box sx={{ position: "relative", height: 180, bgcolor: "#0f121a" }}>
                                        <CardActionArea sx={{ height: "100%" }}>
                                            <CardMedia
                                                component="img"
                                                image={game.imageURL || "/image/mock/fallback.jpg"}
                                                alt={name}
                                                sx={{ height: "100%", width: "100%", objectFit: "cover" }}
                                            />
                                        </CardActionArea>
                                        {badge && (
                                            <Chip
                                                label={badge}
                                                size="small"
                                                sx={{
                                                    position: "absolute",
                                                    top: 8,
                                                    left: 8,
                                                    fontWeight: 800,
                                                    bgcolor: badge.toLowerCase() === "new" ? "#23b0ff" : "#ff9f1a",
                                                    color: "#0b0d13",
                                                    height: 22,
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box
                                        sx={{
                                            px: 1.2,
                                            pt: 1.1,
                                            pb: 1.4,
                                            bgcolor: "#151922",
                                            borderTop: "1px solid rgba(255,255,255,0.04)",
                                        }}
                                    >
                                        <Typography sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.15, fontSize: 14 }}>
                                            {name}
                                        </Typography>
                                        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                                            {provider}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Container>
    );
}
