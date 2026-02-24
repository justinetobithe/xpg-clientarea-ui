import { create } from "zustand";
import {
    collection,
    doc,
    documentId,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuthStore } from "./authStore";

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

const truthy = (v) => v === true || v === "true" || v === 1;
const isHidden = (g) => g?.hidden === true || g?.hidden === "true" || g?.hidden === 1;

const normalizeKey = (v) =>
    String(v ?? "")
        .toLowerCase()
        .trim()
        .replace(/[\s_-]/g, "");

const isPrivilegedKey = (v) => {
    const k = normalizeKey(v);
    return (
        k === "admin" ||
        k === "superadmin" ||
        k === "superadministrator" ||
        k === "administrator" ||
        k === "root" ||
        k === "owner"
    );
};

const resolveRoleId = (user) =>
    String(
        user?.role_id ??
        user?.roleId ??
        user?.role?.id ??
        user?.role?.role_id ??
        ""
    ).trim();

const resolveRoleKeyFromUser = (user) =>
    String(
        user?.role_key ??
        user?.roleKey ??
        user?.role_name ??
        user?.roleName ??
        user?.role ??
        ""
    ).trim();

async function getRoleDocByRoleId(roleId) {
    const rid = String(roleId ?? "").trim();
    if (!rid) return null;
    try {
        const snap = await getDoc(doc(db, "roles", rid));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() };
    } catch {
        return null;
    }
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

export const useGamesStore = create((set, get) => ({
    games: [],
    loading: true,
    error: null,
    unsubs: [],

    startGamesListener: () => {
        const prev = get().unsubs;
        if (prev.length) prev.forEach((u) => u && u());
        set({ unsubs: [], games: [], loading: true, error: null });

        const { user, loading: authLoading } = useAuthStore.getState();
        if (authLoading || !user) {
            if (!authLoading) set({ games: [], loading: false, error: null });
            return;
        }

        const rid = resolveRoleId(user);
        if (!rid) {
            set({ games: [], loading: false, error: null });
            return;
        }

        let unsubRole = null;
        let unsubAllGames = null;
        let unsubPerm = null;

        const clearSubs = () => {
            if (unsubRole) unsubRole();
            unsubRole = null;
            if (unsubAllGames) unsubAllGames();
            unsubAllGames = null;
            if (unsubPerm) unsubPerm();
            unsubPerm = null;
        };

        const subscribeAllGames = () => {
            if (unsubPerm) unsubPerm();
            unsubPerm = null;
            if (unsubAllGames) unsubAllGames();

            unsubAllGames = onSnapshot(
                query(collection(db, "games"), orderBy("order", "asc")),
                (snap) => {
                    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => !isHidden(g));
                    set({ games: list, loading: false, error: null });
                },
                (err) => set({ games: [], loading: false, error: err?.message || "Failed to load games" })
            );
        };

        const subscribeByPermissions = (roleId) => {
            if (unsubAllGames) unsubAllGames();
            unsubAllGames = null;
            if (unsubPerm) unsubPerm();

            unsubPerm = onSnapshot(
                query(collection(db, "permissionss"), where("role_id", "==", roleId), where("view", "==", true), limit(5000)),
                async (snap) => {
                    const gameIds = extractGameIdsFromPermissionsSnap(snap);
                    if (!gameIds.length) {
                        set({ games: [], loading: false, error: null });
                        return;
                    }
                    try {
                        const games = await fetchGamesByIds(gameIds);
                        set({ games, loading: false, error: null });
                    } catch (e) {
                        set({ games: [], loading: false, error: e?.message || "Failed to load games" });
                    }
                },
                (err) => set({ games: [], loading: false, error: err?.message || "Failed to load permissions" })
            );
        };

        const quickKey = resolveRoleKeyFromUser(user);
        if (isPrivilegedKey(quickKey)) {
            subscribeAllGames();
            set({ unsubs: [unsubAllGames].filter(Boolean) });
            return;
        }

        unsubRole = onSnapshot(
            doc(db, "roles", rid),
            async (snap) => {
                const roleKey = snap.exists() ? String(snap.data()?.key ?? "").trim() : "";
                const roleName = snap.exists() ? String(snap.data()?.name ?? "").trim() : "";
                const privileged = isPrivilegedKey(quickKey) || isPrivilegedKey(roleKey) || isPrivilegedKey(roleName);

                if (privileged) subscribeAllGames();
                else subscribeByPermissions(rid);

                set({ unsubs: [unsubRole, unsubAllGames, unsubPerm].filter(Boolean) });
            },
            (err) => {
                set({ games: [], loading: false, error: err?.message || "Failed to load role", unsubs: [] });
                clearSubs();
            }
        );

        set({ unsubs: [unsubRole].filter(Boolean) });
    },

    stopGamesListener: () => {
        const prev = get().unsubs;
        if (prev.length) prev.forEach((u) => u && u());
        set({ unsubs: [], games: [], loading: false, error: null });
    },

    start: () => get().startGamesListener(),
    stop: () => get().stopGamesListener(),
}));