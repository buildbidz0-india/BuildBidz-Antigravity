"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { coordinationApi, type CoordinationRequest, type CoordinationResult } from "@/lib/api";

interface SendNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultProjectName?: string;
}

export default function SendNotificationModal({
    isOpen,
    onClose,
    defaultProjectName = "",
}: SendNotificationModalProps) {
    const [form, setForm] = useState<Partial<CoordinationRequest>>({
        contractor_name: "",
        phone_number: "",
        language: "hinglish",
        step: "award_notification",
        project_name: defaultProjectName,
        details: { message: "Aapka bid accept ho gaya hai. Site par milte hain." },
    });
    const [result, setResult] = useState<CoordinationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.contractor_name?.trim() || !form.phone_number?.trim() || !form.project_name?.trim()) {
            toast.error("Fill contractor name, phone, and project name.");
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const res = await coordinationApi.send(form as CoordinationRequest);
            setResult(res);
            toast.success("Message generated.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to generate notification.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!result?.whatsapp_formatted) return;
        navigator.clipboard.writeText(result.whatsapp_formatted);
        setCopied(true);
        toast.success("Copied to clipboard.");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Send notification</h3>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contractor name</label>
                                <input
                                    type="text"
                                    value={form.contractor_name ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, contractor_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                                <input
                                    type="text"
                                    value={form.phone_number ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    placeholder="+91..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
                                <input
                                    type="text"
                                    value={form.project_name ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <select
                                    value={form.language ?? "hinglish"}
                                    onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as CoordinationRequest["language"] }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                >
                                    <option value="english">English</option>
                                    <option value="hindi">Hindi</option>
                                    <option value="hinglish">Hinglish</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notification type</label>
                                <select
                                    value={form.step ?? "award_notification"}
                                    onChange={(e) => setForm((f) => ({ ...f, step: e.target.value as CoordinationRequest["step"] }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                >
                                    <option value="award_notification">Award notification</option>
                                    <option value="site_ready">Site ready</option>
                                    <option value="payment_released">Payment released</option>
                                    <option value="defect_notice">Defect notice</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50"
                            >
                                {loading ? "Generating..." : <><Send size={18} /> Generate message</>}
                            </button>
                        </form>
                        {result && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">WhatsApp message</p>
                                <div className="p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 whitespace-pre-wrap">
                                    {result.whatsapp_formatted}
                                </div>
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    className="mt-3 flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? "Copied" : "Copy to clipboard"}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
