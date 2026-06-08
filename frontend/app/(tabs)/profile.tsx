import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { Calendar, ChevronRight, HeartPulse, Languages, LogOut, Moon, Phone, ShieldAlert, User, Stethoscope } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { useAuth } from "@/src/lib/AuthContext";
import { api } from "@/src/lib/api";

interface Patient {
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  conditions: string[];
  guardian_name: string;
  guardian_phone: string;
  doctor_name: string;
  doctor_phone: string;
}

export default function ProfileScreen() {
  const { colors, t, lang, setLang, mode, setMode, isDark } = useApp();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/patient");
      setPatient(res.data);
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !patient) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="profile-screen">
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120, paddingHorizontal: 20 }}>
        {/* Patient card */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatarLg}><User color={colors.primary} size={36} /></View>
          <Text style={styles.profileName}>{patient.name}</Text>
          <Text style={styles.profileMeta}>
            {patient.age} {t("yearsOld")} · {patient.blood_group}
          </Text>
          <View style={styles.condRow}>
            {patient.conditions.map((c, i) => (
              <View key={i} style={styles.condPill}>
                <HeartPulse color="#fff" size={12} />
                <Text style={styles.condText} numberOfLines={1}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <Text style={[styles.section, { color: colors.text }]}>{lang === "bn" ? "সেটিংস" : "Settings"}</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={<Languages color={colors.primary} size={22} />}
            label={t("language")}
            value={lang === "en" ? "English" : "বাংলা"}
            onPress={() => setLang(lang === "en" ? "bn" : "en")}
            colors={colors}
            testID="setting-language"
          />
          <Divider colors={colors} />
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
              <Moon color={isDark ? "#fff" : colors.primary} size={22} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t("darkMode")}</Text>
            <Switch
              testID="dark-mode-switch"
              value={mode === "dark"}
              onValueChange={(v) => setMode(v ? "dark" : "light")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        {/* Care team */}
        <Text style={[styles.section, { color: colors.text }]}>{lang === "bn" ? "যত্ন দল" : "Care Team"}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ContactRow
            icon={<User color={colors.secondary} size={22} />}
            label={t("guardian")}
            name={patient.guardian_name}
            phone={patient.guardian_phone}
            colors={colors}
            testID="contact-guardian"
          />
          <Divider colors={colors} />
          <ContactRow
            icon={<Stethoscope color={colors.secondary} size={22} />}
            label={t("doctor")}
            name={patient.doctor_name}
            phone={patient.doctor_phone}
            colors={colors}
            testID="contact-doctor"
          />
        </View>

        {/* Shortcuts */}
        <Text style={[styles.section, { color: colors.text }]}>{lang === "bn" ? "শর্টকাট" : "Shortcuts"}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={<Calendar color={colors.primary} size={22} />}
            label={t("appointments")}
            value=""
            onPress={() => router.push("/appointments")}
            colors={colors}
            testID="shortcut-appointments"
          />
          <Divider colors={colors} />
          <SettingRow
            icon={<ShieldAlert color={colors.danger} size={22} />}
            label={t("emergencyContacts")}
            value=""
            onPress={() => router.push("/emergency")}
            colors={colors}
            testID="shortcut-emergency"
          />
        </View>

        {/* Account info & Logout */}
        <Text style={[styles.section, { color: colors.text }]}>{lang === "bn" ? "একাউন্ট" : "Account"}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
              <User color={isDark ? "#fff" : colors.primary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>{user?.email || ""}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{lang === "bn" ? "সাইন ইন" : "Signed in"}</Text>
            </View>
          </View>
          <Divider colors={colors} />
          <TouchableOpacity testID="logout-btn" onPress={logout} style={styles.row} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: colors.dangerSoft }]}>
              <LogOut color={colors.danger} size={22} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.danger, fontWeight: "700" }]}>
              {lang === "bn" ? "লগ আউট" : "Log out"}
            </Text>
            <ChevronRight color={colors.textMuted} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.devCredit}>
          <Text style={[styles.devCreditLine, { color: colors.textMuted }]}>{lang === "bn" ? "তৈরি করেছেন" : "Developed by"}</Text>
          <Text style={[styles.devCreditName, { color: colors.primary }]}>Sams Alif</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, colors, testID }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={styles.row} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>{icon}</View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {!!value && <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
      <ChevronRight color={colors.textMuted} size={20} />
    </TouchableOpacity>
  );
}

function ContactRow({ icon, label, name, phone, colors, testID }: any) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.secondarySoft }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
      </View>
      <TouchableOpacity
        testID={testID}
        onPress={() => Linking.openURL(`tel:${phone}`)}
        style={[styles.callBtn, { backgroundColor: colors.secondary }]}
      >
        <Phone color="#fff" size={18} />
      </TouchableOpacity>
    </View>
  );
}

function Divider({ colors }: any) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileCard: { padding: 22, borderRadius: 22, alignItems: "center", marginBottom: 8 },
  avatarLg: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  profileName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  profileMeta: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 4 },
  condRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12, justifyContent: "center" },
  condPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  condText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  section: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
  card: { borderRadius: 18, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, minHeight: 64 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  rowValue: { fontSize: 14, marginRight: 6 },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginLeft: 66 },
  devCredit: { marginTop: 30, alignItems: "center" },
  devCreditLine: { fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "600" },
  devCreditName: { fontSize: 14, fontWeight: "800", marginTop: 2 },
});
