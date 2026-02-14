"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Database, FileUp, Sparkles, Check, AlertCircle, Loader2 } from "lucide-react";
import { aiApi } from "@/lib/api";

export default function IngestPanel() {
    const [text, setText] = useState("");
    const [isIngesting, setIsIngesting] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleIngest = async () => {
        if (!text.trim() || isIngesting) return;

        setIsIngesting(true);
        setStatus("idle");

        try {
            await aiApi.ingest(text);
            setStatus("success");
            setText("");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (error) {
            console.error("Ingestion failed:", error);
            setStatus("error");
        } finally {
            setIsIngesting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Knowledge Ingestion</h3>
                        <p className="text-gray-500 text-xs">Feed data to your Project Copilot</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Pasted Text / Snippet
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste technical requirements, safety rules, or site notes here..."
                        className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-600 focus:bg-white transition-all outline-none text-sm resize-none"
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                        <div className="p-1 px-2.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center">
                            <Sparkles size={10} className="mr-1" />
                            Auto-Indexed
                        </div>
                        {status === "success" && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-green-600 text-xs font-bold flex items-center"
                            >
                                <Check size={14} className="mr-1" />
                                Successfully indexed!
                            </motion.span>
                        )}
                        {status === "error" && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-red-600 text-xs font-bold flex items-center"
                            >
                                <AlertCircle size={14} className="mr-1" />
                                Failed to index.
                            </motion.span>
                        )}
                    </div>

                    <button
                        onClick={handleIngest}
                        disabled={isIngesting || !text.trim()}
                        className="flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed group transition-all active:scale-95"
                    >
                        {isIngesting ? (
                            <Loader2 size={18} className="animate-spin mr-2" />
                        ) : (
                            <FileUp size={18} className="mr-2 group-hover:-translate-y-0.5 transition-transform" />
                        )}
                        Index Knowledge
                    </button>
                </div>
            </div>

            <div className="px-6 py-4 bg-orange-50/50 border-t border-orange-100 flex items-start space-x-3">
                <Sparkles size={16} className="text-orange-600 mt-0.5" />
                <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                    Once indexed, the Project Copilot will be able to retrieve this information when answering questions.
                    indexing typically takes less than a minute.
                </p>
            </div>
        </div>
    );
}
