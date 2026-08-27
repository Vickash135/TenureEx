import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Avatar, Button } from "react-native-paper";

import { clearAuthSession, getStoredUser } from "../../src/api/client";
import {
  getAllowedAgentNavigation,
  getPageCreatePermission,
  getPageManagePermission,
  getPageViewPermission,
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

export type AgentStatistic = {
  label: string;
  value: string;
  icon: IconName;
  helper?: string;
};

export type AgentRecord = {
  id: string;
  title: string;
  subtitle: string;
  detail?: string;
  status: string;
  statusType?: "success" | "warning" | "error" | "neutral" | "primary";
  icon?: IconName;
  onEdit?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
};

type AgentModuleScreenProps = {
  pageTitle: string;
  pageSubtitle: string;
  activePage: string;
  primaryAction: string;
  primaryActionIcon?: IconName;
  statistics: AgentStatistic[];
  records: AgentRecord[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  filterOptions?: string[];
  onPrimaryAction?: () => void;
  customContent?: ReactNode;
  hideRecords?: boolean;
};

export default function AgentModuleScreen({
  pageTitle,
  pageSubtitle,
  activePage,
  primaryAction,
  primaryActionIcon = "plus",
  statistics,
  records,
  searchPlaceholder = "Search records...",
  emptyMessage = "No records found.",
  filterOptions = ["All", "Active", "Pending", "Completed"],
  onPrimaryAction,
  customContent,
  hideRecords = false,
}: AgentModuleScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1050;
  const isTablet = width >= 700;

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [currentUser, setCurrentUser] = useState<AgentCurrentUser | null>(null);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getStoredUser<AgentCurrentUser>();
      setCurrentUser(storedUser);
      setPermissionsLoaded(true);
    };
    void loadUser();
  }, []);

  const allowedNavigationItems = useMemo(
    () => getAllowedAgentNavigation(currentUser),
    [currentUser],
  );

  const requiredViewPermission = getPageViewPermission(activePage);
  const requiredManagePermission = getPageManagePermission(activePage);
  const requiredCreatePermission = getPageCreatePermission(activePage);

  const canViewPage =
    !requiredViewPermission ||
    hasAgentPermission(currentUser, requiredViewPermission);

  const canManagePage =
    !requiredManagePermission ||
    hasAgentPermission(currentUser, requiredManagePermission);

  const canUsePrimaryAction =
    !requiredCreatePermission ||
    hasAgentPermission(currentUser, requiredCreatePermission);

  const filteredRecords = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !searchValue ||
        [record.title, record.subtitle, record.detail, record.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchValue);

      const matchesFilter =
        selectedFilter === "All" ||
        record.status.toLowerCase() === selectedFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [records, search, selectedFilter]);

  const navigateTo = (route: Href) => {
    setMenuOpen(false);
    router.push(route);
  };

  const handleSignOut = async () => {
    await clearAuthSession();
    router.replace("/auth/agent/login" as Href);
  };

  if (!permissionsLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Loading workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    router.replace("/auth/agent/login" as Href);
    return null;
  }

  if (!canViewPage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }}>
          <MaterialCommunityIcons name="shield-lock-outline" size={52} color={colors.error} />
          <Text style={{ marginTop: 16, fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>
            Access denied
          </Text>
          <Text style={{ marginTop: 8, textAlign: "center", color: colors.textSecondary }}>
            Your agency role does not have permission to access this section.
          </Text>
          <Button
            mode="contained"
            style={{ marginTop: 20 }}
            onPress={() => router.replace("/agent/dashboard" as Href)}
          >
            Return to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {isDesktop && (
          <AgentSidebar
            activePage={activePage}
            user={currentUser}
            navigationItems={allowedNavigationItems}
            onNavigate={navigateTo}
            onSignOut={handleSignOut}
          />
        )}

        <View style={styles.mainArea}>
          <View style={styles.topBar}>
            {!isDesktop && (
              <Pressable onPress={() => setMenuOpen((current) => !current)} style={styles.headerIconButton}>
                <MaterialCommunityIcons name={menuOpen ? "close" : "menu"} size={24} color={colors.textPrimary} />
              </Pressable>
            )}

            {!isDesktop ? (
              <TenureExLogo compact />
            ) : (
              <View>
                <Text style={styles.topBarTitle}>{pageTitle}</Text>
                <Text style={styles.topBarSubtitle}>Estate Agent Workspace</Text>
              </View>
            )}

            <View style={styles.topBarActions}>
              <Pressable style={styles.headerIconButton}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textSecondary} />
                <View style={styles.notificationDot} />
              </Pressable>

              {isTablet && (
                <View style={styles.profile}>
                  <Avatar.Text
                    size={38}
                    label={getUserInitials(currentUser)}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />
                  <View>
                    <Text style={styles.profileName}>{getUserDisplayName(currentUser)}</Text>
                    <Text style={styles.profileRole}>{getPrimaryRoleName(currentUser)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {!isDesktop && menuOpen && (
            <>
              <Pressable onPress={() => setMenuOpen(false)} style={styles.menuBackdrop} />
              <View style={styles.mobileMenu}>
                <AgentNavigation
                  activePage={activePage}
                  navigationItems={allowedNavigationItems}
                  mobile
                  onNavigate={navigateTo}
                />
                <Pressable onPress={handleSignOut} style={styles.mobileSignOut}>
                  <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
                  <Text style={styles.mobileSignOutText}>Sign out</Text>
                </Pressable>
              </View>
            </>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
            <View style={styles.pageContainer}>
              <View style={styles.pageHeader}>
                <View style={styles.pageHeading}>
                  <Text style={styles.eyebrow}>ESTATE AGENT PORTAL</Text>
                  <Text style={styles.pageTitle}>{pageTitle}</Text>
                  <Text style={styles.pageSubtitle}>{pageSubtitle}</Text>
                </View>

                {canUsePrimaryAction ? (
                  <Button
                    mode="contained"
                    icon={primaryActionIcon}
                    buttonColor={colors.primary}
                    style={styles.primaryButton}
                    contentStyle={styles.primaryButtonContent}
                    onPress={onPrimaryAction}
                  >
                    {primaryAction}
                  </Button>
                ) : null}
              </View>

              <View style={styles.statisticsGrid}>
                {statistics.map((statistic) => (
                  <View
                    key={statistic.label}
                    style={[
                      styles.statisticCard,
                      isTablet ? styles.desktopStatisticCard : styles.mobileStatisticCard,
                    ]}
                  >
                    <View style={styles.statisticIcon}>
                      <MaterialCommunityIcons name={statistic.icon} size={23} color={colors.primary} />
                    </View>
                    <Text style={styles.statisticValue}>{statistic.value}</Text>
                    <Text style={styles.statisticLabel}>{statistic.label}</Text>
                    {statistic.helper ? <Text style={styles.statisticHelper}>{statistic.helper}</Text> : null}
                  </View>
                ))}
              </View>

              {customContent ? <View style={styles.customContent}>{customContent}</View> : null}

              {!hideRecords ? (
              <View style={styles.recordsCard}>
                <View style={styles.recordsHeader}>
                  <View>
                    <Text style={styles.recordsTitle}>{pageTitle} overview</Text>
                    <Text style={styles.recordsSubtitle}>{filteredRecords.length} records displayed</Text>
                  </View>

                  <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder={searchPlaceholder}
                      placeholderTextColor={colors.textMuted}
                      style={styles.searchInput}
                    />
                  </View>
                </View>

                <View style={styles.filterRow}>
                  {filterOptions.map((option) => (
                    <FilterButton
                      key={option}
                      label={option}
                      selected={selectedFilter === option}
                      onPress={() => setSelectedFilter(option)}
                    />
                  ))}
                </View>

                {filteredRecords.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="database-search-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>{emptyMessage}</Text>
                    <Text style={styles.emptyDescription}>Try changing your search term or filters.</Text>
                  </View>
                ) : (
                  <View style={styles.recordsList}>
                    {filteredRecords.map((record) => (
                      <RecordCard key={record.id} record={record} canManage={canManagePage} />
                    ))}
                  </View>
                )}
              </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AgentSidebar({
  activePage,
  user,
  navigationItems,
  onNavigate,
  onSignOut,
}: {
  activePage: string;
  user: AgentCurrentUser;
  navigationItems: AgentNavigationItem[];
  onNavigate: (route: Href) => void;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <View style={styles.sidebar}>
      <TenureExLogo light compact />

      <View style={styles.agencyCard}>
        <View style={styles.agencyIcon}>
          <MaterialCommunityIcons name="office-building-outline" size={22} color={colors.white} />
        </View>
        <View style={styles.agencyDetails}>
          <Text style={styles.agencyName}>{user.agency?.name ?? "TenureEx Agency"}</Text>
          <Text style={styles.agencyPlan}>{user.branch?.name ?? "Agency workspace"}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(255,255,255,0.70)" />
      </View>

      <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.navigationLabel}>WORKSPACE</Text>
        <AgentNavigation activePage={activePage} navigationItems={navigationItems} onNavigate={onNavigate} />
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Avatar.Text
          size={39}
          label={getUserInitials(user)}
          style={styles.sidebarAvatar}
          labelStyle={styles.sidebarAvatarLabel}
        />
        <View style={styles.sidebarUser}>
          <Text style={styles.sidebarUserName}>{getUserDisplayName(user)}</Text>
          <Text style={styles.sidebarUserRole}>{getPrimaryRoleName(user)}</Text>
        </View>
        <Pressable onPress={onSignOut}>
          <MaterialCommunityIcons name="logout" size={20} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </View>
    </View>
  );
}

function AgentNavigation({
  activePage,
  navigationItems,
  mobile = false,
  onNavigate,
}: {
  activePage: string;
  navigationItems: AgentNavigationItem[];
  mobile?: boolean;
  onNavigate: (route: Href) => void;
}) {
  return (
    <View style={styles.navigationList}>
      {navigationItems.map((item) => {
        const active = item.label === activePage;
        return (
          <Pressable
            key={item.label}
            onPress={() => onNavigate(item.route)}
            style={[
              styles.navigationItem,
              mobile && styles.mobileNavigationItem,
              active && styles.activeNavigationItem,
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={20}
              color={active ? colors.white : mobile ? colors.textSecondary : "rgba(255,255,255,0.68)"}
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
          </Pressable>
        );
      })}
    </View>
  );
}

function FilterButton({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterButton, selected && styles.selectedFilterButton]}
    >
      <Text style={[styles.filterButtonText, selected && styles.selectedFilterButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function RecordCard({ record, canManage }: { record: AgentRecord; canManage: boolean }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordIcon}>
        <MaterialCommunityIcons
          name={record.icon ?? "file-document-outline"}
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.recordInformation}>
        <Text style={styles.recordTitle} numberOfLines={1}>{record.title}</Text>
        <Text style={styles.recordSubtitle} numberOfLines={1}>{record.subtitle}</Text>
        {record.detail ? <Text style={styles.recordDetail} numberOfLines={1}>{record.detail}</Text> : null}
      </View>

      <View style={styles.recordRightSection}>
        <StatusBadge text={record.status} type={record.statusType ?? "neutral"} />

        {canManage ? (
          <View style={styles.recordActions}>
            {record.onActivate ? (
              <Pressable onPress={record.onActivate} style={styles.activateButton}>
                <Text style={styles.activateButtonText}>Activate</Text>
              </Pressable>
            ) : null}

            {record.onEdit ? (
              <Pressable onPress={record.onEdit} style={styles.recordActionButton}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
              </Pressable>
            ) : null}

            {record.onDelete ? (
              <Pressable onPress={record.onDelete} style={styles.recordActionButton}>
                <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function StatusBadge({
  text,
  type,
}: {
  text: string;
  type: "success" | "warning" | "error" | "neutral" | "primary";
}) {
  return (
    <View
      style={[
        styles.statusBadge,
        type === "success" && styles.successBadge,
        type === "warning" && styles.warningBadge,
        type === "error" && styles.errorBadge,
        type === "primary" && styles.primaryBadge,
        type === "neutral" && styles.neutralBadge,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          type === "success" && styles.successBadgeText,
          type === "warning" && styles.warningBadgeText,
          type === "error" && styles.errorBadgeText,
          type === "primary" && styles.primaryBadgeText,
          type === "neutral" && styles.neutralBadgeText,
        ]}
      >
        {text}
      </Text>
    </View>
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        backgroundColor: colors.primaryDark,
    },

    agencyCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: spacing.xl,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },

    agencyIcon: {
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
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
        gap: 3,
        marginTop: spacing.sm,
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
        minHeight: 52,
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
        fontSize: 14,
    },

    activeNavigationText: {
        color: colors.white,
        fontWeight: "800",
    },

    messageBadge: {
        minWidth: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11,
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

    sidebarAvatar: {
        backgroundColor: colors.secondary,
    },

    sidebarAvatarLabel: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "900",
    },

    sidebarUser: {
        flex: 1,
    },

    sidebarUserName: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "700",
    },

    sidebarUserRole: {
        marginTop: 2,
        color: "rgba(255,255,255,0.50)",
        fontSize: 8,
    },

    mainArea: {
        flex: 1,
        minWidth: 0,
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
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
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
        borderWidth: 1,
        borderColor: colors.white,
    },

    profile: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    avatar: {
        backgroundColor: colors.primaryLight,
    },

    avatarLabel: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "900",
    },

    profileName: {
        color: colors.textPrimary,
        fontSize: 11,
        fontWeight: "800",
    },

    profileRole: {
        color: colors.textMuted,
        fontSize: 8,
    },

    menuBackdrop: {
        position: "absolute",
        top: 74,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 19,
        backgroundColor: "rgba(16,43,58,0.35)",
    },

    mobileMenu: {
        position: "absolute",
        top: 74,
        left: 0,
        bottom: 0,
        zIndex: 20,
        width: 285,
        padding: spacing.md,
        backgroundColor: colors.white,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },

    mobileSignOut: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 52,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    mobileSignOutText: {
        color: colors.error,
        fontSize: 14,
        fontWeight: "700",
    },

    pageContent: {
        flexGrow: 1,
        padding: spacing.xl,
    },

    pageContainer: {
        width: "100%",
        maxWidth: 1480,
        alignSelf: "center",
    },

    pageHeader: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.lg,
    },

    pageHeading: {
        flex: 1,
        minWidth: 260,
    },

    eyebrow: {
        color: colors.primary,
        fontSize: 9,
        fontWeight: "900",
        letterSpacing: 1.6,
    },

    pageTitle: {
        ...typography.displayMedium,
        marginTop: spacing.sm,
        color: colors.textPrimary,
    },

    pageSubtitle: {
        ...typography.bodyMedium,
        marginTop: spacing.sm,
        color: colors.textSecondary,
    },

    primaryButton: {
        borderRadius: radius.md,
    },

    primaryButtonContent: {
        minHeight: 48,
    },

    statisticsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.lg,
        marginTop: spacing.xxl,
    },

    statisticCard: {
        padding: spacing.lg,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
    },

    desktopStatisticCard: {
        flex: 1,
        minWidth: 190,
    },

    mobileStatisticCard: {
        width: "47%",
        minWidth: 145,
        flexGrow: 1,
    },

    statisticIcon: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: colors.primaryLight,
    },

    statisticValue: {
        marginTop: spacing.lg,
        color: colors.textPrimary,
        fontSize: 28,
        fontWeight: "900",
    },

    statisticLabel: {
        marginTop: 3,
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: "700",
    },

    statisticHelper: {
        marginTop: spacing.sm,
        color: colors.textMuted,
        fontSize: 9,
    },

    customContent: {
        gap: spacing.lg,
    },

    recordsCard: {
        marginTop: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
    },

    recordsHeader: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
    },

    recordsTitle: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "900",
    },

    recordsSubtitle: {
        marginTop: 3,
        color: colors.textMuted,
        fontSize: 9,
    },

    searchContainer: {
        minWidth: 230,
        flex: 0.45,
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
    },

    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 12,
        outlineStyle: "none",
    } as never,

    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    filterButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.background,
    },

    selectedFilterButton: {
        backgroundColor: colors.primary,
    },

    filterButtonText: {
        color: colors.textSecondary,
        fontSize: 10,
        fontWeight: "700",
    },

    selectedFilterButtonText: {
        color: colors.white,
    },

    recordsList: {
        width: "100%",
        marginTop: spacing.sm,
        overflow: "hidden",
    },

    recordCard: {
        width: "100%",
        minHeight: 82,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    recordIcon: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: colors.primaryLight,
    },

    recordInformation: {
        flex: 1,
        minWidth: 190,
    },

    recordTitle: {
        color: colors.textPrimary,
        fontSize: 11,
        fontWeight: "900",
    },

    recordSubtitle: {
        marginTop: 4,
        color: colors.textSecondary,
        fontSize: 10,
    },

    recordDetail: {
        marginTop: 4,
        color: colors.textMuted,
        fontSize: 8,
    },

    recordRightSection: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: spacing.sm,
    },

    recordActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    recordActionButton: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.md,
        backgroundColor: colors.background,
    },

    activateButton: {
        minHeight: 36,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.primaryLight,
    },

    activateButtonText: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: "800",
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
    },

    statusBadgeText: {
        fontSize: 8,
        fontWeight: "900",
    },

    successBadge: {
        backgroundColor: colors.successLight,
    },

    successBadgeText: {
        color: colors.success,
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

    primaryBadge: {
        backgroundColor: colors.primaryLight,
    },

    primaryBadgeText: {
        color: colors.primary,
    },

    neutralBadge: {
        backgroundColor: colors.background,
    },

    neutralBadgeText: {
        color: colors.textSecondary,
    },

    emptyState: {
        alignItems: "center",
        paddingVertical: 70,
    },

    emptyTitle: {
        marginTop: spacing.md,
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "900",
    },

    emptyDescription: {
        marginTop: spacing.sm,
        color: colors.textMuted,
        fontSize: 10,
    },
});