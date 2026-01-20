export default function HeroBanner({
    image,
    children,
    className = "",
    overlayClassName = "",
    alt = "Hero banner",
    heightClassName = "h-[280px] sm:h-[360px] md:h-[520px] lg:h-[680px]",
    imgClassName = "object-[center_20%] sm:object-center md:object-center",
}) {
    return (
        <section
            className={[
                "relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden border-b border-border",
                heightClassName,
                className,
            ].join(" ")}
        >
            {image ? (
                <img
                    src={image}
                    alt={alt}
                    className={["absolute inset-0 h-full w-full object-cover select-none", imgClassName].join(" ")}
                    loading="eager"
                    draggable={false}
                />
            ) : (
                <div className="absolute inset-0 bg-black" />
            )}

            <div
                className={[
                    "absolute inset-0",
                    overlayClassName || "bg-gradient-to-b from-black/20 via-black/55 to-black/85",
                ].join(" ")}
            />

            <div className="relative z-10 h-full">{children}</div>
        </section>
    );
}
