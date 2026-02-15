"use client";

import { useState, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { forecastApi, type ForecastResult, type ForecastMaterial, type ForecastRegion } from "@/lib/api";

const MATERIALS: { value: ForecastMaterial; label: string }[] = [
    { value: "steel", label: "Steel (TMT)" },
    { value: "cement", label: "Cement" },
    { value: "sand", label: "Sand" },
    { value: "tiles", label: "Tiles" },
    { value: "fittings", label: "Fittings" },
];
const REGIONS: { value: ForecastRegion; label: string }[] = [
    { value: "delhi_ncr", label: "Delhi NCR" },
    { value: "patna", label: "Patna" },
    { value: "lucknow", label: "Lucknow" },
    { value: "indore", label: "Indore" },
];

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export interface PriceTrendChartProps {
    forecast: ForecastResult | null;
    loading: boolean;
    material: ForecastMaterial;
    region: ForecastRegion;
    onConfigChange: (material: ForecastMaterial, region: ForecastRegion) => void;
}

export default function PriceTrendChart({ forecast, loading, material, region, onConfigChange }: PriceTrendChartProps) {
    const baseData =
        forecast?.historical_data?.map((p) => ({
            month: formatDateLabel(p.date),
            actual: p.price,
            forecast: null as number | null,
        })) ?? [];

    // Sort baseData by date if needed, but assuming API returns sorted.

    const chartData =
        baseData.length && forecast
            ? [
                ...baseData,
                {
                    month: "30d f/c",
                    actual: null as number | null,
                    forecast: forecast.forecast_price_30d,
                },
            ]
            : baseData;

    const lockBadge = forecast?.lock_rate_recommendation ? (
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-md border border-amber-200">
            LOCK NOW
        </span>
    ) : (
        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md border border-emerald-200">
            WAIT
        </span>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Price Forecast</h3>
                    <p className="text-sm text-gray-500">Market Trend Analysis</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={material}
                        onChange={(e) => onConfigChange(e.target.value as ForecastMaterial, region)}
                        className="text-sm h-9 border border-input rounded-md px-3 bg-background hover:bg-accent/5 focus:ring-2 focus:ring-ring focus:border-input transition-colors cursor-pointer"
                    >
                        {MATERIALS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <select
                        value={region}
                        onChange={(e) => onConfigChange(material, e.target.value as ForecastRegion)}
                        className="text-sm h-9 border border-input rounded-md px-3 bg-background hover:bg-accent/5 focus:ring-2 focus:ring-ring focus:border-input transition-colors cursor-pointer"
                    >
                        {REGIONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    {forecast && !loading && lockBadge}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                domain={["dataMin - 500", "dataMax + 500"]}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            <Area
                                type="monotone"
                                dataKey="actual"
                                name="Current Price"
                                stroke="#0f172a"
                                strokeWidth={2}
                                fill="transparent"
                            />
                            {forecast?.forecast_price_30d != null && (
                                <Line
                                    type="monotone"
                                    dataKey="forecast"
                                    name="AI Forecast"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                                    connectNulls
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {forecast?.ai_analysis && !loading && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        AI Analysis
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-3">{forecast.ai_analysis}</p>
                </div>
            )}
        </div>
    );
}
