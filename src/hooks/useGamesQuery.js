import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthStore } from "../store/authStore";

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

async function fetchGamesForUser(currentUser) {
    if (!currentUser) return [];

    if (currentUser.role === "super admin") {
        const qGames = query(collection(db, "games"), orderBy("order", "asc"));
        const snap = await getDocs(qGames);
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return raw.filter((g) => g.hidden !== true && g.hidden !== "true" && g.hidden !== 1);
    }

    const qPerm = query(
        collection(db, "permissions"),
        where("userId", "==", currentUser.uid),
        where("view", "==", true)
    );

    const permSnap = await getDocs(qPerm);
    const gameIds = Array.from(new Set(permSnap.docs.map((d) => d.data()?.gameId).filter(Boolean)));

    if (gameIds.length === 0) return [];

    const ID_LIMIT = 10;
    const chunks = chunk(gameIds, ID_LIMIT);

    const allGameDocs = [];
    await Promise.all(
        chunks.map(async (c) => {
            const qG = query(collection(db, "games"), where("id", "in", c));
            const s = await getDocs(qG);
            s.forEach((d) => allGameDocs.push({ id: d.id, ...d.data() }));
        })
    );

    allGameDocs.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
    return allGameDocs.filter((g) => g.hidden !== true && g.hidden !== "true" && g.hidden !== 1);
}

export function useGamesQuery() {
    const currentUser = useAuthStore((s) => s.user);
    const authLoading = useAuthStore((s) => s.loading);
    const queryClient = useQueryClient();

    const key = useMemo(
        () => ["games", currentUser?.uid || "anon", currentUser?.role || "none"],
        [currentUser?.uid, currentUser?.role]
    );

    const queryResult = useQuery({
        queryKey: key,
        queryFn: () => fetchGamesForUser(currentUser),
        enabled: !authLoading && !!currentUser
    });

    useEffect(() => {
        if (authLoading || !currentUser) return;

        let unsubGames = null;
        let unsubPerm = null;

        if (currentUser.role === "super admin") {
            const qGames = query(collection(db, "games"), orderBy("order", "asc"));
            unsubGames = onSnapshot(qGames, (snap) => {
                const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                const visible = raw.filter((g) => g.hidden !== true && g.hidden !== "true" && g.hidden !== 1);
                queryClient.setQueryData(key, visible);
            });
        } else {
            const qPerm = query(
                collection(db, "permissions"),
                where("userId", "==", currentUser.uid),
                where("view", "==", true)
            );

            unsubPerm = onSnapshot(qPerm, async (permSnap) => {
                const gameIds = Array.from(new Set(permSnap.docs.map((d) => d.data()?.gameId).filter(Boolean)));

                if (gameIds.length === 0) {
                    queryClient.setQueryData(key, []);
                    return;
                }

                const ID_LIMIT = 10;
                const chunks = chunk(gameIds, ID_LIMIT);

                const allGameDocs = [];
                await Promise.all(
                    chunks.map(async (c) => {
                        const qG = query(collection(db, "games"), where("id", "in", c));
                        const s = await getDocs(qG);
                        s.forEach((d) => allGameDocs.push({ id: d.id, ...d.data() }));
                    })
                );

                allGameDocs.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
                const visible = allGameDocs.filter((g) => g.hidden !== true && g.hidden !== "true" && g.hidden !== 1);
                queryClient.setQueryData(key, visible);
            });
        }

        return () => {
            if (unsubGames) unsubGames();
            if (unsubPerm) unsubPerm();
        };
    }, [authLoading, currentUser, key, queryClient]);

    return queryResult;
}
