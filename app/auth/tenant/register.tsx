import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { ActivityIndicator, Menu } from "react-native-paper";

import { api } from "../../../src/api/client";
import { colors, radius, spacing } from "../../../src/theme";

type Step = "email" | "verify" | "profile" | "done";

type SelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
};

const reasonOptions = [
  "Rent my first home",
  "Move to another rental home",
  "Move for work or study",
  "Move with family",
  "Other",
];

const timeframeOptions = [
  "As soon as possible",
  "Next 14 days",
  "Within 1 month",
  "Within 3 months",
  "Just browsing",
];

const livingOptions = [
  "Living with family or friends",
  "Currently renting",
  "Own a home with a mortgage",
  "Own a home without a mortgage",
  "Student accommodation",
  "Other",
];

export default function TenantRegisterPage() {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [password, setPassword] = useState("");
  const [mainReason, setMainReason] = useState("");
  const [idealTimeframe, setIdealTimeframe] = useState("");
  const [currentLivingSituation, setCurrentLivingSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canContinueEmail = useMemo(
    () => /^\S+@\S+\.\S+$/.test(email.trim()),
    [email],
  );

  const canComplete =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    password.length >= 8 &&
    mainReason.length > 0 &&
    idealTimeframe.length > 0 &&
    currentLivingSituation.length > 0;

  const startRegistration = async () => {
    if (!canContinueEmail) return;
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/tenant-registration/start", {
        email: email.trim().toLowerCase(),
      });
      setUserId(response.data.userId);
      setEmail(response.data.email);
      setStep("verify");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Unable to start registration.");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (verificationCode.length !== 6 || !userId) return;
    setLoading(true);
    setError("");

    try {
      await api.post("/tenant-registration/verify-email", {
        userId,
        token: verificationCode,
      });
      setStep("profile");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "The verification code is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setVerificationCode("");
    await startRegistration();
  };

  const completeRegistration = async () => {
    if (!canComplete || !userId) return;
    setLoading(true);
    setError("");

    try {
      await api.post("/tenant-registration/complete", {
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        postcode: postcode.trim() || undefined,
        password,
        mainReason,
        idealTimeframe,
        currentLivingSituation,
      });
      setStep("done");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Unable to create your tenant account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.shell, !desktop && styles.shellMobile]}>
          {desktop ? (
            <View style={styles.sidePanel}>
              <Pressable onPress={() => router.push("/rent" as never)} style={styles.brandRow}>
                <View style={styles.brandIcon}>
                  <MaterialCommunityIcons name="home-city-outline" size={27} color={colors.white} />
                </View>
                <Text style={styles.brand}>TENUREEX</Text>
              </Pressable>

              <Text style={styles.sideTitle}>Your rental search, personalised.</Text>
              <Text style={styles.sideText}>
                Create a simple tenant account to keep your rental journey in one place and continue with property enquiries and applications.
              </Text>

              <Feature icon="home-search-outline" text="Browse estate-agent-approved rental properties" />
              <Feature icon="bell-outline" text="Keep your rental preferences together" />
              <Feature icon="file-document-outline" text="Continue to applications and tenancy documents" />
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Pressable onPress={() => router.push("/rent" as never)} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
              </Pressable>

              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  {step === "email" ? "1 OF 3" : step === "verify" ? "2 OF 3" : step === "profile" ? "3 OF 3" : "COMPLETE"}
                </Text>
              </View>
            </View>

            {step === "email" ? (
              <>
                <Text style={styles.title}>Register to view and manage rentals</Text>
                <Text style={styles.description}>
                  Start with your email address. We will send you a six-digit verification code.
                </Text>

                <FieldLabel text="Email address" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <PrimaryButton
                  label="Continue"
                  loading={loading}
                  disabled={!canContinueEmail}
                  onPress={startRegistration}
                />

                <Pressable onPress={() => router.push("/auth/tenant/login" as never)}>
                  <Text style={styles.secondaryLink}>Already registered? Sign in</Text>
                </Pressable>
              </>
            ) : null}

            {step === "verify" ? (
              <>
                <Text style={styles.title}>Verify your email</Text>
                <Text style={styles.description}>
                  We sent a verification code to {email}. The code expires in 10 minutes.
                </Text>

                <FieldLabel text="Verification code" />
                <TextInput
                  value={verificationCode}
                  onChangeText={(value) => setVerificationCode(value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, styles.codeInput]}
                />

                <PrimaryButton
                  label="Verify email"
                  loading={loading}
                  disabled={verificationCode.length !== 6}
                  onPress={verifyEmail}
                />

                <Pressable onPress={() => void resendCode()} disabled={loading}>
                  <Text style={styles.secondaryLink}>Didn't receive a code? Resend</Text>
                </Pressable>

                <Pressable onPress={() => { setStep("email"); setVerificationCode(""); setError(""); }}>
                  <Text style={styles.changeEmail}>Change email address</Text>
                </Pressable>
              </>
            ) : null}

            {step === "profile" ? (
              <>
                <Text style={styles.title}>Finish creating your account</Text>
                <Text style={styles.descriptionStrong}>
                  We use this information to personalise your experience.
                </Text>

                <View style={styles.twoColumns}>
                  <View style={styles.column}>
                    <FieldLabel text="First name" />
                    <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} />
                  </View>
                  <View style={styles.column}>
                    <FieldLabel text="Last name" />
                    <TextInput value={lastName} onChangeText={setLastName} style={styles.input} />
                  </View>
                </View>

                <FieldLabel text="UK postcode (optional)" />
                <TextInput
                  value={postcode}
                  onChangeText={setPostcode}
                  placeholder="e.g. SW1A 1AA"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  style={styles.input}
                />

                <FieldLabel text="Password" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />

                <SelectField
                  label="What's your main reason for using TenureEx?"
                  value={mainReason}
                  placeholder="Select a reason"
                  options={reasonOptions}
                  onChange={setMainReason}
                />

                <SelectField
                  label="What's your ideal timeframe?"
                  value={idealTimeframe}
                  placeholder="Select a timeframe"
                  options={timeframeOptions}
                  onChange={setIdealTimeframe}
                />

                <SelectField
                  label="What's your current living situation?"
                  value={currentLivingSituation}
                  placeholder="Select your current situation"
                  options={livingOptions}
                  onChange={setCurrentLivingSituation}
                />

                <PrimaryButton
                  label="Create tenant account"
                  loading={loading}
                  disabled={!canComplete}
                  onPress={completeRegistration}
                />

                <Text style={styles.privacyText}>
                  By creating an account, you confirm that the information provided is accurate and you agree to use TenureEx for your UK rental journey.
                </Text>
              </>
            ) : null}

            {step === "done" ? (
              <View style={styles.doneWrap}>
                <View style={styles.doneIcon}>
                  <MaterialCommunityIcons name="check" size={35} color={colors.white} />
                </View>
                <Text style={styles.doneTitle}>Your tenant account is ready</Text>
                <Text style={styles.doneText}>
                  Your email is verified and your profile has been created. You can now sign in and continue your rental journey.
                </Text>
                <PrimaryButton
                  label="Sign in as tenant"
                  loading={false}
                  disabled={false}
                  onPress={() => router.replace("/auth/tenant/login" as never)}
                />
                <Pressable onPress={() => router.replace("/rent" as never)}>
                  <Text style={styles.secondaryLink}>Back to rental properties</Text>
                </Pressable>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={styles.errorText}>{String(error)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function PrimaryButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void | Promise<void>;
}) {
  return (
    <Pressable
      onPress={() => void onPress()}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.primaryButtonDisabled,
        pressed && !disabled && !loading && styles.primaryButtonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

function SelectField({ label, value, placeholder, options, onChange }: SelectFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <FieldLabel text={label} />
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Pressable style={styles.select} onPress={() => setVisible(true)}>
            <Text style={[styles.selectText, !value && styles.placeholderText]}>
              {value || placeholder}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>
        }
      >
        {options.map((option) => (
          <Menu.Item
            key={option}
            title={option}
            onPress={() => {
              onChange(option);
              setVisible(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
}

function Feature({ icon, text }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: spacing.lg, justifyContent: "center" },
  shell: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    flexDirection: "row",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shellMobile: { flexDirection: "column" },
  sidePanel: {
    width: "40%",
    padding: 42,
    backgroundColor: colors.primary,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
  },
  brand: { color: colors.white, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  sideTitle: { marginTop: 56, color: colors.white, fontSize: 32, lineHeight: 39, fontWeight: "900" },
  sideText: { marginTop: 14, color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 23, marginBottom: 28 },
  feature: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 14 },
  featureIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, color: colors.white, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  card: { flex: 1, padding: 36, minHeight: 610 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  backButton: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.secondaryLight },
  stepBadgeText: { color: colors.secondary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 28, lineHeight: 35, fontWeight: "900" },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  descriptionStrong: { color: colors.textPrimary, fontSize: 14, lineHeight: 22, fontWeight: "700", marginTop: 8, marginBottom: 18 },
  label: { color: colors.textPrimary, fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 7 },
  input: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    fontSize: 14,
    outlineStyle: "none",
  } as any,
  codeInput: { letterSpacing: 5, fontWeight: "900", fontSize: 18 },
  twoColumns: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  select: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  selectText: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  placeholderText: { color: colors.textMuted, fontWeight: "500" },
  primaryButton: { minHeight: 52, marginTop: 22, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonDisabled: { opacity: 0.42 },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: { color: colors.white, fontWeight: "900", fontSize: 13 },
  secondaryLink: { marginTop: 16, textAlign: "center", color: colors.primary, fontSize: 12, fontWeight: "900" },
  changeEmail: { marginTop: 11, textAlign: "center", color: colors.textSecondary, fontSize: 11, fontWeight: "700", textDecorationLine: "underline" },
  privacyText: { marginTop: 14, color: colors.textMuted, fontSize: 9, lineHeight: 14 },
  errorBox: { marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.errorLight, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  errorText: { flex: 1, color: colors.error, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 30 },
  doneIcon: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  doneTitle: { marginTop: 20, color: colors.textPrimary, fontSize: 27, fontWeight: "900", textAlign: "center" },
  doneText: { maxWidth: 470, marginTop: 10, color: colors.textSecondary, fontSize: 14, lineHeight: 22, textAlign: "center" },
});
