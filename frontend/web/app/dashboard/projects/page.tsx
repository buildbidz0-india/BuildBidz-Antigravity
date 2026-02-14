"use client";

import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    MapPin,
    Calendar,
    Users
} from "lucide-react";

const projects = [
    {
        id: 1,
        name: "Mumbai Metro Extension",
        location: "Mumbai, MH",
        status: "Active",
        team: 18,
        deadline: "Dec 2026",
        progress: 35,
        image: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 2,
        name: "DLF Cyber City - Tower C",
        location: "Gurgaon, HR",
        status: "Active",
        team: 42,
        deadline: "Aug 2025",
        progress: 68,
        image: "https://images.unsplash.com/photo-1503387762-592dee58c190?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: 3,
        name: "Green Valley Residential",
        location: "Bangalore, KA",
        status: "Planning",
        team: 5,
        deadline: "Mar 2027",
        progress: 10,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400"
    },
];

export default function ProjectsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
                    <p className="text-gray-500 mt-1">Manage and track all your construction projects.</p>
                </div>
                <button className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center">
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
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                        placeholder="Search projects by name or location..."
                    />
                </div>
                <button className="flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-colors font-medium">
                    <Filter size={18} className="mr-2" />
                    Filter
                </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={project.image}
                                alt={project.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                                    {project.deadline}
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                    <Users size={14} className="mr-2 text-gray-400" />
                                    {project.team} members
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
