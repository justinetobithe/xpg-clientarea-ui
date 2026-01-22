import { useEffect, useRef, useState } from "react";

export function useFakeProgress(active, onTick, opts = {}) {
    const max = opts.max ?? 92;
    const start = opts.start ?? 8;
    const intervalMs = opts.intervalMs ?? 140;

    const [pct, setPct] = useState(0);
    const tRef = useRef(null);

    useEffect(() => {
        if (!active) {
            setPct(0);
            if (tRef.current) clearInterval(tRef.current);
            tRef.current = null;
            return;
        }

        setPct(start);
        if (tRef.current) clearInterval(tRef.current);

        tRef.current = setInterval(() => {
            setPct((p) => {
                if (p >= max) return p;
                const bump = p < 40 ? 6 : p < 70 ? 3 : 1;
                const next = Math.min(max, p + bump);
                onTick?.(next);
                return next;
            });
        }, intervalMs);

        return () => {
            if (tRef.current) clearInterval(tRef.current);
            tRef.current = null;
        };
    }, [active, onTick, max, start, intervalMs]);

    const finish = async () => {
        setPct(100);
        onTick?.(100);
        await new Promise((r) => setTimeout(r, 250));
        setPct(0);
    };

    return { pct, setPct, finish };
}
