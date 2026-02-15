"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Construction,
    Gavel,
    Scale,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils"; // Assumed helper for class merging, will create

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/projects", icon: Construction },
    { name: "Bids", href: "/dashboard/bids", icon: Gavel },
    { name: "Compare", href: "/dashboard/compare", icon: Scale },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <h1 className="text-2xl font-bold tracking-tight">
                        Build<span className="text-orange-600">Bidz</span>
                    </h1>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center py-3 px-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-orange-50 text-orange-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon size={22} className={cn(
                                "transition-colors",
                                isActive ? "text-orange-600" : "text-gray-400 group-hover:text-gray-600"
                            )} />
                            {!isCollapsed && (
                                <span className="ml-3 font-medium">{item.name}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => signOut()}
                    className={cn(
                        "flex items-center w-full py-3 px-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    )}
                >
                    <LogOut size={22} />
                    {!isCollapsed && <span className="ml-3 font-medium">Log Out</span>}
                </button>
            </div>
        </aside>
    );
}
