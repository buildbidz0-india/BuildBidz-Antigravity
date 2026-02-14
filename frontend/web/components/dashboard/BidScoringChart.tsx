
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming UI components exist or I'll use standard HTML

const data = [
    { name: 'Larsen & Toubro', price: 98, score: 92, delivery: 95 },
    { name: 'Tata Projects', price: 95, score: 88, delivery: 90 },
    { name: 'NCC Ltd', price: 85, score: 78, delivery: 75 },
    { name: 'Shapoorji', price: 92, score: 85, delivery: 88 },
];

export default function BidScoringChart() {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Bid Analysis & Scoring</h3>
                <p className="text-sm text-gray-500">AI-driven evaluation based on Price, Delivery & Reputation</p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="score" name="AI Score" fill="#F97316" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="price" name="Price Competitiveness" fill="#9CA3AF" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
