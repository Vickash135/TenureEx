import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
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
    FadeInUp,
} from "react-native-reanimated";

import ScreenContainer from "../../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
    typography,
} from "../../../src/theme";

export default function MaintenanceLoginScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 950;
  const isSmallPhone = width < 390;

  const [email, setEmail] = useState(
    "maintenance@tenureex.co.uk"
  );
  const [password, setPassword] = useState("Password123");
  const [passwordVisible, setPasswordVisible] =
    useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      setSnackbarVisible(true);
      return;
    }

    if (!cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setSnackbarVisible(true);
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.replace("/maintenance/dashboard" as never);
    }, 700);
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
          <Pressable
            style={styles.brandRow}
            onPress={() => router.replace("/" as never)}
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

              <Text style={styles.brandSubtitle}>
                Maintenance provider portal
              </Text>
            </View>
          </Pressable>

          <Text
            style={[
              styles.introTitle,
              isSmallPhone && styles.smallIntroTitle,
            ]}
          >
            Manage property repairs from one workspace
          </Text>

          <Text style={styles.introDescription}>
            View assigned maintenance jobs, arrange
            appointments, communicate with tenants and
            update repair progress.
          </Text>

          <View style={styles.featureList}>
            <Feature
              icon="clipboard-text-outline"
              title="Assigned repair jobs"
              description="View new, urgent and scheduled maintenance work."
            />

            <Feature
              icon="calendar-clock-outline"
              title="Manage appointments"
              description="Arrange suitable repair dates with tenants."
            />

            <Feature
              icon="progress-wrench"
              title="Update job progress"
              description="Move each repair through its correct status."
            />

            <Feature
              icon="camera-outline"
              title="Submit completion evidence"
              description="Add notes and photos after completing work."
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(500)}
          style={[
            styles.loginCard,
            isDesktop && styles.desktopLoginCard,
          ]}
        >
          <View style={styles.portalIcon}>
            <MaterialCommunityIcons
              name="tools"
              size={31}
              color={colors.primary}
            />
          </View>

          <Text style={styles.portalLabel}>
            MAINTENANCE PROVIDER
          </Text>

          <Text
            style={[
              styles.cardTitle,
              isSmallPhone && styles.smallCardTitle,
            ]}
          >
            Welcome back
          </Text>

          <Text style={styles.cardDescription}>
            Sign in to manage your assigned repair and
            maintenance work.
          </Text>

          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              left={
                <TextInput.Icon icon="email-outline" />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoCorrect={false}
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
                    setPasswordVisible((current) => !current)
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
                  setRememberMe((current) => !current)
                }
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

              <Pressable
                onPress={() =>
                  router.push(
                    "/auth/maintenance/forgot-password" as never
                  )
                }
              >
                <Text style={styles.forgotText}>
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
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
              style={styles.loginButton}
            >
              Sign in
            </Button>
          </View>

          <View style={styles.demoNotice}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={colors.primary}
            />

            <View style={styles.flex}>
              <Text style={styles.demoTitle}>
                Frontend demo account
              </Text>

              <Text style={styles.demoText}>
                The email and password are already filled
                in. Press Sign in to open the maintenance
                dashboard.
              </Text>
            </View>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>
              Need a maintenance provider account?
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  "/auth/maintenance/signup" as never
                )
              }
            >
              <Text style={styles.signupLink}>
                Create account
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/" as never)}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={colors.textSecondary}
            />

            <Text style={styles.backButtonText}>
              Back to portal selection
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "Close",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {errorMessage}
      </Snackbar>
    </ScreenContainer>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.flex}>
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
  screenContent: {
    flexGrow: 1,
  },

  flex: {
    flex: 1,
  },

  page: {
    width: "100%",
    alignSelf: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.lg,
  },

  desktopPage: {
    maxWidth: 1260,
    minHeight: 760,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 70,
  },

  mobilePage: {
    maxWidth: 720,
    flexDirection: "column",
    paddingTop: spacing.sm,
  },

  intro: {
    width: "100%",
  },

  desktopIntro: {
    flex: 1,
    maxWidth: 530,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  brandLogo: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.4,
  },

  brandSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  introTitle: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },

  smallIntroTitle: {
    fontSize: 29,
    lineHeight: 36,
  },

  introDescription: {
    ...typography.bodyLarge,
    marginTop: spacing.md,
    color: colors.textSecondary,
    lineHeight: 25,
  },

  featureList: {
    gap: spacing.md,
    marginTop: spacing.xxl,
  },

  feature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
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

  featureTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  featureDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  loginCard: {
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

  desktopLoginCard: {
    flex: 1,
    maxWidth: 560,
  },

  portalIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  portalLabel: {
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  cardTitle: {
    ...typography.headingMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },

  smallCardTitle: {
    fontSize: 26,
    lineHeight: 32,
  },

  cardDescription: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  input: {
    backgroundColor: colors.white,
  },

  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },

  rememberText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  forgotText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  loginButton: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },

  loginButtonContent: {
    minHeight: 54,
    flexDirection: "row-reverse",
  },

  loginButtonLabel: {
    fontSize: 13,
    fontWeight: "900",
  },

  demoNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  demoTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  demoText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  signupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: spacing.xl,
  },

  signupText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  signupLink: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },

  backButtonText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
});