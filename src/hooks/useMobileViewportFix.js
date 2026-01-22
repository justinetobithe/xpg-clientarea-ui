import { useEffect } from "react";

export function useMobileViewportFix(enabled) {
    useEffect(() => {
        if (!enabled) return;

        const setVh = () => {
            const h = window.innerHeight || 0;
            if (h) document.documentElement.style.setProperty("--app-vh", `${h * 0.01}px`);
            if (window.visualViewport?.height) {
                document.documentElement.style.setProperty("--vvh", `${window.visualViewport.height * 0.01}px`);
            }
        };

        setVh();

        const vv = window.visualViewport;
        const onVV = () => setVh();
        if (vv) {
            vv.addEventListener("resize", onVV);
            vv.addEventListener("scroll", onVV);
        }

        window.addEventListener("resize", setVh);
        window.addEventListener("orientationchange", setVh);

        return () => {
            window.removeEventListener("resize", setVh);
            window.removeEventListener("orientationchange", setVh);
            if (vv) {
                vv.removeEventListener("resize", onVV);
                vv.removeEventListener("scroll", onVV);
            }
        };
    }, [enabled]);
}
