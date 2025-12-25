import { create } from "zustand";
import {
    signInWithEmailAndPassword,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword as fbUpdatePassword
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth, db } from "../firebase";

const functions = getFunctions(undefined, "us-central1");

export const useAuthStore = create((set, get) => ({
    user: null,
    loading: true,
    error: null,

    setUser: (user) => set({ user, loading: false, error: null }),
    clearUser: () => set({ user: null, loading: false, error: null }),

    hydrateUserProfile: async (firebaseUser) => {
        if (!firebaseUser?.uid) return;

        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        const base = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || ""
        };

        if (!snap.exists()) {
            const newProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || "",
                role: "user",
                company: "",
                department: "",
                timezone: "",
                subscribedToNewsletter: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(ref, newProfile, { merge: true });
            set({ user: { ...base, ...newProfile }, loading: false, error: null });
            return;
        }

        const profile = snap.data() || {};
        const merged = { ...base, ...profile };
        if (!merged.role) merged.role = "user";

        set({ user: merged, loading: false, error: null });
    },

    login: async (email, password) => {
        set({ loading: true, error: null });
        const res = await signInWithEmailAndPassword(auth, String(email || ""), String(password || ""));
        await get().hydrateUserProfile(res.user);
        return res.user;
    },

    logout: async () => {
        set({ error: null });
        await signOut(auth);
        get().clearUser();
    },

    updateUserDetails: async (payload) => {
        const u = auth.currentUser;
        if (!u?.uid) throw new Error("Not authenticated");

        const next = {
            name: String(payload?.name || ""),
            company: String(payload?.company || ""),
            department: String(payload?.department || ""),
            timezone: String(payload?.timezone || ""),
            subscribedToNewsletter: !!payload?.subscribedToNewsletter,
            updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, "users", u.uid), next, { merge: true });

        const cur = get().user || {};
        set({ user: { ...cur, ...next }, error: null });
    },

    changePassword: async (currentPassword, newPassword) => {
        const u = auth.currentUser;
        if (!u?.email) throw new Error("Not authenticated");

        const cred = EmailAuthProvider.credential(u.email, String(currentPassword || ""));
        await reauthenticateWithCredential(u, cred);
        await fbUpdatePassword(u, String(newPassword || ""));
    },

    deleteAccount: async (currentPassword, opts = {}) => {
        const u = auth.currentUser;
        if (!u?.email) throw new Error("Not authenticated");

        const cred = EmailAuthProvider.credential(u.email, String(currentPassword || ""));
        await reauthenticateWithCredential(u, cred);

        const fn = httpsCallable(functions, "deleteMyAccount");
        await fn({ deleteStorage: !!opts.deleteStorage });

        await signOut(auth);
        get().clearUser();
    }
}));
