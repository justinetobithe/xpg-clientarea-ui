export default function Footer() {
    return (
        <footer className="border-t border-border bg-black/80 backdrop-blur mt-10">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 text-sm text-white/70 flex flex-col md:flex-row items-center justify-between gap-3">
                <div>Copyright © 2008 - 2025 XPG. All Rights Reserved.</div>
                <div className="flex items-center gap-4">
                    <img src="/image/gibraltar.png" className="h-6 object-contain" />
                    <img src="/image/MGA-New-Grayscale.png" className="h-6 object-contain" />
                    <img src="/image/ecogra.png" className="h-6 object-contain" />
                </div>
            </div>
        </footer>
    );
}
