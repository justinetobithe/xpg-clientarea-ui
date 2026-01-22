export function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

export function formatDimensions(d) {
    if (!d) return "";
    return String(d).replace(/x/gi, "×");
}
