import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, Snackbar } from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import ScreenContainer from "../src/components/ScreenContainer";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type UserRole = {
  id:
    | "agent"
    | "landlord"
    | "tenant"
    | "contractor"
    | "council";
  title: string;
  description: string;
  icon: IconName;
  route?: Href;
  available: boolean;
};

const userRoles: UserRole[] = [
  {
    id: "agent",
    title: "Estate Agent",
    description:
      "Manage landlords, properties, applicants, tenants, compliance and maintenance.",
    icon: "office-building-cog-outline",
    route: "/auth/agent/login" as Href,
    available: true,
  },
  {
    id: "landlord",
    title: "Landlord",
    description:
      "Manage your properties, documents, payments, tenants and maintenance activity.",
    icon: "home-account",
    route: "/auth/landlord/login" as Href,
    available: true,
  },
  {
    id: "tenant",
    title: "Applicant / Tenant",
    description:
      "Find suitable properties, complete applications and manage your tenancy.",
    icon: "home-account",
    route: "/auth/tenant/login" as Href,
    available: true,
  },
  {
    id: "contractor",
    title: "Maintenance Provider",
    description:
      "Receive repair jobs, manage appointments and submit completed work.",
    icon: "tools",
    route: "/auth/maintenance/login" as Href,
    available: true,
  },
  {
    id: "council",
    title: "Council / Inspector",
    description:
      "Review authorised property, inspection and compliance information.",
    icon: "clipboard-check-outline",
    route: "/auth/council/login" as Href,
    available: true,
  },
];

export default function Index() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [selectedRole, setSelectedRole] =
    useState<UserRole>(userRoles[0]);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);

  const handleContinue = () => {
    if (!selectedRole.available || !selectedRole.route) {
      setSnackbarVisible(true);
      return;
    }

    router.push(selectedRole.route);
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View
        style={[
          styles.page,
          isDesktop
            ? styles.desktopPage
            : styles.mobilePage,
        ]}
      >
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={[
            styles.intro,
            isDesktop && styles.desktopIntro,
          ]}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brand}>
                TENUREEX
              </Text>

              <Text style={styles.brandSubtitle}>
                Property management platform
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              isSmallPhone && styles.smallPhoneTitle,
            ]}
          >
            One platform for the complete property
            journey
          </Text>

          <Text style={styles.subtitle}>
            Connect estate agents, landlords, tenants,
            maintenance professionals and authorised
            organisations in one secure property
            management workspace.
          </Text>

          <View style={styles.introFeatures}>
            <Feature
              icon="home-city-outline"
              text="Property and tenancy management"
            />

            <Feature
              icon="file-sign"
              text="Digital agreements and documents"
            />

            <Feature
              icon="tools"
              text="Connected maintenance workflows"
            />

            <Feature
              icon="translate"
              text="Multilingual communication support"
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(500)}
          style={[
            styles.card,
            isDesktop && styles.desktopCard,
          ]}
        >
          <Text style={styles.portalLabel}>
            SELECT YOUR PORTAL
          </Text>

          <Text
            style={[
              styles.cardTitle,
              isSmallPhone &&
                styles.smallPhoneCardTitle,
            ]}
          >
            How would you like to continue?
          </Text>

          <Text style={styles.cardText}>
            Select your role to open the correct
            TenureEx workspace.
          </Text>

          <View
            style={[
              styles.rolesGrid,
              isTablet
                ? styles.tabletRolesGrid
                : styles.mobileRolesGrid,
            ]}
          >
            {userRoles.map((role) => {
              const selected =
                selectedRole.id === role.id;

              return (
                <Pressable
                  key={role.id}
                  onPress={() =>
                    setSelectedRole(role)
                  }
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected,
                    disabled: !role.available,
                  }}
                  accessibilityLabel={`${role.title}. ${role.description}`}
                  style={({ pressed }) => [
                    styles.roleCard,
                    isTablet
                      ? styles.tabletRoleCard
                      : styles.mobileRoleCard,
                    selected &&
                      styles.selectedRoleCard,
                    pressed &&
                      styles.pressedRoleCard,
                  ]}
                >
                  <View
                    style={[
                      styles.roleIcon,
                      selected &&
                        styles.selectedRoleIcon,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={role.icon}
                      size={25}
                      color={
                        selected
                          ? colors.white
                          : colors.primary
                      }
                    />
                  </View>

                  <View
                    style={styles.roleInformation}
                  >
                    <View
                      style={styles.roleTitleRow}
                    >
                      <Text
                        style={[
                          styles.roleTitle,
                          selected &&
                            styles.selectedRoleTitle,
                        ]}
                      >
                        {role.title}
                      </Text>

                      {!role.available ? (
                        <View
                          style={
                            styles.comingSoonBadge
                          }
                        >
                          <Text
                            style={
                              styles.comingSoonText
                            }
                          >
                            Soon
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text
                      style={styles.roleDescription}
                    >
                      {role.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      selected &&
                        styles.radioOuterSelected,
                    ]}
                  >
                    {selected ? (
                      <View
                        style={styles.radioInner}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.selectedSummary}>
            <View
              style={styles.selectedSummaryIcon}
            >
              <MaterialCommunityIcons
                name={selectedRole.icon}
                size={21}
                color={colors.primary}
              />
            </View>

            <View
              style={styles.selectedSummaryText}
            >
              <Text
                style={styles.selectedSummaryLabel}
              >
                SELECTED PORTAL
              </Text>

              <Text
                style={styles.selectedSummaryTitle}
              >
                {selectedRole.title}
              </Text>
            </View>

            <MaterialCommunityIcons
              name={
                selectedRole.available
                  ? "check-circle-outline"
                  : "clock-outline"
              }
              size={22}
              color={
                selectedRole.available
                  ? colors.success
                  : colors.warning
              }
            />
          </View>

          <Button
            mode="contained"
            icon="arrow-right"
            buttonColor={colors.primary}
            disabled={!selectedRole.available}
            onPress={handleContinue}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            style={styles.button}
          >
            {selectedRole.available
              ? `Continue to ${selectedRole.title}`
              : `${selectedRole.title} coming soon`}
          </Button>

          <View style={styles.securityNotice}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color={colors.success}
            />

            <Text
              style={styles.securityNoticeText}
            >
              Access is controlled according to each
              user's role and authorised
              responsibilities.
            </Text>
          </View>
        </Animated.View>
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
        The {selectedRole.title} portal will be added
        in the next development stage.
      </Snackbar>
    </ScreenContainer>
  );
}

function Feature({
  icon,
  text,
}: {
  icon: IconName;
  text: string;
}) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <Text style={styles.featureText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },

  page: {
    width: "100%",
    alignSelf: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.lg,
  },

  desktopPage: {
    maxWidth: 1320,
    minHeight: 760,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 60,
  },

  mobilePage: {
    maxWidth: 760,
    flexDirection: "column",
    paddingTop: spacing.sm,
  },

  intro: {
    width: "100%",
  },

  desktopIntro: {
    flex: 0.9,
    maxWidth: 510,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  brandLogo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primary,
  },

  brand: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2.4,
  },

  brandSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },

  smallPhoneTitle: {
    fontSize: 29,
    lineHeight: 36,
  },

  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 25,
  },

  introFeatures: {
    gap: spacing.md,
    marginTop: spacing.xxl,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  featureIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  featureText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },

  card: {
    width: "100%",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 4,
  },

  desktopCard: {
    flex: 1.1,
    maxWidth: 700,
  },

  portalLabel: {
    marginBottom: spacing.md,
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  cardTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },

  smallPhoneCardTitle: {
    fontSize: 25,
    lineHeight: 32,
  },

  cardText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 21,
  },

  rolesGrid: {
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  tabletRolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  mobileRolesGrid: {
    flexDirection: "column",
  },

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  tabletRoleCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 112,
  },

  mobileRoleCard: {
    width: "100%",
    minHeight: 112,
  },

  selectedRoleCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  pressedRoleCard: {
    opacity: 0.84,
    transform: [{ scale: 0.995 }],
  },

  roleIcon: {
    width: 51,
    height: 51,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  selectedRoleIcon: {
    backgroundColor: colors.primary,
  },

  roleInformation: {
    flex: 1,
    minWidth: 0,
  },

  roleTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  roleTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  selectedRoleTitle: {
    color: colors.primary,
  },

  roleDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.warningLight,
  },

  comingSoonText: {
    color: colors.warning,
    fontSize: 7,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  radioOuter: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },

  radioOuterSelected: {
    borderColor: colors.primary,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  selectedSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  selectedSummaryIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  selectedSummaryText: {
    flex: 1,
  },

  selectedSummaryLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  selectedSummaryTitle: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  button: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
  },

  buttonContent: {
    minHeight: 54,
    flexDirection: "row-reverse",
  },

  buttonLabel: {
    fontSize: 13,
    fontWeight: "800",
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successLight,
  },

  securityNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },
});