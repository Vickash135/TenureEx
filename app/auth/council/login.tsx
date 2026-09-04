import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  Snackbar,
  TextInput,
} from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";

import { api, clearAuthSession, saveAuthTokens, saveCurrentUser } from "../../../src/api/client";
import ScreenContainer from "../../../src/components/ScreenContainer";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

const councilFeatures: {
  icon: IconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "clipboard-search-outline",
    title: "Manage property inspections",
    description:
      "Review assigned inspections and record property compliance findings.",
  },
  {
    icon: "file-document-check-outline",
    title: "Create inspection reports",
    description:
      "Prepare clear inspection results and compliance reports.",
  },
  {
    icon: "message-text-outline",
    title: "Communicate securely",
    description:
      "Contact landlords, tenants and maintenance providers from one place.",
  },
];

export default function CouncilLoginScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 950;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] =
    useState(true);
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showMessage("Please enter your council email.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      showMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      await clearAuthSession("council");

      const response = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      const { user, accessToken, refreshToken } = response.data ?? {};
      const accountRoles: string[] = user?.accountRoles ?? [user?.userType];

      if (!accountRoles.includes("COUNCIL_INSPECTOR")) {
        await clearAuthSession("council");
        showMessage("This account is not an approved Council Inspector account.");
        return;
      }

      if (user?.status && user.status !== "ACTIVE") {
        await clearAuthSession("council");
        showMessage("Your Council Inspector account is not active. Please contact TenureEx Admin.");
        return;
      }

      await saveAuthTokens(accessToken, refreshToken, "council");

      const meResponse = await api.get("/auth/me");
      const me = meResponse.data;
      const verifiedRoles: string[] = me?.accountRoles ?? [me?.userType];

      if (!verifiedRoles.includes("COUNCIL_INSPECTOR")) {
        await clearAuthSession("council");
        showMessage("You do not have permission to access the Council Inspector portal.");
        return;
      }

      await saveCurrentUser(me, "council");
      router.replace("/council/dashboard" as never);
    } catch (error: any) {
      await clearAuthSession("council");
      const backendMessage = error?.response?.data?.message;
      showMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join("\n")
          : typeof backendMessage === "string"
            ? backendMessage
            : "Unable to sign in. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <View style={styles.page}>
          <Animated.View
            entering={FadeInUp.duration(450)}
            style={styles.header}
          >
            <Pressable
              style={styles.brandRow}
              onPress={() =>
                router.replace("/" as never)
              }
            >
              <View style={styles.brandLogo}>
                <MaterialCommunityIcons
                  name="home-city-outline"
                  size={28}
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

            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.replace("/" as never)
              }
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color={colors.primary}
              />

              {isTablet ? (
                <Text style={styles.backButtonText}>
                  Back to roles
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>

          <View
            style={[
              styles.authLayout,
              isDesktop && styles.desktopAuthLayout,
            ]}
          >
            <Animated.View
              entering={FadeInLeft.delay(100).duration(500)}
              style={styles.introductionPanel}
            >
              <View style={styles.portalBadge}>
                <MaterialCommunityIcons
                  name="shield-home-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.portalBadgeText}>
                  COUNCIL & INSPECTOR ACCESS
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isSmallPhone &&
                    styles.smallHeroTitle,
                ]}
              >
                Support safer and compliant rental
                properties.
              </Text>

              <Text style={styles.heroDescription}>
                Access inspections, property records,
                compliance reports and secure communication
                through the TenureEx council portal.
              </Text>

              <View style={styles.featureList}>
                {councilFeatures.map((feature, index) => (
                  <Animated.View
                    key={feature.title}
                    entering={FadeInDown.delay(
                      180 + index * 80
                    ).duration(450)}
                    style={styles.featureCard}
                  >
                    <View style={styles.featureIcon}>
                      <MaterialCommunityIcons
                        name={feature.icon}
                        size={23}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.featureText}>
                      <Text style={styles.featureTitle}>
                        {feature.title}
                      </Text>

                      <Text
                        style={
                          styles.featureDescription
                        }
                      >
                        {feature.description}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              <View style={styles.securityNotice}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={22}
                  color="#277A46"
                />

                <View style={styles.securityText}>
                  <Text style={styles.securityTitle}>
                    Secure council access
                  </Text>

                  <Text
                    style={styles.securityDescription}
                  >
                    Inspection and property information is
                    protected and available only to
                    authorised users.
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInRight.delay(120).duration(500)}
              style={styles.loginCard}
            >
              <View style={styles.loginIcon}>
                <MaterialCommunityIcons
                  name="account-tie-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.loginTitle}>
                Council sign in
              </Text>

              <Text style={styles.loginDescription}>
                Enter your authorised council or inspector
                account details.
              </Text>

              <View style={styles.form}>
                <TextInput
                  mode="outlined"
                  label="Council email"
                  placeholder="inspector@council.gov.uk"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  left={
                    <TextInput.Icon
                      icon="email-outline"
                    />
                  }
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                />

                <TextInput
                  mode="outlined"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  left={
                    <TextInput.Icon
                      icon="lock-outline"
                    />
                  }
                  right={
                    <TextInput.Icon
                      icon={
                        showPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      onPress={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                    />
                  }
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                />

                <View style={styles.optionsRow}>
                  <Pressable
                    style={styles.rememberRow}
                    onPress={() =>
                      setRememberMe(!rememberMe)
                    }
                  >
                    <Checkbox
                      status={
                        rememberMe
                          ? "checked"
                          : "unchecked"
                      }
                      onPress={() =>
                        setRememberMe(!rememberMe)
                      }
                      color={colors.primary}
                    />

                    <Text style={styles.rememberText}>
                      Remember me
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      router.push(
                        "/auth/council/forgot-password" as never
                      )
                    }
                  >
                    <Text
                      style={styles.forgotPasswordText}
                    >
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                <Button
                  mode="contained"
                  icon="login"
                  loading={loading}
                  disabled={loading}
                  onPress={handleLogin}
                  buttonColor={colors.primary}
                  contentStyle={
                    styles.primaryButtonContent
                  }
                  labelStyle={
                    styles.primaryButtonLabel
                  }
                  style={styles.primaryButton}
                >
                  Sign in
                </Button>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />

                  <Text style={styles.dividerText}>
                    ADMIN INVITATION
                  </Text>

                  <View style={styles.dividerLine} />
                </View>

                <Button
                  mode="outlined"
                  icon="email-check-outline"
                  onPress={() =>
                    router.push(
                      "/auth/council/signup" as never
                    )
                  }
                  textColor={colors.primary}
                  contentStyle={
                    styles.secondaryButtonContent
                  }
                  style={styles.secondaryButton}
                >
                  Activate invited inspector account
                </Button>
              </View>

              <View style={styles.signupSection}>
                <Text style={styles.signupText}>
                  Have an Admin invitation?
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/auth/council/signup" as never
                    )
                  }
                >
                  <Text style={styles.signupLink}>
                    Activate account
                  </Text>
                </Pressable>
              </View>

              <View style={styles.helpSection}>
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={18}
                  color={colors.textMuted}
                />

                <Text style={styles.helpText}>
                  Council Inspector accounts are invitation-only and are managed by TenureEx Admin.
                </Text>
              </View>
            </Animated.View>
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
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },

  keyboardView: {
    flex: 1,
  },

  page: {
    width: "100%",
    maxWidth: 1360,
    alignSelf: "center",
    paddingVertical: spacing.md,
  },

  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  brandLogo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
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
    fontSize: 9,
    fontWeight: "700",
  },

  backButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  backButtonText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  authLayout: {
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },

  desktopAuthLayout: {
    minHeight: 700,
    flexDirection: "row",
    alignItems: "center",
  },

  introductionPanel: {
    flex: 1,
    padding: spacing.xl,
  },

  portalBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },

  portalBadgeText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    ...typography.headingLarge,
    maxWidth: 650,
    marginTop: spacing.xl,
    color: colors.textPrimary,
  },

  smallHeroTitle: {
    fontSize: 29,
    lineHeight: 36,
  },

  heroDescription: {
    ...typography.bodyMedium,
    maxWidth: 650,
    marginTop: spacing.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  featureList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  featureIcon: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  featureDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#E8F7EE",
  },

  securityText: {
    flex: 1,
  },

  securityTitle: {
    color: "#277A46",
    fontSize: 10,
    fontWeight: "900",
  },

  securityDescription: {
    marginTop: 4,
    color: "#437854",
    fontSize: 8,
    lineHeight: 15,
  },

  loginCard: {
    flex: 0.8,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 4,
  },

  loginIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
  },

  loginTitle: {
    ...typography.headingMedium,
    marginTop: spacing.lg,
    color: colors.textPrimary,
  },

  loginDescription: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  form: {
    marginTop: spacing.xl,
  },

  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },

  rememberText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  forgotPasswordText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  primaryButton: {
    borderRadius: radius.md,
  },

  primaryButtonContent: {
    minHeight: 52,
    flexDirection: "row-reverse",
  },

  primaryButtonLabel: {
    fontSize: 11,
    fontWeight: "900",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  dividerText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
  },

  secondaryButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  secondaryButtonContent: {
    minHeight: 50,
  },

  signupSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: spacing.xl,
  },

  signupText: {
    color: colors.textSecondary,
    fontSize: 9,
  },

  signupLink: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  helpText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 14,
  },
});