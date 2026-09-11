import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Badge, Button, Dialog, Divider, Menu, Portal } from "react-native-paper";

import { api } from "../api/client";
import { colors, radius, spacing } from "../theme";

type NotificationRow = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  readAt?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  propertyId?: string | null;
  createdAt?: string;
};

type Role = "agent" | "tenant" | "landlord" | "maintenance";
type Filter = "all" | "unread";

type Props = {
  role: Role;
  onUnreadCountChange?: (count: number) => void;
  openAllSignal?: number;
};

export default function NotificationCenterBell({ role, onUnreadCountChange, openAllSignal = 0 }: Props) {
  const { width, height } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [allVisible, setAllVisible] = useState(false);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/property-workflows/notifications");
      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
          ? response.data.items
          : [];
      setRows(data);
    } catch (error) {
      console.error("Failed to load workflow notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (openAllSignal > 0) {
      setMenuVisible(false);
      setFilter("all");
      setAllVisible(true);
      void load();
    }
  }, [load, openAllSignal]);

  const unread = useMemo(() => rows.filter((row) => !row.readAt).length, [rows]);

  useEffect(() => {
    onUnreadCountChange?.(unread);
  }, [onUnreadCountChange, unread]);

  const filteredRows = useMemo(
    () => (filter === "unread" ? rows.filter((row) => !row.readAt) : rows),
    [filter, rows],
  );

  const markRead = useCallback(async (row: NotificationRow) => {
    if (row.readAt) return;
    try {
      await api.patch(`/property-workflows/notifications/${row.id}/read`, {});
      setRows((current) =>
        current.map((item) =>
          item.id === row.id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadRows = rows.filter((row) => !row.readAt);
    await Promise.allSettled(
      unreadRows.map((row) => api.patch(`/property-workflows/notifications/${row.id}/read`, {})),
    );
    const now = new Date().toISOString();
    setRows((current) => current.map((row) => ({ ...row, readAt: row.readAt || now })));
  }, [rows]);

  const openNotification = useCallback(
    async (row: NotificationRow) => {
      await markRead(row);
      setMenuVisible(false);
      setAllVisible(false);

      if (row.entityType === "MaintenanceRequest" && row.entityId) {
        if (role === "maintenance") {
          router.push({ pathname: "/maintenance/job-details" as never, params: { jobId: row.entityId } });
          return;
        }
        if (role === "tenant") {
          router.push(`/tenant/maintenance-request/${row.entityId}` as never);
          return;
        }
        if (role === "landlord") {
          router.push({
            pathname: "/landlord/maintenance" as never,
            params: {
              ...(row.propertyId ? { propertyId: row.propertyId } : {}),
              requestId: row.entityId,
            },
          });
          return;
        }
        router.push({
          pathname: "/agent/maintenance" as never,
          params: {
            ...(row.propertyId ? { propertyId: row.propertyId } : {}),
            requestId: row.entityId,
          },
        });
      }
    },
    [markRead, role],
  );

  const menuWidth = Math.min(430, Math.max(310, width - 32));
  const dropdownHeight = Math.min(440, Math.max(260, height * 0.52));
  const modalWidth = width < 700 ? "94%" : Math.min(650, width - 80);
  const modalListHeight = Math.min(560, Math.max(320, height * 0.62));

  const list = (items: NotificationRow[], maxHeight: number) => (
    <ScrollView
      style={{ maxHeight }}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator
      nestedScrollEnabled
    >
      {items.length ? (
        items.map((row) => (
          <NotificationItem key={row.id} row={row} onPress={() => void openNotification(row)} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-check-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{loading ? "Loading notifications…" : "No notifications here."}</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            style={styles.bellButton}
            onPress={() => {
              setMenuVisible(true);
              setFilter("all");
              void load();
            }}
          >
            <MaterialCommunityIcons
              name={unread ? "bell" : "bell-outline"}
              size={22}
              color={unread ? colors.primary : colors.textSecondary}
            />
            {unread > 0 ? <Badge style={styles.badge}>{unread > 99 ? "99+" : unread}</Badge> : null}
          </Pressable>
        }
        contentStyle={[styles.menu, { width: menuWidth }]}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Property and workflow updates</Text>
          </View>
          <Pressable onPress={() => void markAllRead()} disabled={!unread}>
            <Text style={[styles.markAll, !unread && styles.disabledText]}>Mark all as read</Text>
          </Pressable>
        </View>

        <View style={styles.filters}>
          <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
          <FilterChip label={`Unread (${unread})`} active={filter === "unread"} onPress={() => setFilter("unread")} />
          <Pressable style={styles.refresh} onPress={() => void load()}>
            <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <Divider />

        {list(filteredRows.slice(0, 20), dropdownHeight)}

        <Divider />
        <Pressable
          style={styles.viewAllButton}
          onPress={() => {
            setMenuVisible(false);
            setFilter("all");
            setAllVisible(true);
            void load();
          }}
        >
          <MaterialCommunityIcons name="format-list-bulleted" size={20} color={colors.primary} />
          <Text style={styles.viewAllText}>View all notifications</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primary} />
        </Pressable>
      </Menu>

      <Portal>
        <Dialog
          visible={allVisible}
          onDismiss={() => setAllVisible(false)}
          style={[styles.dialog, { width: modalWidth as any }]}
        >
          <View style={styles.dialogHeader}>
            <View style={styles.headerText}>
              <Text style={styles.dialogTitle}>All notifications</Text>
              <Text style={styles.subtitle}>Property and workflow updates</Text>
            </View>
            <Pressable accessibilityLabel="Close notifications" onPress={() => setAllVisible(false)} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={23} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Dialog.Content style={styles.dialogContent}>
            <View style={styles.modalToolbar}>
              <View style={styles.filters}>
                <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
                <FilterChip label={`Unread (${unread})`} active={filter === "unread"} onPress={() => setFilter("unread")} />
              </View>
              <Pressable onPress={() => void markAllRead()} disabled={!unread}>
                <Text style={[styles.markAll, !unread && styles.disabledText]}>Mark all as read</Text>
              </Pressable>
            </View>
            {list(filteredRows, modalListHeight)}
          </Dialog.Content>

          <Dialog.Actions style={styles.dialogActions}>
            <Button mode="outlined" onPress={() => void load()}>Refresh</Button>
            <Button mode="contained" onPress={() => setAllVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

function NotificationItem({ row, onPress }: { row: NotificationRow; onPress: () => void }) {
  const unread = !row.readAt;
  const visual = notificationVisual(row.type, row.title);
  return (
    <Pressable onPress={onPress} style={[styles.item, unread && styles.itemUnread]}>
      <View style={[styles.itemIcon, { backgroundColor: visual.background }]}>
        <MaterialCommunityIcons name={visual.icon} size={20} color={visual.foreground} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTitleRow}>
          <Text numberOfLines={2} style={styles.itemTitle}>{row.title || "Property update"}</Text>
          {unread ? <View style={styles.unreadDot} /> : null}
        </View>
        {row.message ? <Text numberOfLines={3} style={styles.itemMessage}>{row.message}</Text> : null}
        <Text style={styles.itemTime}>{formatTime(row.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

function notificationVisual(type?: string, title?: string) {
  const value = `${type || ""} ${title || ""}`.toUpperCase();
  if (value.includes("APPROV") || value.includes("COMPLETE") || value.includes("CONFIRM")) {
    return { icon: "check-circle" as const, foreground: "#119B50", background: "#E8F8EE" };
  }
  if (value.includes("TENANT") || value.includes("APPLICATION") || value.includes("USER")) {
    return { icon: "account-check-outline" as const, foreground: "#1769D2", background: "#E8F1FF" };
  }
  if (value.includes("SCHEDULE") || value.includes("VISIT") || value.includes("APPOINT")) {
    return { icon: "calendar-check-outline" as const, foreground: "#E11D48", background: "#FDECEF" };
  }
  if (value.includes("PROPERTY") || value.includes("HOME")) {
    return { icon: "home-outline" as const, foreground: "#F59E0B", background: "#FFF3DD" };
  }
  if (value.includes("PAY") || value.includes("RENT")) {
    return { icon: "currency-gbp" as const, foreground: "#139B43", background: "#E8F8EE" };
  }
  if (value.includes("MESSAGE")) {
    return { icon: "message-text-outline" as const, foreground: "#B832B1", background: "#F8EAF8" };
  }
  if (value.includes("INSPECT") || value.includes("COUNCIL") || value.includes("COMPLIANCE")) {
    return { icon: "shield-check-outline" as const, foreground: "#D97706", background: "#FFF3DD" };
  }
  if (value.includes("MAINTENANCE") || value.includes("JOB")) {
    return { icon: "tools" as const, foreground: "#147D92", background: "#E7F5F7" };
  }
  return { icon: "bell-outline" as const, foreground: "#6658D3", background: "#EFEDFF" };
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

const styles = StyleSheet.create({
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { position: "absolute", top: -6, right: -6 },
  menu: {
    borderRadius: 18,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: "900", color: colors.textPrimary },
  dialogTitle: { fontSize: 22, fontWeight: "900", color: colors.textPrimary },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  markAll: { fontSize: 12, fontWeight: "800", color: colors.primary },
  disabledText: { opacity: 0.4 },
  filters: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  refresh: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  listContent: { padding: 10, gap: 8 },
  item: {
    flexDirection: "row",
    gap: 11,
    padding: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  itemUnread: { backgroundColor: "#F8FBFC" },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  itemTitle: { flex: 1, fontSize: 13, fontWeight: "900", color: colors.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E31B23", marginTop: 5 },
  itemMessage: { marginTop: 3, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  itemTime: { marginTop: 4, fontSize: 10.5, color: colors.textMuted },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: spacing.xl },
  emptyText: { color: colors.textSecondary, fontSize: 12 },
  viewAllButton: {
    margin: 10,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: colors.white,
  },
  viewAllText: { fontSize: 13, fontWeight: "900", color: colors.primary },
  dialog: {
    alignSelf: "center",
    maxWidth: 650,
    borderRadius: 20,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  dialogHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogContent: { paddingHorizontal: 10, paddingBottom: 0 },
  modalToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingRight: 10,
  },
  dialogActions: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8 },
});
