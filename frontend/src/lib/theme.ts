export type Lang = "en" | "bn";

export const theme = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceAlt: "#F1F5F9",
    primary: "#1E3A8A",
    primarySoft: "#DBEAFE",
    secondary: "#10B981",
    secondarySoft: "#D1FAE5",
    accent: "#F59E0B",
    danger: "#EF4444",
    dangerSoft: "#FEE2E2",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    border: "#E2E8F0",
    overlay: "rgba(15,23,42,0.4)",
  },
  dark: {
    background: "#0B1220",
    surface: "#111A2E",
    surfaceAlt: "#1E293B",
    primary: "#60A5FA",
    primarySoft: "#1E3A8A",
    secondary: "#34D399",
    secondarySoft: "#065F46",
    accent: "#FBBF24",
    danger: "#F87171",
    dangerSoft: "#7F1D1D",
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    border: "#1E293B",
    overlay: "rgba(0,0,0,0.6)",
  },
};

export type Theme = typeof theme.light;
