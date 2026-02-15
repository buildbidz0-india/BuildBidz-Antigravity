
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera as CameraIcon, Check, RotateCcw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { extractApi } from '@/lib/api';

export default function CameraScreen() {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
            base64: true, // For now, we might need base64 for OCR if API changes
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            // In real app, we would upload this or run on-device OCR
            // For roadmap demo, we will simulate OCR text extraction call
            performExtraction("SIMULATED OCR TEXT FROM IMAGE");
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required for this feature.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            performExtraction("SIMULATED OCR TEXT FROM CAMERA PHOTO");
        }
    };

    const performExtraction = async (text: string) => {
        setLoading(true);
        try {
            // Using the API which expects text. In production this would be image upload.
            // Simulating extraction delay
            const res = await extractApi.extract("INVOICE #1002\nGSTIN: 29AAAAA0000A1Z5\nTotal: 15400.00");
            setResult(res);
        } catch (err) {
            Alert.alert("Extraction Failed", String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 p-6">
            <View className="mb-8">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">Magic Extractor</Text>
                <Text className="text-gray-500">Scan invoices to extract data instantly.</Text>
            </View>

            {!image ? (
                <View className="flex-1 justify-center gap-6">
                    <TouchableOpacity
                        className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-3xl p-10 items-center justify-center"
                        onPress={takePhoto}
                    >
                        <CameraIcon size={48} className="text-gray-400 mb-4" color="#94a3b8" />
                        <Text className="text-lg font-semibold text-gray-600 dark:text-gray-300">Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 items-center"
                        onPress={pickImage}
                    >
                        <Text className="text-orange-600 font-semibold">Select from Gallery</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="flex-1">
                    <Image source={{ uri: image }} className="w-full h-64 rounded-xl mb-6 bg-gray-100" resizeMode="contain" />

                    {loading ? (
                        <View className="items-center py-8">
                            <ActivityIndicator size="large" color="#f97316" />
                            <Text className="mt-4 text-gray-500">Analyzing document...</Text>
                        </View>
                    ) : result ? (
                        <View className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800">
                            <View className="flex-row items-center mb-4 gap-2">
                                <View className="bg-green-500 rounded-full p-1">
                                    <Check size={12} color="white" />
                                </View>
                                <Text className="font-bold text-green-800 dark:text-green-300">Extraction Complete</Text>
                            </View>

                            <View className="space-y-2 mb-6">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500">Total Amount</Text>
                                    <Text className="font-bold text-gray-900 dark:text-white">₹{result.total_amount || 0}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500">GSTIN</Text>
                                    <Text className="font-mono text-gray-900 dark:text-white">{result.gstin || "N/A"}</Text>
                                </View>
                            </View>

                            <TouchableOpacity className="bg-green-600 py-3 rounded-lg items-center mb-2">
                                <Text className="text-white font-bold">Approve & Pay</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="py-3 items-center"
                                onPress={() => { setImage(null); setResult(null); }}
                            >
                                <Text className="text-gray-500">Scan Another</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            )}
        </SafeAreaView>
    );
}
