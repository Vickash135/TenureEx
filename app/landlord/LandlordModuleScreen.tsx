import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { ReactNode, useEffect, useMemo, useState } from "react";
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

import { api, clearAuthSession, getStoredUser, saveCurrentUser } from "../../src/api/client";
import TenureExLogo from "../../src/components/Logo/TenureExLogo";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type LandlordUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  userType: string;
  accountRoles?: string[];
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type LandlordPropertySummary = {
  id: string;
};


export type LandlordStatistic = {
  label: string;
  value: string;
  icon: IconName;
  helper?: string;
};

type LandlordModuleScreenProps = {
  pageTitle: string;
  pageSubtitle: string;
  activePage: string;
  children: ReactNode;
  statistics?: LandlordStatistic[];
  primaryAction?: string;
  primaryActionIcon?: IconName;
  onPrimaryAction?: () => void;
};

type NavigationItem = {
  label: string;
  icon: IconName;
  route: Href;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/landlord/dashboard" as Href,
  },
  {
    label: "Properties",
    icon: "office-building-outline",
    route: "/landlord/properties" as Href,
  },
  {
    label: "Maintenance",
    icon: "tools",
    route: "/landlord/maintenance" as Href,
  },
  {
    label: "Council & Inspections",
    icon: "clipboard-search-outline",
    route: "/landlord/council-inspections" as Href,
  },
  {
    label: "Documents",
    icon: "file-document-multiple-outline",
    route: "/landlord/documents" as Href,
  },
  {
    label: "Payments",
    icon: "credit-card-outline",
    route: "/landlord/payments" as Href,
  },
  {
    label: "Messages",
    icon: "message-text-outline",
    route: "/landlord/messages" as Href,
  },
  {
    label: "Settings",
    icon: "cog-outline",
    route: "/landlord/settings" as Href,
  },
];

export default function LandlordModuleScreen({
  pageTitle,
  pageSubtitle,
  activePage,
  children,
  statistics = [],
  primaryAction,
  primaryActionIcon = "plus",
  onPrimaryAction,
}: LandlordModuleScreenProps) {
  const { width } = useWindowDimensions();

  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<LandlordUser | null>(null);
  const [propertyCount, setPropertyCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadLandlordSession = async () => {
      try {
        // Show the locally stored user immediately, then refresh it from
        // the backend so the header always represents the active JWT user.
        const storedUser = await getStoredUser<LandlordUser>();

        if (active && (storedUser?.accountRoles ?? [storedUser?.userType]).includes("LANDLORD")) {
          setCurrentUser(storedUser);
        }

        const [meResponse, propertiesResponse] = await Promise.all([
          api.get<LandlordUser>("/auth/me"),
          api.get<LandlordPropertySummary[]>("/landlord-properties"),
        ]);

        if (!active) {
          return;
        }

        if (
          !(meResponse.data.accountRoles ?? [meResponse.data.userType]).includes("LANDLORD") ||
          meResponse.data.status !== "ACTIVE"
        ) {
          await clearAuthSession("landlord");
          router.replace("/auth/landlord/login" as Href);
          return;
        }

        setCurrentUser(meResponse.data);
        setPropertyCount(propertiesResponse.data?.length ?? 0);
        await saveCurrentUser(meResponse.data, "landlord");
      } catch (error) {
        console.error("Failed to load landlord session:", error);

        if (!active) {
          return;
        }

        // If the JWT is invalid/expired, clear the old identity instead of
        // continuing to display somebody else's cached name.
        setCurrentUser(null);
        setPropertyCount(0);
      }
    };

    void loadLandlordSession();

    return () => {
      active = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!currentUser) {
      return "Landlord";
    }

    return `${currentUser.firstName} ${currentUser.lastName}`.trim() || "Landlord";
  }, [currentUser]);

  const initials = useMemo(() => {
    if (!currentUser) {
      return "L";
    }

    const first = currentUser.firstName?.trim().charAt(0) ?? "";
    const last = currentUser.lastName?.trim().charAt(0) ?? "";

    return `${first}${last}`.toUpperCase() || "L";
  }, [currentUser]);

  // Keep SSR and the first browser render identical.
  // Width-dependent layout is enabled only after hydration.
  const isDesktop = isMounted && width >= 1050;
  const isTablet = isMounted && width >= 700;

  const navigateTo = (route: Href) => {
    setMenuOpen(false);
    router.push(route);
  };

  const handleSignOut = async () => {
    await clearAuthSession("landlord");
    router.replace("/auth/landlord/login" as Href);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {isDesktop ? (
          <LandlordSidebar
            activePage={activePage}
            displayName={displayName}
            initials={initials}
            propertyCount={propertyCount}
            onNavigate={navigateTo}
            onSignOut={() => void handleSignOut()}
          />
        ) : null}

        <View style={styles.mainArea}>
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {!isDesktop ? (
                <Pressable
                  onPress={() => setMenuOpen((current) => !current)}
                  style={styles.headerIconButton}
                >
                  <MaterialCommunityIcons
                    name={menuOpen ? "close" : "menu"}
                    size={24}
                    color={colors.textPrimary}
                  />
                </Pressable>
              ) : null}

              {!isDesktop ? (
                <TenureExLogo compact />
              ) : (
                <View>
                  <Text style={styles.topBarTitle}>{pageTitle}</Text>

                  <Text style={styles.topBarSubtitle}>
                    Landlord Workspace
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.topBarActions}>
              <Pressable style={styles.headerIconButton}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={22}
                  color={colors.textSecondary}
                />

                <View style={styles.notificationDot} />
              </Pressable>

              {isTablet ? (
                <View style={styles.profile}>
                  <Avatar.Text
                    size={38}
                    label={initials}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />

                  <View>
                    <Text style={styles.profileName}>
                      {displayName}
                    </Text>

                    <Text style={styles.profileRole}>
                      Property owner
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          {!isDesktop && menuOpen ? (
            <>
              <Pressable
                onPress={() => setMenuOpen(false)}
                style={styles.menuBackdrop}
              />

              <View style={styles.mobileMenu}>
                <LandlordNavigation
                  activePage={activePage}
                  mobile
                  onNavigate={navigateTo}
                />

                <Pressable
                  onPress={() => void handleSignOut()}
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
              </View>
            </>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageContent}
          >
            <View style={styles.pageContainer}>
              <View style={styles.pageHeader}>
                <View style={styles.pageHeading}>
                  <Text style={styles.eyebrow}>
                    LANDLORD PORTAL
                  </Text>

                  <Text style={styles.pageTitle}>
                    {pageTitle}
                  </Text>

                  <Text style={styles.pageSubtitle}>
                    {pageSubtitle}
                  </Text>
                </View>

                {primaryAction ? (
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

              {statistics.length > 0 ? (
                <View style={styles.statisticsGrid}>
                  {statistics.map((statistic) => (
                    <View
                      key={statistic.label}
                      style={[
                        styles.statisticCard,
                        isTablet
                          ? styles.desktopStatisticCard
                          : styles.mobileStatisticCard,
                      ]}
                    >
                      <View style={styles.statisticIcon}>
                        <MaterialCommunityIcons
                          name={statistic.icon}
                          size={23}
                          color={colors.primary}
                        />
                      </View>

                      <Text style={styles.statisticValue}>
                        {statistic.value}
                      </Text>

                      <Text style={styles.statisticLabel}>
                        {statistic.label}
                      </Text>

                      {statistic.helper ? (
                        <Text style={styles.statisticHelper}>
                          {statistic.helper}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.contentArea}>
                {children}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LandlordSidebar({
  activePage,
  displayName,
  initials,
  propertyCount,
  onNavigate,
  onSignOut,
}: {
  activePage: string;
  displayName: string;
  initials: string;
  propertyCount: number;
  onNavigate: (route: Href) => void;
  onSignOut: () => void;
}) {
  return (
    <View style={styles.sidebar}>
      <TenureExLogo light compact />

      <View style={styles.portfolioCard}>
        <View style={styles.portfolioIcon}>
          <MaterialCommunityIcons
            name="home-city-outline"
            size={22}
            color={colors.white}
          />
        </View>

        <View style={styles.portfolioDetails}>
          <Text style={styles.portfolioName}>
            Property Portfolio
          </Text>

          <Text style={styles.portfolioPlan}>
            {propertyCount} managed {propertyCount === 1 ? "property" : "properties"}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color="rgba(255,255,255,0.70)"
        />
      </View>

      <ScrollView
        style={styles.sidebarScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.navigationLabel}>
          PORTFOLIO
        </Text>

        <LandlordNavigation
          activePage={activePage}
          onNavigate={onNavigate}
        />
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Avatar.Text
          size={39}
          label={initials}
          style={styles.sidebarAvatar}
          labelStyle={styles.sidebarAvatarLabel}
        />

        <View style={styles.sidebarUser}>
          <Text style={styles.sidebarUserName}>
            {displayName}
          </Text>

          <Text style={styles.sidebarUserRole}>
            Property owner
          </Text>
        </View>

        <Pressable onPress={onSignOut}>
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color="rgba(255,255,255,0.75)"
          />
        </Pressable>
      </View>
    </View>
  );
}

function LandlordNavigation({
  activePage,
  mobile = false,
  onNavigate,
}: {
  activePage: string;
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

            {item.label === "Messages" ? (
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>
                  0
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
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

  portfolioCard: {
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

  portfolioIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  portfolioDetails: {
    flex: 1,
    minWidth: 0,
  },

  portfolioName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },

  portfolioPlan: {
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
    minWidth: 0,
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

  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
    width: "100%",
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
    width: "100%",
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

  contentArea: {
    width: "100%",
    marginTop: spacing.xl,
  },
});