import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Avatar, Button } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";

import { api, clearAuthSession, getStoredUser } from "../../src/api/client";
import {
  getAllowedAgentNavigation,
  getPrimaryRoleName,
  getUserDisplayName,
  getUserInitials,
  hasAgentPermission,
  type AgentCurrentUser,
  type AgentNavigationItem,
} from "../../src/auth/agent-permissions";
import TenureExLogo from "../../src/components/Logo/TenureExLogo";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;


type AgencyDashboardProperty = {
  id: string;
  propertyStatus: "OCCUPIED" | "VACANT" | "PENDING_APPROVAL";
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
};

type AgencyLandlordsDashboardResponse = {
  landlords: unknown[];
  invitations: unknown[];
};

type DashboardMaintenanceRequest = {
  id: string;
  title: string;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  createdAt?: string | null;
  property?: {
    addressLine1?: string | null;
    postcode?: string | null;
  } | null;
};

type StatisticItem = {
  title: string;
  value: string;
  change: string;
  icon: IconName;
  positive?: boolean;
  permission?: string;
};

const statistics: StatisticItem[] = [
  {
    title: "Properties",
    value: "128",
    change: "+8 this month",
    icon: "office-building-outline",
    positive: true,
    permission: "PROPERTIES_VIEW",
  },
  {
    title: "Agency Users",
    value: "12",
    change: "3 Administrators",
    icon: "account-multiple-outline",
    positive: true,
    permission: "USERS_VIEW",
  },
  {
    title: "Landlords",
    value: "42",
    change: "+4 this month",
    icon: "account-tie-outline",
    positive: true,
    permission: "LANDLORDS_VIEW",
  },
  {
    title: "Maintenance",
    value: "0",
    change: "0 urgent",
    icon: "tools",
    permission: "MAINTENANCE_VIEW",
  },
];

const propertyStatus = [
  {
    label: "Rented",
    value: 104,
    percentage: 81,
  },
  {
    label: "Available",
    value: 16,
    percentage: 13,
  },
  {
    label: "Awaiting approval",
    value: 5,
    percentage: 4,
  },
  {
    label: "On hold",
    value: 3,
    percentage: 2,
  },
];

const recentActivities = [
  {
    title: "New user added",
    description: "Sarah Williams has been added as Property Manager.",
    time: "8 minutes ago",
    icon: "account-plus-outline" as IconName,
    permission: "USERS_VIEW",
  },
  {
    title: "Role updated",
    description: "Maintenance Staff permissions updated.",
    time: "25 minutes ago",
    icon: "shield-account-outline" as IconName,
    permission: "ROLES_VIEW",
  },
  {
    title: "New landlord registered",
    description: "Daniel Thompson completed registration.",
    time: "1 hour ago",
    icon: "account-tie-outline" as IconName,
    permission: "LANDLORDS_VIEW",
  },
  {
    title: "Property approved",
    description: "24 Westbourne Road approved.",
    time: "2 hours ago",
    icon: "home-check-outline" as IconName,
    permission: "PROPERTIES_VIEW",
  },
];


const complianceItems = [
  {
    document: "Gas safety certificate",
    property: "16 Riverside Court",
    expiry: "14 days",
    urgent: true,
  },
  {
    document: "Electrical safety report",
    property: "8 Green Lane",
    expiry: "29 days",
    urgent: false,
  },
  {
    document: "Energy performance certificate",
    property: "31 Victoria Road",
    expiry: "43 days",
    urgent: false,
  },
];

function getGreetingName(user: AgentCurrentUser) {
  return user.firstName || getUserDisplayName(user) || "there";
}

export default function AgentDashboard() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AgentCurrentUser | null>(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [dashboardProperties, setDashboardProperties] = useState<AgencyDashboardProperty[]>([]);
  const [dashboardLandlordCount, setDashboardLandlordCount] = useState(0);
  const [dashboardAgencyUserCount, setDashboardAgencyUserCount] = useState(0);
  const [dashboardMaintenance, setDashboardMaintenance] = useState<DashboardMaintenanceRequest[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getStoredUser<AgentCurrentUser>();
      setCurrentUser(storedUser);
      setPermissionsLoaded(true);
    };

    void loadUser();
  }, []);

  useEffect(() => {
    if (!permissionsLoaded || !currentUser) {
      return;
    }

    const loadDashboardData = async () => {
      const [landlordsResult, propertiesResult, usersResult, maintenanceResult] = await Promise.allSettled([
        api.get<AgencyLandlordsDashboardResponse>("/agency-landlords"),
        api.get<AgencyDashboardProperty[]>("/agency-landlords/properties"),
        api.get<unknown[]>("/agency-users"),
        api.get<DashboardMaintenanceRequest[]>("/property-workflows/maintenance-requests"),
      ]);

      if (landlordsResult.status === "fulfilled") {
        setDashboardLandlordCount(landlordsResult.value.data.landlords.length);
      }

      if (propertiesResult.status === "fulfilled") {
        setDashboardProperties(propertiesResult.value.data);
      }

      if (usersResult.status === "fulfilled") {
        setDashboardAgencyUserCount(usersResult.value.data.length);
      }

      if (maintenanceResult.status === "fulfilled") {
        setDashboardMaintenance(
          Array.isArray(maintenanceResult.value.data) ? maintenanceResult.value.data : [],
        );
      }
    };

    void loadDashboardData();
  }, [permissionsLoaded, currentUser]);

  const navigationItems = useMemo(
    () => getAllowedAgentNavigation(currentUser),
    [currentUser],
  );

  const liveStatistics = useMemo(() => {
    const pendingCount = dashboardProperties.filter(
      (property) => property.approvalStatus === "PENDING",
    ).length;

    return statistics.map((item) => {
      if (item.title === "Properties") {
        return { ...item, value: String(dashboardProperties.length), change: `${pendingCount} awaiting approval` };
      }
      if (item.title === "Agency Users") {
        return { ...item, value: String(dashboardAgencyUserCount), change: "Active agency team" };
      }
      if (item.title === "Landlords") {
        return { ...item, value: String(dashboardLandlordCount), change: "Linked to this agency" };
      }
      if (item.title === "Maintenance") {
        const active = dashboardMaintenance.filter((request) => request.status !== "COMPLETED");
        const urgent = active.filter((request) => request.priority === "EMERGENCY" || request.priority === "HIGH");
        return { ...item, value: String(active.length), change: `${urgent.length} urgent / high` };
      }
      return item;
    });
  }, [dashboardProperties, dashboardAgencyUserCount, dashboardLandlordCount, dashboardMaintenance]);

  const visibleStatistics = useMemo(
    () =>
      liveStatistics.filter(
        (item) =>
          !item.permission ||
          hasAgentPermission(currentUser, item.permission),
      ),
    [currentUser, liveStatistics],
  );

  const visibleActivities = useMemo(
    () =>
      recentActivities.filter((activity) =>
        hasAgentPermission(currentUser, activity.permission),
      ),
    [currentUser],
  );

  const livePropertyStatus = useMemo(() => {
    const total = dashboardProperties.length || 1;
    const occupied = dashboardProperties.filter((item) => item.propertyStatus === "OCCUPIED").length;
    const vacant = dashboardProperties.filter((item) => item.propertyStatus === "VACANT").length;
    const pending = dashboardProperties.filter((item) => item.approvalStatus === "PENDING").length;
    const rejected = dashboardProperties.filter((item) => item.approvalStatus === "REJECTED").length;

    return [
      { label: "Occupied", value: occupied, percentage: Math.round((occupied / total) * 100) },
      { label: "Vacant", value: vacant, percentage: Math.round((vacant / total) * 100) },
      { label: "Awaiting approval", value: pending, percentage: Math.round((pending / total) * 100) },
      { label: "Rejected", value: rejected, percentage: Math.round((rejected / total) * 100) },
    ];
  }, [dashboardProperties]);

  const liveMaintenanceItems = useMemo(() =>
    dashboardMaintenance
      .filter((request) => request.status !== "COMPLETED")
      .slice(0, 5)
      .map((request) => ({
        id: request.id,
        title: request.title,
        property: [request.property?.addressLine1, request.property?.postcode].filter(Boolean).join(", ") || "Property",
        priority: request.priority === "EMERGENCY" ? "Emergency" : request.priority === "HIGH" ? "High" : request.priority === "LOW" ? "Low" : "Medium",
        status: String(request.status || "OPEN").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
      })),
    [dashboardMaintenance],
  );

  const maintenanceAttentionCount = useMemo(
    () => dashboardMaintenance.filter((request) => request.status !== "COMPLETED").length,
    [dashboardMaintenance],
  );

  const canViewDashboard = hasAgentPermission(
    currentUser,
    "DASHBOARD_VIEW",
  );

  const canViewProperties = hasAgentPermission(
    currentUser,
    "PROPERTIES_VIEW",
  );

  const canCreateProperties = hasAgentPermission(
    currentUser,
    "PROPERTIES_CREATE",
  );

  const canViewReports = hasAgentPermission(
    currentUser,
    "REPORTS_VIEW",
  );

  const canViewMaintenance = hasAgentPermission(
    currentUser,
    "MAINTENANCE_VIEW",
  );

  const canViewCompliance = hasAgentPermission(
    currentUser,
    "COMPLIANCE_VIEW",
  );

  const canCreateUsers = hasAgentPermission(
    currentUser,
    "USERS_CREATE",
  );

  const canViewUsers = hasAgentPermission(
    currentUser,
    "USERS_VIEW",
  );

  const canViewRoles = hasAgentPermission(
    currentUser,
    "ROLES_VIEW",
  );

  const navigateTo = (route: Href) => {
    setMobileMenuOpen(false);
    router.replace(route);
  };

  const handleSignOut = async () => {
    await clearAuthSession();
    router.replace("/auth/agent/login" as Href);
  };

  if (!permissionsLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    router.replace("/auth/agent/login" as Href);
    return null;
  }

  if (!canViewDashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
          }}
        >
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={52}
            color={colors.error}
          />

          <Text
            style={{
              marginTop: 16,
              fontSize: 22,
              fontWeight: "800",
              color: colors.textPrimary,
            }}
          >
            Access denied
          </Text>

          <Text
            style={{
              marginTop: 8,
              textAlign: "center",
              color: colors.textSecondary,
            }}
          >
            Your agency role does not have permission to access the dashboard.
          </Text>

          <Button
            mode="contained"
            style={{ marginTop: 20 }}
            onPress={handleSignOut}
          >
            Return to sign in
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {isDesktop && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarLogo}>
              <TenureExLogo light compact />
            </View>

            <View style={styles.agencyCard}>
              <View style={styles.agencyIcon}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={22}
                  color={colors.white}
                />
              </View>

              <View style={styles.agencyDetails}>
                <Text style={styles.agencyName}>
                  {currentUser.agency?.name ?? "TenureEx Agency"}
                </Text>

                <Text style={styles.agencyPlan}>
                  {currentUser.branch?.name ?? "Agency workspace"}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </View>

            <ScrollView
              style={styles.sidebarScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.navigationLabel}>WORKSPACE</Text>

              <View style={styles.navigationList}>
                {navigationItems.map((item) => (
                  <SidebarNavigationItem
                    key={item.label}
                    item={item}
                    active={item.label === "Dashboard"}
                    onPress={() => navigateTo(item.route)}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <View style={styles.sidebarProfile}>
                <Avatar.Text
                  size={39}
                  label={getUserInitials(currentUser)}
                  style={styles.sidebarAvatar}
                  labelStyle={styles.sidebarAvatarLabel}
                />

                <View style={styles.sidebarProfileDetails}>
                  <Text style={styles.sidebarProfileName}>
                    {getUserDisplayName(currentUser)}
                  </Text>

                  <Text style={styles.sidebarProfileRole}>
                    {getPrimaryRoleName(currentUser)}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.signOutIcon,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color="rgba(255,255,255,0.75)"
                />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.mainArea}>
          <View style={styles.topBar}>
            {!isDesktop && (
              <Pressable
                onPress={() =>
                  setMobileMenuOpen((current) => !current)
                }
                style={styles.menuButton}
              >
                <MaterialCommunityIcons
                  name={mobileMenuOpen ? "close" : "menu"}
                  size={25}
                  color={colors.textPrimary}
                />
              </Pressable>
            )}

            {!isDesktop && <TenureExLogo compact />}

            {isDesktop && (
              <View>
                <Text style={styles.topBarTitle}>Dashboard</Text>
                <Text style={styles.topBarSubtitle}>
                  Estate Agent Workspace
                </Text>
              </View>
            )}

            <View style={styles.topBarActions}>
              <Pressable style={styles.headerIconButton}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>

              <Pressable style={styles.headerIconButton}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={22}
                  color={colors.textSecondary}
                />

                <View style={styles.notificationDot} />
              </Pressable>

              {isTablet && (
                <View style={styles.headerProfile}>
                  <Avatar.Text
                    size={38}
                    label={getUserInitials(currentUser)}
                    style={styles.headerAvatar}
                    labelStyle={styles.headerAvatarLabel}
                  />

                  <View>
                    <Text style={styles.headerProfileName}>
                      {getUserDisplayName(currentUser)}
                    </Text>

                    <Text style={styles.headerProfileRole}>
                      {getPrimaryRoleName(currentUser)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {!isDesktop && mobileMenuOpen && (
            <>
              <Pressable
                onPress={() => setMobileMenuOpen(false)}
                style={styles.mobileMenuBackdrop}
              />

              <Animated.View
                entering={FadeInUp.duration(250)}
                style={styles.mobileMenu}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.mobileMenuContent}
                >
                  {navigationItems.map((item) => (
                    <SidebarNavigationItem
                      key={item.label}
                      item={item}
                      active={item.label === "Dashboard"}
                      mobile
                      onPress={() => navigateTo(item.route)}
                    />
                  ))}

                  <Pressable
                    onPress={handleSignOut}
                    style={styles.mobileSignOut}
                  >
                    <MaterialCommunityIcons
                      name="logout"
                      size={20}
                      color={colors.error}
                    />

                    <Text style={styles.mobileSignOutText}>
                      Sign out
                    </Text>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            </>
          )}

          <ScrollView
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageContainer}>
              <Animated.View
                entering={FadeInUp.duration(400)}
                style={styles.welcomeSection}
              >
                <View style={styles.welcomeText}>
                  <Text style={styles.eyebrow}>PORTFOLIO OVERVIEW</Text>

                  <Text style={styles.welcomeTitle}>
                    Good morning, {getGreetingName(currentUser)}
                  </Text>

                  <Text style={styles.welcomeDescription}>
                    Here is what is happening across your agency today.
                  </Text>
                </View>

                <View style={styles.welcomeActions}>
                  {canViewReports && (
                    <Button
                      mode="outlined"
                      icon="download-outline"
                      textColor={colors.primary}
                      style={styles.secondaryButton}
                      onPress={() =>
                        router.push("/agent/reports" as Href)
                      }
                    >
                      Export report
                    </Button>
                  )}

                  {canCreateProperties && (
                    <Button
                      mode="contained"
                      icon="plus"
                      buttonColor={colors.primary}
                      style={styles.primaryButton}
                      onPress={() =>
                        router.push("/agent/properties" as Href)
                      }
                    >
                      Add property
                    </Button>
                  )}
                </View>
              </Animated.View>

              <View
                style={[
                  styles.statisticsGrid,
                  !isTablet && styles.mobileStatisticsGrid,
                ]}
              >
                {visibleStatistics.map((item, index) => (
                  <Animated.View
                    key={item.title}
                    entering={FadeInUp.delay(index * 70).duration(400)}
                    style={[
                      styles.statisticCard,
                      isTablet
                        ? styles.desktopStatisticCard
                        : styles.mobileStatisticCard,
                    ]}
                  >
                    <View style={styles.statisticHeader}>
                      <View style={styles.statisticIcon}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={23}
                          color={colors.primary}
                        />
                      </View>

                      <MaterialCommunityIcons
                        name="dots-horizontal"
                        size={20}
                        color={colors.textMuted}
                      />
                    </View>

                    <Text style={styles.statisticValue}>
                      {item.value}
                    </Text>

                    <Text style={styles.statisticTitle}>
                      {item.title}
                    </Text>

                    <View style={styles.statisticChangeRow}>
                      <MaterialCommunityIcons
                        name={
                          item.positive
                            ? "trending-up"
                            : "alert-circle-outline"
                        }
                        size={15}
                        color={
                          item.positive
                            ? colors.success
                            : colors.warning
                        }
                      />

                      <Text
                        style={[
                          styles.statisticChange,
                          {
                            color: item.positive
                              ? colors.success
                              : colors.warning,
                          },
                        ]}
                      >
                        {item.change}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              {(canViewProperties || visibleActivities.length > 0) && (
                <View
                  style={[
                    styles.dashboardRow,
                    !isDesktop && styles.stackedDashboardRow,
                  ]}
                >
                  {canViewProperties && (
                    <Animated.View
                      entering={FadeInUp.delay(250).duration(450)}
                      style={[
                        styles.contentCard,
                        styles.portfolioOverviewCard,
                      ]}
                    >
                      <CardHeader
                        title="Property status"
                        subtitle="Current portfolio distribution"
                        action="View properties"
                        onPress={() =>
                          router.push("/agent/properties" as Href)
                        }
                      />

                      <View style={styles.portfolioSummary}>
                        <View style={styles.occupancyCircle}>
                          <Text style={styles.occupancyValue}>{livePropertyStatus[0]?.percentage ?? 0}%</Text>
                          <Text style={styles.occupancyLabel}>
                            Occupied
                          </Text>
                        </View>

                        <View style={styles.propertyStatusList}>
                          {livePropertyStatus.map((item) => (
                            <View
                              key={item.label}
                              style={styles.propertyStatusItem}
                            >
                              <View style={styles.propertyStatusHeading}>
                                <View style={styles.statusLabelRow}>
                                  <View style={styles.statusDot} />
                                  <Text style={styles.statusLabel}>
                                    {item.label}
                                  </Text>
                                </View>

                                <Text style={styles.statusValue}>
                                  {item.value}
                                </Text>
                              </View>

                              <View style={styles.progressTrack}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    {
                                      width: `${item.percentage}%`,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    </Animated.View>
                  )}

                  {visibleActivities.length > 0 && (
                    <Animated.View
                      entering={FadeInUp.delay(320).duration(450)}
                      style={[
                        styles.contentCard,
                        styles.activityCard,
                      ]}
                    >
                      <CardHeader
                        title="Recent activity"
                        subtitle="Latest agency updates"
                        action="View all"
                      />

                      <View style={styles.activityList}>
                        {visibleActivities.map((activity, index) => (
                          <View
                            key={`${activity.title}-${index}`}
                            style={styles.activityItem}
                          >
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

                              <Text
                                style={styles.activityDescription}
                                numberOfLines={2}
                              >
                                {activity.description}
                              </Text>

                              <Text style={styles.activityTime}>
                                {activity.time}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </Animated.View>
                  )}
                </View>
              )}

              {(canViewMaintenance || canViewCompliance) && (
                <View
                  style={[
                    styles.dashboardRow,
                    !isDesktop && styles.stackedDashboardRow,
                  ]}
                >
                  {canViewMaintenance && (
                    <Animated.View
                      entering={FadeInUp.delay(390).duration(450)}
                      style={[
                        styles.contentCard,
                        styles.maintenanceCard,
                      ]}
                    >
                      <CardHeader
                        title="Maintenance requests"
                        subtitle={`${maintenanceAttentionCount} ${maintenanceAttentionCount === 1 ? "request requires" : "requests require"} attention`}
                        action="Open maintenance"
                        onPress={() =>
                          router.push("/agent/maintenance" as Href)
                        }
                      />

                      <View style={styles.tableHeader}>
                        <Text
                          style={[
                            styles.tableHeaderText,
                            styles.issueColumn,
                          ]}
                        >
                          Issue
                        </Text>

                        {isTablet && (
                          <Text
                            style={[
                              styles.tableHeaderText,
                              styles.priorityColumn,
                            ]}
                          >
                            Priority
                          </Text>
                        )}

                        <Text
                          style={[
                            styles.tableHeaderText,
                            styles.statusColumn,
                          ]}
                        >
                          Status
                        </Text>
                      </View>

                      {liveMaintenanceItems.length === 0 ? (
                        <View style={styles.maintenanceRow}>
                          <View style={styles.issueColumn}>
                            <Text style={styles.maintenanceTitle}>No active maintenance requests</Text>
                            <Text style={styles.maintenanceProperty}>New tenant repair reports will appear here.</Text>
                          </View>
                        </View>
                      ) : liveMaintenanceItems.map((item) => (
                        <Pressable
                          key={item.id}
                          style={styles.maintenanceRow}
                          onPress={() => router.push(`/agent/maintenance-request/${item.id}` as Href)}
                        >
                          <View style={styles.issueColumn}>
                            <Text style={styles.maintenanceTitle}>
                              {item.title}
                            </Text>

                            <Text style={styles.maintenanceProperty}>
                              {item.property}
                            </Text>
                          </View>

                          {isTablet && (
                            <View style={styles.priorityColumn}>
                              <StatusBadge
                                text={item.priority}
                                type={
                                  item.priority === "Urgent"
                                    ? "error"
                                    : item.priority === "Medium"
                                      ? "warning"
                                      : "neutral"
                                }
                              />
                            </View>
                          )}

                          <View style={styles.statusColumn}>
                            <StatusBadge
                              text={item.status}
                              type="primary"
                            />
                          </View>
                        </Pressable>
                      ))}
                    </Animated.View>
                  )}

                  {canViewCompliance && (
                    <Animated.View
                      entering={FadeInUp.delay(450).duration(450)}
                      style={[
                        styles.contentCard,
                        styles.complianceCard,
                      ]}
                    >
                      <CardHeader
                        title="Compliance alerts"
                        subtitle="Documents nearing expiry"
                        action="View compliance"
                        onPress={() =>
                          router.push("/agent/compliance" as Href)
                        }
                      />

                      <View style={styles.complianceList}>
                        {complianceItems.map((item) => (
                          <View
                            key={`${item.document}-${item.property}`}
                            style={styles.complianceItem}
                          >
                            <View
                              style={[
                                styles.complianceIcon,
                                item.urgent &&
                                  styles.urgentComplianceIcon,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={
                                  item.urgent
                                    ? "alert-outline"
                                    : "file-certificate-outline"
                                }
                                size={20}
                                color={
                                  item.urgent
                                    ? colors.error
                                    : colors.primary
                                }
                              />
                            </View>

                            <View style={styles.complianceInformation}>
                              <Text style={styles.complianceDocument}>
                                {item.document}
                              </Text>

                              <Text style={styles.complianceProperty}>
                                {item.property}
                              </Text>
                            </View>

                            <View>
                              <Text
                                style={[
                                  styles.complianceExpiry,
                                  item.urgent &&
                                    styles.urgentComplianceExpiry,
                                ]}
                              >
                                {item.expiry}
                              </Text>

                              <Text style={styles.complianceExpiryLabel}>
                                remaining
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </Animated.View>
                  )}
                </View>
              )}

              {(canCreateUsers ||
                canViewUsers ||
                canViewRoles ||
                canViewProperties) && (
                <Animated.View
                  entering={FadeInUp.delay(520).duration(450)}
                  style={styles.quickActionsSection}
                >
                  <Text style={styles.sectionTitle}>
                    Quick actions
                  </Text>

                  <View style={styles.quickActionsGrid}>
                    {canCreateUsers && (
                      <QuickAction
                        title="Add User"
                        description="Create a staff account"
                        icon="account-plus-outline"
                        onPress={() =>
                          router.push("/agent/add-user" as Href)
                        }
                      />
                    )}

                    {canViewUsers && (
                      <QuickAction
                        title="Manage Users"
                        description="View agency users"
                        icon="account-multiple-outline"
                        onPress={() =>
                          router.push("/agent/users" as Href)
                        }
                      />
                    )}

                    {canViewRoles && (
                      <QuickAction
                        title="Roles"
                        description="Permissions & Access"
                        icon="shield-account-outline"
                        onPress={() =>
                          router.push(
                            "/agent/roles-permissions" as Href,
                          )
                        }
                      />
                    )}

                    {canViewProperties && (
                      <QuickAction
                        title="Properties"
                        description="Manage Properties"
                        icon="office-building-outline"
                        onPress={() =>
                          router.push("/agent/properties" as Href)
                        }
                      />
                    )}
                  </View>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SidebarNavigationItem({
  item,
  active,
  mobile = false,
  onPress,
}: {
  item: AgentNavigationItem;
  active: boolean;
  mobile?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navigationItem,
        mobile && styles.mobileNavigationItem,
        active && styles.activeNavigationItem,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={20}
        color={
          active
            ? colors.white
            : mobile
              ? colors.textSecondary
              : "rgba(255,255,255,0.68)"
        }
      />

      <Text
        style={[
          styles.navigationText,
          mobile && styles.mobileNavigationText,
          active && styles.activeNavigationText,
        ]}
      >
        {item.label}
      </Text>

      {(item.label === "Messages" ||
        item.label === "Users") && (
        <View style={styles.messageBadge}>
          <Text style={styles.messageBadgeText}>
            {item.label === "Users" ? "12" : "4"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
  onPress,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>

      {action && (
        <Pressable onPress={onPress}>
          <Text style={styles.cardAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function StatusBadge({
  text,
  type,
}: {
  text: string;
  type: "primary" | "warning" | "error" | "neutral";
}) {
  const badgeStyle =
    type === "error"
      ? styles.errorBadge
      : type === "warning"
        ? styles.warningBadge
        : type === "neutral"
          ? styles.neutralBadge
          : styles.primaryBadge;

  const textStyle =
    type === "error"
      ? styles.errorBadgeText
      : type === "warning"
        ? styles.warningBadgeText
        : type === "neutral"
          ? styles.neutralBadgeText
          : styles.primaryBadgeText;

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusBadgeText, textStyle]}>
        {text}
      </Text>
    </View>
  );
}

function QuickAction({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={23}
          color={colors.primary}
        />
      </View>

      <View style={styles.quickActionInformation}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>
          {description}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  appShell: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 264,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  sidebarLogo: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },

  agencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  agencyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  agencyDetails: {
    flex: 1,
  },

  agencyName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },

  agencyPlan: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
  },

  sidebarScroll: {
    flex: 1,
    marginTop: spacing.xl,
  },

  navigationLabel: {
    paddingHorizontal: spacing.md,
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  navigationList: {
    marginTop: spacing.sm,
    gap: 3,
  },

  navigationItem: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  mobileNavigationItem: {
    minHeight: 48,
  },

  activeNavigationItem: {
    backgroundColor: colors.primary,
  },

  navigationText: {
    flex: 1,
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "600",
  },

  mobileNavigationText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  activeNavigationText: {
    color: colors.white,
    fontWeight: "800",
  },

  messageBadge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },

  messageBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },

  sidebarFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },

  sidebarProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sidebarAvatar: {
    backgroundColor: colors.secondary,
  },

  sidebarAvatarLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },

  sidebarProfileDetails: {
    flex: 1,
  },

  sidebarProfileName: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },

  sidebarProfileRole: {
    marginTop: 2,
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
  },

  signOutIcon: {
    padding: 6,
  },

  mainArea: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },

  topBar: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  topBarTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  topBarSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerIconButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  notificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginLeft: spacing.sm,
  },

  headerAvatar: {
    backgroundColor: colors.primaryLight,
  },

  headerAvatarLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  headerProfileName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  headerProfileRole: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 8,
  },

  mobileMenuBackdrop: {
    position: "absolute",
    top: 74,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 19,
    backgroundColor: "rgba(16,43,58,0.38)",
  },

  mobileMenu: {
    position: "absolute",
    top: 74,
    left: 0,
    zIndex: 20,
    width: 280,
    maxHeight: "85%",
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    borderBottomRightRadius: radius.xl,

    shadowColor: "#102B3A",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: {
      width: 5,
      height: 10,
    },

    elevation: 10,
  },

  mobileMenuContent: {
    padding: spacing.md,
  },

  mobileSignOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  mobileSignOutText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "700",
  },

  pageContent: {
    flexGrow: 1,
    width: "100%",
    padding: spacing.xl,
  },

  pageContainer: {
    width: "100%",
    maxWidth: 1480,
    alignSelf: "center",
  },

  welcomeSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  welcomeText: {
    flexShrink: 1,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  welcomeTitle: {
    ...typography.displayMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },

  welcomeDescription: {
    ...typography.bodyMedium,
    marginTop: 5,
    color: colors.textSecondary,
  },

  welcomeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  primaryButton: {
    borderRadius: radius.md,
  },

  secondaryButton: {
    borderRadius: radius.md,
    borderColor: colors.border,
  },

  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    width: "100%",
    marginTop: spacing.xl,
  },

  mobileStatisticsGrid: {
    gap: spacing.md,
  },

  statisticCard: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 200,
    maxWidth: "100%",
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },

  desktopStatisticCard: {
    flex: 1,
    minWidth: 200,
  },

  mobileStatisticCard: {
    width: "47%",
    minWidth: 145,
    flexGrow: 1,
  },

  statisticHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statisticIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  statisticValue: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 29,
    fontWeight: "900",
  },

  statisticTitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  statisticChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: spacing.md,
  },

  statisticChange: {
    fontSize: 9,
    fontWeight: "700",
  },

  dashboardRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },

  stackedDashboardRow: {
    flexDirection: "column",
  },

  contentCard: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },

  portfolioOverviewCard: {
    flex: 1.1,
  },

  activityCard: {
    flex: 0.9,
  },

  maintenanceCard: {
    flex: 1.2,
  },

  complianceCard: {
    flex: 0.8,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  cardSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
  },

  cardAction: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "800",
  },

  portfolioSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xl,
    marginTop: spacing.xl,
  },

  occupancyCircle: {
    width: 138,
    height: 138,
    borderRadius: 69,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 15,
    borderColor: colors.primary,
  },

  occupancyValue: {
    color: colors.textPrimary,
    fontSize: 27,
    fontWeight: "900",
  },

  occupancyLabel: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 9,
  },

  propertyStatusList: {
    flex: 1,
    minWidth: 230,
    gap: spacing.md,
  },

  propertyStatusItem: {
    gap: 7,
  },

  propertyStatusHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  statusLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },

  statusValue: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  progressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  activityList: {
    marginTop: spacing.lg,
  },

  activityItem: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  activityIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  activityInformation: {
    flex: 1,
  },

  activityTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  activityDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
  },

  activityTime: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  tableHeaderText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  issueColumn: {
    flex: 1,
  },

  priorityColumn: {
    width: 100,
  },

  statusColumn: {
    width: 100,
    alignItems: "flex-start",
  },

  maintenanceRow: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  maintenanceTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  maintenanceProperty: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "800",
  },

  primaryBadge: {
    backgroundColor: colors.primaryLight,
  },

  primaryBadgeText: {
    color: colors.primary,
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

  neutralBadge: {
    backgroundColor: colors.background,
  },

  neutralBadgeText: {
    color: colors.textSecondary,
  },

  complianceList: {
    marginTop: spacing.lg,
  },

  complianceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  complianceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  urgentComplianceIcon: {
    backgroundColor: colors.errorLight,
  },

  complianceInformation: {
    flex: 1,
  },

  complianceDocument: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  complianceProperty: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  complianceExpiry: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "right",
  },

  urgentComplianceExpiry: {
    color: colors.error,
  },

  complianceExpiryLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
    textAlign: "right",
  },

  quickActionsSection: {
    marginTop: spacing.xl,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  quickActionCard: {
    flex: 1,
    minWidth: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  quickActionInformation: {
    flex: 1,
  },

  quickActionTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  quickActionDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  pressed: {
    opacity: 0.72,
  },
});