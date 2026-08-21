import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import ScreenContainer from "../src/components/ScreenContainer";
import {
  colors
} from "../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type SignInOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  route: Href;
};

const signInOptions: SignInOption[] = [
  {
    id: "agent",
    title: "Estate Agent",
    subtitle: "Manage properties and tenancies",
    icon: "office-building-cog-outline",
    route: "/auth/agent/login" as Href,
  },
  {
    id: "landlord",
    title: "Landlord",
    subtitle: "Manage your rental properties",
    icon: "home-account",
    route: "/auth/landlord/login" as Href,
  },
  {
    id: "tenant",
    title: "Tenant",
    subtitle: "Access your TenureEx account",
    icon: "account-outline",
    route: "/auth/tenant/login" as Href,
  },
  {
    id: "maintenance",
    title: "Maintenance Provider",
    subtitle: "Access maintenance jobs",
    icon: "tools",
    route: "/auth/maintenance/login" as Href,
  },
  {
    id: "council",
    title: "Council / Inspector",
    subtitle: "Access authorised property information",
    icon: "clipboard-check-outline",
    route: "/auth/council/login" as Href,
  },
];

export default function Index() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 980;
  const isTablet = width >= 700;

  const [location, setLocation] = useState("");
  const [signInOpen, setSignInOpen] = useState(false);

  const goToRent = () => {
    setSignInOpen(false);
    router.push("/rent" as Href);
  };

  const searchRentals = () => {
    const value = location.trim();

    if (!value) {
      router.push("/rent" as Href);
      return;
    }

    router.push(
      `/rent?location=${encodeURIComponent(value)}` as Href,
    );
  };

  const goToTenantRegistration = () => {
    setSignInOpen(false);
    router.push("/auth/tenant/register" as Href);
  };

  const openLogin = (route: Href) => {
    setSignInOpen(false);
    router.push(route);
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <View style={styles.headerWrapper}>
        <View
          style={[
            styles.header,
            !isDesktop && styles.headerMobile,
          ]}
        >
          {/* Logo */}
          <Pressable
            onPress={() => {
              setSignInOpen(false);
              router.push("/" as Href);
            }}
            style={styles.brand}
          >
            <View style={styles.brandIcon}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={25}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TENUREEX
              </Text>

              <Text style={styles.brandSubtitle}>
                UK rental platform
              </Text>
            </View>
          </Pressable>

          {/* Desktop navigation */}
          <View style={styles.headerActions}>
            {isTablet ? (
              <>
                <Pressable
                  onPress={goToRent}
                  style={styles.navItem}
                >
                  <MaterialCommunityIcons
                    name="home-search-outline"
                    size={18}
                    color={colors.primary}
                  />

                  <Text style={styles.navItemText}>
                    Rent
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setSignInOpen(false);
                    router.push("/rent" as Href);
                  }}
                  style={styles.navTextButton}
                >
                  <Text style={styles.navText}>
                    Find a home
                  </Text>
                </Pressable>
              </>
            ) : null}

            {/* Sign in */}
            <View style={styles.signInContainer}>
              <Pressable
                onPress={() =>
                  setSignInOpen((current) => !current)
                }
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={19}
                  color={colors.white}
                />

                <Text style={styles.signInButtonText}>
                  Sign in
                </Text>

                <MaterialCommunityIcons
                  name={
                    signInOpen
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={19}
                  color={colors.white}
                />
              </Pressable>

              {signInOpen ? (
                <View
                  style={[
                    styles.signInMenu,
                    !isDesktop &&
                      styles.signInMenuMobile,
                  ]}
                >
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuEyebrow}>
                      SIGN IN TO TENUREEX
                    </Text>

                    <Text style={styles.menuTitle}>
                      Choose your account
                    </Text>
                  </View>

                  {signInOptions.map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() =>
                        openLogin(option.route)
                      }
                      style={({ pressed }) => [
                        styles.loginOption,
                        pressed &&
                          styles.loginOptionPressed,
                      ]}
                    >
                      <View
                        style={styles.loginOptionIcon}
                      >
                        <MaterialCommunityIcons
                          name={option.icon}
                          size={21}
                          color={colors.primary}
                        />
                      </View>

                      <View
                        style={styles.loginOptionContent}
                      >
                        <Text
                          style={styles.loginOptionTitle}
                        >
                          {option.title}
                        </Text>

                        <Text
                          style={
                            styles.loginOptionSubtitle
                          }
                        >
                          {option.subtitle}
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  ))}

                  <View style={styles.menuDivider} />

                  <View
                    style={
                      styles.tenantRegistrationArea
                    }
                  >
                    <Text
                      style={
                        styles.tenantRegistrationLabel
                      }
                    >
                      New to TenureEx?
                    </Text>

                    <Pressable
                      onPress={goToTenantRegistration}
                      style={({ pressed }) => [
                        styles.registerButton,
                        pressed &&
                          styles.buttonPressed,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account-plus-outline"
                        size={18}
                        color={colors.primary}
                      />

                      <Text
                        style={
                          styles.registerButtonText
                        }
                      >
                        Register as a tenant
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================
          HERO
      ====================================================== */}
      <View style={styles.hero}>
        <View
          style={[
            styles.heroInner,
            !isDesktop && styles.heroInnerMobile,
          ]}
        >
          <View
            style={[
              styles.heroContent,
              isDesktop && styles.heroContentDesktop,
            ]}
          >
            <View style={styles.heroLabel}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={17}
                color={colors.primary}
              />

              <Text style={styles.heroLabelText}>
                RENT HOMES ACROSS THE UK
              </Text>
            </View>

            <Text
              style={[
                styles.heroTitle,
                !isDesktop && styles.heroTitleMobile,
              ]}
            >
              Find a place that feels like home
            </Text>

            <Text style={styles.heroDescription}>
              Search rental homes managed through
              TenureEx. Properties shown to renters have
              been reviewed and approved by the linked
              estate agent.
            </Text>

            {/* Search */}
            <View
              style={[
                styles.searchPanel,
                !isTablet &&
                  styles.searchPanelMobile,
              ]}
            >
              <View style={styles.searchInputArea}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={23}
                  color={colors.textMuted}
                />

                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  onSubmitEditing={searchRentals}
                  placeholder="Enter postcode, town or city"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoCapitalize="words"
                />
              </View>

              <Pressable
                onPress={searchRentals}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="home-search-outline"
                  size={19}
                  color={colors.white}
                />

                <Text style={styles.searchButtonText}>
                  Search rentals
                </Text>
              </Pressable>
            </View>

            <View style={styles.quickInfoRow}>
              <QuickInfo
                icon="shield-check-outline"
                text="Agent-approved properties"
              />

              <QuickInfo
                icon="map-marker-outline"
                text="UK rentals"
              />

              <QuickInfo
                icon="account-check-outline"
                text="Simple tenant account"
              />
            </View>
          </View>

          {/* Decorative rental information panel */}
          {isDesktop ? (
            <View style={styles.heroVisual}>
              <View style={styles.heroVisualTop}>
                <View style={styles.heroVisualIcon}>
                  <MaterialCommunityIcons
                    name="home-city-outline"
                    size={44}
                    color={colors.white}
                  />
                </View>

                <Text style={styles.heroVisualLabel}>
                  TENUREEX RENT
                </Text>

                <Text style={styles.heroVisualTitle}>
                  A clearer rental journey
                </Text>

                <Text
                  style={styles.heroVisualDescription}
                >
                  Search, enquire and manage your rental
                  journey from one secure platform.
                </Text>
              </View>

              <View style={styles.heroVisualBottom}>
                <JourneyStep
                  icon="magnify"
                  title="Search"
                  text="Find a suitable rental."
                />

                <JourneyConnector />

                <JourneyStep
                  icon="check-outline"
                  title="Choose"
                  text="Review property details."
                />

                <JourneyConnector />

                <JourneyStep
                  icon="account-key-outline"
                  title="Rent"
                  text="Continue your tenancy journey."
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <View style={styles.content}>
        {/* Browse section */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>
            FIND YOUR NEXT HOME
          </Text>

          <Text style={styles.sectionTitle}>
            Renting made easier
          </Text>

          <Text style={styles.sectionDescription}>
            Browse available homes and see the information
            you need before taking the next step.
          </Text>
        </View>

        <View
          style={[
            styles.featureGrid,
            !isDesktop && styles.featureGridMobile,
          ]}
        >
          <HomeFeature
            icon="home-search-outline"
            title="Search rental properties"
            text="Search approved rental homes by postcode, town or city."
          />

          <HomeFeature
            icon="clipboard-text-search-outline"
            title="Clear property information"
            text="Review rent, bedrooms, facilities, availability and property information."
          />

          <HomeFeature
            icon="shield-check-outline"
            title="Approved listings"
            text="Only suitable properties approved through the estate-agent workflow are displayed."
          />
        </View>

        {/* Rental CTA */}
        <View
          style={[
            styles.rentalCta,
            !isDesktop && styles.rentalCtaMobile,
          ]}
        >
          <View style={styles.rentalCtaContent}>
            <Text style={styles.rentalCtaEyebrow}>
              AVAILABLE RENTALS
            </Text>

            <Text style={styles.rentalCtaTitle}>
              Ready to start looking?
            </Text>

            <Text style={styles.rentalCtaText}>
              Browse available TenureEx properties across
              the UK and filter results to find a home
              suitable for you.
            </Text>
          </View>

          <Pressable
            onPress={goToRent}
            style={({ pressed }) => [
              styles.browseButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.browseButtonText}>
              Browse properties
            </Text>

            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={colors.white}
            />
          </Pressable>
        </View>

        {/* Tenant account section */}
        <View
          style={[
            styles.accountSection,
            !isDesktop &&
              styles.accountSectionMobile,
          ]}
        >
          <View style={styles.accountIllustration}>
            <View
              style={styles.accountIllustrationCircle}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={57}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.accountContent}>
            <Text style={styles.sectionEyebrow}>
              TENUREEX TENANTS
            </Text>

            <Text style={styles.accountTitle}>
              Keep your rental journey in one place
            </Text>

            <Text style={styles.accountText}>
              Create a simple tenant account to use
              TenureEx rental services and personalise
              your experience.
            </Text>

            <View style={styles.accountBenefits}>
              <AccountBenefit
                text="Verify your account securely by email"
              />

              <AccountBenefit
                text="Personalise your rental preferences"
              />

              <AccountBenefit
                text="Use the same account throughout your tenancy journey"
              />
            </View>

            <View
              style={[
                styles.accountActions,
                !isTablet &&
                  styles.accountActionsMobile,
              ]}
            >
              <Pressable
                onPress={goToTenantRegistration}
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed && styles.buttonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={19}
                  color={colors.white}
                />

                <Text
                  style={styles.primaryActionText}
                >
                  Register as a tenant
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push(
                    "/auth/tenant/login" as Href,
                  )
                }
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text
                  style={styles.secondaryActionText}
                >
                  Tenant sign in
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <View style={styles.footer}>
        <View
          style={[
            styles.footerInner,
            !isTablet && styles.footerMobile,
          ]}
        >
          <View style={styles.footerBrand}>
            <View style={styles.footerLogo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={20}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.footerBrandName}>
                TENUREEX
              </Text>

              <Text style={styles.footerBrandText}>
                UK rental property platform
              </Text>
            </View>
          </View>

          <View style={styles.footerLinks}>
            <Pressable onPress={goToRent}>
              <Text style={styles.footerLink}>
                Rent
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push(
                  "/auth/tenant/login" as Href,
                )
              }
            >
              <Text style={styles.footerLink}>
                Tenant sign in
              </Text>
            </Pressable>

            <Pressable
              onPress={goToTenantRegistration}
            >
              <Text style={styles.footerLink}>
                Tenant registration
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>
            TenureEx · UK rental property management
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function QuickInfo({
  icon,
  text,
}: {
  icon: IconName;
  text: string;
}) {
  return (
    <View style={styles.quickInfo}>
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={colors.primary}
      />

      <Text style={styles.quickInfoText}>
        {text}
      </Text>
    </View>
  );
}

function HomeFeature({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureCardIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={27}
          color={colors.primary}
        />
      </View>

      <Text style={styles.featureCardTitle}>
        {title}
      </Text>

      <Text style={styles.featureCardText}>
        {text}
      </Text>
    </View>
  );
}

function AccountBenefit({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.accountBenefit}>
      <View style={styles.accountBenefitIcon}>
        <MaterialCommunityIcons
          name="check"
          size={14}
          color={colors.white}
        />
      </View>

      <Text style={styles.accountBenefitText}>
        {text}
      </Text>
    </View>
  );
}

function JourneyStep({
  icon,
  title,
  text,
}: {
  icon: IconName;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.journeyStep}>
      <View style={styles.journeyIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <Text style={styles.journeyTitle}>
        {title}
      </Text>

      <Text style={styles.journeyText}>
        {text}
      </Text>
    </View>
  );
}

function JourneyConnector() {
  return (
    <View style={styles.journeyConnector}>
      <MaterialCommunityIcons
        name="chevron-right"
        size={19}
        color={colors.textMuted}
      />
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  /* HEADER */

  headerWrapper: {
    width: "100%",
    zIndex: 100,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  header: {
    width: "100%",
    maxWidth: 1420,
    minHeight: 78,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 36,
    paddingVertical: 12,
  },

  headerMobile: {
    paddingHorizontal: 18,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  brandIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.4,
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 12,
  },

  navItemText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  navTextButton: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  navText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },

  signInContainer: {
    position: "relative",
    zIndex: 200,
  },

  signInButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },

  signInButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },

  signInMenu: {
    position: "absolute",
    top: 56,
    right: 0,
    width: 365,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
    overflow: "hidden",

    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 10,
  },

  signInMenuMobile: {
    width: 320,
    right: 0,
  },

  menuHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 13,
    backgroundColor: colors.background,
  },

  menuEyebrow: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  menuTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  loginOption: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  loginOptionPressed: {
    backgroundColor: colors.primaryLight,
  },

  loginOptionIcon: {
    width: 41,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  loginOptionContent: {
    flex: 1,
  },

  loginOptionTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  loginOptionSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 12,
  },

  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  tenantRegistrationArea: {
    padding: 16,
    backgroundColor: colors.background,
  },

  tenantRegistrationLabel: {
    marginBottom: 9,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  registerButton: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 11,
    backgroundColor: colors.white,
  },

  registerButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  /* HERO */

  hero: {
    width: "100%",
    backgroundColor: colors.primaryLight,
  },

  heroInner: {
    width: "100%",
    maxWidth: 1420,
    minHeight: 560,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 50,
    paddingHorizontal: 46,
    paddingVertical: 62,
  },

  heroInnerMobile: {
    minHeight: 0,
    paddingHorizontal: 20,
    paddingVertical: 44,
  },

  heroContent: {
    width: "100%",
  },

  heroContentDesktop: {
    flex: 1.05,
  },

  heroLabel: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  heroLabelText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  heroTitle: {
    maxWidth: 690,
    color: colors.textPrimary,
    fontSize: 50,
    lineHeight: 58,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  heroTitleMobile: {
    fontSize: 35,
    lineHeight: 42,
  },

  heroDescription: {
    maxWidth: 660,
    marginTop: 18,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "500",
  },

  searchPanel: {
    width: "100%",
    maxWidth: 760,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 32,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.white,

    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 3,
  },

  searchPanelMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  searchInputArea: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
  },

  searchInput: {
    flex: 1,
    height: 54,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    outlineStyle: "none",
  } as any,

  searchButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 25,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  searchButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },

  quickInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },

  quickInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.65)",
  },

  quickInfoText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  heroVisual: {
    flex: 0.75,
    maxWidth: 470,
    minHeight: 395,
    borderRadius: 27,
    overflow: "hidden",
    backgroundColor: colors.white,

    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 14,
    },

    elevation: 5,
  },

  heroVisualTop: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 34,
    backgroundColor: colors.primary,
  },

  heroVisualIcon: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 23,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  heroVisualLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  heroVisualTitle: {
    marginTop: 7,
    color: colors.white,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "900",
  },

  heroVisualDescription: {
    marginTop: 10,
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    lineHeight: 18,
  },

  heroVisualBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  journeyStep: {
    flex: 1,
    alignItems: "center",
  },

  journeyIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  journeyTitle: {
    marginTop: 7,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  journeyText: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 6.5,
    textAlign: "center",
  },

  journeyConnector: {
    width: 20,
    alignItems: "center",
  },

  /* CONTENT */

  content: {
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    paddingHorizontal: 30,
    paddingVertical: 72,
  },

  sectionHeading: {
    alignItems: "center",
    maxWidth: 680,
    alignSelf: "center",
  },

  sectionEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  sectionTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900",
    textAlign: "center",
  },

  sectionDescription: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },

  featureGrid: {
    flexDirection: "row",
    gap: 18,
    marginTop: 38,
  },

  featureGridMobile: {
    flexDirection: "column",
  },

  featureCard: {
    flex: 1,
    minHeight: 205,
    padding: 25,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  featureCardIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  featureCardTitle: {
    marginTop: 18,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  featureCardText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 17,
  },

  /* CTA */

  rentalCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
    marginTop: 65,
    padding: 38,
    borderRadius: 24,
    backgroundColor: "#D3A238",
  },

  rentalCtaMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
  },

  rentalCtaContent: {
    flex: 1,
  },

  rentalCtaEyebrow: {
    color: "rgba(8,45,58,0.7)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  rentalCtaTitle: {
    marginTop: 6,
    color: "#082D3A",
    fontSize: 25,
    fontWeight: "900",
  },

  rentalCtaText: {
    maxWidth: 650,
    marginTop: 8,
    color: "#173D48",
    fontSize: 11,
    lineHeight: 18,
  },

  browseButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 24,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },

  browseButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },

  /* TENANT ACCOUNT */

  accountSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 55,
    marginTop: 76,
    padding: 43,
    borderRadius: 25,
    backgroundColor: colors.background,
  },

  accountSectionMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  accountIllustration: {
    flex: 0.65,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 260,
  },

  accountIllustrationCircle: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 90,
    backgroundColor: colors.primaryLight,
  },

  accountContent: {
    flex: 1,
  },

  accountTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900",
  },

  accountText: {
    marginTop: 11,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 19,
  },

  accountBenefits: {
    gap: 10,
    marginTop: 20,
  },

  accountBenefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  accountBenefitIcon: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  accountBenefitText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 16,
  },

  accountActions: {
    flexDirection: "row",
    gap: 11,
    marginTop: 25,
  },

  accountActionsMobile: {
    flexDirection: "column",
  },

  primaryAction: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  primaryActionText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  secondaryAction: {
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.white,
  },

  secondaryActionText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  /* FOOTER */

  footer: {
    width: "100%",
    marginTop: 25,
    backgroundColor: "#082D3A",
  },

  footerInner: {
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 30,
    paddingHorizontal: 30,
    paddingVertical: 32,
  },

  footerMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
  },

  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  footerLogo: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  footerBrandName: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },

  footerBrandText: {
    marginTop: 2,
    color: "rgba(255,255,255,0.6)",
    fontSize: 7,
  },

  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
  },

  footerLink: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9,
    fontWeight: "800",
  },

  footerBottom: {
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    paddingHorizontal: 30,
    paddingVertical: 17,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },

  footerCopyright: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 7,
  },

  /* GENERIC */

  buttonPressed: {
    opacity: 0.84,
  },
});