"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Construction,
    Gavel,
    Scale,
    FileText,
    Mic,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/projects", icon: Construction },
    { name: "Bids", href: "/dashboard/bids", icon: Gavel },
    { name: "Compare", href: "/dashboard/compare", icon: Scale },
    { name: "Extract", href: "/dashboard/extract", icon: FileText },
    { name: "Voice Assistance", href: "/dashboard/voice", icon: Mic },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <aside
            className={cn(
                "h-screen bg-primary border-r border-primary/10 transition-all duration-300 flex flex-col fixed left-0 top-0 z-20 text-white shadow-xl",
                isCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Brand Logo */}
            <div className="h-16 flex items-center px-6 border-b border-primary-foreground/10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="min-w-[32px] h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">
                        <Building2 size={18} />
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold font-heading tracking-tight whitespace-nowrap">
                            Build<span className="text-accent">Bidz</span>
                        </h1>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-primary-foreground/70 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon
                                size={20}
                                className={cn(
                                    "min-w-[20px] transition-colors",
                                    isActive ? "text-accent" : "text-primary-foreground/70 group-hover:text-white"
                                )}
                            />
                            {!isCollapsed && (
                                <span className="ml-3 font-medium text-sm truncate animate-in fade-in duration-300">
                                    {item.name}
                                </span>
                            )}
                            {isActive && !isCollapsed && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-l-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Toggle */}
            <div className="p-4 border-t border-primary-foreground/10 bg-primary/50">
                <button
                    onClick={() => signOut()}
                    className={cn(
                        "flex items-center w-full px-3 py-2.5 rounded-lg text-primary-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 mb-2"
                    )}
                >
                    <LogOut size={20} className="min-w-[20px]" />
                    {!isCollapsed && <span className="ml-3 text-sm font-medium">Sign Out</span>}
                </button>

                <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    );
}
