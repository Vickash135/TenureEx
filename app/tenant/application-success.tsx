import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useMemo } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Button,
    Chip,
    Divider,
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type PropertySummary = {
  id: string;
  title: string;
  address: string;
  monthlyRent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  agentName: string;
};

const properties: PropertySummary[] = [
  {
    id: "PROP-001",
    title: "Modern Two-Bedroom City Apartment",
    address: "42 King Street, Leeds, LS1 2HQ",
    monthlyRent: 1325,
    deposit: 1528,
    bedrooms: 2,
    bathrooms: 2,
    agentName: "TenureEx Leeds",
  },
  {
    id: "PROP-002",
    title: "Three-Bedroom Family Home",
    address:
      "18 Victoria Road, Manchester, M14 6BT",
    monthlyRent: 1450,
    deposit: 1673,
    bedrooms: 3,
    bathrooms: 2,
    agentName: "TenureEx Manchester",
  },
  {
    id: "PROP-003",
    title: "City Centre One-Bedroom Flat",
    address:
      "91 High Street, Birmingham, B4 7SL",
    monthlyRent: 1100,
    deposit: 1269,
    bedrooms: 1,
    bathrooms: 1,
    agentName: "TenureEx Birmingham",
  },
  {
    id: "PROP-004",
    title: "Accessible Two-Bedroom Bungalow",
    address:
      "7 Meadow Close, Sheffield, S11 8RT",
    monthlyRent: 1250,
    deposit: 1442,
    bedrooms: 2,
    bathrooms: 1,
    agentName: "TenureEx Sheffield",
  },
];

export default function TenantApplicationSuccessScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 950;

  const params = useLocalSearchParams<{
    applicationId?: string | string[];
    propertyId?: string | string[];
  }>();

  const applicationId = Array.isArray(
    params.applicationId,
  )
    ? params.applicationId[0]
    : params.applicationId;

  const propertyId = Array.isArray(
    params.propertyId,
  )
    ? params.propertyId[0]
    : params.propertyId;

  const selectedProperty = useMemo(() => {
    return (
      properties.find(
        (property) =>
          property.id === propertyId,
      ) ?? properties[0]
    );
  }, [propertyId]);

  const submittedDate =
    new Date().toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

  const referenceNumber =
    applicationId ??
    `APP-${Date.now()}`;

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
              router.replace(
                "/tenant/dashboard" as never,
              )
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

              <Text
                style={styles.brandSubtitle}
              >
                Tenant application
              </Text>
            </View>
          </Pressable>

          <Button
            mode="text"
            icon="view-dashboard-outline"
            onPress={() =>
              router.replace(
                "/tenant/dashboard" as never,
              )
            }
          >
            Dashboard
          </Button>
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop &&
              styles.layoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <View style={styles.successCard}>
              <View
                style={styles.successIconOuter}
              >
                <View
                  style={styles.successIconInner}
                >
                  <MaterialCommunityIcons
                    name="check-bold"
                    size={45}
                    color={colors.white}
                  />
                </View>
              </View>

              <Chip
                icon="check-decagram"
                style={styles.statusChip}
              >
                Application submitted
              </Chip>

              <Text style={styles.successTitle}>
                Your property application has
                been submitted
              </Text>

              <Text
                style={
                  styles.successDescription
                }
              >
                Your application and supporting
                documents have been sent for
                review. You can now track the
                application from your tenant
                dashboard.
              </Text>

              <View
                style={styles.referenceBox}
              >
                <Text
                  style={
                    styles.referenceLabel
                  }
                >
                  APPLICATION REFERENCE
                </Text>

                <Text
                  style={
                    styles.referenceNumber
                  }
                >
                  {referenceNumber}
                </Text>

                <Text
                  style={
                    styles.referenceHelper
                  }
                >
                  Keep this number for future
                  communication about your
                  application.
                </Text>
              </View>

              <View style={styles.actions}>
                <Button
                  mode="contained"
                  icon="view-dashboard-outline"
                  onPress={() =>
                    router.replace(
                      "/tenant/dashboard" as never,
                    )
                  }
                >
                  Go to dashboard
                </Button>

                <Button
                  mode="outlined"
                  icon="clipboard-text-outline"
                  onPress={() =>
                    router.replace(
                      "/tenant/applications" as never,
                    )
                  }
                >
                  View applications
                </Button>
              </View>
            </View>

            <View style={styles.nextStepsCard}>
              <View
                style={styles.sectionHeader}
              >
                <View
                  style={styles.sectionIcon}
                >
                  <MaterialCommunityIcons
                    name="progress-check"
                    size={26}
                    color={colors.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.sectionTitle}
                  >
                    What happens next?
                  </Text>

                  <Text
                    style={
                      styles.sectionDescription
                    }
                  >
                    Your application will move
                    through the following review
                    stages.
                  </Text>
                </View>
              </View>

              <View style={styles.timeline}>
                <TimelineItem
                  icon="check-circle"
                  title="Application submitted"
                  description="Your form and documents have been received."
                  complete
                />

                <TimelineLine complete />

                <TimelineItem
                  icon="file-search-outline"
                  title="Document review"
                  description="The estate agent checks your identity, income and supporting documents."
                  active
                />

                <TimelineLine />

                <TimelineItem
                  icon="account-search-outline"
                  title="Reference checks"
                  description="Employment, landlord and affordability checks may be completed."
                />

                <TimelineLine />

                <TimelineItem
                  icon="account-tie-outline"
                  title="Landlord decision"
                  description="The landlord reviews the completed application."
                />

                <TimelineLine />

                <TimelineItem
                  icon="file-sign"
                  title="Tenancy agreement"
                  description="If approved, you will receive an agreement to review and sign."
                />
              </View>
            </View>

            <View style={styles.noticeCard}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={28}
                color={colors.primary}
              />

              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>
                  Watch for updates
                </Text>

                <Text
                  style={
                    styles.noticeDescription
                  }
                >
                  TenureEx will show application
                  updates in your dashboard and
                  messages. You may be asked to
                  provide additional information.
                </Text>
              </View>

              <Button
                mode="outlined"
                icon="message-text-outline"
                onPress={() =>
                  router.push(
                    "/tenant/messages" as never,
                  )
                }
              >
                Messages
              </Button>
            </View>
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.summaryCard}>
              <View
                style={styles.propertyIcon}
              >
                <MaterialCommunityIcons
                  name="home-outline"
                  size={31}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.summaryLabel}>
                APPLICATION SUMMARY
              </Text>

              <Text style={styles.propertyTitle}>
                {selectedProperty.title}
              </Text>

              <Text
                style={
                  styles.propertyAddress
                }
              >
                {selectedProperty.address}
              </Text>

              <Divider
                style={styles.divider}
              />

              <SummaryRow
                label="Application ID"
                value={referenceNumber}
              />

              <SummaryRow
                label="Submitted"
                value={submittedDate}
              />

              <SummaryRow
                label="Status"
                value="Under review"
              />

              <SummaryRow
                label="Monthly rent"
                value={formatCurrency(
                  selectedProperty.monthlyRent,
                )}
              />

              <SummaryRow
                label="Deposit"
                value={formatCurrency(
                  selectedProperty.deposit,
                )}
              />

              <SummaryRow
                label="Agent"
                value={
                  selectedProperty.agentName
                }
              />

              <View
                style={styles.propertyFacts}
              >
                <PropertyFact
                  icon="bed-outline"
                  value={`${selectedProperty.bedrooms} bedroom(s)`}
                />

                <PropertyFact
                  icon="shower"
                  value={`${selectedProperty.bathrooms} bathroom(s)`}
                />
              </View>

              <Button
                mode="outlined"
                icon="home-search-outline"
                onPress={() =>
                  router.push({
                    pathname:
                      "/tenant/property-details" as never,
                    params: {
                      propertyId:
                        selectedProperty.id,
                    },
                  })
                }
              >
                View property
              </Button>
            </View>

            <View style={styles.helpCard}>
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={27}
                color={colors.primary}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.helpTitle}>
                  Need help?
                </Text>

                <Text
                  style={
                    styles.helpDescription
                  }
                >
                  Contact the estate agent using
                  TenureEx messages and include
                  your application reference.
                </Text>

                <Button
                  mode="text"
                  icon="message-plus-outline"
                  compact
                  onPress={() =>
                    router.push(
                      "/tenant/messages" as never,
                    )
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

function TimelineItem({
  icon,
  title,
  description,
  active = false,
  complete = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View
        style={[
          styles.timelineIcon,
          active &&
            styles.timelineIconActive,
          complete &&
            styles.timelineIconComplete,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={
            active || complete
              ? colors.white
              : colors.textMuted
          }
        />
      </View>

      <View style={styles.timelineContent}>
        <View
          style={styles.timelineTitleRow}
        >
          <Text
            style={[
              styles.timelineTitle,
              (active || complete) &&
                styles.timelineTitleActive,
            ]}
          >
            {title}
          </Text>

          {complete ? (
            <Chip compact icon="check">
              Complete
            </Chip>
          ) : null}

          {active ? (
            <Chip
              compact
              icon="clock-outline"
            >
              In progress
            </Chip>
          ) : null}
        </View>

        <Text
          style={
            styles.timelineDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function TimelineLine({
  complete = false,
}: {
  complete?: boolean;
}) {
  return (
    <View
      style={[
        styles.timelineLine,
        complete &&
          styles.timelineLineComplete,
      ]}
    />
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={styles.summaryRowLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.summaryRowValue}
      >
        {value}
      </Text>
    </View>
  );
}

function PropertyFact({
  icon,
  value,
}: {
  icon: IconName;
  value: string;
}) {
  return (
    <View style={styles.propertyFact}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={colors.primary}
      />

      <Text
        style={styles.propertyFactText}
      >
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
    width: 350,
    gap: spacing.lg,
  },

  successCard: {
    alignItems: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  successIconOuter: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 56,
    backgroundColor: colors.successLight,
  },

  successIconInner: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 38,
    backgroundColor: colors.success,
  },

  statusChip: {
    marginTop: spacing.lg,
    backgroundColor: colors.successLight,
  },

  successTitle: {
    maxWidth: 700,
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 35,
    textAlign: "center",
  },

  successDescription: {
    maxWidth: 700,
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 19,
    textAlign: "center",
  },

  referenceBox: {
    width: "100%",
    maxWidth: 600,
    alignItems: "center",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  referenceLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  referenceNumber: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },

  referenceHelper: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  nextStepsCard: {
    padding: spacing.xl,
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
    width: 53,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  timeline: {
    marginTop: spacing.xl,
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  timelineIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 23,
    backgroundColor: colors.background,
  },

  timelineIconActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  timelineIconComplete: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: spacing.md,
  },

  timelineTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  timelineTitle: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },

  timelineTitleActive: {
    color: colors.textPrimary,
  },

  timelineDescription: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  timelineLine: {
    width: 2,
    height: 28,
    marginLeft: 22,
    backgroundColor: colors.border,
  },

  timelineLineComplete: {
    backgroundColor: colors.success,
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

  noticeContent: {
    flex: 1,
    minWidth: 220,
  },

  noticeTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  noticeDescription: {
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

  propertyIcon: {
    width: 60,
    height: 60,
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

  propertyTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
  },

  propertyAddress: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  divider: {
    marginVertical: spacing.lg,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  summaryRowLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  summaryRowValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
    textAlign: "right",
  },

  propertyFacts: {
    gap: spacing.md,
    marginVertical: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  propertyFact: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  propertyFactText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
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

  helpDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },
});