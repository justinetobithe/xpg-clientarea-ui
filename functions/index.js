const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

if (!admin.apps.length) admin.initializeApp();

exports.verifyRecaptcha = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ success: false });

    const token = req.body?.token;
    if (!token) return res.status(400).json({ success: false });

    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) return res.status(500).json({ success: false });

    try {
        const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret, response: token }).toString()
        });

        const data = await resp.json();
        if (data.success) return res.json({ success: true });

        return res.status(400).json({ success: false });
    } catch {
        return res.status(500).json({ success: false });
    }
});

exports.downloadFile = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
    try {
        if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

        const filePath = String(req.query.path || "");
        const filename = String(req.query.name || "download");

        if (!filePath) return res.status(400).send("Missing path");

        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (!exists) return res.status(404).send("File not found");

        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
        res.setHeader("Cache-Control", "no-store");

        file.createReadStream().pipe(res);
    } catch (e) {
        res.status(500).send("Server error");
    }
});
