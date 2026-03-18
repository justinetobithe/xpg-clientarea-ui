"use strict";

const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

const REGION = "us-central1";
const RECAPTCHA_SECRET = defineSecret("RECAPTCHA_SECRET");

if (!admin.apps.length) {
    admin.initializeApp();
}

const jsonBody = (req) => {
    if (req.body && typeof req.body === "object") return req.body;
    try {
        return JSON.parse(req.rawBody?.toString("utf8") || "{}");
    } catch {
        return {};
    }
};

const allowCors = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "3600");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return true;
    }
    return false;
};

const getBearer = (req) => {
    const h = String(req.headers.authorization || "");
    if (!h.startsWith("Bearer ")) return null;
    return h.slice("Bearer ".length).trim();
};

const getToken = (req) => {
    const q = String(req.query.token || "").trim();
    return getBearer(req) || (q ? q : null);
};

const requireAuth = async (req) => {
    const token = getToken(req);
    if (!token) throw new Error("missing_token");
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded?.uid) throw new Error("invalid_token");
    return decoded;
};

const safeFilename = (name) => String(name || "download").replace(/["\r\n]/g, "").slice(0, 180);

const isSafePath = (p) => {
    if (!p) return false;
    if (p.includes("..")) return false;
    if (p.startsWith("/")) return false;
    if (p.startsWith("gs://")) return false;
    return true;
};

const deleteQueryInBatches = async (q, batchSize = 450) => {
    const db = admin.firestore();
    let hasMore = true;

    while (hasMore) {
        const snap = await q.limit(batchSize).get();
        if (snap.empty) {
            hasMore = false;
            break;
        }
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        hasMore = snap.size === batchSize;
    }
};

const deleteSubcollectionDocs = async (docRef, subName) => {
    const sub = docRef.collection(subName);
    await deleteQueryInBatches(sub);
};

const deleteCollectionsAndItemsByUser = async (uid) => {
    const db = admin.firestore();
    const colSnap = await db.collection("collections").where("userId", "==", uid).get();

    for (const d of colSnap.docs) {
        await deleteSubcollectionDocs(d.ref, "items");
    }

    await deleteQueryInBatches(db.collection("collections").where("userId", "==", uid));
};

const deleteDownloadsByUser = async (uid) => {
    const db = admin.firestore();
    await deleteQueryInBatches(db.collection("downloads").where("userId", "==", uid));
};

const deletePermissionsByUser = async (uid) => {
    const db = admin.firestore();
    const candidates = ["permissions", "user_permissions", "roles", "user_roles"];

    for (const name of candidates) {
        const col = db.collection(name);
        const probe = await col.where("userId", "==", uid).limit(1).get();
        if (!probe.empty) {
            await deleteQueryInBatches(col.where("userId", "==", uid));
        }
    }

    const userRef = db.doc(`users/${uid}`);
    const subCandidates = ["permissions", "roles"];

    for (const s of subCandidates) {
        const probe = await userRef.collection(s).limit(1).get();
        if (!probe.empty) {
            await deleteQueryInBatches(userRef.collection(s));
        }
    }
};

const deleteUserProfileDoc = async (uid) => {
    const db = admin.firestore();
    const ref = db.doc(`users/${uid}`);
    const snap = await ref.get();
    if (snap.exists) await ref.delete();
};

const deleteUserStorage = async (uid) => {
    const bucketName = process.env.DELETE_STORAGE_BUCKET || "";
    const bucket = bucketName ? admin.storage().bucket(bucketName) : admin.storage().bucket();
    const prefixes = [`${uid}/`, `users/${uid}/`, `downloads/${uid}/`, `collections/${uid}/`];

    for (const prefix of prefixes) {
        try {
            await bucket.deleteFiles({ prefix });
        } catch (e) {
            console.warn("deleteFiles failed:", prefix, e?.message || String(e));
        }
    }
};

const fetchWithTimeout = async (url, options, timeoutMs) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(t);
    }
};

exports.verifyRecaptcha = onRequest({ region: REGION, secrets: [RECAPTCHA_SECRET] }, async (req, res) => {
    if (allowCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ success: false });

    const body = jsonBody(req);
    const token = String(body.token || "");
    const secret = RECAPTCHA_SECRET.value();

    if (!token || token.length < 20) return res.status(400).json({ success: false });
    if (!secret) return res.status(500).json({ success: false });

    try {
        const resp = await fetchWithTimeout(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ secret, response: token }).toString()
            },
            5000
        );

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok || !data?.success) {
            return res.status(400).json({ success: false });
        }

        return res.json({ success: true });
    } catch {
        return res.status(500).json({ success: false });
    }
});

exports.downloadFile = onRequest({ region: REGION }, async (req, res) => {
    if (allowCors(req, res)) return;

    try {
        if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

        const decoded = await requireAuth(req);
        const filePath = String(req.query.path || "");
        const filename = safeFilename(req.query.name || "download");

        if (!filePath) return res.status(400).send("Missing path");
        if (!isSafePath(filePath)) return res.status(400).send("Invalid path");

        const enforcePrefix = process.env.DOWNLOAD_REQUIRE_UID_PREFIX === "true";
        if (enforcePrefix) {
            const ok = filePath.startsWith(`${decoded.uid}/`) || filePath.startsWith(`users/${decoded.uid}/`);
            if (!ok) return res.status(403).send("Forbidden");
        }

        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);
        const [exists] = await file.exists();

        if (!exists) return res.status(404).send("File not found");

        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Cache-Control", "no-store");

        const stream = file.createReadStream();
        stream.on("error", () => {
            if (!res.headersSent) res.status(500).send("Stream error");
            else res.end();
        });
        stream.pipe(res);
        return null;
    } catch {
        return res.status(401).send("Unauthorized");
    }
});

exports.deleteMyAccount = onCall({ region: REGION }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Not authenticated");

    const deleteStorage = !!request.data?.deleteStorage;

    await deleteCollectionsAndItemsByUser(uid);
    await deleteDownloadsByUser(uid);
    await deletePermissionsByUser(uid);
    await deleteUserProfileDoc(uid);

    if (deleteStorage) {
        await deleteUserStorage(uid);
    }

    await admin.auth().deleteUser(uid);
    return { ok: true };
});

exports.resetPasswordWithToken = onRequest({ region: REGION }, async (req, res) => {
    if (allowCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const body = jsonBody(req);
    const token = String(body.token || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!token || token.length < 20) {
        return res.status(400).json({ error: "Invalid token" });
    }

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    try {
        const db = admin.firestore();
        const ref = db.collection("password_reset_tokens").doc(token);

        const result = await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);

            if (!snap.exists) {
                throw new Error("TOKEN_NOT_FOUND");
            }

            const data = snap.data() || {};
            const expiresAtMs = data.expiresAt?.toDate ? data.expiresAt.toDate().getTime() : 0;
            const email = String(data.email || "").trim().toLowerCase();

            if (!email) {
                throw new Error("INVALID_TOKEN_DATA");
            }

            if (data.status === "used" || data.usedAt) {
                throw new Error("TOKEN_ALREADY_USED");
            }

            if (!expiresAtMs || Date.now() > expiresAtMs) {
                tx.update(ref, {
                    status: "expired",
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                throw new Error("TOKEN_EXPIRED");
            }

            tx.update(ref, {
                status: "processing",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { email };
        });

        const user = await admin.auth().getUserByEmail(result.email);
        await admin.auth().updateUser(user.uid, { password: newPassword });

        await ref.update({
            status: "used",
            usedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json({ ok: true });
    } catch (e) {
        const code = e?.code || e?.message || "";

        if (code === "TOKEN_NOT_FOUND") {
            return res.status(404).json({ error: "Token not found" });
        }

        if (code === "INVALID_TOKEN_DATA") {
            return res.status(400).json({ error: "Invalid token data" });
        }

        if (code === "TOKEN_ALREADY_USED") {
            return res.status(400).json({ error: "Token already used" });
        }

        if (code === "TOKEN_EXPIRED") {
            return res.status(400).json({ error: "Token expired" });
        }

        if (code === "auth/user-not-found") {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(500).json({ error: "Server error" });
    }
});