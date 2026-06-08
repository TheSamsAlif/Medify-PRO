import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Hospital, MapPin, Navigation, Phone, Siren } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface H {
  id: string;
  name: string;
  address: string;
  phone: string;
  emergency_phone?: string;
  distance_km: number;
  type: string;
}

export default function Hospitals() {
  const { colors, t, lang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<H[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/hospitals");
      setData(res.data || []);
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const typeLabel = (type: string) => {
    const map: any = {
      government: { en: "Government", bn: "সরকারি" },
      hospital: { en: "Hospital", bn: "হাসপাতাল" },
      clinic: { en: "Clinic", bn: "ক্লিনিক" },
      diagnostic: { en: "Diagnostic", bn: "ডায়াগনস্টিক" },
    };
    return (map[type] || { en: type, bn: type })[lang];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="hospitals-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}><ArrowLeft color={colors.text} size={22} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("hospitalsNearby")}</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} testID={`hospital-${item.id}`}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                  <Hospital color={isDark ? "#fff" : colors.primary} size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.typePill, { backgroundColor: colors.secondarySoft }]}>
                    <Text style={[styles.typeText, { color: isDark ? "#fff" : colors.secondary }]}>{typeLabel(item.type)}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <MapPin color={colors.textMuted} size={14} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{item.address}</Text>
                  </View>
                  <Text style={[styles.distance, { color: colors.primary }]}>{item.distance_km.toFixed(1)} {t("km")}</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  testID={`call-hospital-${item.id}`}
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                  style={[styles.actBtn, { backgroundColor: colors.primary }]}
                >
                  <Phone color="#fff" size={18} />
                  <Text style={styles.actText}>{t("call")}</Text>
                </TouchableOpacity>
                {!!item.emergency_phone && (
                  <TouchableOpacity
                    testID={`emergency-hospital-${item.id}`}
                    onPress={() => Linking.openURL(`tel:${item.emergency_phone}`)}
                    style={[styles.actBtn, { backgroundColor: colors.danger }]}
                  >
                    <Siren color="#fff" size={18} />
                    <Text style={styles.actText}>{t("sos")}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  testID={`navigate-hospital-${item.id}`}
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + " " + item.address)}`)}
                  style={[styles.actBtn, { backgroundColor: colors.secondary }]}
                >
                  <Navigation color="#fff" size={18} />
                </TouchableOpacity>
              </View>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  card: { padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  row: { flexDirection: "row", gap: 12 },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  typePill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 4 },
  typeText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 13, flexShrink: 1 },
  distance: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  actText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
