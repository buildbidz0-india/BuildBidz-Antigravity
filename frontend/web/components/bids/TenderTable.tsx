"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Edit, Archive, Scale } from "lucide-react";
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
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import type { Tender } from "@/lib/mock-tenders";

interface TenderTableProps {
    tenders: Tender[];
}

function getStatusVariant(status: string) {
    switch (status) {
        case "Open": return "success";
        case "Reviewing": return "warning";
        case "Closed": return "secondary";
        case "Draft": return "outline";
        default: return "default";
    }
}

export function TenderTable({ tenders }: TenderTableProps) {
    if (tenders.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-muted-foreground">No tenders found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Tender Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bids</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tenders.map((tender) => (
                        <TableRow key={tender.id} className="group hover:bg-muted/30">
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-foreground">{tender.title}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        {tender.description}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {tender.projectName}
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(tender.status) as any}>
                                    {tender.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{tender.bidsReceived}</span>
                                    <span className="text-xs text-muted-foreground">received</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {tender.deadline}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {tender.budgetRange}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/compare?tenderId=${tender.id}`}>
                                                <Scale className="mr-2 h-4 w-4" /> Analyze with AI
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Archive className="mr-2 h-4 w-4" /> Archive
                                        </DropdownMenuItem>
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
