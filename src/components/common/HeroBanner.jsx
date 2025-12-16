export default function HeroBanner({
    image,
    children,
    className = "",
    overlayClassName = "bg-black/55"
}) {
    return (
        <section
            className={`relative w-screen left-1/2 right-1/2 -mx-[50vw] h-[520px] md:h-[640px] lg:h-[950px] bg-cover bg-center overflow-hidden border-b border-border ${className}`}
            style={image ? { backgroundImage: `url(${image})` } : undefined}
        >
            <div className={`absolute inset-0 ${overlayClassName}`} />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </section>
    );
}
