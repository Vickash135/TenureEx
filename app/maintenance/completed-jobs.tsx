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
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  Searchbar,
} from "react-native-paper";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { api } from "../../src/api/client";
import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, radius, spacing, typography } from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  userType: string;
  status: string;
};

type CompletedJob = {
  id: string;
  title: string;
  category: string;
  property: string;
  tenant: string;
  completionDateIso: string;
  completedDate: string;
  completedTime: string;
  icon: IconName;
  completionNotes: string;
  tenantCompletionNote?: string | null;
  evidenceCount: number;
};

const maintenanceRoleConfig = { _tenureExRole: "maintenance" } as any;
const dateFilters = ["All", "This week", "This month"] as const;
type DateFilter = (typeof dateFilters)[number];

function categoryIcon(category?: string): IconName {
  const value = String(category || "").toLowerCase();
  if (value.includes("plumb") || value.includes("water")) return "water-pump";
  if (value.includes("heat") || value.includes("boiler")) return "water-boiler";
  if (value.includes("electric") || value.includes("light")) return "lightbulb-outline";
  if (value.includes("security") || value.includes("lock")) return "lock-outline";
  if (value.includes("vent") || value.includes("fan")) return "fan";
  return "tools";
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isThisWeek(value: string) {
  const date = safeDate(value);
  if (!date) return false;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function isThisMonth(value: string) {
  const date = safeDate(value);
  if (!date) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function CompletedJobsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>("All");
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [meResponse, jobsResponse] = await Promise.all([
        api.get("/auth/me", maintenanceRoleConfig),
        api.get("/property-workflows/maintenance-requests", maintenanceRoleConfig),
      ]);

      const me = meResponse.data as CurrentUser;
      setCurrentUser(me);
      const rows = Array.isArray(jobsResponse.data) ? jobsResponse.data : [];

      const mapped: CompletedJob[] = rows
        .filter((row: any) => row.status === "COMPLETED" && row.assignedProviderUserId === me.id)
        .map((row: any) => {
          const completedAt = row.tenantConfirmedAt || row.completedByProviderAt || row.updatedAt;
          const date = safeDate(completedAt) || new Date();
          return {
            id: row.id,
            title: row.title || "Maintenance job",
            category: row.category || "Maintenance",
            property: [row.property?.addressLine1, row.property?.townCity, row.property?.postcode]
              .filter(Boolean)
              .join(", ") || "Property details unavailable",
            tenant: [row.tenant?.firstName, row.tenant?.lastName].filter(Boolean).join(" ") || "Tenant",
            completionDateIso: date.toISOString(),
            completedDate: date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            completedTime: date.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            icon: categoryIcon(row.category),
            completionNotes: row.completionNotes || "No provider completion notes were recorded.",
            tenantCompletionNote: row.tenantCompletionNote || null,
            evidenceCount: Array.isArray(row.photos) ? row.photos.length : 0,
          };
        });

      setCompletedJobs(mapped);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      setLoadError(Array.isArray(message) ? message.join(", ") : message || "Unable to load completed maintenance jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredJobs = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();
    return completedJobs.filter((job) => {
      const matchesSearch =
        !cleanSearch ||
        job.id.toLowerCase().includes(cleanSearch) ||
        job.title.toLowerCase().includes(cleanSearch) ||
        job.category.toLowerCase().includes(cleanSearch) ||
        job.property.toLowerCase().includes(cleanSearch) ||
        job.tenant.toLowerCase().includes(cleanSearch);

      const matchesDate =
        selectedDateFilter === "All" ||
        (selectedDateFilter === "This week" && isThisWeek(job.completionDateIso)) ||
        (selectedDateFilter === "This month" && isThisMonth(job.completionDateIso));

      return matchesSearch && matchesDate;
    });
  }, [completedJobs, searchQuery, selectedDateFilter]);

  const completedThisWeek = completedJobs.filter((job) => isThisWeek(job.completionDateIso)).length;
  const completedThisMonth = completedJobs.filter((job) => isThisMonth(job.completionDateIso)).length;
  const evidencePhotos = completedJobs.reduce((total, job) => total + job.evidenceCount, 0);

  const providerName = currentUser
    ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") || currentUser.email
    : "Maintenance Provider";
  const providerInitials = currentUser
    ? `${currentUser.firstName?.charAt(0) || ""}${currentUser.lastName?.charAt(0) || ""}`.toUpperCase() || "MP"
    : "MP";

  return (
    <ScreenContainer scrollable contentStyle={styles.screenContent}>
      <View style={styles.page}>
        <Animated.View entering={FadeInUp.duration(450)} style={styles.header}>
          <Pressable style={styles.brandRow} onPress={() => router.replace("/maintenance/dashboard" as never)}>
            <View style={styles.brandLogo}>
              <MaterialCommunityIcons name="home-city-outline" size={27} color={colors.white} />
            </View>
            <View>
              <Text style={styles.brandName}>TENUREEX</Text>
              <Text style={styles.brandSubtitle}>Maintenance Provider</Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconButton} onPress={() => router.push("/maintenance/messages" as never)}>
              <MaterialCommunityIcons name="message-text-outline" size={21} color={colors.textPrimary} />
            </Pressable>

            <Pressable style={styles.profileButton} onPress={() => router.push("/maintenance/settings" as never)}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{providerInitials}</Text>
              </View>
              {isTablet ? (
                <View>
                  <Text style={styles.profileName}>{providerName}</Text>
                  <Text style={styles.profileRole}>Provider account</Text>
                </View>
              ) : null}
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.backRow}>
          <Pressable style={styles.backButton} onPress={() => router.replace("/maintenance/dashboard" as never)}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.primary} />
            <Text style={styles.backText}>Dashboard</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={[styles.pageHeading, isDesktop && styles.desktopPageHeading]}>
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>MAINTENANCE HISTORY</Text>
            <Text style={[styles.pageTitle, isSmallPhone && styles.smallPageTitle]}>Completed jobs</Text>
            <Text style={styles.pageDescription}>
              Review maintenance work that has been completed by you and confirmed through the TenureEx workflow.
            </Text>
          </View>

          <Button
            mode="outlined"
            icon="clipboard-text-outline"
            onPress={() => router.push("/maintenance/assigned-jobs" as never)}
            textColor={colors.primary}
            style={styles.activeJobsButton}
          >
            Active jobs
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(170).duration(450)}
          style={[
            styles.summaryGrid,
            isDesktop ? styles.desktopSummaryGrid : isTablet ? styles.tabletSummaryGrid : styles.mobileSummaryGrid,
          ]}
        >
          <SummaryCard icon="check-decagram-outline" label="Total completed" value={String(completedJobs.length)} description="Confirmed jobs" />
          <SummaryCard icon="calendar-week-outline" label="This week" value={String(completedThisWeek)} description="Confirmed this week" />
          <SummaryCard icon="calendar-month-outline" label="This month" value={String(completedThisMonth)} description="Confirmed this month" />
          <SummaryCard icon="camera-outline" label="Evidence photos" value={String(evidencePhotos)} description="Stored with completed jobs" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(450)} style={styles.jobsContainer}>
          <View style={[styles.searchSection, isDesktop && styles.desktopSearchSection]}>
            <Searchbar
              placeholder="Search completed jobs"
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon="magnify"
              style={styles.searchbar}
              inputStyle={styles.searchInput}
            />
            <View style={styles.filterRow}>
              {dateFilters.map((filter) => (
                <Chip
                  key={filter}
                  selected={selectedDateFilter === filter}
                  onPress={() => setSelectedDateFilter(filter)}
                  showSelectedCheck={false}
                  style={[styles.filterChip, selectedDateFilter === filter && styles.selectedFilterChip]}
                  textStyle={[styles.filterChipText, selectedDateFilter === filter && styles.selectedFilterChipText]}
                >
                  {filter}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>Completion history</Text>
              <Text style={styles.listDescription}>{filteredJobs.length} completed {filteredJobs.length === 1 ? "job" : "jobs"} found</Text>
            </View>
            <Button mode="text" icon="refresh" onPress={() => void load()} textColor={colors.primary}>Refresh</Button>
          </View>

          <Divider style={styles.divider} />

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyTitle}>Loading completed jobs…</Text>
            </View>
          ) : loadError ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.textMuted} /></View>
              <Text style={styles.emptyTitle}>Unable to load completed jobs</Text>
              <Text style={styles.emptyDescription}>{loadError}</Text>
              <Button mode="outlined" onPress={() => void load()} textColor={colors.primary} style={styles.clearButton}>Retry</Button>
            </View>
          ) : filteredJobs.length > 0 ? (
            <View style={styles.jobList}>
              {filteredJobs.map((job) => <CompletedJobCard key={job.id} job={job} isDesktop={isDesktop} />)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><MaterialCommunityIcons name="clipboard-check-outline" size={40} color={colors.textMuted} /></View>
              <Text style={styles.emptyTitle}>No completed jobs found</Text>
              <Text style={styles.emptyDescription}>There are no completed jobs matching the current search and date filter.</Text>
              <Button mode="outlined" onPress={() => { setSearchQuery(""); setSelectedDateFilter("All"); }} textColor={colors.primary} style={styles.clearButton}>Clear filters</Button>
            </View>
          )}
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

function SummaryCard({ icon, label, value, description }: { icon: IconName; label: string; value: string; description: string }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}><MaterialCommunityIcons name={icon} size={22} color={colors.primary} /></View>
      <View style={styles.flex}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryDescription}>{description}</Text>
      </View>
    </View>
  );
}

function CompletedJobCard({ job, isDesktop }: { job: CompletedJob; isDesktop: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.jobCard, pressed && styles.jobCardPressed]}
      onPress={() => router.push({ pathname: "/maintenance/job-details" as never, params: { jobId: job.id } })}
    >
      <View style={styles.jobIcon}><MaterialCommunityIcons name={job.icon} size={25} color={colors.primary} /></View>
      <View style={styles.jobMain}>
        <View style={[styles.jobTopRow, !isDesktop && styles.mobileJobTopRow]}>
          <View style={styles.jobTitleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.completedBadge}>
                <MaterialCommunityIcons name="check" size={13} color="#277A46" />
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>
            <Text style={styles.jobReference}>{job.id} · {job.category}</Text>
          </View>
          <View style={styles.costBadge}><Text style={styles.costText}>{job.evidenceCount} photo{job.evidenceCount === 1 ? "" : "s"}</Text></View>
        </View>

        <View style={[styles.detailsGrid, isDesktop && styles.desktopDetailsGrid]}>
          <JobInformation icon="map-marker-outline" label="Property" value={job.property} />
          <JobInformation icon="account-outline" label="Tenant" value={job.tenant} />
          <JobInformation icon="calendar-check-outline" label="Completed" value={`${job.completedDate}, ${job.completedTime}`} />
          <JobInformation icon="camera-outline" label="Evidence" value={`${job.evidenceCount} stored photo${job.evidenceCount === 1 ? "" : "s"}`} />
        </View>

        <View style={styles.notesBox}>
          <MaterialCommunityIcons name="note-text-outline" size={19} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.notesLabel}>Provider completion notes</Text>
            <Text style={styles.notesText} numberOfLines={3}>{job.completionNotes}</Text>
            {job.tenantCompletionNote ? <Text style={styles.notesText}>Tenant confirmation: {job.tenantCompletionNote}</Text> : null}
          </View>
        </View>

        <View style={styles.jobFooter}>
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="account-check-outline" size={16} color={colors.primary} />
            <Text style={styles.ratingText}>Tenant confirmed completion</Text>
          </View>
          <View style={styles.viewJobRow}><Text style={styles.viewJobText}>View job record</Text><MaterialCommunityIcons name="arrow-right" size={17} color={colors.primary} /></View>
        </View>
      </View>
    </Pressable>
  );
}

function JobInformation({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.jobInformation}>
      <MaterialCommunityIcons name={icon} size={17} color={colors.textMuted} />
      <View style={styles.flex}>
        <Text style={styles.informationLabel}>{label}</Text>
        <Text style={styles.informationValue} numberOfLines={2}>{value}</Text>
      </View>
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

  activeJobsButton: {
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
    minWidth: 210,
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
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  summaryValue: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: "900",
  },

  summaryLabel: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  summaryDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
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

  titleRow: {
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

  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#E8F7EE",
  },

  completedBadgeText: {
    color: "#277A46",
    fontSize: 8,
    fontWeight: "900",
  },

  costBadge: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },

  costText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  detailsGrid: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  desktopDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  jobInformation: {
    flex: 1,
    minWidth: 180,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
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

  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  notesLabel: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  notesText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  jobFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  ratingText: {
    color: colors.textSecondary,
    fontSize: 8,
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