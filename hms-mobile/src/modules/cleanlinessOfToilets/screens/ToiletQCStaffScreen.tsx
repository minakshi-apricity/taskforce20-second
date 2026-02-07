import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ToiletApi } from '../../../api/modules';
import ToiletLayout from '../components/ToiletLayout';

import { MapPin, User, Shield } from 'lucide-react-native';

export default function ToiletStaffScreen({ navigation }: any) {
    const [staff, setStaff] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const load = async () => {
        try {
            const res = await ToiletApi.listEmployees();
            setStaff(res.employees || []);
        } catch (e) { } finally { setLoading(false); }
    };

    useFocusEffect(React.useCallback(() => { load(); }, []));

    return (
        <ToiletLayout title="Staff Management" navigation={navigation} showBack={true}>
            <View style={styles.screen}>
                <FlatList
                    data={staff}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <View style={styles.staffCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.avatar}>
                                    <User size={20} color="#2563eb" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.staffName}>{item.name}</Text>
                                    <Text style={styles.staffRole}>Action Officer</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                                    <Text style={[styles.statusText, { color: '#166534' }]}>ACTIVE</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <MapPin size={14} color="#64748b" style={{ marginRight: 6 }} />
                                    <Text style={styles.statLabel}>{item.assignedWardIds?.length || 0} Wards</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Shield size={14} color="#64748b" style={{ marginRight: 6 }} />
                                    <Text style={styles.statLabel}>Toilet Module</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.actionBtn}>
                                <Text style={styles.actionText}>View Details</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <User size={48} color="#94a3b8" />
                            <Text style={styles.emptyTitle}>No Staff Found</Text>
                            <Text style={styles.emptySub}>No employees are currently assigned to your wards.</Text>
                        </View>
                    }
                    onRefresh={load}
                    refreshing={loading}
                />
            </View>
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },
    staffCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: '#64748b', shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    staffName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    staffRole: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, marginRight: 8, justifyContent: 'center' },
    statLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },

    actionBtn: { backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    actionText: { color: '#fff', fontSize: 12, fontWeight: '800' },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' }
});
