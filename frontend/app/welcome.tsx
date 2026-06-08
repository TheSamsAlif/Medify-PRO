import { useEffect, useRef } from "react";
import { Animated, Easing, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeartPulse, ShieldCheck, Sparkles, Stethoscope } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";

export default function Welcome() {
  const { t, lang, setLang } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const float = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(float, { toValue: 0, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, [float, shimmer, fade]);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-260, 360] });

  return (
    <View style={styles.root} testID="welcome-screen">
      {/* Colorful background layers */}
      <View style={[styles.bgLayer, { backgroundColor: "#0F172A" }]} />
      <View style={[styles.blob, styles.blobTL, { backgroundColor: "#1E3A8A" }]} />
      <View style={[styles.blob, styles.blobTR, { backgroundColor: "#10B981" }]} />
      <View style={[styles.blob, styles.blobBL, { backgroundColor: "#7C3AED" }]} />
      <View style={[styles.blob, styles.blobBR, { backgroundColor: "#F59E0B" }]} />
      <View style={[styles.dim, { backgroundColor: "rgba(15,23,42,0.62)" }]} />

      {/* Top language pill */}
      <View style={[styles.topRow, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          testID="welcome-lang-toggle"
          onPress={() => setLang(lang === "en" ? "bn" : "en")}
          style={styles.langPill}
        >
          <Text style={styles.langText}>{lang === "en" ? "বাংলা" : "EN"}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fade, paddingBottom: insets.bottom + 24 }]}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ translateY: floatY }] }]}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <HeartPulse color="#1E3A8A" size={56} strokeWidth={2.5} />
            </View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerX }, { rotate: "20deg" }] },
              ]}
            />
          </View>
          <View style={[styles.logoBadge, { backgroundColor: "#10B981" }]}>
            <Sparkles color="#fff" size={14} />
          </View>
        </Animated.View>

        {/* Brand */}
        <Text style={styles.brand}>Medify</Text>
        <View style={styles.taglinePill}>
          <Stethoscope color="#FFF" size={14} />
          <Text style={styles.tagline}>
            {lang === "bn" ? "আপনার এআই স্বাস্থ্য সঙ্গী" : "Your AI Health Companion"}
          </Text>
        </View>

        {/* Feature chips */}
        <View style={styles.chipsRow}>
          <Chip color="#1E3A8A" label={lang === "bn" ? "ঔষধ স্মরণ" : "Reminders"} />
          <Chip color="#10B981" label={lang === "bn" ? "এআই চ্যাট" : "AI Chat"} />
          <Chip color="#F59E0B" label={lang === "bn" ? "প্রেসক্রিপশন" : "Rx Scan"} />
          <Chip color="#EF4444" label={lang === "bn" ? "জরুরি" : "SOS"} />
        </View>

        {/* CTA buttons */}
        <View style={styles.ctaWrap}>
          <Pressable
            testID="welcome-register-btn"
            onPress={() => router.push("/(auth)/register")}
            style={({ pressed }) => [styles.primaryBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View style={styles.primaryBtnInner}>
              <Text style={styles.primaryBtnText}>
                {lang === "bn" ? "শুরু করুন" : "Get Started"}
              </Text>
              <Sparkles color="#1E3A8A" size={18} />
            </View>
          </Pressable>

          <TouchableOpacity
            testID="welcome-login-btn"
            onPress={() => router.push("/(auth)/login")}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>
              {lang === "bn" ? "ইতিমধ্যে একাউন্ট আছে? লগইন" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trust strip */}
        <View style={styles.trustRow}>
          <ShieldCheck color="rgba(255,255,255,0.9)" size={14} />
          <Text style={styles.trustText}>
            {lang === "bn" ? "নিরাপদ · বাংলা ও ইংরেজি · প্রবীণদের জন্য" : "Private · Bengali & English · Elderly-friendly"}
          </Text>
        </View>

        {/* Credit */}
        <View style={styles.credit}>
          <Text style={styles.creditLine}>{lang === "bn" ? "তৈরি করেছেন" : "Developed by"}</Text>
          <Text style={styles.creditName}>Sams Alif</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function Chip({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + "33", borderColor: color }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  bgLayer: { ...StyleSheet.absoluteFillObject },
  blob: { position: "absolute", width: 360, height: 360, borderRadius: 360, opacity: 0.6 },
  blobTL: { top: -120, left: -120 },
  blobTR: { top: -100, right: -140, opacity: 0.55 },
  blobBL: { bottom: -160, left: -120, opacity: 0.55 },
  blobBR: { bottom: -180, right: -120, opacity: 0.5 },
  dim: { ...StyleSheet.absoluteFillObject },
  topRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20 },
  langPill: { backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  langText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  logoWrap: { alignItems: "center", justifyContent: "center", marginBottom: 22 },
  logoOuter: { width: 132, height: 132, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", overflow: "hidden", ...Platform.select({ ios: { shadowColor: "#10B981", shadowOpacity: 0.5, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 12 } }) },
  logoInner: { width: 100, height: 100, borderRadius: 28, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  shimmer: { position: "absolute", width: 80, height: 220, backgroundColor: "rgba(255,255,255,0.18)" },
  logoBadge: { position: "absolute", right: -4, top: -4, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  brand: { color: "#fff", fontSize: 56, fontWeight: "900", letterSpacing: 1.5, textShadowColor: "rgba(16,185,129,0.55)", textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  taglinePill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginTop: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  tagline: { color: "#fff", fontSize: 14, fontWeight: "600" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 24, justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  ctaWrap: { width: "100%", marginTop: 36, gap: 12 },
  primaryBtn: { borderRadius: 999, overflow: "hidden", backgroundColor: "#fff", ...Platform.select({ ios: { shadowColor: "#10B981", shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 8 } }, android: { elevation: 10 } }) },
  primaryBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  primaryBtnText: { color: "#1E3A8A", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  secondaryBtn: { paddingVertical: 14, alignItems: "center" },
  secondaryBtnText: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600" },
  trustRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 22 },
  trustText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "500" },
  credit: { marginTop: 26, alignItems: "center" },
  creditLine: { color: "rgba(255,255,255,0.65)", fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "600" },
  creditName: { color: "#FBBF24", fontSize: 17, fontWeight: "800", marginTop: 2, letterSpacing: 0.5 },
});
