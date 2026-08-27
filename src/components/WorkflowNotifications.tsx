import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";

import { api } from "../api/client";
import { colors, radius, spacing } from "../theme";

type WorkflowNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
  propertyId?: string | null;
  metadata?: unknown;
};

type Props = {
  title?: string;
  compact?: boolean;
  limit?: number;
};

export default function WorkflowNotifications({
  title = "Notifications",
  compact = false,
  limit = 8,
}: Props) {
  const [items, setItems] = useState<WorkflowNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const response = await api.get("/property-workflows/notifications");
      const data = Array.isArray(response.data) ? response.data : response.data?.items ?? [];
      setItems(data.slice(0, limit));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/property-workflows/notifications/${id}/read`);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to mark notification as read.");
    }
  };

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Property and workflow updates</Text>
        </View>
        <Button mode="text" compact onPress={() => void load()}>
          Refresh
        </Button>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.muted}>Loading notifications…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bell-check-outline" size={28} color={colors.textMuted} />
          <Text style={styles.muted}>{error || "No notifications yet."}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const unread = !item.readAt;
            return (
              <Pressable
                key={item.id}
                onPress={() => unread && void markRead(item.id)}
                style={[styles.item, unread && styles.unreadItem]}
              >
                <View style={[styles.icon, unread && styles.unreadIcon]}>
                  <MaterialCommunityIcons
                    name={notificationIcon(item.type)}
                    size={19}
                    color={unread ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {unread ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.itemMessage}>{item.message}</Text>
                  <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {error && items.length > 0 ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function notificationIcon(type: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const normalized = String(type || "").toUpperCase();
  if (normalized.includes("TENANT")) return "account-key-outline";
  if (normalized.includes("MAINTENANCE")) return "tools";
  if (normalized.includes("APPROV")) return "check-decagram-outline";
  if (normalized.includes("INVIT")) return "email-fast-outline";
  return "bell-outline";
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactCard: { padding: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 22 },
  muted: { color: colors.textSecondary },
  list: { gap: 9 },
  item: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadItem: { backgroundColor: colors.primaryLight },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  unreadIcon: { borderWidth: 1, borderColor: colors.primary },
  itemBody: { flex: 1 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: colors.textPrimary },
  itemMessage: { marginTop: 3, color: colors.textSecondary, lineHeight: 18 },
  time: { marginTop: 5, fontSize: 11, color: colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  error: { marginTop: 10, color: colors.error, fontWeight: "700" },
});
