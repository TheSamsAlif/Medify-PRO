import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, Clock, Plus, Trash2, X } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface Appt { id: string; doctor_name: string; specialty: string; date: string; time: string; location: string; notes: string; }

export default function Appointments() {
  const { colors, t, lang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ doctor_name: "", specialty: "", date: "", time: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setItems((await api.get("/appointments")).data || []); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    if (!form.doctor_name.trim() || !form.date.trim()) return;
    setSaving(true);
    try {
      await api.post("/appointments", form);
      setForm({ doctor_name: "", specialty: "", date: "", time: "", location: "", notes: "" });
      setModalVisible(false);
      load();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => { await api.delete(`/appointments/${id}`); load(); };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="appointments-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}><ArrowLeft color={colors.text} size={22} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("appointments")}</Text>
        <TouchableOpacity testID="new-appt-btn" onPress={() => setModalVisible(true)} hitSlop={10} style={{ padding: 6 }}><Plus color={colors.primary} size={26} /></TouchableOpacity>
      </View>

      {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar color={colors.textMuted} size={42} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {lang === "bn" ? "কোনো অ্যাপয়েন্টমেন্ট নেই" : "No appointments yet"}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {lang === "bn" ? "ডাক্তারের ভিজিট যোগ করুন।" : "Tap + to add a doctor visit."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} testID={`appt-${item.id}`}>
              <View style={[styles.dateBox, { backgroundColor: colors.primarySoft }]}>
                <Calendar color={isDark ? "#fff" : colors.primary} size={26} />
                <Text style={[styles.dateText, { color: isDark ? "#fff" : colors.primary }]}>{item.date}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.doctor_name}</Text>
                {!!item.specialty && <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.specialty}</Text>}
                <View style={styles.row}>
                  {!!item.time && (<><Clock color={colors.textMuted} size={13} /><Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.time}</Text></>)}
                  {!!item.location && <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}> · {item.location}</Text>}
                </View>
                {!!item.notes && <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={2}>{item.notes}</Text>}
              </View>
              <TouchableOpacity testID={`delete-appt-${item.id}`} onPress={() => remove(item.id)} hitSlop={10} style={{ padding: 6 }}>
                <Trash2 color={colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: 16, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10} style={{ padding: 6 }}><X color={colors.text} size={22} /></TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{t("newAppointment")}</Text>
            <View style={{ width: 32 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Field testID="appt-doctor" label={t("doctorName")} value={form.doctor_name} onChangeText={(v: string) => setForm((f) => ({ ...f, doctor_name: v }))} colors={colors} />
            <Field testID="appt-specialty" label={t("specialty")} value={form.specialty} onChangeText={(v: string) => setForm((f) => ({ ...f, specialty: v }))} colors={colors} />
            <Field testID="appt-date" label={t("date")} value={form.date} onChangeText={(v: string) => setForm((f) => ({ ...f, date: v }))} colors={colors} placeholder="2026-03-15" />
            <Field testID="appt-time" label={t("time")} value={form.time} onChangeText={(v: string) => setForm((f) => ({ ...f, time: v }))} colors={colors} placeholder="10:30" />
            <Field testID="appt-location" label={t("location")} value={form.location} onChangeText={(v: string) => setForm((f) => ({ ...f, location: v }))} colors={colors} />
            <Field testID="appt-notes" label={t("notes")} value={form.notes} onChangeText={(v: string) => setForm((f) => ({ ...f, notes: v }))} colors={colors} multiline />
            <TouchableOpacity
              testID="save-appt"
              onPress={create}
              disabled={saving || !form.doctor_name.trim() || !form.date.trim()}
              style={[styles.saveBtn, { backgroundColor: form.doctor_name.trim() && form.date.trim() ? colors.primary : colors.surfaceAlt }]}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t("save")}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, value, onChangeText, colors, placeholder, multiline, testID }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: "600" }}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === "ios" ? 14 : 10,
          fontSize: 15,
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  empty: { padding: 36, borderRadius: 20, borderWidth: 1, alignItems: "center", gap: 10, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  dateBox: { width: 72, height: 72, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 4 },
  dateText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardSub: { fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 13 },
  notes: { fontSize: 13, marginTop: 6 },
  modalContainer: { flex: 1 },
  saveBtn: { paddingVertical: 16, borderRadius: 999, alignItems: "center", marginTop: 10 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
