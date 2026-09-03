import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  Menu,
  Snackbar,
  TextInput,
} from "react-native-paper";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import { colors, radius, spacing } from "../../../src/theme";

type IdentificationType =
  | "Passport"
  | "Driving licence"
  | "National identity card";

type RightToRentStatus =
  | "I have a share code"
  | "I have physical documents"
  | "I need help with verification";

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  currentAddress: string;
  postcode: string;

  identificationType: IdentificationType;
  identificationFile: string;

  rightToRentStatus: RightToRentStatus;
  rightToRentShareCode: string;

  preferredLanguage: string;

  password: string;
  confirmPassword: string;

  privacyConsent: boolean;
  termsConsent: boolean;
  informationConsent: boolean;
};

type FormErrors = Partial<
  Record<keyof SignupForm, string>
>;

const languages = [
  "Tamil",
  "Sinhala",
  "Arabic",
  "Bengali",
  "French",
  "Hindi",
  "Polish",
  "Punjabi",
  "Spanish",
  "Urdu",
  "Other",
];

const identificationTypes: IdentificationType[] = [
  "Passport",
  "Driving licence",
  "National identity card",
];

const rightToRentOptions: RightToRentStatus[] = [
  "I have a share code",
  "I have physical documents",
  "I need help with verification",
];

const initialForm: SignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  currentAddress: "",
  postcode: "",

  identificationType: "Passport",
  identificationFile: "",

  rightToRentStatus: "I have a share code",
  rightToRentShareCode: "",

  preferredLanguage: "Tamil",

  password: "",
  confirmPassword: "",

  privacyConsent: false,
  termsConsent: false,
  informationConsent: false,
};

export default function TenantSignupScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [form, setForm] =
    useState<SignupForm>(initialForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [passwordVisible, setPasswordVisible] =
    useState(false);

  const [
    confirmPasswordVisible,
    setConfirmPasswordVisible,
  ] = useState(false);

  const [languageMenuOpen, setLanguageMenuOpen] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  const updateField = <K extends keyof SignupForm>(
    field: K,
    value: SignupForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const selectIdentificationDocument = () => {
    /*
     * This is a frontend sample.
     *
     * Later, this button can use expo-document-picker:
     *
     * npx expo install expo-document-picker
     */

    updateField(
      "identificationFile",
      "sample-identification.pdf",
    );

    Alert.alert(
      "Sample document selected",
      "The real document picker can be connected later.",
    );
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.firstName.trim()) {
      nextErrors.firstName =
        "First name is required.";
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName =
        "Last name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email =
        "Email address is required.";
    } else if (!isValidEmail(form.email)) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone =
        "Phone number is required.";
    }

    if (!form.dateOfBirth.trim()) {
      nextErrors.dateOfBirth =
        "Date of birth is required.";
    }

    if (!form.currentAddress.trim()) {
      nextErrors.currentAddress =
        "Current address is required.";
    }

    if (!form.postcode.trim()) {
      nextErrors.postcode =
        "Postcode is required.";
    }

    if (!form.identificationFile) {
      nextErrors.identificationFile =
        "Upload an identification document.";
    }

    if (
      form.rightToRentStatus ===
        "I have a share code" &&
      !form.rightToRentShareCode.trim()
    ) {
      nextErrors.rightToRentShareCode =
        "Enter your Right to Rent share code.";
    }

    if (form.password.length < 8) {
      nextErrors.password =
        "Password must contain at least 8 characters.";
    } else if (
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      nextErrors.password =
        "Use uppercase, lowercase and a number.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword =
        "Confirm your password.";
    } else if (
      form.password !== form.confirmPassword
    ) {
      nextErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (!form.privacyConsent) {
      nextErrors.privacyConsent =
        "Privacy consent is required.";
    }

    if (!form.termsConsent) {
      nextErrors.termsConsent =
        "You must agree to the terms.";
    }

    if (!form.informationConsent) {
      nextErrors.informationConsent =
        "Confirm that your information is accurate.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      setMessage(
        "Please complete the required fields.",
      );

      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000),
      );

      /*
       * Replace this section with the tenant
       * registration backend API.
       *
       * Do not send identification documents as
       * plain text in a real system.
       *
       * Use secure multipart upload, encryption,
       * access controls and limited retention.
       */

      setMessage(
        "Tenant account created successfully.",
      );

      setTimeout(() => {
        router.replace(
          "/tenant/preferences" as never,
        );
      }, 700);
    } catch {
      setMessage(
        "Account creation failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.brand}
            onPress={() =>
              router.replace(
                "/auth/tenant/login" as never,
              )
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TenureEx
              </Text>

              <Text style={styles.brandRole}>
                Tenant registration
              </Text>
            </View>
          </Pressable>

          <Button
            mode="text"
            icon="login"
            onPress={() =>
              router.push(
                "/auth/tenant/login" as never,
              )
            }
          >
            Sign in
          </Button>
        </View>

        <View style={styles.introduction}>
          <View style={styles.introductionIcon}>
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={32}
              color={colors.primary}
            />
          </View>

          <View style={styles.introductionContent}>
            <Text style={styles.pageTitle}>
              Create your tenant account
            </Text>

            <Text style={styles.pageDescription}>
              Register to find suitable properties,
              submit applications, securely upload
              documents and manage your tenancy.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop && styles.mobileLayout,
          ]}
        >
          <View style={styles.formColumn}>
            <FormSection
              number="1"
              title="Personal information"
              description="Enter your basic contact information."
            >
              <View style={styles.fields}>
                <FormInput
                  label="First name *"
                  value={form.firstName}
                  errorMessage={errors.firstName}
                  onChangeText={(value) =>
                    updateField(
                      "firstName",
                      lettersOnly(value),
                    )
                  }
                />

                <FormInput
                  label="Last name *"
                  value={form.lastName}
                  errorMessage={errors.lastName}
                  onChangeText={(value) =>
                    updateField(
                      "lastName",
                      lettersOnly(value),
                    )
                  }
                />

                <FormInput
                  label="Email address *"
                  value={form.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorMessage={errors.email}
                  onChangeText={(value) =>
                    updateField("email", value)
                  }
                />

                <InternationalPhoneInput
                  label="Phone number *"
                  value={form.phone}
                  error={errors.phone}
                  onChangeText={(value) =>
                    updateField("phone", value)
                  }
                />

                <FormInput
                  label="Date of birth *"
                  placeholder="DD/MM/YYYY"
                  value={form.dateOfBirth}
                  errorMessage={errors.dateOfBirth}
                  onChangeText={(value) =>
                    updateField(
                      "dateOfBirth",
                      value,
                    )
                  }
                />

                <FormInput
                  label="Postcode *"
                  value={form.postcode}
                  autoCapitalize="characters"
                  errorMessage={errors.postcode}
                  onChangeText={(value) =>
                    updateField(
                      "postcode",
                      value.toUpperCase(),
                    )
                  }
                />

                <View style={styles.fullWidthField}>
                  <TextInput
                    mode="outlined"
                    label="Current address *"
                    value={form.currentAddress}
                    multiline
                    numberOfLines={3}
                    error={Boolean(
                      errors.currentAddress,
                    )}
                    onChangeText={(value) =>
                      updateField(
                        "currentAddress",
                        value,
                      )
                    }
                  />

                  <HelperText
                    type="error"
                    visible={Boolean(
                      errors.currentAddress,
                    )}
                  >
                    {errors.currentAddress}
                  </HelperText>
                </View>
              </View>
            </FormSection>

            <FormSection
              number="2"
              title="Identification"
              description="Upload identification for identity and tenancy checks."
            >
              <Text style={styles.fieldLabel}>
                Identification type
              </Text>

              <View style={styles.choiceGroup}>
                {identificationTypes.map(
                  (type) => (
                    <ChoiceButton
                      key={type}
                      label={type}
                      selected={
                        form.identificationType ===
                        type
                      }
                      onPress={() =>
                        updateField(
                          "identificationType",
                          type,
                        )
                      }
                    />
                  ),
                )}
              </View>

              <View style={styles.uploadBox}>
                <View style={styles.uploadIcon}>
                  <MaterialCommunityIcons
                    name={
                      form.identificationFile
                        ? "file-check-outline"
                        : "file-upload-outline"
                    }
                    size={33}
                    color={
                      form.identificationFile
                        ? colors.success
                        : colors.primary
                    }
                  />
                </View>

                <View style={styles.uploadContent}>
                  <Text style={styles.uploadTitle}>
                    {form.identificationFile
                      ? "Document selected"
                      : "Upload identification document"}
                  </Text>

                  <Text
                    style={styles.uploadDescription}
                  >
                    {form.identificationFile ||
                      "Select a clear PDF, JPG or PNG file."}
                  </Text>
                </View>

                <Button
                  mode="outlined"
                  icon="upload"
                  onPress={
                    selectIdentificationDocument
                  }
                >
                  Select file
                </Button>
              </View>

              <HelperText
                type="error"
                visible={Boolean(
                  errors.identificationFile,
                )}
              >
                {errors.identificationFile}
              </HelperText>
            </FormSection>

            <FormSection
              number="3"
              title="Right to Rent"
              description="Tell us how you can provide your Right to Rent evidence."
            >
              <View style={styles.choiceGroup}>
                {rightToRentOptions.map(
                  (option) => (
                    <ChoiceButton
                      key={option}
                      label={option}
                      selected={
                        form.rightToRentStatus ===
                        option
                      }
                      onPress={() =>
                        updateField(
                          "rightToRentStatus",
                          option,
                        )
                      }
                    />
                  ),
                )}
              </View>

              {form.rightToRentStatus ===
              "I have a share code" ? (
                <View style={styles.singleField}>
                  <TextInput
                    mode="outlined"
                    label="Right to Rent share code *"
                    placeholder="Enter your share code"
                    value={
                      form.rightToRentShareCode
                    }
                    autoCapitalize="characters"
                    error={Boolean(
                      errors.rightToRentShareCode,
                    )}
                    onChangeText={(value) =>
                      updateField(
                        "rightToRentShareCode",
                        value.toUpperCase(),
                      )
                    }
                  />

                  <HelperText
                    type="error"
                    visible={Boolean(
                      errors.rightToRentShareCode,
                    )}
                  >
                    {errors.rightToRentShareCode}
                  </HelperText>
                </View>
              ) : null}

              <View style={styles.notice}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={22}
                  color={colors.primary}
                />

                <Text style={styles.noticeText}>
                  Your identity and Right to Rent
                  information must only be used for
                  lawful tenancy verification and
                  protected using appropriate security.
                </Text>
              </View>
            </FormSection>

            <FormSection
              number="4"
              title="Language preference"
              description="English is the main document language. Select a second language for translations and voice support."
            >
              <Menu
                visible={languageMenuOpen}
                onDismiss={() =>
                  setLanguageMenuOpen(false)
                }
                anchor={
                  <Button
                    mode="outlined"
                    icon="translate"
                    contentStyle={
                      styles.languageButton
                    }
                    onPress={() =>
                      setLanguageMenuOpen(true)
                    }
                  >
                    {form.preferredLanguage}
                  </Button>
                }
              >
                {languages.map((language) => (
                  <Menu.Item
                    key={language}
                    title={language}
                    onPress={() => {
                      updateField(
                        "preferredLanguage",
                        language,
                      );

                      setLanguageMenuOpen(false);
                    }}
                  />
                ))}
              </Menu>
            </FormSection>

            <FormSection
              number="5"
              title="Account security"
              description="Create a strong password for your tenant account."
            >
              <View style={styles.fields}>
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Password *"
                    value={form.password}
                    secureTextEntry={
                      !passwordVisible
                    }
                    error={Boolean(
                      errors.password,
                    )}
                    right={
                      <TextInput.Icon
                        icon={
                          passwordVisible
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onPress={() =>
                          setPasswordVisible(
                            (current) =>
                              !current,
                          )
                        }
                      />
                    }
                    onChangeText={(value) =>
                      updateField(
                        "password",
                        value,
                      )
                    }
                  />

                  <HelperText
                    type="error"
                    visible={Boolean(
                      errors.password,
                    )}
                  >
                    {errors.password}
                  </HelperText>

                  {form.password ? (
                    <View
                      style={
                        styles.passwordStrength
                      }
                    >
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            width: `${passwordStrength.percentage}%`,
                            backgroundColor:
                              passwordStrength.color,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.strengthText,
                          {
                            color:
                              passwordStrength.color,
                          },
                        ]}
                      >
                        {passwordStrength.label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Confirm password *"
                    value={form.confirmPassword}
                    secureTextEntry={
                      !confirmPasswordVisible
                    }
                    error={Boolean(
                      errors.confirmPassword,
                    )}
                    right={
                      <TextInput.Icon
                        icon={
                          confirmPasswordVisible
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onPress={() =>
                          setConfirmPasswordVisible(
                            (current) =>
                              !current,
                          )
                        }
                      />
                    }
                    onChangeText={(value) =>
                      updateField(
                        "confirmPassword",
                        value,
                      )
                    }
                  />

                  <HelperText
                    type="error"
                    visible={Boolean(
                      errors.confirmPassword,
                    )}
                  >
                    {errors.confirmPassword}
                  </HelperText>
                </View>
              </View>

              <Text style={styles.passwordHelp}>
                Use at least 8 characters with an
                uppercase letter, lowercase letter and
                number.
              </Text>
            </FormSection>

            <FormSection
              number="6"
              title="Consent and declaration"
              description="Review and accept the required conditions."
            >
              <ConsentRow
                title="Privacy and data processing"
                description="I have read the privacy information and agree that my information may be processed for account, property application and tenancy-management purposes."
                checked={form.privacyConsent}
                error={errors.privacyConsent}
                onPress={() =>
                  updateField(
                    "privacyConsent",
                    !form.privacyConsent,
                  )
                }
              />

              <ConsentRow
                title="Terms and conditions"
                description="I agree to the TenureEx tenant terms and conditions."
                checked={form.termsConsent}
                error={errors.termsConsent}
                onPress={() =>
                  updateField(
                    "termsConsent",
                    !form.termsConsent,
                  )
                }
              />

              <ConsentRow
                title="Information declaration"
                description="I confirm that the information supplied is accurate and that uploaded documents belong to me."
                checked={
                  form.informationConsent
                }
                error={
                  errors.informationConsent
                }
                onPress={() =>
                  updateField(
                    "informationConsent",
                    !form.informationConsent,
                  )
                }
              />
            </FormSection>

            <View style={styles.submitArea}>
              <Button
                mode="outlined"
                onPress={() =>
                  router.push(
                    "/auth/tenant/login" as never,
                  )
                }
              >
                Back to login
              </Button>

              <Button
                mode="contained"
                icon="account-check-outline"
                loading={loading}
                disabled={loading}
                contentStyle={
                  styles.submitButton
                }
                onPress={handleSignup}
              >
                Create tenant account
              </Button>
            </View>
          </View>

          {isDesktop ? (
            <View style={styles.sidePanel}>
              <View style={styles.sidePanelCard}>
                <MaterialCommunityIcons
                  name="shield-account-outline"
                  size={42}
                  color={colors.primary}
                />

                <Text style={styles.sidePanelTitle}>
                  What happens next?
                </Text>

                <ProcessStep
                  number="1"
                  title="Complete registration"
                  description="Enter your personal details and create your secure account."
                />

                <ProcessStep
                  number="2"
                  title="Set property preferences"
                  description="Tell us your budget, location and property requirements."
                />

                <ProcessStep
                  number="3"
                  title="Receive property matches"
                  description="The system compares your requirements with available properties."
                />

                <ProcessStep
                  number="4"
                  title="Apply for a property"
                  description="Submit an application and supporting documents."
                />

                <ProcessStep
                  number="5"
                  title="Sign the agreement"
                  description="Review and digitally sign the tenancy agreement after approval."
                />
              </View>

              <View style={styles.supportCard}>
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={25}
                  color={colors.primary}
                />

                <View style={styles.supportContent}>
                  <Text style={styles.supportTitle}>
                    Need assistance?
                  </Text>

                  <Text
                    style={styles.supportDescription}
                  >
                    Contact the Estate Agent if you
                    require help with registration,
                    identification or Right to Rent
                    evidence.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => setMessage("")}
        duration={2600}
      >
        {message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>
            {number}
          </Text>
        </View>

        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text style={styles.sectionDescription}>
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

function FormInput({
  errorMessage,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  errorMessage?: string;
}) {
  return (
    <View style={styles.field}>
      <TextInput
        mode="outlined"
        error={Boolean(errorMessage)}
        {...props}
      />

      <HelperText
        type="error"
        visible={Boolean(errorMessage)}
      >
        {errorMessage}
      </HelperText>
    </View>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.choice,
        selected && styles.selectedChoice,
      ]}
      onPress={onPress}
    >
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

      <Text
        style={[
          styles.choiceText,
          selected &&
            styles.selectedChoiceText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ConsentRow({
  title,
  description,
  checked,
  error,
  onPress,
}: {
  title: string;
  description: string;
  checked: boolean;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View>
      <Pressable
        style={[
          styles.consentRow,
          Boolean(error) &&
            styles.consentRowError,
        ]}
        onPress={onPress}
      >
        <Checkbox
          status={
            checked ? "checked" : "unchecked"
          }
          onPress={onPress}
        />

        <View style={styles.consentContent}>
          <Text style={styles.consentTitle}>
            {title}
          </Text>

          <Text
            style={styles.consentDescription}
          >
            {description}
          </Text>
        </View>
      </Pressable>

      <HelperText
        type="error"
        visible={Boolean(error)}
      >
        {error}
      </HelperText>
    </View>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.processStep}>
      <View style={styles.processNumber}>
        <Text style={styles.processNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.processContent}>
        <Text style={styles.processTitle}>
          {title}
        </Text>

        <Text style={styles.processDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return {
      label: "Weak password",
      percentage: 35,
      color: colors.error,
    };
  }

  if (score <= 4) {
    return {
      label: "Medium password",
      percentage: 70,
      color: colors.warning,
    };
  }

  return {
    label: "Strong password",
    percentage: 100,
    color: colors.success,
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim(),
  );
}

function lettersOnly(value: string) {
  return value.replace(
    /[^a-zA-ZÀ-ž' -]/g,
    "",
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  page: {
    width: "100%",
    maxWidth: 1450,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.xl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  logo: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  brandRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  introduction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  introductionIcon: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
  },

  introductionContent: {
    flex: 1,
  },

  pageTitle: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: "900",
  },

  pageDescription: {
    marginTop: spacing.sm,
    maxWidth: 780,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
  },

  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },

  mobileLayout: {
    flexDirection: "column",
  },

  formColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.lg,
  },

  sidePanel: {
    width: 340,
    gap: spacing.lg,
  },

  sidePanelCard: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  sidePanelTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  processStep: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  processNumber: {
    width: 30,
    height: 30,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  processNumberText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  processContent: {
    flex: 1,
  },

  processTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  processDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },

  supportCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  supportContent: {
    flex: 1,
  },

  supportTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  supportDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  section: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  sectionNumber: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primary,
  },

  sectionNumberText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  sectionHeaderContent: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  sectionBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  field: {
    flexGrow: 1,
    flexBasis: 290,
    minWidth: 240,
  },

  fullWidthField: {
    width: "100%",
  },

  singleField: {
    maxWidth: 500,
  },

  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  choiceGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
  },

  selectedChoice: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  choiceText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  selectedChoiceText: {
    color: colors.primary,
  },

  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  uploadIcon: {
    width: 52,
    height: 52,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  uploadContent: {
    flex: 1,
  },

  uploadTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  uploadDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  languageButton: {
    minHeight: 48,
    justifyContent: "flex-start",
  },

  passwordStrength: {
    height: 22,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.background,
  },

  strengthBar: {
    height: 5,
    borderRadius: 5,
  },

  strengthText: {
    marginTop: 3,
    paddingHorizontal: 5,
    fontSize: 8,
    fontWeight: "900",
  },

  passwordHelp: {
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  consentRowError: {
    borderColor: colors.error,
  },

  consentContent: {
    flex: 1,
    paddingTop: 7,
  },

  consentTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  consentDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  submitArea: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  submitButton: {
    minHeight: 48,
  },
});