import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";

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
  Dialog,
  Portal,
  RadioButton,
  Snackbar,
  TextInput,
} from "react-native-paper";

import Animated, {
  FadeInUp,
} from "react-native-reanimated";

import {
  saveAgentOnboardingSession,
} from "../../../src/auth/agent-onboarding-storage";

import TenureExLogo from "../../../src/components/Logo/TenureExLogo";

import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

/* =========================================================
   CONFIG
========================================================= */

const AGENT_LOGIN_ROUTE =
  "/auth/agent/login" as Href;

const AGENT_APPLICATION_STATUS_ROUTE =
  "/auth/agent/application-status" as Href;

/*
  Web:
  http://localhost:3000

  iOS simulator:
  http://localhost:3000

  Android emulator:
  http://10.0.2.2:3000
*/

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000/api/v1"
    : "http://localhost:3000/api/v1";

/* =========================================================
   TYPES
========================================================= */

type AccountType =
  | "business"
  | "individual";

type RegistrationStep =
  | 1
  | 2
  | 3;

type BasicDetails = {
  accountType: AccountType;

  firstName: string;

  lastName: string;

  businessName: string;

  companyNumber: string;

  email: string;

  phone: string;
};

type AdditionalDetails = {
  businessDetails: string;

  employeeCount: string;

  employeeLoginCount: string;

  propertyCount: string;

  branchCount: string;
};

type StartRegistrationResponse = {
  message: string;

  userId: string;

  applicationId: string;

  developmentEmailVerificationToken?: string;
};

type VerifyEmailResponse = {
  message: string;

  userId: string;
};

type SendOtpResponse = {
  message: string;

  developmentOtp?: string;
};

type VerifyPhoneResponse = {
  message: string;

  applicationId: string;

  onboardingToken: string;

  expiresIn: number;
};

type SubmitRegistrationResponse = {
  message: string;

  applicationId: string;

  status: string;

  submittedAt?: string;

  estimatedProcessingDays?: number;
};

/* =========================================================
   INITIAL VALUES
========================================================= */

const INITIAL_BASIC_DETAILS: BasicDetails = {
  accountType: "business",

  firstName: "",

  lastName: "",

  businessName: "",

  companyNumber: "",

  email: "",

  phone: "",
};

const INITIAL_ADDITIONAL_DETAILS: AdditionalDetails = {
  businessDetails: "",

  employeeCount: "",

  employeeLoginCount: "",

  propertyCount: "",

  branchCount: "",
};

/* =========================================================
   API HELPER
========================================================= */

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        },
      },
    );

  let data: any;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response.",
    );
  }

  if (!response.ok) {
    let message =
      "Something went wrong.";

    if (
      Array.isArray(
        data?.message,
      )
    ) {
      message =
        data.message.join("\n");
    } else if (
      typeof data?.message ===
      "string"
    ) {
      message =
        data.message;
    } else if (
      typeof data?.error ===
      "string"
    ) {
      message =
        data.error;
    }

    throw new Error(
      message,
    );
  }

  return data as T;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AgentSignupRoute() {
  const { width } =
    useWindowDimensions();

  const isDesktop =
    width >= 900;

  const isMobile =
    width < 600;

  const [
    step,
    setStep,
  ] =
    useState<RegistrationStep>(
      1,
    );

  const [
    basicDetails,
    setBasicDetails,
  ] =
    useState<BasicDetails>(
      INITIAL_BASIC_DETAILS,
    );

  const [
    additionalDetails,
    setAdditionalDetails,
  ] =
    useState<AdditionalDetails>(
      INITIAL_ADDITIONAL_DETAILS,
    );

  /* =======================================================
     BACKEND IDS
  ======================================================= */

  const [
    userId,
    setUserId,
  ] =
    useState("");

  const [
    applicationId,
    setApplicationId,
  ] =
    useState("");

  /* =======================================================
     VERIFICATION
  ======================================================= */

  const [
    emailVerificationToken,
    setEmailVerificationToken,
  ] =
    useState("");

  const [
    developmentOtp,
    setDevelopmentOtp,
  ] =
    useState("");

  const [
    otp,
    setOtp,
  ] =
    useState("");

  const [
    emailVerified,
    setEmailVerified,
  ] =
    useState(false);

  const [
    phoneVerified,
    setPhoneVerified,
  ] =
    useState(false);

  const [
    onboardingToken,
    setOnboardingToken,
  ] =
    useState("");

  /* =======================================================
     AGREEMENTS
  ======================================================= */

  const [
    authorised,
    setAuthorised,
  ] =
    useState(false);

  const [
    termsAccepted,
    setTermsAccepted,
  ] =
    useState(false);

  const [
    privacyAccepted,
    setPrivacyAccepted,
  ] =
    useState(false);

  /* =======================================================
     UI
  ======================================================= */

  const [
    errors,
    setErrors,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    showConfirmation,
    setShowConfirmation,
  ] =
    useState(false);

  const [
    snackbar,
    setSnackbar,
  ] =
    useState("");

  const [
    submittedStatus,
    setSubmittedStatus,
  ] =
    useState(
      "PENDING_REVIEW",
    );

  const [
    estimatedProcessingDays,
    setEstimatedProcessingDays,
  ] =
    useState<number | null>(
      null,
    );

  /* =======================================================
     TITLES
  ======================================================= */

  const stepTitle =
    useMemo(() => {
      if (step === 1) {
        return "Basic information";
      }

      if (step === 2) {
        return "Verify your contact details";
      }

      return "Complete your registration";
    }, [step]);

  /* =======================================================
     UPDATE BASIC DETAILS
  ======================================================= */

  const updateBasicDetail = (
    field:
      keyof BasicDetails,

    value: string,
  ) => {
    setBasicDetails(
      (current) => ({
        ...current,

        [field]:
          value,
      }),
    );

    setErrors(
      (current) => ({
        ...current,

        [field]:
          "",
      }),
    );
  };

  /* =======================================================
     UPDATE ADDITIONAL DETAILS
  ======================================================= */

  const updateAdditionalDetail = (
    field:
      keyof AdditionalDetails,

    value: string,
  ) => {
    setAdditionalDetails(
      (current) => ({
        ...current,

        [field]:
          value,
      }),
    );

    setErrors(
      (current) => ({
        ...current,

        [field]:
          "",
      }),
    );
  };

  /* =======================================================
     VALIDATION STEP 1
  ======================================================= */

  const validateStepOne =
    () => {
      const nextErrors:
        Record<
          string,
          string
        > = {};

      if (
        !basicDetails.firstName.trim()
      ) {
        nextErrors.firstName =
          "Please enter your first name.";
      }

      if (
        !basicDetails.lastName.trim()
      ) {
        nextErrors.lastName =
          "Please enter your last name.";
      }

      if (
        basicDetails.accountType ===
          "business" &&
        !basicDetails.businessName.trim()
      ) {
        nextErrors.businessName =
          "Please enter the business name.";
      }

      if (
        basicDetails.accountType ===
          "business" &&
        !basicDetails.companyNumber.trim()
      ) {
        nextErrors.companyNumber =
          "Please enter the company number.";
      }

      if (
        !basicDetails.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          basicDetails.email.trim(),
        )
      ) {
        nextErrors.email =
          "Please enter a valid contact email.";
      }

      if (
        basicDetails.phone
          .trim()
          .length < 7
      ) {
        nextErrors.phone =
          "Please enter a valid phone number.";
      }

      setErrors(
        nextErrors,
      );

      return (
        Object.keys(
          nextErrors,
        ).length === 0
      );
    };

  /* =======================================================
     VALIDATION STEP 3
  ======================================================= */

  const validateStepThree =
    () => {
      const nextErrors:
        Record<
          string,
          string
        > = {};

      if (
        !additionalDetails.businessDetails.trim()
      ) {
        nextErrors.businessDetails =
          "Please provide your registration details.";
      }

      if (
        !additionalDetails.employeeCount.trim()
      ) {
        nextErrors.employeeCount =
          "Please enter the number of employees.";
      }

      if (
        !additionalDetails.employeeLoginCount.trim()
      ) {
        nextErrors.employeeLoginCount =
          "Please enter the number of employee logins required.";
      }

      if (
        !additionalDetails.propertyCount.trim()
      ) {
        nextErrors.propertyCount =
          "Please enter the number of properties managed.";
      }

      if (
        !additionalDetails.branchCount.trim()
      ) {
        nextErrors.branchCount =
          "Please enter the number of branches.";
      }

      if (
        !authorised
      ) {
        nextErrors.authorised =
          "Please confirm that you are authorised to register.";
      }

      if (
        !termsAccepted
      ) {
        nextErrors.terms =
          "Please agree to the terms and conditions.";
      }

      if (
        !privacyAccepted
      ) {
        nextErrors.privacy =
          "Please accept the privacy policy.";
      }

      setErrors(
        nextErrors,
      );

      return (
        Object.keys(
          nextErrors,
        ).length === 0
      );
    };

  /* =======================================================
     STEP 1
     START REGISTRATION
  ======================================================= */

  const handleContinueFromBasic =
    async () => {
      if (
        !validateStepOne()
      ) {
        return;
      }

      try {
        setLoading(
          true,
        );

        const payload = {
          registrationType:
            basicDetails.accountType ===
            "business"
              ? "BUSINESS"
              : "INDIVIDUAL",

          firstName:
            basicDetails.firstName.trim(),

          lastName:
            basicDetails.lastName.trim(),

          contactEmail:
            basicDetails.email
              .trim()
              .toLowerCase(),

          contactPhone:
            basicDetails.phone.trim(),

          ...(basicDetails.accountType ===
          "business"
            ? {
                businessName:
                  basicDetails.businessName.trim(),

                companyNumber:
                  basicDetails.companyNumber.trim(),
              }
            : {}),
        };

        const data =
          await apiRequest<StartRegistrationResponse>(
            "/agent-registration/start",

            {
              method:
                "POST",

              body:
                JSON.stringify(
                  payload,
                ),
            },
          );

        setUserId(
          data.userId,
        );

        setApplicationId(
          data.applicationId,
        );

        /*
        -------------------------------------------------------
        Save the registration so the application can be
        recovered from another onboarding page.
        -------------------------------------------------------
        */

        await saveAgentOnboardingSession(
          {
            userId:
              data.userId,

            applicationId:
              data.applicationId,

            email:
              basicDetails.email
                .trim()
                .toLowerCase(),
          },
        );

        if (
          data.developmentEmailVerificationToken
        ) {
          setEmailVerificationToken(
            data.developmentEmailVerificationToken,
          );
        }

        setStep(
          2,
        );

        setSnackbar(
          "Registration started. Enter the 6-digit OTP sent to your email.",
        );
      } catch (error) {
        setSnackbar(
          error instanceof
            Error
            ? error.message
            : "Unable to start registration.",
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  /* =======================================================
     VERIFY EMAIL
  ======================================================= */

  const handleVerifyEmail =
    async () => {
      if (
        !userId
      ) {
        setSnackbar(
          "Registration user ID is missing.",
        );

        return;
      }

      if (
        !emailVerificationToken.trim()
      ) {
        setSnackbar(
          "Enter the 6-digit email OTP.",
        );

        return;
      }

      try {
        setLoading(
          true,
        );

        await apiRequest<VerifyEmailResponse>(
          "/agent-registration/verify-email",

          {
            method:
              "POST",

            body:
              JSON.stringify(
                {
                  userId,

                  token:
                    emailVerificationToken.trim(),
                },
              ),
          },
        );

        setEmailVerified(
          true,
        );

        setSnackbar(
          "Email verified successfully.",
        );
      } catch (error) {
        setSnackbar(
          error instanceof
            Error
            ? error.message
            : "Email verification failed.",
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  /* =======================================================
     SEND PHONE OTP
  ======================================================= */

  const handleSendPhoneOtp =
    async () => {
      if (
        !userId
      ) {
        setSnackbar(
          "Registration user ID is missing.",
        );

        return;
      }

      if (
        !emailVerified
      ) {
        setSnackbar(
          "Verify your email first.",
        );

        return;
      }

      try {
        setLoading(
          true,
        );

        const data =
          await apiRequest<SendOtpResponse>(
            `/agent-registration/send-phone-otp/${userId}`,

            {
              method:
                "POST",
            },
          );

        if (
          data.developmentOtp
        ) {
          setDevelopmentOtp(
            data.developmentOtp,
          );
        }

        setSnackbar(
          "Phone verification code sent.",
        );
      } catch (error) {
        setSnackbar(
          error instanceof
            Error
            ? error.message
            : "Unable to send phone verification code.",
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  /* =======================================================
     VERIFY PHONE
  ======================================================= */

  const handleVerifyPhone =
    async () => {
      if (
        !userId
      ) {
        setSnackbar(
          "Registration user ID is missing.",
        );

        return;
      }

      if (
        !otp.trim()
      ) {
        setErrors(
          (current) => ({
            ...current,

            otp:
              "Enter your verification code.",
          }),
        );

        return;
      }

      try {
        setLoading(
          true,
        );

        const data =
          await apiRequest<VerifyPhoneResponse>(
            "/agent-registration/verify-phone",

            {
              method:
                "POST",

              body:
                JSON.stringify(
                  {
                    userId,

                    code:
                      otp.trim(),
                  },
                ),
            },
          );

        setApplicationId(
          data.applicationId,
        );

        setOnboardingToken(
          data.onboardingToken,
        );

        /*
        -------------------------------------------------------
        Save onboarding JWT.
        -------------------------------------------------------
        */

        await saveAgentOnboardingSession(
          {
            userId,

            applicationId:
              data.applicationId,

            onboardingToken:
              data.onboardingToken,

            email:
              basicDetails.email
                .trim()
                .toLowerCase(),
          },
        );

        setPhoneVerified(
          true,
        );

        setErrors(
          (current) => ({
            ...current,

            otp: "",
          }),
        );

        setSnackbar(
          "Phone verified successfully.",
        );
      } catch (error) {
        setSnackbar(
          error instanceof
            Error
            ? error.message
            : "Phone verification failed.",
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  /* =======================================================
     CONTINUE STEP 2
  ======================================================= */

  const handleContinueFromVerification =
    () => {
      if (
        !emailVerified
      ) {
        setSnackbar(
          "Please verify your email address.",
        );

        return;
      }

      if (
        !phoneVerified
      ) {
        setSnackbar(
          "Please verify your phone number.",
        );

        return;
      }

      if (
        !onboardingToken
      ) {
        setSnackbar(
          "The onboarding token was not received.",
        );

        return;
      }

      setStep(
        3,
      );
    };

  /* =======================================================
     STEP 3
     SAVE DETAILS + SUBMIT
  ======================================================= */

  const handleSubmitRegistration =
    async () => {
      if (
        !validateStepThree()
      ) {
        return;
      }

      if (
        !applicationId
      ) {
        setSnackbar(
          "Application ID is missing.",
        );

        return;
      }

      if (
        !onboardingToken
      ) {
        setSnackbar(
          "Your onboarding session is missing. Verify your phone again.",
        );

        return;
      }

      try {
        setLoading(
          true,
        );

        /*
        -------------------------------------------------------
        SAVE APPLICATION DETAILS
        -------------------------------------------------------
        */

        await apiRequest(
          `/agent-registration/${applicationId}/details`,

          {
            method:
              "PATCH",

            headers: {
              Authorization:
                `Bearer ${onboardingToken}`,
            },

            body:
              JSON.stringify(
                {
                  businessDetails:
                    additionalDetails.businessDetails.trim(),

                  employeeCount:
                    Number(
                      additionalDetails.employeeCount,
                    ),

                  requiredLoginCount:
                    Number(
                      additionalDetails.employeeLoginCount,
                    ),

                  propertyCount:
                    Number(
                      additionalDetails.propertyCount,
                    ),

                  branchCount:
                    Number(
                      additionalDetails.branchCount,
                    ),

                  authorisedDeclaration:
                    authorised,

                  termsAccepted,

                  privacyAccepted,
                },
              ),
          },
        );

        /*
        -------------------------------------------------------
        SUBMIT APPLICATION
        -------------------------------------------------------
        */

        const submission =
          await apiRequest<SubmitRegistrationResponse>(
            `/agent-registration/${applicationId}/submit`,

            {
              method:
                "POST",

              headers: {
                Authorization:
                  `Bearer ${onboardingToken}`,
              },
            },
          );

        /*
        -------------------------------------------------------
        Make sure latest IDs/token remain stored.
        -------------------------------------------------------
        */

        await saveAgentOnboardingSession(
          {
            applicationId:
              submission.applicationId ||
              applicationId,

            userId,

            onboardingToken,

            email:
              basicDetails.email
                .trim()
                .toLowerCase(),
          },
        );

        setSubmittedStatus(
          submission.status ||
            "PENDING_REVIEW",
        );

        setEstimatedProcessingDays(
          submission.estimatedProcessingDays ??
            null,
        );

        setShowConfirmation(
          true,
        );
      } catch (error) {
        setSnackbar(
          error instanceof
            Error
            ? error.message
            : "Registration submission failed.",
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  /* =======================================================
     OPEN APPLICATION STATUS
  ======================================================= */

  const handleOpenApplicationStatus =
    () => {
      setShowConfirmation(
        false,
      );

      router.replace(
        AGENT_APPLICATION_STATUS_ROUTE,
      );
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <KeyboardAvoidingView
      style={
        styles.root
      }
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : undefined
      }
    >
      <LinearGradient
        colors={[
          "#EAF3F6",
          "#F7F9FA",
          "#FFFFFF",
        ]}
        style={
          StyleSheet.absoluteFill
        }
      />

      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <Animated.View
            entering={
              FadeInUp.duration(
                500,
              )
            }
            style={[
              styles.card,

              isMobile &&
                styles.mobileCard,
            ]}
          >
            {/* HEADER */}

            <View
              style={
                styles.headerRow
              }
            >
              <TenureExLogo />

              <Button
                mode="text"
                icon="arrow-left"
                onPress={() => {
                  if (
                    step ===
                    1
                  ) {
                    router.replace(
                      AGENT_LOGIN_ROUTE,
                    );
                  } else {
                    setStep(
                      (
                        current,
                      ) =>
                        (current -
                          1) as RegistrationStep,
                    );
                  }
                }}
                textColor={
                  colors.primary
                }
              >
                {step === 1
                  ? "Sign in"
                  : "Back"}
              </Button>
            </View>

            {/* BADGE */}

            <View
              style={
                styles.portalBadge
              }
            >
              <MaterialCommunityIcons
                name="office-building-plus-outline"
                size={18}
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.portalBadgeText
                }
              >
                ESTATE AGENT
                REGISTRATION
              </Text>
            </View>

            <Text
              style={
                styles.title
              }
            >
              {stepTitle}
            </Text>

            <Text
              style={
                styles.description
              }
            >
              {step === 1
                ? "Enter your details to begin your TenureEx estate agent registration."
                : step === 2
                  ? "Verify your email address and phone number before continuing."
                  : "Complete the remaining information and submit your application for TenureEx review."}
            </Text>

            {/* PROGRESS */}

            <View
              style={
                styles.progressRow
              }
            >
              {[
                1,
                2,
                3,
              ].map(
                (
                  item,
                ) => (
                  <View
                    key={
                      item
                    }
                    style={
                      styles.progressItem
                    }
                  >
                    <View
                      style={[
                        styles.progressCircle,

                        item <=
                          step &&
                          styles.progressCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.progressNumber,

                          item <=
                            step &&
                            styles.progressNumberActive,
                        ]}
                      >
                        {
                          item
                        }
                      </Text>
                    </View>

                    {item <
                      3 && (
                      <View
                        style={[
                          styles.progressLine,

                          item <
                            step &&
                            styles.progressLineActive,
                        ]}
                      />
                    )}
                  </View>
                ),
              )}
            </View>

            {/* =================================================
                STEP 1
            ================================================= */}

            {step ===
              1 && (
              <View
                style={
                  styles.form
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Select
                  registration
                  type
                </Text>

                <View
                  style={[
                    styles.accountTypeRow,

                    !isDesktop &&
                      styles.accountTypeColumn,
                  ]}
                >
                  <AccountTypeCard
                    selected={
                      basicDetails.accountType ===
                      "business"
                    }
                    icon="office-building-outline"
                    title="Business"
                    description="Register an estate agency business."
                    onPress={() =>
                      updateBasicDetail(
                        "accountType",
                        "business",
                      )
                    }
                  />

                  <AccountTypeCard
                    selected={
                      basicDetails.accountType ===
                      "individual"
                    }
                    icon="account-outline"
                    title="Individual"
                    description="Register as an individual estate agent."
                    onPress={() =>
                      updateBasicDetail(
                        "accountType",
                        "individual",
                      )
                    }
                  />
                </View>

                {/* NAME */}

                <View
                  style={[
                    styles.twoColumnRow,

                    isMobile &&
                      styles.oneColumnRow,
                  ]}
                >
                  <View
                    style={
                      styles.numberField
                    }
                  >
                    <FieldLabel
                      text="First name"
                    />

                    <TextInput
                      value={
                        basicDetails.firstName
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateBasicDetail(
                          "firstName",
                          value,
                        )
                      }
                      mode="outlined"
                      placeholder="James"
                      error={Boolean(
                        errors.firstName,
                      )}
                      left={
                        <TextInput.Icon
                          icon="account-outline"
                        />
                      }
                      outlineColor={
                        colors.border
                      }
                      activeOutlineColor={
                        colors.primary
                      }
                      style={
                        styles.input
                      }
                    />

                    <ErrorText
                      message={
                        errors.firstName
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.numberField
                    }
                  >
                    <FieldLabel
                      text="Last name"
                    />

                    <TextInput
                      value={
                        basicDetails.lastName
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateBasicDetail(
                          "lastName",
                          value,
                        )
                      }
                      mode="outlined"
                      placeholder="Wilson"
                      error={Boolean(
                        errors.lastName,
                      )}
                      left={
                        <TextInput.Icon
                          icon="account-outline"
                        />
                      }
                      outlineColor={
                        colors.border
                      }
                      activeOutlineColor={
                        colors.primary
                      }
                      style={
                        styles.input
                      }
                    />

                    <ErrorText
                      message={
                        errors.lastName
                      }
                    />
                  </View>
                </View>

                {/* BUSINESS */}

                {basicDetails.accountType ===
                  "business" && (
                  <>
                    <FieldLabel
                      text="Business name"
                    />

                    <TextInput
                      value={
                        basicDetails.businessName
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateBasicDetail(
                          "businessName",
                          value,
                        )
                      }
                      mode="outlined"
                      placeholder="Wilson Property Management Ltd"
                      error={Boolean(
                        errors.businessName,
                      )}
                      left={
                        <TextInput.Icon
                          icon="office-building-outline"
                        />
                      }
                      outlineColor={
                        colors.border
                      }
                      activeOutlineColor={
                        colors.primary
                      }
                      style={
                        styles.input
                      }
                    />

                    <ErrorText
                      message={
                        errors.businessName
                      }
                    />

                    <FieldLabel
                      text="Company number"
                    />

                    <TextInput
                      value={
                        basicDetails.companyNumber
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updateBasicDetail(
                          "companyNumber",
                          value,
                        )
                      }
                      mode="outlined"
                      placeholder="87654321"
                      error={Boolean(
                        errors.companyNumber,
                      )}
                      left={
                        <TextInput.Icon
                          icon="identifier"
                        />
                      }
                      outlineColor={
                        colors.border
                      }
                      activeOutlineColor={
                        colors.primary
                      }
                      style={
                        styles.input
                      }
                    />

                    <ErrorText
                      message={
                        errors.companyNumber
                      }
                    />
                  </>
                )}

                {/* EMAIL */}

                <FieldLabel
                  text="Contact email"
                />

                <TextInput
                  value={
                    basicDetails.email
                  }
                  onChangeText={(
                    value,
                  ) =>
                    updateBasicDetail(
                      "email",
                      value,
                    )
                  }
                  mode="outlined"
                  placeholder="name@agency.co.uk"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  error={Boolean(
                    errors.email,
                  )}
                  left={
                    <TextInput.Icon
                      icon="email-outline"
                    />
                  }
                  outlineColor={
                    colors.border
                  }
                  activeOutlineColor={
                    colors.primary
                  }
                  style={
                    styles.input
                  }
                />

                <ErrorText
                  message={
                    errors.email
                  }
                />

                {/* PHONE */}

                <FieldLabel
                  text="Phone number"
                />

                <TextInput
                  value={
                    basicDetails.phone
                  }
                  onChangeText={(
                    value,
                  ) =>
                    updateBasicDetail(
                      "phone",
                      value,
                    )
                  }
                  mode="outlined"
                  placeholder="+44 7911 123456"
                  keyboardType="phone-pad"
                  error={Boolean(
                    errors.phone,
                  )}
                  left={
                    <TextInput.Icon
                      icon="phone-outline"
                    />
                  }
                  outlineColor={
                    colors.border
                  }
                  activeOutlineColor={
                    colors.primary
                  }
                  style={
                    styles.input
                  }
                />

                <ErrorText
                  message={
                    errors.phone
                  }
                />

                <Button
                  mode="contained"
                  icon="arrow-right"
                  onPress={
                    handleContinueFromBasic
                  }
                  loading={
                    loading
                  }
                  disabled={
                    loading
                  }
                  buttonColor={
                    colors.primary
                  }
                  style={
                    styles.primaryButton
                  }
                  contentStyle={
                    styles.primaryButtonContent
                  }
                >
                  Continue to
                  verification
                </Button>
              </View>
            )}

            {/* =================================================
                STEP 2
            ================================================= */}

            {step ===
              2 && (
              <View
                style={
                  styles.form
                }
              >
                <View
                  style={
                    styles.verificationCard
                  }
                >
                  <View
                    style={
                      styles.verificationHeader
                    }
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={24}
                      color={
                        colors.primary
                      }
                    />

                    <View
                      style={
                        styles.verificationText
                      }
                    >
                      <Text
                        style={
                          styles.verificationTitle
                        }
                      >
                        Email
                        verification
                      </Text>

                      <Text
                        style={
                          styles.verificationDescription
                        }
                      >
                        Enter the 6-digit OTP sent to{" "}
                        {
                          basicDetails.email
                        }
                        .
                      </Text>
                    </View>
                  </View>

                  {!emailVerified && (
                    <>
                      <TextInput
                        value={
                          emailVerificationToken
                        }
                        onChangeText={
                          setEmailVerificationToken
                        }
                        mode="outlined"
                        label="Email OTP"
                        placeholder="Enter 6-digit email OTP"
                        keyboardType="number-pad"
                        maxLength={6}
                        outlineColor={
                          colors.border
                        }
                        activeOutlineColor={
                          colors.primary
                        }
                        style={
                          styles.input
                        }
                      />

                      {emailVerificationToken ? (
                        <View
                          style={
                            styles.demoNotice
                          }
                        >
                          <MaterialCommunityIcons
                            name="information-outline"
                            size={
                              20
                            }
                            color={
                              colors.primary
                            }
                          />

                          <Text
                            style={
                              styles.demoNoticeText
                            }
                          >
                            Development
                            mode: the
                            email OTP
                            returned by
                            the backend
                            has been
                            inserted
                            automatically.
                          </Text>
                        </View>
                      ) : null}
                    </>
                  )}

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
                      loading
                    }
                    loading={
                      loading &&
                      !emailVerified
                    }
                    onPress={
                      handleVerifyEmail
                    }
                    buttonColor={
                      colors.primary
                    }
                    textColor={
                      emailVerified
                        ? colors.success
                        : colors.white
                    }
                  >
                    {emailVerified
                      ? "Email verified"
                      : "Verify email"}
                  </Button>
                </View>

                <View
                  style={
                    styles.verificationCard
                  }
                >
                  <View
                    style={
                      styles.verificationHeader
                    }
                  >
                    <MaterialCommunityIcons
                      name="cellphone-check"
                      size={24}
                      color={
                        colors.primary
                      }
                    />

                    <View
                      style={
                        styles.verificationText
                      }
                    >
                      <Text
                        style={
                          styles.verificationTitle
                        }
                      >
                        Phone
                        verification
                      </Text>

                      <Text
                        style={
                          styles.verificationDescription
                        }
                      >
                        Send and enter
                        the OTP for{" "}
                        {
                          basicDetails.phone
                        }
                        .
                      </Text>
                    </View>
                  </View>

                  {!phoneVerified && (
                    <Button
                      mode="outlined"
                      icon="message-text-outline"
                      onPress={
                        handleSendPhoneOtp
                      }
                      disabled={
                        !emailVerified ||
                        loading
                      }
                      textColor={
                        colors.primary
                      }
                    >
                      Send phone OTP
                    </Button>
                  )}

                  {developmentOtp &&
                    !phoneVerified && (
                      <View
                        style={
                          styles.demoNotice
                        }
                      >
                        <MaterialCommunityIcons
                          name="information-outline"
                          size={
                            20
                          }
                          color={
                            colors.primary
                          }
                        />

                        <Text
                          style={
                            styles.demoNoticeText
                          }
                        >
                          Development
                          OTP:{" "}
                          {
                            developmentOtp
                          }
                        </Text>
                      </View>
                    )}

                  <TextInput
                    value={
                      otp
                    }
                    onChangeText={(
                      value,
                    ) => {
                      setOtp(
                        value,
                      );

                      setErrors(
                        (
                          current,
                        ) => ({
                          ...current,

                          otp:
                            "",
                        }),
                      );
                    }}
                    mode="outlined"
                    label="OTP code"
                    placeholder="Enter 6-digit OTP"
                    keyboardType="number-pad"
                    maxLength={
                      6
                    }
                    disabled={
                      phoneVerified
                    }
                    error={Boolean(
                      errors.otp,
                    )}
                    left={
                      <TextInput.Icon
                        icon="shield-key-outline"
                      />
                    }
                    outlineColor={
                      colors.border
                    }
                    activeOutlineColor={
                      colors.primary
                    }
                    style={
                      styles.input
                    }
                  />

                  <ErrorText
                    message={
                      errors.otp
                    }
                  />

                  <Button
                    mode={
                      phoneVerified
                        ? "outlined"
                        : "contained"
                    }
                    icon={
                      phoneVerified
                        ? "check-circle-outline"
                        : "cellphone-check"
                    }
                    disabled={
                      phoneVerified ||
                      !emailVerified ||
                      loading
                    }
                    onPress={
                      handleVerifyPhone
                    }
                    buttonColor={
                      colors.primary
                    }
                    textColor={
                      phoneVerified
                        ? colors.success
                        : colors.white
                    }
                    style={
                      styles.verifyButton
                    }
                  >
                    {phoneVerified
                      ? "Phone verified"
                      : "Verify phone"}
                  </Button>
                </View>

                <Button
                  mode="contained"
                  icon="arrow-right"
                  onPress={
                    handleContinueFromVerification
                  }
                  disabled={
                    !emailVerified ||
                    !phoneVerified
                  }
                  buttonColor={
                    colors.primary
                  }
                  style={
                    styles.primaryButton
                  }
                  contentStyle={
                    styles.primaryButtonContent
                  }
                >
                  Open registration
                  form
                </Button>
              </View>
            )}

            {/* =================================================
                STEP 3
            ================================================= */}

            {step ===
              3 && (
              <View
                style={
                  styles.form
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Verified
                  information
                </Text>

                <Text
                  style={
                    styles.readOnlyNotice
                  }
                >
                  Your verified
                  information is
                  shown below.
                </Text>

                <View
                  style={
                    styles.readOnlyCard
                  }
                >
                  <ReadOnlyItem
                    label="Registration type"
                    value={
                      basicDetails.accountType ===
                      "business"
                        ? "Business"
                        : "Individual"
                    }
                  />

                  <ReadOnlyItem
                    label="Applicant"
                    value={`${basicDetails.firstName} ${basicDetails.lastName}`}
                  />

                  {basicDetails.accountType ===
                    "business" && (
                    <>
                      <ReadOnlyItem
                        label="Business name"
                        value={
                          basicDetails.businessName
                        }
                      />

                      <ReadOnlyItem
                        label="Company number"
                        value={
                          basicDetails.companyNumber
                        }
                      />
                    </>
                  )}

                  <ReadOnlyItem
                    label="Contact email"
                    value={
                      basicDetails.email
                    }
                  />

                  <ReadOnlyItem
                    label="Phone number"
                    value={
                      basicDetails.phone
                    }
                  />
                </View>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Additional
                  information
                </Text>

                <FieldLabel
                  text={
                    basicDetails.accountType ===
                    "business"
                      ? "Business details"
                      : "Individual agent details"
                  }
                />

                <TextInput
                  value={
                    additionalDetails.businessDetails
                  }
                  onChangeText={(
                    value,
                  ) =>
                    updateAdditionalDetail(
                      "businessDetails",
                      value,
                    )
                  }
                  mode="outlined"
                  placeholder="Provide your estate agency details"
                  multiline
                  numberOfLines={
                    4
                  }
                  error={Boolean(
                    errors.businessDetails,
                  )}
                  outlineColor={
                    colors.border
                  }
                  activeOutlineColor={
                    colors.primary
                  }
                  style={[
                    styles.input,

                    styles.multilineInput,
                  ]}
                />

                <ErrorText
                  message={
                    errors.businessDetails
                  }
                />

                <View
                  style={[
                    styles.twoColumnRow,

                    isMobile &&
                      styles.oneColumnRow,
                  ]}
                >
                  <NumberField
                    label="Number of employees"
                    value={
                      additionalDetails.employeeCount
                    }
                    error={
                      errors.employeeCount
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateAdditionalDetail(
                        "employeeCount",
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Employee logins required"
                    value={
                      additionalDetails.employeeLoginCount
                    }
                    error={
                      errors.employeeLoginCount
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateAdditionalDetail(
                        "employeeLoginCount",
                        value,
                      )
                    }
                  />
                </View>

                <View
                  style={[
                    styles.twoColumnRow,

                    isMobile &&
                      styles.oneColumnRow,
                  ]}
                >
                  <NumberField
                    label="Properties managed"
                    value={
                      additionalDetails.propertyCount
                    }
                    error={
                      errors.propertyCount
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateAdditionalDetail(
                        "propertyCount",
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Number of branches"
                    value={
                      additionalDetails.branchCount
                    }
                    error={
                      errors.branchCount
                    }
                    onChangeText={(
                      value,
                    ) =>
                      updateAdditionalDetail(
                        "branchCount",
                        value,
                      )
                    }
                  />
                </View>

                {/* AUTHORISED */}

                <Pressable
                  style={
                    styles.checkboxRow
                  }
                  onPress={() =>
                    setAuthorised(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                >
                  <Checkbox
                    status={
                      authorised
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() =>
                      setAuthorised(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    color={
                      colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.checkboxText
                    }
                  >
                    I confirm that I
                    am authorised to
                    register this
                    estate agency or
                    individual
                    account.
                  </Text>
                </Pressable>

                <ErrorText
                  message={
                    errors.authorised
                  }
                />

                {/* TERMS */}

                <Pressable
                  style={
                    styles.checkboxRow
                  }
                  onPress={() =>
                    setTermsAccepted(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                >
                  <Checkbox
                    status={
                      termsAccepted
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() =>
                      setTermsAccepted(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    color={
                      colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.checkboxText
                    }
                  >
                    I agree to the
                    TenureEx terms
                    and conditions.
                  </Text>
                </Pressable>

                <ErrorText
                  message={
                    errors.terms
                  }
                />

                {/* PRIVACY */}

                <Pressable
                  style={
                    styles.checkboxRow
                  }
                  onPress={() =>
                    setPrivacyAccepted(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                >
                  <Checkbox
                    status={
                      privacyAccepted
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() =>
                      setPrivacyAccepted(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    color={
                      colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.checkboxText
                    }
                  >
                    I agree to the
                    TenureEx privacy
                    policy and
                    consent to my
                    information
                    being processed.
                  </Text>
                </Pressable>

                <ErrorText
                  message={
                    errors.privacy
                  }
                />

                <Button
                  mode="contained"
                  icon="send-check-outline"
                  onPress={
                    handleSubmitRegistration
                  }
                  loading={
                    loading
                  }
                  disabled={
                    loading
                  }
                  buttonColor={
                    colors.primary
                  }
                  style={
                    styles.primaryButton
                  }
                  contentStyle={
                    styles.primaryButtonContent
                  }
                >
                  Submit
                  registration
                </Button>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* ===================================================
          SUCCESS DIALOG
      =================================================== */}

      <Portal>
        <Dialog
          visible={
            showConfirmation
          }
          onDismiss={() => {}}
          style={
            styles.dialog
          }
        >
          <Dialog.Icon
            icon="check-circle-outline"
          />

          <Dialog.Title
            style={
              styles.dialogTitle
            }
          >
            Registration
            received
          </Dialog.Title>

          <Dialog.Content>
            <Text
              style={
                styles.dialogText
              }
            >
              Your Estate Agent
              application has been
              submitted
              successfully and is
              awaiting TenureEx
              review.
            </Text>

            <View
              style={
                styles.processingCard
              }
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={22}
                color={
                  colors.primary
                }
              />

              <View
                style={
                  styles.processingText
                }
              >
                <Text
                  style={
                    styles.processingTitle
                  }
                >
                  Application
                  status
                </Text>

                <Text
                  style={
                    styles.processingDescription
                  }
                >
                  {submittedStatus ===
                  "PENDING_REVIEW"
                    ? "Pending review. The TenureEx team will now review your application."
                    : `Current status: ${submittedStatus}.`}
                </Text>

                {estimatedProcessingDays !==
                  null && (
                  <Text
                    style={
                      styles.processingDescription
                    }
                  >
                    Estimated
                    processing:{" "}
                    {
                      estimatedProcessingDays
                    }{" "}
                    business days.
                  </Text>
                )}
              </View>
            </View>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              mode="contained"
              icon="arrow-right"
              onPress={
                handleOpenApplicationStatus
              }
              buttonColor={
                colors.primary
              }
            >
              View application
              status
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* SNACKBAR */}

      <Snackbar
        visible={Boolean(
          snackbar,
        )}
        onDismiss={() =>
          setSnackbar("")
        }
        duration={
          4000
        }
      >
        {snackbar}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   ACCOUNT TYPE
========================================================= */

function AccountTypeCard({
  selected,
  icon,
  title,
  description,
  onPress,
}: {
  selected: boolean;

  icon:
    keyof typeof MaterialCommunityIcons.glyphMap;

  title: string;

  description: string;

  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={[
        styles.accountTypeCard,

        selected &&
          styles.accountTypeCardSelected,
      ]}
    >
      <RadioButton
        value={
          title
        }
        status={
          selected
            ? "checked"
            : "unchecked"
        }
        onPress={
          onPress
        }
        color={
          colors.primary
        }
      />

      <View
        style={
          styles.accountTypeIcon
        }
      >
        <MaterialCommunityIcons
          name={
            icon
          }
          size={
            24
          }
          color={
            colors.primary
          }
        />
      </View>

      <View
        style={
          styles.accountTypeText
        }
      >
        <Text
          style={
            styles.accountTypeTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.accountTypeDescription
          }
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

/* =========================================================
   FIELD LABEL
========================================================= */

function FieldLabel({
  text,
}: {
  text: string;
}) {
  return (
    <Text
      style={
        styles.fieldLabel
      }
    >
      {text}
    </Text>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorText({
  message,
}: {
  message?: string;
}) {
  return message ? (
    <Text
      style={
        styles.errorText
      }
    >
      {message}
    </Text>
  ) : null;
}

/* =========================================================
   READ ONLY
========================================================= */

function ReadOnlyItem({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <View
      style={
        styles.readOnlyItem
      }
    >
      <Text
        style={
          styles.readOnlyLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.readOnlyValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   NUMBER FIELD
========================================================= */

function NumberField({
  label,
  value,
  error,
  onChangeText,
}: {
  label: string;

  value: string;

  error?: string;

  onChangeText:
    (
      value: string,
    ) => void;
}) {
  return (
    <View
      style={
        styles.numberField
      }
    >
      <FieldLabel
        text={
          label
        }
      />

      <TextInput
        value={
          value
        }
        onChangeText={
          onChangeText
        }
        mode="outlined"
        keyboardType="number-pad"
        placeholder="0"
        error={Boolean(
          error,
        )}
        outlineColor={
          colors.border
        }
        activeOutlineColor={
          colors.primary
        }
        style={
          styles.input
        }
      />

      <ErrorText
        message={
          error
        }
      />
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    root: {
      flex: 1,

      backgroundColor:
        colors.background,
    },

    safeArea: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,

      alignItems:
        "center",

      padding:
        spacing.lg,

      paddingVertical:
        spacing.xxl,
    },

    card: {
      width:
        "100%",

      maxWidth:
        900,

      padding:
        42,

      backgroundColor:
        colors.white,

      borderRadius:
        26,

      borderWidth:
        1,

      borderColor:
        colors.border,

      shadowColor:
        "#102B3A",

      shadowOpacity:
        0.1,

      shadowRadius:
        28,

      shadowOffset: {
        width: 0,

        height: 12,
      },

      elevation:
        6,
    },

    mobileCard: {
      padding:
        spacing.xl,
    },

    headerRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        spacing.md,
    },

    portalBadge: {
      alignSelf:
        "flex-start",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        spacing.sm,

      marginTop:
        spacing.xxxl,

      paddingHorizontal:
        spacing.md,

      paddingVertical:
        spacing.sm,

      borderRadius:
        999,

      backgroundColor:
        colors.primaryLight,
    },

    portalBadgeText: {
      color:
        colors.primary,

      fontSize:
        9,

      fontWeight:
        "900",

      letterSpacing:
        1.4,
    },

    title: {
      ...typography.headingLarge,

      marginTop:
        spacing.lg,

      color:
        colors.textPrimary,
    },

    description: {
      ...typography.bodyMedium,

      maxWidth:
        680,

      marginTop:
        spacing.sm,

      color:
        colors.textSecondary,
    },

    progressRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      marginTop:
        spacing.xxl,
    },

    progressItem: {
      flex: 1,

      flexDirection:
        "row",

      alignItems:
        "center",
    },

    progressCircle: {
      width:
        34,

      height:
        34,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius:
        17,

      borderWidth:
        1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.white,
    },

    progressCircleActive: {
      borderColor:
        colors.primary,

      backgroundColor:
        colors.primary,
    },

    progressNumber: {
      color:
        colors.textMuted,

      fontWeight:
        "800",
    },

    progressNumberActive: {
      color:
        colors.white,
    },

    progressLine: {
      flex:
        1,

      height:
        2,

      marginHorizontal:
        spacing.sm,

      backgroundColor:
        colors.border,
    },

    progressLineActive: {
      backgroundColor:
        colors.primary,
    },

    form: {
      marginTop:
        spacing.xxl,
    },

    sectionTitle: {
      marginBottom:
        spacing.md,

      color:
        colors.textPrimary,

      fontSize:
        16,

      fontWeight:
        "900",
    },

    accountTypeRow: {
      flexDirection:
        "row",

      gap:
        spacing.md,

      marginBottom:
        spacing.xl,
    },

    accountTypeColumn: {
      flexDirection:
        "column",
    },

    accountTypeCard: {
      flex:
        1,

      minHeight:
        105,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        spacing.sm,

      padding:
        spacing.md,

      borderWidth:
        1,

      borderColor:
        colors.border,

      borderRadius:
        radius.lg,

      backgroundColor:
        colors.white,
    },

    accountTypeCardSelected: {
      borderColor:
        colors.primary,

      backgroundColor:
        colors.primaryLight,
    },

    accountTypeIcon: {
      width:
        45,

      height:
        45,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius:
        14,

      backgroundColor:
        colors.white,
    },

    accountTypeText: {
      flex:
        1,
    },

    accountTypeTitle: {
      color:
        colors.textPrimary,

      fontSize:
        14,

      fontWeight:
        "900",
    },

    accountTypeDescription: {
      marginTop:
        3,

      color:
        colors.textSecondary,

      fontSize:
        11,

      lineHeight:
        16,
    },

    fieldLabel: {
      ...typography.label,

      marginTop:
        spacing.md,

      marginBottom:
        spacing.sm,

      color:
        colors.textPrimary,
    },

    input: {
      backgroundColor:
        colors.white,
    },

    multilineInput: {
      minHeight:
        115,
    },

    errorText: {
      marginTop:
        5,

      color:
        colors.error,

      fontSize:
        11,
    },

    primaryButton: {
      marginTop:
        spacing.xl,

      borderRadius:
        radius.md,
    },

    primaryButtonContent: {
      minHeight:
        54,

      flexDirection:
        "row-reverse",
    },

    verificationCard: {
      gap:
        spacing.md,

      marginBottom:
        spacing.lg,

      padding:
        spacing.lg,

      borderWidth:
        1,

      borderColor:
        colors.border,

      borderRadius:
        radius.lg,

      backgroundColor:
        colors.white,
    },

    verificationHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        spacing.md,
    },

    verificationText: {
      flex:
        1,
    },

    verificationTitle: {
      color:
        colors.textPrimary,

      fontSize:
        14,

      fontWeight:
        "900",
    },

    verificationDescription: {
      marginTop:
        4,

      color:
        colors.textSecondary,

      fontSize:
        12,

      lineHeight:
        18,
    },

    verifyButton: {
      marginTop:
        spacing.sm,
    },

    demoNotice: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        spacing.sm,

      padding:
        spacing.md,

      borderRadius:
        radius.md,

      backgroundColor:
        colors.primaryLight,
    },

    demoNoticeText: {
      flex:
        1,

      color:
        colors.textSecondary,

      fontSize:
        11,

      lineHeight:
        17,
    },

    readOnlyNotice: {
      marginTop:
        -spacing.sm,

      marginBottom:
        spacing.md,

      color:
        colors.textMuted,

      fontSize:
        11,
    },

    readOnlyCard: {
      marginBottom:
        spacing.xxl,

      overflow:
        "hidden",

      borderWidth:
        1,

      borderColor:
        colors.border,

      borderRadius:
        radius.lg,

      backgroundColor:
        "#F7F9FA",
    },

    readOnlyItem: {
      padding:
        spacing.md,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.border,
    },

    readOnlyLabel: {
      color:
        colors.textMuted,

      fontSize:
        10,

      fontWeight:
        "700",
    },

    readOnlyValue: {
      marginTop:
        4,

      color:
        colors.textPrimary,

      fontSize:
        13,

      fontWeight:
        "800",
    },

    twoColumnRow: {
      flexDirection:
        "row",

      gap:
        spacing.md,
    },

    oneColumnRow: {
      flexDirection:
        "column",
    },

    numberField: {
      flex:
        1,
    },

    checkboxRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginTop:
        spacing.md,

      marginLeft:
        -8,
    },

    checkboxText: {
      flex:
        1,

      paddingTop:
        8,

      color:
        colors.textSecondary,

      fontSize:
        12,

      lineHeight:
        18,
    },

    dialog: {
      width:
        "92%",

      maxWidth:
        520,

      alignSelf:
        "center",

      backgroundColor:
        colors.white,
    },

    dialogTitle: {
      textAlign:
        "center",

      color:
        colors.textPrimary,
    },

    dialogText: {
      color:
        colors.textSecondary,

      fontSize:
        13,

      lineHeight:
        20,

      textAlign:
        "center",
    },

    processingCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        spacing.md,

      marginTop:
        spacing.xl,

      padding:
        spacing.md,

      borderRadius:
        radius.md,

      backgroundColor:
        colors.primaryLight,
    },

    processingText: {
      flex:
        1,
    },

    processingTitle: {
      color:
        colors.textPrimary,

      fontSize:
        12,

      fontWeight:
        "900",
    },

    processingDescription: {
      marginTop:
        3,

      color:
        colors.textSecondary,

      fontSize:
        11,

      lineHeight:
        17,
    },
  });