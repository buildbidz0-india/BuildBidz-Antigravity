import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, CheckCircle, Smartphone } from 'lucide-react-native';
import { api, ExtractResponse } from '../../services/api';

export default function CameraScreen() {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<ExtractResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async (mode: 'camera' | 'gallery') => {
        let result;
        if (mode === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required.');
                return;
            }
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });
        }

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setResult(null); // Reset previous result
        }
    };

    const handleUpload = async () => {
        if (!image) return;

        setLoading(true);
        try {
            // NOTE: The backend currently only accepts TEXT for /extract.
            // Phase 10.1 (Advanced Features) adds /extract/upload for images.
            // For now, we'll mock the OCR step or use a workaround if the backend had it.
            // Since the roadmap says "Mobile Extractor: Camera Scan -> Upload -> OCR",
            // I will assume the backend accepts a file on /extract/upload OR I need to implement it.
            //
            // Checking backend code... 
            // The backend current implementation of `extract.py` takes `ExtractRequest` body (text).
            // The Roadmap says Phase 10.1 "Image Upload -> OCR -> Extract" is TODO.
            // 
            // CRITICAL: I cannot fully implement this without backend support.
            // I will implement the UI and a "Mock" upload that fails or 
            // I should quickly add the backend endpoint if I can.
            // 
            // Given I am in "Mobile Integration", I should probably stub this or 
            // try to send to `POST /extract/upload` and if it fails, alert user.

            // For now, I'll assume the endpoint `POST /extract/upload` will be created 
            // or I will create it. 
            // 
            // Let's try to send to `/extract/upload` with multipart.

            const formData = new FormData();
            // @ts-ignore
            formData.append('file', {
                uri: image,
                type: 'image/jpeg',
                name: 'invoice.jpg',
            });

            // If the backend doesn't have this, it will 404.
            // I'll leave a TODO comment here for the backend part.
            // Or better, I'll switch to using the /transcribe endpoint as a test if needed,
            // but let's stick to the plan.

            // To make this usable right now without backend changes, I might need to 
            // skip the actual API call or accept that it will fail until Phase 10.1 is done.
            // 
            // However, the user wants "Mobile Integration".
            // I will implement the client side fully.

            const response = await api.postMultipart<ExtractResponse>('/extract/upload', formData);
            setResult(response);
            Alert.alert('Success', 'Invoice extracted!');

        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Extraction failed. (Backend /extract/upload might be missing)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>Magic Extractor</Text>
                    <Text style={styles.subtitle}>
                        Snap a photo of an invoice or receipt. AI will extract the data.
                    </Text>
                </View>

                {image ? (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: image }} style={styles.image} />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setImage(null)}>
                            <Text style={styles.closeText}>×</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.cardBtn} onPress={() => pickImage('camera')}>
                            <Camera size={48} color="#f97316" />
                            <Text style={styles.btnText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cardBtn} onPress={() => pickImage('gallery')}>
                            <Upload size={48} color="#f97316" />
                            <Text style={styles.btnText}>Upload</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {image && !result && (
                    <TouchableOpacity
                        style={[styles.processBtn, loading && styles.disabledBtn]}
                        onPress={handleUpload}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.processText}>Extract Data</Text>}
                    </TouchableOpacity>
                )}

                {result && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <CheckCircle color="green" size={24} />
                            <Text style={styles.resultTitle}>Extraction Complete</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Vendor:</Text>
                            <Text style={styles.value}>{result.vendor_name || 'Unknown'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>GSTIN:</Text>
                            <Text style={styles.value}>{result.gstin || 'Not found'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total:</Text>
                            <Text style={styles.value}>₹{result.total_amount?.toFixed(2) || '0.00'}</Text>
                        </View>
                        <Text style={styles.label}>Items:</Text>
                        {result.line_items.map((item, i) => (
                            <Text key={i} style={styles.itemText}>• {item.qty} x {item.description} ({item.unit_price})</Text>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    scroll: { padding: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },
    actionButtons: { flexDirection: 'row', gap: 16, marginTop: 20 },
    cardBtn: {
        flex: 1, backgroundColor: 'white', padding: 30, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3
    },
    btnText: { marginTop: 12, fontWeight: '600', color: '#374151' },
    previewContainer: { borderRadius: 16, overflow: 'hidden', height: 300, marginBottom: 20, position: 'relative' },
    image: { width: '100%', height: '100%' },
    closeButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    closeText: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: -2 },
    processBtn: { backgroundColor: '#f97316', padding: 16, borderRadius: 12, alignItems: 'center' },
    disabledBtn: { opacity: 0.7 },
    processText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    resultCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginTop: 20, shadowOpacity: 0.1, elevation: 3 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#065f46' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 },
    label: { color: '#6b7280', fontWeight: '500' },
    value: { fontWeight: 'bold', color: '#111827' },
    itemText: { color: '#374151', marginLeft: 10, marginTop: 4 },
});
