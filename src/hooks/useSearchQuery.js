import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useGamesQuery } from "./useGamesQuery";
import { useAnnouncementsQuery, announcementMatches } from "./useAnnouncementsQuery";

const normalize = (s) => String(s || "").toLowerCase().trim();

const gameMatches = (g, term) => {
    const t = normalize(term);
    if (!t) return true;
    const name = normalize(g?.name || g?.title || g?.game_name);
    return name.includes(t);
};

const sectionMatches = (s, term) => {
    const t = normalize(term);
    if (!t) return true;
    const name = normalize(s?.name || s?.title);
    return name.includes(t);
};

const fileMatches = (f, term) => {
    const t = normalize(term);
    if (!t) return true;
    const name = normalize(f?.name || f?.filename || f?.title);
    const desc = normalize(f?.description);
    return name.includes(t) || desc.includes(t);
};

async function fetchSectionsAndFilesForGames(gameIds) {
    const out = {};

    await Promise.all(
        gameIds.map(async (gameId) => {
            const sectionsRef = collection(db, "games", gameId, "sections");
            const sectionsSnap = await getDocs(query(sectionsRef, orderBy("order", "asc")));

            const sections = await Promise.all(
                sectionsSnap.docs.map(async (sd) => {
                    const section = { id: sd.id, ...sd.data() };

                    const filesRef = collection(db, "games", gameId, "sections", sd.id, "files");
                    const filesSnap = await getDocs(query(filesRef, orderBy("order", "asc")));
                    const files = filesSnap.docs.map((fd) => ({ id: fd.id, ...fd.data() }));

                    return { ...section, files };
                })
            );

            out[gameId] = sections;
        })
    );

    return out;
}

export function useSearchQuery(term) {
    const q = normalize(term);

    const gamesQuery = useGamesQuery();
    const announcementsQuery = useAnnouncementsQuery();

    const baseLoading = gamesQuery.isLoading || announcementsQuery.isLoading;
    const baseError = gamesQuery.error || announcementsQuery.error;

    const baseGames = gamesQuery.data || [];
    const baseAnnouncements = announcementsQuery.data || [];

    const matchedAnnouncements = useMemo(() => {
        if (!q) return [];
        return baseAnnouncements.filter((a) => announcementMatches(a, q));
    }, [baseAnnouncements, q]);

    const matchedGames = useMemo(() => {
        if (!q) return [];
        return baseGames.filter((g) => gameMatches(g, q));
    }, [baseGames, q]);

    const gameIds = useMemo(() => matchedGames.map((g) => g.id).filter(Boolean), [matchedGames]);

    const sectionsQuery = useQuery({
        queryKey: ["search-sections-files", gameIds.join("|")],
        queryFn: () => fetchSectionsAndFilesForGames(gameIds),
        enabled: !!q && gameIds.length > 0
    });

    const hydratedGames = useMemo(() => {
        if (!q || matchedGames.length === 0) return [];

        const map = sectionsQuery.data || {};
        return matchedGames.map((g) => {
            const sectionsRaw = map[g.id] || [];
            const sections = sectionsRaw
                .map((s) => {
                    const keepSection = sectionMatches(s, q);
                    const files = (s.files || []).filter((f) => fileMatches(f, q));
                    if (!keepSection && files.length === 0) return null;
                    return { ...s, files };
                })
                .filter(Boolean);

            return { ...g, sections };
        });
    }, [matchedGames, sectionsQuery.data, q]);

    const isLoading = baseLoading || sectionsQuery.isLoading;
    const error = baseError || sectionsQuery.error;

    const totalCount = (matchedAnnouncements?.length || 0) + (hydratedGames?.length || 0);

    return {
        isLoading,
        error,
        q,
        matchedAnnouncements,
        matchedGames: hydratedGames,
        totalCount
    };
}
