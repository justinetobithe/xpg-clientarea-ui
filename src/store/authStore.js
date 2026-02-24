import { create } from "zustand";
import {
    signInWithEmailAndPassword,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword as fbUpdatePassword,
} from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    setDoc,
    serverTimestamp,
    where,
    deleteDoc,
} from "firebase/firestore";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth, db } from "../firebase";

const functions = getFunctions(undefined, "us-central1");

const normalizeAccess = (v) => v === true || v === "true" || v === 1;
const normalizeRole = (v) => (v ? String(v) : "user");
const normalizeStatus = (v) => (v ? String(v) : "pending");

async function findProfileDoc(uid, email) {
    const byUidField = query(collection(db, "users"), where("uid", "==", uid), limit(1));
    const s1 = await getDocs(byUidField);
    if (!s1.empty) return s1.docs[0];

    const byIdField = query(collection(db, "users"), where("id", "==", uid), limit(1));
    const s2 = await getDocs(byIdField);
    if (!s2.empty) return s2.docs[0];

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (cleanEmail) {
        const byEmail = query(collection(db, "users"), where("email", "==", cleanEmail), limit(1));
        const s3 = await getDocs(byEmail);
        if (!s3.empty) return s3.docs[0];
    }

    return null;
}

export const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    error: null,

    setLoading: (loading) => set({ loading: !!loading }),
    setError: (error) => set({ error: error ? String(error) : null }),

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

        const uid = firebaseUser.uid;
        const email = (firebaseUser.email || "").toLowerCase();

        const baseUser = {
            uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
        };

        const refByUid = doc(db, "users", uid);
        const snapByUid = await getDoc(refByUid);

        let profileDocId = uid;
        let profileData = null;

        if (snapByUid.exists()) {
            profileData = snapByUid.data() || {};
            profileDocId = uid;
        } else {
            const found = await findProfileDoc(uid, email);
            if (found) {
                profileData = found.data() || {};
                profileDocId = found.id;
            }
        }

        if (!profileData) {
            const newProfile = {
                uid,
                id: uid,
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || "",
                // role: "user",
                // role_key: "user",
                role_id: "",
                access: false,
                status: "pending",
                company: "",
                department: "",
                timezone: "",
                subscribedToNewsletter: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(refByUid, newProfile, { merge: true });

            const access = normalizeAccess(newProfile.access);
            const role = normalizeRole(newProfile.role);
            const status = normalizeStatus(newProfile.status);

            const mergedProfile = { ...newProfile, access, role, status };

            set({
                user: { ...baseUser, ...mergedProfile },
                profile: mergedProfile,
                loading: false,
                error: null,
            });

            return;
        }

        const migrated = profileDocId !== uid;

        const access = normalizeAccess(profileData.access);
        const role = normalizeRole(profileData.role);
        const status = normalizeStatus(profileData.status);

        const normalizedProfile = {
            ...profileData,
            uid: profileData.uid || uid,
            id: uid,
            email: (profileData.email || firebaseUser.email || "").toLowerCase(),
            access,
            role,
            status,
            updatedAt: serverTimestamp(),
        };

        if (migrated) {
            await setDoc(refByUid, normalizedProfile, { merge: true });
            try {
                await deleteDoc(doc(db, "users", profileDocId));
            } catch { }
            profileDocId = uid;
        }

        set({
            user: { ...baseUser, ...normalizedProfile },
            profile: normalizedProfile,
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