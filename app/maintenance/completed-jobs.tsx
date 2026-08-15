import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
    typography,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type CompletedJob = {
  id: string;
  title: string;
  category: string;
  property: string;
  tenant: string;
  completedDate: string;
  completedTime: string;
  duration: string;
  rating: number;
  cost: string;
  icon: IconName;
  completionNotes: string;
};

const completedJobs: CompletedJob[] = [
  {
    id: "JOB-1029",
    title: "Replace leaking bathroom tap",
    category: "Plumbing",
    property: "11 Victoria Street, Leeds",
    tenant: "Emily Roberts",
    completedDate: "29 July 2026",
    completedTime: "3:20 PM",
    duration: "1 hr 15 min",
    rating: 5,
    cost: "£85.00",
    icon: "faucet",
    completionNotes:
      "Replaced the damaged tap cartridge and tested the water supply. No further leak was found.",
  },
  {
    id: "JOB-1027",
    title: "Repair kitchen cabinet hinge",
    category: "Carpentry",
    property: "20 Queen Road, Bradford",
    tenant: "William Harris",
    completedDate: "28 July 2026",
    completedTime: "11:45 AM",
    duration: "45 min",
    rating: 5,
    cost: "£55.00",
    icon: "hammer-screwdriver",
    completionNotes:
      "Removed the damaged hinge, installed a replacement and aligned the cabinet door.",
  },
  {
    id: "JOB-1022",
    title: "Restore hot water supply",
    category: "Heating",
    property: "8 Church Lane, Leeds",
    tenant: "Grace Turner",
    completedDate: "26 July 2026",
    completedTime: "4:10 PM",
    duration: "2 hrs",
    rating: 4,
    cost: "£145.00",
    icon: "water-boiler",
    completionNotes:
      "Repressurised the boiler and replaced a faulty pressure sensor. Hot water was restored.",
  },
  {
    id: "JOB-1018",
    title: "Replace hallway light fitting",
    category: "Electrical",
    property: "67 Wood Street, Leeds",
    tenant: "Thomas Evans",
    completedDate: "24 July 2026",
    completedTime: "10:30 AM",
    duration: "1 hr",
    rating: 5,
    cost: "£78.00",
    icon: "lightbulb-on-outline",
    completionNotes:
      "Removed the damaged fitting, installed the replacement and completed electrical safety checks.",
  },
  {
    id: "JOB-1015",
    title: "Unblock kitchen waste pipe",
    category: "Plumbing",
    property: "31 Bridge Avenue, Bradford",
    tenant: "Isla Morgan",
    completedDate: "22 July 2026",
    completedTime: "1:50 PM",
    duration: "1 hr 30 min",
    rating: 4,
    cost: "£95.00",
    icon: "pipe",
    completionNotes:
      "Cleared the blockage, cleaned the waste trap and tested drainage from the kitchen sink.",
  },
];

const dateFilters = [
  "All",
  "This week",
  "This month",
] as const;

type DateFilter = (typeof dateFilters)[number];

export default function CompletedJobsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<DateFilter>("All");

  const filteredJobs = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    return completedJobs.filter((job, index) => {
      const matchesSearch =
        !cleanSearch ||
        job.id.toLowerCase().includes(cleanSearch) ||
        job.title.toLowerCase().includes(cleanSearch) ||
        job.category.toLowerCase().includes(cleanSearch) ||
        job.property.toLowerCase().includes(cleanSearch) ||
        job.tenant.toLowerCase().includes(cleanSearch);

      const matchesDate =
        selectedDateFilter === "All" ||
        (selectedDateFilter === "This week" &&
          index < 3) ||
        selectedDateFilter === "This month";

      return matchesSearch && matchesDate;
    });
  }, [searchQuery, selectedDateFilter]);

  const totalEarnings = completedJobs.reduce(
    (total, job) =>
      total +
      Number(
        job.cost.replace("£", "").replace(",", "")
      ),
    0
  );

  const averageRating =
    completedJobs.reduce(
      (total, job) => total + job.rating,
      0
    ) / completedJobs.length;

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
                  MP
                </Text>
              </View>

              {isTablet ? (
                <View>
                  <Text style={styles.profileName}>
                    Martin Plumbing
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
              MAINTENANCE HISTORY
            </Text>

            <Text
              style={[
                styles.pageTitle,
                isSmallPhone && styles.smallPageTitle,
              ]}
            >
              Completed jobs
            </Text>

            <Text style={styles.pageDescription}>
              Review completed maintenance work, provider
              notes, customer ratings and payment totals.
            </Text>
          </View>

          <Button
            mode="outlined"
            icon="clipboard-text-outline"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never
              )
            }
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
            isDesktop
              ? styles.desktopSummaryGrid
              : isTablet
                ? styles.tabletSummaryGrid
                : styles.mobileSummaryGrid,
          ]}
        >
          <SummaryCard
            icon="check-decagram-outline"
            label="Jobs completed"
            value={completedJobs.length.toString()}
            description="This month"
          />

          <SummaryCard
            icon="star-outline"
            label="Average rating"
            value={averageRating.toFixed(1)}
            description="Out of 5"
          />

          <SummaryCard
            icon="clock-check-outline"
            label="On-time rate"
            value="94%"
            description="Monthly performance"
          />

          <SummaryCard
            icon="cash-multiple"
            label="Total value"
            value={`£${totalEarnings.toFixed(0)}`}
            description="Completed jobs"
          />
        </Animated.View>

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
                  selected={
                    selectedDateFilter === filter
                  }
                  onPress={() =>
                    setSelectedDateFilter(filter)
                  }
                  showSelectedCheck={false}
                  style={[
                    styles.filterChip,
                    selectedDateFilter === filter &&
                      styles.selectedFilterChip,
                  ]}
                  textStyle={[
                    styles.filterChipText,
                    selectedDateFilter === filter &&
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
                Completion history
              </Text>

              <Text style={styles.listDescription}>
                {filteredJobs.length} completed{" "}
                {filteredJobs.length === 1
                  ? "job"
                  : "jobs"}{" "}
                found
              </Text>
            </View>

            <Button
              mode="text"
              icon="download-outline"
              onPress={() => {}}
              textColor={colors.primary}
            >
              Export
            </Button>
          </View>

          <Divider style={styles.divider} />

          {filteredJobs.length > 0 ? (
            <View style={styles.jobList}>
              {filteredJobs.map((job) => (
                <CompletedJobCard
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
                  name="clipboard-check-outline"
                  size={40}
                  color={colors.textMuted}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No completed jobs found
              </Text>

              <Text style={styles.emptyDescription}>
                Try changing the selected date filter or
                search phrase.
              </Text>

              <Button
                mode="outlined"
                onPress={() => {
                  setSearchQuery("");
                  setSelectedDateFilter("All");
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

function SummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon: IconName;
  label: string;
  value: string;
  description: string;
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

      <View style={styles.flex}>
        <Text style={styles.summaryValue}>
          {value}
        </Text>

        <Text style={styles.summaryLabel}>
          {label}
        </Text>

        <Text style={styles.summaryDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function CompletedJobCard({
  job,
  isDesktop,
}: {
  job: CompletedJob;
  isDesktop: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.jobCard,
        pressed && styles.jobCardPressed,
      ]}
      onPress={() =>
        router.push({
          pathname:
            "/maintenance/job-details" as never,
          params: {
            jobId: job.id,
          },
        })
      }
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
            <View style={styles.titleRow}>
              <Text style={styles.jobTitle}>
                {job.title}
              </Text>

              <View style={styles.completedBadge}>
                <MaterialCommunityIcons
                  name="check"
                  size={13}
                  color="#277A46"
                />

                <Text
                  style={styles.completedBadgeText}
                >
                  Completed
                </Text>
              </View>
            </View>

            <Text style={styles.jobReference}>
              {job.id} · {job.category}
            </Text>
          </View>

          <View style={styles.costBadge}>
            <Text style={styles.costText}>
              {job.cost}
            </Text>
          </View>
        </View>

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
            icon="calendar-check-outline"
            label="Completed"
            value={`${job.completedDate}, ${job.completedTime}`}
          />

          <JobInformation
            icon="timer-outline"
            label="Duration"
            value={job.duration}
          />
        </View>

        <View style={styles.notesBox}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={19}
            color={colors.primary}
          />

          <View style={styles.flex}>
            <Text style={styles.notesLabel}>
              Completion notes
            </Text>

            <Text
              style={styles.notesText}
              numberOfLines={3}
            >
              {job.completionNotes}
            </Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <RatingStars rating={job.rating} />

          <View style={styles.viewJobRow}>
            <Text style={styles.viewJobText}>
              View job record
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

function RatingStars({
  rating,
}: {
  rating: number;
}) {
  return (
    <View style={styles.ratingRow}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={
              star <= rating
                ? "star"
                : "star-outline"
            }
            size={16}
            color="#D99A17"
          />
        ))}
      </View>

      <Text style={styles.ratingText}>
        {rating}.0 tenant rating
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