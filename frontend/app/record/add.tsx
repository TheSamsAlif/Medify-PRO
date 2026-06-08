import { useState } from "react";
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, Check, Image as ImageIcon } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

const TYPES = [
  { key: "prescription", en: "Prescription", bn: "প্রেসক্রিপশন" },
  { key: "report", en: "Report", bn: "রিপোর্ট" },
  { key: "test_result", en: "Test Result", bn: "টেস্ট রিপোর্ট" },
  { key: "image", en: "Image", bn: "ছবি" },
];

export default function AddRecord() {
  const { colors, t, lang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("report");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<{ uri: string; base64: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.6 });
    if (!res.canceled && res.assets[0]?.base64) {
      setImage({ uri: res.assets[0].uri, base64: res.assets[0].base64 });
    }
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.post("/health-records", {
        title: title.trim(),
        record_type: type,
        description: description.trim(),
        image_base64: image?.base64 || undefined,
      });
      router.replace("/(tabs)/records");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="add-record-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}><ArrowLeft color={colors.text} size={22} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("addRecord")}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: "600" }}>{t("recordType")}</Text>
        <View style={styles.typeRow}>
          {TYPES.map((tp) => (
            <TouchableOpacity
              key={tp.key}
              testID={`type-${tp.key}`}
              onPress={() => setType(tp.key)}
              style={[
                styles.typePill,
                {
                  backgroundColor: type === tp.key ? colors.primary : colors.surface,
                  borderColor: type === tp.key ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: type === tp.key ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>
                {lang === "bn" ? tp.bn : tp.en}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field testID="record-title" label={t("title")} value={title} onChangeText={setTitle} colors={colors} placeholder={lang === "bn" ? "যেমনঃ রক্ত পরীক্ষা" : "e.g. Blood test"} />
        <Field testID="record-desc" label={t("description")} value={description} onChangeText={setDescription} colors={colors} multiline />

        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 8, fontWeight: "600" }}>{t("addPhoto")}</Text>
        {image ? (
          <View style={{ position: "relative" }}>
            <Image source={{ uri: image.uri }} style={[styles.preview, { borderColor: colors.border }]} />
            <TouchableOpacity testID="remove-photo" onPress={() => setImage(null)} style={styles.removePhotoBtn}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <TouchableOpacity testID="pick-camera" onPress={() => pick(true)} style={[styles.photoBtn, { backgroundColor: colors.primary }]}>
              <Camera color="#fff" size={22} />
              <Text style={styles.photoBtnText}>{t("takePhoto")}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="pick-gallery" onPress={() => pick(false)} style={[styles.photoBtn, { backgroundColor: colors.secondary }]}>
              <ImageIcon color="#fff" size={22} />
              <Text style={styles.photoBtnText}>{t("fromGallery")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          testID="save-record-btn"
          onPress={save}
          disabled={saving || !title.trim()}
          style={[styles.primaryBtn, { backgroundColor: title.trim() ? colors.primary : colors.surfaceAlt }]}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Check color={title.trim() ? "#fff" : colors.textMuted} size={20} />
              <Text style={[styles.primaryBtnText, { color: title.trim() ? "#fff" : colors.textMuted }]}>{t("save")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  typePill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  preview: { width: "100%", height: 200, borderRadius: 14, borderWidth: 1, resizeMode: "cover" },
  removePhotoBtn: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  photoRow: { flexDirection: "row", gap: 10 },
  photoBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 16, borderRadius: 14 },
  photoBtnText: { color: "#fff", fontWeight: "700" },
  footer: { padding: 14, borderTopWidth: 1 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 999 },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
});
