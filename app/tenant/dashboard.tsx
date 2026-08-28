import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Avatar, Button } from "react-native-paper";

import {
  api,
  clearAuthSession,
  getStoredUser,
  saveCurrentUser,
} from "../../src/api/client";
import TenureExLogo from "../../src/components/Logo/TenureExLogo";
import { colors, radius, spacing } from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type TenantUser = {
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

type TenantProperty = {
  id: string;
  landlordProfileId: string;
  addressLine1: string;
  addressLine2?: string | null;
  townCity: string;
  county?: string | null;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  receptionRooms: number;
  monthlyRent: string | number;
  tenantMonthlyRent?: string | number | null;
  depositAmount?: string | number | null;
  councilTaxBand?: string | null;
  furnishingStatus?: string | null;
  propertyStatus: string;
  approvalStatus: string;
  availableFrom?: string | null;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  childrenAllowed?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasLift?: boolean;
  hasWheelchairAccess?: boolean;
  description?: string | null;
  photoNames?: string[];
};

type ActiveTenancy = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  tenantProfileId: string;
  applicationId: string;
  status: string;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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
  {
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/tenant/dashboard" as Href,
  },
  {
    label: "My Home",
    icon: "home-account",
    route: "/tenant/my-property" as Href,
    propertyScoped: true,
    applicationScoped: true,
  },
  {
    label: "Maintenance",
    icon: "tools",
    route: "/tenant/maintenance" as Href,
    propertyScoped: true,
  },
  {
    label: "Payments",
    icon: "credit-card-outline",
    route: "/tenant/payments" as Href,
    propertyScoped: true,
  },
  {
    label: "Documents",
    icon: "file-document-multiple-outline",
    route: "/tenant/documents" as Href,
    propertyScoped: true,
    applicationScoped: true,
  },
  {
    label: "Messages",
    icon: "message-text-outline",
    route: "/tenant/messages" as Href,
  },
  {
    label: "Settings",
    icon: "cog-outline",
    route: "/tenant/settings" as Href,
  },
];

export default function TenantDashboardScreen() {
  const { width } = useWindowDimensions();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  const [activeTenancy, setActiveTenancy] = useState<ActiveTenancy | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const storedUser = await getStoredUser<TenantUser>();

        if (active && storedUser) {
          setCurrentUser(storedUser);
        }

        const [meResponse, propertiesResponse] = await Promise.all([
          api.get<TenantUser>("/auth/me"),
          api.get<ActiveTenancy[]>("/property-workflows/tenant/my-properties"),
        ]);

        if (!active) {
          return;
        }

        const roles =
          meResponse.data.accountRoles?.length
            ? meResponse.data.accountRoles
            : [meResponse.data.userType];

        if (!roles.includes("TENANT")) {
          await clearAuthSession("tenant");
          router.replace("/auth/tenant/login" as Href);
          return;
        }

        setCurrentUser(meResponse.data);
        await saveCurrentUser(meResponse.data, "tenant");

        const tenancies = Array.isArray(propertiesResponse.data)
          ? propertiesResponse.data
          : [];

        // The workflow creates PropertyTenant only after the Estate Agent
        // approves the application. The endpoint is ordered newest first,
        // so the first ACTIVE record is the tenant's current approved home.
        const current =
          tenancies.find(
            (item) =>
              item.status === "ACTIVE" &&
              item.property,
          ) ?? null;

        setActiveTenancy(current);
      } catch (requestError: any) {
        if (!active) {
          return;
        }

        console.error("Failed to load tenant dashboard:", requestError);
        setActiveTenancy(null);
        setError(
          requestError?.response?.data?.message ||
            "Unable to load your tenancy at the moment.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const isDesktop = mounted && width >= 1050;
  const isTablet = mounted && width >= 700;

  const displayName = useMemo(() => {
    if (!currentUser) {
      return "Tenant";
    }

    return (
      `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
      "Tenant"
    );
  }, [currentUser]);

  const firstName = currentUser?.firstName?.trim() || "Tenant";

  const initials = useMemo(() => {
    const first = currentUser?.firstName?.trim().charAt(0) ?? "";
    const last = currentUser?.lastName?.trim().charAt(0) ?? "";

    return `${first}${last}`.toUpperCase() || "T";
  }, [currentUser]);

  const property = activeTenancy?.property ?? null;

  const propertyAddress = useMemo(() => {
    if (!property) {
      return "";
    }

    return [
      property.addressLine1,
      property.addressLine2,
      property.townCity,
      property.postcode,
    ]
      .filter(Boolean)
      .join(", ");
  }, [property]);

  const rent = property
    ? numberValue(property.tenantMonthlyRent ?? property.monthlyRent)
    : 0;

  const deposit = property
    ? numberValue(property.depositAmount)
    : 0;

  const navigate = (item: NavigationItem) => {
    setMenuOpen(false);

    if (!activeTenancy) {
      router.push(item.route);
      return;
    }

    if (item.propertyScoped || item.applicationScoped) {
      router.push({
        pathname: item.route as never,
        params: {
          ...(item.propertyScoped
            ? { propertyId: activeTenancy.propertyId }
            : {}),
          ...(item.applicationScoped
            ? { applicationId: activeTenancy.applicationId }
            : {}),
        },
      });

      return;
    }

    router.push(item.route);
  };

  const openScopedRoute = (
    route: Href,
    options?: {
      includeApplication?: boolean;
    },
  ) => {
    if (!activeTenancy) {
      return;
    }

    router.push({
      pathname: route as never,
      params: {
        propertyId: activeTenancy.propertyId,
        ...(options?.includeApplication
          ? { applicationId: activeTenancy.applicationId }
          : {}),
      },
    });
  };

  const handleSignOut = async () => {
    await clearAuthSession("tenant");
    router.replace("/auth/tenant/login" as Href);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {isDesktop ? (
          <TenantSidebar
            activeTenancy={activeTenancy}
            displayName={displayName}
            initials={initials}
            propertyAddress={propertyAddress}
            onNavigate={navigate}
            onSignOut={() => void handleSignOut()}
          />
        ) : null}

        <View style={styles.mainArea}>
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {!isDesktop ? (
                <Pressable
                  onPress={() =>
                    setMenuOpen((current) => !current)
                  }
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
                  <Text style={styles.topBarTitle}>
                    Dashboard
                  </Text>
                  <Text style={styles.topBarSubtitle}>
                    Tenant Workspace
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.topBarActions}>
              <Pressable
                style={styles.headerIconButton}
                onPress={() =>
                  router.push(
                    "/tenant/messages" as Href,
                  )
                }
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>

              {isTablet ? (
                <Pressable
                  style={styles.profile}
                  onPress={() =>
                    router.push(
                      "/tenant/settings" as Href,
                    )
                  }
                >
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
                      Tenant
                    </Text>
                  </View>
                </Pressable>
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
                <TenantNavigation
                  activeTenancy={activeTenancy}
                  onNavigate={navigate}
                  mobile
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
              {loading ? (
                <LoadingState />
              ) : !activeTenancy || !property ? (
                <NoActiveTenancyState
                  firstName={firstName}
                  error={error}
                  onSignOut={() => void handleSignOut()}
                />
              ) : (
                <>
                  <View style={styles.pageHeader}>
                    <View style={styles.pageHeading}>
                      <Text style={styles.eyebrow}>
                        TENANT PORTAL
                      </Text>
                      <Text style={styles.pageTitle}>
                        Welcome home, {firstName}
                      </Text>
                      <Text style={styles.pageSubtitle}>
                        Everything here is for your approved tenancy at {propertyAddress}.
                      </Text>
                    </View>

                    <View style={styles.activeBadge}>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={18}
                        color={colors.success}
                      />
                      <Text style={styles.activeBadgeText}>
                        Active tenancy
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.hero,
                      !isTablet && styles.heroStacked,
                    ]}
                  >
                    <View style={styles.heroMain}>
                      <View style={styles.heroIcon}>
                        <MaterialCommunityIcons
                          name="home-account"
                          size={36}
                          color={colors.white}
                        />
                      </View>

                      <View style={styles.heroText}>
                        <Text style={styles.heroEyebrow}>
                          YOUR HOME
                        </Text>
                        <Text style={styles.heroTitle}>
                          {property.addressLine1}
                        </Text>
                        <Text style={styles.heroAddress}>
                          {[property.addressLine2, property.townCity, property.postcode]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>

                        <View style={styles.heroFacts}>
                          <HeroFact
                            icon="bed-outline"
                            text={`${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"}`}
                          />
                          <HeroFact
                            icon="shower"
                            text={`${property.bathrooms} bathroom${property.bathrooms === 1 ? "" : "s"}`}
                          />
                          <HeroFact
                            icon="home-outline"
                            text={prettyEnum(property.propertyType)}
                          />
                        </View>
                      </View>
                    </View>

                    <Button
                      mode="contained"
                      icon="home-eye-outline"
                      buttonColor={colors.white}
                      textColor={colors.primary}
                      onPress={() =>
                        openScopedRoute(
                          "/tenant/my-property" as Href,
                          { includeApplication: true },
                        )
                      }
                    >
                      View my home
                    </Button>
                  </View>

                  <View style={styles.summaryGrid}>
                    <SummaryCard
                      label="Monthly rent"
                      value={formatCurrency(rent)}
                      helper="Your recorded monthly rent"
                      icon="cash-multiple"
                    />
                    <SummaryCard
                      label="Deposit"
                      value={
                        deposit > 0
                          ? formatCurrency(deposit)
                          : "Not recorded"
                      }
                      helper="Deposit held for this tenancy"
                      icon="shield-home-outline"
                    />
                    <SummaryCard
                      label="Tenancy status"
                      value="Active"
                      helper={`Since ${formatDate(activeTenancy.startedAt)}`}
                      icon="home-outline"
                    />
                    <SummaryCard
                      label="Council tax band"
                      value={property.councilTaxBand || "Not recorded"}
                      helper="Property council tax information"
                      icon="bank-outline"
                      compact
                    />
                  </View>

                  <View
                    style={[
                      styles.contentGrid,
                      !isDesktop && styles.contentGridStacked,
                    ]}
                  >
                    <View style={styles.mainColumn}>
                      <SectionHeading
                        title="Your tenancy"
                        subtitle="Key information for the property you have been approved to occupy."
                      />

                      <View style={styles.tenancyCard}>
                        <DetailRow
                          label="Property"
                          value={propertyAddress}
                          icon="map-marker-outline"
                        />
                        <DetailRow
                          label="Property type"
                          value={prettyEnum(property.propertyType)}
                          icon="home-outline"
                        />
                        <DetailRow
                          label="Furnishing"
                          value={prettyEnum(property.furnishingStatus || "NOT_RECORDED")}
                          icon="sofa-outline"
                        />
                        <DetailRow
                          label="Application reference"
                          value={activeTenancy.applicationId}
                          icon="file-check-outline"
                        />
                        <DetailRow
                          label="Tenancy started"
                          value={formatDate(activeTenancy.startedAt)}
                          icon="calendar-check-outline"
                          last
                        />
                      </View>

                      <SectionHeading
                        title="Property features"
                        subtitle="Features recorded against your approved home."
                      />

                      <View style={styles.featureCard}>
                        <FeaturePill
                          icon="bed-outline"
                          text={`${property.bedrooms} bedrooms`}
                        />
                        <FeaturePill
                          icon="shower"
                          text={`${property.bathrooms} bathrooms`}
                        />
                        {property.receptionRooms > 0 ? (
                          <FeaturePill
                            icon="sofa-outline"
                            text={`${property.receptionRooms} reception room${property.receptionRooms === 1 ? "" : "s"}`}
                          />
                        ) : null}
                        {property.hasParking ? (
                          <FeaturePill
                            icon="car-outline"
                            text="Parking"
                          />
                        ) : null}
                        {property.hasGarden ? (
                          <FeaturePill
                            icon="flower-outline"
                            text="Garden"
                          />
                        ) : null}
                        {property.hasLift ? (
                          <FeaturePill
                            icon="elevator"
                            text="Lift"
                          />
                        ) : null}
                        {property.hasWheelchairAccess ? (
                          <FeaturePill
                            icon="wheelchair-accessibility"
                            text="Wheelchair access"
                          />
                        ) : null}
                        {property.petsAllowed ? (
                          <FeaturePill
                            icon="paw-outline"
                            text="Pets allowed"
                          />
                        ) : null}
                        {!property.smokingAllowed ? (
                          <FeaturePill
                            icon="smoking-off"
                            text="No smoking"
                          />
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.sideColumn}>
                      <SectionHeading
                        title="Quick actions"
                        subtitle="Only actions related to this tenancy are shown."
                      />

                      <View style={styles.quickActionsCard}>
                        <QuickAction
                          icon="tools"
                          title="Report maintenance"
                          description="Report a repair and choose suitable appointment times."
                          onPress={() =>
                            openScopedRoute(
                              "/tenant/maintenance" as Href,
                            )
                          }
                        />
                        <QuickAction
                          icon="credit-card-outline"
                          title="Payments"
                          description="View rent, deposit and payment information."
                          onPress={() =>
                            openScopedRoute(
                              "/tenant/payments" as Href,
                            )
                          }
                        />
                        <QuickAction
                          icon="file-document-multiple-outline"
                          title="Tenancy documents"
                          description="Open your signed agreement and property documents."
                          onPress={() =>
                            openScopedRoute(
                              "/tenant/documents" as Href,
                              { includeApplication: true },
                            )
                          }
                        />
                        <QuickAction
                          icon="message-text-outline"
                          title="Messages"
                          description="Contact the people involved in managing your tenancy."
                          onPress={() =>
                            router.push(
                              "/tenant/messages" as Href,
                            )
                          }
                          last
                        />
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.supportGrid,
                      !isTablet && styles.supportGridStacked,
                    ]}
                  >
                    <View style={styles.supportCard}>
                      <View style={styles.supportIcon}>
                        <MaterialCommunityIcons
                          name="tools"
                          size={28}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.supportContent}>
                        <Text style={styles.supportTitle}>
                          Something needs fixing?
                        </Text>
                        <Text style={styles.supportText}>
                          Create a maintenance request for this property. You can describe the issue, add photos and provide suitable visit times.
                        </Text>
                      </View>
                      <Button
                        mode="contained"
                        icon="plus"
                        onPress={() =>
                          openScopedRoute(
                            "/tenant/maintenance" as Href,
                          )
                        }
                      >
                        New request
                      </Button>
                    </View>

                    <View style={styles.supportCard}>
                      <View style={styles.supportIcon}>
                        <MaterialCommunityIcons
                          name="file-sign"
                          size={28}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.supportContent}>
                        <Text style={styles.supportTitle}>
                          Your signed agreement
                        </Text>
                        <Text style={styles.supportText}>
                          The agreement you signed during onboarding stays linked to this approved tenancy and can be viewed at any time.
                        </Text>
                      </View>
                      <Button
                        mode="outlined"
                        icon="file-eye-outline"
                        onPress={() =>
                          openScopedRoute(
                            "/tenant/agreement" as Href,
                            { includeApplication: true },
                          )
                        }
                      >
                        View agreement
                      </Button>
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TenantSidebar({
  activeTenancy,
  displayName,
  initials,
  propertyAddress,
  onNavigate,
  onSignOut,
}: {
  activeTenancy: ActiveTenancy | null;
  displayName: string;
  initials: string;
  propertyAddress: string;
  onNavigate: (item: NavigationItem) => void;
  onSignOut: () => void;
}) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <TenureExLogo compact />
      </View>

      <View style={styles.sidebarHomeCard}>
        <View style={styles.sidebarHomeIcon}>
          <MaterialCommunityIcons
            name="home-account"
            size={21}
            color={colors.white}
          />
        </View>
        <View style={styles.sidebarHomeText}>
          <Text style={styles.sidebarHomeLabel}>
            CURRENT HOME
          </Text>
          <Text
            style={styles.sidebarHomeAddress}
            numberOfLines={2}
          >
            {activeTenancy
              ? propertyAddress
              : "No active tenancy"}
          </Text>
        </View>
      </View>

      <Text style={styles.sidebarSectionLabel}>
        TENANT WORKSPACE
      </Text>

      <TenantNavigation
        activeTenancy={activeTenancy}
        onNavigate={onNavigate}
      />

      <View style={styles.sidebarBottom}>
        <View style={styles.sidebarUser}>
          <Avatar.Text
            size={40}
            label={initials}
            style={styles.sidebarAvatar}
            labelStyle={styles.sidebarAvatarLabel}
          />
          <View style={styles.sidebarUserText}>
            <Text
              style={styles.sidebarUserName}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={styles.sidebarUserRole}>
              Tenant
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={onSignOut}
        >
          <MaterialCommunityIcons
            name="logout"
            size={19}
            color={colors.white}
          />
        </Pressable>
      </View>
    </View>
  );
}

function TenantNavigation({
  activeTenancy,
  onNavigate,
  mobile = false,
}: {
  activeTenancy: ActiveTenancy | null;
  onNavigate: (item: NavigationItem) => void;
  mobile?: boolean;
}) {
  return (
    <View style={mobile ? styles.mobileNavigation : styles.navigation}>
      {navigationItems.map((item) => {
        const requiresTenancy =
          item.propertyScoped || item.applicationScoped;
        const disabled = requiresTenancy && !activeTenancy;
        const active = item.label === "Dashboard";

        return (
          <Pressable
            key={item.label}
            disabled={disabled}
            onPress={() => onNavigate(item)}
            style={[
              styles.navigationItem,
              active && styles.navigationItemActive,
              mobile && styles.mobileNavigationItem,
              disabled && styles.navigationItemDisabled,
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={20}
              color={
                mobile
                  ? active
                    ? colors.primary
                    : colors.textSecondary
                  : active
                    ? colors.white
                    : "rgba(255,255,255,0.72)"
              }
            />
            <Text
              style={[
                styles.navigationText,
                active && styles.navigationTextActive,
                mobile && styles.mobileNavigationText,
                disabled && styles.navigationTextDisabled,
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

function LoadingState() {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
      />
      <Text style={styles.stateTitle}>
        Loading your tenancy
      </Text>
      <Text style={styles.stateText}>
        We are loading the property approved for your tenant account.
      </Text>
    </View>
  );
}

function NoActiveTenancyState({
  firstName,
  error,
  onSignOut,
}: {
  firstName: string;
  error: string;
  onSignOut: () => void;
}) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <MaterialCommunityIcons
          name="home-clock-outline"
          size={42}
          color={colors.primary}
        />
      </View>
      <Text style={styles.stateTitle}>
        No active tenancy found for {firstName}
      </Text>
      <Text style={styles.stateText}>
        The tenant dashboard is only enabled after the Estate Agent approves your property-specific application. No other properties or property suggestions are shown here.
      </Text>
      {error ? (
        <Text style={styles.stateError}>
          {error}
        </Text>
      ) : null}
      <Button
        mode="outlined"
        icon="logout"
        onPress={onSignOut}
      >
        Back to tenant sign in
      </Button>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  compact = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: IconName;
  compact?: boolean;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={colors.primary}
        />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text
          style={[
            styles.summaryValue,
            compact && styles.summaryValueCompact,
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
        <Text style={styles.summaryHelper}>
          {helper}
        </Text>
      </View>
    </View>
  );
}

function HeroFact({
  icon,
  text,
}: {
  icon: IconName;
  text: string;
}) {
  return (
    <View style={styles.heroFact}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={colors.white}
      />
      <Text style={styles.heroFactText}>{text}</Text>
    </View>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  icon,
  last = false,
}: {
  label: string;
  value: string;
  icon: IconName;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        last && styles.detailRowLast,
      ]}
    >
      <View style={styles.detailIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function FeaturePill({
  icon,
  text,
}: {
  icon: IconName;
  text: string;
}) {
  return (
    <View style={styles.featurePill}>
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={colors.primary}
      />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onPress,
  last = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        last && styles.quickActionLast,
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
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>
          {title}
        </Text>
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

function numberValue(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function prettyEnum(value: string) {
  if (!value || value === "NOT_RECORDED") {
    return "Not recorded";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) =>
      part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
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
    width: 258,
    minHeight: "100%",
    padding: spacing.lg,
    backgroundColor: "#123E4B",
  },
  sidebarBrand: {
    marginBottom: spacing.xl,
  },
  sidebarHomeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  sidebarHomeIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sidebarHomeText: {
    flex: 1,
    minWidth: 0,
  },
  sidebarHomeLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sidebarHomeAddress: {
    marginTop: 4,
    color: colors.white,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "800",
  },
  sidebarSectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    color: "rgba(255,255,255,0.42)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  navigation: {
    gap: 5,
  },
  mobileNavigation: {
    gap: 4,
  },
  navigationItem: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  navigationItemActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  navigationItemDisabled: {
    opacity: 0.42,
  },
  navigationText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "800",
  },
  navigationTextActive: {
    color: colors.white,
  },
  navigationTextDisabled: {
    opacity: 0.7,
  },
  mobileNavigationItem: {
    backgroundColor: colors.white,
  },
  mobileNavigationText: {
    color: colors.textSecondary,
  },
  sidebarBottom: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  sidebarUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  sidebarAvatar: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  sidebarAvatarLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  sidebarUserText: {
    flex: 1,
    minWidth: 0,
  },
  sidebarUserName: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },
  sidebarUserRole: {
    marginTop: 2,
    color: "rgba(255,255,255,0.52)",
    fontSize: 8,
  },
  signOutButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
  },
  topBar: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  topBarSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.background,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.primaryLight,
  },
  avatarLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
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
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: "rgba(14, 35, 43, 0.28)",
  },
  mobileMenu: {
    position: "absolute",
    zIndex: 40,
    top: 70,
    left: spacing.md,
    width: 270,
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  mobileSignOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mobileSignOutText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: "900",
  },
  pageContent: {
    paddingBottom: 70,
  },
  pageContainer: {
    width: "100%",
    maxWidth: 1450,
    alignSelf: "center",
    gap: spacing.xl,
    padding: spacing.xl,
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
    minWidth: 280,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  pageTitle: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 34,
  },
  pageSubtitle: {
    maxWidth: 760,
    marginTop: 7,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.successLight,
  },
  activeBadgeText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: "900",
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
  heroStacked: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  heroMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  heroIcon: {
    width: 68,
    height: 68,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  heroTitle: {
    marginTop: 5,
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },
  heroAddress: {
    marginTop: 5,
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    lineHeight: 18,
  },
  heroFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroFact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  heroFactText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 210,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  summaryValueCompact: {
    fontSize: 15,
  },
  summaryHelper: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 13,
  },
  contentGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },
  contentGridStacked: {
    flexDirection: "column",
  },
  mainColumn: {
    flex: 2,
    width: "100%",
    minWidth: 0,
    gap: spacing.md,
  },
  sideColumn: {
    flex: 1,
    width: "100%",
    minWidth: 290,
    gap: spacing.md,
  },
  sectionHeading: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },
  tenancyCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  detailRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },
  detailContent: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "800",
  },
  featureCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  featureText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },
  quickActionsCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  quickAction: {
    minHeight: 83,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickActionLast: {
    borderBottomWidth: 0,
  },
  quickActionIcon: {
    width: 45,
    height: 45,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },
  quickActionContent: {
    flex: 1,
    minWidth: 0,
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
    lineHeight: 13,
  },
  pressed: {
    opacity: 0.72,
  },
  supportGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.lg,
  },
  supportGridStacked: {
    flexDirection: "column",
  },
  supportCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  supportIcon: {
    width: 52,
    height: 52,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },
  supportContent: {
    flex: 1,
    minWidth: 210,
  },
  supportTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  supportText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },
  stateCard: {
    minHeight: 430,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  stateIcon: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
  },
  stateTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  stateText: {
    maxWidth: 650,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },
  stateError: {
    maxWidth: 650,
    color: colors.error,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
});
