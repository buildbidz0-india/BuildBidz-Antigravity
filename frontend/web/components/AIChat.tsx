"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, X, Sparkles, MessageSquare } from "lucide-react";
import { aiApi, ChatMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

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
                                        Ask me anything about your project drawings, site updates, or safety protocols.
                                    </p>
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
