import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  router,
  useLocalSearchParams,
  type Href,
} from "expo-router";
import { useMemo, useState } from "react";
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

type ResetPasswordResponse = {
  message: string;
};

function getErrorMessage(
  error: any,
): string {
  const message =
    error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join("\n");
  }

  if (
    typeof message === "string"
  ) {
    return message;
  }

  return (
    error?.message ||
    "Unable to set your password."
  );
}

export default function AgentSetPasswordRoute() {
  const { width } =
    useWindowDimensions();

  const isMobile =
    width < 600;

  const params =
    useLocalSearchParams<{
      token?: string | string[];
    }>();

  const invitationToken =
    useMemo(() => {
      const token = params.token;

      if (Array.isArray(token)) {
        return token[0] || "";
      }

      return token || "";
    }, [params.token]);

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    passwordVisible,
    setPasswordVisible,
  ] = useState(false);

  const [
    confirmPasswordVisible,
    setConfirmPasswordVisible,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    confirmPasswordError,
    setConfirmPasswordError,
  ] = useState("");

  const [
    generalError,
    setGeneralError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const validate = () => {
    let valid = true;

    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    if (!invitationToken) {
      setGeneralError(
        "This invitation link is missing its security token.",
      );

      return false;
    }

    if (password.length < 8) {
      setPasswordError(
        "Password must be at least 8 characters.",
      );

      valid = false;
    }

    if (
      !/[A-Z]/.test(password)
    ) {
      setPasswordError(
        "Password must contain at least one uppercase letter.",
      );

      valid = false;
    }

    if (
      !/[a-z]/.test(password)
    ) {
      setPasswordError(
        "Password must contain at least one lowercase letter.",
      );

      valid = false;
    }

    if (
      !/\d/.test(password)
    ) {
      setPasswordError(
        "Password must contain at least one number.",
      );

      valid = false;
    }

    if (
      password !==
      confirmPassword
    ) {
      setConfirmPasswordError(
        "Passwords do not match.",
      );

      valid = false;
    }

    return valid;
  };

  const handleSetPassword =
    async () => {
      if (!validate()) {
        return;
      }

      try {
        setLoading(true);
        setGeneralError("");

        await api.post<ResetPasswordResponse>(
          "/auth/reset-password",
          {
            token:
              invitationToken,

            newPassword:
              password,
          },
        );

        setCompleted(true);
      } catch (error) {
        setGeneralError(
          getErrorMessage(error),
        );
      } finally {
        setLoading(false);
      }
    };

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
            <TenureExLogo />

            <View
              style={
                styles.iconContainer
              }
            >
              <MaterialCommunityIcons
                name={
                  completed
                    ? "check-decagram-outline"
                    : "lock-reset"
                }
                size={36}
                color={
                  colors.primary
                }
              />
            </View>

            {completed ? (
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
                  Password created
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Your TenureEx
                  account is now
                  active. You can
                  sign in using your
                  email address and
                  new password.
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
                      colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.successText
                    }
                  >
                    Your invitation
                    has been accepted
                    and your password
                    has been saved
                    securely.
                  </Text>
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
                  Continue to sign in
                </Button>
              </>
            ) : (
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
                  Create your password
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Complete your
                  TenureEx invitation
                  by creating a secure
                  password for your
                  account.
                </Text>

                {!invitationToken ? (
                  <View
                    style={
                      styles.errorCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={21}
                      color={
                        colors.error
                      }
                    />

                    <Text
                      style={
                        styles.errorCardText
                      }
                    >
                      This invitation
                      link is invalid
                      because no token
                      was provided.
                    </Text>
                  </View>
                ) : null}

                {generalError ? (
                  <View
                    style={
                      styles.errorCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={21}
                      color={
                        colors.error
                      }
                    />

                    <Text
                      style={
                        styles.errorCardText
                      }
                    >
                      {generalError}
                    </Text>
                  </View>
                ) : null}

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
                    New password
                  </Text>

                  <TextInput
                    value={
                      password
                    }
                    onChangeText={(
                      value,
                    ) => {
                      setPassword(
                        value,
                      );

                      setPasswordError(
                        "",
                      );

                      setGeneralError(
                        "",
                      );
                    }}
                    mode="outlined"
                    placeholder="Create a secure password"
                    secureTextEntry={
                      !passwordVisible
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
                          passwordVisible
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onPress={() =>
                          setPasswordVisible(
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

                  <Text
                    style={
                      styles.passwordHint
                    }
                  >
                    Use at least 8
                    characters with
                    uppercase,
                    lowercase and a
                    number.
                  </Text>

                  <Text
                    style={[
                      styles.fieldLabel,
                      styles.secondFieldLabel,
                    ]}
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

                      setGeneralError(
                        "",
                      );
                    }}
                    mode="outlined"
                    placeholder="Enter your password again"
                    secureTextEntry={
                      !confirmPasswordVisible
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
                          confirmPasswordVisible
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onPress={() =>
                          setConfirmPasswordVisible(
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

                  <Button
                    mode="contained"
                    icon="shield-key-outline"
                    onPress={
                      handleSetPassword
                    }
                    loading={
                      loading
                    }
                    disabled={
                      loading ||
                      !invitationToken
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
                    Create password
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
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

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
      alignItems: "center",
      justifyContent:
        "center",
      padding: spacing.lg,
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
      shadowOpacity: 0.1,
      shadowRadius: 28,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      elevation: 6,
    },

    mobileCard: {
      padding: spacing.xl,
    },

    iconContainer: {
      width: 64,
      height: 64,
      marginTop:
        spacing.xxxl,
      borderRadius: 20,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        colors.primaryLight,
    },

    portalLabel: {
      marginTop:
        spacing.xl,
      color: colors.primary,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.6,
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

    secondFieldLabel: {
      marginTop:
        spacing.xl,
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
      color: colors.error,
      fontSize: 11,
    },

    passwordHint: {
      marginTop:
        spacing.sm,
      color:
        colors.textMuted,
      fontSize: 10,
      lineHeight: 15,
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

    errorCard: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 10,
      marginTop:
        spacing.xl,
      padding:
        spacing.lg,
      borderRadius:
        radius.lg,
      backgroundColor:
        "#FFF1F1",
    },

    errorCardText: {
      flex: 1,
      color:
        colors.error,
      fontSize: 12,
      lineHeight: 18,
    },

    successCard: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 10,
      marginTop:
        spacing.xl,
      padding:
        spacing.lg,
      borderRadius:
        radius.lg,
      backgroundColor:
        colors.primaryLight,
    },

    successText: {
      flex: 1,
      color:
        colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
  });