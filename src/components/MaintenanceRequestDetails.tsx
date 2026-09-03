import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, Chip } from "react-native-paper";

import { api } from "../api/client";
import { colors, radius, spacing } from "../theme";
import ScreenContainer from "./ScreenContainer";

type PortalRole = "tenant" | "agent";

type MaintenancePhoto = {
  id: string;
  phase: "REPORTED" | "BEFORE" | "AFTER" | string;
  fileName: string;
  url: string;
  createdAt?: string;
};

type MaintenanceSlot = {
  id: string;
  startAt: string;
  endAt: string;
  status?: string;
};

type MaintenanceRequestDetailsData = {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  roomLocation?: string | null;
  priority?: string | null;
  status?: string | null;
  accessPermission?: boolean;
  createdAt?: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  providerNotes?: string | null;
  completionNotes?: string | null;
  tenantCompletionNote?: string | null;
  property?: {
    addressLine1?: string;
    addressLine2?: string | null;
    townCity?: string | null;
    county?: string | null;
    postcode?: string;
  } | null;
  tenant?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  assignedProvider?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  slots?: MaintenanceSlot[];
  photos?: MaintenancePhoto[];
};

function displayEnum(value?: string | null) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function apiOrigin() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!configured) return "http://localhost:3000";
  return configured.replace(/\/api\/v1\/?$/i, "");
}

function photoUrl(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
}

function fullName(person?: { firstName?: string | null; lastName?: string | null } | null) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "—";
}

export default function MaintenanceRequestDetails({
  requestId,
  portalRole,
}: {
  requestId: string;
  portalRole: PortalRole;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [request, setRequest] = useState<MaintenanceRequestDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/property-workflows/maintenance-requests/${requestId}`);
      setRequest(response.data);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load this maintenance inquiry.",
      );
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const address = useMemo(
    () =>
      [
        request?.property?.addressLine1,
        request?.property?.addressLine2,
        request?.property?.townCity,
        request?.property?.postcode,
      ]
        .filter(Boolean)
        .join(", "),
    [request],
  );

  const photoGroups = useMemo(() => {
    const photos = request?.photos ?? [];
    return [
      { key: "REPORTED", title: "Problem photos", photos: photos.filter((p) => p.phase === "REPORTED") },
      { key: "BEFORE", title: "Before work", photos: photos.filter((p) => p.phase === "BEFORE") },
      { key: "AFTER", title: "After work", photos: photos.filter((p) => p.phase === "AFTER") },
    ];
  }, [request]);

  const goBack = () => {
    router.replace(
      (portalRole === "agent" ? "/agent/maintenance" : "/tenant/maintenance") as never,
    );
  };

  if (loading) {
    return (
      <ScreenContainer scrollable contentStyle={styles.screenContent}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading maintenance inquiry...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !request) {
    return (
      <ScreenContainer scrollable contentStyle={styles.screenContent}>
        <View style={styles.loadingCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={42} color={colors.error} />
          <Text style={styles.errorText}>{error || "Maintenance inquiry was not found."}</Text>
          <Button mode="contained" onPress={goBack}>Back to maintenance</Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.screenContent}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <Pressable onPress={goBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
            <Text style={styles.backText}>Back to maintenance</Text>
          </Pressable>
          <Button mode="outlined" icon="refresh" onPress={() => void load()}>Refresh</Button>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="tools" size={30} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{request.title}</Text>
              <Chip compact>{displayEnum(request.status)}</Chip>
            </View>
            <Text style={styles.address}>{address || "Property address unavailable"}</Text>
            <Text style={styles.submitted}>Submitted {formatDate(request.createdAt)}</Text>
          </View>
        </View>

        <View style={[styles.contentGrid, !isDesktop && styles.contentGridMobile]}>
          <View style={styles.mainColumn}>
            <Section title="Problem details" icon="clipboard-text-outline">
              <Text style={styles.description}>{request.description}</Text>
              <View style={styles.detailGrid}>
                <Detail label="Category" value={displayEnum(request.category)} />
                <Detail label="Priority" value={displayEnum(request.priority)} />
                <Detail label="Room / location" value={request.roomLocation || "Not specified"} />
                <Detail
                  label="Access permission"
                  value={request.accessPermission ? "Tenant allows agreed access when absent" : "Tenant has not granted unattended access"}
                />
              </View>
            </Section>

            {photoGroups.map((group) => (
              <Section key={group.key} title={`${group.title} (${group.photos.length})`} icon="image-multiple-outline">
                {group.photos.length ? (
                  <View style={styles.photoGrid}>
                    {group.photos.map((photo) => (
                      <View key={photo.id} style={styles.photoCard}>
                        <Image source={{ uri: photoUrl(photo.url) }} style={styles.photo} resizeMode="cover" />
                        {photo.createdAt ? <Text style={styles.photoDate}>{formatDate(photo.createdAt)}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyPhotos}>
                    <MaterialCommunityIcons name="image-off-outline" size={25} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No {group.title.toLowerCase()} uploaded.</Text>
                  </View>
                )}
              </Section>
            ))}

            <Section title="Availability and visit" icon="calendar-clock-outline">
              {request.slots?.length ? (
                request.slots.map((slot, index) => (
                  <View key={slot.id} style={styles.slotRow}>
                    <Text style={styles.slotTitle}>Option {index + 1}</Text>
                    <Text style={styles.slotTime}>{formatDate(slot.startAt)} — {formatDate(slot.endAt)}</Text>
                    {slot.status ? <Chip compact>{displayEnum(slot.status)}</Chip> : null}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No availability slots recorded.</Text>
              )}
              {request.scheduledStart ? (
                <View style={styles.scheduledBox}>
                  <MaterialCommunityIcons name="calendar-check" size={21} color={colors.primary} />
                  <Text style={styles.scheduledText}>
                    Scheduled visit: {formatDate(request.scheduledStart)}{request.scheduledEnd ? ` — ${formatDate(request.scheduledEnd)}` : ""}
                  </Text>
                </View>
              ) : null}
            </Section>

            {(request.providerNotes || request.completionNotes || request.tenantCompletionNote) ? (
              <Section title="Work notes" icon="note-text-outline">
                {request.providerNotes ? <Note label="Provider notes" text={request.providerNotes} /> : null}
                {request.completionNotes ? <Note label="Completion notes" text={request.completionNotes} /> : null}
                {request.tenantCompletionNote ? <Note label="Tenant confirmation" text={request.tenantCompletionNote} /> : null}
              </Section>
            ) : null}
          </View>

          <View style={styles.sideColumn}>
            <Section title="Tenant" icon="account-outline">
              <Detail label="Name" value={fullName(request.tenant)} />
              <Detail label="Email" value={request.tenant?.email || "—"} />
              <Detail label="Phone" value={request.tenant?.phone || "—"} />
            </Section>

            <Section title="Assigned provider" icon="account-hard-hat-outline">
              {request.assignedProvider ? (
                <>
                  <Detail label="Name" value={fullName(request.assignedProvider)} />
                  <Detail label="Email" value={request.assignedProvider.email || "—"} />
                  <Detail label="Phone" value={request.assignedProvider.phone || "—"} />
                </>
              ) : (
                <Text style={styles.emptyText}>No maintenance provider has accepted this job yet.</Text>
              )}
            </Section>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.noteBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: 0 },
  page: { width: "100%", maxWidth: 1450, alignSelf: "center", padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 8 },
  backText: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  heroCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, flexDirection: "row", gap: 16, alignItems: "flex-start" },
  heroIcon: { width: 55, height: 55, borderRadius: 15, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: "900", flexShrink: 1 },
  address: { color: colors.textSecondary, fontSize: 15, fontWeight: "700", marginTop: 6 },
  submitted: { color: colors.textMuted, marginTop: 5, fontSize: 13 },
  contentGrid: { flexDirection: "row", alignItems: "flex-start", gap: spacing.lg },
  contentGridMobile: { flexDirection: "column" },
  mainColumn: { flex: 2, width: "100%", gap: spacing.lg },
  sideColumn: { flex: 1, width: "100%", gap: spacing.lg },
  sectionCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: 15 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 9, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  description: { color: colors.textPrimary, fontSize: 15, lineHeight: 23 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailItem: { minWidth: 180, flexGrow: 1, flexBasis: "45%", gap: 3 },
  detailLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 },
  detailValue: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoCard: { width: 220, maxWidth: "100%", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.background },
  photo: { width: "100%", height: 165, backgroundColor: colors.primaryLight },
  photoDate: { padding: 8, color: colors.textMuted, fontSize: 11 },
  emptyPhotos: { minHeight: 90, alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, borderStyle: "dashed" },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  slotRow: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 5 },
  slotTitle: { color: colors.primary, fontWeight: "900", fontSize: 13 },
  slotTime: { color: colors.textPrimary, fontWeight: "700", fontSize: 14 },
  scheduledBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 13 },
  scheduledText: { color: colors.textPrimary, fontSize: 13, fontWeight: "700", flex: 1 },
  noteBox: { gap: 5, padding: 12, backgroundColor: colors.background, borderRadius: radius.md },
  loadingCard: { minHeight: 300, margin: spacing.lg, alignItems: "center", justifyContent: "center", gap: 15, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 25 },
  loadingText: { color: colors.textSecondary, fontWeight: "700" },
  errorText: { color: colors.error, textAlign: "center", fontWeight: "700" },
});
