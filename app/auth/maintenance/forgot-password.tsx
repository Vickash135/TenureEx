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

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

export default function MaintenanceForgotPasswordScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 950;
  const isSmallPhone = width < 390;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSendResetLink = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      showMessage("Please enter your email address.");
      return;
    }

    if (
      !cleanEmail.includes("@") ||
      !cleanEmail.includes(".")
    ) {
      showMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const handleSendAgain = () => {
    setSubmitted(false);

    setTimeout(() => {
      handleSendResetLink();
    }, 150);
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
            Recover access to your provider account
          </Text>

          <Text style={styles.introDescription}>
            Enter the email address connected to your
            maintenance provider account and we will send
            password reset instructions.
          </Text>

          <View style={styles.featureList}>
            <Feature
              icon="email-lock-outline"
              title="Secure reset instructions"
              description="A password reset link will be sent to your registered email."
            />

            <Feature
              icon="clock-outline"
              title="Limited-time link"
              description="The reset link should expire after a short period for security."
            />

            <Feature
              icon="shield-check-outline"
              title="Protected provider access"
              description="Only verified provider accounts should access maintenance jobs."
            />
          </View>

          <View style={styles.securityNotice}>
            <MaterialCommunityIcons
              name="shield-alert-outline"
              size={21}
              color={colors.primary}
            />

            <View style={styles.flex}>
              <Text style={styles.securityNoticeTitle}>
                Security reminder
              </Text>

              <Text style={styles.securityNoticeText}>
                TenureEx will never ask you to send your
                existing password by email or message.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(500)}
          style={[
            styles.resetCard,
            isDesktop && styles.desktopResetCard,
          ]}
        >
          {!submitted ? (
            <>
              <View style={styles.portalIcon}>
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={33}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.portalLabel}>
                PASSWORD RECOVERY
              </Text>

              <Text
                style={[
                  styles.cardTitle,
                  isSmallPhone &&
                    styles.smallCardTitle,
                ]}
              >
                Forgot your password?
              </Text>

              <Text style={styles.cardDescription}>
                Enter your registered email address to
                receive password reset instructions.
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
                    <TextInput.Icon
                      icon="email-outline"
                    />
                  }
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.input}
                />

                <Button
                  mode="contained"
                  icon="email-send-outline"
                  loading={loading}
                  disabled={loading}
                  onPress={handleSendResetLink}
                  buttonColor={colors.primary}
                  contentStyle={
                    styles.primaryButtonContent
                  }
                  labelStyle={
                    styles.primaryButtonLabel
                  }
                  style={styles.primaryButton}
                >
                  Send reset link
                </Button>
              </View>

              <View style={styles.helpNotice}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text style={styles.helpNoticeText}>
                  For this frontend version, submitting the
                  form will display a confirmation screen.
                  No real email is sent yet.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <MaterialCommunityIcons
                  name="email-check-outline"
                  size={42}
                  color={colors.success}
                />
              </View>

              <Text style={styles.successLabel}>
                EMAIL SENT
              </Text>

              <Text
                style={[
                  styles.successTitle,
                  isSmallPhone &&
                    styles.smallSuccessTitle,
                ]}
              >
                Check your inbox
              </Text>

              <Text style={styles.successDescription}>
                Password reset instructions have been sent
                to:
              </Text>

              <View style={styles.emailCard}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text style={styles.emailText}>
                  {email.trim()}
                </Text>
              </View>

              <View style={styles.stepList}>
                <ResetStep
                  number="1"
                  title="Open the email"
                  description="Find the TenureEx password reset message."
                />

                <ResetStep
                  number="2"
                  title="Select the reset link"
                  description="Open the secure password reset page."
                />

                <ResetStep
                  number="3"
                  title="Create a new password"
                  description="Choose a strong password and return to sign in."
                />
              </View>

              <Button
                mode="contained"
                icon="login"
                onPress={() =>
                  router.replace(
                    "/auth/maintenance/login" as never
                  )
                }
                buttonColor={colors.primary}
                contentStyle={
                  styles.primaryButtonContent
                }
                labelStyle={
                  styles.primaryButtonLabel
                }
                style={styles.primaryButton}
              >
                Return to sign in
              </Button>

              <Button
                mode="outlined"
                icon="email-sync-outline"
                onPress={handleSendAgain}
                textColor={colors.primary}
                style={styles.secondaryButton}
              >
                Send email again
              </Button>
            </View>
          )}

          {!submitted ? (
            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.replace(
                  "/auth/maintenance/login" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color={colors.textSecondary}
              />

              <Text style={styles.backButtonText}>
                Back to maintenance sign in
              </Text>
            </Pressable>
          ) : null}
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
        {snackbarMessage}
      </Snackbar>
    </ScreenContainer>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: IconName;
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

function ResetStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.resetStep}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.flex}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepDescription}>
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

  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  securityNoticeTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  securityNoticeText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  resetCard: {
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

  desktopResetCard: {
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

  primaryButton: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },

  primaryButtonContent: {
    minHeight: 54,
    flexDirection: "row-reverse",
  },

  primaryButtonLabel: {
    fontSize: 13,
    fontWeight: "900",
  },

  secondaryButton: {
    marginTop: spacing.md,
    borderRadius: radius.md,
  },

  helpNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  helpNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  successContent: {
    alignItems: "stretch",
  },

  successIcon: {
    width: 78,
    height: 78,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.successLight,
  },

  successLabel: {
    marginTop: spacing.xl,
    color: colors.success,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
  },

  successTitle: {
    ...typography.headingMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
    textAlign: "center",
  },

  smallSuccessTitle: {
    fontSize: 26,
    lineHeight: 32,
  },

  successDescription: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 19,
    textAlign: "center",
  },

  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  emailText: {
    flexShrink: 1,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  stepList: {
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  resetStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  stepNumber: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primary,
  },

  stepNumberText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },

  stepTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  stepDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
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