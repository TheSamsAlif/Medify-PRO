import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send, Sparkles, Volume2, Trash, Square } from "lucide-react-native";

import { useApp } from "@/src/lib/AppContext";
import { api } from "@/src/lib/api";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  created_at?: string;
}

export default function AssistantScreen() {
  const { colors, t, lang, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get("/chat/history?session_id=default&limit=50");
      setMessages(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    return () => { Speech.stop(); };
  }, [loadHistory]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, sending]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput("");
    const userTmp: ChatMsg = { id: `tmp-${Date.now()}`, role: "user", text: message };
    setMessages((prev) => [...prev, userTmp]);
    setSending(true);
    try {
      const res = await api.post("/chat", { message, language: lang, session_id: "default" });
      const reply: ChatMsg = { id: res.data.message_id, role: "assistant", text: res.data.reply };
      setMessages((prev) => [...prev, reply]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: lang === "bn" ? "দুঃখিত, সংযোগে সমস্যা হয়েছে।" : "Sorry, I had a connection issue. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const speak = (msg: ChatMsg) => {
    if (speakingId === msg.id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    setSpeakingId(msg.id);
    Speech.speak(msg.text, {
      language: lang === "bn" ? "bn-BD" : "en-US",
      rate: 0.95,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const clearChat = async () => {
    await api.delete("/chat/history?session_id=default");
    setMessages([]);
  };

  const suggestions = [t("suggestion1"), t("suggestion2"), t("suggestion3")];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="assistant-screen"
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Sparkles color="#fff" size={20} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t("assistant")}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {t("disclaimerShort")}
          </Text>
        </View>
        <TouchableOpacity testID="clear-chat-btn" onPress={clearChat} hitSlop={10} style={{ padding: 6 }}>
          <Trash color={colors.textMuted} size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={[styles.welcome, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Sparkles color={colors.primary} size={28} />
              <Text style={[styles.welcomeText, { color: colors.text }]}>{t("welcomeAssistant")}</Text>
              <Text style={[styles.welcomeHint, { color: colors.textSecondary }]}>{t("searchHint")}</Text>
              <View style={styles.chips}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    testID={`suggestion-${i}`}
                    onPress={() => send(s)}
                    style={[styles.chip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.chipText, { color: isDark ? "#fff" : colors.primary }]} numberOfLines={2}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.role === "user"
                  ? { backgroundColor: colors.primary, alignSelf: "flex-end" }
                  : { backgroundColor: colors.surface, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border },
              ]}
              testID={`chat-msg-${m.role}`}
            >
              <Text style={[styles.bubbleText, { color: m.role === "user" ? "#fff" : colors.text }]}>{m.text}</Text>
              {m.role === "assistant" && (
                <TouchableOpacity
                  testID={`listen-${m.id}`}
                  onPress={() => speak(m)}
                  style={[styles.listenBtn, { backgroundColor: colors.primarySoft }]}
                >
                  {speakingId === m.id ? (
                    <Square color={isDark ? "#fff" : colors.primary} size={14} />
                  ) : (
                    <Volume2 color={isDark ? "#fff" : colors.primary} size={14} />
                  )}
                  <Text style={[styles.listenText, { color: isDark ? "#fff" : colors.primary }]}>{t("listen")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {sending && (
            <View style={[styles.bubble, { backgroundColor: colors.surface, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          )}
        </ScrollView>
      )}

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          testID="chat-input"
          style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
          placeholder={t("chatPlaceholder")}
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          testID="send-chat-btn"
          onPress={() => send()}
          disabled={!input.trim() || sending}
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() && !sending ? colors.primary : colors.surfaceAlt },
          ]}
        >
          <Send color={input.trim() && !sending ? "#fff" : colors.textMuted} size={22} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  welcome: { padding: 22, borderRadius: 20, borderWidth: 1, alignItems: "flex-start", gap: 10, marginBottom: 16 },
  welcomeText: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
  welcomeHint: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, maxWidth: "100%" },
  chipText: { fontSize: 13, fontWeight: "600" },
  bubble: { maxWidth: "85%", padding: 14, borderRadius: 18, marginVertical: 6 },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 10 },
  listenText: { fontSize: 12, fontWeight: "700" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 48, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 22, fontSize: 16 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
