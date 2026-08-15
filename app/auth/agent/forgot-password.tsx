import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  Button,
  TextInput,
} from "react-native-paper";

import Animated, {
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";

import { api } from "../../../src/api/client";

import TenureExLogo from "../../../src/components/Logo/TenureExLogo";

import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

const AGENT_LOGIN_ROUTE =
  "/auth/agent/login" as Href;

/* =========================================================
   TYPES
========================================================= */

type ForgotPasswordResponse = {
  message: string;

  developmentResetToken?: string;

  resetToken?: string;

  token?: string;
};

type ResetPasswordResponse = {
  message: string;
};

/* =========================================================
   SCREEN
========================================================= */

export default function AgentForgotPasswordRoute() {
  const { width } = useWindowDimensions();

  const isMobile = width < 600;

  /*
  |--------------------------------------------------------------------------
  | Steps
  |--------------------------------------------------------------------------
  |
  | request = user enters email
  | reset   = user enters token + new password
  | success = password successfully changed
  |
  */

  const [
    stage,
    setStage,
  ] = useState<
    "request" | "reset" | "success"
  >("request");

  /*
  |--------------------------------------------------------------------------
  | Form
  |--------------------------------------------------------------------------
  */

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    resetToken,
    setResetToken,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Password visibility
  |--------------------------------------------------------------------------
  */

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Errors
  |--------------------------------------------------------------------------
  */

  const [
    emailError,
    setEmailError,
  ] = useState("");

  const [
    tokenError,
    setTokenError,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    confirmPasswordError,
    setConfirmPasswordError,
  ] = useState("");

  const [
    apiError,
    setApiError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | UI state
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    developmentToken,
    setDevelopmentToken,
  ] = useState("");

  /* =========================================================
     ERROR HANDLER
  ========================================================= */

  const getApiErrorMessage = (
    error: unknown,
    fallback: string,
  ): string => {
    if (
      axios.isAxiosError(error)
    ) {
      const backendMessage =
        error.response?.data?.message;

      if (
        Array.isArray(
          backendMessage,
        )
      ) {
        return backendMessage.join(
          "\n",
        );
      }

      if (
        typeof backendMessage ===
        "string"
      ) {
        return backendMessage;
      }

      if (!error.response) {
        return Platform.OS ===
          "web"
          ? "Unable to connect to the TenureEx server. Make sure the backend is running on port 3000."
          : "Unable to connect to the TenureEx server.";
      }
    }

    return fallback;
  };

  /* =========================================================
     REQUEST PASSWORD RESET
  ========================================================= */

  const handleSubmit =
    async (): Promise<void> => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      setEmailError("");
      setApiError("");

      if (
        !cleanEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail,
        )
      ) {
        setEmailError(
          "Please enter a valid work email.",
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await api.post<ForgotPasswordResponse>(
            "/auth/forgot-password",
            {
              email: cleanEmail,
            },
          );

        /*
        ----------------------------------------------------------
        Development support
        ----------------------------------------------------------

        Your backend may return the token using one of these
        names depending on the AuthService implementation.
        */

        const returnedToken =
          response.data
            .developmentResetToken ??
          response.data
            .resetToken ??
          response.data.token ??
          "";

        if (returnedToken) {
          setDevelopmentToken(
            returnedToken,
          );

          setResetToken(
            returnedToken,
          );
        }

        setStage("reset");
      } catch (error) {
        setApiError(
          getApiErrorMessage(
            error,
            "Unable to start password reset.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  const handleResetPassword =
    async (): Promise<void> => {
      setTokenError("");
      setPasswordError("");
      setConfirmPasswordError("");
      setApiError("");

      let valid = true;

      if (!resetToken.trim()) {
        setTokenError(
          "Please enter your password reset token.",
        );

        valid = false;
      }

      if (
        newPassword.length < 8
      ) {
        setPasswordError(
          "Password must contain at least 8 characters.",
        );

        valid = false;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setConfirmPasswordError(
          "Passwords do not match.",
        );

        valid = false;
      }

      if (!valid) {
        return;
      }

      try {
        setLoading(true);

        await api.post<ResetPasswordResponse>(
          "/auth/reset-password",
          {
            token:
              resetToken.trim(),

            newPassword,
          },
        );

        setStage("success");

        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        setApiError(
          getApiErrorMessage(
            error,
            "Unable to reset your password.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     RESEND RESET TOKEN
  ========================================================= */

  const handleResend =
    async (): Promise<void> => {
      setApiError("");

      try {
        setLoading(true);

        const response =
          await api.post<ForgotPasswordResponse>(
            "/auth/forgot-password",
            {
              email:
                email
                  .trim()
                  .toLowerCase(),
            },
          );

        const returnedToken =
          response.data
            .developmentResetToken ??
          response.data
            .resetToken ??
          response.data.token ??
          "";

        if (returnedToken) {
          setDevelopmentToken(
            returnedToken,
          );

          setResetToken(
            returnedToken,
          );
        }
      } catch (error) {
        setApiError(
          getApiErrorMessage(
            error,
            "Unable to resend password reset instructions.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={
        Platform.OS === "ios"
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

      <View
        style={
          styles.backgroundCircleOne
        }
      />

      <View
        style={
          styles.backgroundCircleTwo
        }
      />

      <SafeAreaView
        style={styles.safeArea}
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
            entering={FadeInUp.duration(
              500,
            )}
            style={[
              styles.card,

              isMobile &&
                styles.mobileCard,
            ]}
          >
            <TenureExLogo />

            {/* =================================================
                ICON
            ================================================= */}

            <View
              style={
                styles.iconContainer
              }
            >
              <MaterialCommunityIcons
                name={
                  stage ===
                  "success"
                    ? "lock-check-outline"
                    : stage ===
                        "reset"
                      ? "form-textbox-password"
                      : "lock-reset"
                }
                size={34}
                color={
                  colors.primary
                }
              />
            </View>

            {/* =================================================
                REQUEST RESET
            ================================================= */}

            {stage ===
            "request" ? (
              <>
                <Text
                  style={
                    styles.portalLabel
                  }
                >
                  ESTATE AGENT PORTAL
                </Text>

                <Text
                  style={
                    styles.title
                  }
                >
                  Forgot your
                  password?
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Enter your work
                  email and we will
                  start the secure
                  password reset
                  process.
                </Text>

                <View
                  style={
                    styles.form
                  }
                >
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Work email
                  </Text>

                  <TextInput
                    value={email}
                    onChangeText={(
                      value,
                    ) => {
                      setEmail(
                        value,
                      );

                      setEmailError(
                        "",
                      );

                      setApiError(
                        "",
                      );
                    }}
                    mode="outlined"
                    placeholder="name@agency.co.uk"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={
                      false
                    }
                    autoComplete="email"
                    error={Boolean(
                      emailError,
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
                    contentStyle={
                      styles.inputContent
                    }
                  />

                  {emailError ? (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        emailError
                      }
                    </Text>
                  ) : null}

                  <ApiError
                    message={
                      apiError
                    }
                  />

                  <Button
                    mode="contained"
                    icon="email-send-outline"
                    onPress={
                      handleSubmit
                    }
                    loading={loading}
                    disabled={
                      loading
                    }
                    buttonColor={
                      colors.primary
                    }
                    style={
                      styles.button
                    }
                    contentStyle={
                      styles.buttonContent
                    }
                  >
                    Send reset
                    instructions
                  </Button>

                  <Button
                    mode="text"
                    icon="arrow-left"
                    onPress={() =>
                      router.replace(
                        AGENT_LOGIN_ROUTE,
                      )
                    }
                    textColor={
                      colors.primary
                    }
                    style={
                      styles.backButton
                    }
                  >
                    Back to sign in
                  </Button>
                </View>
              </>
            ) : null}

            {/* =================================================
                RESET PASSWORD
            ================================================= */}

            {stage ===
            "reset" ? (
              <>
                <Text
                  style={
                    styles.portalLabel
                  }
                >
                  ESTATE AGENT PORTAL
                </Text>

                <Text
                  style={
                    styles.title
                  }
                >
                  Reset your
                  password
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Password reset
                  instructions were
                  created for{" "}
                  <Text
                    style={
                      styles.emailText
                    }
                  >
                    {email.trim()}
                  </Text>
                  .
                </Text>

                {/* DEVELOPMENT TOKEN */}

                {developmentToken ? (
                  <Animated.View
                    entering={FadeIn.duration(
                      200,
                    )}
                    style={
                      styles.developmentCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="code-tags"
                      size={20}
                      color={
                        colors.primary
                      }
                    />

                    <View
                      style={
                        styles.developmentContent
                      }
                    >
                      <Text
                        style={
                          styles.developmentTitle
                        }
                      >
                        Development
                        reset token
                      </Text>

                      <Text
                        selectable
                        style={
                          styles.developmentToken
                        }
                      >
                        {
                          developmentToken
                        }
                      </Text>

                      <Text
                        style={
                          styles.developmentDescription
                        }
                      >
                        This is shown
                        only while
                        TenureEx is in
                        development.
                        Production
                        will send the
                        reset link by
                        email.
                      </Text>
                    </View>
                  </Animated.View>
                ) : (
                  <View
                    style={
                      styles.informationCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={
                        colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.informationText
                      }
                    >
                      Check your email
                      for your password
                      reset token or
                      link.
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.form
                  }
                >
                  {/* TOKEN */}

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    Reset token
                  </Text>

                  <TextInput
                    value={
                      resetToken
                    }
                    onChangeText={(
                      value,
                    ) => {
                      setResetToken(
                        value,
                      );

                      setTokenError(
                        "",
                      );

                      setApiError(
                        "",
                      );
                    }}
                    mode="outlined"
                    placeholder="Enter reset token"
                    autoCapitalize="none"
                    autoCorrect={
                      false
                    }
                    error={Boolean(
                      tokenError,
                    )}
                    left={
                      <TextInput.Icon
                        icon="key-outline"
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
                    contentStyle={
                      styles.inputContent
                    }
                  />

                  {tokenError ? (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {tokenError}
                    </Text>
                  ) : null}

                  {/* NEW PASSWORD */}

                  <Text
                    style={
                      styles.fieldLabelWithMargin
                    }
                  >
                    New password
                  </Text>

                  <TextInput
                    value={
                      newPassword
                    }
                    onChangeText={(
                      value,
                    ) => {
                      setNewPassword(
                        value,
                      );

                      setPasswordError(
                        "",
                      );

                      setApiError(
                        "",
                      );
                    }}
                    mode="outlined"
                    placeholder="Enter new password"
                    secureTextEntry={
                      !showNewPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={
                      false
                    }
                    error={Boolean(
                      passwordError,
                    )}
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
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
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
                    contentStyle={
                      styles.inputContent
                    }
                  />

                  {passwordError ? (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        passwordError
                      }
                    </Text>
                  ) : null}

                  {/* CONFIRM */}

                  <Text
                    style={
                      styles.fieldLabelWithMargin
                    }
                  >
                    Confirm password
                  </Text>

                  <TextInput
                    value={
                      confirmPassword
                    }
                    onChangeText={(
                      value,
                    ) => {
                      setConfirmPassword(
                        value,
                      );

                      setConfirmPasswordError(
                        "",
                      );

                      setApiError(
                        "",
                      );
                    }}
                    mode="outlined"
                    placeholder="Confirm new password"
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={
                      false
                    }
                    error={Boolean(
                      confirmPasswordError,
                    )}
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
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
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
                    contentStyle={
                      styles.inputContent
                    }
                  />

                  {confirmPasswordError ? (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        confirmPasswordError
                      }
                    </Text>
                  ) : null}

                  <ApiError
                    message={
                      apiError
                    }
                  />

                  <Button
                    mode="contained"
                    icon="lock-check-outline"
                    onPress={
                      handleResetPassword
                    }
                    loading={loading}
                    disabled={
                      loading
                    }
                    buttonColor={
                      colors.primary
                    }
                    style={
                      styles.button
                    }
                    contentStyle={
                      styles.buttonContent
                    }
                  >
                    Reset password
                  </Button>

                  <Button
                    mode="text"
                    icon="refresh"
                    onPress={
                      handleResend
                    }
                    disabled={
                      loading
                    }
                    textColor={
                      colors.primary
                    }
                    style={
                      styles.backButton
                    }
                  >
                    Resend reset
                    instructions
                  </Button>

                  <Button
                    mode="text"
                    icon="arrow-left"
                    onPress={() =>
                      setStage(
                        "request",
                      )
                    }
                    textColor={
                      colors.primary
                    }
                    style={
                      styles.backButton
                    }
                  >
                    Change email
                  </Button>
                </View>
              </>
            ) : null}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {stage ===
            "success" ? (
              <>
                <Text
                  style={
                    styles.title
                  }
                >
                  Password changed
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Your Estate Agent
                  password has been
                  reset successfully.
                  You can now sign in
                  using your new
                  password.
                </Text>

                <View
                  style={
                    styles.successCard
                  }
                >
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={22}
                    color={
                      colors.success
                    }
                  />

                  <View
                    style={
                      styles.successContent
                    }
                  >
                    <Text
                      style={
                        styles.successTitle
                      }
                    >
                      Account secured
                    </Text>

                    <Text
                      style={
                        styles.successText
                      }
                    >
                      Your previous
                      password can no
                      longer be used.
                    </Text>
                  </View>
                </View>

                <Button
                  mode="contained"
                  icon="login"
                  onPress={() =>
                    router.replace(
                      AGENT_LOGIN_ROUTE,
                    )
                  }
                  buttonColor={
                    colors.primary
                  }
                  style={
                    styles.button
                  }
                  contentStyle={
                    styles.buttonContent
                  }
                >
                  Return to sign in
                </Button>
              </>
            ) : null}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   ERROR COMPONENT
========================================================= */

function ApiError({
  message,
}: {
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(
        200,
      )}
      style={styles.apiErrorBox}
    >
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={20}
        color={colors.error}
      />

      <Text
        style={
          styles.apiErrorText
        }
      >
        {message}
      </Text>
    </Animated.View>
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

      justifyContent:
        "center",

      padding:
        spacing.lg,
    },

    card: {
      width: "100%",

      maxWidth: 520,

      padding: 42,

      backgroundColor:
        colors.white,

      borderRadius: 24,

      borderWidth: 1,

      borderColor:
        colors.border,

      shadowColor:
        "#102B3A",

      shadowOpacity:
        0.1,

      shadowRadius: 28,

      shadowOffset: {
        width: 0,
        height: 12,
      },

      elevation: 6,
    },

    mobileCard: {
      padding:
        spacing.xl,
    },

    iconContainer: {
      width: 62,

      height: 62,

      marginTop:
        spacing.xxxl,

      borderRadius: 20,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        colors.primaryLight,
    },

    portalLabel: {
      marginTop:
        spacing.xl,

      color:
        colors.primary,

      fontSize: 10,

      fontWeight:
        "900",

      letterSpacing:
        1.6,
    },

    title: {
      ...typography.headingLarge,

      marginTop:
        spacing.md,

      color:
        colors.textPrimary,
    },

    description: {
      ...typography.bodyMedium,

      marginTop:
        spacing.sm,

      color:
        colors.textSecondary,
    },

    emailText: {
      color:
        colors.textPrimary,

      fontWeight:
        "700",
    },

    form: {
      marginTop:
        spacing.xxl,
    },

    fieldLabel: {
      ...typography.label,

      marginBottom:
        spacing.sm,

      color:
        colors.textPrimary,
    },

    fieldLabelWithMargin: {
      ...typography.label,

      marginTop:
        spacing.lg,

      marginBottom:
        spacing.sm,

      color:
        colors.textPrimary,
    },

    input: {
      backgroundColor:
        colors.white,
    },

    inputContent: {
      minHeight: 54,
    },

    errorText: {
      marginTop: 5,

      color:
        colors.error,

      fontSize: 11,
    },

    apiErrorBox: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 9,

      marginTop:
        spacing.md,

      padding:
        spacing.md,

      borderWidth: 1,

      borderColor:
        "#F2B8B5",

      borderRadius:
        radius.md,

      backgroundColor:
        "#FFF4F3",
    },

    apiErrorText: {
      flex: 1,

      color:
        colors.error,

      fontSize: 12,

      lineHeight: 18,

      fontWeight:
        "600",
    },

    button: {
      marginTop:
        spacing.xl,

      borderRadius:
        radius.md,
    },

    buttonContent: {
      minHeight: 53,
    },

    backButton: {
      marginTop:
        spacing.sm,
    },

    informationCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 10,

      marginTop:
        spacing.xl,

      padding:
        spacing.lg,

      backgroundColor:
        colors.primaryLight,

      borderRadius:
        radius.lg,
    },

    informationText: {
      flex: 1,

      color:
        colors.textSecondary,

      fontSize: 12,

      lineHeight: 18,
    },

    developmentCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 11,

      marginTop:
        spacing.xl,

      padding:
        spacing.lg,

      borderWidth: 1,

      borderColor:
        "#CDE2E8",

      backgroundColor:
        colors.primaryLight,

      borderRadius:
        radius.lg,
    },

    developmentContent: {
      flex: 1,
    },

    developmentTitle: {
      color:
        colors.textPrimary,

      fontSize: 12,

      fontWeight:
        "900",
    },

    developmentToken: {
      marginTop: 7,

      color:
        colors.primaryDark,

      fontSize: 11,

      lineHeight: 17,

      fontWeight:
        "700",
    },

    developmentDescription: {
      marginTop: 7,

      color:
        colors.textSecondary,

      fontSize: 10,

      lineHeight: 16,
    },

    successCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 11,

      marginTop:
        spacing.xl,

      padding:
        spacing.lg,

      borderRadius:
        radius.lg,

      backgroundColor:
        colors.successLight,
    },

    successContent: {
      flex: 1,
    },

    successTitle: {
      color:
        colors.textPrimary,

      fontSize: 13,

      fontWeight:
        "900",
    },

    successText: {
      marginTop: 3,

      color:
        colors.textSecondary,

      fontSize: 11,

      lineHeight: 17,
    },

    backgroundCircleOne: {
      position:
        "absolute",

      top: -170,

      right: -110,

      width: 380,

      height: 380,

      borderRadius: 190,

      backgroundColor:
        "rgba(15,92,115,0.05)",
    },

    backgroundCircleTwo: {
      position:
        "absolute",

      bottom: -120,

      left: -100,

      width: 280,

      height: 280,

      borderRadius: 140,

      backgroundColor:
        "rgba(199,154,59,0.045)",
    },
  });