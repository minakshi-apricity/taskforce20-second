import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, RefreshControl } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ToiletApi } from "../../../api/modules";
import { useAuthContext } from "../../../auth/AuthProvider";
import ToiletLayout from "../components/ToiletLayout";
import { AlertCircle, MapPin, User, ArrowRight, Calendar } from "lucide-react-native";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ToiletAODashboard({ navigation }: { navigation: Nav }) {
    const { auth } = useAuthContext();
    const [inspections, setInspections] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const [statsRes, inspectionsRes] = await Promise.all([
                ToiletApi.getDashboardStats(),
                ToiletApi.listInspections({ status: "ACTION_REQUIRED" })
            ]);
            setStats(statsRes);
            setInspections(inspectionsRes.inspections || []);
        } catch (err) {
            console.log("Failed to load AO dashboard", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ToiletAOResolve", { inspection: item })}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <View style={styles.urgentBadge}>
                    <AlertCircle size={12} color="#dc2626" />
                    <Text style={styles.urgentText}>ACTION REQUIRED</Text>
                </View>
                <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.toiletName} numberOfLines={1}>{item.toilet?.name || "Unknown Location"}</Text>
                <View style={styles.infoRow}>
                    <MapPin size={12} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.toilet?.address || "---"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <User size={12} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.infoText}>Reported by: {item.employee?.name || "---"}</Text>
                </View>
                {item.qcRemarks && (
                    <View style={styles.remarksBox}>
                        <Text style={styles.remarksLabel}>QC Notes:</Text>
                        <Text style={styles.remarksText} numberOfLines={2}>{item.qcRemarks}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.footerText}>Tap to resolve issue</Text>
                <View style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Take Action</Text>
                    <ArrowRight size={12} color="#fff" style={{ marginLeft: 4 }} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ToiletLayout
            title="Action Officer"
            subtitle="Field Resolution"
            navigation={navigation}
            showBack={false}
        >
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#dc2626" /></View>
                ) : (
                    <FlatList
                        ListHeaderComponent={
                            <View style={styles.header}>
                                <View style={styles.statsCard}>
                                    <View style={styles.statRow}>
                                        <View style={styles.iconBox}>
                                            <AlertCircle size={24} color="#dc2626" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.statValue}>{inspections.length}</Text>
                                            <Text style={styles.statLabel}>Pending Actions</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.statsHint}>Field verification and resolution required</Text>
                                </View>

                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>ACTION QUEUE ({inspections.length})</Text>
                                    <TouchableOpacity onPress={() => loadData(true)}>
                                        <Text style={styles.refreshText}>Refresh</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        }
                        data={inspections}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => { setRefreshing(true); loadData(true); }}
                                tintColor="#dc2626"
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <AlertCircle size={48} color="#10b981" style={{ marginBottom: 10 }} />
                                <Text style={styles.emptyTitle}>All Clear!</Text>
                                <Text style={styles.emptySub}>No pending actions at this time.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingBottom: 40 },
    header: { padding: 24, paddingBottom: 12 },

    statsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#fee2e2', shadowColor: '#dc2626', shadowOpacity: 0.12, shadowRadius: 12, elevation: 3 },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
    iconBox: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 36, fontWeight: '900', color: '#dc2626' },
    statLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
    statsHint: { fontSize: 12, color: '#94a3b8', marginTop: 6, lineHeight: 18 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.2 },
    refreshText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },

    card: { backgroundColor: "#fff", borderRadius: 20, marginHorizontal: 24, marginBottom: 18, elevation: 3, shadowColor: "#64748b", shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#fee2e2', borderLeftWidth: 5, borderLeftColor: '#dc2626' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    urgentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 },
    urgentText: { fontSize: 11, fontWeight: '800', color: '#dc2626' },
    timeText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

    cardBody: { padding: 18 },
    toiletName: { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    addressText: { fontSize: 13, color: "#94a3b8", flex: 1 },
    infoText: { fontSize: 13, color: "#64748b", fontWeight: '600' },
    remarksBox: { marginTop: 10, backgroundColor: '#fffbeb', padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
    remarksLabel: { fontSize: 11, fontWeight: '800', color: '#92400e', marginBottom: 4 },
    remarksText: { fontSize: 13, color: '#78350f', fontStyle: 'italic', lineHeight: 18 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingTop: 14, backgroundColor: '#fef2f2', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    footerText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, shadowColor: '#dc2626', shadowOpacity: 0.3, shadowRadius: 6, elevation: 2 },
    actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

    empty: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8 }
});
