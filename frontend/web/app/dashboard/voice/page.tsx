"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Upload, Loader2 } from "lucide-react";
import { transcribeApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function VoicePage() {
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [loading, setLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size) chunksRef.current.push(e.data);
            };
            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                if (chunksRef.current.length === 0) return;
                const blob = new Blob(chunksRef.current, { type: mime });
                const file = new File([blob], "audio.webm", { type: mime });
                setLoading(true);
                setTranscript("");
                try {
                    const result = await transcribeApi.transcribe(file);
                    setTranscript(result.text || "(No speech detected)");
                    toast.success("Transcription complete.");
                } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Transcription failed.");
                } finally {
                    setLoading(false);
                }
            };
            recorder.start();
            setRecording(true);
        } catch (e) {
            toast.error("Microphone access denied or unavailable.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
            setRecording(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setTranscript("");
        try {
            const result = await transcribeApi.transcribe(file);
            setTranscript(result.text || "(No speech detected)");
            toast.success("Transcription complete.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Transcription failed.");
        } finally {
            setLoading(false);
        }
        e.target.value = "";
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Field Voice</h2>
                <p className="text-gray-500 mt-1">
                    Record or upload audio for transcription (RFI, OAC, site notes).
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
                <div className="flex flex-col sm:flex-row gap-4">
                    {!recording ? (
                        <button
                            type="button"
                            onClick={startRecording}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50"
                        >
                            <Mic size={20} /> Record
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700"
                        >
                            <Square size={20} /> Stop
                        </button>
                    )}
                    <label className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                        <Upload size={20} />
                        Upload audio
                        <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={loading}
                        />
                    </label>
                </div>

                {loading && (
                    <div className="mt-6 flex items-center gap-2 text-gray-500">
                        <Loader2 size={20} className="animate-spin" />
                        Transcribing...
                    </div>
                )}

                {transcript && !loading && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                        <p className="text-sm font-medium text-gray-500 mb-2">Transcript</p>
                        <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
