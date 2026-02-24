import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    collection,
    documentId,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuthStore } from "../store/authStore";

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

const truthy = (v) => v === true || v === "true" || v === 1;
const isHidden = (g) => g?.hidden === true || g?.hidden === "true" || g?.hidden === 1;

function extractGameIdsFromPermissionsSnap(snap) {
    return Array.from(
        new Set(
            snap.docs
                .map((d) => d.data() || {})
                .filter((p) => truthy(p.view))
                .map((p) => String(p.gameId || "").trim())
                .filter(Boolean)
        )
    );
}

async function fetchGamesByIds(gameIds) {
    const colGames = collection(db, "games");
    const ids = Array.from(new Set(gameIds.map((x) => String(x || "").trim()).filter(Boolean)));
    if (!ids.length) return [];

    const out = [];
    const seen = new Set();

    const push = (d) => {
        const id = String(d?.id || "").trim();
        if (!id || seen.has(id)) return;
        seen.add(id);
        out.push(d);
    };

    await Promise.all(
        chunk(ids, 10).map(async (part) => {
            try {
                const s1 = await getDocs(query(colGames, where(documentId(), "in", part)));
                s1.forEach((d) => push({ id: d.id, ...d.data() }));
            } catch { }

            const remain1 = part.filter((x) => !seen.has(String(x)));
            if (!remain1.length) return;

            try {
                const s2 = await getDocs(query(colGames, where("id", "in", remain1)));
                s2.forEach((d) => push({ id: d.id, ...d.data() }));
            } catch { }

            const remain2 = remain1.filter((x) => !seen.has(String(x)));
            if (!remain2.length) return;

            try {
                const s3 = await getDocs(query(colGames, where("gameId", "in", remain2)));
                s3.forEach((d) => push({ id: d.id, ...d.data() }));
            } catch { }
        })
    );

    out.sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
    return out.filter((g) => !isHidden(g));
}

async function fetchGamesForRole(roleId) {
    const rid = String(roleId ?? "").trim();
    if (!rid) return [];

    const permSnap = await getDocs(
        query(collection(db, "permissionss"), where("role_id", "==", rid), limit(5000))
    );

    const gameIds = extractGameIdsFromPermissionsSnap(permSnap);
    if (!gameIds.length) return [];

    return fetchGamesByIds(gameIds);
}

export function useGamesQuery() {
    const authLoading = useAuthStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);
    const profile = useAuthStore((s) => s.profile);

    const [rtError, setRtError] = useState(null);

    const uid = user?.uid || "";
    const roleId = useMemo(() => String(profile?.role_id ?? "").trim(), [profile?.role_id]);
    const key = useMemo(() => ["games", uid || "anon", roleId || "no-role"], [uid, roleId]);

    const queryResult = useQuery({
        queryKey: key,
        enabled: !authLoading && !!uid && !!profile && !!roleId,
        queryFn: async () => {
            setRtError(null);
            return fetchGamesForRole(roleId);
        },
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    return { ...queryResult, error: rtError ?? queryResult.error };
}