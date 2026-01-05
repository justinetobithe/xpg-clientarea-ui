import { create } from "zustand";
import {
    signInWithEmailAndPassword,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword as fbUpdatePassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth, db } from "../firebase";

const functions = getFunctions(undefined, "us-central1");

const normalizeAccess = (v) => v === true || v === "true";
const normalizeRole = (v) => (v ? String(v) : "user");
const normalizeStatus = (v) => (v ? String(v) : "pending");

export const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    error: null,

    setLoading: (loading) => set({ loading: !!loading }),

    setAuthUser: (firebaseUser) => {
        if (!firebaseUser?.uid) {
            set({ user: null });
            return;
        }

        set({
            user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "",
                photoURL: firebaseUser.photoURL || "",
            },
        });
    },

    clearUser: () => set({ user: null, profile: null, loading: false, error: null }),

    hydrateUserProfile: async (firebaseUser) => {
        if (!firebaseUser?.uid) {
            set({ user: null, profile: null, loading: false, error: null });
            return;
        }

        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        const baseUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
        };

        if (!snap.exists()) {
            const newProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || "",
                role: "user",
                access: false,
                status: "pending",
                company: "",
                department: "",
                timezone: "",
                subscribedToNewsletter: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(ref, newProfile, { merge: true });

            set({
                user: { ...baseUser, ...newProfile, access: false, role: "user", status: "pending" },
                profile: { ...newProfile, access: false, role: "user", status: "pending" },
                loading: false,
                error: null,
            });

            return;
        }

        const profile = snap.data() || {};
        const access = normalizeAccess(profile.access);
        const role = normalizeRole(profile.role);
        const status = normalizeStatus(profile.status);

        const mergedProfile = { ...profile, access, role, status };

        set({
            user: { ...baseUser, ...mergedProfile },
            profile: mergedProfile,
            loading: false,
            error: null,
        });
    },

    login: async (email, password) => {
        set({ loading: true, error: null });

        const cleanEmail = String(email || "").trim().toLowerCase();
        const res = await signInWithEmailAndPassword(auth, cleanEmail, String(password || ""));

        set({ loading: true });
        await get().hydrateUserProfile(res.user);

        return res.user;
    },

    logout: async () => {
        set({ error: null, loading: true });
        await signOut(auth);
        set({ user: null, profile: null, loading: false, error: null });
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
            updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "users", u.uid), next, { merge: true });

        const curUser = get().user || {};
        const curProfile = get().profile || {};
        set({
            user: { ...curUser, ...next },
            profile: { ...curProfile, ...next },
            error: null,
        });
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
        set({ user: null, profile: null, loading: false, error: null });
    },
}));
