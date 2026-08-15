import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  HelperText,
  TextInput,
} from "react-native-paper";

import {
  api,
  clearAuthSession,
  saveAuthTokens,
  saveCurrentUser,
} from "../../../src/api/client";

import TenureExLogo from "../../../src/components/Logo/TenureExLogo";
import {
  colors,
  radius,
  spacing,
} from "../../../src/theme";

type LandlordUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  userType: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string | null;
  agency?: null;
  branch?: null;
  jobTitle?: null;
  isPrimaryAgencyUser?: boolean;
  roles?: unknown[];
  permissions?: unknown[];
};

type LoginResponse = {
  message: string;
  user: LandlordUser;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

type LoginErrors = {
  email?: string;
  password?: string;
};

export default function LandlordLoginScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState("");

  const validateForm = () => {
    const newErrors: LoginErrors = {};
    const normalisedEmail = email.trim();

    if (!normalisedEmail) {
      newErrors.email = "Please enter your email address.";
    } else if (!/\S+@\S+\.\S+/.test(normalisedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    } else if (password.length < 6) {
      newErrors.password =
        "Your password must contain at least 6 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await clearAuthSession();

      const response =
        await api.post<LoginResponse>(
          "/auth/login",
          {
            email:
              email
                .trim()
                .toLowerCase(),
            password,
          },
        );

      const {
        user,
        accessToken,
        refreshToken,
      } = response.data;

      if (
        user.userType !==
        "LANDLORD"
      ) {
        await clearAuthSession();

        setApiError(
          "This account is not registered as a Landlord account.",
        );

        return;
      }

      if (
        user.status !==
        "ACTIVE"
      ) {
        await clearAuthSession();

        setApiError(
          `Your Landlord account is not active. Current status: ${user.status}.`,
        );

        return;
      }

      if (!user.emailVerified) {
        await clearAuthSession();

        setApiError(
          "Please verify your email address before signing in.",
        );

        return;
      }

      if (!user.phoneVerified) {
        await clearAuthSession();

        setApiError(
          "Please verify your phone number before signing in.",
        );

        return;
      }

      await saveAuthTokens(
        accessToken,
        refreshToken,
      );

      const meResponse =
        await api.get<LandlordUser>(
          "/auth/me",
        );

      if (
        meResponse.data.userType !==
        "LANDLORD"
      ) {
        await clearAuthSession();

        setApiError(
          "You do not have permission to access the Landlord portal.",
        );

        return;
      }

      if (
        meResponse.data.status !==
        "ACTIVE"
      ) {
        await clearAuthSession();

        setApiError(
          "Your Landlord account is currently not active.",
        );

        return;
      }

      await saveCurrentUser(
        meResponse.data,
      );

      router.replace(
        "/landlord/dashboard" as Href,
      );
    } catch (error: unknown) {
      await clearAuthSession();

      if (
        axios.isAxiosError(
          error,
        )
      ) {
        if (error.response) {
          const backendMessage =
            error.response.data
              ?.message;

          if (
            Array.isArray(
              backendMessage,
            )
          ) {
            setApiError(
              backendMessage.join(
                "\n",
              ),
            );
          } else if (
            typeof backendMessage ===
            "string"
          ) {
            setApiError(
              backendMessage,
            );
          } else if (
            error.response.status ===
            401
          ) {
            setApiError(
              "Invalid email or password.",
            );
          } else {
            setApiError(
              "Unable to sign in. Please try again.",
            );
          }
        } else if (
          error.request
        ) {
          setApiError(
            Platform.OS === "web"
              ? "Unable to connect to the TenureEx server. Make sure the backend is running on port 3000."
              : "Unable to connect to the TenureEx server. Please check your network connection.",
          );
        } else {
          setApiError(
            "Unable to process the login request.",
          );
        }
      } else {
        setApiError(
          "An unexpected error occurred. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/auth/landlord/forgot-password" as Href);
  };

  const handleCreateAccount = () => {
    router.push("/auth/landlord/signup" as Href);
  };

  const handleBack = () => {
    router.replace("/" as Href);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.screen,
            isDesktop ? styles.desktopScreen : styles.mobileScreen,
          ]}
        >
          {isDesktop ? <DesktopInformationPanel /> : null}

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={[
              styles.formScrollContent,
              isDesktop && styles.desktopFormScrollContent,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.topNavigation}>
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.backToMainButton,
                    pressed && styles.backToMainButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to main page"
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={19}
                    color={colors.primary}
                  />

                  <Text style={styles.backToMainText}>
                    Back to main page
                  </Text>
                </Pressable>

                {!isDesktop ? <TenureExLogo compact /> : null}
              </View>

              <View style={styles.formHeading}>
                <View style={styles.roleIcon}>
                  <MaterialCommunityIcons
                    name="home-account"
                    size={26}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.eyebrow}>
                  LANDLORD PORTAL
                </Text>

                <Text style={styles.title}>
                  Welcome back
                </Text>

                <Text style={styles.subtitle}>
                  Sign in to manage your properties, documents,
                  payments and maintenance activity.
                </Text>
              </View>

              <View style={styles.form}>
                <View>
                  <Text style={styles.inputLabel}>
                    Email address
                  </Text>

                  <TextInput
                    mode="outlined"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setApiError("");

                      if (errors.email) {
                        setErrors((current) => ({
                          ...current,
                          email: undefined,
                        }));
                      }
                    }}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    left={
                      <TextInput.Icon icon="email-outline" />
                    }
                    error={Boolean(errors.email)}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={styles.textInput}
                    contentStyle={styles.textInputContent}
                  />

                  {errors.email ? (
                    <HelperText
                      type="error"
                      visible
                      style={styles.helperText}
                    >
                      {errors.email}
                    </HelperText>
                  ) : null}
                </View>

                <View>
                  <Text style={styles.inputLabel}>
                    Password
                  </Text>

                  <TextInput
                    mode="outlined"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setApiError("");

                      if (errors.password) {
                        setErrors((current) => ({
                          ...current,
                          password: undefined,
                        }));
                      }
                    }}
                    placeholder="Enter your password"
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    left={
                      <TextInput.Icon icon="lock-outline" />
                    }
                    right={
                      <TextInput.Icon
                        icon={
                          passwordVisible
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onPress={() =>
                          setPasswordVisible(
                            (current) => !current,
                          )
                        }
                      />
                    }
                    error={Boolean(errors.password)}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={styles.textInput}
                    contentStyle={styles.textInputContent}
                    onSubmitEditing={handleLogin}
                  />

                  {errors.password ? (
                    <HelperText
                      type="error"
                      visible
                      style={styles.helperText}
                    >
                      {errors.password}
                    </HelperText>
                  ) : null}
                </View>

                <View style={styles.loginOptions}>
                  <Pressable
                    onPress={() =>
                      setRememberMe((current) => !current)
                    }
                    style={styles.rememberOption}
                  >
                    <Checkbox
                      status={
                        rememberMe ? "checked" : "unchecked"
                      }
                      onPress={() =>
                        setRememberMe((current) => !current)
                      }
                      color={colors.primary}
                    />

                    <Text style={styles.rememberText}>
                      Remember me
                    </Text>
                  </Pressable>

                  <Pressable onPress={handleForgotPassword}>
                    <Text style={styles.forgotPassword}>
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                {apiError ? (
                  <HelperText
                    type="error"
                    visible
                    style={styles.helperText}
                  >
                    {apiError}
                  </HelperText>
                ) : null}

                <Button
                  mode="contained"
                  icon="login"
                  loading={loading}
                  disabled={loading}
                  buttonColor={colors.primary}
                  onPress={handleLogin}
                  style={styles.signInButton}
                  contentStyle={styles.signInButtonContent}
                  labelStyle={styles.signInButtonLabel}
                >
                  {loading ? "Signing in" : "Sign in"}
                </Button>

                <View style={styles.secureNotice}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={18}
                    color={colors.success}
                  />

                  <Text style={styles.secureNoticeText}>
                    Your account information is protected and
                    securely managed.
                  </Text>
                </View>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />

                  <Text style={styles.dividerText}>
                    New to TenureEx?
                  </Text>

                  <View style={styles.divider} />
                </View>

                <Button
                  mode="outlined"
                  icon="account-plus-outline"
                  textColor={colors.primary}
                  onPress={handleCreateAccount}
                  style={styles.createAccountButton}
                  contentStyle={styles.createAccountButtonContent}
                >
                  Complete landlord registration
                </Button>

                <View style={styles.invitationNotice}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={20}
                    color={colors.primary}
                  />

                  <Text style={styles.invitationText}>
                    Registration is normally completed using the
                    invitation link sent by your Estate Agent.
                  </Text>
                </View>
              </View>

              <View style={styles.supportSection}>
                <Text style={styles.supportText}>
                  Need help accessing your account?
                </Text>

                <Pressable>
                  <Text style={styles.supportLink}>
                    Contact your Estate Agent
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.footerText}>
                © 2026 TenureEx. Property management made simpler.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DesktopInformationPanel() {
  return (
    <View style={styles.informationPanel}>
      <View style={styles.informationOverlayOne} />
      <View style={styles.informationOverlayTwo} />

      <View style={styles.informationContent}>
        <TenureExLogo light />

        <View style={styles.informationMain}>
          <Text style={styles.informationEyebrow}>
            YOUR PROPERTY PORTFOLIO
          </Text>

          <Text style={styles.informationTitle}>
            Manage every property from one secure workspace.
          </Text>

          <Text style={styles.informationDescription}>
            Stay connected with your Estate Agent, tenants and
            approved maintenance providers while keeping property
            information organised.
          </Text>

          <View style={styles.featureList}>
            <FeatureItem
              icon="home-city-outline"
              title="Property management"
              description="Add properties and monitor their approval and tenancy status."
            />

            <FeatureItem
              icon="tools"
              title="Maintenance tracking"
              description="Review reported issues, appointments and completed repairs."
            />

            <FeatureItem
              icon="file-document-check-outline"
              title="Documents and agreements"
              description="Access agreements, compliance documents and digital records."
            />

            <FeatureItem
              icon="message-processing-outline"
              title="Connected communication"
              description="Communicate with your Estate Agent and receive important updates."
            />
          </View>
        </View>

        <View style={styles.informationFooter}>
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={19}
            color="rgba(255,255,255,0.74)"
          />

          <Text style={styles.informationFooterText}>
            Designed with privacy, accessibility and UK property
            management requirements in mind.
          </Text>
        </View>
      </View>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.white}
        />
      </View>

      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  keyboardView: {
    flex: 1,
  },

  screen: {
    flex: 1,
  },

  desktopScreen: {
    flexDirection: "row",
  },

  mobileScreen: {
    backgroundColor: colors.background,
  },

  informationPanel: {
    position: "relative",
    flex: 1.05,
    minWidth: 420,
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
  },

  informationOverlayOne: {
    position: "absolute",
    top: -150,
    right: -110,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  informationOverlayTwo: {
    position: "absolute",
    bottom: -190,
    left: -130,
    width: 470,
    height: 470,
    borderRadius: 235,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  informationContent: {
    flex: 1,
    maxWidth: 690,
    justifyContent: "space-between",
    padding: 56,
  },

  informationMain: {
    marginVertical: 45,
  },

  informationEyebrow: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  informationTitle: {
    maxWidth: 570,
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 38,
    lineHeight: 48,
    fontWeight: "900",
  },

  informationDescription: {
    maxWidth: 540,
    marginTop: spacing.lg,
    color: "rgba(255,255,255,0.67)",
    fontSize: 14,
    lineHeight: 23,
  },

  featureList: {
    gap: spacing.lg,
    marginTop: 38,
  },

  featureItem: {
    maxWidth: 540,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  featureIcon: {
    width: 45,
    height: 45,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },

  featureDescription: {
    marginTop: 5,
    color: "rgba(255,255,255,0.57)",
    fontSize: 11,
    lineHeight: 17,
  },

  informationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  informationFooterText: {
    flex: 1,
    maxWidth: 490,
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    lineHeight: 16,
  },

  formScroll: {
    flex: 1,
    backgroundColor: colors.white,
  },

  formScrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  desktopFormScrollContent: {
    justifyContent: "center",
    paddingHorizontal: 70,
    paddingVertical: 50,
  },

  formContainer: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },

  topNavigation: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  backToMainButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  backToMainButtonPressed: {
    opacity: 0.7,
  },

  backToMainText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  formHeading: {
    alignItems: "flex-start",
    marginTop: spacing.xl,
  },

  roleIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  eyebrow: {
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  title: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  form: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },

  inputLabel: {
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  textInput: {
    backgroundColor: colors.white,
  },

  textInputContent: {
    minHeight: 54,
    fontSize: 13,
  },

  helperText: {
    paddingHorizontal: 0,
  },

  loginOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  rememberOption: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -9,
  },

  rememberText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  forgotPassword: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  signInButton: {
    borderRadius: radius.md,
  },

  signInButtonContent: {
    minHeight: 54,
  },

  signInButtonLabel: {
    fontSize: 13,
    fontWeight: "800",
  },

  secureNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successLight,
  },

  secureNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  dividerText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  createAccountButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  createAccountButtonContent: {
    minHeight: 52,
  },

  invitationNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  invitationText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  supportSection: {
    alignItems: "center",
    marginTop: 34,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  supportText: {
    color: colors.textMuted,
    fontSize: 10,
  },

  supportLink: {
    marginTop: 5,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  footerText: {
    marginTop: spacing.xl,
    color: colors.textMuted,
    fontSize: 8,
    textAlign: "center",
  },
});