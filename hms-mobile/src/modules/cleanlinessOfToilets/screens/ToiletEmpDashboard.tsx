import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { TrendingUp, MapPin, ClipboardList, CheckCircle2, FileText, Calendar, AlertCircle, LayoutGrid, Maximize2 } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { ToiletApi } from '../../../api/modules';
import { useAuthContext } from '../../../auth/AuthProvider';
import ToiletLayout from '../components/ToiletLayout';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

export default function ToiletEmployeeTabs({ navigation }: { navigation: Nav }) {
    const { auth } = useAuthContext();
    const [stats, setStats] = useState<any>(null);
    const [toilets, setToilets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const loadData = async () => {
        try {
            const [statsRes, toiletsRes] = await Promise.all([
                ToiletApi.getDashboardStats(),
                ToiletApi.listAssignedToilets()
            ]);
            setStats(statsRes);
            setToilets(toiletsRes.toilets || []);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    const initialRegion = {
        latitude: 26.9124,
        longitude: 75.7873,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    const handleOpenMap = () => {
        navigation.navigate('ToiletMap', { toilets });
    };

    // Format zone/ward display beautifully
    const getLocationDisplay = () => {
        if (stats?.totalZones && stats?.totalWards) {
            return `${stats.totalZones} Zone${stats.totalZones > 1 ? 's' : ''} • ${stats.totalWards} Ward${stats.totalWards > 1 ? 's' : ''}`;
        }
        if (stats?.wardNames) {
            return stats.wardNames;
        }
        return "Loading assignment...";
    };

    return (
        <ToiletLayout
            title="Cleanliness of Toilets"
            subtitle="Employee Workspace"
            navigation={navigation}
        >
            <SafeAreaView style={styles.screen}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator color="#2563eb" size="large" /></View>
                ) : (
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                        {/* Date & Title */}
                        <View style={styles.sectionTitleRow}>
                            <View>
                                <Text style={styles.sectionTitle}>Daily Work Summary</Text>
                                <Text style={styles.sectionSub}>Overview for {currentDate.toLocaleDateString()}</Text>
                            </View>
                            <TouchableOpacity style={styles.dateBtn}>
                                <Calendar size={18} color="#2563eb" />
                            </TouchableOpacity>
                        </View>

                        {/* Detailed Stats Grid - Colored Cards (Now Tappable) */}
                        <View style={styles.gridContainer}>
                            {/* Row 1 - Tappable Cards */}
                            <TouchableOpacity
                                style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}
                                onPress={() => navigation.navigate('ToiletAssets' as any)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#fff' }]}>
                                        <MapPin size={14} color="#3b82f6" />
                                    </View>
                                    <Text style={styles.statValue}>{stats?.totalWards || 0}</Text>
                                </View>
                                <Text style={styles.statLabel}>Assigned Wards</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.statCard, { backgroundColor: '#f0f9ff', borderColor: '#e0f2fe' }]}
                                onPress={() => navigation.navigate('ToiletAssets' as any)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#fff' }]}>
                                        <LayoutGrid size={14} color="#0ea5e9" />
                                    </View>
                                    <Text style={styles.statValue}>{stats?.totalAssigned || 0}</Text>
                                </View>
                                <Text style={styles.statLabel}>Toilets Assigned</Text>
                            </TouchableOpacity>

                            <View style={[styles.statCard, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#fff' }]}>
                                        <ClipboardList size={14} color="#f97316" />
                                    </View>
                                    <Text style={styles.statValue}>{stats?.totalRegistered || 0}</Text>
                                </View>
                                <Text style={styles.statLabel}>Registered</Text>
                            </View>

                            {/* Row 2 */}
                            <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#fff' }]}>
                                        <CheckCircle2 size={14} color="#22c55e" />
                                    </View>
                                    <Text style={styles.statValue}>{stats?.totalSubmitted || 0}</Text>
                                </View>
                                <Text style={styles.statLabel}>Submitted</Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#fff' }]}>
                                        <AlertCircle size={14} color="#ef4444" />
                                    </View>
                                    <Text style={styles.statValue}>{stats?.totalRejected || 0}</Text>
                                </View>
                                <Text style={styles.statLabel}>Rejected</Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#fff' }]}>
                                        <FileText size={14} color="#d97706" />
                                    </View>
                                    <Text style={styles.statValue}>{stats?.totalPending || 0}</Text>
                                </View>
                                <Text style={styles.statLabel}>Pending</Text>
                            </View>
                        </View>

                        {/* Recent Activity Hint */}
                        <View style={styles.infoBox}>
                            <TrendingUp size={16} color="#64748b" style={{ marginRight: 8 }} />
                            <Text style={styles.infoText}>
                                Ensure all assigned toilets are inspected before 5 PM.
                            </Text>
                        </View>

                        {/* Map Overview - Increased Height & Better Zone/Ward Display */}
                        <TouchableOpacity style={styles.mapCard} onPress={handleOpenMap} activeOpacity={0.9}>
                            <View style={styles.mapHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mapTitle}>ASSIGNED AREA</Text>
                                    <View style={styles.locationBadge}>
                                        <MapPin size={14} color="#2563eb" style={{ marginRight: 6 }} />
                                        <Text style={styles.locationText} numberOfLines={1}>
                                            {getLocationDisplay()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.expandBtn}>
                                    <Maximize2 size={16} color="#64748b" />
                                </View>
                            </View>
                            <View style={styles.mapContainer}>
                                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                                    <MapView
                                        provider={PROVIDER_GOOGLE}
                                        style={StyleSheet.absoluteFill}
                                        initialRegion={initialRegion}
                                        liteMode
                                        scrollEnabled={false}
                                        zoomEnabled={false}
                                        rotateEnabled={false}
                                        pitchEnabled={false}
                                    >
                                        {toilets.map((t, i) => (
                                            t.latitude && t.longitude ? (
                                                <Marker
                                                    key={i}
                                                    coordinate={{ latitude: parseFloat(t.latitude), longitude: parseFloat(t.longitude) }}
                                                />
                                            ) : null
                                        ))}
                                    </MapView>
                                </View>
                                <View style={styles.mapOverlay}>
                                    <Text style={styles.mapOverlayText}>Tap to view full map</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View style={{ height: 20 }} />
                    </ScrollView>
                )}
            </SafeAreaView>
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, paddingBottom: 40 },

    // Section
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
    sectionSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
    dateBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },

    // Grid (3 Columns Wrap)
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: { width: (width - 64) / 3, borderRadius: 16, padding: 12, borderWidth: 1, elevation: 1 },
    statHeader: { alignItems: 'flex-start', marginBottom: 8 },
    statIconBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: 30, fontWeight: '900', color: '#000000', marginBottom: 2 },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#000000', opacity: 0.7 },

    // Info
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12, marginBottom: 24 },
    infoText: { flex: 1, fontSize: 12, color: '#475569', fontWeight: '500', lineHeight: 18 },

    // Map Card - Increased Size & Better Formatting
    mapCard: { backgroundColor: '#fff', borderRadius: 24, padding: 6, elevation: 3, shadowColor: '#94a3b8', shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 8 },
    mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 12 },
    mapTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 6 },
    locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
    locationText: { fontSize: 12, fontWeight: '700', color: '#2563eb', flex: 1 },
    expandBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    mapContainer: { height: 220, borderRadius: 20, overflow: 'hidden', marginHorizontal: 6, marginBottom: 6, position: 'relative' },
    mapOverlay: { position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24 },
    mapOverlayText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
