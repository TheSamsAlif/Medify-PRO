import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Calendar, Lock, Mail, Sparkles, User } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { useAuth } from "@/src/lib/AuthContext";

export default function RegisterScreen() {
  const { lang } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError(lang === "bn" ? "সব ফিল্ড পূরণ করুন" : "Please fill all required fields");
      return;
    }
    if (password.length < 6) {
      setError(lang === "bn" ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" : "Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        age: age ? parseInt(age, 10) : undefined,
        language: lang,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      setError(msg || (lang === "bn" ? "নিবন্ধন ব্যর্থ হয়েছে" : "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }} testID="register-screen">
      <View style={styles.bgWrap}>
        <View style={[styles.blob, { backgroundColor: "#7C3AED", top: -110, right: -90 }]} />
        <View style={[styles.blob, { backgroundColor: "#10B981", bottom: -150, left: -100 }]} />
        <View style={[styles.blob, { backgroundColor: "#F59E0B", top: 220, left: -120, opacity: 0.4 }]} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="register-back" onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>

          <View style={styles.heroIcon}>
            <Sparkles color="#fff" size={36} />
          </View>
          <Text style={styles.title}>{lang === "bn" ? "একাউন্ট তৈরি করুন" : "Create account"}</Text>
          <Text style={styles.subtitle}>
            {lang === "bn" ? "মেডিফাই দিয়ে স্বাস্থ্য যাত্রা শুরু করুন" : "Start your wellness journey with Medify"}
          </Text>

          <View style={styles.form}>
            <FieldRow icon={<User color="#94A3B8" size={18} />} placeholder={lang === "bn" ? "নাম" : "Full name"} value={name} onChangeText={setName} autoCapitalize="words" testID="register-name" />
            <FieldRow icon={<Mail color="#94A3B8" size={18} />} placeholder={lang === "bn" ? "ইমেইল" : "Email"} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="register-email" />
            <FieldRow icon={<Lock color="#94A3B8" size={18} />} placeholder={lang === "bn" ? "পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)" : "Password (min 6 chars)"} value={password} onChangeText={setPassword} secureTextEntry testID="register-password" />
            <FieldRow icon={<Calendar color="#94A3B8" size={18} />} placeholder={lang === "bn" ? "বয়স (ঐচ্ছিক)" : "Age (optional)"} value={age} onChangeText={setAge} keyboardType="number-pad" testID="register-age" />

            {!!error && <Text style={styles.error} testID="register-error">{error}</Text>}

            <TouchableOpacity
              testID="register-submit"
              onPress={submit}
              disabled={busy}
              style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
            >
              {busy ? (
                <ActivityIndicator color="#1E3A8A" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>{lang === "bn" ? "একাউন্ট তৈরি করুন" : "Create account"}</Text>
                  <ArrowRight color="#1E3A8A" size={20} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.altRow}>
              <Text style={styles.altText}>{lang === "bn" ? "ইতিমধ্যে একাউন্ট আছে?" : "Already have an account?"}</Text>
              <TouchableOpacity testID="go-login" onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.altLink}>{lang === "bn" ? "লগইন করুন" : "Sign in"}</Text>
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
      <TextInput {...props} placeholderTextColor="#94A3B8" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  bgWrap: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", width: 320, height: 320, borderRadius: 320, opacity: 0.45 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  heroIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginTop: 24 },
  title: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 16 },
  subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 15, marginTop: 6 },
  form: { marginTop: 26, gap: 12 },
  fieldRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", borderRadius: 16, paddingHorizontal: 14, minHeight: 56 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 16, paddingVertical: Platform.OS === "ios" ? 16 : 12 },
  error: { color: "#FCA5A5", fontSize: 13, marginTop: 2, marginLeft: 4 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff", paddingVertical: 16, borderRadius: 999, marginTop: 8 },
  primaryBtnText: { color: "#1E3A8A", fontSize: 16, fontWeight: "800" },
  altRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16, flexWrap: "wrap" },
  altText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  altLink: { color: "#FBBF24", fontSize: 14, fontWeight: "700" },
  footer: { marginTop: 30, alignItems: "center" },
  footerSmall: { color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "600" },
  footerName: { color: "#FBBF24", fontSize: 14, fontWeight: "800", marginTop: 2 },
});
