import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getExt } from "../utils/fileUtils";
import { fetchDownloadBlob } from "../utils/downloadService";

export function useZipDownload({ t }) {
    const downloadSelectedAsZip = async ({ selectedFiles, gameName, onDone, onError, setZipping }) => {
        if (!selectedFiles?.length) return;

        setZipping?.(true);
        try {
            const zip = new JSZip();
            const folderName = (gameName || t("gameDetails.zip.assetsFallback"))
                .replace(/[^\w.\-]+/g, "_")
                .slice(0, 50);

            const folder = zip.folder(folderName) || zip;
            const seen = new Map();

            for (let idx = 0; idx < selectedFiles.length; idx += 1) {
                const { f } = selectedFiles[idx];
                const url = f?._url || f?.url || f?.fileURL || null;
                const baseName = f?._name || f?.name || f?.fileName || `file-${idx + 1}`;
                const ext = getExt(baseName, f?._ext).toLowerCase();

                const safeBase = String(baseName).replace(/[^\w.\-]+/g, "_");
                let finalName = ext && !safeBase.toLowerCase().endsWith(`.${ext}`) ? `${safeBase}.${ext}` : safeBase;

                const cnt = seen.get(finalName) || 0;
                if (cnt > 0) {
                    const dot = finalName.lastIndexOf(".");
                    const namePart = dot > 0 ? finalName.slice(0, dot) : finalName;
                    const extPart = dot > 0 ? finalName.slice(dot) : "";
                    finalName = `${namePart} (${cnt + 1})${extPart}`;
                }
                seen.set(finalName, cnt + 1);

                const storagePath = f?.storagePath || f?._storagePath || null;
                if (!storagePath) continue;

                const blob = await fetchDownloadBlob(storagePath, finalName);
                folder.file(finalName, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${folderName}.zip`);

            onDone?.();
        } catch (e) {
            onError?.(e);
        } finally {
            setZipping?.(false);
        }
    };

    return { downloadSelectedAsZip };
}
