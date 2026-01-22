import { useEffect } from "react";

export function useBodyScrollLock(locked) {
    useEffect(() => {
        if (!locked) return;

        const prevOverflow = document.body.style.overflow;
        const prevTouch = document.body.style.touchAction;

        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.touchAction = prevTouch;
        };
    }, [locked]);
}
