import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Pill, Plus, X, Clock, Trash2 } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  instructions?: string;
  frequency?: string;
}

interface MedLog {
  id: string;
  medicine_id: string;
  scheduled_time: string;
  date: string;
  status: string;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MedicinesScreen() {
  const { colors, t, lang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([api.get("/medicines"), api.get("/medicine-logs?days=1")]);
      setMedicines(m.data || []);
      setLogs(l.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const today = todayKey();
  const logFor = (med: Medicine, time: string) =>
    logs.find((x) => x.medicine_id === med.id && x.scheduled_time === time && x.date === today);

  const setStatus = async (med: Medicine, time: string, status: "taken" | "skipped") => {
    await api.post("/medicine-logs", { medicine_id: med.id, scheduled_time: time, date: today, status });
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/medicines/${id}`);
    load();
  };

  // Group by time slot
  const slots: Record<string, { time: string; med: Medicine }[]> = { Morning: [], Noon: [], Evening: [], Night: [] };
  medicines.forEach((m) => {
    m.times.forEach((time) => {
      const hour = parseInt(time.split(":")[0] || "0", 10);
      let slot = "Morning";
      if (hour >= 12 && hour < 16) slot = "Noon";
      else if (hour >= 16 && hour < 21) slot = "Evening";
      else if (hour >= 21 || hour < 5) slot = "Night";
      slots[slot].push({ time, med: m });
    });
  });
  Object.keys(slots).forEach((k) => slots[k].sort((a, b) => a.time.localeCompare(b.time)));

  const slotLabel: Record<string, string> = {
    Morning: t("morning"),
    Noon: t("noon"),
    Evening: t("evening"),
    Night: t("night"),
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="medicines-screen">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t("medicines")}</Text>
        <TouchableOpacity
          testID="add-medicine-btn"
          onPress={() => router.push("/medicine/add")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Plus color="#fff" size={22} />
          <Text style={styles.addBtnText}>{t("addMedicine")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}>
        {medicines.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pill color={colors.textMuted} size={42} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("noMedicines")}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t("addFirstMed")}</Text>
          </View>
        ) : (
          Object.entries(slots).map(([slot, items]) => {
            if (items.length === 0) return null;
            return (
              <View key={slot} style={{ marginTop: 14 }}>
                <View style={styles.slotRow}>
                  <Text style={[styles.slotLabel, { color: colors.textSecondary }]}>
                    {slotLabel[slot]}
                  </Text>
                  <View style={[styles.slotLine, { backgroundColor: colors.border }]} />
                </View>
                {items.map((item, i) => {
                  const log = logFor(item.med, item.time);
                  const status = log?.status;
                  return (
                    <View
                      key={`${item.med.id}-${item.time}-${i}`}
                      style={[styles.medCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      testID={`med-card-${item.med.id}-${item.time}`}
                    >
                      <View style={styles.medTopRow}>
                        <View style={[styles.timeBadge, { backgroundColor: colors.primarySoft }]}>
                          <Clock color={isDark ? "#fff" : colors.primary} size={14} />
                          <Text style={[styles.timeText, { color: isDark ? "#fff" : colors.primary }]}>{item.time}</Text>
                        </View>
                        <TouchableOpacity
                          testID={`delete-med-${item.med.id}`}
                          onPress={() => remove(item.med.id)}
                          style={styles.removeBtn}
                          hitSlop={10}
                        >
                          <Trash2 color={colors.textMuted} size={18} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.medName, { color: colors.text }]} numberOfLines={2}>{item.med.name}</Text>
                      {!!(item.med.dosage || item.med.instructions) && (
                        <Text style={[styles.medMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                          {[item.med.dosage, item.med.instructions].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          testID={`mark-taken-${item.med.id}-${item.time}`}
                          disabled={status === "taken"}
                          onPress={() => setStatus(item.med, item.time, "taken")}
                          style={[
                            styles.actBtn,
                            {
                              backgroundColor: status === "taken" ? colors.secondary : colors.surfaceAlt,
                            },
                          ]}
                        >
                          <Check color={status === "taken" ? "#fff" : colors.secondary} size={18} />
                          <Text style={[styles.actText, { color: status === "taken" ? "#fff" : colors.text }]}>
                            {status === "taken" ? t("doneStatus") : t("markTaken")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          testID={`mark-skipped-${item.med.id}-${item.time}`}
                          disabled={status === "skipped"}
                          onPress={() => setStatus(item.med, item.time, "skipped")}
                          style={[
                            styles.actBtn,
                            {
                              backgroundColor: status === "skipped" ? colors.danger : colors.surfaceAlt,
                            },
                          ]}
                        >
                          <X color={status === "skipped" ? "#fff" : colors.danger} size={18} />
                          <Text style={[styles.actText, { color: status === "skipped" ? "#fff" : colors.text }]}>
                            {t("markSkipped")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999 },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  empty: { padding: 36, borderRadius: 20, borderWidth: 1, alignItems: "center", marginTop: 40, gap: 12 },
  emptyTitle: { fontSize: 19, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, marginTop: 4 },
  slotLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  slotLine: { flex: 1, height: 1 },
  medCard: { padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  medTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, gap: 4 },
  timeText: { fontSize: 13, fontWeight: "700" },
  removeBtn: { padding: 6 },
  medName: { fontSize: 20, fontWeight: "700", marginTop: 10 },
  medMeta: { fontSize: 14, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, gap: 6 },
  actText: { fontSize: 14, fontWeight: "700" },
});
