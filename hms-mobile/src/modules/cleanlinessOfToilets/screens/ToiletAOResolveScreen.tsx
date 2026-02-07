import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Camera, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import { ToiletApi } from '../../../api/modules';
import ToiletLayout from '../components/ToiletLayout';

type NavHook = NativeStackNavigationProp<RootStackParamList>;
type RouteHook = RouteProp<RootStackParamList, 'ToiletAOResolve'>; // Need to add to types

export default function ToiletAOResolveScreen({ navigation }: { navigation: NavHook }) {
    const route = useRoute<RouteHook>();
    const { inspection } = route.params;
    const [remarks, setRemarks] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        } catch (e) {
            Alert.alert("Error", "Could not open camera");
        }
    };

    const handleSubmit = async () => {
        if (!photo) {
            Alert.alert("Required", "Please take a photo of the resolution.");
            return;
        }
        if (!remarks.trim()) {
            Alert.alert("Required", "Please enter remarks regarding the action taken.");
            return;
        }

        setSubmitting(true);
        try {
            await ToiletApi.resolveInspection(inspection.id, {
                photo,
                remarks
            });
            Alert.alert("Success", "Action taken successfully reported.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert("Error", "Failed to submit resolution. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ToiletLayout title="Resolve Issue" subtitle="Action Required" navigation={navigation}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Issue Details */}
                <View style={styles.card}>
                    <Text style={styles.label}>ISSUE REPORTED</Text>
                    <Text style={styles.issueText}>{inspection.toilet?.name || "Unknown Toilet"}</Text>
                    <Text style={styles.address}>{inspection.toilet?.address}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>QC REMARKS</Text>
                    <Text style={styles.remarksText}>{inspection.qcRemarks || "Action required immediately."}</Text>
                </View>

                {/* Proof of Action */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Proof of Resolution</Text>

                    <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
                        {photo ? (
                            <Image source={{ uri: photo }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Camera size={32} color="#94a3b8" />
                                <Text style={styles.uploadText}>Tap to Take Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>Action Remarks</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Describe the action taken..."
                        multiline
                        numberOfLines={4}
                        value={remarks}
                        onChangeText={setRemarks}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Save size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.submitText}>Mark as Resolved</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#eff6ff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
    issueText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
    address: { fontSize: 13, color: '#64748b' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
    remarksText: { fontSize: 14, color: '#ef4444', fontWeight: '500', fontStyle: 'italic' },

    section: { marginTop: 0 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginTop: 16 },
    photoBox: { height: 200, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#64748b' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', height: 100 },

    submitBtn: { flexDirection: 'row', backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
    disabledBtn: { opacity: 0.7 },
    submitText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});
