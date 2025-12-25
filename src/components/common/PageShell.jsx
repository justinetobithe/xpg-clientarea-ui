import { Link } from "react-router-dom";

export default function PageShell({
    crumb = "Home",
    title,
    subtitle,
    children,
    right,
}) {
    return (
        <div className="w-full pt-20 md:pt-24">
            <header className="bg-darken-evo py-8 border-b border-border">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <p className="text-sm text-white/50 mb-1">{crumb}</p>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                            {subtitle ? (
                                <p className="text-sm text-white/70">{subtitle}</p>
                            ) : null}
                        </div>
                        {right ? <div className="shrink-0">{right}</div> : null}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 w-full">
                {children}
            </div>
        </div>
    );
}
