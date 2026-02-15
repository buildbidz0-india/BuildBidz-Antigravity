"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Gavel, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { awardsApi, bidsApi, type AwardBid, type AwardDecision } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const INITIAL_BIDS: AwardBid[] = [
    { id: "1", supplier_name: "", price: 0, delivery_days: 0, reputation_score: 5 },
    { id: "2", supplier_name: "", price: 0, delivery_days: 0, reputation_score: 5 },
];

function nextId(): string {
    return String(Date.now());
}

function CompareContent() {
    const searchParams = useSearchParams();
    const tenderId = searchParams.get("tenderId");

    const [requirement, setRequirement] = useState("TMT Steel supply for Phase 1");
    const [bids, setBids] = useState<AwardBid[]>(INITIAL_BIDS);
    const [decision, setDecision] = useState<AwardDecision | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tenderId) {
            loadTenderAnalysis(Number(tenderId));
        }
    }, [tenderId]);

    const loadTenderAnalysis = async (id: number) => {
        try {
            setLoading(true);
            toast({ title: "Analyzing Tender..." });

            // 1. Get Tender Dets
            const tender = await bidsApi.getById(id);
            setRequirement(tender.title);

            // 2. Run AI Analysis
            const result = await bidsApi.analyze(id);
            setDecision(result);

            toast({ title: "Analysis Complete", description: "AI has selected a winner." });

            // 3. Map rankings back to bids for visualization (best effort)
            if (result.rankings) {
                const mappedBids: AwardBid[] = result.rankings.map((r: any, idx: number) => ({
                    id: String(idx),
                    supplier_name: r.supplier || "Unknown",
                    price: 0, // Backend analysis results might not echo price back in rankings yet, need to fix backend or just show score
                    delivery_days: 0,
                    reputation_score: 5,
                    is_verified: true,
                    notes: `Score: ${r.total_score}`
                }));
                setBids(mappedBids);
            }

        } catch (error) {
            console.error(error);
            toast({ title: "Analysis Failed", description: "Could not analyze tender.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const addBid = () => {
        setBids((prev) => [
            ...prev,
            { id: nextId(), supplier_name: "", price: 0, delivery_days: 0, reputation_score: 5 },
        ]);
    };

    const updateBid = (id: string, field: keyof AwardBid, value: string | number) => {
        setBids((prev) =>
            prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
        );
    };

    const removeBid = (id: string) => {
        if (bids.length <= 2) return;
        setBids((prev) => prev.filter((b) => b.id !== id));
        setDecision(null);
    };

    const validBids = bids.filter(
        (b) => b.supplier_name.trim() && (b.price > 0 || tenderId) // Relax validation if viewing analysis
    );

    const handleCompare = async () => {
        if (validBids.length < 2) {
            toast({ title: "Invalid Input", description: "Add at least 2 bids.", variant: "destructive" });
            return;
        }
        setLoading(true);
        setDecision(null);
        try {
            const result = await awardsApi.compare(requirement, validBids);
            setDecision(result);
            toast({ title: "Comparison Complete" });
        } catch (e) {
            toast({ title: "Error", description: "Comparison failed.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // ... rest of the render logic remains ...


    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Market Comparison</h2>
                <p className="text-gray-500 mt-1">
                    Compare bids with AI-driven scoring and justification.
                </p>
                {tenderId && (
                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block">
                        Analyzed Tender #{tenderId}
                    </div>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirement description
                </label>
                <input
                    type="text"
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g. TMT Steel supply for Phase 1"
                />

                {!tenderId && (
                    <div className="mt-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Bids</h3>
                        <button
                            type="button"
                            onClick={addBid}
                            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
                        >
                            <Plus size={18} /> Add bid
                        </button>
                    </div>
                )}

                {/* Bids List (Simplified for Analysis View) */}
                <div className="space-y-4 mt-4">
                    {bids.map((bid, index) => (
                        <div key={bid.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border p-4 rounded-lg">
                            <div className="md:col-span-4">
                                <label className="text-xs font-medium text-gray-500">Supplier</label>
                                <input
                                    value={bid.supplier_name}
                                    onChange={(e) => updateBid(bid.id, "supplier_name", e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-md"
                                    placeholder="Supplier Name"
                                    disabled={!!tenderId}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-xs font-medium text-gray-500">Price (₹)</label>
                                <input
                                    type="number"
                                    value={bid.price || ""}
                                    onChange={(e) => updateBid(bid.id, "price", Number(e.target.value))}
                                    className="w-full mt-1 p-2 border rounded-md"
                                    placeholder="0"
                                    disabled={!!tenderId}
                                />
                            </div>
                            {!tenderId && (
                                <div className="md:col-span-1">
                                    <button onClick={() => removeBid(bid.id)} className="text-red-500 text-sm mt-8">Remove</button>
                                </div>
                            )}
                            {tenderId && (
                                <div className="md:col-span-5">
                                    <span className="text-xs text-gray-500">Analysis Note</span>
                                    <div className="text-sm font-medium">{bid.notes}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>


                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleCompare}
                        disabled={loading || (validBids.length < 2 && !tenderId)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Gavel size={20} />}
                        {tenderId ? "Re-run Analysis" : "Compare Bids"}
                    </button>
                </div>
            </motion.div>

            {decision && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 rounded-2xl border border-green-100 p-8"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-full text-green-700">
                            <CheckCircle2 size={32} />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-green-900">
                                    Recommendation: Award to {decision.meta?.winner_name || "Best Bidder"}
                                </h3>
                                <p className="text-green-800 mt-2 text-lg leading-relaxed">
                                    {decision.justification}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="bg-white p-4 rounded-xl border border-green-100">
                                    <p className="text-sm text-gray-500">Total Score</p>
                                    <p className="text-2xl font-bold text-gray-900">{decision.score.toFixed(1)}/100</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={<div>Loading comparison...</div>}>
            <CompareContent />
        </Suspense>
    )
}
