export const safeKey = (item, i) =>
    `${String(item?.id || item?.storagePath || item?.fileURL || item?.fileName || "item")}::${String(i)}`;

export const safeZipName = (name) =>
    String(name || "collection")
        .replace(/[^\w.\-]+/g, "_")
        .slice(0, 50);

export const safeFileName = (baseName, ext) => {
    const safeBase = String(baseName || "file").replace(/[^\w.\-]+/g, "_");
    if (!ext) return safeBase;
    const lower = safeBase.toLowerCase();
    const withDot = `.${ext.toLowerCase()}`;
    return lower.endsWith(withDot) ? safeBase : `${safeBase}${withDot}`;
};

export const dedupeFileName = (seenMap, fileName) => {
    const count = seenMap.get(fileName) || 0;
    if (count === 0) {
        seenMap.set(fileName, 1);
        return fileName;
    }

    const dot = fileName.lastIndexOf(".");
    const namePart = dot > 0 ? fileName.slice(0, dot) : fileName;
    const extPart = dot > 0 ? fileName.slice(dot) : "";
    const next = `${namePart} (${count + 1})${extPart}`;

    seenMap.set(fileName, count + 1);
    return next;
};
