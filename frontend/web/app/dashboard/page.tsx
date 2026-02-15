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
import { forecastApi, type ForecastResult, type ForecastMaterial, type ForecastRegion } from "@/lib/api";

// ... (existing imports)

export default function DashboardPage() {
    const [copilotOpen, setCopilotOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [recentProjects, setRecentProjects] = useState<ApiProject[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [recentLoading, setRecentLoading] = useState(true);

    // AI State
    const [awardDecision, setAwardDecision] = useState<AwardDecision | null>(null);
    const [awardLoading, setAwardLoading] = useState(true);

    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [forecastLoading, setForecastLoading] = useState(true);
    const [forecastMaterial, setForecastMaterial] = useState<ForecastMaterial>("steel");
    const [forecastRegion, setForecastRegion] = useState<ForecastRegion>("delhi_ncr");

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

    useEffect(() => {
        setForecastLoading(true);
        forecastApi
            .analyze({ material: forecastMaterial, region: forecastRegion, quantity: 10 })
            .then(setForecast)
            .catch(() => setForecast(null))
            .finally(() => setForecastLoading(false));
    }, [forecastMaterial, forecastRegion]);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold font-heading text-foreground tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">Welcome back. Here&apos;s your construction portfolio status today.</p>
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
                    className="h-[550px]"
                >
                    <BidScoringChart decision={awardDecision} loading={awardLoading} />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="h-[550px]"
                >
                    <PriceTrendChart
                        forecast={forecast}
                        loading={forecastLoading}
                        material={forecastMaterial}
                        region={forecastRegion}
                        onConfigChange={(m, r) => {
                            setForecastMaterial(m);
                            setForecastRegion(r);
                        }}
                    />
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
