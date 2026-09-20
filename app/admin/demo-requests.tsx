import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { api } from "../../src/api/client";
import TenureExLogo from "../../src/components/Logo/TenureExLogo";
import { colors } from "../../src/theme";

type DemoRequest = {
  id: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
};

function messageFrom(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join("\n");
    if (typeof message === "string") return message;
  }
  return "Unable to complete this request.";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDemoRequestsScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 860;
  const [items, setItems] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const response = await api.get<DemoRequest[]>("/demo-requests/admin");
      setItems(response.data);
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((x) => x.status === "PENDING").length,
    approved: items.filter((x) => x.status === "APPROVED").length,
    rejected: items.filter((x) => x.status === "REJECTED").length,
  }), [items]);

  const review = async (id: string, action: "approve" | "reject") => {
    setWorkingId(id);
    setError("");
    try {
      await api.patch(`/demo-requests/admin/${id}/${action}`);
      await load();
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push("/admin/dashboard" as Href)} style={styles.brandWrap}>
          <TenureExLogo compact />
        </Pressable>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push("/admin/dashboard" as Href)} style={styles.secondaryButton}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.primary} />
            {!compact ? <Text style={styles.secondaryText}>Admin Dashboard</Text> : null}
          </Pressable>
          <Pressable onPress={() => void load()} style={styles.secondaryButton}>
            <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
            {!compact ? <Text style={styles.secondaryText}>Refresh</Text> : null}
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>TENUREEX ADMIN</Text>
        <Text style={styles.title}>Demo Access Requests</Text>
        <Text style={styles.subtitle}>
          Access requests submitted from the public TenureEx landing website. Approving a request automatically emails the visitor with the TenureEx access link.
        </Text>

        <View style={styles.statsRow}>
          {[
            ["All requests", counts.all, "email-fast-outline"],
            ["Pending", counts.pending, "clock-outline"],
            ["Approved", counts.approved, "check-decagram-outline"],
            ["Rejected", counts.rejected, "close-circle-outline"],
          ].map(([label, value, icon]) => (
            <View key={String(label)} style={[styles.statCard, compact && styles.statCardCompact]}>
              <MaterialCommunityIcons name={icon as any} size={24} color={colors.primary} />
              <Text style={styles.statValue}>{String(value)}</Text>
              <Text style={styles.statLabel}>{String(label)}</Text>
            </View>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Landing page requests</Text>
              <Text style={styles.panelSub}>Newest requests appear first.</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyText}>Loading demo requests…</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="email-outline" size={42} color="#8AA5AE" />
              <Text style={styles.emptyTitle}>No demo requests yet</Text>
              <Text style={styles.emptyText}>Requests submitted from the public landing page will appear here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((item) => {
                const pending = item.status === "PENDING";
                const approving = workingId === item.id;
                return (
                  <View key={item.id} style={[styles.requestCard, compact && styles.requestCardCompact]}>
                    <View style={styles.requestMain}>
                      <View style={styles.emailIcon}>
                        <MaterialCommunityIcons name="email-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.requestText}>
                        <Text style={styles.email}>{item.email}</Text>
                        <Text style={styles.date}>Requested {formatDate(item.requestedAt)}</Text>
                        {item.reviewedAt ? <Text style={styles.date}>Reviewed {formatDate(item.reviewedAt)}</Text> : null}
                      </View>
                    </View>

                    <View style={[styles.requestActions, compact && styles.requestActionsCompact]}>
                      <View style={[
                        styles.statusBadge,
                        item.status === "APPROVED" && styles.statusApproved,
                        item.status === "REJECTED" && styles.statusRejected,
                      ]}>
                        <Text style={[
                          styles.statusText,
                          item.status === "APPROVED" && styles.statusApprovedText,
                          item.status === "REJECTED" && styles.statusRejectedText,
                        ]}>{item.status}</Text>
                      </View>

                      {pending ? (
                        <>
                          <Pressable disabled={approving} onPress={() => void review(item.id, "reject")} style={styles.rejectButton}>
                            <Text style={styles.rejectText}>Reject</Text>
                          </Pressable>
                          <Pressable disabled={approving} onPress={() => void review(item.id, "approve")} style={styles.approveButton}>
                            {approving ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="check" size={18} color="#fff" />}
                            <Text style={styles.approveText}>Approve & email access</Text>
                          </Pressable>
                        </>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F8F8" },
  topBar: {
    minHeight: 72,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DCE7E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandWrap: { paddingVertical: 8 },
  topActions: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C9DADB",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryText: { color: colors.primary, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { width: "100%", maxWidth: 1240, alignSelf: "center", padding: 28, paddingBottom: 70 },
  eyebrow: { color: "#008A86", fontSize: 12, fontWeight: "800", letterSpacing: 1.6 },
  title: { marginTop: 7, color: "#123A42", fontSize: 32, fontWeight: "800" },
  subtitle: { marginTop: 8, maxWidth: 780, color: "#61777D", fontSize: 15, lineHeight: 23 },
  statsRow: { marginTop: 24, flexDirection: "row", flexWrap: "wrap", gap: 14 },
  statCard: { minWidth: 210, flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#DCE7E8" },
  statCardCompact: { minWidth: "46%" },
  statValue: { marginTop: 12, color: "#123A42", fontSize: 28, fontWeight: "800" },
  statLabel: { marginTop: 3, color: "#687D82", fontSize: 13, fontWeight: "600" },
  errorBox: { marginTop: 18, borderRadius: 12, backgroundColor: "#FEF3F2", padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
  errorText: { flex: 1, color: "#B42318", fontWeight: "600" },
  panel: { marginTop: 22, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#DCE7E8", overflow: "hidden" },
  panelHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#E6EEEE" },
  panelTitle: { color: "#123A42", fontSize: 18, fontWeight: "800" },
  panelSub: { marginTop: 4, color: "#71858A", fontSize: 13 },
  list: { padding: 14, gap: 10 },
  requestCard: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#E0EAEB", backgroundColor: "#FCFEFE", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  requestCardCompact: { alignItems: "stretch", flexDirection: "column" },
  requestMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  emailIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#E8F5F4", alignItems: "center", justifyContent: "center" },
  requestText: { flex: 1, minWidth: 0 },
  email: { color: "#143C43", fontSize: 15, fontWeight: "800" },
  date: { marginTop: 3, color: "#72868A", fontSize: 12 },
  requestActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  requestActionsCompact: { flexWrap: "wrap", justifyContent: "flex-end" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: "#FFF4E5" },
  statusText: { color: "#9A6700", fontWeight: "800", fontSize: 11 },
  statusApproved: { backgroundColor: "#E8F7EF" },
  statusApprovedText: { color: "#067647" },
  statusRejected: { backgroundColor: "#FDECEC" },
  statusRejectedText: { color: "#B42318" },
  rejectButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#F1B7B3", alignItems: "center", justifyContent: "center" },
  rejectText: { color: "#B42318", fontWeight: "800" },
  approveButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#087C78", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  approveText: { color: "#fff", fontWeight: "800" },
  emptyState: { paddingVertical: 58, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 12, color: "#123A42", fontSize: 17, fontWeight: "800" },
  emptyText: { marginTop: 7, color: "#71858A", textAlign: "center", lineHeight: 20 },
});
