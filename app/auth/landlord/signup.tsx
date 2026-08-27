import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams, type Href } from "expo-router";
import React, { useState } from "react";
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
  Menu,
  ProgressBar,
  RadioButton,
  TextInput,
} from "react-native-paper";

import { api } from "../../../src/api/client";
import TenureExLogo from "../../../src/components/Logo/TenureExLogo";
import { colors, radius, spacing } from "../../../src/theme";

type FormErrors = Partial<Record<
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "dateOfBirth"
  | "address"
  | "postcode"
  | "identificationType"
  | "secondaryLanguage"
  | "password"
  | "confirmPassword"
  | "digitalSignature"
  | "agreement",
  string
>>;

type StartRegistrationResponse = {
  message: string;
  userId: string;
  email: string;
  status: string;
  existingAccount?: boolean;
  registrationComplete?: boolean;
  emailVerificationRequired?: boolean;
  phoneVerificationRequired?: boolean;
};

type VerifyEmailResponse = {
  message: string;
  userId: string;
};

type SendPhoneOtpResponse = {
  message: string;
  developmentOtp?: string;
};

type VerifyPhoneResponse = {
  message: string;
  userId: string;
  status: string;
};

type IdentificationUploadResponse = {
  message: string;
  identificationFileUrl: string;
};

type AddressLookupItem = {
  id: string;
  displayAddress: string;
  residentialAddress: string;
  line1: string;
  line2: string;
  line3: string;
  buildingNumber: string;
  buildingName: string;
  subBuildingName: string;
  street: string;
  town: string;
  district: string;
  county: string;
  postcode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  uprn: string | null;
};

type AddressLookupResponse = {
  postcode: string;
  count: number;
  addresses: AddressLookupItem[];
  message?: string;
};

const secondaryLanguages = [
  "Tamil",
  "Sinhala",
  "Welsh",
  "Polish",
  "Romanian",
  "Urdu",
  "Punjabi",
  "Bengali",
  "Arabic",
  "French",
  "Spanish",
  "Other",
];

const identificationTypes = [
  "Passport",
  "Driving licence",
  "National identity card",
  "Biometric residence permit",
  "Other accepted document",
];


function formatDateForDisplay(value: string) {
  if (!value) {
    return "";
  }

  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (isoMatch) {
    const [, year, month, day] =
      isoMatch;

    return `${day}/${month}/${year}`;
  }

  return value;
}

function valueToDate(value: string) {
  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (isoMatch) {
    const [, year, month, day] =
      isoMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );
  }

  const ukMatch = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (ukMatch) {
    const [, day, month, year] =
      ukMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );
  }

  return new Date(1990, 0, 1);
}

function dateToIso(date: Date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayIso() {
  return dateToIso(
    new Date(),
  );
}

export default function LandlordSignupScreen() {
  const invitationParams = useLocalSearchParams<{ invite?: string; email?: string }>();
  const invitationToken = typeof invitationParams.invite === "string" ? invitationParams.invite : "";
  const invitedEmail = typeof invitationParams.email === "string" ? invitationParams.email : "";
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;

  const [step, setStep] = useState(1);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [identityMenuOpen, setIdentityMenuOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [verificationMode, setVerificationMode] = useState(false);
  const [registrationUserId, setRegistrationUserId] = useState("");
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [identificationDocument, setIdentificationDocument] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState("");
  const [addressResults, setAddressResults] =
    useState<AddressLookupItem[]>([]);
  const [addressLookupLoading, setAddressLookupLoading] =
    useState(false);
  const [addressLookupError, setAddressLookupError] =
    useState("");
  const [addressLookupMessage, setAddressLookupMessage] =
    useState("");
  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");

  const [identificationType, setIdentificationType] = useState("");
  const [secondaryLanguage, setSecondaryLanguage] = useState("");
  const [voiceReading, setVoiceReading] = useState("enabled");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [digitalSignature, setDigitalSignature] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (field: keyof FormErrors) => {
    if (!errors[field]) {
      return;
    }

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const validateStep = () => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!firstName.trim()) {
        newErrors.firstName = "Please enter your first name.";
      }

      if (!lastName.trim()) {
        newErrors.lastName = "Please enter your last name.";
      }

      if (!email.trim()) {
        newErrors.email = "Please enter your email address.";
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }

      if (!phone.trim()) {
        newErrors.phone = "Please enter your phone number.";
      }

      if (!dateOfBirth.trim()) {
        newErrors.dateOfBirth = "Please enter your date of birth.";
      }

      if (!address.trim()) {
        newErrors.address = "Please enter your residential address.";
      }

      if (!postcode.trim()) {
        newErrors.postcode = "Please enter your postcode.";
      }
    }

    if (step === 2) {
      if (!identificationType) {
        newErrors.identificationType =
          "Please select an identification document type.";
      }

      if (!identificationDocument) {
        setDocumentUploadError(
          "Please select an identification document (PDF, JPG or PNG).",
        );
      }

      if (!secondaryLanguage) {
        newErrors.secondaryLanguage =
          "Please select your preferred second language.";
      }
    }

    if (step === 3) {
      if (!password) {
        newErrors.password = "Please create a password.";
      } else if (password.length < 8) {
        newErrors.password =
          "Your password must contain at least 8 characters.";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "The passwords do not match.";
      }
    }

    if (step === 4) {
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

      if (!digitalSignature.trim()) {
        newErrors.digitalSignature =
          "Please enter your full name as your digital signature.";
      } else if (digitalSignature.trim().toLowerCase() !== fullName) {
        newErrors.digitalSignature =
          "Your digital signature must match your full name.";
      }

      if (!agreementAccepted || !privacyAccepted) {
        newErrors.agreement =
          "You must accept the landlord agreement and privacy notice.";
      }
    }

    setErrors(newErrors);

    if (
      step === 2 &&
      !identificationDocument
    ) {
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };


  const handleNativeDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (
      Platform.OS === "android"
    ) {
      setShowDatePicker(false);
    }

    if (
      event.type === "dismissed" ||
      !selectedDate
    ) {
      return;
    }

    setDateOfBirth(
      dateToIso(selectedDate),
    );

    clearError(
      "dateOfBirth",
    );
  };

  const handleFindAddress = async () => {
    const cleanPostcode =
      postcode
        .trim()
        .toUpperCase();

    if (!cleanPostcode) {
      setAddressLookupError(
        "Please enter a postcode first.",
      );

      setErrors((current) => ({
        ...current,
        postcode:
          "Please enter your postcode.",
      }));

      return;
    }

    setAddressLookupLoading(true);
    setAddressLookupError("");
    setAddressLookupMessage("");
    setAddressResults([]);
    setSelectedAddressId("");

    try {
      const response =
        await api.get<AddressLookupResponse>(
          `/address-lookup/postcode/${encodeURIComponent(
            cleanPostcode,
          )}`,
        );

      const results =
        Array.isArray(
          response.data.addresses,
        )
          ? response.data.addresses
          : [];

      setPostcode(
        response.data.postcode ||
          cleanPostcode,
      );

      clearError("postcode");

      setAddressResults(
        results,
      );

      if (results.length === 0) {
        setAddressLookupMessage(
          "No addresses were found for this postcode. You can enter the residential address manually below.",
        );
      } else {
        setAddressLookupMessage(
          `${results.length} address${
            results.length === 1
              ? ""
              : "es"
          } found. Select your address below.`,
        );
      }
    } catch (error: unknown) {
      setAddressLookupError(
        getBackendMessage(error),
      );
    } finally {
      setAddressLookupLoading(false);
    }
  };

  const handleSelectAddress = (
    item: AddressLookupItem,
  ) => {
    setSelectedAddressId(
      item.id,
    );

    setAddress(
      item.residentialAddress ||
        item.displayAddress,
    );

    setPostcode(
      item.postcode
        .trim()
        .toUpperCase(),
    );

    clearError(
      "address",
    );

    clearError(
      "postcode",
    );

    setAddressLookupError("");

    setAddressLookupMessage(
      "Address selected. You can edit the residential address manually if needed.",
    );
  };

  const handlePostcodeChange = (
    value: string,
  ) => {
    setPostcode(
      value.toUpperCase(),
    );

    clearError(
      "postcode",
    );

    setAddressResults([]);
    setSelectedAddressId("");
    setAddressLookupError("");
    setAddressLookupMessage("");
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, 4));
  };

  const handlePrevious = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  };

  const normaliseDateOfBirth = (value: string) => {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const match = trimmed.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
    );

    if (!match) {
      return trimmed;
    }

    const [, day, month, year] = match;

    return `${year}-${month}-${day}`;
  };

  const getBackendMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const backendMessage =
        error.response?.data?.message;

      if (Array.isArray(backendMessage)) {
        return backendMessage.join("\n");
      }

      if (typeof backendMessage === "string") {
        return backendMessage;
      }

      if (error.response?.status === 409) {
        return "An account with this email already exists. Please use another email address or sign in.";
      }

      if (error.request) {
        return Platform.OS === "web"
          ? "Unable to connect to the TenureEx server. Make sure the backend is running on port 3000."
          : "Unable to connect to the TenureEx server. Please check your network connection.";
      }
    }

    return "Something went wrong. Please try again.";
  };

  const handleSelectIdentificationDocument = async () => {
    try {
      setDocumentUploadError("");

      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            "application/pdf",
            "image/jpeg",
            "image/png",
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      if (
        typeof asset.size === "number" &&
        asset.size > 10 * 1024 * 1024
      ) {
        setDocumentUploadError(
          "The identification document must be 10 MB or smaller.",
        );
        return;
      }

      setIdentificationDocument(asset);
      setDocumentUploaded(false);
    } catch (error) {
      console.error(
        "Identification document picker error:",
        error,
      );

      setDocumentUploadError(
        "Unable to select the identification document.",
      );
    }
  };

  const uploadIdentificationDocument = async (
    userId: string,
  ) => {
    if (!identificationDocument) {
      return null;
    }

    setDocumentUploading(true);
    setDocumentUploadError("");

    try {
      const formData = new FormData();

      if (
        Platform.OS === "web" &&
        identificationDocument.file
      ) {
        formData.append(
          "identificationFile",
          identificationDocument.file,
        );
      } else {
        formData.append(
          "identificationFile",
          {
            uri: identificationDocument.uri,
            name:
              identificationDocument.name ||
              "identification-document",
            type:
              identificationDocument.mimeType ||
              "application/octet-stream",
          } as any,
        );
      }

      const response =
        await api.post<IdentificationUploadResponse>(
          `/landlord-registration/upload-identification/${userId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

      setDocumentUploaded(true);

      return response.data;
    } catch (error: unknown) {
      const message = getBackendMessage(error);

      setDocumentUploadError(message);

      throw error;
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleRetryDocumentUpload = async () => {
    if (
      !registrationUserId ||
      !identificationDocument
    ) {
      return;
    }

    try {
      await uploadIdentificationDocument(
        registrationUserId,
      );

      setApiMessage(
        "Identification document uploaded successfully.",
      );
    } catch {
      // The upload helper already displays the backend error.
    }
  };

  const handleCreateAccount = async () => {
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    setApiError("");
    setApiMessage("");

    try {
      const response =
        await api.post<StartRegistrationResponse>(
          "/landlord-registration/start",
          {
            invitationToken: invitationToken || undefined,
            firstName:
              firstName.trim(),
            lastName:
              lastName.trim(),
            email:
              email
                .trim()
                .toLowerCase(),
            phone:
              phone.trim(),
            dateOfBirth:
              normaliseDateOfBirth(
                dateOfBirth,
              ),
            residentialAddress:
              address.trim(),
            postcode:
              postcode
                .trim()
                .toUpperCase(),
            identificationType:
              identificationType,
            preferredLanguage:
              secondaryLanguage,
            voiceReadingEnabled:
              voiceReading === "enabled",
            password,
            digitalSignatureName:
              digitalSignature.trim(),
            agreementAccepted,
            privacyAccepted,
          },
        );

      setRegistrationUserId(
        response.data.userId,
      );

      setEmailVerificationToken("");

      if (response.data.registrationComplete) {
        setEmailVerified(true);
        setPhoneVerified(true);
      }

      if (identificationDocument) {
        try {
          await uploadIdentificationDocument(
            response.data.userId,
          );
        } catch {
          // Registration has already been created.
          // Keep the user in the verification flow so the
          // upload can be retried without creating the account again.
        }
      }

      setVerificationMode(true);

      setApiMessage(
        response.data.message,
      );
    } catch (error: unknown) {
      setApiError(
        getBackendMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (
      !registrationUserId ||
      !/^\d{6}$/.test(emailVerificationToken.trim())
    ) {
      setApiError(
        "Please enter the 6-digit verification code sent to your email.",
      );

      return;
    }

    setVerificationLoading(true);
    setApiError("");
    setApiMessage("");

    try {
      const response =
        await api.post<VerifyEmailResponse>(
          "/landlord-registration/verify-email",
          {
            userId:
              registrationUserId,
            token:
              emailVerificationToken.trim(),
          },
        );

      setEmailVerified(true);

      const otpResponse =
        await api.post<SendPhoneOtpResponse>(
          `/landlord-registration/send-phone-otp/${registrationUserId}`,
        );

      setDevelopmentOtp(
        otpResponse.data
          .developmentOtp ??
          "",
      );

      setApiMessage(
        `${response.data.message} ${otpResponse.data.message}`,
      );
    } catch (error: unknown) {
      setApiError(
        getBackendMessage(error),
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (!registrationUserId) {
      return;
    }

    setVerificationLoading(true);
    setApiError("");
    setApiMessage("");

    try {
      const response =
        await api.post<SendPhoneOtpResponse>(
          `/landlord-registration/send-phone-otp/${registrationUserId}`,
        );

      setDevelopmentOtp(
        response.data
          .developmentOtp ??
          "",
      );

      setOtp("");

      setApiMessage(
        response.data.message,
      );
    } catch (error: unknown) {
      setApiError(
        getBackendMessage(error),
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!otp.trim()) {
      setApiError(
        "Please enter the 6-digit phone verification code.",
      );

      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setApiError(
        "The phone verification code must contain 6 digits.",
      );

      return;
    }

    setVerificationLoading(true);
    setApiError("");
    setApiMessage("");

    try {
      const response =
        await api.post<VerifyPhoneResponse>(
          "/landlord-registration/verify-phone",
          {
            userId:
              registrationUserId,
            code:
              otp.trim(),
          },
        );

      setPhoneVerified(true);

      setApiMessage(
        response.data.message,
      );
    } catch (error: unknown) {
      setApiError(
        getBackendMessage(error),
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace(
      "/auth/landlord/login" as Href,
    );
  };

  if (verificationMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View
            style={[
              styles.screen,
              isDesktop
                ? styles.desktopScreen
                : styles.mobileScreen,
            ]}
          >
            {isDesktop ? (
              <SignupInformationPanel
                currentStep={4}
              />
            ) : null}

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={[
                styles.formScrollContent,
                isDesktop &&
                  styles.desktopFormScrollContent,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formContainer}>
                <View style={styles.mobileHeader}>
                  {!isDesktop ? (
                    <>
                      <Pressable
                        onPress={handleGoToLogin}
                        style={styles.backButton}
                      >
                        <MaterialCommunityIcons
                          name="arrow-left"
                          size={22}
                          color={colors.textPrimary}
                        />
                      </Pressable>

                      <TenureExLogo compact />
                    </>
                  ) : null}
                </View>

                <Text style={styles.eyebrow}>
                  LANDLORD REGISTRATION
                </Text>

                <Text style={styles.title}>
                  Verify your account
                </Text>

                <Text style={styles.subtitle}>
                  A 6-digit verification code has been sent to your email address. Phone verification will continue using the development OTP for now.
                </Text>

                <View style={styles.formSection}>
                  <SectionHeading
                    icon="file-check-outline"
                    title="Identification document"
                    description="Your selected identity document is stored against your landlord profile."
                  />

                  <View style={styles.uploadStatusCard}>
                    <MaterialCommunityIcons
                      name={
                        documentUploaded
                          ? "check-circle-outline"
                          : "file-alert-outline"
                      }
                      size={24}
                      color={
                        documentUploaded
                          ? colors.success
                          : colors.primary
                      }
                    />

                    <View style={styles.uploadStatusText}>
                      <Text style={styles.uploadStatusTitle}>
                        {identificationDocument?.name ||
                          "Identification document"}
                      </Text>

                      <Text style={styles.uploadStatusDescription}>
                        {documentUploaded
                          ? "Uploaded and saved to your landlord profile."
                          : documentUploadError ||
                            "The document has not been uploaded yet."}
                      </Text>
                    </View>

                    {!documentUploaded &&
                    identificationDocument ? (
                      <Button
                        mode="outlined"
                        icon="upload"
                        loading={documentUploading}
                        disabled={documentUploading}
                        onPress={handleRetryDocumentUpload}
                      >
                        Retry
                      </Button>
                    ) : null}
                  </View>
                </View>

                <View style={styles.formSection}>
                  <SectionHeading
                    icon="email-check-outline"
                    title="Email verification"
                    description={`Verify ${email.trim().toLowerCase()} before continuing to phone verification.`}
                  />

                  <View>
                    <Text style={styles.inputLabel}>
                      6-digit email verification code
                    </Text>

                    <TextInput
                      mode="outlined"
                      value={emailVerificationToken}
                      onChangeText={(value) => {
                        setEmailVerificationToken(
                          value.replace(/\D/g, "").slice(0, 6),
                        );
                        setApiError("");
                      }}
                      placeholder="Enter code from your email"
                      keyboardType="number-pad"
                      maxLength={6}
                      left={<TextInput.Icon icon="email-check-outline" />}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      style={styles.textInput}
                      contentStyle={styles.textInputContent}
                    />
                  </View>

                  <Button
                    mode={
                      emailVerified
                        ? "outlined"
                        : "contained"
                    }
                    icon={
                      emailVerified
                        ? "check-circle-outline"
                        : "email-check-outline"
                    }
                    disabled={
                      emailVerified ||
                      verificationLoading ||
                      !/^\d{6}$/.test(emailVerificationToken.trim())
                    }
                    loading={
                      verificationLoading &&
                      !emailVerified
                    }
                    buttonColor={colors.primary}
                    textColor={
                      emailVerified
                        ? colors.success
                        : colors.white
                    }
                    onPress={handleVerifyEmail}
                    style={styles.navigationButton}
                    contentStyle={styles.buttonContent}
                  >
                    {emailVerified
                      ? "Email verified"
                      : "Verify email code"}
                  </Button>
                </View>

                <View style={styles.formSection}>
                  <SectionHeading
                    icon="cellphone-check"
                    title="Phone verification"
                    description={`Verify ${phone}. The development OTP appears below until Twilio/SMS delivery is connected.`}
                  />

                  {emailVerified ? (
                    <>
                      <View style={styles.agreementCard}>
                        <Text style={styles.agreementTitle}>
                          Development phone OTP
                        </Text>

                        <Text
                          selectable
                          style={styles.agreementText}
                        >
                          {developmentOtp ||
                            "Generate an OTP after email verification."}
                        </Text>
                      </View>

                      <View>
                        <Text style={styles.inputLabel}>
                          6-digit verification code
                        </Text>

                        <TextInput
                          mode="outlined"
                          value={otp}
                          onChangeText={(value) => {
                            setOtp(
                              value.replace(
                                /\D/g,
                                "",
                              ).slice(0, 6),
                            );
                            setApiError("");
                          }}
                          placeholder="Enter 6-digit OTP"
                          keyboardType="number-pad"
                          maxLength={6}
                          left={
                            <TextInput.Icon icon="shield-key-outline" />
                          }
                          outlineColor={colors.border}
                          activeOutlineColor={colors.primary}
                          style={styles.textInput}
                          contentStyle={styles.textInputContent}
                        />
                      </View>

                      <View style={styles.navigationButtons}>
                        <Button
                          mode="outlined"
                          icon="refresh"
                          disabled={
                            verificationLoading ||
                            phoneVerified
                          }
                          textColor={colors.primary}
                          onPress={handleResendPhoneOtp}
                          style={styles.navigationButton}
                          contentStyle={styles.buttonContent}
                        >
                          Resend OTP
                        </Button>

                        <Button
                          mode="contained"
                          icon={
                            phoneVerified
                              ? "check-circle-outline"
                              : "cellphone-check"
                          }
                          loading={
                            verificationLoading &&
                            !phoneVerified
                          }
                          disabled={
                            verificationLoading ||
                            phoneVerified
                          }
                          buttonColor={colors.primary}
                          onPress={handleVerifyPhone}
                          style={styles.navigationButton}
                          contentStyle={styles.buttonContent}
                        >
                          {phoneVerified
                            ? "Phone verified"
                            : "Verify phone"}
                        </Button>
                      </View>
                    </>
                  ) : (
                    <View style={styles.agreementCard}>
                      <Text style={styles.agreementText}>
                        Verify your email first. The phone OTP will then be generated automatically.
                      </Text>
                    </View>
                  )}
                </View>

                {apiError ? (
                  <HelperText
                    type="error"
                    visible
                  >
                    {apiError}
                  </HelperText>
                ) : null}

                {apiMessage ? (
                  <View style={styles.preferenceCard}>
                    <Text style={styles.preferenceTitle}>
                      {phoneVerified
                        ? "Registration complete"
                        : "Verification update"}
                    </Text>

                    <Text style={styles.preferenceDescription}>
                      {apiMessage}
                    </Text>
                  </View>
                ) : null}

                {phoneVerified ? (
                  <Button
                    mode="contained"
                    icon="login"
                    buttonColor={colors.primary}
                    onPress={handleGoToLogin}
                    style={styles.navigationButton}
                    contentStyle={styles.buttonContent}
                  >
                    Continue to landlord login
                  </Button>
                ) : null}

                <Text style={styles.footerText}>
                  © 2026 TenureEx. Secure property management.
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
          {isDesktop ? (
            <SignupInformationPanel currentStep={step} />
          ) : null}

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
              <View style={styles.mobileHeader}>
                {!isDesktop ? (
                  <>
                    <Pressable
                      onPress={() => {
                        if (step > 1) {
                          handlePrevious();
                        } else {
                          router.replace(
                            "/auth/landlord/login" as Href,
                          );
                        }
                      }}
                      style={styles.backButton}
                    >
                      <MaterialCommunityIcons
                        name="arrow-left"
                        size={22}
                        color={colors.textPrimary}
                      />
                    </Pressable>

                    <TenureExLogo compact />
                  </>
                ) : null}
              </View>

              <Text style={styles.eyebrow}>LANDLORD REGISTRATION</Text>

              <Text style={styles.title}>
                Complete your account setup
              </Text>

              <Text style={styles.subtitle}>
                Provide the required information to activate your
                landlord account and begin adding properties.
              </Text>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    Step {step} of 4
                  </Text>

                  <Text style={styles.progressValue}>
                    {step * 25}% complete
                  </Text>
                </View>

                <ProgressBar
                  progress={step / 4}
                  color={colors.primary}
                  style={styles.progressBar}
                />

                <View style={styles.stepLabels}>
                  {["Personal", "Identity", "Security", "Agreement"].map(
                    (label, index) => (
                      <View
                        key={label}
                        style={styles.stepLabelContainer}
                      >
                        <View
                          style={[
                            styles.stepCircle,
                            index + 1 <= step &&
                              styles.stepCircleActive,
                          ]}
                        >
                          {index + 1 < step ? (
                            <MaterialCommunityIcons
                              name="check"
                              size={14}
                              color={colors.white}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.stepNumber,
                                index + 1 <= step &&
                                  styles.stepNumberActive,
                              ]}
                            >
                              {index + 1}
                            </Text>
                          )}
                        </View>

                        {isTablet ? (
                          <Text
                            style={[
                              styles.stepText,
                              index + 1 === step &&
                                styles.stepTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        ) : null}
                      </View>
                    ),
                  )}
                </View>
              </View>

              {step === 1 ? (
                <PersonalDetailsStep
                  values={{
                    firstName,
                    lastName,
                    email,
                    phone,
                    dateOfBirth,
                    address,
                    postcode,
                  }}
                  errors={errors}
                  setters={{
                    setFirstName,
                    setLastName,
                    setEmail,
                    setPhone,
                    setDateOfBirth,
                    setAddress,
                    setPostcode,
                  }}
                  clearError={clearError}
                  isTablet={isTablet}
                  showDatePicker={showDatePicker}
                  onOpenDatePicker={() => setShowDatePicker(true)}
                  onCloseDatePicker={() => setShowDatePicker(false)}
                  onNativeDateChange={handleNativeDateChange}
                  addressResults={addressResults}
                  addressLookupLoading={addressLookupLoading}
                  addressLookupError={addressLookupError}
                  addressLookupMessage={addressLookupMessage}
                  selectedAddressId={selectedAddressId}
                  onFindAddress={handleFindAddress}
                  onSelectAddress={handleSelectAddress}
                  onPostcodeChange={handlePostcodeChange}
                />
              ) : null}

              {step === 2 ? (
                <View style={styles.formSection}>
                  <SectionHeading
                    icon="card-account-details-outline"
                    title="Identity and accessibility"
                    description="Add your identification details and communication preferences."
                  />

                  <View>
                    <Text style={styles.inputLabel}>
                      Identification document type
                    </Text>

                    <Menu
                      visible={identityMenuOpen}
                      onDismiss={() => setIdentityMenuOpen(false)}
                      anchor={
                        <Pressable
                          onPress={() => setIdentityMenuOpen(true)}
                        >
                          <View pointerEvents="none">
                            <TextInput
                              mode="outlined"
                              value={identificationType}
                              placeholder="Select an identification type"
                              editable={false}
                              left={
                                <TextInput.Icon icon="card-account-details-outline" />
                              }
                              right={
                                <TextInput.Icon icon="chevron-down" />
                              }
                              error={Boolean(errors.identificationType)}
                              outlineColor={colors.border}
                              activeOutlineColor={colors.primary}
                              style={styles.textInput}
                              contentStyle={styles.textInputContent}
                            />
                          </View>
                        </Pressable>
                      }
                    >
                      {identificationTypes.map((item) => (
                        <Menu.Item
                          key={item}
                          title={item}
                          leadingIcon={
                            item === identificationType
                              ? "check"
                              : "card-account-details-outline"
                          }
                          onPress={() => {
                            setIdentificationType(item);
                            setIdentityMenuOpen(false);
                            clearError("identificationType");
                          }}
                        />
                      ))}
                    </Menu>

                    <FieldError
                      message={errors.identificationType}
                    />
                  </View>

                  <View style={styles.uploadCard}>
                    <View style={styles.uploadIcon}>
                      <MaterialCommunityIcons
                        name={
                          identificationDocument
                            ? "file-check-outline"
                            : "file-upload-outline"
                        }
                        size={27}
                        color={
                          identificationDocument
                            ? colors.success
                            : colors.primary
                        }
                      />
                    </View>

                    <View style={styles.uploadText}>
                      <Text style={styles.uploadTitle}>
                        {identificationDocument
                          ? identificationDocument.name
                          : "Upload identification document"}
                      </Text>

                      <Text style={styles.uploadDescription}>
                        {identificationDocument
                          ? "Selected. It will be uploaded securely when you create the account."
                          : "Select a clear PDF, JPG or PNG document. Maximum file size: 10 MB."}
                      </Text>

                      {documentUploadError ? (
                        <Text style={styles.uploadErrorText}>
                          {documentUploadError}
                        </Text>
                      ) : null}
                    </View>

                    <Button
                      mode="outlined"
                      icon={
                        identificationDocument
                          ? "file-replace-outline"
                          : "upload"
                      }
                      textColor={colors.primary}
                      style={styles.smallButton}
                      onPress={handleSelectIdentificationDocument}
                    >
                      {identificationDocument
                        ? "Change"
                        : "Select"}
                    </Button>
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>
                      Preferred second language
                    </Text>

                    <Menu
                      visible={languageMenuOpen}
                      onDismiss={() => setLanguageMenuOpen(false)}
                      anchor={
                        <Pressable
                          onPress={() => setLanguageMenuOpen(true)}
                        >
                          <View pointerEvents="none">
                            <TextInput
                              mode="outlined"
                              value={secondaryLanguage}
                              placeholder="Select a language"
                              editable={false}
                              right={
                                <TextInput.Icon icon="chevron-down" />
                              }
                              error={Boolean(
                                errors.secondaryLanguage,
                              )}
                              outlineColor={colors.border}
                              activeOutlineColor={colors.primary}
                              style={styles.textInput}
                            />
                          </View>
                        </Pressable>
                      }
                    >
                      {secondaryLanguages.map((item) => (
                        <Menu.Item
                          key={item}
                          title={item}
                          onPress={() => {
                            setSecondaryLanguage(item);
                            setLanguageMenuOpen(false);
                            clearError("secondaryLanguage");
                          }}
                        />
                      ))}
                    </Menu>

                    <FieldError message={errors.secondaryLanguage} />
                  </View>

                  <View style={styles.preferenceCard}>
                    <Text style={styles.preferenceTitle}>
                      Voice reading for messages and agreements
                    </Text>

                    <Text style={styles.preferenceDescription}>
                      English remains the primary document language.
                      Your selected language can be provided as an
                      additional translation.
                    </Text>

                    <RadioButton.Group
                      value={voiceReading}
                      onValueChange={setVoiceReading}
                    >
                      <View style={styles.radioOption}>
                        <RadioButton
                          value="enabled"
                          color={colors.primary}
                        />
                        <Text style={styles.radioText}>
                          Enable voice reading
                        </Text>
                      </View>

                      <View style={styles.radioOption}>
                        <RadioButton
                          value="disabled"
                          color={colors.primary}
                        />
                        <Text style={styles.radioText}>
                          Do not enable voice reading
                        </Text>
                      </View>
                    </RadioButton.Group>
                  </View>
                </View>
              ) : null}

              {step === 3 ? (
                <View style={styles.formSection}>
                  <SectionHeading
                    icon="shield-key-outline"
                    title="Account security"
                    description="Create a secure password for your landlord account."
                  />

                  <View>
                    <Text style={styles.inputLabel}>Password</Text>

                    <TextInput
                      mode="outlined"
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        clearError("password");
                      }}
                      placeholder="Create a password"
                      secureTextEntry={!passwordVisible}
                      left={<TextInput.Icon icon="lock-outline" />}
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
                      error={Boolean(errors.password)}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      style={styles.textInput}
                      contentStyle={styles.textInputContent}
                    />

                    <FieldError message={errors.password} />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>
                      Confirm password
                    </Text>

                    <TextInput
                      mode="outlined"
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        clearError("confirmPassword");
                      }}
                      placeholder="Enter the password again"
                      secureTextEntry={!confirmPasswordVisible}
                      left={
                        <TextInput.Icon icon="lock-check-outline" />
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
                              (current) => !current,
                            )
                          }
                        />
                      }
                      error={Boolean(errors.confirmPassword)}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      style={styles.textInput}
                      contentStyle={styles.textInputContent}
                    />

                    <FieldError message={errors.confirmPassword} />
                  </View>

                  <View style={styles.passwordRules}>
                    <PasswordRule
                      complete={password.length >= 8}
                      text="At least 8 characters"
                    />

                    <PasswordRule
                      complete={/[A-Z]/.test(password)}
                      text="At least one capital letter"
                    />

                    <PasswordRule
                      complete={/[0-9]/.test(password)}
                      text="At least one number"
                    />

                    <PasswordRule
                      complete={password === confirmPassword && !!password}
                      text="Both passwords match"
                    />
                  </View>
                </View>
              ) : null}

              {step === 4 ? (
                <View style={styles.formSection}>
                  <SectionHeading
                    icon="file-sign"
                    title="Agreement and digital signature"
                    description="Review and accept the landlord account conditions."
                  />

                  <View style={styles.agreementCard}>
                    <Text style={styles.agreementTitle}>
                      Landlord platform agreement
                    </Text>

                    <Text style={styles.agreementText}>
                      By registering, you confirm that the information
                      supplied is accurate and that you are authorised to
                      manage the properties added to this account.
                    </Text>

                    <Text style={styles.agreementText}>
                      Property details, documents and maintenance
                      information may be shared with the assigned Estate
                      Agent and authorised service providers where needed
                      for property management.
                    </Text>

                    <Text style={styles.agreementText}>
                      Personal information must be handled according to
                      the platform privacy notice, applicable data
                      protection requirements and user permissions.
                    </Text>

                    <Pressable style={styles.readAgreementButton}>
                      <MaterialCommunityIcons
                        name="open-in-new"
                        size={17}
                        color={colors.primary}
                      />

                      <Text style={styles.readAgreementText}>
                        Read the full agreement
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.checkboxRow}
                    onPress={() =>
                      setAgreementAccepted((current) => !current)
                    }
                  >
                    <Checkbox
                      status={
                        agreementAccepted ? "checked" : "unchecked"
                      }
                      onPress={() =>
                        setAgreementAccepted((current) => !current)
                      }
                      color={colors.primary}
                    />

                    <Text style={styles.checkboxText}>
                      I have read and accept the landlord platform
                      agreement.
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.checkboxRow}
                    onPress={() =>
                      setPrivacyAccepted((current) => !current)
                    }
                  >
                    <Checkbox
                      status={
                        privacyAccepted ? "checked" : "unchecked"
                      }
                      onPress={() =>
                        setPrivacyAccepted((current) => !current)
                      }
                      color={colors.primary}
                    />

                    <Text style={styles.checkboxText}>
                      I have read the privacy notice and understand how
                      my information will be used.
                    </Text>
                  </Pressable>

                  <FieldError message={errors.agreement} />

                  <View>
                    <Text style={styles.inputLabel}>
                      Digital signature
                    </Text>

                    <TextInput
                      mode="outlined"
                      value={digitalSignature}
                      onChangeText={(value) => {
                        setDigitalSignature(value);
                        clearError("digitalSignature");
                      }}
                      placeholder={`${firstName || "First"} ${
                        lastName || "Last"
                      }`}
                      left={<TextInput.Icon icon="draw-pen" />}
                      error={Boolean(errors.digitalSignature)}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      style={styles.signatureInput}
                      contentStyle={styles.signatureContent}
                    />

                    <Text style={styles.signatureHelp}>
                      Type your full legal name. This will be recorded as
                      your electronic signature.
                    </Text>

                    <FieldError message={errors.digitalSignature} />
                  </View>
                </View>
              ) : null}

              <View style={styles.navigationButtons}>
                {step > 1 ? (
                  <Button
                    mode="outlined"
                    icon="arrow-left"
                    textColor={colors.primary}
                    onPress={handlePrevious}
                    style={styles.navigationButton}
                    contentStyle={styles.buttonContent}
                  >
                    Previous
                  </Button>
                ) : (
                  <Button
                    mode="text"
                    icon="arrow-left"
                    textColor={colors.primary}
                    onPress={() =>
                      router.replace(
                        "/auth/landlord/login" as Href,
                      )
                    }
                    style={styles.navigationButton}
                    contentStyle={styles.buttonContent}
                  >
                    Back to login
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    mode="contained"
                    icon="arrow-right"
                    contentStyle={styles.nextButtonContent}
                    buttonColor={colors.primary}
                    onPress={handleNext}
                    style={styles.navigationButton}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    icon="account-check-outline"
                    loading={loading}
                    disabled={loading}
                    buttonColor={colors.primary}
                    onPress={handleCreateAccount}
                    style={styles.navigationButton}
                    contentStyle={styles.buttonContent}
                  >
                    Create account
                  </Button>
                )}
              </View>

              <Text style={styles.footerText}>
                © 2026 TenureEx. Secure property management.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PersonalDetailsStep({
  values,
  errors,
  setters,
  clearError,
  isTablet,
  showDatePicker,
  onOpenDatePicker,
  onCloseDatePicker,
  onNativeDateChange,
  addressResults,
  addressLookupLoading,
  addressLookupError,
  addressLookupMessage,
  selectedAddressId,
  onFindAddress,
  onSelectAddress,
  onPostcodeChange,
}: {
  values: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    postcode: string;
  };
  errors: FormErrors;
  setters: {
    setFirstName: (value: string) => void;
    setLastName: (value: string) => void;
    setEmail: (value: string) => void;
    setPhone: (value: string) => void;
    setDateOfBirth: (value: string) => void;
    setAddress: (value: string) => void;
    setPostcode: (value: string) => void;
  };
  clearError: (field: keyof FormErrors) => void;
  isTablet: boolean;
  showDatePicker: boolean;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onNativeDateChange: (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => void;
  addressResults: AddressLookupItem[];
  addressLookupLoading: boolean;
  addressLookupError: string;
  addressLookupMessage: string;
  selectedAddressId: string;
  onFindAddress: () => void;
  onSelectAddress: (
    item: AddressLookupItem,
  ) => void;
  onPostcodeChange: (
    value: string,
  ) => void;
}) {
  return (
    <View style={styles.formSection}>
      <SectionHeading
        icon="account-outline"
        title="Personal information"
        description="Enter your contact and residential details."
      />

      <View
        style={[
          styles.fieldRow,
          !isTablet && styles.fieldRowStacked,
        ]}
      >
        <View style={styles.rowField}>
          <Field
            label="First name"
            value={values.firstName}
            onChangeText={(value) => {
              setters.setFirstName(value);
              clearError("firstName");
            }}
            placeholder="First name"
            icon="account-outline"
            error={errors.firstName}
          />
        </View>

        <View style={styles.rowField}>
          <Field
            label="Last name"
            value={values.lastName}
            onChangeText={(value) => {
              setters.setLastName(value);
              clearError("lastName");
            }}
            placeholder="Last name"
            icon="account-outline"
            error={errors.lastName}
          />
        </View>
      </View>

      <Field
        label="Email address"
        value={values.email}
        onChangeText={(value) => {
          setters.setEmail(value);
          clearError("email");
        }}
        placeholder="name@example.com"
        icon="email-outline"
        keyboardType="email-address"
        error={errors.email}
      />

      <Field
        label="Phone number"
        value={values.phone}
        onChangeText={(value) => {
          setters.setPhone(value);
          clearError("phone");
        }}
        placeholder="+44 7700 900000"
        icon="phone-outline"
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <View>
        <Text style={styles.inputLabel}>
          Date of birth
        </Text>

        {Platform.OS === "web" ? (
          <View
            style={[
              styles.webDateInputContainer,
              errors.dateOfBirth &&
                styles.webDateInputContainerError,
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-outline"
              size={20}
              color={colors.textSecondary}
            />

            {React.createElement(
              "input",
              {
                type: "date",
                value:
                  /^\d{4}-\d{2}-\d{2}$/.test(
                    values.dateOfBirth,
                  )
                    ? values.dateOfBirth
                    : "",
                max: getTodayIso(),
                onChange: (
                  event: any,
                ) => {
                  setters.setDateOfBirth(
                    event.target.value,
                  );
                  clearError(
                    "dateOfBirth",
                  );
                },
                style: {
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 16,
                  color: "#18212B",
                  fontFamily: "inherit",
                  padding: "12px 4px",
                  cursor: "pointer",
                },
              },
            )}
          </View>
        ) : (
          <>
            <Pressable
              onPress={onOpenDatePicker}
            >
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  value={formatDateForDisplay(
                    values.dateOfBirth,
                  )}
                  placeholder="Select date of birth"
                  editable={false}
                  left={
                    <TextInput.Icon icon="calendar-outline" />
                  }
                  right={
                    <TextInput.Icon icon="chevron-down" />
                  }
                  error={Boolean(
                    errors.dateOfBirth,
                  )}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={styles.textInput}
                  contentStyle={styles.textInputContent}
                />
              </View>
            </Pressable>

            {showDatePicker ? (
              <View style={styles.nativeDatePickerWrap}>
                <DateTimePicker
                  value={valueToDate(
                    values.dateOfBirth,
                  )}
                  mode="date"
                  display={
                    Platform.OS === "ios"
                      ? "spinner"
                      : "default"
                  }
                  maximumDate={
                    new Date()
                  }
                  onChange={
                    onNativeDateChange
                  }
                />

                {Platform.OS === "ios" ? (
                  <Button
                    mode="contained"
                    onPress={
                      onCloseDatePicker
                    }
                    buttonColor={
                      colors.primary
                    }
                    style={
                      styles.datePickerDoneButton
                    }
                  >
                    Done
                  </Button>
                ) : null}
              </View>
            ) : null}
          </>
        )}

        <FieldError
          message={errors.dateOfBirth}
        />
      </View>

      <View style={styles.addressLookupSection}>
        <View>
          <Text style={styles.inputLabel}>
            Postcode
          </Text>

          <View
            style={[
              styles.postcodeSearchRow,
              !isTablet &&
                styles.postcodeSearchRowStacked,
            ]}
          >
            <View style={styles.postcodeSearchField}>
              <TextInput
                mode="outlined"
                value={values.postcode}
                onChangeText={onPostcodeChange}
                placeholder="IG11 0RB"
                autoCapitalize="characters"
                autoCorrect={false}
                left={
                  <TextInput.Icon icon="mailbox-outline" />
                }
                error={Boolean(
                  errors.postcode,
                )}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.textInput}
                contentStyle={styles.textInputContent}
                onSubmitEditing={onFindAddress}
              />

              <FieldError
                message={errors.postcode}
              />
            </View>

            <Button
              mode="contained"
              icon="magnify"
              loading={addressLookupLoading}
              disabled={
                addressLookupLoading ||
                !values.postcode.trim()
              }
              buttonColor={colors.primary}
              onPress={onFindAddress}
              style={styles.findAddressButton}
              contentStyle={
                styles.findAddressButtonContent
              }
            >
              Find address
            </Button>
          </View>
        </View>

        {addressLookupError ? (
          <View style={styles.addressLookupErrorCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={colors.error}
            />

            <Text style={styles.addressLookupErrorText}>
              {addressLookupError}
            </Text>
          </View>
        ) : null}

        {addressLookupMessage ? (
          <View style={styles.addressLookupMessageCard}>
            <MaterialCommunityIcons
              name={
                addressResults.length > 0
                  ? "map-marker-check-outline"
                  : "information-outline"
              }
              size={20}
              color={colors.primary}
            />

            <Text style={styles.addressLookupMessageText}>
              {addressLookupMessage}
            </Text>
          </View>
        ) : null}

        {addressResults.length > 0 ? (
          <View style={styles.addressResultsCard}>
            <View style={styles.addressResultsHeader}>
              <View>
                <Text style={styles.addressResultsTitle}>
                  Select your address
                </Text>

                <Text style={styles.addressResultsSubtitle}>
                  {addressResults.length} addresses found for{" "}
                  {values.postcode}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="home-search-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <ScrollView
              nestedScrollEnabled
              style={styles.addressResultsList}
              contentContainerStyle={
                styles.addressResultsListContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {addressResults.map(
                (
                  item,
                  index,
                ) => {
                  const selected =
                    selectedAddressId ===
                    item.id;

                  return (
                    <Pressable
                      key={`${item.id}-${index}`}
                      onPress={() =>
                        onSelectAddress(
                          item,
                        )
                      }
                      style={({ pressed }) => [
                        styles.addressResultRow,
                        selected &&
                          styles.addressResultRowSelected,
                        pressed &&
                          styles.addressResultRowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.displayAddress}`}
                    >
                      <View
                        style={[
                          styles.addressResultIcon,
                          selected &&
                            styles.addressResultIconSelected,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            selected
                              ? "check"
                              : "home-outline"
                          }
                          size={18}
                          color={
                            selected
                              ? colors.white
                              : colors.primary
                          }
                        />
                      </View>

                      <View style={styles.addressResultTextWrap}>
                        <Text
                          style={[
                            styles.addressResultText,
                            selected &&
                              styles.addressResultTextSelected,
                          ]}
                        >
                          {item.displayAddress}
                        </Text>

                        {item.uprn ? (
                          <Text style={styles.addressResultMeta}>
                            UPRN {item.uprn}
                          </Text>
                        ) : null}
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={21}
                        color={
                          selected
                            ? colors.primary
                            : colors.textMuted
                        }
                      />
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>
        ) : null}

        <View>
          <View style={styles.manualAddressHeader}>
            <Text style={styles.inputLabel}>
              Residential address
            </Text>

            <Text style={styles.manualAddressHint}>
              Select above or enter manually
            </Text>
          </View>

          <TextInput
            mode="outlined"
            value={values.address}
            onChangeText={(value) => {
              setters.setAddress(
                value,
              );

              clearError(
                "address",
              );

              if (
                selectedAddressId
              ) {
                // Keep the selected address indication,
                // but allow the landlord to correct formatting.
              }
            }}
            placeholder="Building number, street and town"
            autoCapitalize="words"
            autoCorrect={false}
            multiline
            numberOfLines={3}
            left={
              <TextInput.Icon icon="map-marker-outline" />
            }
            error={Boolean(
              errors.address,
            )}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            style={[
              styles.textInput,
              styles.multilineInput,
            ]}
            contentStyle={styles.textInputContent}
          />

          <FieldError
            message={errors.address}
          />
        </View>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={
          keyboardType === "email-address" ? "none" : "sentences"
        }
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        left={<TextInput.Icon icon={icon} />}
        error={Boolean(error)}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        style={[
          styles.textInput,
          multiline && styles.multilineInput,
        ]}
        contentStyle={styles.textInputContent}
      />

      <FieldError message={error} />
    </View>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <HelperText type="error" visible style={styles.helperText}>
      {message}
    </HelperText>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={23}
          color={colors.primary}
        />
      </View>

      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );
}

function PasswordRule({
  complete,
  text,
}: {
  complete: boolean;
  text: string;
}) {
  return (
    <View style={styles.passwordRule}>
      <MaterialCommunityIcons
        name={
          complete
            ? "check-circle-outline"
            : "circle-outline"
        }
        size={18}
        color={complete ? colors.success : colors.textMuted}
      />

      <Text
        style={[
          styles.passwordRuleText,
          complete && styles.passwordRuleComplete,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SignupInformationPanel({
  currentStep,
}: {
  currentStep: number;
}) {
  const steps = [
    {
      title: "Personal information",
      text: "Provide your name and contact details.",
      icon: "account-outline",
    },
    {
      title: "Identity and language",
      text: "Add identification and communication preferences.",
      icon: "card-account-details-outline",
    },
    {
      title: "Account security",
      text: "Create your secure account password.",
      icon: "shield-key-outline",
    },
    {
      title: "Agreement",
      text: "Accept the terms and add your digital signature.",
      icon: "file-sign",
    },
  ] as const;

  return (
    <View style={styles.informationPanel}>
      <View style={styles.informationCircleOne} />
      <View style={styles.informationCircleTwo} />

      <View style={styles.informationContent}>
        <TenureExLogo light />

        <View>
          <Text style={styles.informationEyebrow}>
            LANDLORD ONBOARDING
          </Text>

          <Text style={styles.informationTitle}>
            Set up your property management account.
          </Text>

          <Text style={styles.informationDescription}>
            Complete each section to activate your landlord workspace.
            You can add properties after registration.
          </Text>

          <View style={styles.sidebarSteps}>
            {steps.map((item, index) => {
              const number = index + 1;
              const active = number === currentStep;
              const complete = number < currentStep;

              return (
                <View key={item.title} style={styles.sidebarStep}>
                  <View
                    style={[
                      styles.sidebarStepIcon,
                      active && styles.sidebarStepIconActive,
                      complete && styles.sidebarStepIconComplete,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={complete ? "check" : item.icon}
                      size={20}
                      color={
                        active || complete
                          ? colors.white
                          : "rgba(255,255,255,0.55)"
                      }
                    />
                  </View>

                  <View style={styles.sidebarStepText}>
                    <Text
                      style={[
                        styles.sidebarStepTitle,
                        active && styles.sidebarStepTitleActive,
                      ]}
                    >
                      {number}. {item.title}
                    </Text>

                    <Text style={styles.sidebarStepDescription}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.informationFooterRow}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={19}
            color="rgba(255,255,255,0.70)"
          />

          <Text style={styles.informationFooter}>
            Your information should only be used for authorised property
            management purposes.
          </Text>
        </View>
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
    flex: 0.9,
    minWidth: 410,
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
  },

  informationCircleOne: {
    position: "absolute",
    top: -170,
    right: -140,
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  informationCircleTwo: {
    position: "absolute",
    bottom: -190,
    left: -150,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  informationContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 52,
  },

  informationEyebrow: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  informationTitle: {
    maxWidth: 540,
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 36,
    lineHeight: 45,
    fontWeight: "900",
  },

  informationDescription: {
    maxWidth: 510,
    marginTop: spacing.lg,
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 22,
  },

  sidebarSteps: {
    gap: spacing.lg,
    marginTop: 38,
  },

  sidebarStep: {
    flexDirection: "row",
    gap: spacing.md,
  },

  sidebarStepIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  sidebarStepIconActive: {
    backgroundColor: colors.primary,
  },

  sidebarStepIconComplete: {
    backgroundColor: colors.success,
  },

  sidebarStepText: {
    flex: 1,
  },

  sidebarStepTitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "800",
  },

  sidebarStepTitleActive: {
    color: colors.white,
  },

  sidebarStepDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    lineHeight: 16,
  },

  informationFooterRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  informationFooter: {
    flex: 1,
    color: "rgba(255,255,255,0.52)",
    fontSize: 10,
    lineHeight: 16,
  },

  formScroll: {
    flex: 1.1,
    backgroundColor: colors.white,
  },

  formScrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  desktopFormScrollContent: {
    paddingHorizontal: 58,
    paddingVertical: 46,
  },

  formContainer: {
    width: "100%",
    maxWidth: 650,
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

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  title: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },

  progressSection: {
    marginTop: spacing.xl,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  progressValue: {
    color: colors.textMuted,
    fontSize: 9,
  },

  progressBar: {
    height: 7,
    marginTop: spacing.sm,
    borderRadius: 4,
    backgroundColor: colors.primaryLight,
  },

  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },

  stepLabelContainer: {
    alignItems: "center",
    gap: 5,
  },

  stepCircle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  stepNumber: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "900",
  },

  stepNumberActive: {
    color: colors.white,
  },

  stepText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  stepTextActive: {
    color: colors.primary,
  },

  formSection: {
    gap: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  sectionIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  sectionHeadingText: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },

  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  fieldRowStacked: {
    flexDirection: "column",
  },

  rowField: {
    flex: 1,
    minWidth: 0,
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

  multilineInput: {
    minHeight: 92,
  },

  textInputContent: {
    minHeight: 54,
    fontSize: 13,
  },

  helperText: {
    paddingHorizontal: 0,
  },

  uploadCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  uploadIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  uploadText: {
    flex: 1,
    minWidth: 180,
  },

  uploadTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  uploadDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  smallButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  preferenceCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  preferenceTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  preferenceDescription: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },

  radioText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  passwordRules: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  passwordRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  passwordRuleText: {
    color: colors.textMuted,
    fontSize: 10,
  },

  passwordRuleComplete: {
    color: colors.success,
    fontWeight: "700",
  },

  agreementCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  agreementTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  agreementText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 17,
  },

  readAgreementButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
  },

  readAgreementText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: -8,
  },

  checkboxText: {
    flex: 1,
    marginTop: 9,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  signatureInput: {
    backgroundColor: colors.white,
  },

  signatureContent: {
    minHeight: 65,
    fontSize: 18,
    fontStyle: "italic",
  },

  signatureHelp: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  navigationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  navigationButton: {
    minWidth: 150,
    flexGrow: 1,
    borderRadius: radius.md,
  },

  buttonContent: {
    minHeight: 52,
  },

  nextButtonContent: {
    minHeight: 52,
    flexDirection: "row-reverse",
  },

  footerText: {
    marginTop: spacing.xl,
    color: colors.textMuted,
    fontSize: 8,
    textAlign: "center",
  },

  webDateInputContainer: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },

  webDateInputContainerError: {
    borderColor: colors.error,
  },

  nativeDatePickerWrap: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  datePickerDoneButton: {
    marginTop: 8,
    alignSelf: "flex-end",
  },

  addressLookupSection: {
    gap: spacing.md,
  },

  postcodeSearchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  postcodeSearchRowStacked: {
    flexDirection: "column",
  },

  postcodeSearchField: {
    flex: 1,
    minWidth: 0,
  },

  findAddressButton: {
    minWidth: 150,
    marginTop: 0,
    borderRadius: radius.md,
  },

  findAddressButtonContent: {
    minHeight: 56,
    paddingHorizontal: spacing.sm,
  },

  addressLookupErrorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.22)",
    borderRadius: radius.md,
    backgroundColor: "rgba(211, 47, 47, 0.05)",
  },

  addressLookupErrorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },

  addressLookupMessageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(25, 118, 210, 0.16)",
    borderRadius: radius.md,
    backgroundColor: "rgba(25, 118, 210, 0.04)",
  },

  addressLookupMessageText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  addressResultsCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  addressResultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  addressResultsTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },

  addressResultsSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
  },

  addressResultsList: {
    maxHeight: 300,
  },

  addressResultsListContent: {
    paddingVertical: 4,
  },

  addressResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.055)",
    backgroundColor: colors.white,
  },

  addressResultRowSelected: {
    backgroundColor: "rgba(25, 118, 210, 0.07)",
  },

  addressResultRowPressed: {
    opacity: 0.78,
  },

  addressResultIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(25, 118, 210, 0.08)",
  },

  addressResultIconSelected: {
    backgroundColor: colors.primary,
  },

  addressResultTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  addressResultText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  addressResultTextSelected: {
    color: colors.primary,
    fontWeight: "800",
  },

  addressResultMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 10,
  },

  manualAddressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  manualAddressHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  uploadErrorText: {
    marginTop: 6,
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
  },

  uploadStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  uploadStatusText: {
    flex: 1,
    minWidth: 0,
  },

  uploadStatusTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },

  uploadStatusDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});