
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
    { month: 'Jan', actual: 42000, forecast: 42000 },
    { month: 'Feb', actual: 43500, forecast: 43200 },
    { month: 'Mar', actual: 44100, forecast: 44000 },
    { month: 'Apr', actual: 43800, forecast: 44500 },
    { month: 'May', actual: null, forecast: 45200 },
    { month: 'Jun', actual: null, forecast: 46100 },
    { month: 'Jul', actual: null, forecast: 46800 },
];

export default function PriceTrendChart() {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Steel Price Forecast (TMT)</h3>
                    <p className="text-sm text-gray-500">6-month trend analysis & AI prediction</p>
                </div>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg">High Volatility</span>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
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
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area
                            type="monotone"
                            dataKey="forecast"
                            name="AI Forecast"
                            stroke="#F97316"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorForecast)"
                        />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            name="Actual Price"
                            stroke="#1F2937"
                            strokeWidth={2}
                            fill="transparent"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
