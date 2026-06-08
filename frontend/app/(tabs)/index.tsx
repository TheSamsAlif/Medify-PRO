import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Hospital,
  PhoneCall,
  Pill,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface Patient { name: string; age: number; conditions: string[]; }
interface Medicine { id: string; name: string; dosage: string; times: string[]; instructions?: string; }
interface Appointment { id: string; doctor_name: string; specialty: string; date: string; time: string; }
interface Adherence { adherence_score: number; taken: number; skipped: number; total: number; }

function greetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning";
  if (h < 17) return "goodAfternoon";
  return "goodEvening";
}

export default function Dashboard() {
  const { colors, t, lang, setLang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [adherence, setAdherence] = useState<Adherence | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, m, a, ad] = await Promise.all([
        api.get("/patient"),
        api.get("/medicines"),
        api.get("/appointments"),
        api.get("/adherence"),
      ]);
      setPatient(p.data);
      setMedicines(m.data || []);
      setAppointments(a.data || []);
      setAdherence(ad.data);
    } catch (e) {
      console.warn("Dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const upcomingToday = medicines.flatMap((m) =>
    m.times.map((time) => ({ time, name: m.name, dosage: m.dosage, id: m.id }))
  ).sort((x, y) => x.time.localeCompare(y.time)).slice(0, 5);

  const score = adherence?.adherence_score ?? 0;
  const scoreColor = score >= 80 ? colors.secondary : score >= 50 ? colors.accent : colors.danger;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="dashboard-screen">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greet, { color: colors.textSecondary }]}>{t(greetingKey())}</Text>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {patient?.name || "—"}
            </Text>
          </View>
          <TouchableOpacity
            testID="lang-toggle"
            onPress={() => setLang(lang === "en" ? "bn" : "en")}
            style={[styles.langPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.langText, { color: colors.primary }]}>
              {lang === "en" ? "বাংলা" : "EN"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SOS card */}
        <TouchableOpacity
          testID="sos-emergency-button"
          activeOpacity={0.85}
          onPress={() => router.push("/sos")}
          style={[styles.sosCard, { backgroundColor: colors.danger }]}
        >
          <View style={styles.sosIconWrap}>
            <AlertCircle color="#fff" size={36} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>{t("sosBigBtn")}</Text>
            <Text style={styles.sosSub}>{t("sosDesc")}</Text>
          </View>
        </TouchableOpacity>

        {/* Adherence */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
              <TrendingUp color={isDark ? "#fff" : colors.primary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t("adherence")}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{t("thisWeek")}</Text>
            </View>
          </View>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreBig, { color: scoreColor }]}>{score}%</Text>
            <View style={styles.scoreStats}>
              <Stat color={colors.secondary} label={t("taken")} value={adherence?.taken ?? 0} textColor={colors.text} />
              <Stat color={colors.danger} label={t("skipped")} value={adherence?.skipped ?? 0} textColor={colors.text} />
              <Stat color={colors.textMuted} label="Total" value={adherence?.total ?? 0} textColor={colors.text} />
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={[styles.section, { color: colors.text }]}>{t("quickActions")}</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            testID="quick-scan"
            icon={<Camera color="#fff" size={26} />}
            label={t("scanPrescription")}
            bg={colors.primary}
            onPress={() => router.push("/scan")}
          />
          <QuickAction
            testID="quick-add-med"
            icon={<Plus color="#fff" size={26} />}
            label={t("addMedicine")}
            bg={colors.secondary}
            onPress={() => router.push("/medicine/add")}
          />
          <QuickAction
            testID="quick-hospital"
            icon={<Hospital color="#fff" size={26} />}
            label={t("findHospital")}
            bg={colors.accent}
            onPress={() => router.push("/hospitals")}
          />
          <QuickAction
            testID="quick-emergency"
            icon={<PhoneCall color="#fff" size={26} />}
            label={t("emergencyContacts")}
            bg={colors.danger}
            onPress={() => router.push("/emergency")}
          />
        </View>

        {/* Upcoming meds */}
        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>{t("upcoming")}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/medicines")}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{lang === "bn" ? "সব দেখুন" : "See all"}</Text>
          </TouchableOpacity>
        </View>
        {upcomingToday.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pill color={colors.textMuted} size={28} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("noUpcoming")}</Text>
          </View>
        ) : (
          upcomingToday.map((m, i) => (
            <View
              key={`${m.id}-${m.time}-${i}`}
              style={[styles.medRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`upcoming-med-${i}`}
            >
              <View style={[styles.medTime, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.medTimeText, { color: isDark ? "#fff" : colors.primary }]}>{m.time}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.medName, { color: colors.text }]} numberOfLines={1}>{m.name}</Text>
                {!!m.dosage && (
                  <Text style={[styles.medDose, { color: colors.textSecondary }]}>{m.dosage}</Text>
                )}
              </View>
              <CheckCircle2 color={colors.textMuted} size={22} />
            </View>
          ))
        )}

        {/* Appointments */}
        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>{t("upcomingAppts")}</Text>
          <TouchableOpacity testID="open-appointments" onPress={() => router.push("/appointments")}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{lang === "bn" ? "যোগ" : "Add"}</Text>
          </TouchableOpacity>
        </View>
        {appointments.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Calendar color={colors.textMuted} size={28} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {lang === "bn" ? "কোনো আসন্ন অ্যাপয়েন্টমেন্ট নেই।" : "No upcoming appointments."}
            </Text>
          </View>
        ) : (
          appointments.slice(0, 3).map((a) => (
            <View
              key={a.id}
              style={[styles.medRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.medTime, { backgroundColor: colors.secondarySoft }]}>
                <Calendar color={isDark ? "#fff" : colors.secondary} size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.medName, { color: colors.text }]} numberOfLines={1}>{a.doctor_name}</Text>
                <Text style={[styles.medDose, { color: colors.textSecondary }]} numberOfLines={1}>
                  {a.date}{a.time ? ` · ${a.time}` : ""}{a.specialty ? ` · ${a.specialty}` : ""}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* AI banner */}
        <TouchableOpacity
          testID="open-assistant-banner"
          onPress={() => router.push("/(tabs)/assistant")}
          activeOpacity={0.9}
          style={[styles.aiBanner, { backgroundColor: colors.primary }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>{lang === "bn" ? "এআই স্বাস্থ্য সহকারী" : "AI Health Assistant"}</Text>
            <Text style={styles.aiSub}>
              {lang === "bn" ? "যেকোন ঔষধ বা স্বাস্থ্য প্রশ্ন জিজ্ঞাসা করুন" : "Ask about any medicine or health question"}
            </Text>
          </View>
          <Sparkles color="#fff" size={32} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Stat({ color, label, value, textColor }: { color: string; label: string; value: number; textColor: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, bg, onPress, testID }: { icon: React.ReactNode; label: string; bg: string; onPress: () => void; testID: string }) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.85} style={[styles.quickItem, { backgroundColor: bg }]}>
      <View style={styles.quickIcon}>{icon}</View>
      <Text style={styles.quickLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  greet: { fontSize: 15, fontWeight: "500" },
  name: { fontSize: 26, fontWeight: "700", marginTop: 2 },
  langPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, minWidth: 64, alignItems: "center" },
  langText: { fontSize: 14, fontWeight: "700" },
  sosCard: {
    flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 20, marginBottom: 18, gap: 14,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  sosIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  sosTitle: { color: "#fff", fontSize: 19, fontWeight: "800", letterSpacing: 0.4 },
  sosSub: { color: "rgba(255,255,255,0.92)", fontSize: 13, marginTop: 2 },
  card: { borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardSub: { fontSize: 13 },
  scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 14, justifyContent: "space-between" },
  scoreBig: { fontSize: 46, fontWeight: "800" },
  scoreStats: { flexDirection: "row", gap: 20 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  section: { fontSize: 17, fontWeight: "700", marginTop: 22, marginBottom: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  linkText: { fontSize: 14, fontWeight: "600", marginTop: 24 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickItem: { flexBasis: "47%", flexGrow: 1, padding: 16, borderRadius: 18, minHeight: 110, justifyContent: "space-between" },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  quickLabel: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 8 },
  empty: { padding: 22, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14, textAlign: "center" },
  medRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  medTime: { width: 64, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  medTimeText: { fontSize: 14, fontWeight: "700" },
  medName: { fontSize: 16, fontWeight: "700" },
  medDose: { fontSize: 13, marginTop: 2 },
  aiBanner: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 20, marginTop: 22 },
  aiTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  aiSub: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4 },
});
