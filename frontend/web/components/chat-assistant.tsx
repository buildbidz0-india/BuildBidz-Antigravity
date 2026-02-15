"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles
} from "lucide-react";
import { aiApi } from "@/lib/api";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatAssistantProps {
    context: string;
    projectName: string;
}

export default function ChatAssistant({ context, projectName }: ChatAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
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

        const userMessage: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const chatMessages = [...messages, userMessage].map((m) => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
            }));
            const data = await aiApi.chat(chatMessages, context);
            const assistantMessage: Message = {
                role: "assistant",
                content: data.content,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I'm having trouble connecting to the BuildBidz AI service. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-[400px] h-[600px] rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col mb-4"
                    >
                        {/* Header */}
                        <div className="bg-orange-600 p-6 flex items-center justify-between text-white">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-500/30 rounded-xl">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold">BuildBidz Assistant</h4>
                                    <p className="text-xs text-orange-100 capitalize">{projectName} Context</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-orange-700/50 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
                        >
                            {messages.length === 0 && (
                                <div className="text-center py-10 px-4">
                                    <div className="inline-flex p-4 bg-orange-100 text-orange-600 rounded-2xl mb-4">
                                        <Sparkles size={32} />
                                    </div>
                                    <h5 className="font-bold text-gray-900 mb-2">How can I help you today?</h5>
                                    <p className="text-sm text-gray-500">
                                        I have full context on the <span className="text-orange-600 font-semibold">{projectName}</span> project. Ask me about milestones, team members, or project updates.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex max-w-[85%] space-x-2 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                                        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${msg.role === "user" ? "bg-orange-100 text-orange-600" : "bg-white border border-gray-100 text-gray-400"
                                            }`}>
                                            {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm ${msg.role === "user"
                                                ? "bg-orange-600 text-white rounded-tr-none shadow-md shadow-orange-100"
                                                : "bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-sm"
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex space-x-2">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                                            <Bot size={16} />
                                        </div>
                                        <div className="p-4 bg-white border border-gray-100 text-gray-400 rounded-2xl rounded-tl-none flex items-center space-x-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-gray-100 bg-white">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type your question..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:bg-white transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-2 p-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:hover:bg-orange-600 transition-colors shadow-sm"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-3 p-4 rounded-2xl shadow-xl transition-all ${isOpen
                        ? "bg-white text-gray-600 border border-gray-100"
                        : "bg-orange-600 text-white shadow-orange-100"
                    }`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                {!isOpen && <span className="font-bold pr-2">Ask Assistant</span>}
            </motion.button>
        </div>
    );
}
