import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useAuthStore } from "../store/authStore";

export function useAuthListener() {
    const setUser = useAuthStore((s) => s.setUser);
    const clearUser = useAuthStore((s) => s.clearUser);
    const hydrateUserProfile = useAuthStore((s) => s.hydrateUserProfile);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                clearUser();
                return;
            }

            setUser({
                uid: u.uid,
                email: u.email || "",
                displayName: u.displayName || "",
                photoURL: u.photoURL || ""
            });

            try {
                await hydrateUserProfile(u);
            } catch {
                await auth.signOut().catch(() => { });
                clearUser();
                return;
            }

            import("../store/gamesStore").then(({ useGamesStore }) => {
                useGamesStore.getState().startGamesListener();
            });
        });

        return () => unsub();
    }, [setUser, clearUser, hydrateUserProfile]);
}
