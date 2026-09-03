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

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import ScreenContainer from "../../../src/components/ScreenContainer";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

export default function MaintenanceSignupScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isSmallPhone = width < 390;

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationNumber, setRegistrationNumber] =
    useState("");
  const [speciality, setSpeciality] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordVisible, setPasswordVisible] =
    useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] =
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

  const handleCreateAccount = () => {
    const cleanCompanyName = companyName.trim();
    const cleanContactName = contactName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanSpeciality = speciality.trim();
    const cleanServiceArea = serviceArea.trim();

    if (!cleanCompanyName) {
      showMessage("Please enter your company name.");
      return;
    }

    if (!cleanContactName) {
      showMessage("Please enter the contact person's name.");
      return;
    }

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

    if (!cleanPhone) {
      showMessage("Please enter your phone number.");
      return;
    }

    if (!cleanSpeciality) {
      showMessage("Please enter your maintenance speciality.");
      return;
    }

    if (!cleanServiceArea) {
      showMessage("Please enter your service area.");
      return;
    }

    if (password.length < 8) {
      showMessage(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage("The passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      showMessage(
        "Please accept the terms and provider responsibilities."
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      showMessage(
        "Maintenance provider account created successfully."
      );

      setTimeout(() => {
        router.replace(
          "/auth/maintenance/login" as never
        );
      }, 900);
    }, 800);
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
            Join the TenureEx maintenance network
          </Text>

          <Text style={styles.introDescription}>
            Create a provider account to receive repair
            assignments, communicate with tenants and submit
            completion updates.
          </Text>

          <View style={styles.featureList}>
            <Feature
              icon="briefcase-check-outline"
              title="Receive suitable jobs"
              description="View work assigned according to your service category and location."
            />

            <Feature
              icon="calendar-clock-outline"
              title="Manage appointments"
              description="Arrange visits and keep tenants informed about scheduled work."
            />

            <Feature
              icon="message-text-outline"
              title="Communicate securely"
              description="Exchange job-related messages with tenants and property managers."
            />

            <Feature
              icon="shield-check-outline"
              title="Maintain provider records"
              description="Keep your company details and professional information updated."
            />
          </View>

          <View style={styles.providerNotice}>
            <MaterialCommunityIcons
              name="information-outline"
              size={21}
              color={colors.primary}
            />

            <View style={styles.flex}>
              <Text style={styles.providerNoticeTitle}>
                Provider verification
              </Text>

              <Text style={styles.providerNoticeText}>
                In the complete system, submitted provider
                accounts may require approval before jobs are
                assigned.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(500)}
          style={[
            styles.formCard,
            isDesktop && styles.desktopFormCard,
          ]}
        >
          <View style={styles.portalIcon}>
            <MaterialCommunityIcons
              name="account-hard-hat-outline"
              size={32}
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
            Create your account
          </Text>

          <Text style={styles.cardDescription}>
            Enter your company and contact information to
            register as a maintenance provider.
          </Text>

          <View style={styles.form}>
            <Text style={styles.formSectionLabel}>
              COMPANY INFORMATION
            </Text>

            <TextInput
              mode="outlined"
              label="Company name"
              value={companyName}
              onChangeText={setCompanyName}
              autoCapitalize="words"
              left={
                <TextInput.Icon
                  icon="office-building-outline"
                />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Contact person"
              value={contactName}
              onChangeText={setContactName}
              autoCapitalize="words"
              left={
                <TextInput.Icon
                  icon="account-outline"
                />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={styles.input}
            />

            <View
              style={[
                styles.row,
                !isDesktop && styles.rowStacked,
              ]}
            >
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
                style={[
                  styles.input,
                  styles.rowInput,
                ]}
              />

              <InternationalPhoneInput
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                style={styles.rowInput}
              />
            </View>

            <TextInput
              mode="outlined"
              label="Company registration number (optional)"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              autoCapitalize="characters"
              left={
                <TextInput.Icon
                  icon="identifier"
                />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={styles.input}
            />

            <Text style={styles.formSectionLabel}>
              SERVICE INFORMATION
            </Text>

            <View
              style={[
                styles.row,
                !isDesktop && styles.rowStacked,
              ]}
            >
              <TextInput
                mode="outlined"
                label="Main speciality"
                placeholder="Example: Plumbing"
                value={speciality}
                onChangeText={setSpeciality}
                autoCapitalize="words"
                left={
                  <TextInput.Icon icon="tools" />
                }
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={[
                  styles.input,
                  styles.rowInput,
                ]}
              />

              <TextInput
                mode="outlined"
                label="Service area"
                placeholder="Example: Leeds"
                value={serviceArea}
                onChangeText={setServiceArea}
                autoCapitalize="words"
                left={
                  <TextInput.Icon
                    icon="map-marker-outline"
                  />
                }
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={[
                  styles.input,
                  styles.rowInput,
                ]}
              />
            </View>

            <Text style={styles.formSectionLabel}>
              ACCOUNT SECURITY
            </Text>

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
                    setPasswordVisible(
                      (current) => !current
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
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!confirmPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              left={
                <TextInput.Icon
                  icon="lock-check-outline"
                />
              }
              right={
                <TextInput.Icon
                  icon={
                    confirmPasswordVisible
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  onPress={() =>
                    setConfirmPasswordVisible(
                      (current) => !current
                    )
                  }
                />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={styles.input}
            />

            <View style={styles.passwordNotice}>
              <MaterialCommunityIcons
                name="shield-key-outline"
                size={19}
                color={colors.primary}
              />

              <Text style={styles.passwordNoticeText}>
                Use at least 8 characters for your password.
              </Text>
            </View>

            <Pressable
              style={styles.termsRow}
              onPress={() =>
                setAcceptedTerms((current) => !current)
              }
            >
              <Checkbox
                status={
                  acceptedTerms
                    ? "checked"
                    : "unchecked"
                }
                onPress={() =>
                  setAcceptedTerms(
                    (current) => !current
                  )
                }
                color={colors.primary}
              />

              <Text style={styles.termsText}>
                I accept the TenureEx terms, privacy policy
                and maintenance provider responsibilities.
              </Text>
            </Pressable>

            <Button
              mode="contained"
              icon="account-plus-outline"
              loading={loading}
              disabled={loading}
              onPress={handleCreateAccount}
              buttonColor={colors.primary}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
              style={styles.primaryButton}
            >
              Create provider account
            </Button>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <Pressable
              onPress={() =>
                router.replace(
                  "/auth/maintenance/login" as never
                )
              }
            >
              <Text style={styles.loginLink}>
                Sign in
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
        duration={3500}
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
    maxWidth: 1380,
    minHeight: 820,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 65,
    paddingTop: 50,
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
    flex: 0.85,
    maxWidth: 510,
    paddingTop: spacing.xl,
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

  providerNotice: {
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

  providerNoticeTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  providerNoticeText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  formCard: {
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

  desktopFormCard: {
    flex: 1.15,
    maxWidth: 700,
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

  formSectionLabel: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  input: {
    backgroundColor: colors.white,
  },

  row: {
    flexDirection: "row",
    gap: spacing.md,
  },

  rowStacked: {
    flexDirection: "column",
  },

  rowInput: {
    flex: 1,
  },

  passwordNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  passwordNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: -8,
  },

  termsText: {
    flex: 1,
    paddingTop: 9,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
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

  loginRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: spacing.xl,
  },

  loginText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  loginLink: {
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