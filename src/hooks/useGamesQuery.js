import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    collection,
    documentId,
    getDocs,
    limit,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuthStore } from "../store/authStore";

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
};

const truthy = (v) =>
    v === true ||
    v === "true" ||
    v === 1 ||
    v === "1";

const isHidden = (g) =>
    g?.hidden === true ||
    g?.hidden === "true" ||
    g?.hidden === 1 ||
    g?.hidden === "1";

function normalizeCategoryName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function slugifyCategory(value) {
    return normalizeCategoryName(value)
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function extractGameIdsFromPermissionsSnap(snap) {
    return Array.from(
        new Set(
            snap.docs
                .map((d) => d.data() || {})
                .filter((p) => truthy(p.view))
                .map((p) => String(p.gameId || p.game_id || p.id || "").trim())
                .filter(Boolean)
        )
    );
}

async function fetchGamesByIds(gameIds) {
    const colGames = collection(db, "games");
    const ids = Array.from(
        new Set(gameIds.map((x) => String(x || "").trim()).filter(Boolean))
    );

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

async function fetchPermissionsByRole(roleId) {
    const permissionsCol = collection(db, "permissionss");
    const ridString = String(roleId ?? "").trim();
    const ridNumber = Number(ridString);

    const snaps = [];

    try {
        const snap = await getDocs(
            query(permissionsCol, where("role_id", "==", ridString), limit(5000))
        );
        snaps.push(snap);
    } catch { }

    if (!Number.isNaN(ridNumber)) {
        try {
            const snap = await getDocs(
                query(permissionsCol, where("role_id", "==", ridNumber), limit(5000))
            );
            snaps.push(snap);
        } catch { }
    }

    try {
        const snap = await getDocs(
            query(permissionsCol, where("roleId", "==", ridString), limit(5000))
        );
        snaps.push(snap);
    } catch { }

    if (!Number.isNaN(ridNumber)) {
        try {
            const snap = await getDocs(
                query(permissionsCol, where("roleId", "==", ridNumber), limit(5000))
            );
            snaps.push(snap);
        } catch { }
    }

    const docsMap = new Map();

    snaps.forEach((snap) => {
        snap.forEach((docSnap) => {
            docsMap.set(docSnap.id, docSnap);
        });
    });

    return {
        docs: Array.from(docsMap.values()),
        forEach(cb) {
            this.docs.forEach(cb);
        },
    };
}

async function fetchGamesForRole(roleId) {
    const rid = String(roleId ?? "").trim();
    if (!rid) return [];

    const permSnap = await fetchPermissionsByRole(rid);
    const gameIds = extractGameIdsFromPermissionsSnap(permSnap);

    if (!gameIds.length) return [];

    return fetchGamesByIds(gameIds);
}

async function fetchGameCategories() {
    const snap = await getDocs(collection(db, "gameCategories"));

    const categories = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
            id: d.id,
            ...data,
            name: normalizeCategoryName(data.name),
            slug: String(data.slug || slugifyCategory(data.name || "")).trim().toLowerCase(),
            bannerURL: data.bannerURL || "",
            showInClientArea: data.showInClientArea !== false,
        };
    });

    categories.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    return categories;
}

export function useGamesQuery() {
    const authLoading = useAuthStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);
    const profile = useAuthStore((s) => s.profile);

    const uid = user?.uid || "";
    const roleId = useMemo(() => String(profile?.role_id ?? profile?.roleId ?? "").trim(), [profile?.role_id, profile?.roleId]);

    const queryKey = useMemo(
        () => ["games-with-categories", uid || "anon", roleId || "no-role"],
        [uid, roleId]
    );

    const queryResult = useQuery({
        queryKey,
        enabled: !authLoading && !!uid && !!profile && !!roleId,
        queryFn: async () => {
            const [games, categories] = await Promise.all([
                fetchGamesForRole(roleId),
                fetchGameCategories(),
            ]);

            return { games, categories };
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
    });

    return {
        ...queryResult,
        data: queryResult.data || { games: [], categories: [] },
    };
}