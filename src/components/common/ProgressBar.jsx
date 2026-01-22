export default function ProgressBar({ value }) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));

    return (
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${v}%` }}
            />
        </div>
    );
}
