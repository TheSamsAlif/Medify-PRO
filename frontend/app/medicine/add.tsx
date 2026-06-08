import { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

export default function AddMedicine() {
  const { colors, t, lang } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("1-0-1");
  const [times, setTimes] = useState("08:00,20:00");
  const [duration, setDuration] = useState("30");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const parsedTimes = times
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^\d{1,2}:\d{2}$/.test(s));
      await api.post("/medicines", {
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        times: parsedTimes,
        duration_days: parseInt(duration, 10) || 30,
        instructions: instructions.trim(),
      });
      router.replace("/(tabs)/medicines");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="add-medicine-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity testID="back-add-med" onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("addMedicine")}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Field testID="med-name" label={t("name")} value={name} onChangeText={setName} colors={colors} placeholder="Napa, Metformin..." />
        <Field testID="med-dosage" label={t("dosage")} value={dosage} onChangeText={setDosage} colors={colors} placeholder="500mg" />
        <Field testID="med-frequency" label={t("frequency")} value={frequency} onChangeText={setFrequency} colors={colors} placeholder="1-0-1" />
        <Field testID="med-times" label={t("times")} value={times} onChangeText={setTimes} colors={colors} placeholder="08:00,20:00" />
        <Field testID="med-duration" label={t("duration")} value={duration} onChangeText={setDuration} colors={colors} keyboardType="number-pad" />
        <Field testID="med-instructions" label={t("instructions")} value={instructions} onChangeText={setInstructions} colors={colors} placeholder={lang === "bn" ? "খাবারের পরে" : "After meal"} multiline />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          testID="save-medicine-btn"
          onPress={save}
          disabled={busy || !name.trim()}
          style={[styles.primaryBtn, { backgroundColor: name.trim() ? colors.primary : colors.surfaceAlt }]}
        >
          {busy ? <ActivityIndicator color="#fff" /> : (
            <>
              <Check color={name.trim() ? "#fff" : colors.textMuted} size={20} />
              <Text style={[styles.primaryBtnText, { color: name.trim() ? "#fff" : colors.textMuted }]}>{t("save")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, colors, placeholder, keyboardType, multiline, testID }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: "600" }}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === "ios" ? 14 : 10,
          fontSize: 16,
          minHeight: multiline ? 80 : 50,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  footer: { padding: 14, borderTopWidth: 1 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 999 },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
});
