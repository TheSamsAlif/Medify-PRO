import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { ArrowLeft, Camera, Check, Image as ImageIcon, RefreshCcw, Sparkles, X } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface ExtractedMed {
  name: string;
  dosage?: string;
  frequency?: string;
  duration_days?: number | string;
  instructions?: string;
}

interface Extracted {
  doctor_name?: string;
  visit_date?: string;
  next_followup?: string;
  diagnosis?: string;
  medicines?: ExtractedMed[];
  notes?: string;
}

type Stage = "capture" | "review" | "edit";

export default function ScanScreen() {
  const { colors, t, lang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [stage, setStage] = useState<Stage>("capture");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [doctor, setDoctor] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [followup, setFollowup] = useState("");
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState<ExtractedMed[]>([]);

  const ensurePerm = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      return r.granted;
    }
    return true;
  };

  useEffect(() => { ensurePerm(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const capture = async () => {
    if (!cameraRef.current) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7, skipProcessing: false });
      if (photo?.base64) {
        setPhotoBase64(photo.base64);
        setPhotoUri(photo.uri);
        await runScan(photo.base64);
      }
    } catch (e) {
      setBusy(false);
    }
  };

  const pickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setPhotoBase64(result.assets[0].base64);
      setPhotoUri(result.assets[0].uri);
      await runScan(result.assets[0].base64);
    }
  };

  const runScan = async (b64: string) => {
    setBusy(true);
    try {
      const res = await api.post("/prescriptions/scan", { image_base64: b64 });
      const ex = res.data.extracted as Extracted;
      setExtracted(ex);
      setDoctor(ex.doctor_name || "");
      setVisitDate(ex.visit_date || "");
      setFollowup(ex.next_followup || "");
      setNotes(ex.notes || "");
      setMeds((ex.medicines || []).map((m) => ({ ...m, duration_days: m.duration_days || 30 })));
      setStage("review");
    } catch (e) {
      setExtracted({ medicines: [], notes: "Scan failed" });
      setMeds([]);
      setStage("review");
    } finally {
      setBusy(false);
    }
  };

  const retake = () => {
    setPhotoBase64(null);
    setPhotoUri(null);
    setExtracted(null);
    setMeds([]);
    setStage("capture");
  };

  const updateMed = (i: number, k: keyof ExtractedMed, v: any) => {
    setMeds((prev) => prev.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));
  };
  const removeMed = (i: number) => setMeds((prev) => prev.filter((_, idx) => idx !== i));
  const addBlankMed = () => setMeds((prev) => [...prev, { name: "", dosage: "", frequency: "1-0-1", duration_days: 30, instructions: "" }]);

  const save = async () => {
    setBusy(true);
    try {
      await api.post("/prescriptions", {
        doctor_name: doctor,
        visit_date: visitDate,
        next_followup: followup,
        diagnosis: extracted?.diagnosis || "",
        medicines: meds.filter((m) => m.name).map((m) => ({
          name: m.name,
          dosage: m.dosage || "",
          frequency: m.frequency || "1-0-1",
          duration_days: Number(m.duration_days) || 30,
          instructions: m.instructions || "",
        })),
        notes,
        image_base64: photoBase64 || undefined,
      });
      router.replace("/(tabs)/medicines");
    } finally {
      setBusy(false);
    }
  };

  // PERMISSION
  if (!permission) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24, paddingTop: insets.top + 40 }]}>
        <Camera color={colors.primary} size={48} />
        <Text style={[styles.permTitle, { color: colors.text }]}>{t("permissionNeeded")}</Text>
        <Text style={[styles.permDesc, { color: colors.textSecondary }]}>{t("cameraPermDesc")}</Text>
        <TouchableOpacity
          testID="grant-camera-btn"
          onPress={async () => {
            const r = await requestPermission();
            if (!r.granted && !r.canAskAgain) Linking.openSettings();
          }}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryBtnText}>{t("retryCamera")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ color: colors.textSecondary }}>{t("cancel")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // CAPTURE
  if (stage === "capture") {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]} testID="scan-capture">
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={[styles.scanTop, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity testID="close-scan" onPress={() => router.back()} style={styles.iconBtn}>
            <X color="#fff" size={22} />
          </TouchableOpacity>
          <View style={styles.scanHeaderTitle}>
            <Text style={styles.scanTitle}>{t("scanPrescription")}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.scanFrame, { borderColor: "rgba(255,255,255,0.5)" }]}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <View style={[styles.scanBottom, { paddingBottom: insets.bottom + 30 }]}>
          <Text style={styles.scanHint}>{t("scanDisclaimer")}</Text>
          <View style={styles.captureRow}>
            <TouchableOpacity testID="pick-gallery-btn" onPress={pickGallery} style={styles.galleryBtn}>
              <ImageIcon color="#fff" size={26} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="capture-btn"
              onPress={capture}
              disabled={busy}
              style={styles.captureBtn}
            >
              <View style={styles.captureInner}>
                {busy ? <ActivityIndicator color="#fff" /> : <Camera color="#1E3A8A" size={28} />}
              </View>
            </TouchableOpacity>
            <View style={{ width: 56 }} />
          </View>
        </View>
        {busy && (
          <View style={styles.processingOverlay}>
            <Sparkles color="#fff" size={36} />
            <Text style={styles.processingText}>{t("scanning")}</Text>
          </View>
        )}
      </View>
    );
  }

  // REVIEW / EDIT
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="scan-review">
      <View style={[styles.reviewHeader, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity testID="back-scan" onPress={retake} hitSlop={10} style={{ padding: 6 }}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.reviewTitle, { color: colors.text }]}>{t("scanResults")}</Text>
        <TouchableOpacity testID="retake-btn" onPress={retake} hitSlop={10} style={{ padding: 6 }}>
          <RefreshCcw color={colors.text} size={20} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        {photoUri && <Image source={{ uri: photoUri }} style={[styles.preview, { borderColor: colors.border }]} />}
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>{t("scanDisclaimer")}</Text>

        <Field label={t("doctorName")} value={doctor} onChangeText={setDoctor} colors={colors} testID="field-doctor" />
        <Field label={t("date")} value={visitDate} onChangeText={setVisitDate} colors={colors} testID="field-visit-date" />
        <Field label={lang === "bn" ? "ফলো-আপ তারিখ" : "Follow-up date"} value={followup} onChangeText={setFollowup} colors={colors} testID="field-followup" />

        <Text style={[styles.medsSection, { color: colors.text }]}>{t("medicines")}</Text>
        {meds.map((m, i) => (
          <View key={i} style={[styles.medBox, { backgroundColor: colors.surface, borderColor: colors.border }]} testID={`extracted-med-${i}`}>
            <View style={styles.medBoxHeader}>
              <Text style={[styles.medIndex, { color: colors.primary }]}>#{i + 1}</Text>
              <TouchableOpacity testID={`remove-extracted-med-${i}`} onPress={() => removeMed(i)} hitSlop={10}>
                <X color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>
            <Field label={t("name")} value={m.name} onChangeText={(v) => updateMed(i, "name", v)} colors={colors} compact testID={`extracted-name-${i}`} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><Field label={t("dosage")} value={m.dosage || ""} onChangeText={(v) => updateMed(i, "dosage", v)} colors={colors} compact testID={`extracted-dosage-${i}`} /></View>
              <View style={{ flex: 1 }}><Field label={t("frequency")} value={m.frequency || ""} onChangeText={(v) => updateMed(i, "frequency", v)} colors={colors} compact testID={`extracted-freq-${i}`} /></View>
            </View>
            <Field label={t("instructions")} value={m.instructions || ""} onChangeText={(v) => updateMed(i, "instructions", v)} colors={colors} compact testID={`extracted-instr-${i}`} />
          </View>
        ))}
        <TouchableOpacity onPress={addBlankMed} style={[styles.addMedBtn, { borderColor: colors.primary }]} testID="add-extracted-med">
          <Text style={{ color: colors.primary, fontWeight: "700" }}>+ {t("addMedicine")}</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          testID="save-prescription-btn"
          onPress={save}
          disabled={busy}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
        >
          {busy ? <ActivityIndicator color="#fff" /> : (
            <>
              <Check color="#fff" size={20} />
              <Text style={styles.primaryBtnText}>{t("saveAndAddMeds")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, colors, compact, testID }: any) {
  return (
    <View style={{ marginTop: compact ? 8 : 14 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: "600" }}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        style={{
          backgroundColor: colors.surfaceAlt,
          color: colors.text,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === "ios" ? 14 : 10,
          fontSize: 15,
          minHeight: 48,
        }}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  permTitle: { fontSize: 22, fontWeight: "800", marginTop: 18, textAlign: "center" },
  permDesc: { fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24, paddingHorizontal: 20 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  scanTop: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", zIndex: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  scanHeaderTitle: { flex: 1, alignItems: "center" },
  scanTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  scanFrame: { position: "absolute", top: "20%", bottom: "25%", left: 24, right: 24, borderWidth: 2, borderRadius: 16, borderStyle: "dashed" },
  corner: { position: "absolute", width: 24, height: 24, borderColor: "#fff", borderWidth: 3 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  scanBottom: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, alignItems: "center" },
  scanHint: { color: "#fff", textAlign: "center", marginBottom: 18, fontSize: 13, paddingHorizontal: 30 },
  captureRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  galleryBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  captureBtn: { width: 84, height: 84, borderRadius: 42, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  captureInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", gap: 14 },
  processingText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottomWidth: 1 },
  reviewTitle: { fontSize: 18, fontWeight: "700" },
  preview: { width: "100%", height: 180, borderRadius: 14, marginBottom: 12, borderWidth: 1, resizeMode: "cover" },
  disclaimer: { fontSize: 12, marginBottom: 8, fontStyle: "italic" },
  medsSection: { fontSize: 17, fontWeight: "700", marginTop: 18, marginBottom: 10 },
  medBox: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  medBoxHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  medIndex: { fontSize: 13, fontWeight: "700" },
  addMedBtn: { borderWidth: 1, borderStyle: "dashed", borderRadius: 14, padding: 14, alignItems: "center", marginTop: 4 },
  footer: { flexDirection: "row", padding: 14, borderTopWidth: 1, gap: 8 },
});
