import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { api, clearAuthSession, getStoredUser, saveCurrentUser } from "../api/client";
import { colors, radius, spacing } from "../theme";
import TenureExLogo from "./Logo/TenureExLogo";
import MaintenanceNotificationBell from "./MaintenanceNotificationBell";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type MaintenanceUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  userType: string;
  accountRoles?: string[];
  status: string;
};

type NavigationItem = {
  label: string;
  icon: IconName;
  route: Href;
  matches?: (pathname: string) => boolean;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/maintenance/dashboard" as Href,
    matches: (pathname) => pathname === "/maintenance/dashboard",
  },
  {
    label: "Available Jobs",
    icon: "briefcase-search-outline",
    route: "/maintenance/available-jobs" as Href,
    matches: (pathname) => pathname === "/maintenance/available-jobs",
  },
  {
    label: "Assigned Jobs",
    icon: "clipboard-text-clock-outline",
    route: "/maintenance/assigned-jobs" as Href,
    matches: (pathname) =>
      pathname === "/maintenance/assigned-jobs" || pathname === "/maintenance/job-details",
  },
  {
    label: "Completed Jobs",
    icon: "check-circle-outline",
    route: "/maintenance/completed-jobs" as Href,
    matches: (pathname) => pathname === "/maintenance/completed-jobs",
  },
  {
    label: "Messages",
    icon: "message-text-outline",
    route: "/maintenance/messages" as Href,
    matches: (pathname) => pathname === "/maintenance/messages",
  },
  {
    label: "Settings",
    icon: "cog-outline",
    route: "/maintenance/settings" as Href,
    matches: (pathname) => pathname === "/maintenance/settings",
  },
];

interface MaintenanceScreenContainerProps extends PropsWithChildren {
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardAware?: boolean;
}

export default function MaintenanceScreenContainer({
  children,
  scrollable = false,
  contentStyle,
  keyboardAware = false,
}: MaintenanceScreenContainerProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<MaintenanceUser | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const stored = await getStoredUser<MaintenanceUser>("maintenance");
        if (active && stored) setCurrentUser(stored);

        const response = await api.get<MaintenanceUser>("/auth/me", {
          _tenureExRole: "maintenance",
        } as any);
        if (!active) return;

        const roles = response.data.accountRoles?.length
          ? response.data.accountRoles
          : [response.data.userType];

        if (!roles.includes("MAINTENANCE_PROVIDER") || response.data.status !== "ACTIVE") {
          await clearAuthSession("maintenance");
          router.replace("/auth/maintenance/login" as Href);
          return;
        }

        setCurrentUser(response.data);
        await saveCurrentUser(response.data, "maintenance");
      } catch {
        // Individual maintenance pages already handle their own API/session errors.
      }
    };

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  const isDesktop = mounted && width >= 1050;
  const isTablet = mounted && width >= 700;

  const displayName = useMemo(() => {
    if (!currentUser) return "Maintenance Provider";
    return (
      `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
      currentUser.email ||
      "Maintenance Provider"
    );
  }, [currentUser]);

  const initials = useMemo(() => {
    const first = currentUser?.firstName?.trim().charAt(0) ?? "";
    const last = currentUser?.lastName?.trim().charAt(0) ?? "";
    return `${first}${last}`.toUpperCase() || "MP";
  }, [currentUser]);

  const navigate = (item: NavigationItem) => {
    setMenuOpen(false);
    router.push(item.route);
  };

  const signOut = async () => {
    await clearAuthSession("maintenance");
    router.replace("/auth/maintenance/login" as Href);
  };

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  const pageContent = keyboardAware ? (
    <KeyboardAvoidingView
      style={styles.keyboardArea}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.appShell}>
        {isDesktop ? (
          <View style={styles.sidebar}>
            <View style={styles.sidebarBrand}>
              <TenureExLogo light />
            </View>

            <View style={styles.providerCard}>
              <View style={styles.providerIcon}>
                <MaterialCommunityIcons name="tools" size={22} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.providerTitle}>Maintenance Provider</Text>
                <Text style={styles.providerSubtitle} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>MAINTENANCE PORTAL</Text>

            <View style={styles.navList}>
              {navigationItems.map((item) => {
                const selected = item.matches?.(pathname) ?? pathname === item.route;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => navigate(item)}
                    style={[styles.navItem, selected && styles.navItemActive]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={selected ? colors.white : "#D7EEF4"}
                    />
                    <Text style={[styles.navText, selected && styles.navTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sidebarFooter}>
              <Avatar.Text
                size={40}
                label={initials}
                style={styles.footerAvatar}
                labelStyle={styles.footerAvatarLabel}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.footerName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.footerRole}>Maintenance Provider</Text>
              </View>
              <Pressable onPress={() => void signOut()} style={styles.logoutButton}>
                <MaterialCommunityIcons name="logout" size={20} color="#EAF7FA" />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.mainArea}>
          {!isDesktop ? (
            <View style={styles.mobileTopBar}>
              <View style={styles.mobileTopBarLeft}>
                <Pressable
                  onPress={() => setMenuOpen((value) => !value)}
                  style={styles.mobileMenuButton}
                >
                  <MaterialCommunityIcons
                    name={menuOpen ? "close" : "menu"}
                    size={24}
                    color={colors.textPrimary}
                  />
                </Pressable>
                <TenureExLogo compact />
              </View>
              <View style={styles.mobileTopBarRight}>
                <MaintenanceNotificationBell />
                {isTablet ? (
                  <Pressable onPress={() => router.push("/maintenance/settings" as Href)}>
                    <Avatar.Text
                      size={38}
                      label={initials}
                      style={styles.mobileAvatar}
                      labelStyle={styles.mobileAvatarLabel}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          {!isDesktop && menuOpen ? (
            <>
              <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
              <View style={styles.mobileMenu}>
                <Text style={styles.mobileMenuLabel}>MAINTENANCE PORTAL</Text>
                {navigationItems.map((item) => {
                  const selected = item.matches?.(pathname) ?? pathname === item.route;
                  return (
                    <Pressable
                      key={item.label}
                      onPress={() => navigate(item)}
                      style={[styles.mobileNavItem, selected && styles.mobileNavItemActive]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={selected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[styles.mobileNavText, selected && styles.mobileNavTextActive]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable onPress={() => void signOut()} style={styles.mobileSignOut}>
                  <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
                  <Text style={styles.mobileSignOutText}>Sign out</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          <View style={styles.pageContent}>{pageContent}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  appShell: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 274,
    backgroundColor: "#084F61",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 16,
  },
  sidebarBrand: { paddingHorizontal: 4, marginBottom: 24 },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  providerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  providerTitle: { color: colors.white, fontWeight: "900", fontSize: 13 },
  providerSubtitle: { color: "#B7DCE5", fontSize: 10, marginTop: 2 },
  sectionLabel: {
    color: "#78AEBB",
    fontSize: 10,
    letterSpacing: 2.1,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  navList: { gap: 5 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  navItemActive: { backgroundColor: "#0B7188" },
  navText: { color: "#D7EEF4", fontWeight: "800", fontSize: 14 },
  navTextActive: { color: colors.white },
  sidebarFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerAvatar: { backgroundColor: "#D9A62E" },
  footerAvatarLabel: { fontSize: 13, fontWeight: "900" },
  footerName: { color: colors.white, fontWeight: "900", fontSize: 12 },
  footerRole: { color: "#9BC8D2", fontSize: 10, marginTop: 2 },
  logoutButton: { padding: 8 },
  mainArea: { flex: 1, minWidth: 0, backgroundColor: colors.background },
  pageContent: { flex: 1, minHeight: 0 },
  keyboardArea: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    padding: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  mobileTopBar: {
    minHeight: 70,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 30,
  },
  mobileTopBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  mobileTopBarRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  mobileMenuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileAvatar: { backgroundColor: colors.primaryLight },
  mobileAvatarLabel: { color: colors.primary, fontWeight: "900", fontSize: 12 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    top: 70,
    backgroundColor: "rgba(8,29,38,0.28)",
    zIndex: 40,
  },
  mobileMenu: {
    position: "absolute",
    top: 70,
    left: 0,
    width: 290,
    maxWidth: "86%",
    bottom: 0,
    backgroundColor: colors.white,
    padding: 14,
    zIndex: 50,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: 4,
  },
  mobileMenuLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "900",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  mobileNavItem: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mobileNavItemActive: { backgroundColor: colors.primaryLight },
  mobileNavText: { color: colors.textSecondary, fontSize: 14, fontWeight: "800" },
  mobileNavTextActive: { color: colors.primary },
  mobileSignOut: {
    marginTop: "auto",
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  mobileSignOutText: { color: colors.error, fontWeight: "900" },
});
