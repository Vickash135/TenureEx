import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Badge,
  Button,
  Divider,
  Menu,
} from "react-native-paper";

import {
  api,
  clearAuthSession,
} from "../../src/api/client";
import ScreenContainer from "../../src/components/ScreenContainer";
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

type PropertyRow = {
  id: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  townCity?: string | null;
  county?: string | null;
  postcode?: string | null;
};

type MaintenanceSlot = {
  id: string;
  proposedBy: string;
  providerUserId?: string | null;
  startAt: string;
  endAt: string;
  status: string;
};

type MaintenancePhoto = {
  id: string;
  phase: string;
  url?: string | null;
};

type MaintenanceRequest = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  title: string;
  description: string;
  category: string;
  roomLocation?: string | null;
  priority: string;
  status: string;
  assignedProviderUserId?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  completedByProviderAt?: string | null;
  tenantConfirmedAt?: string | null;
  reopenedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: PropertyRow | null;
  slots?: MaintenanceSlot[];
  photos?: MaintenancePhoto[];
};

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type DashboardFilter =
  | "All active"
  | "Available"
  | "Scheduled"
  | "In progress";

const maintenanceRoleConfig = {
  _tenureExRole: "maintenance",
} as any;

const activeStatuses = new Set([
  "OPEN",
  "REOPENED",
  "SCHEDULED",
  "IN_PROGRESS",
  "AWAITING_TENANT_CONFIRMATION",
]);

const assignedActiveStatuses = new Set([
  "SCHEDULED",
  "IN_PROGRESS",
  "AWAITING_TENANT_CONFIRMATION",
]);

function normaliseRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function isSameLocalDay(
  left: Date,
  right: Date,
) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isThisMonth(value?: string | null) {
  const date = safeDate(value);

  if (!date) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function formatPropertyAddress(
  property?: PropertyRow | null,
) {
  if (!property) {
    return "Property details unavailable";
  }

  return [
    property.addressLine1,
    property.addressLine2,
    property.townCity,
    property.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatDateTime(
  value?: string | null,
) {
  const date = safeDate(value);

  if (!date) {
    return "Not scheduled";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(
  value?: string | null,
) {
  const date = safeDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(
  value?: string | null,
) {
  const date = safeDate(value);

  if (!date) {
    return "";
  }

  const now = new Date();

  if (isSameLocalDay(date, now)) {
    return "Today";
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (isSameLocalDay(date, tomorrow)) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatRelativeTime(
  value?: string | null,
) {
  const date = safeDate(value);

  if (!date) return "";

  const diffMs =
    Date.now() - date.getTime();

  const minutes =
    Math.max(
      0,
      Math.floor(diffMs / 60000),
    );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Available";
    case "REOPENED":
      return "Reopened";
    case "SCHEDULED":
      return "Scheduled";
    case "IN_PROGRESS":
      return "In progress";
    case "AWAITING_TENANT_CONFIRMATION":
      return "Awaiting tenant";
    case "COMPLETED":
      return "Completed";
    default:
      return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        );
  }
}

function getPriorityLabel(priority: string) {
  switch (priority.toUpperCase()) {
    case "EMERGENCY":
      return "Emergency";
    case "HIGH":
      return "High";
    case "LOW":
      return "Low";
    default:
      return "Medium";
  }
}

function getCategoryIcon(
  category?: string | null,
): IconName {
  const value =
    category?.toLowerCase() ?? "";

  if (
    value.includes("plumb") ||
    value.includes("water") ||
    value.includes("leak")
  ) {
    return "water-pump";
  }

  if (
    value.includes("electric") ||
    value.includes("light")
  ) {
    return "lightning-bolt-outline";
  }

  if (
    value.includes("heat") ||
    value.includes("boiler")
  ) {
    return "radiator";
  }

  if (
    value.includes("lock") ||
    value.includes("door")
  ) {
    return "door";
  }

  if (
    value.includes("appliance")
  ) {
    return "washing-machine";
  }

  return "tools";
}

function getStatusColours(status: string) {
  switch (status) {
    case "OPEN":
      return {
        background: "#E8F3FF",
        text: "#245A9A",
      };
    case "REOPENED":
      return {
        background: "#FDECEC",
        text: "#B42318",
      };
    case "SCHEDULED":
      return {
        background: "#F2EDFF",
        text: "#6842B8",
      };
    case "IN_PROGRESS":
      return {
        background: "#FFF4DC",
        text: "#986500",
      };
    case "AWAITING_TENANT_CONFIRMATION":
      return {
        background: "#EAF7EF",
        text: "#287A45",
      };
    case "COMPLETED":
      return {
        background: "#EAF7EF",
        text: "#287A45",
      };
    default:
      return {
        background: colors.background,
        text: colors.textSecondary,
      };
  }
}

function getPriorityColours(priority: string) {
  switch (priority.toUpperCase()) {
    case "EMERGENCY":
      return {
        background: "#FDECEC",
        text: "#B42318",
      };
    case "HIGH":
      return {
        background: "#FFF4DC",
        text: "#986500",
      };
    case "LOW":
      return {
        background: "#EEF5F7",
        text: colors.textSecondary,
      };
    default:
      return {
        background: colors.background,
        text: colors.textSecondary,
      };
  }
}

export default function MaintenanceDashboardScreen() {
  const { width } =
    useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [
    menuVisible,
    setMenuVisible,
  ] = useState(false);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<DashboardFilter>(
    "All active",
  );

  const [
    currentUser,
    setCurrentUser,
  ] = useState<CurrentUser | null>(
    null,
  );

  const [
    requests,
    setRequests,
  ] = useState<MaintenanceRequest[]>(
    [],
  );

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationRow[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadDashboard =
    useCallback(
      async (
        quiet = false,
      ) => {
        if (quiet) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        try {
          const [
            meResponse,
            jobsResponse,
            notificationsResponse,
          ] = await Promise.all([
            api.get(
              "/auth/me",
              maintenanceRoleConfig,
            ),
            api.get(
              "/property-workflows/maintenance-requests",
              maintenanceRoleConfig,
            ),
            api.get(
              "/property-workflows/notifications",
              maintenanceRoleConfig,
            ),
          ]);

          setCurrentUser(
            meResponse.data as CurrentUser,
          );

          setRequests(
            normaliseRows<MaintenanceRequest>(
              jobsResponse.data,
            ),
          );

          setNotifications(
            normaliseRows<NotificationRow>(
              notificationsResponse.data,
            ),
          );
        } catch (error: any) {
          const message =
            error?.response?.data?.message;

          setErrorMessage(
            Array.isArray(message)
              ? message.join("\n")
              : typeof message === "string"
                ? message
                : "Unable to load the maintenance dashboard.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();

      return undefined;
    }, [loadDashboard]),
  );

  const providerId =
    currentUser?.id ?? "";

  const availableJobs =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            (request.status ===
              "OPEN" ||
              request.status ===
                "REOPENED") &&
            !request.assignedProviderUserId,
        ),
      [requests],
    );

  const assignedJobs =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.assignedProviderUserId ===
            providerId,
        ),
      [providerId, requests],
    );

  const assignedActiveJobs =
    useMemo(
      () =>
        assignedJobs.filter((request) =>
          assignedActiveStatuses.has(
            request.status,
          ),
        ),
      [assignedJobs],
    );

  const inProgressJobs =
    useMemo(
      () =>
        assignedJobs.filter(
          (request) =>
            request.status ===
            "IN_PROGRESS",
        ),
      [assignedJobs],
    );

  const awaitingTenantJobs =
    useMemo(
      () =>
        assignedJobs.filter(
          (request) =>
            request.status ===
            "AWAITING_TENANT_CONFIRMATION",
        ),
      [assignedJobs],
    );

  const completedThisMonth =
    useMemo(
      () =>
        assignedJobs.filter(
          (request) =>
            request.status ===
              "COMPLETED" &&
            isThisMonth(
              request.tenantConfirmedAt ??
                request.updatedAt,
            ),
        ),
      [assignedJobs],
    );

  const todaysVisits =
    useMemo(() => {
      const today = new Date();

      return assignedJobs
        .filter((request) => {
          if (
            request.status !==
              "SCHEDULED" &&
            request.status !==
              "IN_PROGRESS"
          ) {
            return false;
          }

          const scheduled =
            safeDate(
              request.scheduledStart,
            );

          return Boolean(
            scheduled &&
              isSameLocalDay(
                scheduled,
                today,
              ),
          );
        })
        .sort((left, right) => {
          const leftDate =
            safeDate(
              left.scheduledStart,
            )?.getTime() ?? 0;

          const rightDate =
            safeDate(
              right.scheduledStart,
            )?.getTime() ?? 0;

          return leftDate - rightDate;
        });
    }, [assignedJobs]);

  const activeJobs =
    useMemo(() => {
      const rows =
        requests.filter(
          (request) =>
            activeStatuses.has(
              request.status,
            ) &&
            (request.assignedProviderUserId ===
              providerId ||
              !request.assignedProviderUserId),
        );

      return rows.sort(
        (left, right) => {
          const leftTime =
            safeDate(
              left.scheduledStart ??
                left.createdAt,
            )?.getTime() ?? 0;

          const rightTime =
            safeDate(
              right.scheduledStart ??
                right.createdAt,
            )?.getTime() ?? 0;

          return rightTime - leftTime;
        },
      );
    }, [providerId, requests]);

  const filteredJobs =
    useMemo(() => {
      switch (selectedFilter) {
        case "Available":
          return activeJobs.filter(
            (request) =>
              request.status ===
                "OPEN" ||
              request.status ===
                "REOPENED",
          );

        case "Scheduled":
          return activeJobs.filter(
            (request) =>
              request.status ===
                "SCHEDULED",
          );

        case "In progress":
          return activeJobs.filter(
            (request) =>
              request.status ===
                "IN_PROGRESS",
          );

        default:
          return activeJobs;
      }
    }, [
      activeJobs,
      selectedFilter,
    ]);

  const unreadNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.readAt,
        ),
      [notifications],
    );

  const recentNotifications =
    useMemo(
      () =>
        notifications.slice(0, 5),
      [notifications],
    );

  const providerName =
    currentUser
      ? [
          currentUser.firstName,
          currentUser.lastName,
        ]
          .filter(Boolean)
          .join(" ")
      : "Maintenance Provider";

  const providerInitials =
    currentUser
      ? `${currentUser.firstName?.charAt(0) ?? ""}${currentUser.lastName?.charAt(0) ?? ""}`.toUpperCase() ||
        "MP"
      : "MP";

  const nextVisit =
    todaysVisits[0] ?? null;

  const handleLogout =
    async () => {
      setMenuVisible(false);

      await clearAuthSession(
        "maintenance",
      );

      router.replace(
        "/auth/maintenance/login" as never,
      );
    };

  const openJob = (
    requestId: string,
  ) => {
    router.push({
      pathname:
        "/maintenance/job-details" as never,
      params: {
        jobId: requestId,
      },
    });
  };

  const openNotification =
    async (
      notification: NotificationRow,
    ) => {
      if (!notification.readAt) {
        try {
          await api.patch(
            `/property-workflows/notifications/${notification.id}/read`,
            {},
            maintenanceRoleConfig,
          );

          setNotifications(
            (current) =>
              current.map((row) =>
                row.id ===
                notification.id
                  ? {
                      ...row,
                      readAt:
                        new Date().toISOString(),
                    }
                  : row,
              ),
          );
        } catch {
          // Opening the related job should still work
          // even if marking the notification read fails.
        }
      }

      if (
        notification.entityType ===
          "MaintenanceRequest" &&
        notification.entityId
      ) {
        openJob(
          notification.entityId,
        );
      }
    };

  if (loading) {
    return (
      <ScreenContainer
        contentStyle={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
        <Text style={styles.loadingText}>
          Loading your maintenance work...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollable
      contentStyle={
        styles.screenContent
      }
    >
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            style={styles.brandRow}
            onPress={() =>
              router.replace(
                "/maintenance/dashboard" as never,
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

              <Text
                style={
                  styles.brandSubtitle
                }
              >
                Maintenance Provider
              </Text>
            </View>
          </Pressable>

          <View
            style={styles.headerActions}
          >
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                void loadDashboard(true)
              }
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator
                  size={18}
                  color={colors.primary}
                />
              ) : (
                <MaterialCommunityIcons
                  name="refresh"
                  size={22}
                  color={
                    colors.textPrimary
                  }
                />
              )}
            </Pressable>

            <View
              style={
                styles.notificationButton
              }
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={22}
                color={
                  colors.textPrimary
                }
              />

              {unreadNotifications.length >
              0 ? (
                <Badge
                  style={
                    styles.notificationBadge
                  }
                >
                  {unreadNotifications.length >
                  99
                    ? "99+"
                    : unreadNotifications.length}
                </Badge>
              ) : null}
            </View>

            <Menu
              visible={menuVisible}
              onDismiss={() =>
                setMenuVisible(false)
              }
              anchor={
                <Pressable
                  style={
                    styles.profileButton
                  }
                  onPress={() =>
                    setMenuVisible(true)
                  }
                >
                  <Avatar.Text
                    size={42}
                    label={providerInitials}
                    style={styles.avatar}
                    labelStyle={
                      styles.avatarLabel
                    }
                  />

                  {isTablet ? (
                    <View
                      style={
                        styles.profileText
                      }
                    >
                      <Text
                        style={
                          styles.profileName
                        }
                        numberOfLines={1}
                      >
                        {providerName}
                      </Text>

                      <Text
                        style={
                          styles.profileRole
                        }
                      >
                        Maintenance Provider
                      </Text>
                    </View>
                  ) : null}

                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={
                      colors.textSecondary
                    }
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
                    "/maintenance/settings" as never,
                  );
                }}
              />

              <Menu.Item
                leadingIcon="cog-outline"
                title="Settings"
                onPress={() => {
                  setMenuVisible(false);
                  router.push(
                    "/maintenance/settings" as never,
                  );
                }}
              />

              <Divider />

              <Menu.Item
                leadingIcon="logout"
                title="Sign out"
                onPress={() =>
                  void handleLogout()
                }
              />
            </Menu>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={22}
              color={colors.error}
            />

            <View style={styles.flex}>
              <Text
                style={styles.errorTitle}
              >
                Dashboard data could not be
                loaded
              </Text>

              <Text
                style={styles.errorText}
              >
                {errorMessage}
              </Text>
            </View>

            <Button
              mode="outlined"
              compact
              onPress={() =>
                void loadDashboard()
              }
            >
              Retry
            </Button>
          </View>
        ) : null}

        <View
          style={[
            styles.welcomeSection,
            isDesktop &&
              styles.desktopWelcomeSection,
          ]}
        >
          <View
            style={
              styles.welcomeTextContainer
            }
          >
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
              {getGreeting()}
              {currentUser?.firstName
                ? `, ${currentUser.firstName}`
                : ""}
            </Text>

            <Text
              style={
                styles.welcomeDescription
              }
            >
              {availableJobs.length} job
              {availableJobs.length === 1
                ? ""
                : "s"}{" "}
              currently available to you,{" "}
              {assignedActiveJobs.length} assigned
              active job
              {assignedActiveJobs.length === 1
                ? ""
                : "s"}
              {todaysVisits.length
                ? `, and ${todaysVisits.length} scheduled visit${todaysVisits.length === 1 ? "" : "s"} today.`
                : "."}
            </Text>
          </View>

          <Button
            mode="contained"
            icon="clipboard-text-outline"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never,
              )
            }
            buttonColor={colors.primary}
            contentStyle={
              styles.primaryButtonContent
            }
            labelStyle={
              styles.primaryButtonLabel
            }
            style={styles.viewJobsButton}
          >
            View jobs
          </Button>
        </View>

        <View
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
            title="Available jobs"
            value={String(
              availableJobs.length,
            )}
            description="Open or reopened work on properties where you are approved"
            actionLabel="Review jobs"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never,
              )
            }
          />

          <StatCard
            icon="calendar-clock-outline"
            title="Today's visits"
            value={String(
              todaysVisits.length,
            )}
            description={
              nextVisit
                ? `Next visit ${formatTime(nextVisit.scheduledStart)}`
                : "No visits scheduled today"
            }
            actionLabel="View schedule"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never,
              )
            }
          />

          <StatCard
            icon="progress-wrench"
            title="In progress"
            value={String(
              inProgressJobs.length,
            )}
            description={
              awaitingTenantJobs.length
                ? `${awaitingTenantJobs.length} also waiting for tenant confirmation`
                : "Jobs currently being worked on"
            }
            actionLabel="Update jobs"
            onPress={() =>
              router.push(
                "/maintenance/assigned-jobs" as never,
              )
            }
          />

          <StatCard
            icon="check-decagram-outline"
            title="Completed"
            value={String(
              completedThisMonth.length,
            )}
            description="Jobs confirmed complete this month"
            actionLabel="View history"
            onPress={() =>
              router.push(
                "/maintenance/completed-jobs" as never,
              )
            }
          />
        </View>

        <View
          style={[
            styles.mainGrid,
            isDesktop &&
              styles.desktopMainGrid,
          ]}
        >
          <View style={styles.jobsCard}>
            <View
              style={styles.cardHeader}
            >
              <View style={styles.flex}>
                <Text
                  style={styles.cardTitle}
                >
                  Active maintenance jobs
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Live work returned by the
                  TenureEx maintenance API
                </Text>
              </View>

              <Pressable
                style={styles.headerLink}
                onPress={() =>
                  router.push(
                    "/maintenance/assigned-jobs" as never,
                  )
                }
              >
                <Text
                  style={
                    styles.headerLinkText
                  }
                >
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
              {(
                [
                  "All active",
                  "Available",
                  "Scheduled",
                  "In progress",
                ] as DashboardFilter[]
              ).map((filter) => (
                <Pressable
                  key={filter}
                  style={[
                    styles.filterButton,
                    selectedFilter ===
                      filter &&
                      styles.activeFilterButton,
                  ]}
                  onPress={() =>
                    setSelectedFilter(filter)
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedFilter ===
                        filter &&
                        styles.activeFilterButtonText,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.jobList}>
              {filteredJobs.length ? (
                filteredJobs
                  .slice(0, 8)
                  .map(
                    (
                      job,
                      index,
                    ) => (
                      <View key={job.id}>
                        <JobCard
                          job={job}
                          providerId={
                            providerId
                          }
                          onPress={() =>
                            openJob(job.id)
                          }
                        />

                        {index <
                        Math.min(
                          filteredJobs.length,
                          8,
                        ) -
                          1 ? (
                          <Divider
                            style={
                              styles.jobDivider
                            }
                          />
                        ) : null}
                      </View>
                    ),
                  )
              ) : (
                <View
                  style={styles.emptyState}
                >
                  <MaterialCommunityIcons
                    name="clipboard-check-outline"
                    size={38}
                    color={
                      colors.textMuted
                    }
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No jobs found
                  </Text>

                  <Text
                    style={
                      styles.emptyDescription
                    }
                  >
                    There are no live jobs
                    matching this filter.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View
            style={styles.sideColumn}
          >
            <View style={styles.sideCard}>
              <View
                style={styles.cardHeader}
              >
                <View style={styles.flex}>
                  <Text
                    style={styles.cardTitle}
                  >
                    Today's schedule
                  </Text>

                  <Text
                    style={
                      styles.cardSubtitle
                    }
                  >
                    {new Date().toLocaleDateString(
                      "en-GB",
                      {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      },
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.calendarIcon
                  }
                >
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>
              </View>

              <View
                style={
                  styles.scheduleList
                }
              >
                {todaysVisits.length ? (
                  todaysVisits
                    .slice(0, 5)
                    .map(
                      (
                        job,
                        index,
                      ) => (
                        <ScheduleItem
                          key={job.id}
                          job={job}
                          first={
                            index === 0
                          }
                          onPress={() =>
                            openJob(job.id)
                          }
                        />
                      ),
                    )
                ) : (
                  <View
                    style={
                      styles.scheduleEmpty
                    }
                  >
                    <MaterialCommunityIcons
                      name="calendar-check-outline"
                      size={28}
                      color={
                        colors.textMuted
                      }
                    />
                    <Text
                      style={
                        styles.scheduleEmptyText
                      }
                    >
                      No scheduled visits
                      today.
                    </Text>
                  </View>
                )}
              </View>

              <Button
                mode="outlined"
                icon="calendar-month-outline"
                onPress={() =>
                  router.push(
                    "/maintenance/assigned-jobs" as never,
                  )
                }
                textColor={colors.primary}
                style={
                  styles.outlinedButton
                }
              >
                View full schedule
              </Button>
            </View>

            <View style={styles.sideCard}>
              <View
                style={styles.cardHeader}
              >
                <View style={styles.flex}>
                  <Text
                    style={styles.cardTitle}
                  >
                    Recent updates
                  </Text>

                  <Text
                    style={
                      styles.cardSubtitle
                    }
                  >
                    Real workflow
                    notifications for your
                    account
                  </Text>
                </View>

                <View
                  style={
                    styles.notificationIcon
                  }
                >
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>
              </View>

              <View
                style={
                  styles.notificationList
                }
              >
                {recentNotifications.length ? (
                  recentNotifications.map(
                    (notification) => (
                      <NotificationItem
                        key={
                          notification.id
                        }
                        notification={
                          notification
                        }
                        onPress={() =>
                          void openNotification(
                            notification,
                          )
                        }
                      />
                    ),
                  )
                ) : (
                  <View
                    style={
                      styles.scheduleEmpty
                    }
                  >
                    <MaterialCommunityIcons
                      name="bell-check-outline"
                      size={28}
                      color={
                        colors.textMuted
                      }
                    />
                    <Text
                      style={
                        styles.scheduleEmptyText
                      }
                    >
                      No notifications yet.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View
              style={
                styles.quickActionsCard
              }
            >
              <Text
                style={styles.cardTitle}
              >
                Quick actions
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Maintenance tools backed by
                the current workflow
              </Text>

              <View
                style={styles.quickActions}
              >
                <QuickAction
                  icon="clipboard-text-outline"
                  label="Assigned jobs"
                  onPress={() =>
                    router.push(
                      "/maintenance/assigned-jobs" as never,
                    )
                  }
                />

                <QuickAction
                  icon="check-circle-outline"
                  label="Completed jobs"
                  onPress={() =>
                    router.push(
                      "/maintenance/completed-jobs" as never,
                    )
                  }
                />

                <QuickAction
                  icon="cog-outline"
                  label="Settings"
                  onPress={() =>
                    router.push(
                      "/maintenance/settings" as never,
                    )
                  }
                />
              </View>
            </View>
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
        pressed &&
          styles.pressedCard,
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

      <Text
        style={
          styles.statDescription
        }
      >
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
  providerId,
  onPress,
}: {
  job: MaintenanceRequest;
  providerId: string;
  onPress: () => void;
}) {
  const isAssignedToProvider =
    job.assignedProviderUserId ===
    providerId;

  const appointment =
    job.scheduledStart
      ? `${formatShortDate(job.scheduledStart)}, ${formatTime(job.scheduledStart)}`
      : `Reported ${formatRelativeTime(job.createdAt)}`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.jobCard,
        pressed &&
          styles.jobCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.jobIcon}>
        <MaterialCommunityIcons
          name={getCategoryIcon(
            job.category,
          )}
          size={23}
          color={colors.primary}
        />
      </View>

      <View style={styles.jobContent}>
        <View
          style={styles.jobTitleRow}
        >
          <View style={styles.flex}>
            <Text
              style={styles.jobTitle}
            >
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
            text={formatPropertyAddress(
              job.property,
            )}
          />

          <JobDetail
            icon="calendar-clock-outline"
            text={appointment}
          />

          <JobDetail
            icon="account-hard-hat-outline"
            text={
              isAssignedToProvider
                ? "Assigned to you"
                : "Available to approved providers"
            }
          />
        </View>

        <View style={styles.jobFooter}>
          <PriorityBadge
            priority={job.priority}
          />

          <View
            style={styles.viewJobLink}
          >
            <Text
              style={styles.viewJobText}
            >
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
        style={
          styles.jobDetailText
        }
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const colour =
    getStatusColours(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            colour.background,
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          {
            color: colour.text,
          },
        ]}
      >
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const colour =
    getPriorityColours(priority);

  const normalised =
    priority.toUpperCase();

  return (
    <View
      style={[
        styles.priorityBadge,
        {
          backgroundColor:
            colour.background,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={
          normalised ===
          "EMERGENCY"
            ? "alert-circle-outline"
            : normalised === "HIGH"
              ? "alert-outline"
              : "information-outline"
        }
        size={14}
        color={colour.text}
      />

      <Text
        style={[
          styles.priorityText,
          { color: colour.text },
        ]}
      >
        {getPriorityLabel(priority)}{" "}
        priority
      </Text>
    </View>
  );
}

function ScheduleItem({
  job,
  first,
  onPress,
}: {
  job: MaintenanceRequest;
  first: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.scheduleItem}
      onPress={onPress}
    >
      <View style={styles.scheduleTime}>
        <Text
          style={styles.scheduleTimeText}
        >
          {formatTime(
            job.scheduledStart,
          )}
        </Text>
      </View>

      <View
        style={[
          styles.scheduleLine,
          first &&
            styles.activeScheduleLine,
        ]}
      />

      <View
        style={styles.scheduleContent}
      >
        <View
          style={styles.scheduleTopRow}
        >
          <Text
            style={styles.scheduleTitle}
          >
            {job.title}
          </Text>

          <Text
            style={[
              styles.scheduleStatus,
              first &&
                styles.activeScheduleStatus,
            ]}
          >
            {first
              ? "Next visit"
              : getStatusLabel(
                  job.status,
                )}
          </Text>
        </View>

        <Text
          style={styles.scheduleAddress}
        >
          {formatPropertyAddress(
            job.property,
          )}
        </Text>
      </View>
    </Pressable>
  );
}

function NotificationItem({
  notification,
  onPress,
}: {
  notification: NotificationRow;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.notificationItem,
        !notification.readAt &&
          styles.notificationUnread,
        pressed && styles.pressedCard,
      ]}
      onPress={onPress}
    >
      <View
        style={
          styles.notificationDotColumn
        }
      >
        <View
          style={[
            styles.notificationDot,
            notification.readAt &&
              styles.notificationDotRead,
          ]}
        />
      </View>

      <View style={styles.flex}>
        <Text
          style={
            styles.notificationTitle
          }
        >
          {notification.title}
        </Text>

        <Text
          style={
            styles.notificationMessage
          }
          numberOfLines={3}
        >
          {notification.message}
        </Text>

        <Text
          style={
            styles.notificationTime
          }
        >
          {formatRelativeTime(
            notification.createdAt,
          )}
        </Text>
      </View>

      {notification.entityType ===
        "MaintenanceRequest" &&
      notification.entityId ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={colors.textMuted}
        />
      ) : null}
    </Pressable>
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
        pressed &&
          styles.quickActionPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={
          styles.quickActionIcon
        }
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <Text
        style={
          styles.quickActionLabel
        }
      >
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

  loadingContainer: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
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

  notificationButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 1,
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

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    backgroundColor: "#FDECEC",
  },

  errorTitle: {
    color: colors.error,
    fontSize: 10,
    fontWeight: "900",
  },

  errorText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
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
    maxWidth: 760,
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
    minHeight: 31,
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
    minWidth: 0,
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
    minWidth: 0,
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
    alignItems: "flex-start",
    gap: 6,
  },

  jobDetailText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
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
    width: 48,
    alignItems: "flex-end",
  },

  scheduleTimeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
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

  scheduleEmpty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },

  scheduleEmptyText: {
    color: colors.textMuted,
    fontSize: 9,
    textAlign: "center",
  },

  outlinedButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  notificationIcon: {
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  notificationList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  notificationUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  notificationDotColumn: {
    paddingTop: 5,
  },

  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  notificationDotRead: {
    backgroundColor: colors.border,
  },

  notificationTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  notificationMessage: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
  },

  notificationTime: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
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
