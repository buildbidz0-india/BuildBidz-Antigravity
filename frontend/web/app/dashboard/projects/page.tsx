"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    MapPin,
    Calendar,
    Users
} from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mock-projects";
import CreateProjectModal from "@/components/CreateProjectModal";
import { projectsApi, type ApiProject } from "@/lib/api";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=400";

export default function ProjectsPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!filterOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [filterOpen]);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const list = await projectsApi.list();
            setProjects(list);
        } catch {
            setProjects(MOCK_PROJECTS as unknown as ApiProject[]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const rawList = projects.length > 0 ? projects : (MOCK_PROJECTS as unknown as ApiProject[]);
    const displayList = rawList.filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            const matchName = p.name.toLowerCase().includes(q);
            const matchLocation = (p.location || "").toLowerCase().includes(q);
            if (!matchName && !matchLocation) return false;
        }
        if (statusFilter) {
            if ((p.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
        }
        return true;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
                    <p className="text-gray-500 mt-1">Manage and track all your construction projects.</p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center"
                >
                    <Plus size={20} className="mr-2" />
                    Create Project
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Search projects by name or location..."
                    />
                </div>
                <div className="relative" ref={filterRef}>
                    <button
                        type="button"
                        onClick={() => setFilterOpen((o) => !o)}
                        className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-colors font-medium"
                    >
                        <Filter size={18} className="mr-2" />
                        Filter
                    </button>
                    {filterOpen && (
                        <div className="absolute right-0 top-full mt-1 py-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[140px]">
                            <button
                                type="button"
                                onClick={() => { setStatusFilter(""); setFilterOpen(false); }}
                                className={`block w-full text-left px-4 py-2 text-sm ${!statusFilter ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                All statuses
                            </button>
                            <button
                                type="button"
                                onClick={() => { setStatusFilter("Active"); setFilterOpen(false); }}
                                className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === "Active" ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                onClick={() => { setStatusFilter("Planning"); setFilterOpen(false); }}
                                className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === "Planning" ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                            >
                                Planning
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-80 animate-pulse">
                            <div className="h-48 bg-gray-100" />
                            <div className="p-6 space-y-3">
                                <div className="h-5 bg-gray-100 rounded w-3/4" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                                <div className="h-2 bg-gray-100 rounded w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : displayList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <p className="text-gray-500 font-medium">No projects match your search or filter.</p>
                    <p className="text-sm text-gray-400 mt-1">Try clearing the search or filter.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayList.map((project, index) => (
                    <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="h-48 overflow-hidden relative bg-gray-100">
                            <Image
                                src={project.image || DEFAULT_IMAGE}
                                alt={project.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${project.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2 text-wrap">
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">{project.name}</h3>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="flex items-center text-sm text-gray-500 mb-6">
                                <MapPin size={14} className="mr-1" />
                                {project.location}
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-bold text-gray-900">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                                <div className="flex items-center text-xs text-gray-500">
                                    <Calendar size={14} className="mr-2 text-gray-400" />
                                    {project.deadline ?? "—"}
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                    <Users size={14} className="mr-2 text-gray-400" />
                                    {project.team_count ?? 0} members
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    </Link>
                ))}
            </div>
            )}
            <CreateProjectModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchProjects}
            />
        </div>
    );
}
