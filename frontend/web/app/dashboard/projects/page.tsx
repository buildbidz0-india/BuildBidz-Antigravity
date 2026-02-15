"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { MOCK_PROJECTS } from "@/lib/mock-projects";
import CreateProjectModal from "@/components/CreateProjectModal";
import { projectsApi, type ApiProject } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectGridView } from "@/components/projects/ProjectGridView";
import { ProjectListView } from "@/components/projects/ProjectListView";

export default function ProjectsPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const list = await projectsApi.list();
            setProjects(list);
        } catch {
            // Fallback to mock data if API fails (dev mode)
            setProjects(MOCK_PROJECTS as unknown as ApiProject[]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Filtering Logic
    const filteredProjects = projects.filter((p) => {
        const q = searchQuery.trim().toLowerCase();

        // Search Filter
        if (q) {
            const matchName = p.name.toLowerCase().includes(q);
            const matchLocation = (p.location || "").toLowerCase().includes(q);
            if (!matchName && !matchLocation) return false;
        }

        // Status Filter
        if (statusFilter && statusFilter !== "all") {
            if ((p.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold font-heading text-foreground tracking-tight">Projects</h2>
                    <p className="text-muted-foreground mt-1">Manage and track your construction portfolio.</p>
                </div>
                <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="shadow-lg shadow-primary/20"
                    size="lg"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Project
                </Button>
            </div>

            {/* Filters & Controls */}
            <ProjectFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <ProjectGridView projects={filteredProjects} />
                    ) : (
                        <ProjectListView projects={filteredProjects} />
                    )}
                </>
            )}

            <CreateProjectModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchProjects}
            />
        </div>
    );
}
