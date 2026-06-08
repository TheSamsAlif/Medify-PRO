import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileText, Plus, Trash2 } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface HealthRecordItem {
  id: string;
  title: string;
  record_type: string;
  description?: string;
  image_base64?: string;
  record_date: string;
}

export default function RecordsScreen() {
  const { colors, t, lang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [records, setRecords] = useState<HealthRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/health-records");
      setRecords(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    await api.delete(`/health-records/${id}`);
    load();
  };

  const labelOf = (type: string) => {
    const map: Record<string, { en: string; bn: string }> = {
      prescription: { en: "Prescription", bn: "প্রেসক্রিপশন" },
      report: { en: "Report", bn: "রিপোর্ট" },
      test_result: { en: "Test Result", bn: "টেস্ট রিপোর্ট" },
      image: { en: "Image", bn: "ছবি" },
    } as any;
    return (map[type] || { en: type, bn: type })[lang];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="records-screen">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t("healthRecords")}</Text>
        <TouchableOpacity
          testID="add-record-btn"
          onPress={() => router.push("/record/add")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Plus color="#fff" size={20} />
          <Text style={styles.addBtnText}>{t("addRecord")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : records.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FileText color={colors.textMuted} size={42} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("noRecords")}</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {lang === "bn" ? "রিপোর্ট ও প্রেসক্রিপশন এখানে সংরক্ষণ করুন।" : "Save your prescriptions, reports, and test results here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`record-${item.id}`}
            >
              {item.image_base64 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${item.image_base64}` }}
                  style={styles.thumb}
                />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }]}>
                  <FileText color={isDark ? "#fff" : colors.primary} size={32} />
                </View>
              )}
              <View style={{ flex: 1, padding: 12 }}>
                <View style={[styles.typePill, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.typeText, { color: isDark ? "#fff" : colors.primary }]}>{labelOf(item.record_type)}</Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                {!!item.description && (
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                )}
                <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                  {new Date(item.record_date).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                testID={`delete-record-${item.id}`}
                onPress={() => remove(item.id)}
                hitSlop={10}
                style={styles.removeBtn}
              >
                <Trash2 color={colors.danger} size={18} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  empty: { margin: 20, padding: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 19, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  card: { flexDirection: "row", borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  thumb: { width: 96, height: 110 },
  typePill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginBottom: 6 },
  typeText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardDesc: { fontSize: 13, marginTop: 4 },
  cardDate: { fontSize: 12, marginTop: 6 },
  removeBtn: { padding: 14, justifyContent: "center" },
});
