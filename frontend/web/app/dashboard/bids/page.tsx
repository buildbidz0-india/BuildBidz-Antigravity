"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gavel, Search, Filter, Scale } from "lucide-react";

export default function BidsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Bids</h2>
                    <p className="text-gray-500 mt-1">View and manage construction bids and tenders.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/compare"
                        className="flex items-center justify-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                    >
                        <Scale size={20} className="mr-2" />
                        Compare bids with AI
                    </Link>
                    <button className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                        <Gavel size={20} className="mr-2" />
                        New Tender
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Search bids by project or contractor..."
                    />
                </div>
                <button className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-colors font-medium">
                    <Filter size={18} className="mr-2" />
                    Filter
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center"
            >
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-600 mb-6">
                    <Gavel size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bids management</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Tenders and bid comparison will appear here once the bids API is connected. You can create new tenders and track contractor responses.
                </p>
                <Link
                    href="/dashboard/compare"
                    className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700"
                >
                    <Scale size={18} /> Compare bids with AI
                </Link>
            </motion.div>
        </div>
    );
}
