import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ambulance, ArrowLeft, Flame, HeartPulse, Hospital, Phone, ShieldAlert } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface C { id: string; name: string; phone: string; category: string; icon: string; }

export default function Emergency() {
  const { colors, t, lang } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const res = await api.get("/emergency-contacts");
        setData(res.data || []);
      } finally { setLoading(false); }
    })();
  }, []));

  const iconFor = (name: string) => {
    const props = { color: "#fff", size: 24 } as const;
    if (name.includes("ambulance")) return <Ambulance {...props} />;
    if (name.includes("flame")) return <Flame {...props} />;
    if (name.includes("heart")) return <HeartPulse {...props} />;
    if (name.includes("hospital")) return <Hospital {...props} />;
    if (name.includes("shield")) return <ShieldAlert {...props} />;
    return <Phone {...props} />;
  };
  const colorFor = (cat: string) => ({
    national: colors.primary,
    ambulance: colors.danger,
    hospital: colors.secondary,
    guardian: colors.accent,
    doctor: colors.secondary,
  }[cat] || colors.primary);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="emergency-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}><ArrowLeft color={colors.text} size={22} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("emergencyContacts")}</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View> : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`emergency-call-${item.id}`}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
              activeOpacity={0.85}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.iconBox, { backgroundColor: colorFor(item.category) }]}>{iconFor(item.icon)}</View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.cardPhone, { color: colors.primary }]}>{item.phone}</Text>
              </View>
              <View style={[styles.callBtn, { backgroundColor: colorFor(item.category) }]}>
                <Phone color="#fff" size={20} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardPhone: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  callBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
