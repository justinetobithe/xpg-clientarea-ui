export const PAGE_SIZE = 10;
export const COLS = "48px 140px minmax(0, 2.4fr) 80px 240px";

export const getExt = (name, fallback = "") => {
    if (!name) return (fallback || "").toUpperCase();
    const n = name.toString();
    if (n.includes(".")) return n.split(".").pop().toUpperCase();
    return (fallback || "").toUpperCase();
};

const IMAGE_EXTS = new Set(["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"]);
export const isImage = (ext) => IMAGE_EXTS.has((ext || "").toUpperCase());
export const isPDF = (ext) => (ext || "").toUpperCase() === "PDF";

export const buildForcedDownloadURL = (rawUrl, filename = "download") => {
    try {
        const u = new URL(rawUrl);
        u.searchParams.set("alt", "media");
        const dispo = `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;
        u.searchParams.set("response-content-disposition", dispo);
        return u.toString();
    } catch {
        return rawUrl;
    }
};

export const collectSectionNames = (sections = []) =>
    sections.map((s) => s.title).filter(Boolean);

export const collectExtensions = (sections = []) => {
    const s = new Set();
    sections.forEach((sec) =>
        (sec.files || []).forEach((f) => {
            const n = (f?.name || f?.filename || "").toString();
            const ext = n.includes(".")
                ? n.split(".").pop().toUpperCase()
                : (f?.ext || f?.type || "").toString().toUpperCase();
            if (ext) s.add(ext);
        })
    );
    return Array.from(s).sort();
};

export const flattenSectionsToFiles = (sections = []) => {
    const out = [];
    sections.forEach((sec) => {
        (sec.files || []).forEach((f) => {
            const n = (f?.name || f?.filename || "").toString();
            const ext = n.includes(".")
                ? n.split(".").pop().toUpperCase()
                : (f?.ext || f?.type || "").toString().toUpperCase();

            out.push({
                ...f,
                _sectionTitle: sec.title,
                _sectionId: sec.sectionId,
                _ext: ext,
                _size: f?.sizeText || f?.size || "",
                _date: f?.addedAt?.toDate?.() || f?.createdAt?.toDate?.() || null,
                _name: n || "Untitled",
                _thumb: f?.thumb || f?.thumbnail || null,
                _url: f?.previewURL || f?.url || f?.downloadURL || f?.image || ""
            });
        });
    });
    return out;
};

export const parseSizeToBytes = (v) => {
    if (!v || typeof v !== "string") return 0;
    const match = v.trim().match(/^([\d.,]+)\s*([kKmMgG]?B)$/);
    if (!match) return 0;
    const value = parseFloat(match[1].replace(",", ""));
    const unit = match[2].toUpperCase();
    if (Number.isNaN(value)) return 0;
    if (unit === "KB") return value * 1024;
    if (unit === "MB") return value * 1024 * 1024;
    if (unit === "GB") return value * 1024 * 1024 * 1024;
    return value;
};

export const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i += 1;
    }
    return `${v.toFixed(2)} ${units[i]}`;
};

export const storagePathFromFirebaseUrl = (fileURL) => {
    try {
        const u = new URL(fileURL);
        const m = u.pathname.match(/\/o\/(.+)$/);
        if (!m) return null;
        return decodeURIComponent(m[1]);
    } catch {
        return null;
    }
};

export const buildDownloadUrl = (storagePath, filename, token) => {
    const base = import.meta.env.VITE_DOWNLOAD_FILE_URL;
    if (!base) return null;

    const u = new URL(base);
    u.searchParams.set("path", storagePath);
    u.searchParams.set("name", filename || "download");
    if (token) u.searchParams.set("token", token);

    return u.toString();
};

export const downloadViaIframe = (url) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => {
        try {
            iframe.remove();
        } catch { }
    }, 60000);
};
