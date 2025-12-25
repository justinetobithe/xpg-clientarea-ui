import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, onSnapshot, query, orderBy, where, getDocs, documentId } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthStore } from "../store/authStore";

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

const isHidden = (g) => g.hidden === true || g.hidden === "true" || g.hidden === 1;
const isTruthyView = (v) => v === true || v === "true" || v === 1;

const normalizeRole = (r) => String(r || "").toLowerCase().replace(/[\s_]/g, "");
const isSuperAdminRole = (r) => normalizeRole(r) === "super admin";

async function fetchGamesForUser(user) {
    if (!user) return [];

    if (isSuperAdminRole(user.role)) {
        const qGames = query(collection(db, "games"), orderBy("order", "asc"));
        const snap = await getDocs(qGames);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => !isHidden(g));
    }

    const qPerm = query(collection(db, "permissions"), where("userId", "==", user.uid));
    const permSnap = await getDocs(qPerm);

    const gameIds = Array.from(
        new Set(
            permSnap.docs
                .map((d) => d.data())
                .filter((p) => isTruthyView(p?.view))
                .map((p) => p?.gameId)
                .filter(Boolean)
        )
    );

    if (gameIds.length === 0) return [];

    const games = [];
    await Promise.all(
        chunk(gameIds, 10).map(async (ids) => {
            const qG = query(collection(db, "games"), where(documentId(), "in", ids));
            const s = await getDocs(qG);
            s.forEach((d) => games.push({ id: d.id, ...d.data() }));
        })
    );

    games.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
    return games.filter((g) => !isHidden(g));
}

export function useGamesQuery() {
    const user = useAuthStore((s) => s.user);
    const authLoading = useAuthStore((s) => s.loading);
    const queryClient = useQueryClient();

    const key = useMemo(
        () => ["games", user?.uid || "anon", normalizeRole(user?.role)],
        [user?.uid, user?.role]
    );

    const queryResult = useQuery({
        queryKey: key,
        queryFn: () => fetchGamesForUser(user),
        enabled: !authLoading && !!user,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    useEffect(() => {
        if (authLoading || !user) return;

        if (isSuperAdminRole(user.role)) {
            const qGames = query(collection(db, "games"), orderBy("order", "asc"));
            const unsub = onSnapshot(qGames, (snap) => {
                const visible = snap.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    .filter((g) => !isHidden(g));
                queryClient.setQueryData(key, visible);
            });
            return () => unsub();
        }

        const qPerm = query(collection(db, "permissions"), where("userId", "==", user.uid));

        const unsubPerm = onSnapshot(qPerm, async (permSnap) => {
            const gameIds = Array.from(
                new Set(
                    permSnap.docs
                        .map((d) => d.data())
                        .filter((p) => isTruthyView(p?.view))
                        .map((p) => p?.gameId)
                        .filter(Boolean)
                )
            );

            if (gameIds.length === 0) {
                queryClient.setQueryData(key, []);
                return;
            }

            const games = [];
            await Promise.all(
                chunk(gameIds, 10).map(async (ids) => {
                    const qG = query(collection(db, "games"), where(documentId(), "in", ids));
                    const s = await getDocs(qG);
                    s.forEach((d) => games.push({ id: d.id, ...d.data() }));
                })
            );

            games.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
            queryClient.setQueryData(key, games.filter((g) => !isHidden(g)));
        });

        return () => unsubPerm();
    }, [authLoading, user, key, queryClient]);

    return queryResult;
}
