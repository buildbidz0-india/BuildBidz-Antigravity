import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Loader2 } from 'lucide-react-native';
import { api } from '../services/api';
import { Config } from '../constants/Config';

export default function AudioRecorder() {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [transcript, setTranscript] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, [recording]);

    async function startRecording() {
        try {
            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permission..');
                await requestPermission();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording..');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            setTranscript(null);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording');
        }
    }

    async function stopRecording() {
        if (!recording) return;

        console.log('Stopping recording..');
        setRecording(null);
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);

        if (uri) {
            uploadAudio(uri);
        }
    }

    async function uploadAudio(uri: string) {
        setIsProcessing(true);
        try {
            const formData = new FormData();
            // @ts-ignore - React Native FormData works this way
            formData.append('file', {
                uri: uri,
                type: 'audio/m4a', // or check file extension
                name: 'recording.m4a',
            });
            formData.append('prompt', 'Construction field log, RFI, cement grade'); // Context injection

            const response = await api.postMultipart<{ transcript: string }>('/transcribe/', formData);
            setTranscript(response.transcript);
        } catch (error: any) {
            Alert.alert('Upload Failed', error.message);
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.controls}>
                {isProcessing ? (
                    <View style={styles.statusContainer}>
                        <ActivityIndicator size="large" color="#ea580c" />
                        <Text style={styles.statusText}>Transcribing...</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.recordButton, isRecording ? styles.recording : null]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? (
                            <Square color="white" size={32} />
                        ) : (
                            <Mic color="white" size={32} />
                        )}
                    </TouchableOpacity>
                )}
                <Text style={styles.hintText}>
                    {isRecording ? 'Tap to Stop' : 'Tap to Record Site Log'}
                </Text>
            </View>

            {transcript && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultLabel}>Transcript:</Text>
                    <Text style={styles.resultText}>{transcript}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        width: '100%',
    },
    controls: {
        alignItems: 'center',
        marginBottom: 30,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ea580c', // Orange-600
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    recording: {
        backgroundColor: '#ef4444', // Red-500
        transform: [{ scale: 1.1 }],
    },
    statusContainer: {
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    hintText: {
        color: '#666',
        fontSize: 16,
    },
    resultContainer: {
        width: '100%',
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    resultLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    resultText: {
        fontSize: 16,
        color: '#1f2937',
        lineHeight: 24,
    },
});
