"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gavel, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { awardsApi, type AwardBid, type AwardDecision } from "@/lib/api";
import { toast } from "react-hot-toast";

const INITIAL_BIDS: AwardBid[] = [
    { id: "1", supplier_name: "", price: 0, delivery_days: 0, reputation_score: 5 },
    { id: "2", supplier_name: "", price: 0, delivery_days: 0, reputation_score: 5 },
];

function nextId(): string {
    return String(Date.now());
}

export default function ComparePage() {
    const [requirement, setRequirement] = useState("TMT Steel supply for Phase 1");
    const [bids, setBids] = useState<AwardBid[]>(INITIAL_BIDS);
    const [decision, setDecision] = useState<AwardDecision | null>(null);
    const [loading, setLoading] = useState(false);

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
        (b) => b.supplier_name.trim() && b.price > 0 && b.delivery_days >= 0
    );

    const handleCompare = async () => {
        if (validBids.length < 2) {
            toast.error("Add at least 2 bids with supplier name and price.");
            return;
        }
        setLoading(true);
        setDecision(null);
        try {
            const result = await awardsApi.compare(requirement, validBids);
            setDecision(result);
            toast.success("Comparison complete.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Comparison failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Market Comparison</h2>
                <p className="text-gray-500 mt-1">
                    Compare bids with AI-driven scoring and justification.
                </p>
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

                <div className="mt-4 space-y-4">
                    {bids.map((bid) => (
                        <div
                            key={bid.id}
                            className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl"
                        >
                            <input
                                placeholder="Supplier name"
                                value={bid.supplier_name}
                                onChange={(e) =>
                                    updateBid(bid.id, "supplier_name", e.target.value)
                                }
                                className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                            <input
                                type="number"
                                placeholder="Price (₹)"
                                value={bid.price || ""}
                                onChange={(e) =>
                                    updateBid(bid.id, "price", Number(e.target.value) || 0)
                                }
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                            <input
                                type="number"
                                placeholder="Delivery (days)"
                                value={bid.delivery_days || ""}
                                onChange={(e) =>
                                    updateBid(
                                        bid.id,
                                        "delivery_days",
                                        Number(e.target.value) || 0
                                    )
                                }
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    placeholder="Rep (0-10)"
                                    value={bid.reputation_score || ""}
                                    onChange={(e) =>
                                        updateBid(
                                            bid.id,
                                            "reputation_score",
                                            Number(e.target.value) || 0
                                        )
                                    }
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeBid(bid.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={handleCompare}
                    disabled={loading || validBids.length < 2}
                    className="mt-6 flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Gavel size={20} />
                    )}
                    Compare with AI
                </button>
            </motion.div>

            {decision && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 bg-green-50 flex items-center gap-3">
                        <CheckCircle2 className="text-green-600" size={24} />
                        <div>
                            <p className="font-bold text-gray-900">Recommended: {validBids.find((b) => b.id === decision.recommended_bid_id)?.supplier_name ?? decision.rankings?.[0]?.supplier ?? decision.recommended_bid_id}</p>
                            <p className="text-sm text-gray-600">Score: {decision.score.toFixed(1)}</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Rankings</p>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-2">Rank</th>
                                    <th className="pb-2">Supplier</th>
                                    <th className="pb-2">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decision.rankings?.map((r: { rank?: number; supplier?: string; total_score?: number }, i: number) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        <td className="py-2">{r.rank ?? i + 1}</td>
                                        <td className="py-2">{r.supplier ?? "—"}</td>
                                        <td className="py-2">{Number(r.total_score ?? 0).toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                            <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-2">
                                AI Justification
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {decision.justification}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
