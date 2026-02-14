"use client";

import Sidebar from "@/components/sidebar";
import { ProtectedRoute } from "@/lib/auth/auth-context";
import { Bell, Search, User } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                <Sidebar />

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Header */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
                        <div className="relative w-96">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                                placeholder="Search projects, bids, drawings..."
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors relative">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-orange-600 ring-2 ring-white" />
                            </button>
                            <div className="h-8 w-px bg-gray-200 mx-2" />
                            <button className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                    JD
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-gray-900 leading-none">John Doe</p>
                                    <p className="text-xs text-gray-500 mt-1">Administrator</p>
                                </div>
                            </button>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto p-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
