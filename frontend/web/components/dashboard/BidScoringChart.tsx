"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { AwardDecision } from "@/lib/api";

const FALLBACK_DATA = [
    { name: "Larsen & Toubro", price: 98, score: 92, delivery: 95 },
    { name: "Tata Projects", price: 95, score: 88, delivery: 90 },
    { name: "NCC Ltd", price: 85, score: 78, delivery: 75 },
    { name: "Shapoorji", price: 92, score: 85, delivery: 88 },
];

interface BidScoringChartProps {
    decision?: AwardDecision | null;
    loading?: boolean;
}

export default function BidScoringChart({ decision, loading }: BidScoringChartProps) {
    const data =
        decision?.rankings?.map((r) => ({
            name: (r.supplier as string | undefined) ?? "",
            score: Number(r.total_score ?? r.score ?? 0),
            price: (r.breakdown as { price?: number } | undefined)?.price ?? undefined,
        })) ?? FALLBACK_DATA;

    const chartData = data.map((d) => ({
        ...d,
        price: d.price ?? d.score,
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col p-6">
            <div className="mb-6 space-y-1">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Bid Analysis</h3>
                <p className="text-sm text-gray-500">
                    AI-driven evaluation based on Price, Delivery & Reputation
                </p>
            </div>

            <div className="flex-1 min-h-[300px] w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            barGap={2}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                            />
                            <Tooltip
                                cursor={{ fill: "#f8fafc" }}
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            <Bar
                                dataKey="score"
                                name="AI Score"
                                fill="#0f172a" // Navy
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                            <Bar
                                dataKey="price"
                                name="Price Competitiveness"
                                fill="#cbd5e1" // Slate 300
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {decision?.justification && (
                <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                            AI Insight
                        </p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {decision.justification}
                    </p>
                </div>
            )}
        </div>
    );
}
