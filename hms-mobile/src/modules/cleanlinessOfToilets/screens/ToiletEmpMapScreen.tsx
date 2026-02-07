import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import { ArrowLeft, MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

type NavRoute = RouteProp<RootStackParamList, 'ToiletMap'>;

export default function ToiletMapScreen() {
    const route = useRoute<NavRoute>();
    const navigation = useNavigation();
    const [toilets, setToilets] = useState<any[]>(route.params?.toilets || []);

    const initialRegion = {
        latitude: 26.9124,
        longitude: 75.7873,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Assigned Toilets</Text>
            </View>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton
            >
                {toilets.map((t, i) => (
                    t.latitude && t.longitude ? (
                        <Marker
                            key={i}
                            coordinate={{ latitude: parseFloat(t.latitude), longitude: parseFloat(t.longitude) }}
                            title={t.name}
                            description={t.address}
                        >
                            <View style={styles.marker}>
                                <MapPin size={24} color="#ef4444" fill="#ef4444" />
                            </View>
                        </Marker>
                    ) : null
                ))}
            </MapView>
            <View style={styles.floatingCard}>
                <Text style={styles.floatingText}>{toilets.length} Toilets Found</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { position: 'absolute', top: 50, left: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 12, elevation: 4 },
    backBtn: { marginRight: 12 },
    title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    map: { width: width, height: height },
    marker: { alignItems: 'center', justifyContent: 'center' },
    floatingCard: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, elevation: 5 },
    floatingText: { fontSize: 14, fontWeight: '700', color: '#0f172a' }
});
