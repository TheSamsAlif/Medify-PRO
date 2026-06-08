import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AppProvider, useApp } from "@/src/lib/AppContext";
import { AuthProvider, useAuth } from "@/src/lib/AuthContext";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isDark, colors } = useApp();
  const { user, bootstrapping } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (bootstrapping) return;
    const first = segments[0] as string | undefined;
    const inAuthArea = first === "(auth)" || first === "welcome";
    if (!user && !inAuthArea) {
      router.replace("/welcome");
    } else if (user && inAuthArea) {
      router.replace("/(tabs)");
    }
  }, [user, bootstrapping, segments, router]);

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
