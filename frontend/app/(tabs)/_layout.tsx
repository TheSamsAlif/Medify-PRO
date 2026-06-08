import { Tabs } from "expo-router";
import { Home, Pill, Sparkles, FileText, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { useApp } from "@/src/lib/AppContext";

export default function TabsLayout() {
  const { colors, t } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          ...Platform.select({ android: { elevation: 12 } }),
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color }) => <Home color={color} size={26} />,
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: t("medicines"),
          tabBarIcon: ({ color }) => <Pill color={color} size={26} />,
          tabBarButtonTestID: "tab-medicines",
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: t("assistant"),
          tabBarIcon: ({ color }) => <Sparkles color={color} size={26} />,
          tabBarButtonTestID: "tab-assistant",
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: t("records"),
          tabBarIcon: ({ color }) => <FileText color={color} size={26} />,
          tabBarButtonTestID: "tab-records",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color }) => <User color={color} size={26} />,
          tabBarButtonTestID: "tab-profile",
        }}
      />
    </Tabs>
  );
}
