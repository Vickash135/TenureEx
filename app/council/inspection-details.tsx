import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
    Button,
    Checkbox,
    Divider,
    IconButton,
    Menu,
    ProgressBar,
    Snackbar,
    TextInput,
} from "react-native-paper";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
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

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  critical?: boolean;
};

type Finding = {
  id: string;
  category: string;
  severity: "Critical" | "Major" | "Minor";
  title: string;
  description: string;
  recommendation: string;
};

type TimelineItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: IconName;
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

const initialChecklist: ChecklistItem[] = [
  {
    id: "check-1",
    title: "External structure",
    description:
      "Check walls, roof, guttering, drainage and visible structural damage.",
    completed: true,
  },
  {
    id: "check-2",
    title: "Internal condition",
    description:
      "Review walls, ceilings, floors, windows and internal decoration.",
    completed: true,
  },
  {
    id: "check-3",
    title: "Damp and mould",
    description:
      "Inspect bedrooms, bathroom and kitchen for damp, mould and condensation.",
    completed: true,
    critical: true,
  },
  {
    id: "check-4",
    title: "Fire safety",
    description:
      "Confirm smoke alarms, escape routes and fire safety equipment.",
    completed: false,
    critical: true,
  },
  {
    id: "check-5",
    title: "Electrical safety",
    description:
      "Check electrical certificates, sockets and visible wiring concerns.",
    completed: false,
  },
  {
    id: "check-6",
    title: "Heating and ventilation",
    description:
      "Review heating system, ventilation and property temperature.",
    completed: false,
  },
  {
    id: "check-7",
    title: "Sanitation facilities",
    description:
      "Inspect bathroom, toilet, drainage and hot water facilities.",
    completed: false,
  },
  {
    id: "check-8",
    title: "Tenant consultation",
    description:
      "Record tenant comments, concerns and access arrangements.",
    completed: false,
  },
];

const findings: Finding[] = [
  {
    id: "finding-1",
    category: "Damp and mould",
    severity: "Critical",
    title: "Severe mould growth in rear bedroom",
    description:
      "Extensive black mould is visible around the external wall, window frame and ceiling corner.",
    recommendation:
      "Arrange urgent mould treatment, investigate water ingress and improve ventilation.",
  },
  {
    id: "finding-2",
    category: "Ventilation",
    severity: "Major",
    title: "Bathroom extractor fan not operational",
    description:
      "The bathroom extractor fan does not activate and there is significant condensation.",
    recommendation:
      "Repair or replace the extractor fan and confirm adequate airflow.",
  },
  {
    id: "finding-3",
    category: "Windows",
    severity: "Minor",
    title: "Damaged bedroom window seal",
    description:
      "The bedroom window seal is worn and allows cold air into the room.",
    recommendation:
      "Replace the damaged seal during the next maintenance visit.",
  },
];

const timeline: TimelineItem[] = [
  {
    id: "timeline-1",
    title: "Inspection created",
    description:
      "Housing Standards team created the inspection after receiving a tenant report.",
    date: "24 July 2026, 9:15 AM",
    icon: "clipboard-plus-outline",
    background: colors.primaryLight,
    iconColor: colors.primary,
  },
  {
    id: "timeline-2",
    title: "Inspector assigned",
    description:
      "Alex Morgan was assigned as the responsible housing inspector.",
    date: "24 July 2026, 10:05 AM",
    icon: "account-check-outline",
    background: "#E8F7EE",
    iconColor: "#277A46",
  },
  {
    id: "timeline-3",
    title: "Access confirmed",
    description:
      "The tenant confirmed access for 30 July 2026 at 10:00 AM.",
    date: "26 July 2026, 2:40 PM",
    icon: "calendar-check-outline",
    background: "#FFF4E5",
    iconColor: "#B56400",
  },
  {
    id: "timeline-4",
    title: "Inspection marked urgent",
    description:
      "Submitted photographs indicated a potentially serious health concern.",
    date: "28 July 2026, 11:20 AM",
    icon: "alert-circle-outline",
    background: "#FDECEC",
    iconColor: "#B42318",
  },
];

export default function CouncilInspectionDetailsScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    inspectionId?: string;
  }>();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;
  const isCompact = width < 520;

  const inspectionId =
    typeof params.inspectionId === "string"
      ? params.inspectionId
      : "INS-2026-1048";

  const [status, setStatus] =
    useState<InspectionStatus>("Urgent");
  const [priority] = useState<Priority>("High");

  const [checklist, setChecklist] =
    useState<ChecklistItem[]>(initialChecklist);

  const [inspectionNotes, setInspectionNotes] =
    useState(
      "Tenant advised that damp and mould has worsened during the past six weeks. The rear bedroom is currently unsuitable for regular use."
    );

  const [mobileMenuVisible, setMobileMenuVisible] =
    useState(false);
  const [profileMenuVisible, setProfileMenuVisible] =
    useState(false);
  const [actionsMenuVisible, setActionsMenuVisible] =
    useState(false);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const completedChecklistCount = useMemo(
    () =>
      checklist.filter((item) => item.completed)
        .length,
    [checklist]
  );

  const checklistProgress =
    completedChecklistCount / checklist.length;

  const statusStyle = getStatusStyle(status);
  const priorityStyle =
    getPriorityStyle(priority);

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const navigateTo = (route: string) => {
    setMobileMenuVisible(false);
    router.push(route as never);
  };

  const handleLogout = () => {
    setProfileMenuVisible(false);

    router.replace(
      "/auth/council/login" as never
    );
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
            }
          : item
      )
    );
  };

  const handleStartInspection = () => {
    setStatus("In Progress");
    showMessage(
      `${inspectionId} has been started.`
    );
  };

  const handleSaveProgress = () => {
    showMessage(
      "Inspection progress and notes saved."
    );
  };

  const handleCompleteInspection = () => {
    if (
      completedChecklistCount <
      checklist.length
    ) {
      showMessage(
        "Complete all checklist items before finishing the inspection."
      );
      return;
    }

    setStatus("Completed");
    showMessage(
      "Inspection completed successfully."
    );
  };

  const handleCreateReport = () => {
    router.push({
      pathname: "/council/reports" as never,
      params: {
        inspectionId,
      },
    });
  };

  const handleMessageTenant = () => {
    router.push({
      pathname: "/council/messages" as never,
      params: {
        contact: "Emily Carter",
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

            <IconButton
              icon={
                mobileMenuVisible ? "close" : "menu"
              }
              size={25}
              iconColor={colors.primary}
              onPress={() =>
                setMobileMenuVisible(
                  !mobileMenuVisible
                )
              }
            />
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
                "/council/inspections";

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
            styles.layout,
            isDesktop && styles.desktopLayout,
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

                  <Text style={styles.brandSubtitle}>
                    Council & Inspection Portal
                  </Text>
                </View>
              </Pressable>

              <View style={styles.profileCard}>
                <Avatar.Text
                  size={48}
                  label="AM"
                  labelStyle={styles.avatarLabel}
                  style={styles.avatar}
                />

                <View style={styles.profileInformation}>
                  <Text style={styles.profileName}>
                    Alex Morgan
                  </Text>

                  <Text style={styles.profileRole}>
                    Housing Inspector
                  </Text>

                  <View style={styles.verifiedRow}>
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
                    "/council/inspections";

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
                      Leeds City Council
                    </Text>

                    <Text
                      style={
                        styles.councilDepartment
                      }
                    >
                      Housing Standards
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
              <View style={styles.headingSection}>
                <View style={styles.breadcrumbRow}>
                  <Pressable
                    onPress={() =>
                      navigateTo(
                        "/council/dashboard"
                      )
                    }
                  >
                    <Text
                      style={styles.breadcrumbLink}
                    >
                      Dashboard
                    </Text>
                  </Pressable>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={15}
                    color={colors.textMuted}
                  />

                  <Pressable
                    onPress={() =>
                      navigateTo(
                        "/council/inspections"
                      )
                    }
                  >
                    <Text
                      style={styles.breadcrumbLink}
                    >
                      Inspections
                    </Text>
                  </Pressable>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={15}
                    color={colors.textMuted}
                  />

                  <Text
                    style={styles.breadcrumbCurrent}
                  >
                    {inspectionId}
                  </Text>
                </View>

                <View style={styles.titleRow}>
                  <Pressable
                    style={styles.backButton}
                    onPress={() =>
                      router.back()
                    }
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>

                  <View style={styles.titleText}>
                    <Text style={styles.pageTitle}>
                      Inspection details
                    </Text>

                    <Text
                      style={styles.pageDescription}
                    >
                      Review property information, complete
                      the checklist and record inspection
                      findings.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.topBarActions}>
                <Menu
                  visible={actionsMenuVisible}
                  onDismiss={() =>
                    setActionsMenuVisible(false)
                  }
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={23}
                      iconColor={colors.primary}
                      style={styles.actionMenuButton}
                      onPress={() =>
                        setActionsMenuVisible(true)
                      }
                    />
                  }
                >
                  <Menu.Item
                    leadingIcon="calendar-edit"
                    title="Reschedule inspection"
                    onPress={() => {
                      setActionsMenuVisible(false);
                      showMessage(
                        "Reschedule form opened."
                      );
                    }}
                  />

                  <Menu.Item
                    leadingIcon="account-switch-outline"
                    title="Reassign inspector"
                    onPress={() => {
                      setActionsMenuVisible(false);
                      showMessage(
                        "Inspector assignment opened."
                      );
                    }}
                  />

                  <Menu.Item
                    leadingIcon="cancel"
                    title="Cancel inspection"
                    onPress={() => {
                      setActionsMenuVisible(false);
                      showMessage(
                        "Inspection cancellation requested."
                      );
                    }}
                  />
                </Menu>

                {isDesktop ? (
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
                          label="AM"
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
                            Alex Morgan
                          </Text>

                          <Text
                            style={
                              styles.headerProfileRole
                            }
                          >
                            Housing Inspector
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
                ) : null}
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(80).duration(450)}
              style={styles.summaryCard}
            >
              <View style={styles.summaryHeader}>
                <View style={styles.propertyIcon}>
                  <MaterialCommunityIcons
                    name="home-search-outline"
                    size={30}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.propertyHeading}>
                  <Text style={styles.inspectionId}>
                    {inspectionId}
                  </Text>

                  <Text style={styles.propertyName}>
                    14 Wellington Avenue
                  </Text>

                  <View style={styles.addressRow}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={17}
                      color={colors.textMuted}
                    />

                    <Text style={styles.addressText}>
                      14 Wellington Avenue, Leeds, LS6 2AB
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryBadges}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          statusStyle.background,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={statusStyle.icon}
                      size={15}
                      color={statusStyle.text}
                    />

                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: statusStyle.text,
                        },
                      ]}
                    >
                      {status}
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
                      {priority} priority
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryInformation}>
                <SummaryInformationItem
                  icon="calendar-outline"
                  label="Inspection date"
                  value="30 July 2026"
                />

                <SummaryInformationItem
                  icon="clock-outline"
                  label="Time"
                  value="10:00 AM"
                />

                <SummaryInformationItem
                  icon="clipboard-text-outline"
                  label="Inspection type"
                  value="Housing standards"
                />

                <SummaryInformationItem
                  icon="account-tie-outline"
                  label="Inspector"
                  value="Alex Morgan"
                />
              </View>

              <View style={styles.summaryActions}>
                {status === "Urgent" ||
                status === "Scheduled" ? (
                  <Button
                    mode="contained"
                    icon="play-circle-outline"
                    buttonColor={colors.primary}
                    onPress={handleStartInspection}
                    contentStyle={
                      styles.primaryActionContent
                    }
                    labelStyle={
                      styles.primaryActionLabel
                    }
                    style={styles.primaryAction}
                  >
                    Start inspection
                  </Button>
                ) : null}

                <Button
                  mode="outlined"
                  icon="message-text-outline"
                  textColor={colors.primary}
                  onPress={handleMessageTenant}
                  contentStyle={
                    styles.secondaryActionContent
                  }
                  labelStyle={
                    styles.secondaryActionLabel
                  }
                  style={styles.secondaryAction}
                >
                  Message tenant
                </Button>

                <Button
                  mode="outlined"
                  icon="map-marker-path"
                  textColor={colors.primary}
                  onPress={() =>
                    showMessage(
                      "Property directions opened."
                    )
                  }
                  contentStyle={
                    styles.secondaryActionContent
                  }
                  labelStyle={
                    styles.secondaryActionLabel
                  }
                  style={styles.secondaryAction}
                >
                  Directions
                </Button>
              </View>
            </Animated.View>

            <View
              style={[
                styles.contentLayout,
                isDesktop &&
                  styles.desktopContentLayout,
              ]}
            >
              <View style={styles.leftColumn}>
                <Animated.View
                  entering={FadeInDown.delay(140).duration(450)}
                  style={styles.sectionCard}
                >
                  <SectionHeader
                    icon="home-city-outline"
                    title="Property information"
                    description="Registered property and occupancy details"
                  />

                  <View style={styles.informationGrid}>
                    <InformationField
                      label="Property type"
                      value="Terraced house"
                    />

                    <InformationField
                      label="Bedrooms"
                      value="3 bedrooms"
                    />

                    <InformationField
                      label="Occupancy"
                      value="Single household"
                    />

                    <InformationField
                      label="Tenancy started"
                      value="12 February 2024"
                    />

                    <InformationField
                      label="Council reference"
                      value="PROP-LDS-88412"
                    />

                    <InformationField
                      label="Previous inspection"
                      value="18 January 2025"
                    />
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(200).duration(450)}
                  style={styles.sectionCard}
                >
                  <SectionHeader
                    icon="account-group-outline"
                    title="People and contacts"
                    description="Tenant, landlord and responsible officer"
                  />

                  <View style={styles.contactList}>
                    <ContactCard
                      initials="EC"
                      name="Emily Carter"
                      role="Tenant"
                      email="emily.carter@example.com"
                      phone="+44 7700 900321"
                      onMessage={handleMessageTenant}
                    />

                    <ContactCard
                      initials="DM"
                      name="Daniel Morgan"
                      role="Landlord"
                      email="daniel.morgan@example.com"
                      phone="+44 7700 900458"
                      onMessage={() =>
                        router.push({
                          pathname:
                            "/council/messages" as never,
                          params: {
                            contact: "Daniel Morgan",
                          },
                        })
                      }
                    />

                    <ContactCard
                      initials="AM"
                      name="Alex Morgan"
                      role="Assigned inspector"
                      email="alex.morgan@leeds.gov.uk"
                      phone="0113 000 4582"
                      onMessage={() =>
                        showMessage(
                          "Inspector profile opened."
                        )
                      }
                    />
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(260).duration(450)}
                  style={styles.sectionCard}
                >
                  <View style={styles.checklistHeader}>
                    <SectionHeader
                      icon="clipboard-check-outline"
                      title="Inspection checklist"
                      description={`${completedChecklistCount} of ${checklist.length} checks completed`}
                    />

                    <View style={styles.progressValue}>
                      <Text
                        style={styles.progressValueText}
                      >
                        {Math.round(
                          checklistProgress * 100
                        )}
                        %
                      </Text>
                    </View>
                  </View>

                  <ProgressBar
                    progress={checklistProgress}
                    color={colors.primary}
                    style={styles.checklistProgress}
                  />

                  <View style={styles.checklist}>
                    {checklist.map(
                      (item, index) => (
                        <Animated.View
                          key={item.id}
                          entering={FadeIn.delay(
                            index * 45
                          ).duration(280)}
                        >
                          <Pressable
                            onPress={() =>
                              toggleChecklistItem(
                                item.id
                              )
                            }
                            style={({ pressed }) => [
                              styles.checklistItem,
                              item.completed &&
                                styles.completedChecklistItem,
                              pressed &&
                                styles.pressedItem,
                            ]}
                          >
                            <Checkbox
                              status={
                                item.completed
                                  ? "checked"
                                  : "unchecked"
                              }
                              onPress={() =>
                                toggleChecklistItem(
                                  item.id
                                )
                              }
                              color={colors.primary}
                            />

                            <View
                              style={
                                styles.checklistText
                              }
                            >
                              <View
                                style={
                                  styles.checklistTitleRow
                                }
                              >
                                <Text
                                  style={[
                                    styles.checklistTitle,
                                    item.completed &&
                                      styles.completedChecklistTitle,
                                  ]}
                                >
                                  {item.title}
                                </Text>

                                {item.critical ? (
                                  <View
                                    style={
                                      styles.criticalBadge
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.criticalBadgeText
                                      }
                                    >
                                      CRITICAL
                                    </Text>
                                  </View>
                                ) : null}
                              </View>

                              <Text
                                style={
                                  styles.checklistDescription
                                }
                              >
                                {item.description}
                              </Text>
                            </View>
                          </Pressable>
                        </Animated.View>
                      )
                    )}
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(320).duration(450)}
                  style={styles.sectionCard}
                >
                  <SectionHeader
                    icon="alert-box-outline"
                    title="Recorded findings"
                    description={`${findings.length} issues identified during this inspection`}
                  />

                  <View style={styles.findingsList}>
                    {findings.map((finding) => {
                      const severityStyle =
                        getSeverityStyle(
                          finding.severity
                        );

                      return (
                        <View
                          key={finding.id}
                          style={styles.findingCard}
                        >
                          <View
                            style={
                              styles.findingHeader
                            }
                          >
                            <View
                              style={[
                                styles.findingIcon,
                                {
                                  backgroundColor:
                                    severityStyle.background,
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={
                                  severityStyle.icon
                                }
                                size={22}
                                color={
                                  severityStyle.text
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.findingHeading
                              }
                            >
                              <Text
                                style={
                                  styles.findingCategory
                                }
                              >
                                {finding.category}
                              </Text>

                              <Text
                                style={
                                  styles.findingTitle
                                }
                              >
                                {finding.title}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.severityBadge,
                                {
                                  backgroundColor:
                                    severityStyle.background,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.severityBadgeText,
                                  {
                                    color:
                                      severityStyle.text,
                                  },
                                ]}
                              >
                                {finding.severity}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={
                              styles.findingDescription
                            }
                          >
                            {finding.description}
                          </Text>

                          <View
                            style={
                              styles.recommendationBox
                            }
                          >
                            <MaterialCommunityIcons
                              name="lightbulb-outline"
                              size={18}
                              color={colors.primary}
                            />

                            <View
                              style={
                                styles.recommendationText
                              }
                            >
                              <Text
                                style={
                                  styles.recommendationLabel
                                }
                              >
                                Recommended action
                              </Text>

                              <Text
                                style={
                                  styles.recommendationValue
                                }
                              >
                                {
                                  finding.recommendation
                                }
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <Button
                    mode="outlined"
                    icon="plus-circle-outline"
                    textColor={colors.primary}
                    style={styles.addFindingButton}
                    onPress={() =>
                      showMessage(
                        "New finding form opened."
                      )
                    }
                  >
                    Add another finding
                  </Button>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(380).duration(450)}
                  style={styles.sectionCard}
                >
                  <SectionHeader
                    icon="note-edit-outline"
                    title="Inspector notes"
                    description="Save observations and supporting information"
                  />

                  <TextInput
                    mode="outlined"
                    label="Inspection notes"
                    placeholder="Enter inspection observations"
                    value={inspectionNotes}
                    onChangeText={setInspectionNotes}
                    multiline
                    numberOfLines={7}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={styles.notesInput}
                  />

                  <View style={styles.notesFooter}>
                    <Text style={styles.notesHelpText}>
                      These notes will be included in the
                      inspection record.
                    </Text>

                    <Button
                      mode="outlined"
                      icon="content-save-outline"
                      textColor={colors.primary}
                      onPress={handleSaveProgress}
                      style={styles.saveNotesButton}
                    >
                      Save notes
                    </Button>
                  </View>
                </Animated.View>
              </View>

              <View style={styles.rightColumn}>
                <Animated.View
                  entering={FadeInDown.delay(180).duration(450)}
                  style={styles.sideCard}
                >
                  <SectionHeader
                    icon="calendar-clock-outline"
                    title="Visit details"
                    description="Inspection appointment"
                  />

                  <View style={styles.visitDateCard}>
                    <View style={styles.visitDateIcon}>
                      <MaterialCommunityIcons
                        name="calendar"
                        size={30}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.visitDateText}>
                      <Text style={styles.visitDate}>
                        Thursday, 30 July 2026
                      </Text>

                      <Text style={styles.visitTime}>
                        10:00 AM – 11:30 AM
                      </Text>
                    </View>
                  </View>

                  <View style={styles.visitInformation}>
                    <SideInformationRow
                      icon="map-marker-outline"
                      label="Location"
                      value="14 Wellington Avenue, Leeds, LS6 2AB"
                    />

                    <SideInformationRow
                      icon="account-key-outline"
                      label="Property access"
                      value="Tenant will provide access"
                    />

                    <SideInformationRow
                      icon="car-outline"
                      label="Travel estimate"
                      value="18 minutes from council office"
                    />

                    <SideInformationRow
                      icon="weather-partly-cloudy"
                      label="Weather note"
                      value="Light rain expected"
                    />
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(240).duration(450)}
                  style={styles.sideCard}
                >
                  <SectionHeader
                    icon="paperclip"
                    title="Documents"
                    description="Inspection evidence and files"
                  />

                  <View style={styles.documentList}>
                    <DocumentItem
                      icon="file-image-outline"
                      title="Tenant mould photographs"
                      details="4 images · 8.2 MB"
                    />

                    <DocumentItem
                      icon="file-document-outline"
                      title="Previous inspection report"
                      details="PDF · 1.4 MB"
                    />

                    <DocumentItem
                      icon="file-certificate-outline"
                      title="Gas safety certificate"
                      details="PDF · 620 KB"
                    />

                    <DocumentItem
                      icon="file-table-outline"
                      title="Property compliance record"
                      details="PDF · 980 KB"
                    />
                  </View>

                  <Button
                    mode="outlined"
                    icon="upload-outline"
                    textColor={colors.primary}
                    style={styles.uploadButton}
                    onPress={() =>
                      showMessage(
                        "Document upload opened."
                      )
                    }
                  >
                    Upload document
                  </Button>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(300).duration(450)}
                  style={styles.sideCard}
                >
                  <SectionHeader
                    icon="history"
                    title="Inspection history"
                    description="Recent case activity"
                  />

                  <View style={styles.timeline}>
                    {timeline.map(
                      (item, index) => (
                        <View
                          key={item.id}
                          style={styles.timelineItem}
                        >
                          <View
                            style={
                              styles.timelineIndicator
                            }
                          >
                            <View
                              style={[
                                styles.timelineIcon,
                                {
                                  backgroundColor:
                                    item.background,
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={item.icon}
                                size={18}
                                color={
                                  item.iconColor
                                }
                              />
                            </View>

                            {index <
                            timeline.length - 1 ? (
                              <View
                                style={
                                  styles.timelineLine
                                }
                              />
                            ) : null}
                          </View>

                          <View
                            style={
                              styles.timelineContent
                            }
                          >
                            <Text
                              style={
                                styles.timelineTitle
                              }
                            >
                              {item.title}
                            </Text>

                            <Text
                              style={
                                styles.timelineDescription
                              }
                            >
                              {item.description}
                            </Text>

                            <Text
                              style={
                                styles.timelineDate
                              }
                            >
                              {item.date}
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(360).duration(450)}
                  style={styles.actionCard}
                >
                  <View style={styles.actionCardIcon}>
                    <MaterialCommunityIcons
                      name="file-check-outline"
                      size={30}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.actionCardTitle}>
                    Complete inspection
                  </Text>

                  <Text
                    style={
                      styles.actionCardDescription
                    }
                  >
                    Save all findings and complete the
                    checklist before submitting the final
                    inspection.
                  </Text>

                  <View
                    style={
                      styles.actionProgressSummary
                    }
                  >
                    <Text
                      style={
                        styles.actionProgressLabel
                      }
                    >
                      Checklist progress
                    </Text>

                    <Text
                      style={
                        styles.actionProgressValue
                      }
                    >
                      {completedChecklistCount}/
                      {checklist.length}
                    </Text>
                  </View>

                  <ProgressBar
                    progress={checklistProgress}
                    color={colors.primary}
                    style={styles.actionProgressBar}
                  />

                  <Button
                    mode="outlined"
                    icon="content-save-outline"
                    textColor={colors.primary}
                    onPress={handleSaveProgress}
                    contentStyle={
                      styles.sideActionContent
                    }
                    style={styles.saveProgressButton}
                  >
                    Save progress
                  </Button>

                  <Button
                    mode="contained"
                    icon="check-circle-outline"
                    buttonColor={colors.primary}
                    onPress={handleCompleteInspection}
                    contentStyle={
                      styles.sideActionContent
                    }
                    style={styles.completeButton}
                  >
                    Complete inspection
                  </Button>

                  <Button
                    mode="text"
                    icon="file-document-edit-outline"
                    textColor={colors.primary}
                    onPress={handleCreateReport}
                  >
                    Create inspection report
                  </Button>
                </Animated.View>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() =>
          setSnackbarVisible(false)
        }
        duration={3000}
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
      <View style={styles.sectionHeaderIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.sectionHeaderText}>
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

function SummaryInformationItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryInformationItem}>
      <View style={styles.summaryInformationIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <View style={styles.summaryInformationText}>
        <Text
          style={styles.summaryInformationLabel}
        >
          {label}
        </Text>

        <Text
          style={styles.summaryInformationValue}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function InformationField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.informationField}>
      <Text style={styles.informationFieldLabel}>
        {label}
      </Text>

      <Text style={styles.informationFieldValue}>
        {value}
      </Text>
    </View>
  );
}

function ContactCard({
  initials,
  name,
  role,
  email,
  phone,
  onMessage,
}: {
  initials: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  onMessage: () => void;
}) {
  return (
    <View style={styles.contactCard}>
      <Avatar.Text
        size={46}
        label={initials}
        labelStyle={styles.contactAvatarLabel}
        style={styles.contactAvatar}
      />

      <View style={styles.contactInformation}>
        <Text style={styles.contactName}>
          {name}
        </Text>

        <Text style={styles.contactRole}>
          {role}
        </Text>

        <View style={styles.contactMetadata}>
          <MaterialCommunityIcons
            name="email-outline"
            size={14}
            color={colors.textMuted}
          />

          <Text style={styles.contactMetadataText}>
            {email}
          </Text>
        </View>

        <View style={styles.contactMetadata}>
          <MaterialCommunityIcons
            name="phone-outline"
            size={14}
            color={colors.textMuted}
          />

          <Text style={styles.contactMetadataText}>
            {phone}
          </Text>
        </View>
      </View>

      <IconButton
        icon="message-text-outline"
        size={20}
        iconColor={colors.primary}
        style={styles.contactMessageButton}
        onPress={onMessage}
      />
    </View>
  );
}

function SideInformationRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.sideInformationRow}>
      <View style={styles.sideInformationIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.primary}
        />
      </View>

      <View style={styles.sideInformationText}>
        <Text style={styles.sideInformationLabel}>
          {label}
        </Text>

        <Text style={styles.sideInformationValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function DocumentItem({
  icon,
  title,
  details,
}: {
  icon: IconName;
  title: string;
  details: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.documentItem,
        pressed && styles.pressedItem,
      ]}
    >
      <View style={styles.documentIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.documentText}>
        <Text style={styles.documentTitle}>
          {title}
        </Text>

        <Text style={styles.documentDetails}>
          {details}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="download-outline"
        size={20}
        color={colors.primary}
      />
    </Pressable>
  );
}

function getStatusStyle(
  status: InspectionStatus
): {
  background: string;
  text: string;
  icon: IconName;
} {
  switch (status) {
    case "Urgent":
      return {
        background: "#FDECEC",
        text: "#B42318",
        icon: "alert-circle-outline",
      };

    case "In Progress":
      return {
        background: "#FFF4E5",
        text: "#B56400",
        icon: "progress-clock",
      };

    case "Completed":
      return {
        background: "#E8F7EE",
        text: "#277A46",
        icon: "check-circle-outline",
      };

    default:
      return {
        background: colors.primaryLight,
        text: colors.primary,
        icon: "calendar-clock-outline",
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

function getSeverityStyle(
  severity: Finding["severity"]
): {
  background: string;
  text: string;
  icon: IconName;
} {
  switch (severity) {
    case "Critical":
      return {
        background: "#FDECEC",
        text: "#B42318",
        icon: "alert-octagon-outline",
      };

    case "Major":
      return {
        background: "#FFF4E5",
        text: "#B56400",
        icon: "alert-outline",
      };

    default:
      return {
        background: colors.primaryLight,
        text: colors.primary,
        icon: "information-outline",
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

  mobileNavigation: {
    margin: spacing.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
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

  layout: {
    width: "100%",
    maxWidth: 1600,
    alignSelf: "center",
  },

  desktopLayout: {
    minHeight: 1000,
    flexDirection: "row",
  },

  sidebar: {
    width: 280,
    minHeight: 1000,
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
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  headingSection: {
    flex: 1,
    minWidth: 250,
  },

  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: spacing.sm,
  },

  breadcrumbLink: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "800",
  },

  breadcrumbCurrent: {
    color: colors.textMuted,
    fontSize: 8,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  titleText: {
    flex: 1,
  },

  pageTitle: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },

  pageDescription: {
    ...typography.bodyMedium,
    maxWidth: 700,
    marginTop: 5,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  actionMenuButton: {
    borderWidth: 1,
    borderColor: colors.border,
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

  summaryCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },

  summaryHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
  },

  propertyIcon: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },

  propertyHeading: {
    flex: 1,
    minWidth: 220,
  },

  inspectionId: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  propertyName: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  addressText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
  },

  summaryBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  priorityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },

  priorityBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  summaryInformation: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  summaryInformationItem: {
    minWidth: 190,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  summaryInformationIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  summaryInformationText: {
    flex: 1,
  },

  summaryInformationLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  summaryInformationValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  summaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  primaryAction: {
    borderRadius: radius.md,
  },

  primaryActionContent: {
    minHeight: 46,
    flexDirection: "row-reverse",
  },

  primaryActionLabel: {
    fontSize: 9,
    fontWeight: "900",
  },

  secondaryAction: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  secondaryActionContent: {
    minHeight: 46,
  },

  secondaryActionLabel: {
    fontSize: 9,
    fontWeight: "900",
  },

  contentLayout: {
    gap: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  desktopContentLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  leftColumn: {
    flex: 1.5,
    gap: spacing.lg,
    minWidth: 0,
  },

  rightColumn: {
    flex: 0.72,
    gap: spacing.lg,
    minWidth: 0,
  },

  sectionCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  sideCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  sectionHeaderIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 14,
  },

  informationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  informationField: {
    minWidth: 190,
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  informationFieldLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  informationFieldValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  contactList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  contactAvatar: {
    backgroundColor: colors.primary,
  },

  contactAvatarLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },

  contactInformation: {
    flex: 1,
    minWidth: 0,
  },

  contactName: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  contactRole: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 7,
    fontWeight: "800",
  },

  contactMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  contactMetadataText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 7,
  },

  contactMessageButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },

  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  progressValue: {
    minWidth: 52,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  progressValueText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  checklistProgress: {
    height: 8,
    marginTop: spacing.lg,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },

  checklist: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  completedChecklistItem: {
    borderColor: "#B8DFCA",
    backgroundColor: "#F1FBF5",
  },

  pressedItem: {
    opacity: 0.7,
  },

  checklistText: {
    flex: 1,
    paddingTop: 7,
    paddingRight: spacing.sm,
  },

  checklistTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  checklistTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  completedChecklistTitle: {
    color: "#277A46",
  },

  criticalBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FDECEC",
  },

  criticalBadgeText: {
    color: "#B42318",
    fontSize: 6,
    fontWeight: "900",
  },

  checklistDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  findingsList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  findingCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  findingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  findingIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },

  findingHeading: {
    flex: 1,
  },

  findingCategory: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  findingTitle: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
  },

  severityBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  findingDescription: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 16,
  },

  recommendationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },

  recommendationText: {
    flex: 1,
  },

  recommendationLabel: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
  },

  recommendationValue: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  addFindingButton: {
    alignSelf: "flex-start",
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  notesInput: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
  },

  notesFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  notesHelpText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 7,
  },

  saveNotesButton: {
    borderColor: colors.primary,
  },

  visitDateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  visitDateIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.white,
  },

  visitDateText: {
    flex: 1,
  },

  visitDate: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  visitTime: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "800",
  },

  visitInformation: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  sideInformationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  sideInformationIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.background,
  },

  sideInformationText: {
    flex: 1,
  },

  sideInformationLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  sideInformationValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 14,
  },

  documentList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  documentIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  documentText: {
    flex: 1,
    minWidth: 0,
  },

  documentTitle: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  documentDetails: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 7,
  },

  uploadButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  timeline: {
    marginTop: spacing.lg,
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
  },

  timelineIndicator: {
    alignItems: "center",
  },

  timelineIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 42,
    backgroundColor: colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },

  timelineTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  timelineDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  timelineDate: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 7,
  },

  actionCard: {
    alignItems: "center",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  actionCardIcon: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  actionCardTitle: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  actionCardDescription: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 16,
    textAlign: "center",
  },

  actionProgressSummary: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },

  actionProgressLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  actionProgressValue: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  actionProgressBar: {
    width: "100%",
    height: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },

  sideActionContent: {
    minHeight: 48,
  },

  saveProgressButton: {
    width: "100%",
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  completeButton: {
    width: "100%",
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },
});