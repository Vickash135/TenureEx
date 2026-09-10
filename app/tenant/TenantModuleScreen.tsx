import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Avatar } from "react-native-paper";

import { api, clearAuthSession, getStoredUser, saveCurrentUser } from "../../src/api/client";
import TenureExLogo from "../../src/components/Logo/TenureExLogo";
import WorkflowNotificationBell from "../../src/components/WorkflowNotificationBell";
import { colors, radius, spacing } from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type TenantUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  accountRoles?: string[];
  status: string;
};

type TenantProperty = {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  townCity?: string | null;
  postcode: string;
};

type ActiveTenancy = {
  id: string;
  propertyId: string;
  applicationId: string;
  status: string;
  property?: TenantProperty | null;
};

type NavigationItem = {
  label: string;
  icon: IconName;
  route: Href;
  propertyScoped?: boolean;
  applicationScoped?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: "view-dashboard-outline", route: "/tenant/dashboard" as Href },
  { label: "My Home", icon: "home-account", route: "/tenant/my-property" as Href, propertyScoped: true, applicationScoped: true },
  { label: "Maintenance", icon: "tools", route: "/tenant/maintenance" as Href, propertyScoped: true },
  { label: "Council & Inspections", icon: "clipboard-search-outline", route: "/tenant/council-inspections" as Href, propertyScoped: true },
  { label: "Payments", icon: "credit-card-outline", route: "/tenant/payments" as Href, propertyScoped: true },
  { label: "Documents", icon: "file-document-multiple-outline", route: "/tenant/documents" as Href, propertyScoped: true, applicationScoped: true },
  { label: "Messages", icon: "message-text-outline", route: "/tenant/messages" as Href },
  { label: "Settings", icon: "cog-outline", route: "/tenant/settings" as Href },
];

type Props = {
  pageTitle: string;
  activePage: string;
  children: ReactNode;
};

export default function TenantModuleScreen({ pageTitle, activePage, children }: Props) {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  const [activeTenancy, setActiveTenancy] = useState<ActiveTenancy | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const stored = await getStoredUser<TenantUser>();
        if (active && stored) setCurrentUser(stored);

        const [meResponse, tenancyResponse] = await Promise.all([
          api.get<TenantUser>("/auth/me"),
          api.get<ActiveTenancy[]>("/property-workflows/tenant/my-properties"),
        ]);
        if (!active) return;

        const roles = meResponse.data.accountRoles?.length
          ? meResponse.data.accountRoles
          : [meResponse.data.userType];
        if (!roles.includes("TENANT") || meResponse.data.status !== "ACTIVE") {
          await clearAuthSession("tenant");
          router.replace("/auth/tenant/login" as Href);
          return;
        }

        setCurrentUser(meResponse.data);
        await saveCurrentUser(meResponse.data, "tenant");
        const rows = Array.isArray(tenancyResponse.data) ? tenancyResponse.data : [];
        setActiveTenancy(rows.find((row) => row.status === "ACTIVE" && row.property) ?? null);
      } catch (error) {
        console.error("Failed to load tenant portal shell:", error);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const isDesktop = mounted && width >= 1050;
  const isTablet = mounted && width >= 700;
  const displayName = useMemo(() => {
    if (!currentUser) return "Tenant";
    return `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() || "Tenant";
  }, [currentUser]);
  const initials = useMemo(() => {
    const first = currentUser?.firstName?.trim().charAt(0) ?? "";
    const last = currentUser?.lastName?.trim().charAt(0) ?? "";
    return `${first}${last}`.toUpperCase() || "T";
  }, [currentUser]);
  const propertyAddress = useMemo(() => {
    const property = activeTenancy?.property;
    if (!property) return "No active tenancy";
    return [property.addressLine1, property.addressLine2, property.townCity, property.postcode].filter(Boolean).join(", ");
  }, [activeTenancy]);

  const navigate = (item: NavigationItem) => {
    setMenuOpen(false);
    if (activeTenancy && (item.propertyScoped || item.applicationScoped)) {
      router.push({
        pathname: item.route as never,
        params: {
          ...(item.propertyScoped ? { propertyId: activeTenancy.propertyId } : {}),
          ...(item.applicationScoped ? { applicationId: activeTenancy.applicationId } : {}),
        },
      });
      return;
    }
    router.push(item.route);
  };

  const signOut = async () => {
    await clearAuthSession("tenant");
    router.replace("/auth/tenant/login" as Href);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {isDesktop ? (
          <View style={styles.sidebar}>
            <View style={styles.sidebarBrand}><TenureExLogo /></View>
            <View style={styles.homeCard}>
              <View style={styles.homeIcon}><MaterialCommunityIcons name="home-account" size={22} color={colors.white} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.homeTitle}>My Home</Text>
                <Text style={styles.homeSubtitle} numberOfLines={2}>{propertyAddress}</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>TENANT PORTAL</Text>
            <View style={styles.navList}>
              {navigationItems.map((item) => {
                const selected = item.label === activePage;
                return (
                  <Pressable key={item.label} onPress={() => navigate(item)} style={[styles.navItem, selected && styles.navItemActive]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={selected ? colors.white : "#D7EEF4"} />
                    <Text style={[styles.navText, selected && styles.navTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.sidebarFooter}>
              <Avatar.Text size={40} label={initials} style={styles.footerAvatar} labelStyle={styles.footerAvatarLabel} />
              <View style={{ flex: 1 }}>
                <Text style={styles.footerName} numberOfLines={1}>{displayName}</Text>
                <Text style={styles.footerRole}>Tenant</Text>
              </View>
              <Pressable onPress={() => void signOut()} style={styles.logoutButton}>
                <MaterialCommunityIcons name="logout" size={20} color="#EAF7FA" />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.mainArea}>
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {!isDesktop ? (
                <Pressable onPress={() => setMenuOpen((v) => !v)} style={styles.headerButton}>
                  <MaterialCommunityIcons name={menuOpen ? "close" : "menu"} size={24} color={colors.textPrimary} />
                </Pressable>
              ) : null}
              {!isDesktop ? <TenureExLogo compact /> : (
                <View>
                  <Text style={styles.topBarTitle}>{pageTitle}</Text>
                  <Text style={styles.topBarSubtitle}>Tenant Workspace</Text>
                </View>
              )}
            </View>
            <View style={styles.topBarActions}>
              <WorkflowNotificationBell role="tenant" />
              {isTablet ? (
                <Pressable style={styles.profile} onPress={() => router.push("/tenant/settings" as Href)}>
                  <Avatar.Text size={38} label={initials} style={styles.avatar} labelStyle={styles.avatarLabel} />
                  <View>
                    <Text style={styles.profileName}>{displayName}</Text>
                    <Text style={styles.profileRole}>Tenant</Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          </View>

          {!isDesktop && menuOpen ? (
            <>
              <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
              <View style={styles.mobileMenu}>
                {navigationItems.map((item) => {
                  const selected = item.label === activePage;
                  return (
                    <Pressable key={item.label} onPress={() => navigate(item)} style={[styles.mobileNavItem, selected && styles.mobileNavItemActive]}>
                      <MaterialCommunityIcons name={item.icon} size={20} color={selected ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.mobileNavText, selected && styles.mobileNavTextActive]}>{item.label}</Text>
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

          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  appShell: { flex: 1, flexDirection: "row" },
  sidebar: { width: 274, backgroundColor: "#084F61", paddingHorizontal: 16, paddingTop: 22, paddingBottom: 16 },
  sidebarBrand: { paddingHorizontal: 4, marginBottom: 26 },
  homeCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.xl, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  homeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  homeTitle: { color: colors.white, fontWeight: "900", fontSize: 14 },
  homeSubtitle: { color: "#B7DCE5", fontSize: 10, marginTop: 2 },
  sectionLabel: { color: "#78AEBB", fontSize: 10, letterSpacing: 2.1, fontWeight: "900", marginTop: 24, marginBottom: 10, paddingHorizontal: 12 },
  navList: { gap: 5 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingHorizontal: 14, borderRadius: 12 },
  navItemActive: { backgroundColor: "#0B7188" },
  navText: { color: "#D7EEF4", fontWeight: "800", fontSize: 14 },
  navTextActive: { color: colors.white },
  sidebarFooter: { marginTop: "auto", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.14)", paddingTop: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  footerAvatar: { backgroundColor: "#D9A62E" },
  footerAvatarLabel: { fontSize: 13, fontWeight: "900" },
  footerName: { color: colors.white, fontWeight: "900", fontSize: 12 },
  footerRole: { color: "#9BC8D2", fontSize: 10, marginTop: 2 },
  logoutButton: { padding: 8 },
  mainArea: { flex: 1, minWidth: 0, backgroundColor: colors.background },
  topBar: { minHeight: 76, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 30 },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  topBarTitle: { fontSize: 20, fontWeight: "900", color: colors.textPrimary },
  topBarSubtitle: { marginTop: 1, fontSize: 11, color: colors.textSecondary },
  topBarActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  profile: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { backgroundColor: colors.primaryLight },
  avatarLabel: { color: colors.primary, fontWeight: "900", fontSize: 12 },
  profileName: { color: colors.textPrimary, fontSize: 12, fontWeight: "900" },
  profileRole: { color: colors.textSecondary, fontSize: 10, marginTop: 1 },
  content: { flex: 1, minHeight: 0 },
  backdrop: { ...StyleSheet.absoluteFillObject, top: 76, backgroundColor: "rgba(8,29,38,0.28)", zIndex: 40 },
  mobileMenu: { position: "absolute", top: 76, left: 0, width: 290, maxWidth: "86%", bottom: 0, backgroundColor: colors.white, padding: 14, zIndex: 50, borderRightWidth: 1, borderRightColor: colors.border, gap: 4 },
  mobileNavItem: { minHeight: 48, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  mobileNavItemActive: { backgroundColor: colors.primaryLight },
  mobileNavText: { color: colors.textSecondary, fontSize: 14, fontWeight: "800" },
  mobileNavTextActive: { color: colors.primary },
  mobileSignOut: { marginTop: "auto", minHeight: 48, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12 },
  mobileSignOutText: { color: colors.error, fontWeight: "900" },
});
