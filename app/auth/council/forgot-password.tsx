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
    Snackbar,
    TextInput,
} from "react-native-paper";
import Animated, {
    FadeInDown,
    FadeInLeft,
    FadeInRight,
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

type ResetStep = "email" | "verification" | "password" | "success";

const recoveryInformation: {
  icon: IconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "email-lock-outline",
    title: "Council email verification",
    description:
      "A secure verification code will be sent to your registered council email.",
  },
  {
    icon: "shield-check-outline",
    title: "Protected account recovery",
    description:
      "Your council account and inspection data remain protected during recovery.",
  },
  {
    icon: "account-key-outline",
    title: "Create a new password",
    description:
      "After verification, you can create a new password and return to your account.",
  },
];

export default function CouncilForgotPasswordScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 950;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [step, setStep] = useState<ResetStep>("email");

  const [email, setEmail] = useState(
    "inspector@leeds.gov.uk"
  );
  const [verificationCode, setVerificationCode] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
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

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const handleSendCode = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      showMessage(
        "Please enter your registered council email."
      );
      return;
    }

    if (!cleanEmail.includes("@")) {
      showMessage(
        "Please enter a valid council email address."
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep("verification");

      showMessage(
        "A verification code has been sent to your council email."
      );
    }, 700);
  };

  const handleVerifyCode = () => {
    const cleanCode = verificationCode.trim();

    if (!cleanCode) {
      showMessage(
        "Please enter the verification code."
      );
      return;
    }

    if (cleanCode.length !== 6) {
      showMessage(
        "The verification code must contain 6 digits."
      );
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      showMessage(
        "Please enter a valid 6-digit verification code."
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep("password");
      showMessage("Your email has been verified.");
    }, 650);
  };

  const handleResetPassword = () => {
    if (
      !passwordChecks.length ||
      !passwordChecks.uppercase ||
      !passwordChecks.lowercase ||
      !passwordChecks.number
    ) {
      showMessage(
        "Please create a password using all listed requirements."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 750);
  };

  const handleResendCode = () => {
    setVerificationCode("");
    showMessage(
      "A new verification code has been sent."
    );
  };

  const getStepNumber = () => {
    if (step === "email") {
      return 1;
    }

    if (step === "verification") {
      return 2;
    }

    if (step === "password") {
      return 3;
    }

    return 4;
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
                router.replace(
                  "/auth/council/login" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color={colors.primary}
              />

              {isTablet ? (
                <Text style={styles.backButtonText}>
                  Back to sign in
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>

          <View
            style={[
              styles.recoveryLayout,
              isDesktop &&
                styles.desktopRecoveryLayout,
            ]}
          >
            <Animated.View
              entering={FadeInLeft.delay(100).duration(500)}
              style={styles.introductionPanel}
            >
              <View style={styles.portalBadge}>
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.portalBadgeText}>
                  SECURE ACCOUNT RECOVERY
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isSmallPhone &&
                    styles.smallHeroTitle,
                ]}
              >
                Recover access to your council account.
              </Text>

              <Text style={styles.heroDescription}>
                Verify your registered council email and
                create a new secure password for the
                TenureEx inspection portal.
              </Text>

              <View style={styles.informationList}>
                {recoveryInformation.map(
                  (item, index) => (
                    <Animated.View
                      key={item.title}
                      entering={FadeInDown.delay(
                        180 + index * 85
                      ).duration(450)}
                      style={styles.informationCard}
                    >
                      <View
                        style={styles.informationIcon}
                      >
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={23}
                          color={colors.primary}
                        />
                      </View>

                      <View
                        style={styles.informationText}
                      >
                        <Text
                          style={
                            styles.informationTitle
                          }
                        >
                          {item.title}
                        </Text>

                        <Text
                          style={
                            styles.informationDescription
                          }
                        >
                          {item.description}
                        </Text>
                      </View>
                    </Animated.View>
                  )
                )}
              </View>

              <View style={styles.supportNotice}>
                <MaterialCommunityIcons
                  name="account-question-outline"
                  size={22}
                  color={colors.primary}
                />

                <View style={styles.supportText}>
                  <Text style={styles.supportTitle}>
                    Cannot access your council email?
                  </Text>

                  <Text
                    style={styles.supportDescription}
                  >
                    Contact your organisation administrator
                    or TenureEx support to verify your
                    identity and restore access.
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInRight.delay(120).duration(500)}
              style={styles.recoveryCard}
            >
              {step !== "success" ? (
                <>
                  <View style={styles.cardHeader}>
                    <View style={styles.recoveryIcon}>
                      <MaterialCommunityIcons
                        name={
                          step === "email"
                            ? "email-outline"
                            : step === "verification"
                              ? "numeric"
                              : "lock-check-outline"
                        }
                        size={30}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.cardHeaderText}>
                      <Text style={styles.recoveryTitle}>
                        {step === "email"
                          ? "Forgot your password?"
                          : step === "verification"
                            ? "Verify your email"
                            : "Create a new password"}
                      </Text>

                      <Text
                        style={
                          styles.recoveryDescription
                        }
                      >
                        {step === "email"
                          ? "Enter your registered council email to begin account recovery."
                          : step === "verification"
                            ? "Enter the 6-digit code sent to your council email."
                            : "Choose a strong new password for your council account."}
                      </Text>
                    </View>
                  </View>

                  <StepIndicator
                    currentStep={getStepNumber()}
                  />
                </>
              ) : null}

              {step === "email" ? (
                <Animated.View
                  entering={FadeInDown.duration(350)}
                  style={styles.form}
                >
                  <TextInput
                    mode="outlined"
                    label="Registered council email"
                    placeholder="name@council.gov.uk"
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

                  <View style={styles.emailNotice}>
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={20}
                      color={colors.primary}
                    />

                    <Text
                      style={styles.emailNoticeText}
                    >
                      Use the council email linked to your
                      approved TenureEx account.
                    </Text>
                  </View>

                  <Button
                    mode="contained"
                    icon="email-send-outline"
                    loading={loading}
                    disabled={loading}
                    onPress={handleSendCode}
                    buttonColor={colors.primary}
                    contentStyle={
                      styles.primaryButtonContent
                    }
                    labelStyle={
                      styles.primaryButtonLabel
                    }
                    style={styles.primaryButton}
                  >
                    Send verification code
                  </Button>

                  <Pressable
                    style={styles.secondaryLink}
                    onPress={() =>
                      router.replace(
                        "/auth/council/login" as never
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={17}
                      color={colors.primary}
                    />

                    <Text
                      style={styles.secondaryLinkText}
                    >
                      Return to sign in
                    </Text>
                  </Pressable>
                </Animated.View>
              ) : null}

              {step === "verification" ? (
                <Animated.View
                  entering={FadeInDown.duration(350)}
                  style={styles.form}
                >
                  <View style={styles.sentToCard}>
                    <View style={styles.sentToIcon}>
                      <MaterialCommunityIcons
                        name="email-check-outline"
                        size={22}
                        color="#277A46"
                      />
                    </View>

                    <View style={styles.sentToText}>
                      <Text style={styles.sentToTitle}>
                        Verification code sent
                      </Text>

                      <Text
                        style={styles.sentToDescription}
                      >
                        We sent a code to {email.trim()}.
                      </Text>
                    </View>
                  </View>

                  <TextInput
                    mode="outlined"
                    label="6-digit verification code"
                    placeholder="000000"
                    value={verificationCode}
                    onChangeText={(value) =>
                      setVerificationCode(
                        value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 6)
                      )
                    }
                    keyboardType="number-pad"
                    maxLength={6}
                    left={
                      <TextInput.Icon
                        icon="numeric"
                      />
                    }
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={styles.codeInput}
                  />

                  <Text style={styles.demoCodeText}>
                    Demo code: 123456
                  </Text>

                  <Button
                    mode="contained"
                    icon="shield-check-outline"
                    loading={loading}
                    disabled={loading}
                    onPress={handleVerifyCode}
                    buttonColor={colors.primary}
                    contentStyle={
                      styles.primaryButtonContent
                    }
                    labelStyle={
                      styles.primaryButtonLabel
                    }
                    style={styles.primaryButton}
                  >
                    Verify code
                  </Button>

                  <View style={styles.resendSection}>
                    <Text style={styles.resendText}>
                      Did not receive the code?
                    </Text>

                    <Pressable onPress={handleResendCode}>
                      <Text style={styles.resendLink}>
                        Resend code
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.secondaryLink}
                    onPress={() => {
                      setVerificationCode("");
                      setStep("email");
                    }}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={17}
                      color={colors.primary}
                    />

                    <Text
                      style={styles.secondaryLinkText}
                    >
                      Change email address
                    </Text>
                  </Pressable>
                </Animated.View>
              ) : null}

              {step === "password" ? (
                <Animated.View
                  entering={FadeInDown.duration(350)}
                  style={styles.form}
                >
                  <View style={styles.verifiedNotice}>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={23}
                      color="#277A46"
                    />

                    <View style={styles.verifiedText}>
                      <Text
                        style={styles.verifiedTitle}
                      >
                        Email verified
                      </Text>

                      <Text
                        style={
                          styles.verifiedDescription
                        }
                      >
                        You can now create a new password.
                      </Text>
                    </View>
                  </View>

                  <TextInput
                    mode="outlined"
                    label="New password"
                    placeholder="Create a strong password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    left={
                      <TextInput.Icon
                        icon="lock-outline"
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={
                          showNewPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onPress={() =>
                          setShowNewPassword(
                            !showNewPassword
                          )
                        }
                      />
                    }
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={styles.input}
                  />

                  <TextInput
                    mode="outlined"
                    label="Confirm new password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    error={
                      confirmPassword.length > 0 &&
                      newPassword !== confirmPassword
                    }
                    left={
                      <TextInput.Icon
                        icon="lock-check-outline"
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onPress={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      />
                    }
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={styles.input}
                  />

                  <View style={styles.passwordRules}>
                    <PasswordRule
                      text="At least 8 characters"
                      valid={passwordChecks.length}
                    />

                    <PasswordRule
                      text="Contains an uppercase letter"
                      valid={passwordChecks.uppercase}
                    />

                    <PasswordRule
                      text="Contains a lowercase letter"
                      valid={passwordChecks.lowercase}
                    />

                    <PasswordRule
                      text="Contains at least one number"
                      valid={passwordChecks.number}
                    />

                    <PasswordRule
                      text="Passwords match"
                      valid={
                        confirmPassword.length > 0 &&
                        newPassword === confirmPassword
                      }
                    />
                  </View>

                  <Button
                    mode="contained"
                    icon="lock-reset"
                    loading={loading}
                    disabled={loading}
                    onPress={handleResetPassword}
                    buttonColor={colors.primary}
                    contentStyle={
                      styles.primaryButtonContent
                    }
                    labelStyle={
                      styles.primaryButtonLabel
                    }
                    style={styles.primaryButton}
                  >
                    Reset password
                  </Button>
                </Animated.View>
              ) : null}

              {step === "success" ? (
                <Animated.View
                  entering={FadeInDown.duration(400)}
                  style={styles.successSection}
                >
                  <View style={styles.successIcon}>
                    <MaterialCommunityIcons
                      name="check-bold"
                      size={38}
                      color={colors.white}
                    />
                  </View>

                  <Text style={styles.successTitle}>
                    Password reset successful
                  </Text>

                  <Text
                    style={styles.successDescription}
                  >
                    Your council account password has been
                    updated. You can now sign in using your
                    new password.
                  </Text>

                  <View style={styles.successNotice}>
                    <MaterialCommunityIcons
                      name="shield-check-outline"
                      size={22}
                      color="#277A46"
                    />

                    <Text
                      style={styles.successNoticeText}
                    >
                      For security, other active sessions
                      may require you to sign in again.
                    </Text>
                  </View>

                  <Button
                    mode="contained"
                    icon="login"
                    onPress={() =>
                      router.replace(
                        "/auth/council/login" as never
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
                    Return to council sign in
                  </Button>
                </Animated.View>
              ) : null}

              {step !== "success" ? (
                <View style={styles.helpSection}>
                  <MaterialCommunityIcons
                    name="help-circle-outline"
                    size={19}
                    color={colors.textMuted}
                  />

                  <Text style={styles.helpText}>
                    For account recovery support, contact
                    your council administrator or TenureEx
                    support team.
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          </View>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() =>
            setSnackbarVisible(false)
          }
          duration={3200}
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

function StepIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  const steps = [
    {
      number: 1,
      label: "Email",
    },
    {
      number: 2,
      label: "Verify",
    },
    {
      number: 3,
      label: "Password",
    },
  ];

  return (
    <View style={styles.stepIndicator}>
      {steps.map((item, index) => {
        const active = currentStep >= item.number;
        const current = currentStep === item.number;

        return (
          <View
            key={item.number}
            style={styles.stepIndicatorItem}
          >
            <View style={styles.stepIndicatorTop}>
              <View
                style={[
                  styles.stepIndicatorCircle,
                  active &&
                    styles.activeStepIndicatorCircle,
                  current &&
                    styles.currentStepIndicatorCircle,
                ]}
              >
                {currentStep > item.number ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={colors.white}
                  />
                ) : (
                  <Text
                    style={[
                      styles.stepIndicatorNumber,
                      active &&
                        styles.activeStepIndicatorNumber,
                    ]}
                  >
                    {item.number}
                  </Text>
                )}
              </View>

              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.stepIndicatorLine,
                    currentStep > item.number &&
                      styles.activeStepIndicatorLine,
                  ]}
                />
              ) : null}
            </View>

            <Text
              style={[
                styles.stepIndicatorLabel,
                active &&
                  styles.activeStepIndicatorLabel,
              ]}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function PasswordRule({
  text,
  valid,
}: {
  text: string;
  valid: boolean;
}) {
  return (
    <View style={styles.passwordRule}>
      <MaterialCommunityIcons
        name={
          valid
            ? "check-circle"
            : "circle-outline"
        }
        size={17}
        color={
          valid ? "#277A46" : colors.textMuted
        }
      />

      <Text
        style={[
          styles.passwordRuleText,
          valid && styles.validPasswordRuleText,
        ]}
      >
        {text}
      </Text>
    </View>
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

  recoveryLayout: {
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },

  desktopRecoveryLayout: {
    minHeight: 710,
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

  informationList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  informationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  informationIcon: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  informationText: {
    flex: 1,
  },

  informationTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  informationDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  supportNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  supportText: {
    flex: 1,
  },

  supportTitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  supportDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  recoveryCard: {
    flex: 0.8,
    width: "100%",
    maxWidth: 540,
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  recoveryIcon: {
    width: 58,
    height: 58,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
  },

  cardHeaderText: {
    flex: 1,
  },

  recoveryTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },

  recoveryDescription: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  stepIndicator: {
    flexDirection: "row",
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },

  stepIndicatorItem: {
    flex: 1,
  },

  stepIndicatorTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  stepIndicatorCircle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.white,
  },

  activeStepIndicatorCircle: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  currentStepIndicatorCircle: {
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },

  stepIndicatorNumber: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
  },

  activeStepIndicatorNumber: {
    color: colors.white,
  },

  stepIndicatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },

  activeStepIndicatorLine: {
    backgroundColor: colors.primary,
  },

  stepIndicatorLabel: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "800",
  },

  activeStepIndicatorLabel: {
    color: colors.primary,
  },

  form: {
    marginTop: spacing.sm,
  },

  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  codeInput: {
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    textAlign: "center",
  },

  emailNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  emailNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  primaryButton: {
    marginTop: spacing.md,
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

  secondaryLink: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },

  secondaryLinkText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  sentToCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#E8F7EE",
  },

  sentToIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  sentToText: {
    flex: 1,
  },

  sentToTitle: {
    color: "#277A46",
    fontSize: 10,
    fontWeight: "900",
  },

  sentToDescription: {
    marginTop: 3,
    color: "#437854",
    fontSize: 8,
    lineHeight: 14,
  },

  demoCodeText: {
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 8,
    textAlign: "center",
  },

  resendSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: spacing.lg,
  },

  resendText: {
    color: colors.textSecondary,
    fontSize: 9,
  },

  resendLink: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  verifiedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#E8F7EE",
  },

  verifiedText: {
    flex: 1,
  },

  verifiedTitle: {
    color: "#277A46",
    fontSize: 10,
    fontWeight: "900",
  },

  verifiedDescription: {
    marginTop: 3,
    color: "#437854",
    fontSize: 8,
  },

  passwordRules: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  passwordRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  passwordRuleText: {
    color: colors.textMuted,
    fontSize: 8,
  },

  validPasswordRuleText: {
    color: "#277A46",
    fontWeight: "700",
  },

  successSection: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },

  successIcon: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 41,
    backgroundColor: "#277A46",
  },

  successTitle: {
    ...typography.headingMedium,
    marginTop: spacing.xl,
    color: colors.textPrimary,
    textAlign: "center",
  },

  successDescription: {
    ...typography.bodyMedium,
    marginTop: spacing.md,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: "center",
  },

  successNotice: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#E8F7EE",
  },

  successNoticeText: {
    flex: 1,
    color: "#437854",
    fontSize: 8,
    lineHeight: 15,
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