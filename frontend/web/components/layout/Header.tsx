"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

interface HeaderProps {
    isCollapsed: boolean;
    toggleSidebar: () => void; // For mobile mainly, but can trigger sidebar
}

function initialsFromUser(displayName: string | null, email: string | null): string {
    if (displayName && displayName.trim()) {
        const parts = displayName.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return displayName.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
        const local = email.split("@")[0];
        return local.slice(0, 2).toUpperCase();
    }
    return "?";
}

export function Header({ isCollapsed, toggleSidebar }: HeaderProps) {
    const { user } = useAuth();
    const displayName = user?.displayName ?? user?.email ?? "User";
    const initials = initialsFromUser(user?.displayName ?? null, user?.email ?? null);

    return (
        <header
            className={cn(
                "h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10 transition-all duration-300",
                isCollapsed ? "ml-20" : "ml-72"
            )}
        >
            {/* Left: Search (and maybe Breadcrumbs later) */}
            <div className="flex items-center flex-1 max-w-2xl gap-4">
                {/* Mobile menu - visible only on small screens eventually */}
                <button className="lg:hidden p-2 -ml-2 text-gray-500" onClick={toggleSidebar}>
                    <Menu size={20} />
                </button>

                <div className="relative w-full max-w-md hidden md:block">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                        <Search size={16} />
                    </span>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent sm:text-sm transition-all"
                        placeholder="Search projects, bids, documents..."
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-primary transition-colors relative rounded-full hover:bg-gray-50">
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white" />
                </button>

                <div className="h-6 w-px bg-gray-200" />

                <div className="flex items-center gap-3">
                    <div className="hidden text-right md:block">
                        <p className="text-sm font-semibold text-gray-900 leading-none">
                            {displayName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {user?.email}
                        </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-medium shadow-sm ring-2 ring-gray-100">
                        {initials}
                    </div>
                </div>
            </div>
        </header>
    );
}
