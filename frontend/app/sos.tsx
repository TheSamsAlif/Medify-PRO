import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { AlertCircle, Check, Phone, ShieldAlert, X } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

export default function SOS() {
  const { colors, t, lang } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | { notified: { name: string; phone: string }[] }>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [pulse]);

  const trigger = async () => {
    setSending(true);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
    } catch {}
    try {
      const res = await api.post("/sos", { latitude: lat, longitude: lng, message: "Emergency! Patient needs immediate help." });
      setSent({ notified: res.data?.alert?.notified || [] });
    } catch {
      setSent({ notified: [] });
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="sos-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity testID="close-sos" onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <X color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("sos")}</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.body}>
        {!sent ? (
          <>
            <Animated.View style={[styles.pulseRing, { backgroundColor: colors.dangerSoft, transform: [{ scale: pulse }] }]} />
            <View style={[styles.sosCircle, { backgroundColor: colors.danger }]}>
              <ShieldAlert color="#fff" size={80} />
            </View>
            <Text style={[styles.sosTitle, { color: colors.text }]}>{t("sosConfirm")}</Text>
            <Text style={[styles.sosDesc, { color: colors.textSecondary }]}>{t("sosDesc")}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                testID="cancel-sos"
                onPress={() => router.back()}
                style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.btnText, { color: colors.text }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="send-sos"
                onPress={trigger}
                disabled={sending}
                style={[styles.btn, { backgroundColor: colors.danger, flex: 1.5 }]}
              >
                {sending ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <AlertCircle color="#fff" size={20} />
                    <Text style={[styles.btnText, { color: "#fff" }]}>{t("sendAlert")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.sosCircle, { backgroundColor: colors.secondary }]}>
              <Check color="#fff" size={80} />
            </View>
            <Text style={[styles.sosTitle, { color: colors.text }]}>{t("alertSent")}</Text>
            <Text style={[styles.sosDesc, { color: colors.textSecondary }]}>
              {lang === "bn" ? "নিম্নলিখিত ব্যক্তিদের জানানো হয়েছে:" : "The following people have been notified:"}
            </Text>
            <View style={{ width: "100%", marginTop: 18 }}>
              {sent.notified.filter((n) => n.phone).map((n, i) => (
                <View key={i} style={[styles.notifiedRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifName, { color: colors.text }]}>{n.name}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{n.phone}</Text>
                  </View>
                  <TouchableOpacity
                    testID={`call-notified-${i}`}
                    onPress={() => Linking.openURL(`tel:${n.phone}`)}
                    style={[styles.callBtn, { backgroundColor: colors.primary }]}
                  >
                    <Phone color="#fff" size={18} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity
              testID="ambulance-call"
              onPress={() => Linking.openURL("tel:10921")}
              style={[styles.btn, { backgroundColor: colors.danger, width: "100%", marginTop: 12 }]}
            >
              <Phone color="#fff" size={20} />
              <Text style={[styles.btnText, { color: "#fff" }]}>{t("callAmbulance")} (10921)</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="close-sos-done" onPress={() => router.back()} style={{ marginTop: 14 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>{t("done")}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  body: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 200, height: 200, borderRadius: 100, top: "30%" },
  sosCircle: { width: 160, height: 160, borderRadius: 80, alignItems: "center", justifyContent: "center", marginBottom: 26, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  sosTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  sosDesc: { fontSize: 15, textAlign: "center", marginTop: 10, paddingHorizontal: 12 },
  actions: { flexDirection: "row", gap: 12, marginTop: 32, width: "100%" },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 999 },
  btnText: { fontSize: 16, fontWeight: "700" },
  notifiedRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  notifName: { fontSize: 15, fontWeight: "700" },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
