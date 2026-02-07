import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl, Dimensions } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { RootStackParamList } from "../../../navigation/types";
import { ToiletApi } from "../../../api/modules";
import ToiletLayout from "../components/ToiletLayout";
import { MapPin, CheckCircle, Clock, AlertCircle, TrendingUp, Filter } from "lucide-react-native";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

// Helper: Haversine distance in KM
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg: number) { return deg * (Math.PI / 180); }

export default function ToiletEmployeeHome({ navigation, embedded = false }: { navigation: Nav, embedded?: boolean }) {
    const [toilets, setToilets] = useState<any[]>([]);
    const [filteredToilets, setFilteredToilets] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'CT' | 'PT' | 'URINALS'>('ALL');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [myLoc, setMyLoc] = useState<Location.LocationObject | null>(null);

    // Stats
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

    const load = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        setError("");
        try {
            // Get current location
            let loc = null;
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setMyLoc(loc);
                }
            } catch (e) { }

            const res = await ToiletApi.getMyToilets();
            const rawToilets = res.toilets || [];

            // Enrich with distance and sort
            let enriched = rawToilets.map((t: any) => {
                let dist = 999999;
                if (loc && t.latitude && t.longitude) {
                    dist = getDistance(loc.coords.latitude, loc.coords.longitude, t.latitude, t.longitude);
                }
                return { ...t, distance: dist };
            });

            // Sort: Uninspected first, then nearest
            enriched.sort((a: any, b: any) => {
                const aDone = a.lastInspectionStatus === 'SUBMITTED' || a.lastInspectionStatus === 'APPROVED' ? 1 : 0;
                const bDone = b.lastInspectionStatus === 'SUBMITTED' || b.lastInspectionStatus === 'APPROVED' ? 1 : 0;
                if (aDone !== bDone) return aDone - bDone;
                return a.distance - b.distance;
            });

            setToilets(enriched);
            setFilteredToilets(enriched);

            // Calculate Stats
            const total = enriched.length;
            const completed = enriched.filter((t: any) => t.lastInspectionStatus === 'SUBMITTED' || t.lastInspectionStatus === 'APPROVED').length;
            const pending = total - completed;
            setStats({ total, pending, completed });

        } catch (err: any) {
            setError("Unable to load assigned list.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (activeFilter === 'ALL') {
            setFilteredToilets(toilets);
        } else {
            setFilteredToilets(toilets.filter(t => t.type === activeFilter));
        }
    }, [activeFilter, toilets]);

    useEffect(() => {
        load();
    }, []);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Summary & Date */}
            <View style={styles.welcomeSection}>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#eff6ff', flex: 1 }]}>
                    <View style={styles.statIconWrap}>
                        <TrendingUp size={20} color="#2563eb" />
                    </View>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#f0fdf4', flex: 1 }]}>
                    <View style={[styles.statIconWrap, { backgroundColor: '#dcfce7' }]}>
                        <CheckCircle size={20} color="#16a34a" />
                    </View>
                    <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fff7ed', flex: 1 }]}>
                    <View style={[styles.statIconWrap, { backgroundColor: '#ffedd5' }]}>
                        <Clock size={20} color="#ea580c" />
                    </View>
                    <Text style={[styles.statValue, { color: '#ea580c' }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </View>

            {/* Filter Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned Toilets</Text>
                <View style={styles.filterIcon}>
                    <Filter size={14} color="#64748b" />
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {['ALL', 'CT', 'PT', 'URINALS'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, activeFilter === f && styles.filterActive]}
                        onPress={() => setActiveFilter(f as any)}
                    >
                        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                            {f === 'ALL' ? 'All' : f === 'CT' ? 'Community' : f === 'PT' ? 'Public' : 'Urinals'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => {
        const isDone = item.lastInspectionStatus === 'SUBMITTED' || item.lastInspectionStatus === 'APPROVED';

        return (
            <TouchableOpacity
                style={[styles.card, isDone && styles.cardDone]}
                onPress={() => navigation.navigate("ToiletInspection", { toilet: item })}
                activeOpacity={0.9}
            >
                <View style={[styles.cardSideBar, { backgroundColor: isDone ? '#10b981' : item.type === 'CT' ? '#f59e0b' : '#3b82f6' }]} />

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.typeTag}>
                            <Text style={[styles.typeText, { color: item.type === 'CT' ? '#b45309' : '#1d4ed8' }]}>
                                {item.type}
                            </Text>
                        </View>
                        {item.distance < 1000 && (
                            <View style={styles.distBadge}>
                                <MapPin size={10} color="#64748b" style={{ marginRight: 2 }} />
                                <Text style={styles.distText}>{item.distance.toFixed(1)} km</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardAddress} numberOfLines={1}>{item.address || "No address"}</Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.statusBadgeWrap}>
                            {isDone ? (
                                <View style={styles.statusBadgeDone}>
                                    <CheckCircle size={12} color="#10b981" style={{ marginRight: 4 }} />
                                    <Text style={styles.statusTextDone}>INSPECTED</Text>
                                </View>
                            ) : (
                                <View style={styles.statusBadgePending}>
                                    <AlertCircle size={12} color="#ca8a04" style={{ marginRight: 4 }} />
                                    <Text style={styles.statusTextPending}>PENDING</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.actionBtn}>
                            <Text style={styles.actionBtnText}>{isDone ? "View" : "Inspect"}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const content = (
        <View style={styles.screen}>
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
            ) : (
                <FlatList
                    data={filteredToilets}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#2563eb"]} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>📋</Text>
                            <Text style={styles.emptyText}>{error || "No tasks found."}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );

    if (embedded) {
        return <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>{content}</SafeAreaView>;
    }

    return (
        <ToiletLayout
            title="Assigned Tasks"
            navigation={navigation}
            showBack={false}
        >
            {content}
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 100 },

    // Header
    headerContainer: { marginBottom: 12 },
    welcomeSection: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 },
    welcomeSub: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' },
    welcomeTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
    dateBadge: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    dateText: { fontSize: 12, fontWeight: '700', color: '#64748b' },

    // Stats
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    statIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '900', color: '#1e3a8a', marginBottom: 2 },
    statLabel: { fontSize: 11, fontWeight: '600', color: '#64748b' },

    // Filter
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#334155' },
    filterIcon: { backgroundColor: '#f1f5f9', padding: 6, borderRadius: 8 },
    filterScroll: { paddingBottom: 8 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#fff', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    filterActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
    filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    filterTextActive: { color: '#fff' },

    // Cards
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
    cardDone: { opacity: 0.9 },
    cardSideBar: { width: 6, height: '100%' },
    cardContent: { flex: 1, padding: 16 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    typeTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    typeText: { fontSize: 10, fontWeight: '900' },
    distBadge: { flexDirection: 'row', alignItems: 'center' },
    distText: { fontSize: 11, color: '#64748b', fontWeight: '500' },

    cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    cardAddress: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
    statusBadgeWrap: {},
    statusBadgeDone: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusTextDone: { fontSize: 10, fontWeight: '800', color: '#166534' },
    statusBadgePending: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusTextPending: { fontSize: 10, fontWeight: '800', color: '#854d0e' },

    actionBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    actionBtnText: { fontSize: 11, fontWeight: '700', color: '#475569' },

    emptyContainer: { alignItems: 'center', marginTop: 40, padding: 20 },
    emptyEmoji: { fontSize: 40, marginBottom: 10 },
    emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' }
});
