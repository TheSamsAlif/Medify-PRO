import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { storage } from "@/src/utils/storage";
import { theme as palette, type Lang, type Theme } from "./theme";
import { t as translate } from "./i18n";
import type { dict } from "./i18n";

type Mode = "light" | "dark" | "system";

interface AppCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  isDark: boolean;
  colors: Theme;
  t: (key: keyof typeof dict) => string;
}

const AppContext = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [lang, setLangState] = useState<Lang>("en");
  const [mode, setModeState] = useState<Mode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const savedLang = await storage.getItem("medify_lang", "en");
      const savedMode = await storage.getItem("medify_mode", "light");
      if (savedLang === "bn" || savedLang === "en") setLangState(savedLang);
      if (savedMode === "light" || savedMode === "dark" || savedMode === "system") setModeState(savedMode);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storage.setItem("medify_lang", next);
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    storage.setItem("medify_mode", next);
  }, []);

  const isDark = mode === "dark" || (mode === "system" && system === "dark");
  const colors = isDark ? palette.dark : palette.light;
  const t = useCallback((key: keyof typeof dict) => translate(key, lang), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, mode, setMode, isDark, colors, t }),
    [lang, setLang, mode, setMode, isDark, colors, t],
  );

  if (!ready) return null;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
