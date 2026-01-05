import { useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuthStore } from "../store/authStore";

export function useAuthListener() {
    const setLoading = useAuthStore((s) => s.setLoading);
    const setAuthUser = useAuthStore((s) => s.setAuthUser);
    const clearUser = useAuthStore((s) => s.clearUser);
    const hydrateUserProfile = useAuthStore((s) => s.hydrateUserProfile);

    useEffect(() => {
        setLoading(true);

        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                clearUser();
                return;
            }

            setLoading(true);
            setAuthUser(u);

            try {
                await hydrateUserProfile(u);
            } catch {
                await signOut(auth).catch(() => { });
                clearUser();
                return;
            }

            const st = useAuthStore.getState();
            const hasAccess = st.profile?.access === true;

            if (hasAccess) {
                import("../store/gamesStore").then(({ useGamesStore }) => {
                    useGamesStore.getState().startGamesListener();
                });
            }
        });

        return () => unsub();
    }, [clearUser, hydrateUserProfile, setAuthUser, setLoading]);
}
