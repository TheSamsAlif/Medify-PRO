import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, HeartPulse, Lock, Mail } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { useAuth } from "@/src/lib/AuthContext";

export default function LoginScreen() {
  const { colors, lang } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(lang === "bn" ? "ইমেইল ও পাসওয়ার্ড দিন" : "Enter email and password");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg || (lang === "bn" ? "লগইন ব্যর্থ হয়েছে" : "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }} testID="login-screen">
      <View style={styles.bgWrap}>
        <View style={[styles.blob, { backgroundColor: "#1E3A8A", top: -100, left: -90 }]} />
        <View style={[styles.blob, { backgroundColor: "#10B981", bottom: -120, right: -100 }]} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="login-back" onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>

          <View style={styles.heroIcon}>
            <HeartPulse color="#fff" size={36} />
          </View>
          <Text style={styles.title}>{lang === "bn" ? "স্বাগতম" : "Welcome back"}</Text>
          <Text style={styles.subtitle}>
            {lang === "bn" ? "আপনার মেডিফাই অ্যাকাউন্টে লগইন করুন" : "Sign in to continue to Medify"}
          </Text>

          <View style={styles.form}>
            <FieldRow icon={<Mail color="#94A3B8" size={18} />} placeholder={lang === "bn" ? "ইমেইল" : "Email"} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="login-email" />
            <FieldRow icon={<Lock color="#94A3B8" size={18} />} placeholder={lang === "bn" ? "পাসওয়ার্ড" : "Password"} value={password} onChangeText={setPassword} secureTextEntry testID="login-password" />

            {!!error && (
              <Text style={styles.error} testID="login-error">{error}</Text>
            )}

            <TouchableOpacity
              testID="login-submit"
              onPress={submit}
              disabled={busy}
              style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
            >
              {busy ? (
                <ActivityIndicator color="#1E3A8A" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>{lang === "bn" ? "লগইন" : "Sign in"}</Text>
                  <ArrowRight color="#1E3A8A" size={20} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.altRow}>
              <Text style={styles.altText}>{lang === "bn" ? "নতুন এখানে?" : "New here?"}</Text>
              <TouchableOpacity testID="go-register" onPress={() => router.replace("/(auth)/register")}>
                <Text style={styles.altLink}>{lang === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "Create an account"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerSmall}>{lang === "bn" ? "তৈরি করেছেন" : "Developed by"}</Text>
            <Text style={styles.footerName}>Sams Alif</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldRow({ icon, ...props }: any) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>{icon}</View>
      <TextInput
        {...props}
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bgWrap: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", width: 320, height: 320, borderRadius: 320, opacity: 0.45 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  heroIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginTop: 30 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 18 },
  subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 15, marginTop: 6 },
  form: { marginTop: 32, gap: 12 },
  fieldRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", borderRadius: 16, paddingHorizontal: 14, minHeight: 56 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 16, paddingVertical: Platform.OS === "ios" ? 16 : 12 },
  error: { color: "#FCA5A5", fontSize: 13, marginTop: 2, marginLeft: 4 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff", paddingVertical: 16, borderRadius: 999, marginTop: 8 },
  primaryBtnText: { color: "#1E3A8A", fontSize: 16, fontWeight: "800" },
  altRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 },
  altText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  altLink: { color: "#FBBF24", fontSize: 14, fontWeight: "700" },
  footer: { marginTop: 40, alignItems: "center" },
  footerSmall: { color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "600" },
  footerName: { color: "#FBBF24", fontSize: 14, fontWeight: "800", marginTop: 2 },
});
