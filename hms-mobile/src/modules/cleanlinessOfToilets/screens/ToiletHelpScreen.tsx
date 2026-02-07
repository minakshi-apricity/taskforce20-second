import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform } from "react-native";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react-native";
import ToiletLayout from "../components/ToiletLayout";

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface FaqItem {
    id: string;
    questionEn: string;
    questionHi: string;
    answerEn: string;
    answerHi: string;
    category: string;
}

const FAQS: FaqItem[] = [
    // General Usage
    {
        id: "1",
        category: "General Usage",
        questionEn: "What is the Cleanliness of Toilets module used for?",
        questionHi: "शौचालयों की सफाई मॉड्यूल का उपयोग किस लिए किया जाता है?",
        answerEn: "It is used to inspect public toilets, upload photos, and report cleanliness status from the field.",
        answerHi: "इसका उपयोग सार्वजनिक शौचालयों का निरीक्षण करने, फोटो अपलोड करने और फील्ड से सफाई की स्थिति की रिपोर्ट करने के लिए किया जाता है।"
    },
    {
        id: "2",
        category: "General Usage",
        questionEn: "Who can use this module?",
        questionHi: "इस मॉड्यूल का उपयोग कौन कर सकता है?",
        answerEn: "Supervisors, task force users (as per assigned role).",
        answerHi: "पर्यवेक्षक, टास्क फोर्स उपयोगकर्ता (निर्धारित भूमिका के अनुसार)।"
    },

    // Registration
    {
        id: "4",
        category: "Registration",
        questionEn: "Why can't I see my ward during registration?",
        questionHi: "पंजीकरण के दौरान मुझे अपना वार्ड क्यों नहीं दिखाई दे रहा है?",
        answerEn: "Your ward is not mapped to your profile. Please contact your QC or city administrator.",
        answerHi: "आपका वार्ड आपकी प्रोफाइल से मैप नहीं किया गया है। कृपया अपने QC या शहर प्रशासक से संपर्क करें।"
    },
    {
        id: "5",
        category: "Registration",
        questionEn: "What does “Pending Registration” mean?",
        questionHi: "“लंबित पंजीकरण” (Pending Registration) का क्या अर्थ है?",
        answerEn: "The toilet is registered but waiting for admin approval.",
        answerHi: "शौचालय पंजीकृत है लेकिन व्यवस्थापक (Admin) की मंजूरी का इंतजार कर रहा है।"
    },
    {
        id: "6",
        category: "Registration",
        questionEn: "Can I inspect a toilet with “Pending Registration” status?",
        questionHi: "क्या मैं “लंबित पंजीकरण” स्थिति वाले शौचालय का निरीक्षण कर सकता हूँ?",
        answerEn: "No. Only approved toilets can be inspected.",
        answerHi: "नहीं। केवल स्वीकृत शौचालयों का ही निरीक्षण किया जा सकता है।"
    },

    // Inspection Flow
    {
        id: "7",
        category: "Inspection Flow",
        questionEn: "Where can I see toilets assigned to me?",
        questionHi: "मुझे सौंपे गए शौचालय मैं कहाँ देख सकता हूँ?",
        answerEn: "In the Assigned tab of the Cleanliness of Toilets module.",
        answerHi: "शौचालयों की सफाई मॉड्यूल के 'Assigned' टैब में।"
    },
    {
        id: "8",
        category: "Inspection Flow",
        questionEn: "How do I start an inspection?",
        questionHi: "मैं निरीक्षण कैसे शुरू करूँ?",
        answerEn: "Open Assigned → select a toilet → tap Start Inspection.",
        answerHi: "Assigned खोलें → एक शौचालय चुनें → Start Inspection पर टैप करें।"
    },
    {
        id: "9",
        category: "Inspection Flow",
        questionEn: "Why can't I start the inspection?",
        questionHi: "मैं निरीक्षण शुरू क्यों नहीं कर पा रहा हूँ?",
        answerEn: "Inspection questions are enabled only when you are within 100 meters of the toilet’s registered location.",
        answerHi: "निरीक्षण प्रश्न केवल तभी सक्षम होते हैं जब आप शौचालय के पंजीकृत स्थान के 100 मीटर के भीतर हों।"
    },
    {
        id: "10",
        category: "Inspection Flow",
        questionEn: "Why does the app show “Outside Area”?",
        questionHi: "ऐप “Outside Area” क्यों दिखा रहा है?",
        answerEn: "You are not close enough to the toilet. Move nearer and try again.",
        answerHi: "आप शौचालय के काफी करीब नहीं हैं। पास जाएँ और दोबारा प्रयास करें।"
    },
    {
        id: "11",
        category: "Inspection Flow",
        questionEn: "Can I edit an inspection after submitting?",
        questionHi: "क्या मैं सबमिट करने के बाद निरीक्षण को संपादित (Edit) कर सकता हूँ?",
        answerEn: "No. Once submitted, inspections cannot be edited.",
        answerHi: "नहीं। एक बार सबमिट करने के बाद, निरीक्षण को संपादित नहीं किया जा सकता है।"
    },
    {
        id: "12",
        category: "Inspection Flow",
        questionEn: "What happens after I submit an inspection?",
        questionHi: "निरीक्षण सबमिट करने के बाद क्या होता है?",
        answerEn: "It goes into QC Pending status for review.",
        answerHi: "यह समीक्षा के लिए QC Pending स्थिति में चला जाता है।"
    },

    // Location (GPS)
    {
        id: "13",
        category: "Location (GPS)",
        questionEn: "What should I do if location is not fetching?",
        questionHi: "अगर लोकेशन (Location) प्राप्त नहीं हो रही है तो मुझे क्या करना चाहिए?",
        answerEn: "Turn GPS ON. Allow location permission to the app. Stand near the toilet in an open area.",
        answerHi: "GPS चालू करें। ऐप को लोकेशन की अनुमति दें। खुले क्षेत्र में शौचालय के पास खड़े हों।"
    },

    // Camera & Photos
    {
        id: "14",
        category: "Camera & Photos",
        questionEn: "Are photos mandatory during inspection?",
        questionHi: "क्या निरीक्षण के दौरान तस्वीरें लेना अनिवार्य है?",
        answerEn: "Yes, if required by the checklist.",
        answerHi: "हाँ, यदि चेकलिस्ट में आवश्यक हो।"
    },
    {
        id: "15",
        category: "Camera & Photos",
        questionEn: "What kind of photos should I upload?",
        questionHi: "मुझे किस तरह की तस्वीरें अपलोड करनी चाहिए?",
        answerEn: "Clear photos showing the actual cleanliness condition of the toilet.",
        answerHi: "स्पष्ट तस्वीरें जो शौचालय की वास्तविक सफाई स्थिति को दर्शाती हों।"
    },
    {
        id: "16",
        category: "Camera & Photos",
        questionEn: "Why is the camera slow or crashing?",
        questionHi: "कैमरा धीमा क्यों है या बंद क्यों हो रहा है?",
        answerEn: "Camera is still loading, phone storage is full, or photos are clicked too quickly.",
        answerHi: "कैमरा अभी लोड हो रहा है, फोन स्टोरेज फुल है, या तस्वीरें बहुत जल्दी क्लिक की गई हैं।"
    },

    // Internet & App Performance
    {
        id: "17",
        category: "Internet & Performance",
        questionEn: "Is internet required to use the app?",
        questionHi: "क्या ऐप का उपयोग करने के लिए इंटरनेट की आवश्यकता है?",
        answerEn: "Yes. Internet is required to upload photos and submit inspections.",
        answerHi: "हाँ। तस्वीरें अपलोड करने और निरीक्षण सबमिट करने के लिए इंटरनेट की आवश्यकता है।"
    },
    {
        id: "18",
        category: "Internet & Performance",
        questionEn: "Why is the submit button not working?",
        questionHi: "सबमिट बटन काम क्यों नहीं कर रहा है?",
        answerEn: "Required fields or photos may be missing, or internet may be slow.",
        answerHi: "आवश्यक फ़ील्ड या तस्वीरें गायब हो सकती हैं, या इंटरनेट धीमा हो सकता है।"
    },
    {
        id: "19",
        category: "Internet & Performance",
        questionEn: "What happens if the app freezes or closes?",
        questionHi: "यदि ऐप फ्रीज या बंद हो जाता है तो क्या होता है?",
        answerEn: "Restart the app. Any inspection not submitted may be lost.",
        answerHi: "ऐप को रीस्टार्ट करें। कोई भी निरीक्षण जो सबमिट नहीं किया गया था, वह खो सकता है।"
    }
];

export default function ToiletHelpScreen({ navigation }: any) {
    // Group FAQs by category
    const groupedFaqs = FAQS.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
    }, {} as Record<string, FaqItem[]>);

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <ToiletLayout
            title="Help & Support"
            navigation={navigation}
            subtitle="Frequently Asked Questions"
        >
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {Object.entries(groupedFaqs).map(([category, items]) => (
                        <View key={category} style={styles.section}>
                            <Text style={styles.categoryTitle}>{category}</Text>
                            {items.map((item) => {
                                const isExpanded = expandedId === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.card, isExpanded && styles.cardActive]}
                                        activeOpacity={0.9}
                                        onPress={() => toggleExpand(item.id)}
                                    >
                                        <View style={styles.cardHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.qEn}>{item.questionEn}</Text>
                                                <Text style={styles.qHi}>{item.questionHi}</Text>
                                            </View>
                                            {isExpanded ? <ChevronUp size={20} color="#1d4ed8" /> : <ChevronDown size={20} color="#94a3b8" />}
                                        </View>

                                        {isExpanded && (
                                            <View style={styles.cardBody}>
                                                <View style={styles.answerBox}>
                                                    <Text style={styles.aEn}>{item.answerEn}</Text>
                                                    <View style={styles.divider} />
                                                    <Text style={styles.aHi}>{item.answerHi}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}

                    <View style={styles.footer}>
                        <HelpCircle size={24} color="#64748b" style={{ marginBottom: 8 }} />
                        <Text style={styles.support}>Need additional help?</Text>
                        <View style={{ marginTop: 12, width: '100%', paddingHorizontal: 20 }}>
                            <TouchableOpacity style={styles.contactBtn}>
                                <Text style={styles.contactBtnText}>Call Action Officer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.contactBtn, { marginTop: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' }]}>
                                <Text style={[styles.contactBtnText, { color: '#0f172a' }]}>Contact City Administrator</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ToiletLayout>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    scroll: { padding: 16 },
    section: { marginBottom: 24 },
    categoryTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden'
    },
    cardActive: {
        borderColor: '#bfdbfe',
        backgroundColor: '#eff6ff'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between'
    },
    qEn: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    qHi: { fontSize: 13, fontWeight: '400', color: '#64748b', fontStyle: 'italic' },
    cardBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0
    },
    answerBox: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)'
    },
    aEn: { fontSize: 14, color: '#334155', lineHeight: 20, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 8, opacity: 0.5 },
    aHi: { fontSize: 13, color: '#475569', lineHeight: 20 },

    footer: { marginTop: 10, alignItems: 'center', paddingBottom: 40, opacity: 0.7, width: '100%' },
    support: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    supportSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
    contactBtn: { width: '100%', backgroundColor: '#2563eb', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    contactBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' }
});
