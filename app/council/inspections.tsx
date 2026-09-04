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
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  Searchbar,
  Snackbar
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
  | "Completed"
  | "Cancelled";

type InspectionPriority =
  | "High"
  | "Medium"
  | "Normal";

type InspectionType =
  | "Housing standards"
  | "HMO compliance"
  | "Safety assessment"
  | "Follow-up inspection"
  | "Damp and mould"
  | "Electrical safety";

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
  postcode: string;
  landlord: string;
  tenant: string;
  date: string;
  dateValue: string;
  time: string;
  type: InspectionType;
  status: InspectionStatus;
  priority: InspectionPriority;
  assignedInspector: string;
  notes: string;
};

type StatusFilter =
  | "All"
  | InspectionStatus;

type SortOption =
  | "Nearest date"
  | "Latest date"
  | "Priority"
  | "Property name";

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

const statusFilters: StatusFilter[] = [
  "All",
  "Scheduled",
  "In Progress",
  "Urgent",
  "Completed",
  "Cancelled",
];

const sortOptions: SortOption[] = [
  "Nearest date",
  "Latest date",
  "Priority",
  "Property name",
];

export default function CouncilInspectionsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;
  const isCompact = width < 540;

  const [searchQuery, setSearchQuery] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");
  const [sortOption, setSortOption] =
    useState<SortOption>("Nearest date");

  const [mobileMenuVisible, setMobileMenuVisible] =
    useState(false);
  const [sortMenuVisible, setSortMenuVisible] =
    useState(false);
  const [profileMenuVisible, setProfileMenuVisible] =
    useState(false);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingCases, setLoadingCases] = useState(true);

  const loadInspections = async () => {
    setLoadingCases(true);
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
        const status: InspectionStatus = rawStatus === "CLOSED" || rawStatus === "COMPLETED"
          ? "Completed"
          : rawStatus === "DECLINED"
            ? "Cancelled"
            : rawStatus === "SCHEDULED"
              ? "Scheduled"
              : rawStatus === "ACTION_REQUIRED" || String(row.priority).toUpperCase() === "URGENT"
                ? "Urgent"
                : "In Progress";
        const priority: InspectionPriority = ["HIGH", "URGENT"].includes(String(row.priority).toUpperCase())
          ? "High"
          : String(row.priority).toUpperCase() === "MEDIUM"
            ? "Medium"
            : "Normal";
        const typeLabel = String(row.category ?? "Housing standards").replace(/_/g, " ");
        const type: InspectionType = typeLabel.toLowerCase().includes("damp")
          ? "Damp and mould"
          : typeLabel.toLowerCase().includes("hmo")
            ? "HMO compliance"
            : typeLabel.toLowerCase().includes("electrical")
              ? "Electrical safety"
              : typeLabel.toLowerCase().includes("follow")
                ? "Follow-up inspection"
                : typeLabel.toLowerCase().includes("safety")
                  ? "Safety assessment"
                  : "Housing standards";
        const requester = row.requester ? `${row.requester.firstName ?? ""} ${row.requester.lastName ?? ""}`.trim() : "—";
        return {
          id: row.id,
          property: row.property?.addressLine1 ?? "Property",
          address: [row.property?.addressLine1, row.property?.townCity].filter(Boolean).join(", "),
          postcode: row.property?.postcode ?? "",
          landlord: requester,
          tenant: requester,
          date: scheduled ? scheduled.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Awaiting schedule",
          dateValue: scheduled ? scheduled.toISOString().slice(0, 10) : row.createdAt?.slice?.(0, 10) ?? "9999-12-31",
          time: scheduled ? scheduled.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
          type,
          status,
          priority,
          assignedInspector: row.inspector ? `${row.inspector.firstName ?? ""} ${row.inspector.lastName ?? ""}`.trim() : "Council Inspector",
          notes: row.description ?? "",
        };
      }));
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      setSnackbarMessage(typeof backendMessage === "string" ? backendMessage : "Unable to load inspection cases.");
      setSnackbarVisible(true);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => { void loadInspections(); }, []);

  const displayName = currentUser ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() : "Council Inspector";
  const initials = currentUser ? `${currentUser.firstName?.[0] ?? ""}${currentUser.lastName?.[0] ?? ""}`.toUpperCase() || "CI" : "CI";
  const councilName = currentUser?.councilProfile?.councilName ?? "Council / Local Authority";
  const jobTitle = currentUser?.councilProfile?.jobTitle ?? "Council Inspector";

  const filteredInspections = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    const filtered = inspections.filter(
      (inspection) => {
        const matchesStatus =
          statusFilter === "All" ||
          inspection.status === statusFilter;

        const matchesSearch =
          !query ||
          inspection.id.toLowerCase().includes(query) ||
          inspection.property
            .toLowerCase()
            .includes(query) ||
          inspection.address
            .toLowerCase()
            .includes(query) ||
          inspection.postcode
            .toLowerCase()
            .includes(query) ||
          inspection.landlord
            .toLowerCase()
            .includes(query) ||
          inspection.tenant
            .toLowerCase()
            .includes(query) ||
          inspection.type
            .toLowerCase()
            .includes(query);

        return matchesStatus && matchesSearch;
      }
    );

    return [...filtered].sort((a, b) => {
      if (sortOption === "Nearest date") {
        return (
          new Date(a.dateValue).getTime() -
          new Date(b.dateValue).getTime()
        );
      }

      if (sortOption === "Latest date") {
        return (
          new Date(b.dateValue).getTime() -
          new Date(a.dateValue).getTime()
        );
      }

      if (sortOption === "Property name") {
        return a.property.localeCompare(
          b.property
        );
      }

      const priorityOrder: Record<
        InspectionPriority,
        number
      > = {
        High: 1,
        Medium: 2,
        Normal: 3,
      };

      return (
        priorityOrder[a.priority] -
        priorityOrder[b.priority]
      );
    });
  }, [searchQuery, statusFilter, sortOption]);

  const inspectionCounts = useMemo(() => {
    return {
      all: inspections.length,
      scheduled: inspections.filter(
        (item) => item.status === "Scheduled"
      ).length,
      urgent: inspections.filter(
        (item) => item.status === "Urgent"
      ).length,
      inProgress: inspections.filter(
        (item) => item.status === "In Progress"
      ).length,
      completed: inspections.filter(
        (item) => item.status === "Completed"
      ).length,
    };
  }, []);

  const navigateTo = (route: string) => {
    setMobileMenuVisible(false);
    router.push(route as never);
  };

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
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

  const handleStartInspection = (
    inspection: Inspection
  ) => {
    showMessage(
      `${inspection.id} has been marked as in progress.`
    );
  };

  const handleCreateInspection = () => {
    showMessage(
      "New inspection form opened."
    );
  };

  const handleLogout = async () => {
    setProfileMenuVisible(false);
    await clearAuthSession("council");
    router.replace("/auth/council/login" as never);
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
                      style={styles.navigationBadge}
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
                  labelStyle={styles.avatarLabel}
                  style={styles.avatar}
                />

                <View style={styles.profileInformation}>
                  <Text style={styles.profileName}>
                    {displayName}
                  </Text>

                  <Text style={styles.profileRole}>
                    {jobTitle}
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
                      {councilName}
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

                  <Text
                    style={styles.breadcrumbCurrent}
                  >
                    Inspections
                  </Text>
                </View>

                <Text style={styles.pageTitle}>
                  Property inspections
                </Text>

                <Text style={styles.pageDescription}>
                  Manage assigned inspections, monitor
                  progress and review completed property
                  visits.
                </Text>
              </View>

              <View style={styles.topBarActions}>
                <Button
                  mode="contained"
                  icon="clipboard-plus-outline"
                  buttonColor={colors.primary}
                  onPress={handleCreateInspection}
                  contentStyle={
                    styles.createButtonContent
                  }
                  labelStyle={
                    styles.createButtonLabel
                  }
                  style={styles.createButton}
                >
                  {isCompact
                    ? "New"
                    : "New inspection"}
                </Button>

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
                ) : null}
              </View>
            </Animated.View>

            <View style={styles.statisticsGrid}>
              <SummaryCard
                delay={80}
                icon="clipboard-list-outline"
                label="All inspections"
                value={inspectionCounts.all}
                background={colors.primaryLight}
                iconColor={colors.primary}
              />

              <SummaryCard
                delay={140}
                icon="calendar-clock-outline"
                label="Scheduled"
                value={inspectionCounts.scheduled}
                background="#EEF1FF"
                iconColor={colors.primary}
              />

              <SummaryCard
                delay={200}
                icon="alert-circle-outline"
                label="Urgent"
                value={inspectionCounts.urgent}
                background="#FDECEC"
                iconColor="#B42318"
              />

              <SummaryCard
                delay={260}
                icon="progress-clock"
                label="In progress"
                value={inspectionCounts.inProgress}
                background="#FFF4E5"
                iconColor="#B56400"
              />

              <SummaryCard
                delay={320}
                icon="check-circle-outline"
                label="Completed"
                value={inspectionCounts.completed}
                background="#E8F7EE"
                iconColor="#277A46"
              />
            </View>

            <Animated.View
              entering={FadeInDown.delay(180).duration(450)}
              style={styles.filtersCard}
            >
              <View
                style={[
                  styles.searchSortRow,
                  !isTablet &&
                    styles.mobileSearchSortRow,
                ]}
              >
                <Searchbar
                  placeholder="Search ID, property, landlord, tenant or postcode"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  icon="magnify"
                  style={styles.searchbar}
                  inputStyle={styles.searchInput}
                />

                <Menu
                  visible={sortMenuVisible}
                  onDismiss={() =>
                    setSortMenuVisible(false)
                  }
                  anchor={
                    <Pressable
                      style={styles.sortButton}
                      onPress={() =>
                        setSortMenuVisible(true)
                      }
                    >
                      <MaterialCommunityIcons
                        name="sort"
                        size={20}
                        color={colors.primary}
                      />

                      <View style={styles.sortTextSection}>
                        <Text
                          style={styles.sortButtonLabel}
                        >
                          Sort by
                        </Text>

                        <Text
                          style={styles.sortButtonValue}
                        >
                          {sortOption}
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  }
                  contentStyle={styles.sortMenu}
                >
                  {sortOptions.map((option) => (
                    <Menu.Item
                      key={option}
                      leadingIcon={
                        sortOption === option
                          ? "check"
                          : "sort"
                      }
                      title={option}
                      onPress={() => {
                        setSortOption(option);
                        setSortMenuVisible(false);
                      }}
                    />
                  ))}
                </Menu>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>
                  FILTER BY STATUS
                </Text>

                <View style={styles.filterChips}>
                  {statusFilters.map((status) => {
                    const selected =
                      statusFilter === status;

                    return (
                      <Chip
                        key={status}
                        selected={selected}
                        onPress={() =>
                          setStatusFilter(status)
                        }
                        showSelectedCheck={false}
                        icon={
                          selected
                            ? "check-circle-outline"
                            : undefined
                        }
                        textStyle={[
                          styles.filterChipText,
                          selected &&
                            styles.selectedFilterChipText,
                        ]}
                        style={[
                          styles.filterChip,
                          selected &&
                            styles.selectedFilterChip,
                        ]}
                      >
                        {status}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              <View style={styles.resultSummary}>
                <Text style={styles.resultText}>
                  Showing{" "}
                  <Text
                    style={styles.resultTextStrong}
                  >
                    {filteredInspections.length}
                  </Text>{" "}
                  of{" "}
                  <Text
                    style={styles.resultTextStrong}
                  >
                    {inspections.length}
                  </Text>{" "}
                  inspections
                </Text>

                {(searchQuery ||
                  statusFilter !== "All") && (
                  <Pressable
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
                    }}
                  >
                    <MaterialCommunityIcons
                      name="filter-remove-outline"
                      size={17}
                      color={colors.primary}
                    />

                    <Text
                      style={
                        styles.clearFiltersText
                      }
                    >
                      Clear filters
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(240).duration(450)}
              style={styles.listCard}
            >
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.listTitle}>
                    Inspection records
                  </Text>

                  <Text
                    style={styles.listDescription}
                  >
                    Select an inspection to review its full
                    details.
                  </Text>
                </View>

                <IconButton
                  icon="refresh"
                  size={20}
                  iconColor={colors.primary}
                  style={styles.refreshButton}
                  onPress={() =>
                    showMessage(
                      "Inspection list refreshed."
                    )
                  }
                />
              </View>

              {filteredInspections.length > 0 ? (
                <View style={styles.inspectionList}>
                  {filteredInspections.map(
                    (inspection, index) => (
                      <InspectionCard
                        key={inspection.id}
                        inspection={inspection}
                        index={index}
                        isTablet={isTablet}
                        onPress={() =>
                          handleInspectionPress(
                            inspection
                          )
                        }
                        onStart={() =>
                          handleStartInspection(
                            inspection
                          )
                        }
                      />
                    )
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <MaterialCommunityIcons
                      name="clipboard-search-outline"
                      size={42}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.emptyStateTitle}>
                    No inspections found
                  </Text>

                  <Text
                    style={styles.emptyStateDescription}
                  >
                    Try changing the search text or selected
                    status filter.
                  </Text>

                  <Button
                    mode="outlined"
                    icon="filter-remove-outline"
                    textColor={colors.primary}
                    style={styles.emptyStateButton}
                    onPress={() => {
                      setSearchQuery("");
                      setStatusFilter("All");
                    }}
                  >
                    Clear filters
                  </Button>
                </View>
              )}
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

function SummaryCard({
  delay,
  icon,
  label,
  value,
  background,
  iconColor,
}: {
  delay: number;
  icon: IconName;
  label: string;
  value: number;
  background: string;
  iconColor: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(420)}
      style={styles.summaryCard}
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={iconColor}
        />
      </View>

      <View style={styles.summaryContent}>
        <Text style={styles.summaryValue}>
          {value}
        </Text>

        <Text style={styles.summaryLabel}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

function InspectionCard({
  inspection,
  index,
  isTablet,
  onPress,
  onStart,
}: {
  inspection: Inspection;
  index: number;
  isTablet: boolean;
  onPress: () => void;
  onStart: () => void;
}) {
  const statusStyle = getStatusStyle(
    inspection.status
  );

  const priorityStyle = getPriorityStyle(
    inspection.priority
  );

  const dateParts = inspection.date.split(" ");

  return (
    <Animated.View
      entering={FadeIn.delay(index * 55).duration(320)}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.inspectionCard,
          pressed &&
            styles.pressedInspectionCard,
        ]}
      >
        <View style={styles.inspectionDateCard}>
          <Text style={styles.inspectionDateDay}>
            {dateParts[0]}
          </Text>

          <Text style={styles.inspectionDateMonth}>
            {dateParts[1]
              .slice(0, 3)
              .toUpperCase()}
          </Text>

          <Text style={styles.inspectionDateTime}>
            {inspection.time}
          </Text>
        </View>

        <View style={styles.inspectionMain}>
          <View
            style={styles.inspectionHeadingRow}
          >
            <View
              style={styles.inspectionHeadingText}
            >
              <Text style={styles.inspectionId}>
                {inspection.id}
              </Text>

              <Text
                style={styles.inspectionProperty}
                numberOfLines={1}
              >
                {inspection.property}
              </Text>
            </View>

            <View style={styles.inspectionBadges}>
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
                  size={14}
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
                  {inspection.status}
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
                  {inspection.priority}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.propertyLocation}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={17}
              color={colors.textMuted}
            />

            <Text
              style={styles.propertyLocationText}
            >
              {inspection.address},{" "}
              {inspection.postcode}
            </Text>
          </View>

          <View
            style={[
              styles.inspectionInformationGrid,
              !isTablet &&
                styles.mobileInspectionInformationGrid,
            ]}
          >
            <InformationItem
              icon="clipboard-text-outline"
              label="Inspection type"
              value={inspection.type}
            />

            <InformationItem
              icon="account-outline"
              label="Landlord"
              value={inspection.landlord}
            />

            <InformationItem
              icon="account-outline"
              label="Tenant"
              value={inspection.tenant}
            />

            <InformationItem
              icon="account-tie-outline"
              label="Inspector"
              value={inspection.assignedInspector}
            />
          </View>

          <View style={styles.notesSection}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={17}
              color={colors.primary}
            />

            <Text
              style={styles.notesText}
              numberOfLines={2}
            >
              {inspection.notes}
            </Text>
          </View>

          <View style={styles.inspectionFooter}>
            <View style={styles.footerMetadata}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={16}
                color={colors.textMuted}
              />

              <Text
                style={styles.footerMetadataText}
              >
                {inspection.date} at{" "}
                {inspection.time}
              </Text>
            </View>

            <View style={styles.inspectionActions}>
              {inspection.status === "Scheduled" ||
              inspection.status === "Urgent" ? (
                <Button
                  mode="outlined"
                  icon="play-circle-outline"
                  textColor={colors.primary}
                  compact
                  onPress={(event) => {
                    event.stopPropagation();
                    onStart();
                  }}
                  style={styles.startButton}
                  labelStyle={
                    styles.startButtonLabel
                  }
                >
                  Start
                </Button>
              ) : null}

              <Pressable
                onPress={onPress}
                style={styles.detailsButton}
              >
                <Text
                  style={styles.detailsButtonText}
                >
                  View details
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={17}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function InformationItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.informationItem}>
      <View style={styles.informationItemIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.primary}
        />
      </View>

      <View style={styles.informationItemText}>
        <Text style={styles.informationItemLabel}>
          {label}
        </Text>

        <Text
          style={styles.informationItemValue}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
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

    case "Cancelled":
      return {
        background: "#F1F2F4",
        text: "#667085",
        icon: "close-circle-outline",
      };

    default:
      return {
        background: colors.primaryLight,
        text: colors.primary,
        icon: "calendar-clock-outline",
      };
  }
}

function getPriorityStyle(
  priority: InspectionPriority
) {
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

  layout: {
    width: "100%",
    maxWidth: 1600,
    alignSelf: "center",
  },

  desktopLayout: {
    minHeight: 950,
    flexDirection: "row",
  },

  sidebar: {
    width: 280,
    minHeight: 950,
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

  pageTitle: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },

  pageDescription: {
    ...typography.bodyMedium,
    maxWidth: 650,
    marginTop: 5,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  createButton: {
    borderRadius: radius.md,
  },

  createButtonContent: {
    minHeight: 48,
    flexDirection: "row-reverse",
  },

  createButtonLabel: {
    fontSize: 9,
    fontWeight: "900",
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

  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  summaryCard: {
    minWidth: 155,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
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
  },

  summaryContent: {
    flex: 1,
  },

  summaryValue: {
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
  },

  summaryLabel: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  filtersCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  searchSortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  mobileSearchSortRow: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  searchbar: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    elevation: 0,
  },

  searchInput: {
    fontSize: 10,
  },

  sortButton: {
    minWidth: 205,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  sortTextSection: {
    flex: 1,
  },

  sortButtonLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  sortButtonValue: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  sortMenu: {
    width: 230,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  filterSection: {
    marginTop: spacing.lg,
  },

  filterLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  selectedFilterChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  filterChipText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  selectedFilterChipText: {
    color: colors.primary,
    fontWeight: "900",
  },

  resultSummary: {
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

  resultText: {
    color: colors.textSecondary,
    fontSize: 8,
  },

  resultTextStrong: {
    color: colors.textPrimary,
    fontWeight: "900",
  },

  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
  },

  clearFiltersText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  listCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  listTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  listDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },

  refreshButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },

  inspectionList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  inspectionCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  pressedInspectionCard: {
    opacity: 0.72,
  },

  inspectionDateCard: {
    width: 78,
    minHeight: 125,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  inspectionDateDay: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: "900",
  },

  inspectionDateMonth: {
    marginTop: 1,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  inspectionDateTime: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 7,
    fontWeight: "800",
    textAlign: "center",
  },

  inspectionMain: {
    flex: 1,
    minWidth: 0,
  },

  inspectionHeadingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  inspectionHeadingText: {
    flex: 1,
    minWidth: 190,
  },

  inspectionId: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  inspectionProperty: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  inspectionBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },

  priorityBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  propertyLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
  },

  propertyLocationText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 8,
  },

  inspectionInformationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  mobileInspectionInformationGrid: {
    flexDirection: "column",
  },

  informationItem: {
    minWidth: 180,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  informationItemIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  informationItemText: {
    flex: 1,
    minWidth: 0,
  },

  informationItemLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  informationItemValue: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  notesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },

  notesText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  inspectionFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  footerMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  footerMetadataText: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  inspectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  startButton: {
    borderColor: colors.primary,
    borderRadius: radius.sm,
  },

  startButtonLabel: {
    fontSize: 7,
    fontWeight: "900",
  },

  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
  },

  detailsButtonText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 70,
  },

  emptyStateIcon: {
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 43,
    backgroundColor: colors.primaryLight,
  },

  emptyStateTitle: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  emptyStateDescription: {
    maxWidth: 390,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 17,
    textAlign: "center",
  },

  emptyStateButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
});