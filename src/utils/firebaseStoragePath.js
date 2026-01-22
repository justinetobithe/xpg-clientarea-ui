export function storagePathFromFirebaseUrl(fileURL) {
    try {
        const u = new URL(fileURL);
        const m = u.pathname.match(/\/o\/(.+)$/);
        if (!m) return null;
        return decodeURIComponent(m[1]);
    } catch {
        return null;
    }
}
