import { Fragment, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, ChevronLeft, ChevronRight, Download, FileText, FileImage, File } from "lucide-react";
import { getExt, isImage, isPDF, parseSizeToBytes, formatBytes } from "../../utils/fileUtils";

export default function PreviewModal({
    open,
    onClose,
    files = [],
    index = 0,
    setIndex,
    onDownload
}) {
    const current = files[index] || null;

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "ArrowLeft") setIndex?.((i) => Math.max(0, i - 1));
            if (e.key === "ArrowRight") setIndex?.((i) => Math.min(files.length - 1, i + 1));
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, files.length, setIndex, onClose]);

    const ext = useMemo(() => getExt(current?._name, current?._ext), [current]);
    const icon = isPDF(ext) ? FileText : isImage(ext) ? FileImage : File;

    const prettySize = useMemo(() => {
        const raw = current?._size || "";
        const bytes = parseSizeToBytes(raw);
        if (!bytes) return raw ? String(raw) : "";
        return `${raw} (${formatBytes(bytes)})`;
    }, [current]);

    return (
        <Transition show={open} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80" />
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="transition duration-200 ease-out"
                    enterFrom="opacity-0 translate-y-2 scale-95"
                    enterTo="opacity-100 translate-y-0 scale-100"
                    leave="transition duration-150 ease-in"
                    leaveFrom="opacity-100 translate-y-0 scale-100"
                    leaveTo="opacity-0 translate-y-2 scale-95"
                >
                    <Dialog.Panel className="fixed inset-0 m-auto w-[94%] max-w-5xl h-[86vh] bg-[#111318] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-bold min-w-0">
                                {(() => {
                                    const Icon = icon;
                                    return <Icon className="text-primary flex-shrink-0" size={18} />;
                                })()}

                                <div className="truncate min-w-0">
                                    {current?._name || ""}
                                    {ext ? ` | ${ext}` : ""}
                                    {prettySize ? ` | ${prettySize}` : ""}
                                    {current?._date ? ` | Added ${new Date(current._date).toLocaleString()}` : ""}
                                    {files.length ? ` | ${index + 1} of ${files.length}` : ""}
                                </div>
                            </div>

                            <button onClick={onClose} className="text-white/80 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="relative flex-1 bg-black">
                            <button
                                onClick={() => setIndex?.((i) => Math.max(0, i - 1))}
                                disabled={index <= 0}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white disabled:opacity-30"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <button
                                onClick={() => setIndex?.((i) => Math.min(files.length - 1, i + 1))}
                                disabled={index >= files.length - 1}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white disabled:opacity-30"
                            >
                                <ChevronRight size={20} />
                            </button>

                            <div className="w-full h-full flex items-center justify-center">
                                {isImage(ext) && current?._url ? (
                                    <img src={current._url} alt={current?._name || ""} className="max-h-[70vh] w-auto object-contain" />
                                ) : isPDF(ext) && current?._url ? (
                                    <iframe
                                        title={current?._name || "PDF"}
                                        src={`${current._url}#toolbar=1&navpanes=0`}
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <div className="text-white/80 flex flex-col items-center gap-2">
                                        <File size={48} />
                                        <div>No inline preview for this file type.</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 border-t border-white/10 flex items-center justify-center gap-2">
                            <button
                                onClick={() => current && onDownload?.(current)}
                                disabled={!current}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-black font-bold text-sm hover:opacity-90 disabled:opacity-50"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        </div>
                    </Dialog.Panel>
                </Transition.Child>
            </Dialog>
        </Transition>
    );
}
