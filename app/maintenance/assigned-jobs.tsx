import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  Searchbar,
} from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { api } from "../../src/api/client";
import ScreenContainer from "../../src/components/ScreenContainer";
import WorkflowNotifications from "../../src/components/WorkflowNotifications";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  userType: string;
  status: string;
};

const maintenanceRoleConfig = { _tenureExRole: "maintenance" } as any;

type JobStatus =
  | "New"
  | "Accepted"
  | "Scheduled"
  | "In progress"
  | "Awaiting tenant";

type JobPriority = "Urgent" | "High" | "Normal";

type MaintenanceJob = {
  id: string;
  title: string;
  category: string;
  property: string;
  tenant: string;
  phone: string;
  date: string;
  time: string;
  priority: JobPriority;
  status: JobStatus;
  icon: IconName;
  description: string;
};

const initialMaintenanceJobs: MaintenanceJob[] = [];

const filterOptions = [
  "All",
  "New",
  "Accepted",
  "Scheduled",
  "In progress",
  "Awaiting tenant",
] as const;

type FilterOption = (typeof filterOptions)[number];

export default function AssignedJobsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("All");
  const [maintenanceJobs, setMaintenanceJobs] = useState<MaintenanceJob[]>(initialMaintenanceJobs);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadJobs = async () => {
    try {
      setLoadError("");
      const [meResponse, response] = await Promise.all([
        api.get("/auth/me", maintenanceRoleConfig),
        api.get("/property-workflows/maintenance-requests", maintenanceRoleConfig),
      ]);
      setCurrentUser(meResponse.data as CurrentUser);
      const rows = Array.isArray(response.data) ? response.data : [];
      const mapped: MaintenanceJob[] = rows
        .filter((row: any) => row.status !== "COMPLETED")
        .map((row: any) => ({
          id: row.id,
          title: row.title,
          category: row.category || "Maintenance",
          property: [row.property?.addressLine1, row.property?.townCity, row.property?.postcode].filter(Boolean).join(", "),
          tenant: [row.tenant?.firstName, row.tenant?.lastName].filter(Boolean).join(" ") || "Tenant",
          phone: row.tenant?.phone || "",
          date: row.scheduledStart ? new Date(row.scheduledStart).toLocaleDateString("en-GB") : "Awaiting selection",
          time: row.scheduledStart ? new Date(row.scheduledStart).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Select tenant time",
          priority: row.priority === "EMERGENCY" ? "Urgent" : row.priority === "HIGH" ? "High" : "Normal",
          status: row.status === "SCHEDULED" ? "Scheduled" : row.status === "IN_PROGRESS" ? "In progress" : row.status === "AWAITING_TENANT_CONFIRMATION" ? "Awaiting tenant" : row.assignedProviderUserId ? "Accepted" : "New",
          icon: categoryIcon(row.category),
          description: row.description,
        }));
      setMaintenanceJobs(mapped);
    } catch (error: any) {
      setLoadError(error?.response?.data?.message || "Unable to load maintenance jobs.");
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    return maintenanceJobs.filter((job) => {
      const matchesStatus =
        selectedFilter === "All" ||
        job.status === selectedFilter;

      const matchesSearch =
        !cleanSearch ||
        job.id.toLowerCase().includes(cleanSearch) ||
        job.title.toLowerCase().includes(cleanSearch) ||
        job.category.toLowerCase().includes(cleanSearch) ||
        job.property.toLowerCase().includes(cleanSearch) ||
        job.tenant.toLowerCase().includes(cleanSearch);

      return matchesStatus && matchesSearch;
    });
  }, [searchQuery, selectedFilter]);

  const urgentJobs = maintenanceJobs.filter(
    (job) => job.priority === "Urgent"
  ).length;

  const newJobs = maintenanceJobs.filter(
    (job) => job.status === "New"
  ).length;

  const scheduledJobs = maintenanceJobs.filter(
    (job) => job.status === "Scheduled"
  ).length;

  const providerName = currentUser
    ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") || currentUser.email
    : "Maintenance Provider";

  const providerInitials = currentUser
    ? `${currentUser.firstName?.charAt(0) || ""}${currentUser.lastName?.charAt(0) || ""}`.toUpperCase() || "MP"
    : "MP";

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <Animated.View
          entering={FadeInUp.duration(450)}
          style={styles.header}
        >
          <Pressable
            style={styles.brandRow}
            onPress={() =>
              router.replace(
                "/maintenance/dashboard" as never
              )
            }
          >
            <View style={styles.brandLogo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TENUREEX
              </Text>

              <Text style={styles.brandSubtitle}>
                Maintenance Provider
              </Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconButton}
              onPress={() =>
                router.push(
                  "/maintenance/messages" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={21}
                color={colors.textPrimary}
              />
            </Pressable>

            <Pressable
              style={styles.profileButton}
              onPress={() =>
                router.push(
                  "/maintenance/settings" as never
                )
              }
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {providerInitials}
                </Text>
              </View>

              {isTablet ? (
                <View>
                  <Text style={styles.profileName}>
                    {providerName}
                  </Text>

                  <Text style={styles.profileRole}>
                    Provider account
                  </Text>
                </View>
              ) : null}

              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(450)}
          style={styles.backRow}
        >
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.replace(
                "/maintenance/dashboard" as never
              )
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={colors.primary}
            />

            <Text style={styles.backText}>
              Dashboard
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(450)}
          style={[
            styles.pageHeading,
            isDesktop && styles.desktopPageHeading,
          ]}
        >
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>
              MAINTENANCE WORK
            </Text>

            <Text
              style={[
                styles.pageTitle,
                isSmallPhone && styles.smallPageTitle,
              ]}
            >
              Assigned jobs
            </Text>

            <Text style={styles.pageDescription}>
              Review new maintenance requests, scheduled
              visits and jobs currently in progress.
            </Text>
          </View>

          <Button
            mode="outlined"
            icon="check-circle-outline"
            onPress={() =>
              router.push(
                "/maintenance/completed-jobs" as never
              )
            }
            textColor={colors.primary}
            style={styles.completedButton}
          >
            Completed jobs
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(170).duration(450)}
          style={[
            styles.summaryGrid,
            isDesktop
              ? styles.desktopSummaryGrid
              : isTablet
                ? styles.tabletSummaryGrid
                : styles.mobileSummaryGrid,
          ]}
        >
          <SummaryCard
            icon="clipboard-text-outline"
            label="Total active"
            value={maintenanceJobs.length.toString()}
          />

          <SummaryCard
            icon="clipboard-alert-outline"
            label="New jobs"
            value={newJobs.toString()}
          />

          <SummaryCard
            icon="alert-circle-outline"
            label="Urgent"
            value={urgentJobs.toString()}
          />

          <SummaryCard
            icon="calendar-clock-outline"
            label="Scheduled"
            value={scheduledJobs.toString()}
          />
        </Animated.View>

        <WorkflowNotifications title="Job notifications" limit={6} />

        <Animated.View
          entering={FadeInDown.delay(220).duration(450)}
          style={styles.jobsContainer}
        >
          <View
            style={[
              styles.searchSection,
              isDesktop && styles.desktopSearchSection,
            ]}
          >
            <Searchbar
              placeholder="Search job, tenant or property"
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon="magnify"
              style={styles.searchbar}
              inputStyle={styles.searchInput}
            />

            <View style={styles.filterRow}>
              {filterOptions.map((filter) => (
                <Chip
                  key={filter}
                  selected={selectedFilter === filter}
                  onPress={() =>
                    setSelectedFilter(filter)
                  }
                  showSelectedCheck={false}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter &&
                      styles.selectedFilterChip,
                  ]}
                  textStyle={[
                    styles.filterChipText,
                    selectedFilter === filter &&
                      styles.selectedFilterChipText,
                  ]}
                >
                  {filter}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>
                Maintenance jobs
              </Text>

              <Text style={styles.listDescription}>
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1
                  ? "job"
                  : "jobs"}{" "}
                found
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {filteredJobs.length > 0 ? (
            <View style={styles.jobList}>
              {filteredJobs.map((job) => (
                <AssignedJobCard
                  key={job.id}
                  job={job}
                  isDesktop={isDesktop}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="clipboard-search-outline"
                  size={40}
                  color={colors.textMuted}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {loadingJobs ? "Loading jobs…" : "No jobs found"}
              </Text>

              <Text style={styles.emptyDescription}>
                {loadError || (loadingJobs ? "Checking property maintenance work." : "Try changing the selected filter or search phrase.")}
              </Text>

              <Button
                mode="outlined"
                onPress={() => {
                  setSearchQuery("");
                  setSelectedFilter("All");
                }}
                textColor={colors.primary}
                style={styles.clearButton}
              >
                Clear filters
              </Button>
            </View>
          )}
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

function categoryIcon(category?: string): IconName {
  const value = String(category || "").toLowerCase();
  if (value.includes("plumb") || value.includes("water")) return "water-pump";
  if (value.includes("heat") || value.includes("boiler")) return "water-boiler";
  if (value.includes("electric") || value.includes("light")) return "lightbulb-outline";
  if (value.includes("security") || value.includes("lock")) return "lock-outline";
  if (value.includes("vent") || value.includes("fan")) return "fan";
  return "tools";
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <View>
        <Text style={styles.summaryValue}>
          {value}
        </Text>

        <Text style={styles.summaryLabel}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function AssignedJobCard({
  job,
  isDesktop,
}: {
  job: MaintenanceJob;
  isDesktop: boolean;
}) {
  const openJob = () => {
    router.push({
      pathname: "/maintenance/job-details" as never,
      params: {
        jobId: job.id,
      },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.jobCard,
        pressed && styles.jobCardPressed,
      ]}
      onPress={openJob}
    >
      <View style={styles.jobIcon}>
        <MaterialCommunityIcons
          name={job.icon}
          size={25}
          color={colors.primary}
        />
      </View>

      <View style={styles.jobMain}>
        <View
          style={[
            styles.jobTopRow,
            !isDesktop && styles.mobileJobTopRow,
          ]}
        >
          <View style={styles.jobTitleSection}>
            <View style={styles.jobTitleLine}>
              <Text style={styles.jobTitle}>
                {job.title}
              </Text>

              <StatusBadge status={job.status} />
            </View>

            <Text style={styles.jobReference}>
              {job.id} · {job.category}
            </Text>
          </View>

          <PriorityBadge priority={job.priority} />
        </View>

        <Text
          style={styles.jobDescription}
          numberOfLines={2}
        >
          {job.description}
        </Text>

        <View
          style={[
            styles.detailsGrid,
            isDesktop && styles.desktopDetailsGrid,
          ]}
        >
          <JobInformation
            icon="map-marker-outline"
            label="Property"
            value={job.property}
          />

          <JobInformation
            icon="account-outline"
            label="Tenant"
            value={job.tenant}
          />

          <JobInformation
            icon="calendar-clock-outline"
            label="Visit"
            value={`${job.date}, ${job.time}`}
          />
        </View>

        <View style={styles.jobFooter}>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={15}
              color={colors.textMuted}
            />

            <Text style={styles.contactText}>
              {job.phone}
            </Text>
          </View>

          <View style={styles.viewJobRow}>
            <Text style={styles.viewJobText}>
              View job details
            </Text>

            <MaterialCommunityIcons
              name="arrow-right"
              size={17}
              color={colors.primary}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function JobInformation({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.jobInformation}>
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={colors.textMuted}
      />

      <View style={styles.flex}>
        <Text style={styles.informationLabel}>
          {label}
        </Text>

        <Text
          style={styles.informationValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: JobStatus;
}) {
  const backgroundColor =
    status === "New"
      ? "#E8F1FF"
      : status === "Scheduled"
        ? "#F1EAFF"
        : status === "In progress"
          ? "#FFF2D5"
          : "#E9F7EF";

  const textColor =
    status === "New"
      ? "#245AA6"
      : status === "Scheduled"
        ? "#6540AC"
        : status === "In progress"
          ? "#8B5D00"
          : "#277A46";

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          {
            color: textColor,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: JobPriority;
}) {
  const backgroundColor =
    priority === "Urgent"
      ? "#FDECEC"
      : priority === "High"
        ? "#FFF2D5"
        : colors.background;

  const textColor =
    priority === "Urgent"
      ? "#B42318"
      : priority === "High"
        ? "#8B5D00"
        : colors.textSecondary;

  return (
    <View
      style={[
        styles.priorityBadge,
        {
          backgroundColor,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={
          priority === "Urgent"
            ? "alert-circle-outline"
            : priority === "High"
              ? "alert-outline"
              : "information-outline"
        }
        size={14}
        color={textColor}
      />

      <Text
        style={[
          styles.priorityText,
          {
            color: textColor,
          },
        ]}
      >
        {priority}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },

  flex: {
    flex: 1,
  },

  page: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingVertical: spacing.md,
  },

  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  brandLogo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.3,
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  profileButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },

  profileAvatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  profileAvatarText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
  },

  backRow: {
    marginTop: spacing.lg,
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  backText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  pageHeading: {
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  desktopPageHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  headingText: {
    flex: 1,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  pageTitle: {
    ...typography.headingMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },

  smallPageTitle: {
    fontSize: 26,
    lineHeight: 32,
  },

  pageDescription: {
    ...typography.bodyMedium,
    maxWidth: 720,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  completedButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  summaryGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  desktopSummaryGrid: {
    flexDirection: "row",
  },

  tabletSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  mobileSummaryGrid: {
    flexDirection: "column",
  },

  summaryCard: {
    flex: 1,
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  summaryValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
  },

  summaryLabel: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  jobsContainer: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 2,
  },

  searchSection: {
    gap: spacing.md,
  },

  desktopSearchSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  searchbar: {
    flex: 1,
    maxWidth: 520,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    elevation: 0,
  },

  searchInput: {
    fontSize: 11,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  selectedFilterChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  filterChipText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  selectedFilterChipText: {
    color: colors.white,
  },

  listHeader: {
    marginTop: spacing.xl,
  },

  listTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  listDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
  },

  divider: {
    marginTop: spacing.md,
    backgroundColor: colors.border,
  },

  jobList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  jobCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  jobCardPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.995,
      },
    ],
  },

  jobIcon: {
    width: 52,
    height: 52,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  jobMain: {
    flex: 1,
    minWidth: 0,
  },

  jobTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  mobileJobTopRow: {
    flexDirection: "column",
  },

  jobTitleSection: {
    flex: 1,
  },

  jobTitleLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  jobTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  jobReference: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
  },

  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  priorityText: {
    fontSize: 8,
    fontWeight: "900",
  },

  jobDescription: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  detailsGrid: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  desktopDetailsGrid: {
    flexDirection: "row",
  },

  jobInformation: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    minWidth: 180,
  },

  informationLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  informationValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 9,
    lineHeight: 15,
    fontWeight: "700",
  },

  jobFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  contactText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  viewJobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  viewJobText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: colors.background,
  },

  emptyTitle: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  emptyDescription: {
    maxWidth: 360,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
    textAlign: "center",
  },

  clearButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
});