"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Construction,
    TrendingUp,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Briefcase,
    Calendar,
    ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ApiProject, ProjectStats } from "@/lib/api";

// --- Stats Grid Component ---

interface StatsGridProps {
    stats: ProjectStats | null;
    loading: boolean;
}

const statConfig = [
    {
        label: "Active Projects",
        key: "active" as const,
        icon: Construction,
        trend: "+12.5%",
        trendUp: true,
        desc: "vs. last month"
    },
    {
        label: "Total Projects",
        key: "total" as const,
        icon: Briefcase,
        trend: "+4.2%",
        trendUp: true,
        desc: "vs. last month"
    },
    {
        label: "In Planning",
        key: "planning" as const,
        icon: Clock,
        trend: "-2.1%",
        trendUp: false,
        desc: "vs. last month"
    },
    {
        label: "Critical Alerts",
        value: "2",
        icon: AlertCircle,
        trend: "+1",
        trendUp: false,
        desc: "new since yesterday",
        alert: true
    },
];

export function StatsGrid({ stats, loading }: StatsGridProps) {
    const getValue = (item: typeof statConfig[0]) => {
        if ("value" in item) return item.value;
        if (stats && item.key) return String(stats[item.key] ?? "0");
        return "—";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statConfig.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4">
                                    <div className={cn(
                                        "p-2 rounded-full",
                                        stat.alert ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                                    )}>
                                        <stat.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <h3 className="text-2xl font-bold tracking-tight">
                                            {loading ? <span className="animate-pulse bg-gray-200 h-8 w-12 block rounded" /> : getValue(stat)}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-muted-foreground">
                                <span className={cn(
                                    "flex items-center font-medium mr-2",
                                    stat.trendUp ? "text-green-600" : "text-red-600"
                                )}>
                                    {stat.trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                    {stat.trend}
                                </span>
                                {stat.desc}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// --- Recent Activity Component ---

interface RecentActivityProps {
    projects: ApiProject[];
    loading: boolean;
}

function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
    });
}

function getStatusBadgeVariant(status: string) {
    switch (status.toLowerCase()) {
        case "active": return "success";
        case "planning": return "warning";
        case "completed": return "default";
        default: return "secondary";
    }
}

export function RecentActivity({ projects, loading }: RecentActivityProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>
                        Latest updates from your project portfolio
                    </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                    <Link href="/dashboard/projects">
                        View all <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-0">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-6 border-b last:border-0 border-border/50">
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                </div>
                                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                            </div>
                        ))
                    ) : projects.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No recent activity found.
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div
                                key={project.id}
                                className="flex items-center justify-between p-6 border-b last:border-0 border-border/50 hover:bg-muted/30 transition-colors group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                        {project.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                            {project.name}
                                        </p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            Created {formatDate(project.created_at ?? "")}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Badge variant={getStatusBadgeVariant(project.status) as any}>
                                        {project.status}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/projects/${project.id}`}>View Details</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>View Bids</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
