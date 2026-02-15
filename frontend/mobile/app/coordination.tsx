import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Copy, MessageSquare } from 'lucide-react-native';
import { api } from '../services/api';

export default function CoordinationScreen() {
    const [recipientName, setRecipientName] = useState('');
    const [projectPhase, setProjectPhase] = useState('');
    const [language, setLanguage] = useState<'hindi' | 'hinglish' | 'english'>('hinglish');
    const [type, setType] = useState<'award' | 'payment_release' | 'site_ready'>('site_ready');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const generateMessage = async () => {
        if (!recipientName || !projectPhase) {
            Alert.alert('Missing info', 'Please fill in contractor name and details');
            return;
        }

        setLoading(true);
        try {
            // Using the backend coordination endpoint
            const response = await api.post<{ message: string }>('/coordination/send', {
                contractor_name: recipientName,
                project_phase: projectPhase,
                language: language,
                type: type,
                amount: type === 'payment_release' ? 50000 : undefined, // Example hardcoded for prototype
                date: new Date().toISOString().split('T')[0],
            });
            setGeneratedMessage(response.message);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        if (!generatedMessage) return;
        const encoded = encodeURIComponent(generatedMessage);
        Linking.openURL(`whatsapp://send?text=${encoded}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>Contractor Coordination</Text>
                <Text style={styles.subtitle}>Generate AI messages for WhatsApp</Text>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Contractor Name</Text>
                    <TextInput
                        style={styles.input}
                        value={recipientName}
                        onChangeText={setRecipientName}
                        placeholder="e.g. Ramesh Thekedar"
                    />

                    <Text style={styles.label}>Project Detail / Context</Text>
                    <TextInput
                        style={styles.input}
                        value={projectPhase}
                        onChangeText={setProjectPhase}
                        placeholder="e.g. Ground floor slab casting ready"
                    />

                    <Text style={styles.label}>Message Type</Text>
                    <View style={styles.chipRow}>
                        {['site_ready', 'payment_release', 'award'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.chip, type === t && styles.activeChip]}
                                onPress={() => setType(t as any)}
                            >
                                <Text style={[styles.chipText, type === t && styles.activeChipText]}>
                                    {t.replace('_', ' ').toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Language</Text>
                    <View style={styles.chipRow}>
                        {['hinglish', 'hindi', 'english'].map((l) => (
                            <TouchableOpacity
                                key={l}
                                style={[styles.chip, language === l && styles.activeChip]}
                                onPress={() => setLanguage(l as any)}
                            >
                                <Text style={[styles.chipText, language === l && styles.activeChipText]}>
                                    {l.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.generateBtn}
                        onPress={generateMessage}
                        disabled={loading}
                    >
                        <Text style={styles.generateBtnText}>
                            {loading ? 'Generating...' : 'Generate AI Message'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {generatedMessage ? (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Preview:</Text>
                        <Text style={styles.messagePreview}>{generatedMessage}</Text>

                        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
                            <Send color="white" size={20} />
                            <Text style={styles.whatsappBtnText}>Send on WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    scroll: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
    formCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, shadowOpacity: 0.05 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
    activeChip: { backgroundColor: '#ffedd5', borderWidth: 1, borderColor: '#fdba74' },
    chipText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
    activeChipText: { color: '#ea580c', fontWeight: 'bold' },
    generateBtn: { backgroundColor: '#ea580c', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    generateBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    resultCard: { marginTop: 24, backgroundColor: '#dcfce7', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#86efac' },
    resultLabel: { fontSize: 12, color: '#166534', fontWeight: 'bold', marginBottom: 8 },
    messagePreview: { fontSize: 16, color: '#14532d', lineHeight: 24, marginBottom: 16 },
    whatsappBtn: { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, gap: 8 },
    whatsappBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
