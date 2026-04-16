import { useEffect, useMemo, useState } from "react";

export default function HeroBanner({
    image,
    children,
    className = "",
    overlayClassName = "",
    alt = "Hero banner",
    imgClassName = "",
    fallbackAspect = "16/9",
    heightClassName = "",
    priority = false,
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
    const hasCustomHeight = Boolean(heightClassName?.trim());

    return (
        <section
            className={[
                "relative w-full overflow-hidden border-b border-border bg-black",
                hasCustomHeight ? heightClassName : "",
                className,
            ].join(" ")}
            style={hasCustomHeight ? undefined : { aspectRatio: aspect }}
        >
            {image ? (
                <img
                    src={image}
                    alt={alt}
                    className={[
                        "absolute inset-0 h-full w-full select-none object-cover object-center",
                        imgClassName,
                    ].join(" ")}
                    loading={priority ? "eager" : "lazy"}
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

            <div className="relative z-10 h-full w-full">{children}</div>
        </section>
    );
}