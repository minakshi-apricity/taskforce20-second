import React from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { ToiletApi } from '../../../api/modules';
import { useFocusEffect } from '@react-navigation/native';
import ToiletLayout from '../components/ToiletLayout';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ToiletQcTabs({ navigation }: { navigation: Nav }) {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    const load = async () => {
        try {
            const res = await ToiletApi.getDashboardStats();
            setStats(res);
        } catch (e) { } finally { setLoading(false); }
    };

    useFocusEffect(React.useCallback(() => { load(); }, []));

    return (
        <ToiletLayout title="QC Dashboard" navigation={navigation} showBack={false}>
            <View style={styles.screen}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator color="#1d4ed8" /></View>
                ) : (
                    <View style={styles.content}>
                        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                            <Text style={styles.statLabel}>PENDING AUDITS</Text>
                            <Text style={styles.statValue}>{stats?.pendingReports || 0}</Text>
                        </View>
                        <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                            <Text style={styles.statLabel}>PENDING REGISTRATIONS</Text>
                            <Text style={styles.statValue}>{stats?.pendingRegistrations || 0}</Text>
                        </View>
                        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                            <Text style={styles.statLabel}>TOTAL TOILETS</Text>
                            <Text style={styles.statValue}>{stats?.totalToilets || 0}</Text>
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.statLabel}>WARDS</Text>
                                <Text style={styles.statValue}>{stats?.totalWards || 0}</Text>
                            </View>
                            <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.statLabel}>ZONES</Text>
                                <Text style={styles.statValue}>{stats?.totalZones || 0}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },
    statCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, borderLeftWidth: 6, borderLeftColor: '#1d4ed8', elevation: 2 },
    statLabel: { fontSize: 10, fontWeight: '900', color: '#64748b', marginBottom: 4 },
    statValue: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
    row: { flexDirection: 'row' },
});
