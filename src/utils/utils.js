export function isRecent(ts) {
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return Date.now() - d.getTime() < 14 * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

export function formatLongDate(ts) {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function toDate(ts) {
    return ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
}

export function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
