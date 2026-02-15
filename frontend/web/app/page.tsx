import Link from "next/link";
import { Construction, BarChart3, FileCheck, Shield } from "lucide-react";

export const metadata = {
    title: "BuildBidz - India-First Construction Platform",
    description: "Manage projects, bids, and teams. Built for Indian construction.",
};

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold text-gray-900">
                        Build<span className="text-orange-600">Bidz</span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link href="/docs" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            Docs
                        </Link>
                        <Link
                            href="/login"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                        >
                            Sign up
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 sm:py-28 text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight max-w-4xl">
                    India&apos;s construction platform for{" "}
                    <span className="text-orange-600">projects, bids & teams</span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl">
                    Manage tenders, track progress, and collaborate with your team. Built for Indian construction companies.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"
                    >
                        Get started
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-gray-900 bg-white border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-colors"
                    >
                        Log in
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="border-t border-gray-200 bg-white px-4 py-16 sm:py-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
                        Everything you need to run projects
                    </h2>
                    <p className="mt-2 text-gray-600 text-center max-w-xl mx-auto">
                        From bidding to completion, in one place.
                    </p>
                    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Construction, title: "Projects", desc: "Track progress, milestones, and teams." },
                            { icon: BarChart3, title: "Bids & Tenders", desc: "Manage tenders and compare bids." },
                            { icon: FileCheck, title: "Drawings & RFIs", desc: "Centralize docs and requests." },
                            { icon: Shield, title: "Secure", desc: "Auth, audit logs, and access control." },
                        ].map((item) => (
                            <div key={item.title} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <item.icon className="w-10 h-10 text-orange-600" aria-hidden />
                                <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
                                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-4 py-16 bg-orange-600">
                <div className="max-w-3xl mx-auto text-center text-white">
                    <h2 className="text-2xl sm:text-3xl font-bold">
                        Ready to get started?
                    </h2>
                    <p className="mt-2 opacity-90">
                        Create an account and open your dashboard in seconds.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-orange-600 bg-white hover:bg-gray-100 transition-colors"
                        >
                            Sign up free
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-white border-2 border-white/50 hover:bg-white/10 transition-colors"
                        >
                            Log in
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white px-4 py-8">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">
                        © BuildBidz. India-First Construction Platform.
                    </span>
                    <div className="flex gap-6">
                        <Link href="/docs" className="text-sm text-gray-500 hover:text-gray-900">Docs</Link>
                        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Log in</Link>
                        <Link href="/signup" className="text-sm text-gray-500 hover:text-gray-900">Sign up</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
