"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gavel, Search, Filter, Scale, Plus, FileText, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TenderTable } from "@/components/bids/TenderTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bidsApi, type ApiTender } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

// Helper to map API data to UI shape
const mapTenderToUI = (t: ApiTender) => ({
    id: t.id.toString(),
    title: t.title,
    project_id: t.project_id?.toString() || "",
    projectName: t.project_id ? `Project #${t.project_id}` : "General",
    description: t.description,
    status: t.status,
    bidsReceived: t.bid_count,
    deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : "No Deadline",
    budgetRange: `₹${t.min_budget.toLocaleString()} - ₹${t.max_budget.toLocaleString()}`
});

export default function BidsPage() {
    const { toast } = useToast();
    const [tenders, setTenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        loadTenders();
    }, []);

    const loadTenders = async () => {
        try {
            setLoading(true);
            const data = await bidsApi.list();
            setTenders(data.map(mapTenderToUI));
        } catch (error) {
            console.error("Failed to load tenders", error);
            toast({
                title: "Error",
                description: "Failed to load tenders. Ensure backend is running.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredTenders = tenders.filter((t) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const activeCount = tenders.filter(t => t.status === "Open").length;
    const reviewingCount = tenders.filter(t => t.status === "Reviewing").length;
    const closedCount = tenders.filter(t => t.status === "Closed").length;

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
                            <h3 className="text-2xl font-bold">{loading ? "..." : activeCount}</h3>
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
                            <h3 className="text-2xl font-bold">{loading ? "..." : reviewingCount}</h3>
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
                            <h3 className="text-2xl font-bold">{loading ? "..." : closedCount}</h3>
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

                <Button variant="ghost" onClick={loadTenders} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                    Refresh
                </Button>
            </div>

            {/* Tenders Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <TenderTable tenders={filteredTenders} />
            )}
        </div>
    );
}

