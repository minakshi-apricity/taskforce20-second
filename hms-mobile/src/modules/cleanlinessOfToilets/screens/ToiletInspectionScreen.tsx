import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, SafeAreaView, TextInput, Dimensions } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { ToiletApi } from "../../../api/modules";

type Props = NativeStackScreenProps<RootStackParamList, "ToiletInspection">;

// Helper: Distance calculation
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ALLOWED_RADIUS_KM = 0.5;



export default function ToiletInspectionScreen({ route, navigation }: Props) {
    const { toilet } = route.params;
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [isOutside, setIsOutside] = useState(false);
    const [photoAddedMsg, setPhotoAddedMsg] = useState<string | null>(null);

    // Track if component is mounted
    const isMountedRef = React.useRef(true);

    // State: { [questionId]: { value: any, photos: string[] } } (photos are URIs)
    const [answers, setAnswers] = useState<Record<string, { value: any, photos: string[] }>>({});

    // HIDE DEFAULT HEADER
    React.useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    useEffect(() => {
        isMountedRef.current = true;
        loadData();
        return () => { isMountedRef.current = false; };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Precise Location Check
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Error", "GPS is mandatory for inspections.");
                navigation.goBack();
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            if (!isMountedRef.current) return;
            setLocation(loc);

            // 2. Radius Check
            if (toilet.latitude && toilet.longitude) {
                const dist = getDistance(loc.coords.latitude, loc.coords.longitude, toilet.latitude, toilet.longitude);
                if (dist > ALLOWED_RADIUS_KM) {
                    setIsOutside(true);
                    return;
                }
            }

            // 3. Load Questions for this toilet type
            const res = await ToiletApi.listQuestions({ toiletId: toilet.id });
            if (!isMountedRef.current) return;
            setQuestions(res.questions);

            const initialAnswers: any = {};
            res.questions.forEach((q: any) => {
                let initialValue: any = null; // Default to null (neutral)

                initialAnswers[q.id] = { value: initialValue, photos: [] };
            });
            setAnswers(initialAnswers);
        } catch (err) {
            Alert.alert("Error", "Initialization failed.");
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    };

    const pickPhoto = async (qId: string) => {
        await launchCamera(qId);
    };

    const handleImageResult = (qId: string, result: ImagePicker.ImagePickerResult) => {
        if (!result.canceled && result.assets && result.assets[0].uri) {
            const photoUri = result.assets[0].uri;
            setAnswers(prev => ({
                ...prev,
                [qId]: { ...prev[qId], photos: [...(prev[qId]?.photos || []), photoUri] }
            }));
            setPhotoAddedMsg(qId);
            setTimeout(() => { if (isMountedRef.current) setPhotoAddedMsg(null); }, 2000);
        }
    };

    const launchCamera = async (qId: string) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Required", "Camera access needed.");
        const result = await ImagePicker.launchCameraAsync({ quality: 0.3, base64: false, allowsEditing: false });
        handleImageResult(qId, result);
    };



    const removePhoto = (qId: string, idx: number) => {
        setAnswers(prev => {
            const photos = [...prev[qId].photos];
            photos.splice(idx, 1);
            return { ...prev, [qId]: { ...prev[qId], photos } };
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payloadAnswers: Record<string, any> = {};

            // Convert photos to base64
            for (const q of questions) {
                const ans = answers[q.id];
                const base64Photos = [];
                for (const uri of ans.photos) {
                    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                    base64Photos.push(`data:image/jpeg;base64,${b64}`);
                }

                payloadAnswers[q.text] = {
                    answer: ans.value,
                    photos: base64Photos
                };
            }

            await ToiletApi.submitInspection({
                toiletId: toilet.id,
                latitude: location?.coords.latitude || 0,
                longitude: location?.coords.longitude || 0,
                answers: payloadAnswers
            });

            Alert.alert("Success", "Inspection report submitted successfully.", [
                { text: "OK", onPress: () => navigation.popToTop() }
            ]);
        } catch (err: any) {
            Alert.alert("Failed", err.message || "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <View style={styles.loadBox}><ActivityIndicator size="large" color="#1d4ed8" /><Text style={styles.loadText}>Verifying Location...</Text></View>
        </SafeAreaView>
    );

    if (isOutside) return (
        <SafeAreaView style={styles.container}>
            <View style={styles.errBox}>
                <Text style={{ fontSize: 40 }}>📍</Text>
                <Text style={styles.errTitle}>Outside Zone</Text>
                <Text style={styles.errSub}>You must be near the asset to conduct inspection.</Text>
                <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}><Text style={styles.backLinkText}>GO BACK</Text></TouchableOpacity>
            </View>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Header with shadow and no duplicates */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrap}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title} numberOfLines={1}>{toilet.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{toilet.type} INSPECTION</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionHeader}>COMPLETE THIS INSPECTION</Text>

                {questions.map((q, idx) => {
                    const cleanQ = q.text.replace(/^\d+\.\s*/, '');

                    return (
                        <View key={q.id} style={styles.qCard}>
                            <View style={styles.qHeader}>
                                <Text style={styles.qIndex}>{idx + 1}.</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.qText}>{cleanQ}</Text>
                                </View>
                            </View>

                            {/* Input Area */}
                            <View style={styles.inputArea}>
                                {q.type === 'YES_NO' ? (
                                    <View style={styles.toggleRow}>
                                        <TouchableOpacity
                                            style={[styles.miniBtn, answers[q.id].value === "YES" && styles.btnYes]}
                                            onPress={() => setAnswers({ ...answers, [q.id]: { ...answers[q.id], value: "YES" } })}
                                        >
                                            <Text style={[styles.btnText, answers[q.id].value === "YES" && styles.btnTextWhite]}>Yes</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.miniBtn, answers[q.id].value === "NO" && styles.btnNo]}
                                            onPress={() => setAnswers({ ...answers, [q.id]: { ...answers[q.id], value: "NO" } })}
                                        >
                                            <Text style={[styles.btnText, answers[q.id].value === "NO" && styles.btnTextWhite]}>No</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : q.type === 'OPTIONS' ? (
                                    <View style={styles.optionsWrap}>
                                        {q.options?.map((opt: string) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.optBtn, answers[q.id].value === opt && styles.optBtnActive]}
                                                onPress={() => setAnswers({ ...answers, [q.id]: { ...answers[q.id], value: opt } })}
                                            >
                                                <Text style={[styles.optText, answers[q.id].value === opt && styles.optTextActive]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Type your observations here..."
                                        placeholderTextColor="#94a3b8"
                                        value={answers[q.id].value || ""}
                                        onChangeText={(val) => setAnswers({ ...answers, [q.id]: { ...answers[q.id], value: val } })}
                                        multiline
                                    />
                                )}
                            </View>

                            {/* Compact Photo Action */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.addPhotoBtn, answers[q.id].photos.length > 0 && styles.addPhotoBtnActive]}
                                    onPress={() => pickPhoto(q.id)}
                                    disabled={answers[q.id].photos.length >= 5}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                                        <Text style={[styles.addPhotoText, answers[q.id].photos.length > 0 && { color: '#fff' }]}>
                                            {answers[q.id].photos.length > 0 ? "Add More Photos" : (q.requirePhoto ? "Add Photo" : "Add Photo (Optional)")}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {answers[q.id].photos.length > 0 && (
                                    <Text style={styles.photoCount}>{answers[q.id].photos.length}/5</Text>
                                )}
                            </View>

                            {/* Photos Grid - Only show if photos exist */}
                            {answers[q.id].photos.length > 0 && (
                                <View style={styles.photoGrid}>
                                    {answers[q.id].photos.map((uri, i) => (
                                        <View key={i} style={styles.picWrap}>
                                            <Image source={{ uri }} style={styles.pic} />
                                            <TouchableOpacity style={styles.picRemove} onPress={() => removePhoto(q.id, i)}>
                                                <Text style={styles.xIcon}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT COMPLETED REPORT</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    loadBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadText: { marginTop: 15, fontWeight: '900', color: '#64748b' },
    errBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 20 },
    errSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 22 },
    backLink: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
    backLinkText: { fontWeight: '900', color: '#1d4ed8', fontSize: 13 },

    // Header
    header: { padding: 16, paddingTop: 40, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    backBtnWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 16 },
    backBtn: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
    headerContent: { flex: 1 },
    title: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
    badge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
    badgeText: { fontSize: 10, color: '#1d4ed8', fontWeight: '900', letterSpacing: 0.5 },
    subtitle: { fontSize: 10, color: '#1d4ed8', fontWeight: '900', letterSpacing: 1, marginTop: 2 },

    scroll: { padding: 16 },
    sectionHeader: { fontSize: 11, fontWeight: '900', color: '#94a3b8', marginBottom: 24, letterSpacing: 1.5, textAlign: 'center' },
    qCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eff6ff', shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
    qHeader: { flexDirection: 'row', marginBottom: 12 },
    qIndex: { fontSize: 13, fontWeight: '800', color: '#cbd5e1', marginRight: 8, width: 24, paddingTop: 4 },
    qText: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 4, lineHeight: 22 },

    inputArea: { marginBottom: 12, marginLeft: 32 },

    toggleRow: { flexDirection: 'row', gap: 10 },
    miniBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc' },
    btnYes: { backgroundColor: '#10b981', borderColor: '#10b981' },
    btnNo: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    btnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

    optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
    optBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    optText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    optTextActive: { color: '#fff' },

    textInput: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 13, color: '#334155', minHeight: 80, textAlignVertical: 'top' },

    // Photo Logic
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 32, marginTop: 4 },
    addPhotoBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    addPhotoBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    cameraIcon: { marginRight: 6, fontSize: 12 },
    addPhotoText: { fontSize: 11, fontWeight: '700', color: '#475569' },
    photoCount: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginLeft: 32 },
    picWrap: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    pic: { width: '100%', height: '100%' },
    picRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.5)', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    xIcon: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

    // Deprecated / Hidden
    badgeRow: { display: 'none' },
    qBadge: { display: 'none' },
    qBadgeText: { display: 'none' },
    reqBadge: { display: 'none' },
    reqText: { display: 'none' },
    btnTextWhite: { color: '#fff' },
    evidenceLabel: { display: 'none' },
    photoSection: { display: 'none' },
    photoRow: { display: 'none' },
    picAdd: { display: 'none' },
    addPicText: { display: 'none' },
    successToast: { display: 'none' },

    warnText: { fontSize: 10, color: '#ef4444', fontWeight: '900', marginTop: 10 },
    successText: { fontSize: 12, color: '#10b981', fontWeight: '600' },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    submitBtn: { backgroundColor: '#1d4ed8', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#1d4ed8', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    submitText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
