import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { ToiletApi } from "../../../api/modules";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import ToiletLayout from "../components/ToiletLayout";
import { MapPin, User, Bookmark, Calendar, CheckCircle2, XCircle, AlertTriangle } from "lucide-react-native";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

export default function ToiletPendingRegistrationScreen({ navigation }: { navigation: Nav }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Rejection State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const load = async (isRef = false) => {
        if (!isRef) setLoading(true);
        try {
            const res = await ToiletApi.listPendingToilets();
            setRequests(res.toilets || []);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const confirmApprove = (id: string) => {
        Alert.alert("Confirm Approval", "Are you sure you want to approve this registration?", [
            { text: "Cancel", style: "cancel" },
            { text: "Approve", onPress: () => processApprove(id) }
        ]);
    };

    const processApprove = async (id: string) => {
        try {
            await ToiletApi.approveToilet(id, {});
            Alert.alert("Success", "Toilet approved and added to master list.");
            load(true);
        } catch (e) {
            Alert.alert("Error", "Approval failed.");
        }
    };

    const initiateReject = (id: string) => {
        setSelectedId(id);
        setRejectReason("");
        setRejectModalVisible(true);
    };

    const processReject = async () => {
        if (!processReject || !selectedId) return;
        if (!rejectReason.trim()) {
            Alert.alert("Required", "Rejection reason is mandatory.");
            return;
        }

        try {
            await ToiletApi.rejectToilet(selectedId, rejectReason);
            setRejectModalVisible(false);
            Alert.alert("Rejected", "Registration request rejected.");
            load(true);
        } catch (e) {
            Alert.alert("Error", "Action failed.");
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.typeTag}>
                        <Text style={styles.typeText}>{item.type}</Text>
                    </View>
                </View>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <MapPin size={14} color="#64748b" />
                    <Text style={styles.detailText} numberOfLines={1}>{item.ward?.name || 'Unknown Ward'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <User size={14} color="#64748b" />
                    <Text style={styles.detailText}>Req by: {item.requestedBy?.name || 'Employee'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Bookmark size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.gender} • {item.numberOfSeats} Seats</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.rejBtn} onPress={() => initiateReject(item.id)}>
                    <Text style={styles.rejBtnText}>REJECT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.appBtn} onPress={() => confirmApprove(item.id)}>
                    <Text style={styles.appBtnText}>APPROVE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ToiletLayout
            title="Registration Requests"
            subtitle="QC Approval"
            navigation={navigation}
            showBack={true}
        >
            <SafeAreaView style={styles.safe}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
                ) : (
                    <FlatList
                        data={requests}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#2563eb" />}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={{ fontSize: 40, marginBottom: 10 }}>👍</Text>
                                <Text style={styles.emptyTitle}>No Pending Requests</Text>
                                <Text style={styles.emptySub}>All new toilet registrations have been processed.</Text>
                            </View>
                        }
                    />
                )}

                {/* Rejection Modal */}
                <Modal
                    transparent={true}
                    visible={rejectModalVisible}
                    animationType="fade"
                    onRequestClose={() => setRejectModalVisible(false)}
                >
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Reject Request</Text>
                            </View>
                            <Text style={styles.modalSub}>Reason for rejecting this toilet registration:</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Duplicate entry, Incorrect location..."
                                multiline
                                numberOfLines={3}
                                value={rejectReason}
                                onChangeText={setRejectReason}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setRejectModalVisible(false)}>
                                    <Text style={styles.modalBtnCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalBtnConfirm} onPress={processReject}>
                                    <Text style={styles.modalBtnConfirmText}>Confirm Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafc" },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 40 },

    card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: "#64748b", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    headerLeft: { flex: 1, paddingRight: 8 },
    name: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    typeTag: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    typeText: { fontSize: 10, fontWeight: '800', color: '#2563eb' },
    dateText: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },

    details: { gap: 8, marginBottom: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 12, fontWeight: '600', color: '#64748b', flex: 1 },

    actions: { flexDirection: 'row', gap: 12 },
    rejBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' },
    rejBtnText: { color: '#dc2626', fontSize: 11, fontWeight: '900' },
    appBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#2563eb' },
    appBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    modalSub: { fontSize: 13, color: '#64748b', marginBottom: 16 },
    input: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, height: 80, textAlignVertical: 'top', marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtnCancel: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' },
    modalBtnConfirm: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#dc2626' },
    modalBtnCancelText: { fontWeight: '700', color: '#64748b' },
    modalBtnConfirmText: { fontWeight: '700', color: '#fff' }
});
