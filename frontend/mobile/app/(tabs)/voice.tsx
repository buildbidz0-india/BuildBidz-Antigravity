
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Square, Play, RotateCcw } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { transcribeApi } from '@/lib/api';

export default function VoiceScreen() {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function startRecording() {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            setTranscription(null);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert("Permission Error", "Failed to access microphone");
        }
    }

    async function stopRecording() {
        if (!recording) return;
        setIsRecording(false);
        setLoading(true);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (!uri) return;

            // Send to API
            const result = await transcribeApi.transcribe(uri);
            setTranscription(result.text);

            // Clean up could be done here
        } catch (err) {
            Alert.alert("Transcription Failed", String(err));
        } finally {
            setLoading(false);
            setRecording(null);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 justify-center items-center p-6">
            <View className="items-center mb-12">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Voice Notes</Text>
                <Text className="text-gray-500 text-center">
                    Record site observations, RFIs, or instructions.
                    AI will transcribe and format them automatically.
                </Text>
            </View>

            <View className="mb-12">
                <TouchableOpacity
                    onPress={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                    className={`w-32 h-32 rounded-full items-center justify-center shadow-lg ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                        } ${loading ? 'opacity-50' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" size="large" />
                    ) : isRecording ? (
                        <Square size={40} color="white" fill="white" />
                    ) : (
                        <Mic size={48} color="white" />
                    )}
                </TouchableOpacity>
                <Text className="text-center mt-6 font-medium text-gray-600 dark:text-gray-300">
                    {loading ? "Transcribing..." : isRecording ? "Recording... Tap to Stop" : "Tap to Record"}
                </Text>
            </View>

            {transcription && (
                <View className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl w-full border border-gray-100 dark:border-slate-700">
                    <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Transcription</Text>
                    <Text className="text-gray-800 dark:text-gray-200 leading-6">{transcription}</Text>

                    <View className="flex-row gap-4 mt-6">
                        <TouchableOpacity className="flex-1 bg-slate-900 dark:bg-slate-700 py-3 rounded-lg items-center">
                            <Text className="text-white font-medium">Save as RFI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-white border border-gray-200 py-3 rounded-lg items-center"
                            onPress={() => setTranscription(null)}
                        >
                            <Text className="text-gray-700">Discard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
