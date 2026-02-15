import Link from "next/link";
import { FileText, Book } from "lucide-react";

export const metadata = {
    title: "Documentation - BuildBidz",
    description: "Technical documentation for the BuildBidz platform",
};

const docItems = [
    { name: "System Architecture", file: "ARCHITECTURE.md", description: "High-level architecture, data flow, and components" },
    { name: "Developer Onboarding", file: "ONBOARDING.md", description: "Setup, prerequisites, and quick start" },
];

export default function DocsPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-16 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <Book size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
                        <p className="text-gray-500 mt-1">BuildBidz technical documentation</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {docItems.map((doc) => (
                        <div
                            key={doc.file}
                            className="block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <FileText size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h2 className="font-bold text-gray-900">{doc.name}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        See <code className="bg-gray-100 px-1 rounded">{doc.file}</code> in the <code className="bg-gray-100 px-1 rounded">docs/</code> folder.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-8 text-sm text-gray-500">
                    Full markdown docs live in the <code className="bg-gray-200 px-1.5 py-0.5 rounded">docs/</code> folder in the repository.
                </p>

                <div className="mt-8">
                    <Link
                        href="/"
                        className="text-orange-600 font-medium hover:underline"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </main>
    );
}
