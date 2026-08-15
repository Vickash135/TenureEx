import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { Button, Chip, Divider } from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, radius, spacing } from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type PropertyDetails = {
  id: string;
  title: string;
  address: string;
  rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  tenancyStart: string;
  tenancyEnd: string;
  paymentDate: string;
  landlord: string;
  agent: string;
};

const properties: PropertyDetails[] = [
  {
    id: "PROP-001",
    title: "Modern Two-Bedroom City Apartment",
    address: "42 King Street, Leeds, LS1 2HQ",
    rent: 1325,
    deposit: 1528,
    bedrooms: 2,
    bathrooms: 2,
    tenancyStart: "01 September 2026",
    tenancyEnd: "31 August 2027",
    paymentDate: "1st of every month",
    landlord: "David Thompson",
    agent: "TenureEx Leeds",
  },
  {
    id: "PROP-002",
    title: "Three-Bedroom Family Home",
    address: "18 Victoria Road, Manchester, M14 6BT",
    rent: 1450,
    deposit: 1673,
    bedrooms: 3,
    bathrooms: 2,
    tenancyStart: "15 September 2026",
    tenancyEnd: "14 September 2027",
    paymentDate: "15th of every month",
    landlord: "Sarah Williams",
    agent: "TenureEx Manchester",
  },
];

export default function MyPropertyScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1000;

  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    applicationId?: string | string[];
  }>();

  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const applicationId = Array.isArray(params.applicationId)
    ? params.applicationId[0]
    : params.applicationId;

  const property = useMemo(() => {
    return (
      properties.find((item) => item.id === propertyId) ??
      properties[0]
    );
  }, [propertyId]);

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.brand}
            onPress={() =>
              router.replace("/tenant/dashboard" as never)
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TenureEx
              </Text>

              <Text style={styles.brandSubtitle}>
                My property
              </Text>
            </View>
          </Pressable>

          <View style={styles.topBarActions}>
            <Pressable
              style={styles.topBarButton}
              onPress={() =>
                router.push("/tenant/messages" as never)
              }
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={21}
                color={colors.textPrimary}
              />
            </Pressable>

            <Pressable
              style={styles.topBarButton}
              onPress={() =>
                router.push("/tenant/settings" as never)
              }
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={21}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="home-outline"
              size={38}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>
              CURRENT TENANCY
            </Text>

            <Text style={styles.heroTitle}>
              {property.title}
            </Text>

            <Text style={styles.heroDescription}>
              {property.address}
            </Text>
          </View>

          <Chip icon="check-circle">
            Active tenancy
          </Chip>
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop && styles.layoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <View style={styles.quickActions}>
              <QuickAction
                icon="tools"
                title="Maintenance"
                description="Report and track property issues."
                onPress={() =>
                  router.push({
                    pathname: "/tenant/maintenance" as never,
                    params: {
                      propertyId: property.id,
                    },
                  })
                }
              />

              <QuickAction
                icon="credit-card-outline"
                title="Payments"
                description="View rent and payment history."
                onPress={() =>
                  router.push({
                    pathname: "/tenant/payments" as never,
                    params: {
                      propertyId: property.id,
                    },
                  })
                }
              />

              <QuickAction
                icon="message-text-outline"
                title="Messages"
                description="Contact your landlord or agent."
                onPress={() =>
                  router.push("/tenant/messages" as never)
                }
              />

              <QuickAction
                icon="file-document-outline"
                title="Agreement"
                description="Review your tenancy agreement."
                onPress={() =>
                  router.push({
                    pathname: "/tenant/agreement" as never,
                    params: {
                      propertyId: property.id,
                      applicationId: applicationId ?? "",
                    },
                  })
                }
              />
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="home-outline"
                title="Property details"
                description="Information about your rented property."
              />

              <Divider style={styles.divider} />

              <DetailRow
                label="Property ID"
                value={property.id}
              />

              <DetailRow
                label="Address"
                value={property.address}
              />

              <DetailRow
                label="Bedrooms"
                value={`${property.bedrooms}`}
              />

              <DetailRow
                label="Bathrooms"
                value={`${property.bathrooms}`}
              />

              <DetailRow
                label="Landlord"
                value={property.landlord}
              />

              <DetailRow
                label="Managing agent"
                value={property.agent}
              />
            </View>

            <View style={styles.card}>
              <SectionHeader
                icon="calendar-range"
                title="Tenancy information"
                description="Your current tenancy dates and costs."
              />

              <Divider style={styles.divider} />

              <DetailRow
                label="Tenancy start"
                value={property.tenancyStart}
              />

              <DetailRow
                label="Tenancy end"
                value={property.tenancyEnd}
              />

              <DetailRow
                label="Monthly rent"
                value={formatCurrency(property.rent)}
              />

              <DetailRow
                label="Security deposit"
                value={formatCurrency(property.deposit)}
              />

              <DetailRow
                label="Payment date"
                value={property.paymentDate}
              />
            </View>

            <View style={styles.noticeCard}>
              <MaterialCommunityIcons
                name="information-outline"
                size={27}
                color={colors.primary}
              />

              <View style={styles.flex}>
                <Text style={styles.noticeTitle}>
                  Keep your information updated
                </Text>

                <Text style={styles.noticeText}>
                  Use Settings to update your telephone
                  number, email address and notification
                  preferences.
                </Text>
              </View>

              <Button
                mode="outlined"
                onPress={() =>
                  router.push("/tenant/settings" as never)
                }
              >
                Settings
              </Button>
            </View>
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons
                  name="cash-check"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.summaryLabel}>
                NEXT RENT PAYMENT
              </Text>

              <Text style={styles.rentAmount}>
                {formatCurrency(property.rent)}
              </Text>

              <Text style={styles.rentDate}>
                Due {property.paymentDate}
              </Text>

              <Divider style={styles.divider} />

              <Button
                mode="contained"
                icon="credit-card-outline"
                onPress={() =>
                  router.push({
                    pathname: "/tenant/payments" as never,
                    params: {
                      propertyId: property.id,
                    },
                  })
                }
              >
                View payments
              </Button>
            </View>

            <View style={styles.helpCard}>
              <MaterialCommunityIcons
                name="headset"
                size={27}
                color={colors.primary}
              />

              <View style={styles.flex}>
                <Text style={styles.helpTitle}>
                  Property support
                </Text>

                <Text style={styles.helpText}>
                  Message your managing agent when you
                  need help with the property.
                </Text>

                <Button
                  mode="text"
                  icon="message-outline"
                  onPress={() =>
                    router.push("/tenant/messages" as never)
                  }
                >
                  Contact agent
                </Button>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.quickIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={27}
          color={colors.primary}
        />
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>

      <Text style={styles.quickDescription}>
        {description}
      </Text>

      <View style={styles.quickLink}>
        <Text style={styles.quickLinkText}>
          Open
        </Text>

        <MaterialCommunityIcons
          name="arrow-right"
          size={18}
          color={colors.primary}
        />
      </View>
    </Pressable>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={colors.primary}
        />
      </View>

      <View style={styles.flex}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

const styles = StyleSheet.create({
  screenContent: {
    padding: 0,
  },

  flex: {
    flex: 1,
  },

  page: {
    width: "100%",
    maxWidth: 1450,
    alignSelf: "center",
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 70,
  },

  topBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  logo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  topBarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.background,
  },

  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  heroIcon: {
    width: 67,
    height: 67,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  heroContent: {
    flex: 1,
    minWidth: 230,
  },

  heroLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  heroTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
  },

  heroDescription: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 10,
  },

  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },

  layoutStacked: {
    flexDirection: "column",
  },

  mainColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.lg,
  },

  sideColumn: {
    width: 340,
    gap: spacing.lg,
  },

  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  quickCard: {
    flexGrow: 1,
    flexBasis: 210,
    minWidth: 200,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  quickIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  quickTitle: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  quickDescription: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: spacing.md,
  },

  quickLinkText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  sectionIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  divider: {
    marginVertical: spacing.lg,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  detailLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  detailValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "right",
  },

  noticeCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  noticeTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  noticeText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  summaryCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  summaryIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
  },

  summaryLabel: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  rentAmount: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
  },

  rentDate: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
  },

  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  helpTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  helpText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  pressed: {
    opacity: 0.82,
  },
});