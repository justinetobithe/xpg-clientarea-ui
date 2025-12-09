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
