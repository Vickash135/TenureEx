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
    Chip,
    Divider,
    IconButton,
    Menu,
    Searchbar,
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

type ReportStatus =
  | "Draft"
  | "Under Review"
  | "Approved"
  | "Submitted";

type ReportType =
  | "Housing Standards"
  | "HMO Compliance"
  | "Safety Assessment"
  | "Follow-up"
  | "Damp and Mould";

type NavigationItem = {
  label: string;
  icon: IconName;
  route: string;
  badge?: number;
};

type Report = {
  id: string;
  inspectionId: string;
  property: string;
  address: string;
  type: ReportType;
  inspector: string;
  createdDate: string;
  updatedDate: string;
  status: ReportStatus;
  findings: number;
  criticalFindings: number;
};

type StatusFilter = "All" | ReportStatus;

type SortOption =
  | "Recently updated"
  | "Oldest updated"
  | "Property name"
  | "Report status";

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

const initialReports: Report[] = [
  {
    id: "RPT-2026-0894",
    inspectionId: "INS-2026-1048",
    property: "14 Wellington Avenue",
    address: "Leeds, LS6 2AB",
    type: "Housing Standards",
    inspector: "Alex Morgan",
    createdDate: "30 July 2026",
    updatedDate: "30 July 2026, 4:15 PM",
    status: "Draft",
    findings: 3,
    criticalFindings: 1,
  },
  {
    id: "RPT-2026-0887",
    inspectionId: "INS-2026-1039",
    property: "21 Headingley Mount",
    address: "Leeds, LS6 3EW",
    type: "Safety Assessment",
    inspector: "Alex Morgan",
    createdDate: "29 July 2026",
    updatedDate: "30 July 2026, 11:20 AM",
    status: "Under Review",
    findings: 4,
    criticalFindings: 1,
  },
  {
    id: "RPT-2026-0872",
    inspectionId: "INS-2026-1024",
    property: "35 Cardigan Road",
    address: "Leeds, LS6 1LJ",
    type: "HMO Compliance",
    inspector: "Alex Morgan",
    createdDate: "27 July 2026",
    updatedDate: "28 July 2026, 9:30 AM",
    status: "Approved",
    findings: 2,
    criticalFindings: 0,
  },
  {
    id: "RPT-2026-0859",
    inspectionId: "INS-2026-1018",
    property: "17 Hyde Park Road",
    address: "Leeds, LS6 1PY",
    type: "Housing Standards",
    inspector: "Alex Morgan",
    createdDate: "25 July 2026",
    updatedDate: "25 July 2026, 5:05 PM",
    status: "Submitted",
    findings: 0,
    criticalFindings: 0,
  },
  {
    id: "RPT-2026-0845",
    inspectionId: "INS-2026-1006",
    property: "74 Roundhay Road",
    address: "Leeds, LS8 4HT",
    type: "Damp and Mould",
    inspector: "Alex Morgan",
    createdDate: "22 July 2026",
    updatedDate: "24 July 2026, 2:10 PM",
    status: "Approved",
    findings: 5,
    criticalFindings: 2,
  },
  {
    id: "RPT-2026-0829",
    inspectionId: "INS-2026-0988",
    property: "11 Burley Lodge Road",
    address: "Leeds, LS6 1QP",
    type: "Follow-up",
    inspector: "Alex Morgan",
    createdDate: "18 July 2026",
    updatedDate: "19 July 2026, 10:45 AM",
    status: "Submitted",
    findings: 1,
    criticalFindings: 0,
  },
];

const statusFilters: StatusFilter[] = [
  "All",
  "Draft",
  "Under Review",
  "Approved",
  "Submitted",
];

const sortOptions: SortOption[] = [
  "Recently updated",
  "Oldest updated",
  "Property name",
  "Report status",
];

export default function CouncilReportsScreen() {
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams<{
    inspectionId?: string;
  }>();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;
  const isCompact = width < 520;

  const selectedInspectionId =
    typeof params.inspectionId === "string"
      ? params.inspectionId
      : "";

  const [reports, setReports] =
    useState<Report[]>(initialReports);

  const [searchQuery, setSearchQuery] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");
  const [sortOption, setSortOption] =
    useState<SortOption>("Recently updated");

  const [mobileMenuVisible, setMobileMenuVisible] =
    useState(false);
  const [profileMenuVisible, setProfileMenuVisible] =
    useState(false);
  const [sortMenuVisible, setSortMenuVisible] =
    useState(false);
  const [createFormVisible, setCreateFormVisible] =
    useState(Boolean(selectedInspectionId));

  const [reportInspectionId, setReportInspectionId] =
    useState(
      selectedInspectionId || "INS-2026-1048"
    );
  const [reportProperty, setReportProperty] =
    useState("14 Wellington Avenue");
  const [reportType, setReportType] =
    useState<ReportType>("Housing Standards");
  const [reportSummary, setReportSummary] =
    useState(
      "Housing standards inspection completed following tenant reports of damp, mould and poor ventilation."
    );
  const [recommendedAction, setRecommendedAction] =
    useState(
      "Issue an improvement notice and require urgent remedial work within 14 days."
    );

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const filteredReports = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    const filtered = reports.filter(
      (report) => {
        const matchesStatus =
          statusFilter === "All" ||
          report.status === statusFilter;

        const matchesSearch =
          !query ||
          report.id.toLowerCase().includes(query) ||
          report.inspectionId
            .toLowerCase()
            .includes(query) ||
          report.property
            .toLowerCase()
            .includes(query) ||
          report.address
            .toLowerCase()
            .includes(query) ||
          report.type
            .toLowerCase()
            .includes(query) ||
          report.inspector
            .toLowerCase()
            .includes(query);

        return matchesStatus && matchesSearch;
      }
    );

    return [...filtered].sort((a, b) => {
      if (sortOption === "Property name") {
        return a.property.localeCompare(
          b.property
        );
      }

      if (sortOption === "Report status") {
        return a.status.localeCompare(b.status);
      }

      if (sortOption === "Oldest updated") {
        return a.id.localeCompare(b.id);
      }

      return b.id.localeCompare(a.id);
    });
  }, [
    reports,
    searchQuery,
    statusFilter,
    sortOption,
  ]);

  const reportCounts = useMemo(
    () => ({
      all: reports.length,
      draft: reports.filter(
        (report) => report.status === "Draft"
      ).length,
      review: reports.filter(
        (report) =>
          report.status === "Under Review"
      ).length,
      approved: reports.filter(
        (report) => report.status === "Approved"
      ).length,
      submitted: reports.filter(
        (report) =>
          report.status === "Submitted"
      ).length,
    }),
    [reports]
  );

  const navigateTo = (route: string) => {
    setMobileMenuVisible(false);
    router.push(route as never);
  };

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = () => {
    setProfileMenuVisible(false);

    router.replace(
      "/auth/council/login" as never
    );
  };

  const handleCreateReport = () => {
    if (!reportInspectionId.trim()) {
      showMessage(
        "Please enter an inspection ID."
      );
      return;
    }

    if (!reportProperty.trim()) {
      showMessage(
        "Please enter the property address."
      );
      return;
    }

    if (!reportSummary.trim()) {
      showMessage(
        "Please enter the report summary."
      );
      return;
    }

    const newReport: Report = {
      id: `RPT-2026-${String(
        900 + reports.length
      ).padStart(4, "0")}`,
      inspectionId: reportInspectionId.trim(),
      property: reportProperty.trim(),
      address: "Leeds",
      type: reportType,
      inspector: "Alex Morgan",
      createdDate: "30 July 2026",
      updatedDate: "30 July 2026, 9:05 PM",
      status: "Draft",
      findings: 0,
      criticalFindings: 0,
    };

    setReports((current) => [
      newReport,
      ...current,
    ]);

    setCreateFormVisible(false);

    showMessage(
      `${newReport.id} was created successfully.`
    );
  };

  const handleOpenReport = (report: Report) => {
    showMessage(
      `${report.id} opened for review.`
    );
  };

  const handleEditReport = (report: Report) => {
    setReportInspectionId(report.inspectionId);
    setReportProperty(report.property);
    setReportType(report.type);
    setReportSummary(
      `Inspection report for ${report.property}.`
    );
    setRecommendedAction(
      "Review all identified findings and confirm the required enforcement action."
    );
    setCreateFormVisible(true);
  };

  const handleSubmitReport = (report: Report) => {
    setReports((current) =>
      current.map((item) =>
        item.id === report.id
          ? {
              ...item,
              status: "Under Review",
              updatedDate:
                "30 July 2026, 9:05 PM",
            }
          : item
      )
    );

    showMessage(
      `${report.id} was submitted for review.`
    );
  };

  const handleDownloadReport = (
    report: Report
  ) => {
    showMessage(
      `${report.id} PDF download started.`
    );
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
                item.route === "/council/reports";

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
                    "/council/reports";

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

                  <Text
                    style={styles.breadcrumbCurrent}
                  >
                    Reports
                  </Text>
                </View>

                <Text style={styles.pageTitle}>
                  Inspection reports
                </Text>

                <Text style={styles.pageDescription}>
                  Create, review and submit official
                  property inspection reports.
                </Text>
              </View>

              <View style={styles.topBarActions}>
                <Button
                  mode="contained"
                  icon="file-document-plus-outline"
                  buttonColor={colors.primary}
                  onPress={() =>
                    setCreateFormVisible(
                      !createFormVisible
                    )
                  }
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
                    : "New report"}
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

            <View style={styles.statisticsGrid}>
              <SummaryCard
                delay={80}
                icon="file-document-multiple-outline"
                label="All reports"
                value={reportCounts.all}
                background={colors.primaryLight}
                iconColor={colors.primary}
              />

              <SummaryCard
                delay={140}
                icon="file-edit-outline"
                label="Drafts"
                value={reportCounts.draft}
                background="#FFF4E5"
                iconColor="#B56400"
              />

              <SummaryCard
                delay={200}
                icon="file-search-outline"
                label="Under review"
                value={reportCounts.review}
                background="#EEF1FF"
                iconColor={colors.primary}
              />

              <SummaryCard
                delay={260}
                icon="file-check-outline"
                label="Approved"
                value={reportCounts.approved}
                background="#E8F7EE"
                iconColor="#277A46"
              />

              <SummaryCard
                delay={320}
                icon="send-check-outline"
                label="Submitted"
                value={reportCounts.submitted}
                background="#E8F7EE"
                iconColor="#277A46"
              />
            </View>

            {createFormVisible ? (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.createReportCard}
              >
                <View style={styles.createReportHeader}>
                  <View style={styles.createReportIcon}>
                    <MaterialCommunityIcons
                      name="file-document-edit-outline"
                      size={28}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.createReportHeading}>
                    <Text
                      style={styles.createReportTitle}
                    >
                      Create inspection report
                    </Text>

                    <Text
                      style={
                        styles.createReportDescription
                      }
                    >
                      Complete the main report information
                      before saving it as a draft.
                    </Text>
                  </View>

                  <IconButton
                    icon="close"
                    size={21}
                    iconColor={colors.textMuted}
                    onPress={() =>
                      setCreateFormVisible(false)
                    }
                  />
                </View>

                <View
                  style={[
                    styles.formRow,
                    !isTablet &&
                      styles.mobileFormRow,
                  ]}
                >
                  <TextInput
                    mode="outlined"
                    label="Inspection ID"
                    value={reportInspectionId}
                    onChangeText={
                      setReportInspectionId
                    }
                    left={
                      <TextInput.Icon
                        icon="clipboard-search-outline"
                      />
                    }
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={[
                      styles.formInput,
                      styles.rowInput,
                    ]}
                  />

                  <TextInput
                    mode="outlined"
                    label="Property"
                    value={reportProperty}
                    onChangeText={setReportProperty}
                    left={
                      <TextInput.Icon
                        icon="home-outline"
                      />
                    }
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={[
                      styles.formInput,
                      styles.rowInput,
                    ]}
                  />
                </View>

                <Text style={styles.formLabel}>
                  REPORT TYPE
                </Text>

                <View style={styles.reportTypeGrid}>
                  {(
                    [
                      "Housing Standards",
                      "HMO Compliance",
                      "Safety Assessment",
                      "Follow-up",
                      "Damp and Mould",
                    ] as ReportType[]
                  ).map((type) => {
                    const selected =
                      reportType === type;

                    return (
                      <Pressable
                        key={type}
                        onPress={() =>
                          setReportType(type)
                        }
                        style={({ pressed }) => [
                          styles.reportTypeButton,
                          selected &&
                            styles.selectedReportTypeButton,
                          pressed &&
                            styles.pressedItem,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            selected
                              ? "radiobox-marked"
                              : "radiobox-blank"
                          }
                          size={18}
                          color={
                            selected
                              ? colors.primary
                              : colors.textMuted
                          }
                        />

                        <Text
                          style={[
                            styles.reportTypeText,
                            selected &&
                              styles.selectedReportTypeText,
                          ]}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  mode="outlined"
                  label="Inspection summary"
                  value={reportSummary}
                  onChangeText={setReportSummary}
                  multiline
                  numberOfLines={5}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.formInput}
                />

                <TextInput
                  mode="outlined"
                  label="Recommended action"
                  value={recommendedAction}
                  onChangeText={setRecommendedAction}
                  multiline
                  numberOfLines={4}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.formInput}
                />

                <View style={styles.formActions}>
                  <Button
                    mode="outlined"
                    textColor={colors.primary}
                    style={styles.cancelButton}
                    onPress={() =>
                      setCreateFormVisible(false)
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    mode="contained"
                    icon="content-save-outline"
                    buttonColor={colors.primary}
                    style={styles.saveDraftButton}
                    contentStyle={
                      styles.saveDraftContent
                    }
                    onPress={handleCreateReport}
                  >
                    Save as draft
                  </Button>
                </View>
              </Animated.View>
            ) : null}

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
                  placeholder="Search report, inspection or property"
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

                      <View
                        style={styles.sortTextSection}
                      >
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
                        option === sortOption
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
                        showSelectedCheck={false}
                        onPress={() =>
                          setStatusFilter(status)
                        }
                        icon={
                          selected
                            ? "check-circle-outline"
                            : undefined
                        }
                        style={[
                          styles.filterChip,
                          selected &&
                            styles.selectedFilterChip,
                        ]}
                        textStyle={[
                          styles.filterChipText,
                          selected &&
                            styles.selectedFilterChipText,
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
                    {filteredReports.length}
                  </Text>{" "}
                  of{" "}
                  <Text
                    style={styles.resultTextStrong}
                  >
                    {reports.length}
                  </Text>{" "}
                  reports
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
              style={styles.reportListCard}
            >
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.listTitle}>
                    Report records
                  </Text>

                  <Text
                    style={styles.listDescription}
                  >
                    Review, edit, submit or download your
                    council inspection reports.
                  </Text>
                </View>

                <IconButton
                  icon="refresh"
                  size={20}
                  iconColor={colors.primary}
                  style={styles.refreshButton}
                  onPress={() =>
                    showMessage(
                      "Report list refreshed."
                    )
                  }
                />
              </View>

              {filteredReports.length > 0 ? (
                <View style={styles.reportList}>
                  {filteredReports.map(
                    (report, index) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        index={index}
                        isTablet={isTablet}
                        onOpen={() =>
                          handleOpenReport(report)
                        }
                        onEdit={() =>
                          handleEditReport(report)
                        }
                        onSubmit={() =>
                          handleSubmitReport(report)
                        }
                        onDownload={() =>
                          handleDownloadReport(report)
                        }
                      />
                    )
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <MaterialCommunityIcons
                      name="file-search-outline"
                      size={42}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.emptyStateTitle}>
                    No reports found
                  </Text>

                  <Text
                    style={styles.emptyStateDescription}
                  >
                    Try changing your search or status
                    filter.
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

function ReportCard({
  report,
  index,
  isTablet,
  onOpen,
  onEdit,
  onSubmit,
  onDownload,
}: {
  report: Report;
  index: number;
  isTablet: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onDownload: () => void;
}) {
  const statusStyle = getStatusStyle(
    report.status
  );

  return (
    <Animated.View
      entering={FadeIn.delay(index * 55).duration(320)}
    >
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.reportCard,
          pressed && styles.pressedItem,
        ]}
      >
        <View style={styles.reportIcon}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={30}
            color={colors.primary}
          />
        </View>

        <View style={styles.reportMain}>
          <View style={styles.reportHeader}>
            <View style={styles.reportHeading}>
              <Text style={styles.reportId}>
                {report.id}
              </Text>

              <Text style={styles.reportProperty}>
                {report.property}
              </Text>

              <View style={styles.addressRow}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={15}
                  color={colors.textMuted}
                />

                <Text style={styles.addressText}>
                  {report.address}
                </Text>
              </View>
            </View>

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
                {report.status}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.reportInformationGrid,
              !isTablet &&
                styles.mobileReportInformationGrid,
            ]}
          >
            <ReportInformationItem
              icon="clipboard-search-outline"
              label="Inspection"
              value={report.inspectionId}
            />

            <ReportInformationItem
              icon="file-cog-outline"
              label="Report type"
              value={report.type}
            />

            <ReportInformationItem
              icon="account-tie-outline"
              label="Inspector"
              value={report.inspector}
            />

            <ReportInformationItem
              icon="calendar-edit"
              label="Last updated"
              value={report.updatedDate}
            />
          </View>

          <View style={styles.findingSummary}>
            <View style={styles.findingItem}>
              <MaterialCommunityIcons
                name="alert-box-outline"
                size={17}
                color={colors.primary}
              />

              <Text style={styles.findingLabel}>
                {report.findings} findings
              </Text>
            </View>

            <View style={styles.findingItem}>
              <MaterialCommunityIcons
                name="alert-octagon-outline"
                size={17}
                color={
                  report.criticalFindings > 0
                    ? "#B42318"
                    : colors.textMuted
                }
              />

              <Text
                style={[
                  styles.findingLabel,
                  report.criticalFindings > 0 &&
                    styles.criticalFindingLabel,
                ]}
              >
                {report.criticalFindings} critical
              </Text>
            </View>
          </View>

          <View style={styles.reportFooter}>
            <Text style={styles.createdText}>
              Created {report.createdDate}
            </Text>

            <View style={styles.reportActions}>
              <IconButton
                icon="download-outline"
                size={19}
                iconColor={colors.primary}
                style={styles.iconActionButton}
                onPress={(event) => {
                  event.stopPropagation();
                  onDownload();
                }}
              />

              {(report.status === "Draft" ||
                report.status ===
                  "Under Review") && (
                <Button
                  mode="outlined"
                  icon="file-edit-outline"
                  compact
                  textColor={colors.primary}
                  style={styles.editButton}
                  labelStyle={styles.actionLabel}
                  onPress={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                >
                  Edit
                </Button>
              )}

              {report.status === "Draft" && (
                <Button
                  mode="contained"
                  icon="send-outline"
                  compact
                  buttonColor={colors.primary}
                  style={styles.submitButton}
                  labelStyle={styles.actionLabel}
                  onPress={(event) => {
                    event.stopPropagation();
                    onSubmit();
                  }}
                >
                  Submit
                </Button>
              )}

              <Pressable
                onPress={onOpen}
                style={styles.openButton}
              >
                <Text style={styles.openButtonText}>
                  Open
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

function ReportInformationItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.reportInformationItem}>
      <View
        style={styles.reportInformationIcon}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.primary}
        />
      </View>

      <View
        style={styles.reportInformationText}
      >
        <Text
          style={styles.reportInformationLabel}
        >
          {label}
        </Text>

        <Text
          style={styles.reportInformationValue}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function getStatusStyle(
  status: ReportStatus
): {
  background: string;
  text: string;
  icon: IconName;
} {
  switch (status) {
    case "Draft":
      return {
        background: "#FFF4E5",
        text: "#B56400",
        icon: "file-edit-outline",
      };

    case "Under Review":
      return {
        background: colors.primaryLight,
        text: colors.primary,
        icon: "file-search-outline",
      };

    case "Approved":
      return {
        background: "#E8F7EE",
        text: "#277A46",
        icon: "file-check-outline",
      };

    default:
      return {
        background: "#E8F7EE",
        text: "#277A46",
        icon: "send-check-outline",
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

  createReportCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  createReportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  createReportIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  createReportHeading: {
    flex: 1,
  },

  createReportTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  createReportDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  mobileFormRow: {
    flexDirection: "column",
  },

  rowInput: {
    flex: 1,
    minWidth: 0,
  },

  formInput: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  formLabel: {
    marginBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  reportTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  reportTypeButton: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  selectedReportTypeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  reportTypeText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  selectedReportTypeText: {
    color: colors.primary,
    fontWeight: "900",
  },

  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },

  cancelButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  saveDraftButton: {
    borderRadius: radius.md,
  },

  saveDraftContent: {
    minHeight: 46,
    flexDirection: "row-reverse",
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
    minWidth: 215,
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
  },

  clearFiltersText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  reportListCard: {
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

  reportList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  reportCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  pressedItem: {
    opacity: 0.7,
  },

  reportIcon: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },

  reportMain: {
    flex: 1,
    minWidth: 0,
  },

  reportHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  reportHeading: {
    flex: 1,
    minWidth: 200,
  },

  reportId: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  reportProperty: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  addressText: {
    color: colors.textSecondary,
    fontSize: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  reportInformationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  mobileReportInformationGrid: {
    flexDirection: "column",
  },

  reportInformationItem: {
    minWidth: 170,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  reportInformationIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  reportInformationText: {
    flex: 1,
    minWidth: 0,
  },

  reportInformationLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  reportInformationValue: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  findingSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },

  findingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  findingLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  criticalFindingLabel: {
    color: "#B42318",
  },

  reportFooter: {
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

  createdText: {
    color: colors.textMuted,
    fontSize: 7,
  },

  reportActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  iconActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },

  editButton: {
    borderColor: colors.primary,
    borderRadius: radius.sm,
  },

  submitButton: {
    borderRadius: radius.sm,
  },

  actionLabel: {
    fontSize: 7,
    fontWeight: "900",
  },

  openButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
  },

  openButtonText: {
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
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: "center",
  },

  emptyStateButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
});