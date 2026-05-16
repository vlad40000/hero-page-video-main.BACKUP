export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 flex items-center justify-center bg-slate-50 py-24">
                <div className="text-center max-w-2xl px-4">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">{title}</h1>
                    <p className="text-slate-600 text-lg">
                        This page is currently under development as part of our new site structure.
                        Please check back soon for updates!
                    </p>
                </div>
            </main>
        </div>
    );
}
