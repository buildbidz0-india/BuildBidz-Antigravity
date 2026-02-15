"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { extractApi, type ExtractResult } from "@/lib/api";
import { toast } from "react-hot-toast";

const SAMPLE_OCR = `Invoice No: INV-2024-001
Vendor: ABC Steel Traders
Date: 2024-02-01
GSTIN: 27AABCU9603R1ZM
PAN: AABCU9603R

Item          Qty   Unit   Rate     Amount
TMT Bar 12mm  50    Ton    54000    2700000
Cement PPC    200   Bag    380      76000
Total Amount: Rs 27,76,000`;

export default function ExtractPage() {
    const [ocrText, setOcrText] = useState("");
    const [result, setResult] = useState<ExtractResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleExtract = async () => {
        if (!ocrText.trim()) {
            toast.error("Paste OCR text first.");
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const data = await extractApi.extract(ocrText);
            setResult(data);
            toast.success("Extraction complete.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Extraction failed.");
        } finally {
            setLoading(false);
        }
    };

    const loadSample = () => setOcrText(SAMPLE_OCR);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === "string" ? reader.result : "";
            setOcrText(text);
            setResult(null);
            toast.success("File loaded. Click Extract to run.");
        };
        reader.readAsText(file, "UTF-8");
        e.target.value = "";
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Magic Extractor</h2>
                <p className="text-gray-500 mt-1">
                    Paste invoice or receipt OCR text to get structured data (GSTIN, PAN, line items).
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">OCR text</label>
                    <textarea
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Paste invoice or receipt text here..."
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleExtract}
                            disabled={loading}
                            className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                            Extract
                        </button>
                        <label className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <Upload size={18} />
                            Upload text file
                            <input
                                type="file"
                                accept=".txt,.csv,.json,text/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={loadSample}
                            className="px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Load sample
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            {result.verification_ready ? (
                                <CheckCircle2 className="text-green-600" size={20} />
                            ) : (
                                <AlertCircle className="text-amber-600" size={20} />
                            )}
                            <span className="font-semibold text-gray-900">
                                {result.document_type}
                                {result.verification_ready ? " · Verification ready" : " · Missing GSTIN or total"}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {result.vendor_name && (
                                <div>
                                    <p className="text-xs text-gray-500">Vendor</p>
                                    <p className="font-medium">{result.vendor_name}</p>
                                </div>
                            )}
                            {result.gstin && (
                                <div>
                                    <p className="text-xs text-gray-500">GSTIN</p>
                                    <p className="font-medium font-mono">{result.gstin}</p>
                                </div>
                            )}
                            {result.pan && (
                                <div>
                                    <p className="text-xs text-gray-500">PAN</p>
                                    <p className="font-medium font-mono">{result.pan}</p>
                                </div>
                            )}
                            {result.total_amount != null && (
                                <div>
                                    <p className="text-xs text-gray-500">Total</p>
                                    <p className="font-medium">₹{result.total_amount.toLocaleString()}</p>
                                </div>
                            )}
                            {result.invoice_number && (
                                <div>
                                    <p className="text-xs text-gray-500">Invoice #</p>
                                    <p className="font-medium">{result.invoice_number}</p>
                                </div>
                            )}
                            {result.invoice_date && (
                                <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="font-medium">{result.invoice_date}</p>
                                </div>
                            )}
                        </div>
                        {result.line_items && result.line_items.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Line items</p>
                                <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="p-3">Description</th>
                                            <th className="p-3">Qty</th>
                                            <th className="p-3">Unit</th>
                                            <th className="p-3">Rate</th>
                                            <th className="p-3">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.line_items.map((item, i) => (
                                            <tr key={i} className="border-t border-gray-100">
                                                <td className="p-3">{item.description}</td>
                                                <td className="p-3">{item.quantity ?? "—"}</td>
                                                <td className="p-3">{item.unit ?? "—"}</td>
                                                <td className="p-3">{item.unit_price != null ? `₹${item.unit_price}` : "—"}</td>
                                                <td className="p-3">{item.total_price != null ? `₹${item.total_price.toLocaleString()}` : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
