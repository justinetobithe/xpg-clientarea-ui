import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, onSnapshot, orderBy, query, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const normalize = (s) => String(s || "").toLowerCase();

async function fetchAnnouncements() {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function useAnnouncementsQuery() {
    const queryClient = useQueryClient();

    const key = useMemo(() => ["announcements"], []);

    const queryResult = useQuery({
        queryKey: key,
        queryFn: fetchAnnouncements,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    useEffect(() => {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            queryClient.setQueryData(key, list);
        });
        return () => unsub();
    }, [key, queryClient]);

    return queryResult;
}

export const announcementMatches = (a, term) => {
    const t = normalize(term);
    if (!t) return true;
    const title = normalize(a?.title || a?.name);
    const body = normalize(a?.body || a?.content || a?.description);
    return title.includes(t) || body.includes(t);
};
