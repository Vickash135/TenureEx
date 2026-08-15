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
    Avatar,
    Badge,
    Button,
    Divider,
    Menu,
    ProgressBar,
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

type JobPriority = "Urgent" | "High" | "Normal";

type JobStatus =
  | "New"
  | "Accepted"
  | "Scheduled"
  | "In progress";

type MaintenanceJob = {
  id: string;
  title: string;
  property: string;
  tenant: string;
  date: string;
  time: string;
  priority: JobPriority;
  status: JobStatus;
  icon: IconName;
};

const jobs: MaintenanceJob[] = [
  {
    id: "JOB-1048",
    title: "Kitchen sink leaking",
    property: "18 Meadow Lane, Leeds",
    tenant: "Olivia Bennett",
    date: "Today",
    time: "10:30 AM",
    priority: "Urgent",
    status: "New",
    icon: "water-pump",
  },
  {
    id: "JOB-1045",
    title: "Boiler pressure issue",
    property: "42 Green Road, Leeds",
    tenant: "Daniel Hughes",
    date: "Today",
    time: "2:00 PM",
    priority: "High",
    status: "Scheduled",
    icon: "water-boiler",
  },
  {
    id: "JOB-1041",
    title: "Bedroom light not working",
    property: "7 Park View, Bradford",
    tenant: "Amelia Taylor",
    date: "Tomorrow",
    time: "9:00 AM",
    priority: "Normal",
    status: "Accepted",
    icon: "lightbulb-outline",
  },
  {
    id: "JOB-1038",
    title: "Bathroom extractor fan",
    property: "51 Station Road, Leeds",
    tenant: "Noah Wilson",
    date: "Tomorrow",
    time: "1:30 PM",
    priority: "Normal",
    status: "In progress",
    icon: "fan",
  },
];

export default function MaintenanceDashboardScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "All jobs" | "Urgent" | "Today"
  >("All jobs");

  const filteredJobs = useMemo(() => {
    if (selectedFilter === "Urgent") {
      return jobs.filter((job) => job.priority === "Urgent");
    }

    if (selectedFilter === "Today") {
      return jobs.filter((job) => job.date === "Today");
    }

    return jobs;
  }, [selectedFilter]);

  const handleLogout = () => {
    setMenuVisible(false);

    router.replace(
      "/auth/maintenance/login" as never
    );
  };

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
                size={28}
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
              style={styles.iconButton}
              onPress={() =>
                router.push(
                  "/maintenance/messages" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={22}
                color={colors.textPrimary}
              />

              <Badge style={styles.messageBadge}>
                3
              </Badge>
            </Pressable>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Pressable
                  style={styles.profileButton}
                  onPress={() =>
                    setMenuVisible(true)
                  }
                >
                  <Avatar.Text
                    size={42}
                    label="MP"
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />

                  {isTablet ? (
                    <View style={styles.profileText}>
                      <Text style={styles.profileName}>
                        Martin Plumbing
                      </Text>

                      <Text style={styles.profileRole}>
                        Maintenance Provider
                      </Text>
                    </View>
                  ) : null}

                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              }
            >
              <Menu.Item
                leadingIcon="account-outline"
                title="Provider profile"
                onPress={() => {
                  setMenuVisible(false);

                  router.push(
                    "/maintenance/settings" as never
                  );
                }}
              />

              <Menu.Item
                leadingIcon="cog-outline"
                title="Settings"
                onPress={() => {
                  setMenuVisible(false);

                  router.push(
                    "/maintenance/settings" as never
                  );
                }}
              />

              <Divider />

              <Menu.Item
                leadingIcon="logout"
                title="Sign out"
                onPress={handleLogout}
              />
            </Menu>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(450)}
          style={[
            styles.welcomeSection,
            isDesktop && styles.desktopWelcomeSection,
          ]}
        >
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.eyebrow}>
              MAINTENANCE DASHBOARD
            </Text>

            <Text
              style={[
                styles.welcomeTitle,
                isSmallPhone &&
                  styles.smallWelcomeTitle,
              ]}
            >
              Good morning, Martin
            </Text>

            <Text style={styles.welcomeDescription}>
              You have 4 active maintenance jobs and 2
              appointments scheduled for today.
            </Text>
          </View>

          <Button
            mode="contained"
            icon="clipboard-text-outline"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never
              )
            }
            buttonColor={colors.primary}
            contentStyle={styles.primaryButtonContent}
            labelStyle={styles.primaryButtonLabel}
            style={styles.viewJobsButton}
          >
            View assigned jobs
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(450)}
          style={[
            styles.statsGrid,
            isDesktop
              ? styles.desktopStatsGrid
              : isTablet
                ? styles.tabletStatsGrid
                : styles.mobileStatsGrid,
          ]}
        >
          <StatCard
            icon="clipboard-alert-outline"
            title="New jobs"
            value="3"
            description="Awaiting your response"
            actionLabel="Review jobs"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never
              )
            }
          />

          <StatCard
            icon="calendar-clock-outline"
            title="Today's visits"
            value="2"
            description="Next visit at 10:30 AM"
            actionLabel="View schedule"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never
              )
            }
          />

          <StatCard
            icon="progress-wrench"
            title="In progress"
            value="4"
            description="Jobs currently active"
            actionLabel="Update jobs"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never
              )
            }
          />

          <StatCard
            icon="check-decagram-outline"
            title="Completed"
            value="18"
            description="Completed this month"
            actionLabel="View history"
            onPress={() =>
              router.push(
                "/maintenance/completed-jobs" as never
              )
            }
          />
        </Animated.View>

        <View
          style={[
            styles.mainGrid,
            isDesktop && styles.desktopMainGrid,
          ]}
        >
          <Animated.View
            entering={FadeInDown.delay(220).duration(450)}
            style={styles.jobsCard}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Active maintenance jobs
                </Text>

                <Text style={styles.cardSubtitle}>
                  Review and manage your current work
                </Text>
              </View>

              <Pressable
                style={styles.headerLink}
                onPress={() =>
                  router.push(
                    "/maintenance/assigned-jobs" as never
                  )
                }
              >
                <Text style={styles.headerLinkText}>
                  View all
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={17}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            <View style={styles.filterRow}>
              {(["All jobs", "Urgent", "Today"] as const).map(
                (filter) => (
                  <Pressable
                    key={filter}
                    style={[
                      styles.filterButton,
                      selectedFilter === filter &&
                        styles.activeFilterButton,
                    ]}
                    onPress={() =>
                      setSelectedFilter(filter)
                    }
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedFilter === filter &&
                          styles.activeFilterButtonText,
                      ]}
                    >
                      {filter}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <View style={styles.jobList}>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job, index) => (
                  <View key={job.id}>
                    <JobCard job={job} />

                    {index <
                    filteredJobs.length - 1 ? (
                      <Divider
                        style={styles.jobDivider}
                      />
                    ) : null}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="clipboard-check-outline"
                    size={38}
                    color={colors.textMuted}
                  />

                  <Text style={styles.emptyTitle}>
                    No jobs found
                  </Text>

                  <Text style={styles.emptyDescription}>
                    There are no jobs matching this filter.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          <View style={styles.sideColumn}>
            <Animated.View
              entering={FadeInDown.delay(280).duration(450)}
              style={styles.sideCard}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    Today’s schedule
                  </Text>

                  <Text style={styles.cardSubtitle}>
                    Wednesday, 30 July
                  </Text>
                </View>

                <View style={styles.calendarIcon}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>
              </View>

              <View style={styles.scheduleList}>
                <ScheduleItem
                  time="10:30"
                  period="AM"
                  title="Kitchen sink leaking"
                  address="18 Meadow Lane, Leeds"
                  status="Next visit"
                  first
                />

                <ScheduleItem
                  time="2:00"
                  period="PM"
                  title="Boiler pressure issue"
                  address="42 Green Road, Leeds"
                  status="Scheduled"
                />
              </View>

              <Button
                mode="outlined"
                icon="calendar-month-outline"
                onPress={() =>
                  router.push(
                    "/maintenance/assigned-jobs" as never
                  )
                }
                textColor={colors.primary}
                style={styles.outlinedButton}
              >
                View full schedule
              </Button>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(340).duration(450)}
              style={styles.sideCard}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    Monthly performance
                  </Text>

                  <Text style={styles.cardSubtitle}>
                    July provider summary
                  </Text>
                </View>

                <View style={styles.performanceIcon}>
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={21}
                    color={colors.primary}
                  />
                </View>
              </View>

              <PerformanceRow
                label="Jobs completed"
                value="18"
                progress={0.82}
              />

              <PerformanceRow
                label="On-time completion"
                value="94%"
                progress={0.94}
              />

              <PerformanceRow
                label="Tenant satisfaction"
                value="4.8/5"
                progress={0.96}
              />

              <View style={styles.ratingRow}>
                <View style={styles.ratingIcon}>
                  <MaterialCommunityIcons
                    name="star"
                    size={22}
                    color="#D99A17"
                  />
                </View>

                <View style={styles.flex}>
                  <Text style={styles.ratingTitle}>
                    Excellent provider rating
                  </Text>

                  <Text style={styles.ratingDescription}>
                    Your recent work has received positive
                    tenant feedback.
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(450)}
              style={styles.quickActionsCard}
            >
              <Text style={styles.cardTitle}>
                Quick actions
              </Text>

              <Text style={styles.cardSubtitle}>
                Common maintenance tasks
              </Text>

              <View style={styles.quickActions}>
                <QuickAction
                  icon="clipboard-text-outline"
                  label="Assigned jobs"
                  onPress={() =>
                    router.push(
                      "/maintenance/assigned-jobs" as never
                    )
                  }
                />

                <QuickAction
                  icon="check-circle-outline"
                  label="Completed jobs"
                  onPress={() =>
                    router.push(
                      "/maintenance/completed-jobs" as never
                    )
                  }
                />

                <QuickAction
                  icon="message-text-outline"
                  label="Messages"
                  onPress={() =>
                    router.push(
                      "/maintenance/messages" as never
                    )
                  }
                />

                <QuickAction
                  icon="cog-outline"
                  label="Settings"
                  onPress={() =>
                    router.push(
                      "/maintenance/settings" as never
                    )
                  }
                />
              </View>
            </Animated.View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
  actionLabel,
  onPress,
}: {
  icon: IconName;
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statCard,
        pressed && styles.pressedCard,
      ]}
      onPress={onPress}
    >
      <View style={styles.statTopRow}>
        <View style={styles.statIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={colors.primary}
          />
        </View>

        <MaterialCommunityIcons
          name="arrow-top-right"
          size={18}
          color={colors.textMuted}
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statTitle}>
        {title}
      </Text>

      <Text style={styles.statDescription}>
        {description}
      </Text>

      <Text style={styles.statAction}>
        {actionLabel}
      </Text>
    </Pressable>
  );
}

function JobCard({
  job,
}: {
  job: MaintenanceJob;
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
          size={23}
          color={colors.primary}
        />
      </View>

      <View style={styles.jobContent}>
        <View style={styles.jobTitleRow}>
          <View style={styles.flex}>
            <Text style={styles.jobTitle}>
              {job.title}
            </Text>

            <Text style={styles.jobId}>
              {job.id}
            </Text>
          </View>

          <StatusBadge
            status={job.status}
          />
        </View>

        <View style={styles.jobDetails}>
          <JobDetail
            icon="map-marker-outline"
            text={job.property}
          />

          <JobDetail
            icon="account-outline"
            text={job.tenant}
          />

          <JobDetail
            icon="calendar-clock-outline"
            text={`${job.date}, ${job.time}`}
          />
        </View>

        <View style={styles.jobFooter}>
          <PriorityBadge
            priority={job.priority}
          />

          <View style={styles.viewJobLink}>
            <Text style={styles.viewJobText}>
              View job
            </Text>

            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.primary}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function JobDetail({
  icon,
  text,
}: {
  icon: IconName;
  text: string;
}) {
  return (
    <View style={styles.jobDetail}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={colors.textMuted}
      />

      <Text
        style={styles.jobDetailText}
        numberOfLines={1}
      >
        {text}
      </Text>
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
        ? "#F2EDFF"
        : status === "In progress"
          ? "#FFF4DC"
          : "#EAF7EF";

  const textColor =
    status === "New"
      ? "#2356A8"
      : status === "Scheduled"
        ? "#6842B8"
        : status === "In progress"
          ? "#986500"
          : "#287A45";

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          { color: textColor },
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
        ? "#FFF4DC"
        : colors.background;

  const textColor =
    priority === "Urgent"
      ? "#B42318"
      : priority === "High"
        ? "#986500"
        : colors.textSecondary;

  return (
    <View
      style={[
        styles.priorityBadge,
        { backgroundColor },
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
          { color: textColor },
        ]}
      >
        {priority} priority
      </Text>
    </View>
  );
}

function ScheduleItem({
  time,
  period,
  title,
  address,
  status,
  first = false,
}: {
  time: string;
  period: string;
  title: string;
  address: string;
  status: string;
  first?: boolean;
}) {
  return (
    <View style={styles.scheduleItem}>
      <View style={styles.scheduleTime}>
        <Text style={styles.scheduleTimeText}>
          {time}
        </Text>

        <Text style={styles.schedulePeriod}>
          {period}
        </Text>
      </View>

      <View
        style={[
          styles.scheduleLine,
          first &&
            styles.activeScheduleLine,
        ]}
      />

      <View style={styles.scheduleContent}>
        <View style={styles.scheduleTopRow}>
          <Text style={styles.scheduleTitle}>
            {title}
          </Text>

          <Text
            style={[
              styles.scheduleStatus,
              first &&
                styles.activeScheduleStatus,
            ]}
          >
            {status}
          </Text>
        </View>

        <Text style={styles.scheduleAddress}>
          {address}
        </Text>
      </View>
    </View>
  );
}

function PerformanceRow({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <View style={styles.performanceRow}>
      <View style={styles.performanceHeader}>
        <Text style={styles.performanceLabel}>
          {label}
        </Text>

        <Text style={styles.performanceValue}>
          {value}
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={colors.primary}
        style={styles.progressBar}
      />
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.quickActionPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <Text style={styles.quickActionLabel}>
        {label}
      </Text>

      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
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
    marginBottom: spacing.xl,
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

  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  messageBadge: {
    position: "absolute",
    top: 4,
    right: 3,
    backgroundColor: colors.primary,
  },

  profileButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },

  avatar: {
    backgroundColor: colors.primaryLight,
  },

  avatarLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  profileText: {
    maxWidth: 170,
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
  },

  welcomeSection: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  desktopWelcomeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  welcomeTextContainer: {
    flex: 1,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  welcomeTitle: {
    ...typography.headingMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },

  smallWelcomeTitle: {
    fontSize: 25,
    lineHeight: 31,
  },

  welcomeDescription: {
    ...typography.bodyMedium,
    maxWidth: 700,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  viewJobsButton: {
    borderRadius: radius.md,
  },

  primaryButtonContent: {
    minHeight: 50,
    flexDirection: "row-reverse",
  },

  primaryButtonLabel: {
    fontSize: 11,
    fontWeight: "900",
  },

  statsGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  desktopStatsGrid: {
    flexDirection: "row",
  },

  tabletStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  mobileStatsGrid: {
    flexDirection: "column",
  },

  statCard: {
    flex: 1,
    minWidth: 220,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  pressedCard: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  statValue: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
  },

  statTitle: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  statDescription: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  statAction: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  mainGrid: {
    gap: spacing.xl,
  },

  desktopMainGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  jobsCard: {
    flex: 1.65,
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

  sideColumn: {
    flex: 0.85,
    gap: spacing.xl,
  },

  sideCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  cardSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  headerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
  },

  headerLinkText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.white,
  },

  activeFilterButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  filterButtonText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  activeFilterButtonText: {
    color: colors.white,
  },

  jobList: {
    marginTop: spacing.sm,
  },

  jobCard: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },

  jobCardPressed: {
    opacity: 0.72,
  },

  jobIcon: {
    width: 49,
    height: 49,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  jobContent: {
    flex: 1,
    minWidth: 0,
  },

  jobTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  jobTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  jobId: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  jobDetails: {
    gap: 6,
    marginTop: spacing.md,
  },

  jobDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  jobDetailText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
  },

  jobFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  priorityText: {
    fontSize: 8,
    fontWeight: "900",
  },

  viewJobLink: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewJobText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  jobDivider: {
    backgroundColor: colors.border,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
  },

  emptyTitle: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  emptyDescription: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: "center",
  },

  calendarIcon: {
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  scheduleList: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },

  scheduleItem: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },

  scheduleTime: {
    width: 45,
    alignItems: "flex-end",
  },

  scheduleTimeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  schedulePeriod: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  scheduleLine: {
    width: 3,
    borderRadius: 3,
    backgroundColor: colors.border,
  },

  activeScheduleLine: {
    backgroundColor: colors.primary,
  },

  scheduleContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },

  scheduleTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  scheduleTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  scheduleStatus: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
  },

  activeScheduleStatus: {
    color: colors.primary,
  },

  scheduleAddress: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  outlinedButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  performanceIcon: {
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  performanceRow: {
    marginTop: spacing.lg,
  },

  performanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  performanceLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  performanceValue: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  progressBar: {
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.primaryLight,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#FFF8E8",
  },

  ratingIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#FFEDBC",
  },

  ratingTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  ratingDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  quickActionsCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 2,
  },

  quickActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  quickAction: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  quickActionPressed: {
    opacity: 0.72,
  },

  quickActionIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  quickActionLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },
});