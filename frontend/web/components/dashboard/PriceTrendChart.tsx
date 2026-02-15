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
import { forecastApi, type ForecastResult } from "@/lib/api";

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function PriceTrendChart() {
    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        forecastApi
            .analyze({ material: "steel", region: "delhi_ncr", quantity: 10 })
            .then(setForecast)
            .catch(() => setForecast(null))
            .finally(() => setLoading(false));
    }, []);

    const baseData =
        forecast?.historical_data?.map((p) => ({
            month: formatDateLabel(p.date),
            actual: p.price,
            forecast: null as number | null,
        })) ?? [];
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

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Steel Price Forecast (TMT)</h3>
                        <p className="text-sm text-gray-500">6-month trend analysis & AI prediction</p>
                    </div>
                </div>
                <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
                </div>
            </div>
        );
    }

    const lockBadge = forecast?.lock_rate_recommendation ? (
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-lg">
            LOCK recommended
        </span>
    ) : (
        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">
            WAIT
        </span>
    );

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Steel Price Forecast (TMT)</h3>
                    <p className="text-sm text-gray-500">
                        {forecast?.region ?? "Delhi NCR"} · AI trend & lock recommendation
                    </p>
                </div>
                {forecast && lockBadge}
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            domain={["dataMin - 1000", "dataMax + 1000"]}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            name="Actual Price"
                            stroke="#1F2937"
                            strokeWidth={2}
                            fill="transparent"
                        />
                        {forecast?.forecast_price_30d != null && (
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                name="AI Forecast"
                                stroke="#F97316"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                connectNulls
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {forecast?.ai_analysis && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        AI Analysis
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{forecast.ai_analysis}</p>
                </div>
            )}
        </div>
    );
}
