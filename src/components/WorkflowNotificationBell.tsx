import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Divider, Menu } from "react-native-paper";

import { api } from "../api/client";
import { colors } from "../theme";

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

type Props = {
  role: "tenant" | "landlord" | "maintenance";
};

export default function WorkflowNotificationBell({ role }: Props) {
  const [visible, setVisible] = useState(false);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

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

  const unread = useMemo(
    () => rows.filter((row) => !row.readAt).length,
    [rows],
  );

  const openNotification = async (row: NotificationRow) => {
    if (!row.readAt) {
      try {
        await api.patch(`/property-workflows/notifications/${row.id}/read`, {});
        setRows((current) =>
          current.map((item) =>
            item.id === row.id
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    setVisible(false);

    if (row.entityType === "MaintenanceRequest" && row.entityId) {
      if (role === "maintenance") {
        router.push({
          pathname: "/maintenance/job-details" as never,
          params: { jobId: row.entityId },
        });
        return;
      }

      if (role === "tenant") {
        router.push(`/tenant/maintenance-request/${row.entityId}` as never);
        return;
      }

      router.push({
        pathname: "/landlord/maintenance" as never,
        params: {
          ...(row.propertyId ? { propertyId: row.propertyId } : {}),
          requestId: row.entityId,
        },
      });
    }
  };

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Pressable
          accessibilityLabel="Notifications"
          style={styles.button}
          onPress={() => {
            setVisible(true);
            void load();
          }}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color={colors.textSecondary}
          />
          {unread > 0 ? (
            <Badge style={styles.badge}>{unread > 99 ? "99+" : unread}</Badge>
          ) : null}
        </Pressable>
      }
      contentStyle={styles.menu}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {loading ? "Refreshing…" : `${unread} unread`}
          </Text>
        </View>
        <Pressable onPress={() => void load()} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={19} color={colors.primary} />
        </Pressable>
      </View>
      <Divider />

      {rows.slice(0, 12).map((row) => (
        <Menu.Item
          key={row.id}
          leadingIcon={row.readAt ? "bell-outline" : "bell-badge-outline"}
          title={row.title || "Property update"}
          titleStyle={!row.readAt ? styles.unreadTitle : undefined}
          onPress={() => void openNotification(row)}
        />
      ))}

      {!rows.length && !loading ? (
        <Menu.Item title="No notifications yet" disabled />
      ) : null}
    </Menu>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  menu: {
    width: 350,
    maxWidth: "92vw" as any,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  unreadTitle: {
    fontWeight: "900",
  },
});
