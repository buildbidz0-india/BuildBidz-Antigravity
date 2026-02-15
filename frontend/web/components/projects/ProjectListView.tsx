"use client";

import Link from "next/link";
import { MoreHorizontal, ArrowRight } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApiProject } from "@/lib/api";

interface ProjectListViewProps {
    projects: ApiProject[];
}

export function ProjectListView({ projects }: ProjectListViewProps) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-muted-foreground">No projects found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => (
                        <TableRow key={project.id} className="group hover:bg-muted/30">
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <Link href={`/dashboard/projects/${project.id}`} className="hover:text-primary hover:underline transition-all">
                                        {project.name}
                                    </Link>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        {project.description || "No description"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    project.status.toLowerCase() === 'active' ? 'success' :
                                        project.status.toLowerCase() === 'planning' ? 'warning' :
                                            'secondary'
                                }>
                                    {project.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{project.location || "—"}</TableCell>
                            <TableCell>
                                <div className="w-[120px] space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{project.progress}%</span>
                                    </div>
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {project.deadline || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/projects/${project.id}`}>View Details</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>Edit Project</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
