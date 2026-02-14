"use client";

import { motion } from "framer-motion";
import {
    Construction,
    TrendingUp,
    Clock,
    AlertCircle,
    FileText,
    FileText,
    MessageSquare,
    Brain
} from "lucide-react";
import BidScoringChart from "@/components/dashboard/BidScoringChart";
import PriceTrendChart from "@/components/dashboard/PriceTrendChart";

const stats = [
    { label: "Active Projects", value: "12", icon: Construction, trend: "+2 this month", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Bids", value: "48", icon: TrendingUp, trend: "+15% vs last month", color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending RFIs", value: "7", icon: Clock, trend: "3 urgent", color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Alerts", value: "2", icon: AlertCircle, trend: "Requires attention", color: "text-red-600", bg: "bg-red-50" },
];

const recentActivity = [
    { id: 1, type: "bid", text: "New bid received for Mumbai Metro Extension", time: "2 hours ago", icon: FileText },
    { id: 2, type: "message", text: "New comment on DLF Cyber City project drawings", time: "4 hours ago", icon: MessageSquare },
    { id: 3, type: "project", text: "Project 'Green Valley' moved to construction phase", time: "1 day ago", icon: Construction },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
                </div>
                <button className="bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                    New Project
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
                    >
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 text-2xl`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                        <div className="flex items-baseline space-x-2 mt-1">
                            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                            <span className="text-xs font-medium text-gray-400">{stat.trend}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <BidScoringChart />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <PriceTrendChart />
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-semibold">
                                <Brain size={14} className="mr-1" /> AI Prioritized
                            </div>
                            <button className="text-orange-600 text-sm font-medium hover:underline">View all</button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="p-6 flex items-start space-x-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                    <activity.icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900 font-medium">{activity.text}</p>
                                    <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Assistant Quick Access */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                            <Brain size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">AI Copilot</h3>
                        <p className="opacity-90 mb-6 text-sm leading-relaxed">
                            I can help you analyze bids, forecast material trends, or draft contractor notifications.
                        </p>
                    </div>
                    <div className="relative z-10 space-y-3">
                        <button className="w-full bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-md text-sm">
                            Ask Copilot
                        </button>
                        <button className="w-full bg-orange-700/30 text-white border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-orange-700/50 transition-colors text-sm">
                            Analyze Market
                        </button>
                    </div>
                    <div className="absolute -bottom-4 -right-4 opacity-10">
                        <Construction size={160} />
                    </div>
                </div>
            </div>
        </div>
    );
}
