"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApiProject } from "@/lib/api";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=400";

interface ProjectGridViewProps {
    projects: ApiProject[];
}

export function ProjectGridView({ projects }: ProjectGridViewProps) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-muted-foreground">No projects found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
                <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                            <Image
                                src={project.image || DEFAULT_IMAGE}
                                alt={project.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-4 right-4">
                                <Badge variant={
                                    project.status.toLowerCase() === 'active' ? 'success' :
                                        project.status.toLowerCase() === 'planning' ? 'warning' :
                                            'secondary'
                                }>
                                    {project.status}
                                </Badge>
                            </div>
                        </div>

                        <CardHeader className="p-5 pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg leading-tight line-clamp-1">
                                    <Link href={`/dashboard/projects/${project.id}`} className="hover:text-primary transition-colors">
                                        {project.name}
                                    </Link>
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
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
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {project.location || "No location"}
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 pt-2 flex-grow">
                            <div className="space-y-3 mt-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-semibold">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-500 rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="p-5 pt-0 border-t bg-muted/20 mt-auto items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center py-3">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                {project.deadline || "No deadline"}
                            </div>
                            <div className="flex items-center py-3">
                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                {project.team_count || 0} Members
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
