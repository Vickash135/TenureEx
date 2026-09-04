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
  Avatar,
  Badge,
  Button,
  Divider,
  IconButton,
  Menu,
  ProgressBar,
  Snackbar,
} from "react-native-paper";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";

import { api, clearAuthSession, getStoredUser } from "../../src/api/client";
import ScreenContainer from "../../src/components/ScreenContainer";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type InspectionStatus =
  | "Scheduled"
  | "In Progress"
  | "Urgent"
  | "Completed";

type Priority = "High" | "Medium" | "Normal";

type NavigationItem = {
  label: string;
  icon: IconName;
  route: string;
  badge?: number;
};

type Inspection = {
  id: string;
  property: string;
  address: string;
  landlord: string;
  date: string;
  time: string;
  type: string;
  status: InspectionStatus;
  priority: Priority;
};

type Activity = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  time: string;
  background: string;
  iconColor: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/council/dashboard",
  },
  {
    label: "Inspections",
    icon: "clipboard-search-outline",
    route: "/council/inspections",
    badge: 8,
  },
  {
    label: "Reports",
    icon: "file-document-outline",
    route: "/council/reports",
  },
  {
    label: "Messages",
    icon: "message-text-outline",
    route: "/council/messages",
    badge: 3,
  },
  {
    label: "Settings",
    icon: "cog-outline",
    route: "/council/settings",
  },
];


export default function CouncilDashboardScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;
  const isSmallPhone = width < 390;

  const [mobileMenuVisible, setMobileMenuVisible] =
    useState(false);
  const [profileMenuVisible, setProfileMenuVisible] =
    useState(false);
  const [notificationMenuVisible, setNotificationMenuVisible] =
    useState(false);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingCases, setLoadingCases] = useState(true);

  const loadDashboard = async () => {
    try {
      const [stored, response] = await Promise.all([
        getStoredUser<any>("council"),
        api.get("/council-inspections/cases"),
      ]);
      setCurrentUser(stored);
      const rows = Array.isArray(response.data) ? response.data : [];
      setInspections(rows.map((row: any) => {
        const scheduled = row.scheduledStart ? new Date(row.scheduledStart) : null;
        const rawStatus = String(row.status ?? "REQUESTED");
        const status: InspectionStatus = rawStatus === "COMPLETED" || rawStatus === "CLOSED"
          ? "Completed"
          : rawStatus === "SCHEDULED"
            ? "Scheduled"
            : rawStatus === "ACTION_REQUIRED" || String(row.priority).toUpperCase() === "URGENT"
              ? "Urgent"
              : "In Progress";
        const priority: Priority = String(row.priority).toUpperCase() === "HIGH" || String(row.priority).toUpperCase() === "URGENT"
          ? "High"
          : String(row.priority).toUpperCase() === "MEDIUM"
            ? "Medium"
            : "Normal";
        return {
          id: row.id,
          property: row.property?.addressLine1 ?? "Property",
          address: [row.property?.townCity, row.property?.postcode].filter(Boolean).join(", "),
          landlord: row.requester ? `${row.requester.firstName ?? ""} ${row.requester.lastName ?? ""}`.trim() : "TenureEx user",
          date: scheduled ? scheduled.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Awaiting schedule",
          time: scheduled ? scheduled.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
          type: row.category ? String(row.category).replace(/_/g, " ") : "Housing condition",
          status,
          priority,
        };
      }));
    } catch (error: any) {
      const message = error?.response?.data?.message;
      setSnackbarMessage(typeof message === "string" ? message : "Unable to load Council inspection dashboard.");
      setSnackbarVisible(true);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => { void loadDashboard(); }, []);

  const displayName = currentUser ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() : "Council Inspector";
  const initials = currentUser ? `${currentUser.firstName?.[0] ?? ""}${currentUser.lastName?.[0] ?? ""}`.toUpperCase() || "CI" : "CI";
  const councilName = currentUser?.councilProfile?.councilName ?? "Council / Local Authority";
  const departmentName = currentUser?.councilProfile?.department ?? currentUser?.councilProfile?.jobTitle ?? "Housing Standards";
  const jobTitle = currentUser?.councilProfile?.jobTitle ?? "Council Inspector";
  const todayLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const completedCount = inspections.filter((item) => item.status === "Completed").length;
  const scheduledCount = inspections.filter((item) => item.status === "Scheduled").length;
  const urgentCount = inspections.filter((item) => item.status === "Urgent").length;
  const inProgressCount = inspections.filter((item) => item.status === "In Progress").length;
  const monthlyProgress = [
    { label: "Completed inspections", value: completedCount, total: Math.max(inspections.length, 1) },
    { label: "Scheduled inspections", value: scheduledCount, total: Math.max(inspections.length, 1) },
    { label: "Active cases", value: urgentCount + inProgressCount + scheduledCount, total: Math.max(inspections.length, 1) },
  ];
  const recentActivities: Activity[] = inspections.slice(0, 4).map((item) => ({
    id: item.id,
    icon: item.status === "Completed" ? "file-check-outline" : item.status === "Urgent" ? "alert-circle-outline" : "clipboard-search-outline",
    title: `${item.status} inspection`,
    description: `${item.property}${item.address ? ` · ${item.address}` : ""}`,
    time: item.date,
    background: item.status === "Urgent" ? "#FDECEC" : item.status === "Completed" ? "#E8F7EE" : colors.primaryLight,
    iconColor: item.status === "Urgent" ? "#B42318" : item.status === "Completed" ? "#277A46" : colors.primary,
  }));

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  }, []);

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const navigateTo = (route: string) => {
    setMobileMenuVisible(false);
    router.push(route as never);
  };

  const handleLogout = async () => {
    setProfileMenuVisible(false);
    await clearAuthSession("council");
    router.replace("/auth/council/login" as never);
  };

  const handleInspectionPress = (
    inspection: Inspection
  ) => {
    router.push({
      pathname:
        "/council/inspection-details" as never,
      params: {
        inspectionId: inspection.id,
      },
    });
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        {!isDesktop ? (
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={styles.mobileHeader}
          >
            <Pressable
              style={styles.mobileBrand}
              onPress={() =>
                router.replace(
                  "/council/dashboard" as never
                )
              }
            >
              <View style={styles.mobileBrandLogo}>
                <MaterialCommunityIcons
                  name="home-city-outline"
                  size={24}
                  color={colors.white}
                />
              </View>

              <View>
                <Text style={styles.mobileBrandName}>
                  TENUREEX
                </Text>

                <Text
                  style={styles.mobileBrandSubtitle}
                >
                  Council Portal
                </Text>
              </View>
            </Pressable>

            <View style={styles.mobileHeaderActions}>
              <View>
                <IconButton
                  icon="bell-outline"
                  size={22}
                  iconColor={colors.textPrimary}
                  onPress={() =>
                    setNotificationMenuVisible(true)
                  }
                />

                <Badge style={styles.mobileBadge}>
                  3
                </Badge>

                <Menu
                  visible={notificationMenuVisible}
                  onDismiss={() =>
                    setNotificationMenuVisible(false)
                  }
                  anchor={<View />}
                  contentStyle={
                    styles.notificationMenu
                  }
                >
                  <Menu.Item
                    leadingIcon="alert-circle-outline"
                    title="Urgent inspection assigned"
                    onPress={() => {
                      setNotificationMenuVisible(false);
                      navigateTo(
                        "/council/inspections"
                      );
                    }}
                  />

                  <Menu.Item
                    leadingIcon="message-text-outline"
                    title="3 unread messages"
                    onPress={() => {
                      setNotificationMenuVisible(false);
                      navigateTo(
                        "/council/messages"
                      );
                    }}
                  />
                </Menu>
              </View>

              <IconButton
                icon={
                  mobileMenuVisible
                    ? "close"
                    : "menu"
                }
                size={25}
                iconColor={colors.primary}
                onPress={() =>
                  setMobileMenuVisible(
                    !mobileMenuVisible
                  )
                }
              />
            </View>
          </Animated.View>
        ) : null}

        {!isDesktop && mobileMenuVisible ? (
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={styles.mobileNavigation}
          >
            {navigationItems.map((item) => {
              const active =
                item.route ===
                "/council/dashboard";

              return (
                <Pressable
                  key={item.label}
                  onPress={() =>
                    navigateTo(item.route)
                  }
                  style={({ pressed }) => [
                    styles.mobileNavigationItem,
                    active &&
                      styles.activeMobileNavigationItem,
                    pressed &&
                      styles.pressedNavigationItem,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={21}
                    color={
                      active
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.mobileNavigationLabel,
                      active &&
                        styles.activeMobileNavigationLabel,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {item.badge ? (
                    <View
                      style={
                        styles.navigationBadge
                      }
                    >
                      <Text
                        style={
                          styles.navigationBadgeText
                        }
                      >
                        {item.badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}

            <Divider style={styles.mobileDivider} />

            <Pressable
              style={styles.mobileLogoutButton}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons
                name="logout"
                size={21}
                color="#B42318"
              />

              <Text
                style={styles.mobileLogoutText}
              >
                Sign out
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View
          style={[
            styles.dashboardLayout,
            isDesktop &&
              styles.desktopDashboardLayout,
          ]}
        >
          {isDesktop ? (
            <Animated.View
              entering={FadeInLeft.duration(450)}
              style={styles.sidebar}
            >
              <Pressable
                style={styles.brandRow}
                onPress={() =>
                  router.replace(
                    "/council/dashboard" as never
                  )
                }
              >
                <View style={styles.brandLogo}>
                  <MaterialCommunityIcons
                    name="home-city-outline"
                    size={29}
                    color={colors.white}
                  />
                </View>

                <View>
                  <Text style={styles.brandName}>
                    TENUREEX
                  </Text>

                  <Text
                    style={styles.brandSubtitle}
                  >
                    Council & Inspection Portal
                  </Text>
                </View>
              </Pressable>

              <View style={styles.profileCard}>
                <Avatar.Text
                  size={48}
                  label={initials}
                  labelStyle={
                    styles.avatarLabel
                  }
                  style={styles.avatar}
                />

                <View style={styles.profileInformation}>
                  <Text style={styles.profileName}>
                    {displayName}
                  </Text>

                  <Text style={styles.profileRole}>
                    {jobTitle}
                  </Text>

                  <View
                    style={styles.verifiedRow}
                  >
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={14}
                      color="#277A46"
                    />

                    <Text
                      style={styles.verifiedText}
                    >
                      Verified council account
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.navigationTitle}>
                MAIN MENU
              </Text>

              <View style={styles.navigation}>
                {navigationItems.map((item) => {
                  const active =
                    item.route ===
                    "/council/dashboard";

                  return (
                    <Pressable
                      key={item.label}
                      onPress={() =>
                        navigateTo(item.route)
                      }
                      style={({ pressed }) => [
                        styles.navigationItem,
                        active &&
                          styles.activeNavigationItem,
                        pressed &&
                          styles.pressedNavigationItem,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={21}
                        color={
                          active
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />

                      <Text
                        style={[
                          styles.navigationLabel,
                          active &&
                            styles.activeNavigationLabel,
                        ]}
                      >
                        {item.label}
                      </Text>

                      {item.badge ? (
                        <View
                          style={
                            styles.navigationBadge
                          }
                        >
                          <Text
                            style={
                              styles.navigationBadgeText
                            }
                          >
                            {item.badge}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.sidebarFooter}>
                <View
                  style={styles.councilInformation}
                >
                  <View style={styles.councilIcon}>
                    <MaterialCommunityIcons
                      name="office-building-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={
                      styles.councilInformationText
                    }
                  >
                    <Text
                      style={styles.councilName}
                    >
                      {councilName}
                    </Text>

                    <Text
                      style={
                        styles.councilDepartment
                      }
                    >
                      {departmentName}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    pressed &&
                      styles.pressedNavigationItem,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="logout"
                    size={20}
                    color="#B42318"
                  />

                  <Text style={styles.logoutText}>
                    Sign out
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          <View style={styles.mainContent}>
            <Animated.View
              entering={FadeInRight.duration(450)}
              style={styles.topBar}
            >
              <View style={styles.welcomeSection}>
                <Text
                  style={[
                    styles.welcomeTitle,
                    isSmallPhone &&
                      styles.smallWelcomeTitle,
                  ]}
                >
                  {greeting}, {currentUser?.firstName ?? "Inspector"}
                </Text>

                <Text
                  style={styles.welcomeDescription}
                >
                  Here is your council inspection overview for {todayLabel}.
                </Text>
              </View>

              {isDesktop ? (
                <View style={styles.topBarActions}>
                  <Menu
                    visible={
                      notificationMenuVisible
                    }
                    onDismiss={() =>
                      setNotificationMenuVisible(
                        false
                      )
                    }
                    anchor={
                      <View>
                        <IconButton
                          icon="bell-outline"
                          size={23}
                          iconColor={
                            colors.textPrimary
                          }
                          style={
                            styles.topIconButton
                          }
                          onPress={() =>
                            setNotificationMenuVisible(
                              true
                            )
                          }
                        />

                        <Badge
                          style={
                            styles.notificationBadge
                          }
                        >
                          3
                        </Badge>
                      </View>
                    }
                    contentStyle={
                      styles.notificationMenu
                    }
                  >
                    <Menu.Item
                      leadingIcon="alert-circle-outline"
                      title="Urgent inspection assigned"
                      onPress={() => {
                        setNotificationMenuVisible(
                          false
                        );
                        navigateTo(
                          "/council/inspections"
                        );
                      }}
                    />

                    <Menu.Item
                      leadingIcon="message-text-outline"
                      title="3 unread messages"
                      onPress={() => {
                        setNotificationMenuVisible(
                          false
                        );
                        navigateTo(
                          "/council/messages"
                        );
                      }}
                    />
                  </Menu>

                  <Menu
                    visible={profileMenuVisible}
                    onDismiss={() =>
                      setProfileMenuVisible(false)
                    }
                    anchor={
                      <Pressable
                        style={styles.headerProfile}
                        onPress={() =>
                          setProfileMenuVisible(
                            true
                          )
                        }
                      >
                        <Avatar.Text
                          size={38}
                          label={initials}
                          labelStyle={
                            styles.smallAvatarLabel
                          }
                          style={
                            styles.smallAvatar
                          }
                        />

                        <View>
                          <Text
                            style={
                              styles.headerProfileName
                            }
                          >
                            {displayName}
                          </Text>

                          <Text
                            style={
                              styles.headerProfileRole
                            }
                          >
                            {jobTitle}
                          </Text>
                        </View>

                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={18}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    }
                  >
                    <Menu.Item
                      leadingIcon="account-outline"
                      title="Account settings"
                      onPress={() => {
                        setProfileMenuVisible(false);
                        navigateTo(
                          "/council/settings"
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
              ) : null}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(100).duration(450)}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <MaterialCommunityIcons
                    name="calendar-today-outline"
                    size={17}
                    color={colors.primary}
                  />

                  <Text style={styles.heroBadgeText}>
                    TODAY'S INSPECTIONS
                  </Text>
                </View>

                <Text style={styles.heroTitle}>
                  You have 2 property inspections scheduled
                  today.
                </Text>

                <Text
                  style={styles.heroDescription}
                >
                  Your first inspection begins at 10:00 AM
                  at 14 Wellington Avenue. One case has been
                  marked as urgent.
                </Text>

                <View style={styles.heroActions}>
                  <Button
                    mode="contained"
                    icon="clipboard-search-outline"
                    buttonColor={colors.primary}
                    contentStyle={
                      styles.heroPrimaryButtonContent
                    }
                    labelStyle={
                      styles.heroButtonLabel
                    }
                    style={
                      styles.heroPrimaryButton
                    }
                    onPress={() =>
                      navigateTo(
                        "/council/inspections"
                      )
                    }
                  >
                    View inspections
                  </Button>

                  <Button
                    mode="outlined"
                    icon="calendar-outline"
                    textColor={colors.primary}
                    contentStyle={
                      styles.heroSecondaryButtonContent
                    }
                    labelStyle={
                      styles.heroSecondaryButtonLabel
                    }
                    style={
                      styles.heroSecondaryButton
                    }
                    onPress={() =>
                      showMessage(
                        "Inspection calendar opened."
                      )
                    }
                  >
                    View calendar
                  </Button>
                </View>
              </View>

              {isTablet ? (
                <View style={styles.heroIllustration}>
                  <View
                    style={
                      styles.heroIllustrationCircle
                    }
                  >
                    <MaterialCommunityIcons
                      name="clipboard-search-outline"
                      size={62}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={styles.heroFloatingCard}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={20}
                      color="#B42318"
                    />

                    <View>
                      <Text
                        style={
                          styles.heroFloatingTitle
                        }
                      >
                        Next inspection
                      </Text>

                      <Text
                        style={
                          styles.heroFloatingText
                        }
                      >
                        10:00 AM · Leeds LS6
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </Animated.View>

            <View style={styles.statisticsGrid}>
              <StatisticCard
                delay={150}
                icon="clipboard-clock-outline"
                label="Scheduled"
                value={String(inspections.length)}
                description="Next 7 days"
                background={colors.primaryLight}
                iconColor={colors.primary}
              />

              <StatisticCard
                delay={210}
                icon="progress-clock"
                label="In progress"
                value={String(urgentCount)}
                description="Require action"
                background="#FFF4E5"
                iconColor="#B56400"
              />

              <StatisticCard
                delay={270}
                icon="file-check-outline"
                label="Completed"
                value={String(completedCount)}
                description="This month"
                background="#E8F7EE"
                iconColor="#277A46"
              />

              <StatisticCard
                delay={330}
                icon="alert-circle-outline"
                label="Urgent cases"
                value="2"
                description="High priority"
                background="#FDECEC"
                iconColor="#B42318"
              />
            </View>

            <View
              style={[
                styles.contentGrid,
                isDesktop &&
                  styles.desktopContentGrid,
              ]}
            >
              <Animated.View
                entering={FadeInDown.delay(260).duration(450)}
                style={styles.inspectionsCard}
              >
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>
                      Upcoming inspections
                    </Text>

                    <Text
                      style={styles.sectionDescription}
                    >
                      Your next assigned property visits
                    </Text>
                  </View>

                  <Pressable
                    style={styles.viewAllButton}
                    onPress={() =>
                      navigateTo(
                        "/council/inspections"
                      )
                    }
                  >
                    <Text
                      style={styles.viewAllButtonText}
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

                <View style={styles.inspectionList}>
                  {inspections.map(
                    (inspection, index) => (
                      <InspectionCard
                        key={inspection.id}
                        inspection={inspection}
                        index={index}
                        onPress={() =>
                          handleInspectionPress(
                            inspection
                          )
                        }
                      />
                    )
                  )}
                </View>
              </Animated.View>

              <View style={styles.rightColumn}>
                <Animated.View
                  entering={FadeInDown.delay(320).duration(450)}
                  style={styles.progressCard}
                >
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text
                        style={styles.sectionTitle}
                      >
                        Monthly progress
                      </Text>

                      <Text
                        style={
                          styles.sectionDescription
                        }
                      >
                        Live inspection performance
                      </Text>
                    </View>

                    <View style={styles.monthBadge}>
                      <Text
                        style={styles.monthBadgeText}
                      >
                        LIVE
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.progressSummary}
                  >
                    <View>
                      <Text
                        style={
                          styles.progressPercentage
                        }
                      >
                        {inspections.length ? Math.round((completedCount / inspections.length) * 100) : 0}%
                      </Text>

                      <Text
                        style={
                          styles.progressSummaryLabel
                        }
                      >
                        Monthly target
                      </Text>
                    </View>

                    <View
                      style={
                        styles.progressSummaryIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="chart-donut"
                        size={32}
                        color={colors.primary}
                      />
                    </View>
                  </View>

                  <View
                    style={styles.progressItems}
                  >
                    {monthlyProgress.map((item) => {
                      const progress =
                        item.value / item.total;

                      return (
                        <View
                          key={item.label}
                          style={styles.progressItem}
                        >
                          <View
                            style={
                              styles.progressItemHeader
                            }
                          >
                            <Text
                              style={
                                styles.progressItemLabel
                              }
                            >
                              {item.label}
                            </Text>

                            <Text
                              style={
                                styles.progressItemValue
                              }
                            >
                              {item.value}/{item.total}
                            </Text>
                          </View>

                          <ProgressBar
                            progress={progress}
                            color={colors.primary}
                            style={
                              styles.progressBar
                            }
                          />
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.performanceNotice}>
                    <MaterialCommunityIcons
                      name="trending-up"
                      size={21}
                      color="#277A46"
                    />

                    <Text
                      style={
                        styles.performanceNoticeText
                      }
                    >
                      This progress is calculated from your live assigned inspection cases.
                    </Text>
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(380).duration(450)}
                  style={styles.quickActionsCard}
                >
                  <Text style={styles.sectionTitle}>
                    Quick actions
                  </Text>

                  <Text
                    style={styles.sectionDescription}
                  >
                    Common council inspection tasks
                  </Text>

                  <View style={styles.quickActionsGrid}>
                    <QuickAction
                      icon="clipboard-plus-outline"
                      title="New inspection"
                      onPress={() =>
                        navigateTo(
                          "/council/inspections"
                        )
                      }
                    />

                    <QuickAction
                      icon="file-document-edit-outline"
                      title="Create report"
                      onPress={() =>
                        navigateTo(
                          "/council/reports"
                        )
                      }
                    />

                    <QuickAction
                      icon="message-plus-outline"
                      title="New message"
                      onPress={() =>
                        navigateTo(
                          "/council/messages"
                        )
                      }
                    />

                    <QuickAction
                      icon="magnify"
                      title="Find property"
                      onPress={() =>
                        showMessage(
                          "Property search opened."
                        )
                      }
                    />
                  </View>
                </Animated.View>
              </View>
            </View>

            <Animated.View
              entering={FadeInDown.delay(420).duration(450)}
              style={styles.activityCard}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Recent activity
                  </Text>

                  <Text
                    style={styles.sectionDescription}
                  >
                    Latest updates across your council
                    account
                  </Text>
                </View>

                <IconButton
                  icon="refresh"
                  size={20}
                  iconColor={colors.primary}
                  style={styles.refreshButton}
                  onPress={() => void loadDashboard()}
                />
              </View>

              <View style={styles.activityList}>
                {recentActivities.map(
                  (activity, index) => (
                    <View
                      key={activity.id}
                      style={[
                        styles.activityItem,
                        index <
                          recentActivities.length - 1 &&
                          styles.activityItemBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.activityIcon,
                          {
                            backgroundColor:
                              activity.background,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={activity.icon}
                          size={21}
                          color={
                            activity.iconColor
                          }
                        />
                      </View>

                      <View
                        style={styles.activityContent}
                      >
                        <Text
                          style={styles.activityTitle}
                        >
                          {activity.title}
                        </Text>

                        <Text
                          style={
                            styles.activityDescription
                          }
                        >
                          {activity.description}
                        </Text>
                      </View>

                      <Text
                        style={styles.activityTime}
                      >
                        {activity.time}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </Animated.View>
          </View>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() =>
          setSnackbarVisible(false)
        }
        duration={2800}
        action={{
          label: "Close",
          onPress: () =>
            setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScreenContainer>
  );
}

function StatisticCard({
  delay,
  icon,
  label,
  value,
  description,
  background,
  iconColor,
}: {
  delay: number;
  icon: IconName;
  label: string;
  value: string;
  description: string;
  background: string;
  iconColor: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(420)}
      style={styles.statisticCard}
    >
      <View
        style={[
          styles.statisticIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={iconColor}
        />
      </View>

      <View style={styles.statisticContent}>
        <Text style={styles.statisticLabel}>
          {label}
        </Text>

        <Text style={styles.statisticValue}>
          {value}
        </Text>

        <Text
          style={styles.statisticDescription}
        >
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

function InspectionCard({
  inspection,
  index,
  onPress,
}: {
  inspection: Inspection;
  index: number;
  onPress: () => void;
}) {
  const statusStyle = getStatusStyle(
    inspection.status
  );

  const priorityStyle = getPriorityStyle(
    inspection.priority
  );

  return (
    <Animated.View
      entering={FadeIn.delay(index * 70).duration(350)}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.inspectionItem,
          pressed && styles.pressedInspectionItem,
        ]}
      >
        <View style={styles.inspectionDate}>
          <Text style={styles.inspectionDay}>
            {inspection.date.split(" ")[0]}
          </Text>

          <Text style={styles.inspectionMonth}>
            {inspection.date
              .split(" ")[1]
              .slice(0, 3)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.inspectionContent}>
          <View
            style={styles.inspectionTitleRow}
          >
            <Text
              style={styles.inspectionProperty}
              numberOfLines={1}
            >
              {inspection.property}
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    statusStyle.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: statusStyle.text,
                  },
                ]}
              >
                {inspection.status}
              </Text>
            </View>
          </View>

          <View style={styles.inspectionMetaRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={15}
              color={colors.textMuted}
            />

            <Text
              style={styles.inspectionMetaText}
            >
              {inspection.address}
            </Text>
          </View>

          <View style={styles.inspectionMetaRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={15}
              color={colors.textMuted}
            />

            <Text
              style={styles.inspectionMetaText}
            >
              {inspection.time} · {inspection.type}
            </Text>
          </View>

          <View style={styles.inspectionFooter}>
            <View style={styles.landlordRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={15}
                color={colors.textMuted}
              />

              <Text
                style={styles.landlordText}
              >
                {inspection.landlord}
              </Text>
            </View>

            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    priorityStyle.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  {
                    color: priorityStyle.text,
                  },
                ]}
              >
                {inspection.priority} priority
              </Text>
            </View>
          </View>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
}

function QuickAction({
  icon,
  title,
  onPress,
}: {
  icon: IconName;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressedQuickAction,
      ]}
    >
      <View style={styles.quickActionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <Text style={styles.quickActionTitle}>
        {title}
      </Text>
    </Pressable>
  );
}

function getStatusStyle(
  status: InspectionStatus
) {
  switch (status) {
    case "Urgent":
      return {
        background: "#FDECEC",
        text: "#B42318",
      };

    case "In Progress":
      return {
        background: "#FFF4E5",
        text: "#B56400",
      };

    case "Completed":
      return {
        background: "#E8F7EE",
        text: "#277A46",
      };

    default:
      return {
        background: colors.primaryLight,
        text: colors.primary,
      };
  }
}

function getPriorityStyle(priority: Priority) {
  switch (priority) {
    case "High":
      return {
        background: "#FDECEC",
        text: "#B42318",
      };

    case "Medium":
      return {
        background: "#FFF4E5",
        text: "#B56400",
      };

    default:
      return {
        background: colors.background,
        text: colors.textSecondary,
      };
  }
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  page: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },

  mobileHeader: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  mobileBrandLogo: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  mobileBrandName: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  mobileBrandSubtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  mobileHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  mobileBadge: {
    position: "absolute",
    top: 5,
    right: 4,
    backgroundColor: "#B42318",
  },

  mobileNavigation: {
    margin: spacing.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  mobileNavigationItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  activeMobileNavigationItem: {
    backgroundColor: colors.primaryLight,
  },

  mobileNavigationLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  activeMobileNavigationLabel: {
    color: colors.primary,
    fontWeight: "900",
  },

  mobileDivider: {
    marginVertical: spacing.sm,
  },

  mobileLogoutButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },

  mobileLogoutText: {
    color: "#B42318",
    fontSize: 10,
    fontWeight: "900",
  },

  dashboardLayout: {
    width: "100%",
    maxWidth: 1600,
    alignSelf: "center",
  },

  desktopDashboardLayout: {
    minHeight: 900,
    flexDirection: "row",
  },

  sidebar: {
    width: 280,
    minHeight: 900,
    padding: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },

  brandLogo: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
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
    fontSize: 8,
    fontWeight: "700",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  avatar: {
    backgroundColor: colors.primary,
  },

  avatarLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },

  profileInformation: {
    flex: 1,
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  verifiedText: {
    color: "#277A46",
    fontSize: 7,
    fontWeight: "700",
  },

  navigationTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  navigation: {
    gap: 5,
  },

  navigationItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  activeNavigationItem: {
    backgroundColor: colors.primaryLight,
  },

  pressedNavigationItem: {
    opacity: 0.68,
  },

  navigationLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  activeNavigationLabel: {
    color: colors.primary,
    fontWeight: "900",
  },

  navigationBadge: {
    minWidth: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  navigationBadgeText: {
    color: colors.white,
    fontSize: 7,
    fontWeight: "900",
  },

  sidebarFooter: {
    marginTop: "auto",
    paddingTop: spacing.xl,
  },

  councilInformation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  councilIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  councilInformationText: {
    flex: 1,
  },

  councilName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  councilDepartment: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 7,
  },

  logoutButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  logoutText: {
    color: "#B42318",
    fontSize: 9,
    fontWeight: "900",
  },

  mainContent: {
    flex: 1,
    minWidth: 0,
    padding: spacing.lg,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  welcomeSection: {
    flex: 1,
  },

  welcomeTitle: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },

  smallWelcomeTitle: {
    fontSize: 27,
    lineHeight: 34,
  },

  welcomeDescription: {
    ...typography.bodyMedium,
    marginTop: 5,
    color: colors.textSecondary,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  topIconButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#B42318",
  },

  notificationMenu: {
    width: 280,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  smallAvatar: {
    backgroundColor: colors.primary,
  },

  smallAvatarLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  headerProfileName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  headerProfileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
  },

  heroCard: {
    minHeight: 250,
    flexDirection: "row",
    overflow: "hidden",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },

  heroContent: {
    flex: 1,
    justifyContent: "center",
  },

  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.white,
  },

  heroBadgeText: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    maxWidth: 680,
    marginTop: spacing.lg,
    color: colors.white,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
  },

  heroDescription: {
    maxWidth: 700,
    marginTop: spacing.md,
    color: "#E6E9FF",
    fontSize: 10,
    lineHeight: 19,
  },

  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  heroPrimaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  heroPrimaryButtonContent: {
    minHeight: 47,
    flexDirection: "row-reverse",
  },

  heroButtonLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  heroSecondaryButton: {
    borderColor: "#D5DAFF",
    borderRadius: radius.md,
  },

  heroSecondaryButtonContent: {
    minHeight: 47,
  },

  heroSecondaryButtonLabel: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },

  heroIllustration: {
    width: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  heroIllustrationCircle: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  heroFloatingCard: {
    position: "absolute",
    right: 2,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,

    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  heroFloatingTitle: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  heroFloatingText: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 7,
  },

  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  statisticCard: {
    minWidth: 210,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  statisticIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },

  statisticContent: {
    flex: 1,
  },

  statisticLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  statisticValue: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: "900",
  },

  statisticDescription: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
  },

  contentGrid: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },

  desktopContentGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  inspectionsCard: {
    flex: 1.45,
    minWidth: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  rightColumn: {
    flex: 0.8,
    gap: spacing.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
  },

  viewAllButtonText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  inspectionList: {
    marginTop: spacing.lg,
  },

  inspectionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  pressedInspectionItem: {
    opacity: 0.68,
  },

  inspectionDate: {
    width: 52,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  inspectionDay: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },

  inspectionMonth: {
    marginTop: 1,
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  inspectionContent: {
    flex: 1,
    minWidth: 0,
  },

  inspectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  inspectionProperty: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  inspectionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  inspectionMetaText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 8,
  },

  inspectionFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  landlordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  landlordText: {
    color: colors.textMuted,
    fontSize: 7,
  },

  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },

  priorityBadgeText: {
    fontSize: 6,
    fontWeight: "900",
  },

  progressCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  monthBadge: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  monthBadgeText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  progressSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  progressPercentage: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: "900",
  },

  progressSummaryLabel: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
  },

  progressSummaryIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  progressItems: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },

  progressItem: {
    gap: spacing.sm,
  },

  progressItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressItemLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  progressItemValue: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  progressBar: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },

  performanceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#E8F7EE",
  },

  performanceNoticeText: {
    flex: 1,
    color: "#437854",
    fontSize: 8,
    lineHeight: 15,
  },

  quickActionsCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  quickAction: {
    minWidth: 135,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  pressedQuickAction: {
    opacity: 0.68,
    transform: [{ scale: 0.98 }],
  },

  quickActionIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  quickActionTitle: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
  },

  activityCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  refreshButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },

  activityList: {
    marginTop: spacing.lg,
  },

  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },

  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  activityIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  activityDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  activityTime: {
    color: colors.textMuted,
    fontSize: 7,
    textAlign: "right",
  },
});