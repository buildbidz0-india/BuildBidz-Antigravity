"use client";

import { motion } from "framer-motion";
import {
    ArrowLeft,
    Settings,
    Share2,
    Plus,
    CheckCircle2,
    Clock,
    FileText,
    Users
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import AIChat from "@/components/AIChat";
import IngestPanel from "@/components/IngestPanel";
import { getProjectById } from "@/lib/mock-projects";

export default function ProjectDetailPage() {
    const { id } = useParams();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("Updates");

    const projectData = getProjectById(id);

    if (!projectData) {
        return (
            <div className="space-y-8">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/dashboard/projects"
                        className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl">
                        <p className="font-semibold">Project not found</p>
                        <p className="text-sm mt-1">The project you’re looking for doesn’t exist or was removed.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/dashboard/projects"
                        className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="text-3xl font-bold text-gray-900">{projectData.name}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                projectData.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}>
                                {projectData.status}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1">{projectData.location}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                        <Settings size={20} />
                    </button>
                    <button className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center">
                        <Plus size={20} className="mr-2" />
                        Add Update
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-wrap">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
                            <span className="text-2xl font-bold text-orange-600">{projectData.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${projectData.progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="bg-orange-600 h-3 rounded-full shadow-sm"
                            />
                        </div>
                        <p className="mt-6 text-gray-600 leading-relaxed">
                            {projectData.description}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex border-b border-gray-100">
                            {["Updates", "Drawings", "RFIs", "Finances", "Knowledge"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === tab ? "text-orange-600" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-8">
                            {activeTab === "Knowledge" ? (
                                <IngestPanel />
                            ) : (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                                    <h4 className="text-gray-900 font-bold">No {activeTab.toLowerCase()} yet</h4>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Start by adding a {activeTab === "Updates" ? "site photo" : "document"}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Milestones</h3>
                        <div className="space-y-8">
                            {projectData.milestones.map((milestone, i) => (
                                <div key={milestone.name} className="flex items-start relative">
                                    {i < projectData.milestones.length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-100" />
                                    )}
                                    <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center z-10 ${
                                        milestone.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                    }`}>
                                        {milestone.completed ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                    </div>
                                    <div className="ml-4">
                                        <p className={`text-sm font-bold ${milestone.completed ? "text-gray-900" : "text-gray-500"}`}>
                                            {milestone.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{milestone.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <Users size={20} className="mr-2 text-gray-400" />
                            Project Team
                        </h3>
                        <div className="space-y-4">
                            {projectData.team.map((member) => (
                                <div key={member.name} className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                        {member.initials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 leading-none">{member.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-bold rounded-xl transition-colors">
                            Manage Team
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-8 right-8 p-4 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-700 transition-all hover:scale-110 active:scale-95 z-40 group"
            >
                <div className="relative">
                    <Sparkles size={24} />
                    <div className="absolute -top-12 right-0 bg-gray-900 text-white text-[10px] py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Ask Project Copilot
                        <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900" />
                    </div>
                </div>
            </button>

            <AIChat
                projectId={id as string}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    );
}
