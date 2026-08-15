import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { Button, HelperText, TextInput } from "react-native-paper";

import TenureExLogo from "../../../src/components/Logo/TenureExLogo";
import { colors, radius, spacing } from "../../../src/theme";

export default function LandlordForgotPasswordScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleResetPassword = async () => {
    const normalisedEmail = email.trim();

    if (!normalisedEmail) {
      setEmailError("Please enter your email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalisedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailError("");
    setLoading(true);

    try {
      // Frontend-only delay.
      // Replace this with the password-reset API later.
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRequestSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace("/auth/landlord/login" as Href);
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
          {isDesktop ? <InformationPanel /> : null}

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
              {!isDesktop ? (
                <View style={styles.mobileHeader}>
                  <Pressable
                    onPress={handleBackToLogin}
                    style={styles.backButton}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={22}
                      color={colors.textPrimary}
                    />
                  </Pressable>

                  <TenureExLogo compact />
                </View>
              ) : null}

              {!requestSent ? (
                <>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name="lock-reset"
                      size={30}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.eyebrow}>LANDLORD PORTAL</Text>

                  <Text style={styles.title}>Reset your password</Text>

                  <Text style={styles.subtitle}>
                    Enter the email address linked to your landlord
                    account. We will send instructions for creating a new
                    password.
                  </Text>

                  <View style={styles.form}>
                    <View>
                      <Text style={styles.inputLabel}>Email address</Text>

                      <TextInput
                        mode="outlined"
                        value={email}
                        onChangeText={(value) => {
                          setEmail(value);

                          if (emailError) {
                            setEmailError("");
                          }
                        }}
                        placeholder="name@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        left={<TextInput.Icon icon="email-outline" />}
                        error={Boolean(emailError)}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                        style={styles.textInput}
                        contentStyle={styles.textInputContent}
                        onSubmitEditing={handleResetPassword}
                      />

                      {emailError ? (
                        <HelperText
                          type="error"
                          visible
                          style={styles.helperText}
                        >
                          {emailError}
                        </HelperText>
                      ) : null}
                    </View>

                    <Button
                      mode="contained"
                      icon="email-send-outline"
                      loading={loading}
                      disabled={loading}
                      buttonColor={colors.primary}
                      onPress={handleResetPassword}
                      style={styles.primaryButton}
                      contentStyle={styles.buttonContent}
                    >
                      Send reset instructions
                    </Button>

                    <Button
                      mode="text"
                      icon="arrow-left"
                      textColor={colors.primary}
                      onPress={handleBackToLogin}
                    >
                      Return to sign in
                    </Button>
                  </View>
                </>
              ) : (
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <MaterialCommunityIcons
                      name="email-check-outline"
                      size={38}
                      color={colors.success}
                    />
                  </View>

                  <Text style={styles.successTitle}>Check your email</Text>

                  <Text style={styles.successText}>
                    Password reset instructions have been sent to:
                  </Text>

                  <Text style={styles.successEmail}>{email.trim()}</Text>

                  <View style={styles.notice}>
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={20}
                      color={colors.primary}
                    />

                    <Text style={styles.noticeText}>
                      The reset link will only be valid for a limited time.
                      Check your spam folder if you do not see the email.
                    </Text>
                  </View>

                  <Button
                    mode="contained"
                    icon="login"
                    buttonColor={colors.primary}
                    onPress={handleBackToLogin}
                    style={styles.primaryButton}
                    contentStyle={styles.buttonContent}
                  >
                    Return to sign in
                  </Button>

                  <Button
                    mode="outlined"
                    icon="refresh"
                    textColor={colors.primary}
                    onPress={() => setRequestSent(false)}
                    style={styles.secondaryButton}
                    contentStyle={styles.buttonContent}
                  >
                    Use another email
                  </Button>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InformationPanel() {
  return (
    <View style={styles.informationPanel}>
      <View style={styles.informationCircleOne} />
      <View style={styles.informationCircleTwo} />

      <View style={styles.informationContent}>
        <TenureExLogo light />

        <View>
          <Text style={styles.informationEyebrow}>SECURE ACCOUNT ACCESS</Text>

          <Text style={styles.informationTitle}>
            Recover access to your property portfolio.
          </Text>

          <Text style={styles.informationDescription}>
            Use the email address registered by you or your Estate Agent.
            Password reset instructions will be sent securely to that
            address.
          </Text>

          <View style={styles.featureList}>
            <Feature
              icon="shield-lock-outline"
              title="Protected account"
              description="Password reset requests are handled securely."
            />

            <Feature
              icon="email-fast-outline"
              title="Email instructions"
              description="Receive a secure link for creating a new password."
            />

            <Feature
              icon="account-tie-outline"
              title="Estate Agent support"
              description="Contact your Estate Agent if your registered email has changed."
            />
          </View>
        </View>

        <Text style={styles.informationFooter}>
          TenureEx landlord account support
        </Text>
      </View>
    </View>
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
          size={22}
          color={colors.white}
        />
      </View>

      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
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
    flex: 1,
    minWidth: 420,
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
  },

  informationCircleOne: {
    position: "absolute",
    top: -160,
    right: -130,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  informationCircleTwo: {
    position: "absolute",
    bottom: -200,
    left: -150,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  informationContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 56,
  },

  informationEyebrow: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  informationTitle: {
    maxWidth: 560,
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 38,
    lineHeight: 47,
    fontWeight: "900",
  },

  informationDescription: {
    maxWidth: 530,
    marginTop: spacing.lg,
    color: "rgba(255,255,255,0.66)",
    fontSize: 14,
    lineHeight: 23,
  },

  featureList: {
    gap: spacing.lg,
    marginTop: 38,
  },

  feature: {
    maxWidth: 520,
    flexDirection: "row",
    gap: spacing.md,
  },

  featureIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
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
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    lineHeight: 17,
  },

  informationFooter: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 10,
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
  },

  formContainer: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },

  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconContainer: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  eyebrow: {
    marginTop: spacing.lg,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
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

  primaryButton: {
    borderRadius: radius.md,
  },

  secondaryButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  buttonContent: {
    minHeight: 54,
  },

  successContainer: {
    alignItems: "center",
  },

  successIcon: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.successLight,
  },

  successTitle: {
    marginTop: spacing.xl,
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },

  successText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },

  successEmail: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  notice: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginVertical: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
});