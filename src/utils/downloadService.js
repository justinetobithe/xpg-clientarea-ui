import { getAuth } from "firebase/auth";

export async function getIdTokenOrThrow(errorMessage = "Not authenticated") {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken?.();
    if (!token) throw new Error(errorMessage);
    return token;
}

export function buildDownloadUrl(storagePath, filename) {
    const base = import.meta.env.VITE_DOWNLOAD_FILE_URL;
    if (!base) throw new Error("Missing VITE_DOWNLOAD_FILE_URL");

    const u = new URL(base);
    u.searchParams.set("path", storagePath);
    u.searchParams.set("name", filename || "download");
    return u.toString();
}

export async function fetchDownloadBlob(storagePath, filename, notAuthMessage) {
    const token = await getIdTokenOrThrow(notAuthMessage);
    const url = buildDownloadUrl(storagePath, filename);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    return await res.blob();
}
