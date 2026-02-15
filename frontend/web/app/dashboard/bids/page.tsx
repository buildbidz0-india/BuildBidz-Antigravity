"use client";

import { useState } from "react";
import Link from "next/link";
import { Gavel, Search, Filter, Scale, Plus, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TenderTable } from "@/components/bids/TenderTable";
import { MOCK_TENDERS } from "@/lib/mock-tenders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BidsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Filter Logic
    const filteredTenders = MOCK_TENDERS.filter((t) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const activeCount = MOCK_TENDERS.filter(t => t.status === "Open").length;
    const reviewingCount = MOCK_TENDERS.filter(t => t.status === "Reviewing").length;
    const closedCount = MOCK_TENDERS.filter(t => t.status === "Closed").length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold font-heading text-foreground tracking-tight">Bid Management</h2>
                    <p className="text-muted-foreground mt-1">Manage tenders and analyze contractor proposals with AI.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild className="hidden sm:flex">
                        <Link href="/dashboard/compare">
                            <Scale className="mr-2 h-4 w-4" />
                            Compare with AI
                        </Link>
                    </Button>
                    <Button size="lg" className="shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-5 w-5" />
                        Create Tender
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-green-100 text-green-700 rounded-full">
                            <Gavel className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Tenders</p>
                            <h3 className="text-2xl font-bold">{activeCount}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-orange-100 text-orange-700 rounded-full">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                            <h3 className="text-2xl font-bold">{reviewingCount}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-gray-100 text-gray-700 rounded-full">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Closed / Awarded</p>
                            <h3 className="text-2xl font-bold">{closedCount}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 w-full md:w-auto gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search tenders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] bg-white">
                            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tenders Table */}
            <TenderTable tenders={filteredTenders} />
        </div>
    );
}
