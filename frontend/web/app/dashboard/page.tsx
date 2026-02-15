"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Brain,
    Plus,
    Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import BidScoringChart from "@/components/dashboard/BidScoringChart";
import PriceTrendChart from "@/components/dashboard/PriceTrendChart";
import { StatsGrid, RecentActivity } from "@/components/dashboard/dashboard-widgets";
import AIChat from "@/components/AIChat";
import CreateProjectModal from "@/components/CreateProjectModal";
import SendNotificationModal from "@/components/SendNotificationModal";
import { projectsApi, awardsApi, type ProjectStats, type ApiProject, type AwardDecision, type AwardBid } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Mock Data for charts
const SAMPLE_BIDS: AwardBid[] = [
    { id: "b1", supplier_name: "Larsen & Toubro", price: 1480000, delivery_days: 21, reputation_score: 9.2 },
    { id: "b2", supplier_name: "Tata Projects", price: 1520000, delivery_days: 18, reputation_score: 8.8 },
    { id: "b3", supplier_name: "NCC Ltd", price: 1420000, delivery_days: 28, reputation_score: 7.5 },
    { id: "b4", supplier_name: "Shapoorji", price: 1550000, delivery_days: 20, reputation_score: 8.5 },
];

export default function DashboardPage() {
    const [copilotOpen, setCopilotOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [recentProjects, setRecentProjects] = useState<ApiProject[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [recentLoading, setRecentLoading] = useState(true);
    const [awardDecision, setAwardDecision] = useState<AwardDecision | null>(null);
    const [awardLoading, setAwardLoading] = useState(true);
    const [notificationOpen, setNotificationOpen] = useState(false);

    const refetch = () => {
        setStatsLoading(true);
        setRecentLoading(true);
        projectsApi.stats().then(setStats).catch(() => setStats(null)).finally(() => setStatsLoading(false));
        projectsApi.list().then((list) => setRecentProjects(list.slice(0, 5))).catch(() => setRecentProjects([])).finally(() => setRecentLoading(false));
    };

    useEffect(() => {
        refetch();
    }, [createProjectOpen]);

    useEffect(() => {
        setAwardLoading(true);
        awardsApi
            .compare("TMT Steel supply for Phase 1", SAMPLE_BIDS)
            .then(setAwardDecision)
            .catch(() => setAwardDecision(null))
            .finally(() => setAwardLoading(false));
    }, []);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold font-heading text-foreground tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">Welcome back. Here's your construction portfolio status today.</p>
                </div>
                <Button
                    onClick={() => setCreateProjectOpen(true)}
                    size="lg"
                    className="shadow-lg shadow-primary/20"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    New Project
                </Button>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} loading={statsLoading} />

            {/* AI Insights & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="h-[500px]"
                >
                    <BidScoringChart decision={awardDecision} loading={awardLoading} />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="h-[500px]"
                >
                    <PriceTrendChart />
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Table */}
                <div className="lg:col-span-2">
                    <RecentActivity projects={recentProjects} loading={recentLoading} />
                </div>

                {/* AI Copilot Card */}
                <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <CardHeader className="relative z-10 pb-2">
                        <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Sparkles className="h-6 w-6 text-accent" />
                        </div>
                        <CardTitle className="text-xl">AI Copilot</CardTitle>
                        <CardDescription className="text-primary-foreground/70">
                            Your intelligent assistant for construction management.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="relative z-10 space-y-4 mt-4">
                        <Button
                            variant="secondary"
                            className="w-full justify-start h-auto py-3 px-4 bg-white/10 hover:bg-white/20 text-white border-0"
                            onClick={() => setCopilotOpen(true)}
                        >
                            <Brain className="mr-3 h-5 w-5 text-accent" />
                            <div className="flex flex-col items-start text-left">
                                <span className="font-semibold">Ask Copilot</span>
                                <span className="text-xs opacity-70 font-normal">Analyze bids or get recommendations</span>
                            </div>
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full justify-start h-auto py-3 px-4 bg-white/10 hover:bg-white/20 text-white border-0"
                            onClick={() => setNotificationOpen(true)}
                        >
                            <div className="h-5 w-5 rounded-full border-2 border-accent mr-3" />
                            <div className="flex flex-col items-start text-left">
                                <span className="font-semibold">Send Notifications</span>
                                <span className="text-xs opacity-70 font-normal">Draft emails to contractors</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AIChat
                projectId="dashboard"
                isOpen={copilotOpen}
                onClose={() => setCopilotOpen(false)}
            />
            <CreateProjectModal
                isOpen={createProjectOpen}
                onClose={() => setCreateProjectOpen(false)}
            />
            <SendNotificationModal
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
            />
        </div>
    );
}
