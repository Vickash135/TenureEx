import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  HelperText,
  Snackbar,
  TextInput,
} from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import { api } from "../../../src/api/client";
import ScreenContainer from "../../../src/components/ScreenContainer";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type CouncilRole =
  | "Housing Inspector"
  | "Environmental Health Officer"
  | "Council Administrator"
  | "Compliance Officer";

const councilRoles: {
  label: CouncilRole;
  icon: IconName;
}[] = [
  {
    label: "Housing Inspector",
    icon: "clipboard-search-outline",
  },
  {
    label: "Environmental Health Officer",
    icon: "leaf-circle-outline",
  },
  {
    label: "Council Administrator",
    icon: "account-cog-outline",
  },
  {
    label: "Compliance Officer",
    icon: "shield-check-outline",
  },
];

const accessSteps: {
  icon: IconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "account-edit-outline",
    title: "Complete your details",
    description:
      "Enter your authorised council and employment information.",
  },
  {
    icon: "shield-outline",
    title: "Organisation verification",
    description:
      "TenureEx checks your council email and organisation details.",
  },
  {
    icon: "account-check-outline",
    title: "Access approval",
    description:
      "You will receive access after your account has been approved.",
  },
];

type CouncilInvitation = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  councilName: string;
  department?: string | null;
  jobTitle?: string | null;
  employeeId?: string | null;
  expiresAt: string;
};

export default function CouncilSignupScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ invite?: string | string[] }>();
  const invitationToken = Array.isArray(params.invite)
    ? params.invite[0] ?? ""
    : params.invite ?? "";

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [invitation, setInvitation] = useState<CouncilInvitation | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [councilName, setCouncilName] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<CouncilRole>("Housing Inspector");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [acceptTerms, setAcceptTerms] =
    useState(false);
  const [confirmAuthority, setConfirmAuthority] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadInvitation = async () => {
      if (!invitationToken) {
        setInvitationLoading(false);
        setSnackbarMessage("A secure invitation from TenureEx Admin is required to activate a Council Inspector account.");
        setSnackbarVisible(true);
        return;
      }

      try {
        const response = await api.get(
          `/council-inspections/invitation/${encodeURIComponent(invitationToken)}`,
        );
        if (!active) return;

        const data = response.data as CouncilInvitation;
        setInvitation(data);
        setFullName(`${data.firstName ?? ""} ${data.lastName ?? ""}`.trim());
        setEmployeeId(data.employeeId ?? "");
        setCouncilName(data.councilName ?? "");
        setDepartment(data.department ?? "");
        setJobTitle(data.jobTitle ?? "Housing Inspector");
        setEmail(data.email ?? "");

        const invitedRole = councilRoles.find(
          (role) => role.label.toLowerCase() === (data.jobTitle ?? "").toLowerCase(),
        );
        if (invitedRole) setSelectedRole(invitedRole.label);
      } catch (error: any) {
        if (!active) return;
        const backendMessage = error?.response?.data?.message;
        setSnackbarMessage(
          typeof backendMessage === "string"
            ? backendMessage
            : "This Council Inspector invitation is invalid or has expired.",
        );
        setSnackbarVisible(true);
      } finally {
        if (active) setInvitationLoading(false);
      }
    };

    void loadInvitation();
    return () => { active = false; };
  }, [invitationToken]);

  const emailHasError = useMemo(() => {
    return email.length > 0 && !email.includes("@");
  }, [email]);

  const passwordsMatch = useMemo(() => {
    return (
      confirmPassword.length > 0 &&
      password === confirmPassword
    );
  }, [password, confirmPassword]);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    }),
    [password]
  );

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSignup = async () => {
    if (!invitationToken || !invitation) {
      showMessage("A valid TenureEx Admin invitation is required.");
      return;
    }

    if (!phone.trim()) {
      showMessage("Please enter your phone number.");
      return;
    }

    if (
      !passwordChecks.length ||
      !passwordChecks.uppercase ||
      !passwordChecks.lowercase ||
      !passwordChecks.number
    ) {
      showMessage(
        "Please create a stronger password using the listed requirements."
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage("The passwords do not match.");
      return;
    }

    if (!confirmAuthority) {
      showMessage(
        "Please confirm that the invited council employment details belong to you."
      );
      return;
    }

    if (!acceptTerms) {
      showMessage(
        "Please accept the terms and privacy policy."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        `/council-inspections/invitation/${encodeURIComponent(invitationToken)}/accept`,
        { phone, password },
      );

      showMessage(
        response.data?.message ??
          "Your Council Inspector account has been activated successfully."
      );

      setTimeout(() => {
        router.replace("/auth/council/login" as never);
      }, 800);
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      showMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join("\n")
          : typeof backendMessage === "string"
            ? backendMessage
            : "Unable to activate your Council Inspector account.",
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
              style={styles.signInButton}
              onPress={() =>
                router.replace(
                  "/auth/council/login" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="login"
                size={18}
                color={colors.primary}
              />

              {isTablet ? (
                <Text style={styles.signInButtonText}>
                  Council sign in
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>

          <View
            style={[
              styles.signupLayout,
              isDesktop && styles.desktopSignupLayout,
            ]}
          >
            <Animated.View
              entering={FadeInLeft.delay(100).duration(500)}
              style={styles.introductionPanel}
            >
              <View style={styles.portalBadge}>
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.portalBadgeText}>
                  ADMIN INVITATION ACTIVATION
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isSmallPhone && styles.smallHeroTitle,
                ]}
              >
                Activate your invited Council Inspector account.
              </Text>

              <Text style={styles.heroDescription}>
                TenureEx Admin controls Council Inspector access. Complete the secure invitation to activate your verified account.
              </Text>

              <View style={styles.stepsList}>
                {accessSteps.map((step, index) => (
                  <Animated.View
                    key={step.title}
                    entering={FadeInDown.delay(
                      180 + index * 90
                    ).duration(450)}
                    style={styles.stepCard}
                  >
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.stepIcon}>
                      <MaterialCommunityIcons
                        name={step.icon}
                        size={23}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.stepText}>
                      <Text style={styles.stepTitle}>
                        {step.title}
                      </Text>

                      <Text
                        style={styles.stepDescription}
                      >
                        {step.description}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              <View style={styles.approvalNotice}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={22}
                  color={colors.primary}
                />

                <View style={styles.approvalNoticeText}>
                  <Text
                    style={styles.approvalNoticeTitle}
                  >
                    Approval is required
                  </Text>

                  <Text
                    style={
                      styles.approvalNoticeDescription
                    }
                  >
                    New council accounts are reviewed before
                    inspection and property information
                    becomes available.
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInRight.delay(120).duration(500)}
              style={styles.signupCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.signupIcon}>
                  <MaterialCommunityIcons
                    name="account-tie-outline"
                    size={30}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.cardHeaderText}>
                  <Text style={styles.signupTitle}>
                    Activate inspector account
                  </Text>

                  <Text
                    style={styles.signupDescription}
                  >
                    Review the official details from your Admin invitation and create your secure account.
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>
                PERSONAL INFORMATION
              </Text>

              <View
                style={[
                  styles.formRow,
                  !isTablet && styles.mobileFormRow,
                ]}
              >
                <TextInput
                  mode="outlined"
                  label="Full name"
                  disabled
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  left={
                    <TextInput.Icon
                      icon="account-outline"
                    />
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
                  label="Employee ID"
                  disabled
                  placeholder="Enter employee ID"
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="characters"
                  left={
                    <TextInput.Icon
                      icon="badge-account-outline"
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

              <Text style={styles.sectionLabel}>
                COUNCIL INFORMATION
              </Text>

              <TextInput
                mode="outlined"
                label="Council or local authority"
                disabled
                placeholder="For example, Leeds City Council"
                value={councilName}
                onChangeText={setCouncilName}
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

              <View
                style={[
                  styles.formRow,
                  !isTablet && styles.mobileFormRow,
                ]}
              >
                <TextInput
                  mode="outlined"
                  label="Department"
                  disabled
                  placeholder="Housing Services"
                  value={department}
                  onChangeText={setDepartment}
                  autoCapitalize="words"
                  left={
                    <TextInput.Icon
                      icon="domain"
                    />
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
                  label="Job title"
                  disabled
                  placeholder="Housing Inspector"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  autoCapitalize="words"
                  left={
                    <TextInput.Icon
                      icon="briefcase-outline"
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

              <Text style={styles.fieldLabel}>
                Portal role
              </Text>

              <View style={styles.roleGrid}>
                {councilRoles.map((role) => {
                  const selected =
                    selectedRole === role.label;

                  return (
                    <Pressable
                      key={role.label}
                      disabled
                      onPress={() => undefined}
                      style={({ pressed }) => [
                        styles.roleCard,
                        selected &&
                          styles.selectedRoleCard,
                        pressed && styles.pressedCard,
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
                          size={21}
                          color={
                            selected
                              ? colors.white
                              : colors.primary
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.roleLabel,
                          selected &&
                            styles.selectedRoleLabel,
                        ]}
                      >
                        {role.label}
                      </Text>

                      <MaterialCommunityIcons
                        name={
                          selected
                            ? "radiobox-marked"
                            : "radiobox-blank"
                        }
                        size={18}
                        color={
                          selected
                            ? colors.primary
                            : colors.textMuted
                        }
                      />
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>
                CONTACT INFORMATION
              </Text>

              <View
                style={[
                  styles.formRow,
                  !isTablet && styles.mobileFormRow,
                ]}
              >
                <View style={styles.rowInput}>
                  <TextInput
                    mode="outlined"
                    label="Council email"
                disabled
                    placeholder="name@council.gov.uk"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={emailHasError}
                    left={
                      <TextInput.Icon
                        icon="email-outline"
                      />
                    }
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    style={styles.input}
                  />

                  {emailHasError ? (
                    <HelperText
                      type="error"
                      visible={emailHasError}
                      style={styles.helperText}
                    >
                      Enter a valid work email address.
                    </HelperText>
                  ) : null}
                </View>

                <InternationalPhoneInput
                  label="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.rowInput}
                />
              </View>

              <TextInput
                mode="outlined"
                label="Council office address"
                placeholder="Enter your work address"
                value={workAddress}
                onChangeText={setWorkAddress}
                multiline
                numberOfLines={3}
                left={
                  <TextInput.Icon
                    icon="map-marker-outline"
                  />
                }
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
              />

              <TextInput
                mode="outlined"
                label="Postcode"
                placeholder="Enter postcode"
                value={postcode}
                onChangeText={setPostcode}
                autoCapitalize="characters"
                left={
                  <TextInput.Icon
                    icon="map-marker-radius-outline"
                  />
                }
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
              />

              <Text style={styles.sectionLabel}>
                ACCOUNT SECURITY
              </Text>

              <View
                style={[
                  styles.formRow,
                  !isTablet && styles.mobileFormRow,
                ]}
              >
                <TextInput
                  mode="outlined"
                  label="Password"
                  placeholder="Create a password"
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
                  style={[
                    styles.input,
                    styles.rowInput,
                  ]}
                />

                <TextInput
                  mode="outlined"
                  label="Confirm password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  error={
                    confirmPassword.length > 0 &&
                    !passwordsMatch
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
                  style={[
                    styles.input,
                    styles.rowInput,
                  ]}
                />
              </View>

              <View style={styles.passwordRules}>
                <PasswordRule
                  text="At least 8 characters"
                  valid={passwordChecks.length}
                />

                <PasswordRule
                  text="Contains uppercase and lowercase letters"
                  valid={
                    passwordChecks.uppercase &&
                    passwordChecks.lowercase
                  }
                />

                <PasswordRule
                  text="Contains at least one number"
                  valid={passwordChecks.number}
                />

                <PasswordRule
                  text="Passwords match"
                  valid={passwordsMatch}
                />
              </View>

              <View style={styles.confirmationSection}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() =>
                    setConfirmAuthority(
                      !confirmAuthority
                    )
                  }
                >
                  <Checkbox
                    status={
                      confirmAuthority
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() =>
                      setConfirmAuthority(
                        !confirmAuthority
                      )
                    }
                    color={colors.primary}
                  />

                  <Text style={styles.checkboxText}>
                    I confirm that the council employment details in this Admin invitation belong to me.
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() =>
                    setAcceptTerms(!acceptTerms)
                  }
                >
                  <Checkbox
                    status={
                      acceptTerms
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() =>
                      setAcceptTerms(!acceptTerms)
                    }
                    color={colors.primary}
                  />

                  <Text style={styles.checkboxText}>
                    I agree to the{" "}
                    <Text style={styles.inlineLink}>
                      Terms of Use
                    </Text>{" "}
                    and{" "}
                    <Text style={styles.inlineLink}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </Pressable>
              </View>

              <Button
                mode="contained"
                icon="send-check-outline"
                loading={loading}
                disabled={loading || invitationLoading || !invitation}
                onPress={handleSignup}
                buttonColor={colors.primary}
                contentStyle={
                  styles.primaryButtonContent
                }
                labelStyle={styles.primaryButtonLabel}
                style={styles.primaryButton}
              >
                Activate account
              </Button>

              <View style={styles.loginSection}>
                <Text style={styles.loginSectionText}>
                  Already activated your account?
                </Text>

                <Pressable
                  onPress={() =>
                    router.replace(
                      "/auth/council/login" as never
                    )
                  }
                >
                  <Text style={styles.loginSectionLink}>
                    Sign in
                  </Text>
                </Pressable>
              </View>

              <View style={styles.helpSection}>
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <Text style={styles.helpText}>
                  If the invitation details are incorrect, contact TenureEx Admin before activating the account.
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
          duration={3400}
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
    maxWidth: 1440,
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

  signInButton: {
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

  signInButtonText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  signupLayout: {
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },

  desktopSignupLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  introductionPanel: {
    flex: 0.8,
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
    maxWidth: 620,
    marginTop: spacing.xl,
    color: colors.textPrimary,
  },

  smallHeroTitle: {
    fontSize: 29,
    lineHeight: 36,
  },

  heroDescription: {
    ...typography.bodyMedium,
    maxWidth: 620,
    marginTop: spacing.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  stepsList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  stepCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  stepNumber: {
    position: "absolute",
    top: -8,
    right: -7,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },

  stepNumberText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
  },

  stepIcon: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  stepText: {
    flex: 1,
  },

  stepTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  stepDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  approvalNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  approvalNoticeText: {
    flex: 1,
  },

  approvalNoticeTitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  approvalNoticeDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  signupCard: {
    flex: 1.2,
    width: "100%",
    maxWidth: 760,
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

  signupIcon: {
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

  signupTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },

  signupDescription: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  sectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  fieldLabel: {
    marginBottom: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  mobileFormRow: {
    flexDirection: "column",
  },

  rowInput: {
    flex: 1,
    minWidth: 0,
  },

  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  helperText: {
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },

  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  roleCard: {
    minWidth: 210,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  selectedRoleCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  pressedCard: {
    opacity: 0.75,
  },

  roleIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  selectedRoleIcon: {
    backgroundColor: colors.primary,
  },

  roleLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  selectedRoleLabel: {
    color: colors.primary,
    fontWeight: "900",
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

  confirmationSection: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: -8,
  },

  checkboxText: {
    flex: 1,
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  inlineLink: {
    color: colors.primary,
    fontWeight: "900",
  },

  primaryButton: {
    borderRadius: radius.md,
  },

  primaryButtonContent: {
    minHeight: 54,
    flexDirection: "row-reverse",
  },

  primaryButtonLabel: {
    fontSize: 11,
    fontWeight: "900",
  },

  loginSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: spacing.xl,
  },

  loginSectionText: {
    color: colors.textSecondary,
    fontSize: 9,
  },

  loginSectionLink: {
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