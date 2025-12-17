const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.verifyRecaptcha = onRequest(
    { cors: true, region: "us-central1" },
    async (req, res) => {
        if (req.method !== "POST") {
            return res.status(405).json({ success: false, message: "Method Not Allowed" });
        }

        const token = req.body && req.body.token;
        if (!token) {
            return res.status(400).json({ success: false, message: "Missing token" });
        }

        const secret =
            process.env.RECAPTCHA_SECRET ||
            require("firebase-functions").config()?.recaptcha?.secret;

        if (!secret) {
            return res.status(500).json({ success: false, message: "Missing reCAPTCHA secret" });
        }

        try {
            const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ secret, response: token }).toString()
            });

            const data = await resp.json();

            if (data.success) return res.status(200).json({ success: true });

            return res.status(400).json({
                success: false,
                message: "Invalid reCAPTCHA",
                errors: data["error-codes"] || []
            });
        } catch {
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
);

exports.downloadFile = onRequest(
    { cors: true, region: "us-central1" },
    async (req, res) => {
        try {
            if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

            const filePath = (req.query.path || "").toString();
            const filename = (req.query.name || "download").toString();

            if (!filePath) return res.status(400).send("Missing path");

            const bucket = admin.storage().bucket("xpg-system.firebasestorage.app");
            const file = bucket.file(filePath);

            const [exists] = await file.exists();
            if (!exists) return res.status(404).send(`File not found: ${filePath}`);

            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.setHeader("Cache-Control", "private, max-age=0, no-store, no-cache");

            file.createReadStream()
                .on("error", (err) => res.status(500).send(err?.message || "Read stream error"))
                .pipe(res);
        } catch (e) {
            res.status(500).send(e?.message || "Server error");
        }
    }
);
