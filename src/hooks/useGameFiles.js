import { useCallback, useEffect, useMemo, useState } from "react";
import { PAGE_SIZE } from "../utils/fileUtils";

export function useGameFiles({
    flatFiles = [],
    debounceMs = 450,
}) {
    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [selectedSectionNames, setSelectedSectionNames] = useState(new Set());
    const [selectedExts, setSelectedExts] = useState(new Set());
    const [page, setPage] = useState(1);

    const [selectedKeys, setSelectedKeys] = useState(() => new Set());

    useEffect(() => {
        const t0 = inputValue.trim();
        const id = setTimeout(() => setSearchTerm(t0), debounceMs);
        return () => clearTimeout(id);
    }, [inputValue, debounceMs]);

    const filteredFiles = useMemo(() => {
        const nameFilter = searchTerm.toLowerCase();

        let arr = flatFiles.filter((r) => {
            const secOK = selectedSectionNames.size === 0 || selectedSectionNames.has(r._sectionTitle);
            const extOK = selectedExts.size === 0 || (r._ext && selectedExts.has(r._ext));
            const nameOK = !nameFilter || r._name.toLowerCase().includes(nameFilter);
            return secOK && extOK && nameOK;
        });

        if (sortBy === "alpha") {
            arr.sort((a, b) => a._name.localeCompare(b._name, undefined, { sensitivity: "base", numeric: true }));
        } else {
            arr.sort((a, b) => {
                const ad = a._date ? +a._date : 0;
                const bd = b._date ? +b._date : 0;
                return bd - ad;
            });
        }

        return arr;
    }, [flatFiles, selectedSectionNames, selectedExts, searchTerm, sortBy]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE)), [filteredFiles.length]);

    const pageFiles = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredFiles.slice(start, start + PAGE_SIZE);
    }, [filteredFiles, page]);

    useEffect(() => setPage(1), [searchTerm, sortBy, selectedSectionNames, selectedExts]);
    useEffect(() => setSelectedKeys(new Set()), [searchTerm, sortBy, selectedSectionNames, selectedExts, page]);

    const fileKey = useCallback(
        (f, idx) => String(f?.id || `${f?._sectionId || "sec"}::${f?._name || "file"}::${idx}`),
        []
    );

    const toggleSelected = useCallback((k) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
        });
    }, []);

    const clearSelected = useCallback(() => setSelectedKeys(new Set()), []);

    const selectedFiles = useMemo(() => {
        if (!selectedKeys.size) return [];
        const keysSet = selectedKeys;
        const currentList = filteredFiles;
        const arr = [];
        for (let i = 0; i < currentList.length; i += 1) {
            const f = currentList[i];
            const k = fileKey(f, i);
            if (keysSet.has(k)) arr.push({ f, i, k });
        }
        return arr;
    }, [selectedKeys, filteredFiles, fileKey]);

    return {
        inputValue,
        setInputValue,
        searchTerm,
        sortBy,
        setSortBy,

        selectedSectionNames,
        setSelectedSectionNames,
        selectedExts,
        setSelectedExts,

        page,
        setPage,
        totalPages,
        pageFiles,
        filteredFiles,

        selectedKeys,
        fileKey,
        toggleSelected,
        clearSelected,
        selectedFiles,
    };
}
