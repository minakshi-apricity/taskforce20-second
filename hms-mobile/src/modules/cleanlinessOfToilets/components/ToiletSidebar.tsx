import React from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TouchableWithoutFeedback, Animated, Dimensions, ScrollView
} from "react-native";
import {
    Home, PlusCircle, MapPin, ClipboardList, ShieldCheck,
    AlertCircle, X, ChevronRight, LogOut, Settings, HelpCircle,
    LayoutList, User, Users, FileText
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../../theme";
import { useAuthContext } from "../../../auth/AuthProvider";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

interface ToiletSidebarProps {
    isVisible: boolean;
    onClose: () => void;
    navigation: any;
}

export default function ToiletSidebar({ isVisible, onClose, navigation }: ToiletSidebarProps) {
    const { auth, logout } = useAuthContext();
    const insets = useSafeAreaInsets();
    const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

    // Determine Roles
    // Using string matching if roles are consistent strings
    const roles = auth.status === 'authenticated' && auth.roles ? auth.roles : [];
    const isQC = roles.includes('QC') || roles.includes('QC_MANAGER');
    const isAO = roles.includes('ACTION_OFFICER') || roles.includes('ZONAL_OFFICER');
    const isTaskforce = roles.includes('TASKFORCE') || roles.includes('EMPLOYEE');
    const isAdmin = roles.includes('ADMIN') || roles.includes('CITY_ADMIN');

    // Logic: 
    // If Admin/QC -> Show QC Panel
    // If Employee -> Show Employee Panel
    // If AO -> Show AO Panel (or QC panel if they use same)

    // Simplification for user request: "QC ko QC ki cheeze, Employee ko Employee ki"
    const showEmployeeMenu = isTaskforce || isAdmin;
    const showQcMenu = isQC || isAdmin;
    const showAoMenu = isAO || isAdmin;

    React.useEffect(() => {
        if (isVisible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -SIDEBAR_WIDTH,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    const navigateTo = (screen: string) => {
        onClose();
        navigation.navigate(screen);
    };

    const handleLogout = async () => {
        onClose();
        await logout();
    };

    return (
        <Modal
            transparent
            visible={isVisible}
            onRequestClose={onClose}
            animationType="none"
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sidebar,
                        { transform: [{ translateX: slideAnim }], paddingTop: (insets.top || 0) + 20 },
                    ]}
                >
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.moduleName}>Cleanliness</Text>
                            <Text style={styles.subText}>of Toilets</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#0f172a" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.menuItems} contentContainerStyle={{ paddingBottom: 40 }}>

                        {/* EMPLOYEE MENU */}
                        {showEmployeeMenu && (
                            <>
                                <Text style={styles.groupTitle}>EMPLOYEE</Text>
                                <MenuItem
                                    icon={<Home size={22} color={Colors.primary} />}
                                    label="Dashboard"
                                    onPress={() => navigateTo("ToiletEmployeeTabs")}
                                />
                                <MenuItem
                                    icon={<LayoutList size={22} color={Colors.primary} />}
                                    label="Assigned Tasks"
                                    onPress={() => navigateTo("ToiletAssets")}
                                />
                                <MenuItem
                                    icon={<PlusCircle size={22} color={Colors.primary} />}
                                    label="Register Toilet"
                                    onPress={() => navigateTo("ToiletRegister")}
                                />
                                <MenuItem
                                    icon={<ClipboardList size={22} color={Colors.primary} />}
                                    label="My Requests"
                                    onPress={() => navigateTo("ToiletMyRequests")}
                                />
                                <MenuItem
                                    icon={<User size={22} color={Colors.primary} />}
                                    label="My Profile"
                                    onPress={() => navigateTo("ToiletProfile")}
                                />
                                <View style={styles.divider} />
                            </>
                        )}

                        {/* QC & ADMIN MENU */}
                        {showQcMenu && (
                            <>
                                <Text style={styles.groupTitle}>QC & ADMIN</Text>
                                <MenuItem
                                    icon={<ShieldCheck size={22} color={Colors.primary} />}
                                    label="QC Dashboard"
                                    onPress={() => navigateTo("ToiletQcTabs")}
                                />
                                <MenuItem
                                    icon={<Users size={22} color={Colors.primary} />}
                                    label="Staff Management"
                                    onPress={() => navigateTo("ToiletStaff")}
                                />
                                <MenuItem
                                    icon={<FileText size={22} color={Colors.primary} />}
                                    label="Audit Reports"
                                    onPress={() => navigateTo("ToiletQCDashboard")}
                                />
                                <MenuItem
                                    icon={<AlertCircle size={22} color={Colors.primary} />}
                                    label="Pending Registrations"
                                    onPress={() => navigateTo("ToiletPendingRegistration")}
                                />
                                <MenuItem
                                    icon={<User size={22} color={Colors.primary} />}
                                    label="My Profile"
                                    onPress={() => navigateTo("ToiletProfile")}
                                />
                                <View style={styles.divider} />
                            </>
                        )}

                        {/* AO MENU (If specific items exist, currently sharing QC items or just Reports) */}
                        {showAoMenu && !showQcMenu && (
                            <>
                                <Text style={styles.groupTitle}>ACTION OFFICER</Text>
                                <MenuItem
                                    icon={<Home size={22} color={Colors.primary} />}
                                    label="Dashboard"
                                    onPress={() => navigateTo("ToiletAODashboard")}
                                />
                                <MenuItem
                                    icon={<FileText size={22} color={Colors.primary} />}
                                    label="Reports & Audits"
                                    onPress={() => navigateTo("ToiletQCDashboard")}
                                />
                                <MenuItem
                                    icon={<User size={22} color={Colors.primary} />}
                                    label="My Profile"
                                    onPress={() => navigateTo("ToiletProfile")}
                                />
                                <View style={styles.divider} />
                            </>
                        )}

                    </ScrollView>

                    <View style={styles.footer}>
                        <MenuItem
                            icon={<HelpCircle size={22} color="#64748b" />}
                            label="Help & Guide"
                            onPress={() => navigateTo("ToiletHelp")}
                        />
                        <TouchableOpacity style={[styles.footerItem, styles.logoutItem]} onPress={handleLogout}>
                            <LogOut size={20} color="#dc2626" />
                            <Text style={[styles.footerText, styles.logoutText]}>Logout</Text>
                        </TouchableOpacity>
                        <Text style={styles.version}>v0.12.6</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

function MenuItem({ icon, label, onPress }: any) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIcon}>{icon}</View>
            <Text style={styles.menuLabel}>{label}</Text>
            <ChevronRight size={18} color="#cbd5e1" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: "row" },
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.4)" },
    sidebar: { width: SIDEBAR_WIDTH, backgroundColor: "#ffffff", height: "100%", paddingHorizontal: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 5, height: 0 }, shadowRadius: 10, elevation: 10 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    moduleName: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
    subText: { fontSize: 12, color: "#64748b", marginTop: 2 },
    closeBtn: { padding: 4 },
    menuItems: { flex: 1 },
    menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderRadius: 12, marginBottom: 2 },
    menuIcon: { width: 40, alignItems: "center" },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#0f172a", marginLeft: 8 },
    groupTitle: { fontSize: 11, fontWeight: "900", color: "#94a3b8", marginTop: 12, marginBottom: 6, letterSpacing: 1 },
    divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 8 },
    footer: { paddingBottom: 40, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
    footerItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10, paddingLeft: 10 },
    logoutItem: { marginTop: 10, paddingTop: 10 },
    footerText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
    logoutText: { color: "#dc2626" },
    version: { fontSize: 12, color: "#94a3b8", marginTop: 10, marginLeft: 10 },
});
