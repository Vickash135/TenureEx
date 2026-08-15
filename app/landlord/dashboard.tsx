import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Button } from "react-native-paper";

import LandlordModuleScreen from "./LandlordModuleScreen";

import { api } from "../../src/api/client";

import {
  colors,
  radius,
  spacing,
} from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type PropertyStatus = "Occupied" | "Vacant" | "Pending approval";

type Property = {
  id: string;
  address: string;
  area: string;
  monthlyRent: number;
  tenant: string;
  status: PropertyStatus;
  complianceStatus: "Compliant" | "Action required";
};

type BackendDashboardProperty = {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  townCity: string;
  county: string | null;
  postcode: string;
  monthlyRent: string | number;
  tenantName: string | null;
  propertyStatus: "OCCUPIED" | "VACANT" | "PENDING_APPROVAL";
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
};

type MaintenanceStatus = "Open" | "Assigned" | "Completed";

type MaintenanceRequest = {
  id: string;
  title: string;
  property: string;
  reportedBy: string;
  contractor: string;
  date: string;
  priority: "High" | "Medium" | "Low";
  status: MaintenanceStatus;
};

type ComplianceItem = {
  id: string;
  title: string;
  property: string;
  dueDate: string;
  status: "Expiring soon" | "Valid" | "Overdue";
};

const demoProperties: Property[] = [
  {
    id: "P001",
    address: "18 Victoria Road",
    area: "Manchester, M14 6BT",
    monthlyRent: 1450,
    tenant: "Olivia Harris",
    status: "Occupied",
    complianceStatus: "Compliant",
  },
  {
    id: "P002",
    address: "42 King Street",
    area: "Leeds, LS1 2HQ",
    monthlyRent: 1325,
    tenant: "James Wilson",
    status: "Occupied",
    complianceStatus: "Action required",
  },
  {
    id: "P003",
    address: "7 Park Avenue",
    area: "Liverpool, L17 4JP",
    monthlyRent: 1180,
    tenant: "No active tenancy",
    status: "Vacant",
    complianceStatus: "Compliant",
  },
  {
    id: "P004",
    address: "91 High Street",
    area: "Birmingham, B4 7SL",
    monthlyRent: 1575,
    tenant: "Application under review",
    status: "Pending approval",
    complianceStatus: "Compliant",
  },
];

const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: "M001",
    title: "Boiler pressure issue",
    property: "18 Victoria Road",
    reportedBy: "Olivia Harris",
    contractor: "NorthWest Heating Ltd",
    date: "24 July 2026",
    priority: "High",
    status: "Assigned",
  },
  {
    id: "M002",
    title: "Kitchen tap leaking",
    property: "42 King Street",
    reportedBy: "James Wilson",
    contractor: "Awaiting assignment",
    date: "23 July 2026",
    priority: "Medium",
    status: "Open",
  },
  {
    id: "M003",
    title: "Bedroom window handle",
    property: "18 Victoria Road",
    reportedBy: "Olivia Harris",
    contractor: "City Property Repairs",
    date: "19 July 2026",
    priority: "Low",
    status: "Completed",
  },
];

const complianceItems: ComplianceItem[] = [
  {
    id: "C001",
    title: "Gas Safety Certificate",
    property: "42 King Street",
    dueDate: "3 August 2026",
    status: "Expiring soon",
  },
  {
    id: "C002",
    title: "Electrical Installation Condition Report",
    property: "18 Victoria Road",
    dueDate: "18 February 2028",
    status: "Valid",
  },
  {
    id: "C003",
    title: "Energy Performance Certificate",
    property: "7 Park Avenue",
    dueDate: "12 September 2026",
    status: "Expiring soon",
  },
];

const recentActivity = [
  {
    id: "A001",
    icon: "tools" as IconName,
    title: "Maintenance contractor assigned",
    description:
      "NorthWest Heating Ltd was assigned to 18 Victoria Road.",
    time: "35 minutes ago",
  },
  {
    id: "A002",
    icon: "account-check-outline" as IconName,
    title: "Tenant application updated",
    description:
      "The application for 91 High Street is ready for review.",
    time: "2 hours ago",
  },
  {
    id: "A003",
    icon: "file-check-outline" as IconName,
    title: "Compliance document approved",
    description:
      "The electrical certificate for 18 Victoria Road was approved.",
    time: "Yesterday",
  },
];

export default function LandlordDashboardScreen() {
  const { width } = useWindowDimensions();

  const isWideScreen = width >= 1180;
  const isTablet = width >= 760;

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await api.get<BackendDashboardProperty[]>("/landlord-properties");
        setProperties(
          response.data.map((property) => ({
            id: property.id,
            address: property.addressLine1,
            area: [property.townCity, property.postcode].filter(Boolean).join(", "),
            monthlyRent: Number(property.monthlyRent) || 0,
            tenant: property.tenantName || "No active tenancy",
            status:
              property.approvalStatus === "PENDING"
                ? "Pending approval"
                : property.propertyStatus === "OCCUPIED"
                  ? "Occupied"
                  : property.propertyStatus === "VACANT"
                    ? "Vacant"
                    : "Pending approval",
            complianceStatus: "Compliant",
          })),
        );
      } catch {
        setProperties([]);
      } finally {
        setPropertiesLoading(false);
      }
    };

    void loadProperties();
  }, []);

  const occupiedCount = useMemo(
    () =>
      properties.filter((property) => property.status === "Occupied")
        .length,
    [properties],
  );

  const vacantCount = useMemo(
    () =>
      properties.filter((property) => property.status === "Vacant").length,
    [properties],
  );

  const monthlyRent = useMemo(
    () =>
      properties
        .filter((property) => property.status === "Occupied")
        .reduce(
          (total, property) => total + property.monthlyRent,
          0,
        ),
    [properties],
  );

  const openMaintenanceCount = useMemo(
    () =>
      maintenanceRequests.filter(
        (request) => request.status !== "Completed",
      ).length,
    [],
  );

  const navigateTo = (route: Href) => {
    router.push(route);
  };

  return (
    <LandlordModuleScreen
      pageTitle="Dashboard"
      pageSubtitle="Monitor your properties, tenancy activity, maintenance and compliance."
      activePage="Dashboard"
      primaryAction="Add property"
      primaryActionIcon="home-plus-outline"
      onPrimaryAction={() =>
        navigateTo("/landlord/properties" as Href)
      }
      statistics={[
        {
          label: "Total properties",
          value: String(properties.length),
          icon: "office-building-outline",
          helper: `${occupiedCount} currently occupied`,
        },
        {
          label: "Monthly rent",
          value: formatCurrency(monthlyRent),
          icon: "cash-multiple",
          helper: "Expected from active tenancies",
        },
        {
          label: "Open maintenance",
          value: String(openMaintenanceCount),
          icon: "tools",
          helper: "Requests requiring attention",
        },
        {
          label: "Vacant properties",
          value: String(vacantCount),
          icon: "home-search-outline",
          helper: "Available or awaiting tenancy",
        },
      ]}
    >
      <View
        style={[
          styles.dashboardGrid,
          isWideScreen
            ? styles.dashboardGridDesktop
            : styles.dashboardGridStacked,
        ]}
      >
        <View style={styles.mainColumn}>
          <SectionCard
            title="Property portfolio"
            subtitle="Current status of your managed properties"
            actionLabel="View all"
            onAction={() =>
              navigateTo("/landlord/properties" as Href)
            }
          >
            <View style={styles.propertyList}>
              {propertiesLoading ? (
                <Text style={styles.emptyStateText}>Loading properties...</Text>
              ) : properties.length === 0 ? (
                <Text style={styles.emptyStateText}>No properties have been added yet.</Text>
              ) : (
                properties.slice(0, 4).map((property) => (
                  <PropertyRow
                    key={property.id}
                    property={property}
                    compact={!isTablet}
                  />
                ))
              )}
            </View>
          </SectionCard>

          <SectionCard
            title="Maintenance overview"
            subtitle="Track repairs and contractor activity"
            actionLabel="Manage requests"
            onAction={() =>
              navigateTo("/landlord/maintenance" as Href)
            }
          >
            <View style={styles.maintenanceList}>
              {maintenanceRequests.map((request) => (
                <MaintenanceRow
                  key={request.id}
                  request={request}
                  compact={!isTablet}
                />
              ))}
            </View>
          </SectionCard>
        </View>

        <View style={styles.sideColumn}>
          <RentSummaryCard
            monthlyRent={monthlyRent}
            occupiedCount={occupiedCount}
            propertyCount={properties.length}
            onViewPayments={() =>
              navigateTo("/landlord/payments" as Href)
            }
          />

          <SectionCard
            title="Compliance alerts"
            subtitle="Certificates and legal documents"
            actionLabel="View documents"
            onAction={() =>
              navigateTo("/landlord/documents" as Href)
            }
          >
            <View style={styles.complianceList}>
              {complianceItems.map((item) => (
                <ComplianceRow
                  key={item.id}
                  item={item}
                />
              ))}
            </View>
          </SectionCard>

          <SectionCard
            title="Recent activity"
            subtitle="Latest portfolio updates"
          >
            <View style={styles.activityList}>
              {recentActivity.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                />
              ))}
            </View>
          </SectionCard>
        </View>
      </View>
    </LandlordModuleScreen>
  );
}

function SectionCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        </View>

        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            style={styles.sectionAction}
          >
            <Text style={styles.sectionActionText}>
              {actionLabel}
            </Text>

            <MaterialCommunityIcons
              name="arrow-right"
              size={17}
              color={colors.primary}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

function PropertyRow({
  property,
  compact,
}: {
  property: Property;
  compact: boolean;
}) {
  return (
    <Pressable style={styles.propertyRow}>
      <View style={styles.propertyIcon}>
        <MaterialCommunityIcons
          name="home-city-outline"
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.propertyInformation}>
        <Text
          style={styles.propertyAddress}
          numberOfLines={1}
        >
          {property.address}
        </Text>

        <Text
          style={styles.propertyArea}
          numberOfLines={1}
        >
          {property.area}
        </Text>

        <Text
          style={styles.propertyTenant}
          numberOfLines={1}
        >
          {property.tenant}
        </Text>
      </View>

      {!compact ? (
        <View style={styles.propertyRentSection}>
          <Text style={styles.propertyRent}>
            {formatCurrency(property.monthlyRent)}
          </Text>

          <Text style={styles.propertyRentLabel}>
            per month
          </Text>
        </View>
      ) : null}

      <View style={styles.propertyBadges}>
        <StatusBadge
          text={property.status}
          type={
            property.status === "Occupied"
              ? "success"
              : property.status === "Vacant"
                ? "warning"
                : "primary"
          }
        />

        {!compact ? (
          <StatusBadge
            text={property.complianceStatus}
            type={
              property.complianceStatus === "Compliant"
                ? "success"
                : "error"
            }
          />
        ) : null}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

function MaintenanceRow({
  request,
  compact,
}: {
  request: MaintenanceRequest;
  compact: boolean;
}) {
  return (
    <Pressable style={styles.maintenanceRow}>
      <View
        style={[
          styles.priorityIndicator,
          request.priority === "High" &&
            styles.highPriorityIndicator,
          request.priority === "Medium" &&
            styles.mediumPriorityIndicator,
          request.priority === "Low" &&
            styles.lowPriorityIndicator,
        ]}
      />

      <View style={styles.maintenanceInformation}>
        <Text
          style={styles.maintenanceTitle}
          numberOfLines={1}
        >
          {request.title}
        </Text>

        <Text
          style={styles.maintenanceProperty}
          numberOfLines={1}
        >
          {request.property} · Reported by {request.reportedBy}
        </Text>

        {!compact ? (
          <Text
            style={styles.maintenanceContractor}
            numberOfLines={1}
          >
            {request.contractor} · {request.date}
          </Text>
        ) : null}
      </View>

      <View style={styles.maintenanceMeta}>
        <Text style={styles.priorityText}>
          {request.priority}
        </Text>

        <StatusBadge
          text={request.status}
          type={
            request.status === "Completed"
              ? "success"
              : request.status === "Assigned"
                ? "primary"
                : "warning"
          }
        />
      </View>
    </Pressable>
  );
}

function RentSummaryCard({
  monthlyRent,
  occupiedCount,
  propertyCount,
  onViewPayments,
}: {
  monthlyRent: number;
  occupiedCount: number;
  propertyCount: number;
  onViewPayments: () => void;
}) {
  const occupancyRate =
    propertyCount === 0
      ? 0
      : Math.round((occupiedCount / propertyCount) * 100);

  return (
    <View style={styles.rentCard}>
      <View style={styles.rentHeader}>
        <View>
          <Text style={styles.rentEyebrow}>
            RENT SUMMARY
          </Text>

          <Text style={styles.rentTitle}>
            Current month
          </Text>
        </View>

        <View style={styles.rentIcon}>
          <MaterialCommunityIcons
            name="finance"
            size={24}
            color={colors.white}
          />
        </View>
      </View>

      <Text style={styles.rentValue}>
        {formatCurrency(monthlyRent)}
      </Text>

      <Text style={styles.rentDescription}>
        Expected rental income from occupied properties.
      </Text>

      <View style={styles.occupancySection}>
        <View style={styles.occupancyHeader}>
          <Text style={styles.occupancyLabel}>
            Portfolio occupancy
          </Text>

          <Text style={styles.occupancyValue}>
            {occupancyRate}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressValue,
              {
                width: `${occupancyRate}%`,
              },
            ]}
          />
        </View>
      </View>

      <Button
        mode="contained"
        icon="credit-card-outline"
        buttonColor={colors.white}
        textColor={colors.primaryDark}
        style={styles.rentButton}
        onPress={onViewPayments}
      >
        View payments
      </Button>
    </View>
  );
}

function ComplianceRow({
  item,
}: {
  item: ComplianceItem;
}) {
  return (
    <Pressable style={styles.complianceRow}>
      <View
        style={[
          styles.complianceIcon,
          item.status === "Overdue" &&
            styles.complianceIconError,
          item.status === "Expiring soon" &&
            styles.complianceIconWarning,
        ]}
      >
        <MaterialCommunityIcons
          name={
            item.status === "Valid"
              ? "shield-check-outline"
              : "calendar-alert"
          }
          size={20}
          color={
            item.status === "Valid"
              ? colors.success
              : item.status === "Overdue"
                ? colors.error
                : colors.warning
          }
        />
      </View>

      <View style={styles.complianceInformation}>
        <Text
          style={styles.complianceTitle}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text
          style={styles.complianceProperty}
          numberOfLines={1}
        >
          {item.property}
        </Text>

        <Text style={styles.complianceDate}>
          Due {item.dueDate}
        </Text>
      </View>

      <StatusBadge
        text={item.status}
        type={
          item.status === "Valid"
            ? "success"
            : item.status === "Overdue"
              ? "error"
              : "warning"
        }
      />
    </Pressable>
  );
}

function ActivityRow({
  activity,
}: {
  activity: {
    id: string;
    icon: IconName;
    title: string;
    description: string;
    time: string;
  };
}) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIcon}>
        <MaterialCommunityIcons
          name={activity.icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <View style={styles.activityInformation}>
        <Text style={styles.activityTitle}>
          {activity.title}
        </Text>

        <Text style={styles.activityDescription}>
          {activity.description}
        </Text>

        <Text style={styles.activityTime}>
          {activity.time}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({
  text,
  type,
}: {
  text: string;
  type: "success" | "warning" | "error" | "primary";
}) {
  return (
    <View
      style={[
        styles.statusBadge,
        type === "success" && styles.successBadge,
        type === "warning" && styles.warningBadge,
        type === "error" && styles.errorBadge,
        type === "primary" && styles.primaryBadge,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          type === "success" && styles.successBadgeText,
          type === "warning" && styles.warningBadgeText,
          type === "error" && styles.errorBadgeText,
          type === "primary" && styles.primaryBadgeText,
        ]}
      >
        {text}
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
  dashboardGrid: {
    width: "100%",
    gap: spacing.xl,
  },

  dashboardGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  dashboardGridStacked: {
    flexDirection: "column",
  },

  mainColumn: {
    flex: 1.65,
    minWidth: 0,
    gap: spacing.xl,
  },

  sideColumn: {
    flex: 1,
    minWidth: 300,
    gap: spacing.xl,
  },

  sectionCard: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  sectionHeading: {
    flex: 1,
    minWidth: 200,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },

  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
  },

  sectionActionText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  sectionContent: {
    width: "100%",
  },

  emptyStateText: {
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },

  propertyList: {
    width: "100%",
  },

  propertyRow: {
    width: "100%",
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  propertyIcon: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  propertyInformation: {
    flex: 1,
    minWidth: 130,
  },

  propertyAddress: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  propertyArea: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
  },

  propertyTenant: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },

  propertyRentSection: {
    minWidth: 90,
    alignItems: "flex-end",
  },

  propertyRent: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  propertyRentLabel: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  propertyBadges: {
    alignItems: "flex-end",
    gap: 5,
  },

  maintenanceList: {
    width: "100%",
  },

  maintenanceRow: {
    width: "100%",
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  priorityIndicator: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 2,
  },

  highPriorityIndicator: {
    backgroundColor: colors.error,
  },

  mediumPriorityIndicator: {
    backgroundColor: colors.warning,
  },

  lowPriorityIndicator: {
    backgroundColor: colors.success,
  },

  maintenanceInformation: {
    flex: 1,
    minWidth: 150,
  },

  maintenanceTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  maintenanceProperty: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
  },

  maintenanceContractor: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },

  maintenanceMeta: {
    alignItems: "flex-end",
    gap: 7,
  },

  priorityText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
  },

  rentCard: {
    width: "100%",
    padding: spacing.xl,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
  },

  rentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rentEyebrow: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  rentTitle: {
    marginTop: 5,
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },

  rentIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  rentValue: {
    marginTop: spacing.xl,
    color: colors.white,
    fontSize: 32,
    fontWeight: "900",
  },

  rentDescription: {
    marginTop: spacing.sm,
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    lineHeight: 16,
  },

  occupancySection: {
    marginTop: spacing.xl,
  },

  occupancyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  occupancyLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 9,
    fontWeight: "700",
  },

  occupancyValue: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  progressTrack: {
    height: 7,
    marginTop: spacing.sm,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  progressValue: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },

  rentButton: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
  },

  complianceList: {
    width: "100%",
  },

  complianceRow: {
    width: "100%",
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  complianceIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.successLight,
  },

  complianceIconWarning: {
    backgroundColor: colors.warningLight,
  },

  complianceIconError: {
    backgroundColor: colors.errorLight,
  },

  complianceInformation: {
    flex: 1,
    minWidth: 0,
  },

  complianceTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  complianceProperty: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
  },

  complianceDate: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  activityList: {
    width: "100%",
  },

  activityRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  activityIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  activityInformation: {
    flex: 1,
    minWidth: 0,
  },

  activityTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  activityDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
  },

  activityTime: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 8,
  },

  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  successBadge: {
    backgroundColor: colors.successLight,
  },

  successBadgeText: {
    color: colors.success,
  },

  warningBadge: {
    backgroundColor: colors.warningLight,
  },

  warningBadgeText: {
    color: colors.warning,
  },

  errorBadge: {
    backgroundColor: colors.errorLight,
  },

  errorBadgeText: {
    color: colors.error,
  },

  primaryBadge: {
    backgroundColor: colors.primaryLight,
  },

  primaryBadgeText: {
    color: colors.primary,
  },
});