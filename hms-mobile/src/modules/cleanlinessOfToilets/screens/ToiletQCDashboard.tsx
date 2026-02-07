import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, RefreshControl, ScrollView, Dimensions } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ToiletApi } from "../../../api/modules";
import { useAuthContext } from "../../../auth/AuthProvider";
import ToiletLayout from "../components/ToiletLayout";
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, MapPin, User, Building2, Users } from "lucide-react-native";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

export default function ToiletQCDashboard({ navigation }: { navigation: Nav }) {
    const { auth } = useAuthContext();
    const [stats, setStats] = useState<any>(null);
    const [inspections, setInspections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');

    const loadData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const [statsRes, inspectionsRes] = await Promise.all([
                ToiletApi.getDashboardStats(),
                ToiletApi.listInspections({ pageSize: 10 })
            ]);
            setStats(statsRes);
            setInspections(inspectionsRes.inspections || []);
        } catch (err) {
            console.log("Failed to load QC dashboard", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const currentStats = stats?.[filter] || stats?.today || {};

    const renderInspectionItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ToiletReview", { inspection: item })}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <StatusBadge status={item.status} />
                <Text style={styles.timeText}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.toiletName} numberOfLines={1}>{item.toilet?.name || "---"}</Text>
                <View style={styles.infoRow}>
                    <User size={12} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.infoText}>{item.employee?.name || "---"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MapPin size={12} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.toilet?.address || "---"}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ToiletLayout
            title="Quality Control"
            subtitle="Supervisor Dashboard"
            navigation={navigation}
            showBack={false}
        >
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
                ) : (
                    <ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => { setRefreshing(true); loadData(true); }}
                                tintColor="#2563eb"
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.content}>
                            {/* Header with Filters */}
                            <View style={styles.headerSection}>
                                <Text style={styles.headerTitle}>Operational Intelligence</Text>
                                <View style={styles.filterRow}>
                                    <TouchableOpacity
                                        style={[styles.filterBtn, filter === 'today' && styles.filterBtnActive]}
                                        onPress={() => setFilter('today')}
                                    >
                                        <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>TODAY</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.filterBtn, filter === 'week' && styles.filterBtnActive]}
                                        onPress={() => setFilter('week')}
                                    >
                                        <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>WEEK</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.filterBtn, filter === 'month' && styles.filterBtnActive]}
                                        onPress={() => setFilter('month')}
                                    >
                                        <Text style={[styles.filterText, filter === 'month' && styles.filterTextActive]}>MONTH</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Stats Grid Row 1 - Period-based */}
                            <View style={styles.statsGrid}>
                                <StatCard
                                    label={`${filter.toUpperCase()} SUBMISSIONS`}
                                    value={currentStats.submitted || 0}
                                    sub="Total reports"
                                    color="#3b82f6"
                                />
                                <StatCard
                                    label="APPROVED BY QC"
                                    value={currentStats.approved || 0}
                                    sub="Status: Verified"
                                    color="#059669"
                                />
                            </View>

                            <View style={styles.statsGrid}>
                                <StatCard
                                    label="REJECTED BY QC"
                                    value={currentStats.rejected || 0}
                                    sub="Non-Compliant"
                                    color="#ef4444"
                                />
                                <StatCard
                                    label="PENDING REVIEW"
                                    value={currentStats.actionRequired || 0}
                                    sub="Action Required"
                                    color="#f59e0b"
                                />
                            </View>

                            <View style={styles.divider} />

                            {/* Stats Grid Row 2 - Overall */}
                            <View style={styles.statsGrid}>
                                <StatCard
                                    label="TOTAL INFRASTRUCTURE"
                                    value={stats?.totalToilets || 0}
                                    sub="Verified Assets"
                                    color="#6366f1"
                                    icon={<Building2 size={16} color="#6366f1" />}
                                />
                                <StatCard
                                    label="STAFF ON DUTY"
                                    value={stats?.onDutyEmployees || 0}
                                    sub="Active Personnel"
                                    color="#f59e0b"
                                    icon={<Users size={16} color="#f59e0b" />}
                                />
                            </View>

                            <View style={styles.statsGrid}>
                                <StatCard
                                    label="TOTAL APPROVED"
                                    value={stats?.approvedInspections || 0}
                                    sub="Compliant records"
                                    color="#059669"
                                    icon={<CheckCircle2 size={16} color="#059669" />}
                                />
                                <StatCard
                                    label="PENDING VERIFICATION"
                                    value={stats?.pendingReview || 0}
                                    sub="QC Queue"
                                    color="#d97706"
                                    icon={<AlertCircle size={16} color="#d97706" />}
                                />
                            </View>

                            {/* Team Button */}
                            {/* Removed - Staff Management is now in Sidebar */}

                            <View style={styles.divider} />

                            {/* Recent Inspections List */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>LATEST INSPECTIONS</Text>
                                <TouchableOpacity onPress={() => loadData(true)}>
                                    <Text style={styles.refreshText}>Refresh</Text>
                                </TouchableOpacity>
                            </View>

                            {inspections.slice(0, 10).map(item => (
                                <View key={item.id}>
                                    {renderInspectionItem({ item })}
                                </View>
                            ))}

                            {inspections.length === 0 && (
                                <View style={styles.empty}>
                                    <CheckCircle2 size={48} color="#22c55e" style={{ marginBottom: 10 }} />
                                    <Text style={styles.emptyTitle}>All Clear!</Text>
                                    <Text style={styles.emptySub}>No inspections found for this period.</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>
        </ToiletLayout>
    );
}

function StatCard({ label, value, sub, color, icon }: any) {
    return (
        <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <View style={styles.statHeader}>
                {icon && <View style={styles.statIcon}>{icon}</View>}
                <Text style={styles.statLabel}>{label}</Text>
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statSub}>{sub}</Text>
        </View>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: any = {
        'APPROVED': { bg: '#dcfce7', text: '#166534', label: 'APPROVED' },
        'REJECTED': { bg: '#fee2e2', text: '#991b1b', label: 'REJECTED' },
        'SUBMITTED': { bg: '#dbeafe', text: '#1e40af', label: 'SUBMITTED' },
        'ACTION_REQUIRED': { bg: '#ffedd5', text: '#9a3412', label: 'ACTION REQUIRED' }
    };
    const s = config[status] || { bg: '#f1f5f9', text: '#475569', label: status };

    return (
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 24 },

    headerSection: { marginBottom: 24 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
    filterRow: { flexDirection: 'row', gap: 10 },
    filterBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9' },
    filterBtnActive: { backgroundColor: '#2563eb' },
    filterText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
    filterTextActive: { color: '#fff' },

    statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', minHeight: 130 },
    statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    statIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, flex: 1, lineHeight: 14 },
    statValue: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
    statSub: { fontSize: 12, color: '#64748b', fontWeight: '500', lineHeight: 16 },

    divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 28 },

    teamBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
    teamBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.2 },
    refreshText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },

    card: { backgroundColor: "#fff", borderRadius: 18, marginBottom: 16, elevation: 2, shadowColor: "#64748b", shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '800' },
    timeText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

    cardBody: { padding: 16 },
    toiletName: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    infoText: { fontSize: 13, color: "#64748b", fontWeight: '600' },
    addressText: { fontSize: 13, color: "#94a3b8", flex: 1 },

    empty: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8 }
});
