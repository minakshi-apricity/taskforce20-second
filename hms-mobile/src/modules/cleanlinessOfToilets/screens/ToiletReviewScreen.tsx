import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ToiletApi } from "../../../api/modules";
import { ChevronLeft, User, Clock, MapPin, AlertTriangle, CheckCircle2, XCircle, FileText, Send } from "lucide-react-native";

type Props = NativeStackScreenProps<RootStackParamList, "ToiletReview">;

// Helper: Haversine distance in KM
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ToiletReviewScreen({ route, navigation }: Props) {
    const { inspection } = route.params;
    const [submitting, setSubmitting] = useState(false);

    // Rejection Modal State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // Calculate distance
    const reportedDist = inspection.latitude && inspection.longitude && inspection.toilet.latitude && inspection.toilet.longitude
        ? getDistance(inspection.latitude, inspection.longitude, inspection.toilet.latitude, inspection.toilet.longitude) * 1000 // meters
        : null;

    const handleApprove = () => {
        Alert.alert(
            "Confirm Approval",
            "Are you sure you want to approve this inspection?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Approve", onPress: () => submitDecision("APPROVED") }
            ]
        );
    };

    const handleReject = () => {
        setRejectModalVisible(true);
    };

    const submitReject = () => {
        if (!rejectReason.trim()) {
            Alert.alert("Required", "Please provide a reason for rejection.");
            return;
        }
        setRejectModalVisible(false);
        submitDecision("REJECTED", rejectReason);
    };

    const submitDecision = async (status: "APPROVED" | "REJECTED", remarks?: string) => {
        setSubmitting(true);
        try {
            await ToiletApi.updateInspection(inspection.id, { status, remarks });
            Alert.alert("Success", `Inspection ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`);
            navigation.goBack();
        } catch (err: any) {
            Alert.alert("Error", err.message || "Action failed.");
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.title} numberOfLines={1}>{inspection.toilet.name}</Text>
                    <Text style={styles.subtitle}>QC INSPECTION REVIEW</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Meta Info Card */}
                <View style={styles.metaCard}>
                    <View style={styles.metaRow}>
                        <User size={14} color="#64748b" />
                        <Text style={styles.metaLabel}>Inspector:</Text>
                        <Text style={styles.metaValue}>{inspection.employee.name}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Clock size={14} color="#64748b" />
                        <Text style={styles.metaLabel}>Time:</Text>
                        <Text style={styles.metaValue}>{new Date(inspection.createdAt).toLocaleString()}</Text>
                    </View>
                    <View style={styles.divider} />

                    {/* Location Integrity */}
                    <View style={styles.metaRow}>
                        <MapPin size={14} color={reportedDist && reportedDist > 100 ? "#ea580c" : "#16a34a"} />
                        <Text style={styles.metaLabel}>Location Accuracy:</Text>
                        <Text style={[styles.metaValue, { color: reportedDist && reportedDist > 100 ? "#ea580c" : "#16a34a" }]}>
                            {reportedDist !== null ? `${reportedDist.toFixed(0)}m deviation` : "N/A"}
                        </Text>
                    </View>
                    {reportedDist && reportedDist > 100 && (
                        <View style={styles.warningBox}>
                            <AlertTriangle size={12} color="#c2410c" />
                            <Text style={styles.warningText}>High location mismatch. Verify photos carefully.</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.sectionHeader}>INSPECTION DETAILS</Text>

                {Object.entries(inspection.answers || {}).map(([questionText, data]: [string, any], idx: number) => (
                    <View key={idx} style={styles.qCard}>
                        <View style={styles.qHeader}>
                            <Text style={styles.qText}>{questionText}</Text>
                            <View style={[styles.badge, (data.answer === "YES" || data.answer === "Continuous") ? styles.badgeSuccess : styles.badgeDestructive]}>
                                {data.answer === "YES" ? <CheckCircle2 size={10} color="#166534" style={{ marginRight: 4 }} /> : <XCircle size={10} color="#991b1b" style={{ marginRight: 4 }} />}
                                <Text style={[styles.badgeText, (data.answer === "YES" || data.answer === "Continuous") ? styles.textSuccess : styles.textDestructive]}>
                                    {String(data.answer).toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {(data.photos || []).length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                                {data.photos.map((photo: string, pIdx: number) => (
                                    <View key={pIdx} style={styles.photoContainer}>
                                        <Image source={{ uri: photo }} style={styles.photo} />
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {submitting ? (
                    <ActivityIndicator color="#2563eb" />
                ) : (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={handleReject}>
                            <XCircle size={18} color="#dc2626" style={{ marginRight: 8 }} />
                            <Text style={styles.btnRejectText}>REJECT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={handleApprove}>
                            <CheckCircle2 size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.btnApproveText}>APPROVE</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Rejection Modal */}
            <Modal
                transparent={true}
                visible={rejectModalVisible}
                animationType="slide"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AlertTriangle size={24} color="#dc2626" />
                            <Text style={styles.modalTitle}>Reject Inspection</Text>
                        </View>
                        <Text style={styles.modalSub}>Please provide a reason for rejecting this inspection. This will be sent to the inspector.</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Type rejection reason..."
                            multiline
                            numberOfLines={4}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setRejectModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnConfirm} onPress={submitReject}>
                                <Text style={styles.modalBtnConfirmText}>Confirm Rejection</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backBtn: { padding: 4 },
    title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    subtitle: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 2 },
    content: { padding: 16 },

    // Meta Card
    metaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    metaLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginLeft: 8, marginRight: 4 },
    metaValue: { fontSize: 12, color: '#0f172a', fontWeight: '700', flex: 1 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
    warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', padding: 10, borderRadius: 8, marginTop: 8, gap: 8 },
    warningText: { fontSize: 11, color: '#c2410c', fontWeight: '600', flex: 1 },

    sectionHeader: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },

    // Question Card
    qCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    qText: { fontSize: 14, fontWeight: '600', color: '#334155', flex: 1, marginRight: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeSuccess: { backgroundColor: '#f0fdf4' },
    badgeDestructive: { backgroundColor: '#fef2f2' },
    badgeText: { fontSize: 10, fontWeight: '800' },
    textSuccess: { color: '#166534' },
    textDestructive: { color: '#991b1b' },
    photoScroll: { marginTop: 8 },
    photoContainer: { marginRight: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
    photo: { width: 100, height: 100 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    actionRow: { flexDirection: 'row', gap: 12 },
    btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
    btnReject: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' },
    btnApprove: { backgroundColor: '#2563eb' },
    btnRejectText: { color: '#dc2626', fontWeight: '800', fontSize: 14 },
    btnApproveText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    modalSub: { fontSize: 13, color: '#64748b', marginBottom: 20 },
    input: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, height: 100, textAlignVertical: 'top', marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtnCancel: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
    modalBtnConfirm: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#dc2626' },
    modalBtnCancelText: { fontWeight: '700', color: '#64748b' },
    modalBtnConfirmText: { fontWeight: '700', color: '#fff' }
});
