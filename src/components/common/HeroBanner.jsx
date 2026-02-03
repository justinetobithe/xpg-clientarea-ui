import { useEffect, useMemo, useState } from "react";

export default function HeroBanner({
    image,
    children,
    className = "",
    overlayClassName = "",
    alt = "Hero banner",
    imgClassName = "",
    fallbackAspect = "16/9",
}) {
    const [ratio, setRatio] = useState(null);

    useEffect(() => {
        if (!image) return;

        const img = new Image();
        img.src = image;

        img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
                setRatio(`${img.naturalWidth}/${img.naturalHeight}`);
            }
        };
    }, [image]);

    const aspect = useMemo(() => ratio || fallbackAspect, [ratio, fallbackAspect]);

    return (
        <section
            className={[
                "relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden border-b border-border bg-black",
                className,
            ].join(" ")}
            style={{ aspectRatio: aspect }}
        >
            {image ? (
                <img
                    src={image}
                    alt={alt}
                    className={[
                        "absolute inset-0 w-full h-full object-cover object-center select-none",
                        imgClassName,
                    ].join(" ")}
                    loading="eager"
                    draggable={false}
                />
            ) : (
                <div className="absolute inset-0 bg-black" />
            )}

            <div
                className={[
                    "absolute inset-0 pointer-events-none",
                    overlayClassName || "bg-gradient-to-b from-black/10 via-black/30 to-black/70",
                ].join(" ")}
            />

            <div className="relative z-10 h-full">{children}</div>
        </section>
    );
}
