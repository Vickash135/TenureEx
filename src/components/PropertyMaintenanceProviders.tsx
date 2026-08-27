import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, Chip, Divider, Menu, TextInput } from "react-native-paper";

import { api } from "../api/client";
import { colors, radius, spacing } from "../theme";

type PropertyRow = {
  id: string;
  addressLine1: string;
  townCity?: string | null;
  postcode: string;
};

type ProviderRow = {
  id: string;
  status: string;
  addedByRole: string;
  createdAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    maintenanceProfile?: {
      businessName?: string | null;
      tradeType?: string | null;
      registrationNumber?: string | null;
      insuranceExpiry?: string | null;
      approved?: boolean;
    } | null;
  } | null;
};

type Props = {
  propertyEndpoint: string;
  actingRole: "ESTATE_AGENT" | "LANDLORD" | "TENANT";
  canApprove?: boolean;
  title?: string;
  subtitle?: string;
};

export default function PropertyMaintenanceProviders({
  propertyEndpoint,
  actingRole,
  canApprove = false,
  title = "Maintenance team",
  subtitle = "Invite and manage maintenance providers linked to this property.",
}: Props) {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [propertyMenuOpen, setPropertyMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const normaliseProperties = (data: any): PropertyRow[] => {
    const raw = Array.isArray(data) ? data : data?.properties ?? [];
    return raw
      .map((row: any) => row?.property ?? row)
      .filter((row: any) => row?.id)
      .map((row: any) => ({
        id: row.id,
        addressLine1: row.addressLine1,
        townCity: row.townCity,
        postcode: row.postcode,
      }));
  };

  const loadProperties = async () => {
    try {
      const response = await api.get(propertyEndpoint);
      const rows = normaliseProperties(response.data);
      setProperties(rows);
      if (!propertyId && rows[0]) setPropertyId(rows[0].id);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to load properties.");
    }
  };

  const loadProviders = async () => {
    if (!propertyId) {
      setProviders([]);
      return;
    }
    try {
      const response = await api.get(
        `/property-workflows/properties/${propertyId}/maintenance-providers`,
      );
      setProviders(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to load maintenance providers.");
    }
  };

  useEffect(() => {
    void loadProperties();
  }, [propertyEndpoint]);

  useEffect(() => {
    void loadProviders();
  }, [propertyId]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === propertyId),
    [properties, propertyId],
  );

  const approvedCount = providers.filter((provider) => provider.status === "APPROVED").length;
  const pendingCount = providers.filter((provider) => provider.status === "PENDING_APPROVAL").length;

  const invite = async () => {
    if (!propertyId || !email.includes("@")) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await api.post("/property-workflows/maintenance-invitations", {
        propertyId,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        tradeType: tradeType.trim() || undefined,
        actingRole,
      });
      setMessage(response.data?.message || "Maintenance provider invitation sent.");
      setEmail("");
      setFirstName("");
      setLastName("");
      setTradeType("");
      await loadProviders();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to invite maintenance provider.");
    } finally {
      setLoading(false);
    }
  };

  const review = async (id: string, action: "APPROVE" | "REJECT") => {
    setLoading(true);
    setMessage("");
    try {
      await api.patch(`/property-workflows/maintenance-providers/${id}/review`, { action });
      setMessage(
        action === "APPROVE"
          ? "Maintenance provider approved for this property."
          : "Maintenance provider rejected for this property.",
      );
      await loadProviders();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to review maintenance provider.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <MaterialCommunityIcons name="account-hard-hat-outline" size={25} color={colors.primary} />
        </View>
        <View style={styles.headingText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <MiniStat icon="account-check-outline" label="Approved" value={approvedCount} />
        <MiniStat icon="account-clock-outline" label="Pending" value={pendingCount} />
        <MiniStat icon="account-group-outline" label="Total" value={providers.length} />
      </View>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.cardTitle}>Property maintenance team</Text>
          <Text style={styles.cardSubtitle}>
            Select a property. Providers added by the Estate Agent or Landlord are shared across the property team. Providers added by a Tenant require Estate Agent approval.
          </Text>

          <Menu
            visible={propertyMenuOpen}
            onDismiss={() => setPropertyMenuOpen(false)}
            anchor={
              <Button mode="outlined" icon="home-outline" onPress={() => setPropertyMenuOpen(true)}>
                {selectedProperty
                  ? `${selectedProperty.addressLine1}, ${selectedProperty.postcode}`
                  : "Select property"}
              </Button>
            }
          >
            {properties.map((property) => (
              <Menu.Item
                key={property.id}
                title={`${property.addressLine1}, ${property.postcode}`}
                onPress={() => {
                  setPropertyId(property.id);
                  setPropertyMenuOpen(false);
                }}
              />
            ))}
          </Menu>

          <Divider />

          <Text style={styles.cardTitle}>Invite maintenance provider</Text>
          <View style={styles.formGrid}>
            <TextInput label="First name" mode="outlined" value={firstName} onChangeText={setFirstName} style={styles.input} />
            <TextInput label="Last name" mode="outlined" value={lastName} onChangeText={setLastName} style={styles.input} />
          </View>
          <View style={styles.formGrid}>
            <TextInput
              label="Email"
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput label="Trade / speciality" mode="outlined" value={tradeType} onChangeText={setTradeType} style={styles.input} />
          </View>
          <Button
            mode="contained"
            icon="email-fast-outline"
            loading={loading}
            disabled={loading || !propertyId || !email.includes("@")}
            onPress={() => void invite()}
          >
            Send provider invitation
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.providerHeader}>
        <Text style={styles.cardTitle}>Providers assigned to this property</Text>
        <Button compact mode="text" icon="refresh" onPress={() => void loadProviders()}>
          Refresh
        </Button>
      </View>

      {providers.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-hard-hat-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No maintenance providers yet</Text>
          <Text style={styles.emptyText}>Invite a plumber, electrician, general contractor or another maintenance provider above.</Text>
        </View>
      ) : (
        <View style={styles.providerGrid}>
          {providers.map((provider) => {
            const profile = provider.user?.maintenanceProfile;
            return (
              <Card key={provider.id} style={styles.providerCard}>
                <Card.Content style={styles.providerContent}>
                  <View style={styles.providerTop}>
                    <View style={styles.providerAvatar}>
                      <MaterialCommunityIcons name="account-hard-hat" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.providerNameWrap}>
                      <Text style={styles.providerName}>
                        {[provider.user?.firstName, provider.user?.lastName].filter(Boolean).join(" ") || "Maintenance provider"}
                      </Text>
                      <Text style={styles.providerTrade}>{profile?.tradeType || "General maintenance"}</Text>
                    </View>
                    <Chip compact>{provider.status.replaceAll("_", " ")}</Chip>
                  </View>

                  <Divider />
                  <InfoRow icon="email-outline" text={provider.user?.email || "Email unavailable"} />
                  <InfoRow icon="phone-outline" text={provider.user?.phone || "Phone unavailable"} />
                  <InfoRow icon="office-building-outline" text={profile?.businessName || "Independent provider"} />
                  <InfoRow icon="certificate-outline" text={profile?.registrationNumber || "Registration not provided"} />
                  <InfoRow icon="account-arrow-left-outline" text={`Added by ${provider.addedByRole.replaceAll("_", " ")}`} />

                  {canApprove && provider.status === "PENDING_APPROVAL" ? (
                    <View style={styles.actions}>
                      <Button mode="contained" icon="check" disabled={loading} onPress={() => void review(provider.id, "APPROVE")}>
                        Approve
                      </Button>
                      <Button mode="outlined" icon="close" textColor={colors.error} disabled={loading} onPress={() => void review(provider.id, "REJECT")}>
                        Reject
                      </Button>
                    </View>
                  ) : null}
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      {message ? <Text style={styles.feedback}>{message}</Text> : null}
    </View>
  );
}

function MiniStat({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <View style={styles.miniIcon}><MaterialCommunityIcons name={icon} size={20} color={colors.primary} /></View>
      <View>
        <Text style={styles.miniValue}>{value}</Text>
        <Text style={styles.miniLabel}>{label}</Text>
      </View>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  headingIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  headingText: { flex: 1 },
  title: { color: colors.textPrimary, fontWeight: "900", fontSize: 24 },
  subtitle: { color: colors.textSecondary, lineHeight: 20, marginTop: 3 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  miniStat: { flex: 1, minWidth: 160, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  miniIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  miniValue: { color: colors.textPrimary, fontSize: 20, fontWeight: "900" },
  miniLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  card: { borderRadius: radius.lg, backgroundColor: colors.white },
  cardContent: { gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  cardSubtitle: { color: colors.textSecondary, lineHeight: 20 },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  input: { flex: 1, minWidth: 220, backgroundColor: colors.white },
  providerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  providerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  providerCard: { flex: 1, minWidth: 300, maxWidth: 500, borderRadius: radius.lg, backgroundColor: colors.white },
  providerContent: { gap: spacing.sm },
  providerTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  providerAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  providerNameWrap: { flex: 1 },
  providerName: { color: colors.textPrimary, fontWeight: "900", fontSize: 16 },
  providerTrade: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  emptyCard: { alignItems: "center", padding: spacing.xl, gap: 6, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.textPrimary, fontWeight: "900", fontSize: 16 },
  emptyText: { color: colors.textSecondary, textAlign: "center", maxWidth: 520, lineHeight: 19 },
  feedback: { color: colors.primary, fontWeight: "800", backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md },
});
