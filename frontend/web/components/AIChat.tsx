"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, X, Sparkles, MessageSquare } from "lucide-react";
import { aiApi, awardsApi, forecastApi, ChatMessage, type AwardBid } from "@/lib/api";
import { cn } from "@/lib/utils";

const SAMPLE_BIDS: AwardBid[] = [
    { id: "c1", supplier_name: "L&T", price: 1480000, delivery_days: 21, reputation_score: 9.2 },
    { id: "c2", supplier_name: "Tata Projects", price: 1520000, delivery_days: 18, reputation_score: 8.8 },
    { id: "c3", supplier_name: "NCC", price: 1420000, delivery_days: 28, reputation_score: 7.5 },
];

interface AIChatProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AIChat({ projectId, isOpen, onClose }: AIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await aiApi.ragChat(input);
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: response.content,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("AI Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again later." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const runQuickAction = async (label: string, fn: () => Promise<string>) => {
        setMessages((prev) => [...prev, { role: "user", content: label }]);
        setIsLoading(true);
        try {
            const content = await fn();
            setMessages((prev) => [...prev, { role: "assistant", content }]);
        } catch (e) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Request failed"}.` },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompareBids = () =>
        runQuickAction("Compare sample bids", async () => {
            const d = await awardsApi.compare("TMT Steel supply", SAMPLE_BIDS);
            const winner = d.rankings?.[0] as { supplier?: string } | undefined;
            return `**Bid comparison result**\n\nRecommended: **${winner?.supplier ?? d.recommended_bid_id}** (score: ${d.score.toFixed(1)})\n\n**AI Justification:**\n${d.justification}`;
        });

    const handleForecast = () =>
        runQuickAction("Steel price forecast", async () => {
            const f = await forecastApi.analyze({ material: "steel", region: "delhi_ncr", quantity: 10 });
            const rec = f.lock_rate_recommendation ? "**LOCK** (recommended)" : "**WAIT**";
            return `**Steel (TMT) forecast – Delhi NCR**\n\nTrend: ${f.trend_direction}\nCurrent: ₹${f.current_price.toLocaleString()}/Ton\n30-day forecast: ₹${f.forecast_price_30d.toLocaleString()}\n\nRecommendation: ${rec}\n\n**AI Analysis:**\n${f.ai_analysis}`;
        });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-orange-600 text-white flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">Project Copilot</h3>
                                <p className="text-white/70 text-xs mt-1">Experimental AI Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                    >
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                                    <Bot size={32} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">How can I help today?</h4>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Ask me anything, or use a quick action below.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <button
                                        type="button"
                                        onClick={handleCompareBids}
                                        disabled={isLoading}
                                        className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-sm font-medium border border-orange-100 disabled:opacity-50"
                                    >
                                        Compare sample bids
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleForecast}
                                        disabled={isLoading}
                                        className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-50"
                                    >
                                        Steel price forecast
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    "flex items-start space-x-3",
                                    msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                        msg.role === "user" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                    )}
                                >
                                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div
                                    className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed max-w-[80%]",
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-start space-x-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Bot size={16} />
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100">
                                    <Loader2 size={20} className="animate-spin text-orange-600" />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-6 border-t border-gray-100">
                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Ask your project assistant..."
                                className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-orange-600 focus:bg-white transition-all outline-none text-sm group-hover:border-gray-300"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-2 p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
