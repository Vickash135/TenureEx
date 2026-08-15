import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
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

import {
    Button,
    TextInput,
} from "react-native-paper";

import {
    api,
    clearAuthSession,
    saveAuthTokens,
    saveCurrentUser,
} from "../../../src/api/client";

import TenureExLogo from "../../../src/components/Logo/TenureExLogo";

import {
    colors,
    radius,
    spacing
} from "../../../src/theme";

const ADMIN_DASHBOARD_ROUTE =
  "/admin/dashboard" as Href;

const MAIN_ROUTE =
  "/" as Href;

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  userType: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type AdminLoginResponse = {
  message: string;
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export default function AdminLoginScreen() {
  const { width } =
    useWindowDimensions();

  const isDesktop =
    width >= 900;

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    emailError,
    setEmailError,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    apiError,
    setApiError,
  ] = useState("");

  const validate = () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setApiError("");

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setEmailError(
        "Enter the administrator email address.",
      );
      valid = false;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail,
      )
    ) {
      setEmailError(
        "Enter a valid email address.",
      );
      valid = false;
    }

    if (!password) {
      setPasswordError(
        "Enter your password.",
      );
      valid = false;
    }

    return valid;
  };

  const handleLogin =
    async () => {
      if (!validate()) {
        return;
      }

      setLoading(true);
      setApiError("");

      try {
        await clearAuthSession();

        const response =
          await api.post<AdminLoginResponse>(
            "/auth/admin/login",
            {
              email:
                email
                  .trim()
                  .toLowerCase(),
              password,
            },
          );

        const {
          user,
          accessToken,
          refreshToken,
        } = response.data;

        if (
          user.userType !==
          "TENUREEX_ADMIN"
        ) {
          await clearAuthSession();

          setApiError(
            "This account does not have administrator access.",
          );

          return;
        }

        if (
          user.status !==
          "ACTIVE"
        ) {
          await clearAuthSession();

          setApiError(
            "This administrator account is not active.",
          );

          return;
        }

        await saveAuthTokens(
          accessToken,
          refreshToken,
        );

        await saveCurrentUser(
          user,
        );

        const meResponse =
          await api.get<AdminUser>(
            "/auth/me",
          );

        if (
          meResponse.data.userType !==
          "TENUREEX_ADMIN"
        ) {
          await clearAuthSession();

          setApiError(
            "Administrator access could not be verified.",
          );

          return;
        }

        router.replace(
          ADMIN_DASHBOARD_ROUTE,
        );
      } catch (error: unknown) {
        await clearAuthSession();

        if (
          axios.isAxiosError(
            error,
          )
        ) {
          const message =
            error.response?.data
              ?.message;

          if (
            Array.isArray(
              message,
            )
          ) {
            setApiError(
              message.join(
                "\n",
              ),
            );
          } else if (
            typeof message ===
            "string"
          ) {
            setApiError(
              message,
            );
          } else if (
            error.request
          ) {
            setApiError(
              "Unable to connect to the TenureEx server.",
            );
          } else {
            setApiError(
              "Unable to sign in.",
            );
          }
        } else {
          setApiError(
            "Unable to sign in.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.page,
              isDesktop &&
                styles.pageDesktop,
            ]}
          >
            {isDesktop ? (
              <LinearGradient
                colors={[
                  colors.primary,
                  "#172554",
                ]}
                style={
                  styles.heroPanel
                }
              >
                <Pressable
                  onPress={() =>
                    router.replace(
                      MAIN_ROUTE,
                    )
                  }
                  style={styles.brand}
                >
                  <TenureExLogo />

                  <View>
                    <Text
                      style={
                        styles.brandName
                      }
                    >
                      TenureEx
                    </Text>

                    <Text
                      style={
                        styles.brandSubtitle
                      }
                    >
                      Administration
                    </Text>
                  </View>
                </Pressable>

                <View
                  style={
                    styles.heroContent
                  }
                >
                  <View
                    style={
                      styles.heroIcon
                    }
                  >
                    <MaterialCommunityIcons
                      name="shield-account-outline"
                      size={42}
                      color={
                        colors.white
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.heroTitle
                    }
                  >
                    TenureEx Admin Portal
                  </Text>

                  <Text
                    style={
                      styles.heroText
                    }
                  >
                    Review Estate Agent
                    applications, manage
                    onboarding and complete
                    final platform approval.
                  </Text>

                  <View
                    style={
                      styles.securityNote
                    }
                  >
                    <MaterialCommunityIcons
                      name="lock-check-outline"
                      size={20}
                      color={
                        colors.white
                      }
                    />

                    <Text
                      style={
                        styles.securityText
                      }
                    >
                      Restricted to authorised
                      TenureEx administrators.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ) : null}

            <View
              style={
                styles.formPanel
              }
            >
              {!isDesktop ? (
                <View
                  style={
                    styles.mobileBrand
                  }
                >
                  <TenureExLogo />

                  <View>
                    <Text
                      style={
                        styles.mobileBrandName
                      }
                    >
                      TenureEx
                    </Text>

                    <Text
                      style={
                        styles.mobileBrandSubtitle
                      }
                    >
                      Admin Portal
                    </Text>
                  </View>
                </View>
              ) : null}

              <View
                style={
                  styles.formCard
                }
              >
                <View
                  style={
                    styles.formHeader
                  }
                >
                  <View
                    style={
                      styles.adminBadge
                    }
                  >
                    <MaterialCommunityIcons
                      name="shield-lock-outline"
                      size={22}
                      color={
                        colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.adminBadgeText
                      }
                    >
                      ADMINISTRATOR
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.title
                    }
                  >
                    Admin sign in
                  </Text>

                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    Sign in to review and
                    manage Estate Agent
                    applications.
                  </Text>
                </View>

                {apiError ? (
                  <View
                    style={
                      styles.errorBox
                    }
                  >
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={20}
                      color={
                        colors.error
                      }
                    />

                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {apiError}
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  mode="outlined"
                  label="Admin email"
                  value={email}
                  onChangeText={
                    setEmail
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={
                    Boolean(
                      emailError,
                    )
                  }
                  left={
                    <TextInput.Icon
                      icon="email-outline"
                    />
                  }
                  style={
                    styles.input
                  }
                />

                {emailError ? (
                  <Text
                    style={
                      styles.fieldError
                    }
                  >
                    {emailError}
                  </Text>
                ) : null}

                <TextInput
                  mode="outlined"
                  label="Password"
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  secureTextEntry={
                    !showPassword
                  }
                  error={
                    Boolean(
                      passwordError,
                    )
                  }
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
                          (current) =>
                            !current,
                        )
                      }
                    />
                  }
                  onSubmitEditing={
                    handleLogin
                  }
                  style={
                    styles.input
                  }
                />

                {passwordError ? (
                  <Text
                    style={
                      styles.fieldError
                    }
                  >
                    {passwordError}
                  </Text>
                ) : null}

                <Button
                  mode="contained"
                  icon="login"
                  loading={loading}
                  disabled={loading}
                  onPress={
                    handleLogin
                  }
                  style={
                    styles.loginButton
                  }
                  contentStyle={
                    styles.loginButtonContent
                  }
                >
                  Sign in to Admin Portal
                </Button>

                <Pressable
                  onPress={() =>
                    router.replace(
                      MAIN_ROUTE,
                    )
                  }
                  style={
                    styles.backButton
                  }
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={18}
                    color={
                      colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.backText
                    }
                  >
                    Back to TenureEx
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    flex: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
    },

    page: {
      flex: 1,
      minHeight: 700,
      backgroundColor:
        colors.background,
    },

    pageDesktop: {
      flexDirection: "row",
    },

    heroPanel: {
      width: "46%",
      minHeight: 700,
      padding:
        spacing.xl,
      justifyContent:
        "space-between",
    },

    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    brandName: {
      color: colors.white,
      fontSize: 24,
      fontWeight: "800",
    },

    brandSubtitle: {
      marginTop: 2,
      color:
        "rgba(255,255,255,0.78)",
      fontSize: 13,
      fontWeight: "600",
    },

    heroContent: {
      maxWidth: 500,
      marginBottom:
        spacing.xxl,
    },

    heroIcon: {
      width: 76,
      height: 76,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.24)",
      borderRadius:
        radius.lg,
      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    heroTitle: {
      marginTop:
        spacing.lg,
      color: colors.white,
      fontSize: 34,
      lineHeight: 42,
      fontWeight: "800",
    },

    heroText: {
      marginTop:
        spacing.md,
      maxWidth: 450,
      color:
        "rgba(255,255,255,0.82)",
      fontSize: 16,
      lineHeight: 25,
    },

    securityNote: {
      marginTop:
        spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding:
        spacing.md,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.20)",
      borderRadius:
        radius.md,
      backgroundColor:
        "rgba(255,255,255,0.08)",
    },

    securityText: {
      flex: 1,
      color: colors.white,
      fontSize: 13,
      lineHeight: 19,
    },

    formPanel: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding:
        spacing.xl,
    },

    mobileBrand: {
      width: "100%",
      maxWidth: 500,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom:
        spacing.lg,
    },

    mobileBrandName: {
      color:
        colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
    },

    mobileBrandSubtitle: {
      color:
        colors.textSecondary,
      fontSize: 13,
    },

    formCard: {
      width: "100%",
      maxWidth: 500,
      padding:
        spacing.xl,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.lg,
      backgroundColor:
        colors.white,
    },

    formHeader: {
      marginBottom:
        spacing.lg,
    },

    adminBadge: {
      alignSelf:
        "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom:
        spacing.md,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius:
        radius.sm,
      backgroundColor:
        colors.primaryLight,
    },

    adminBadgeText: {
      color:
        colors.primary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
    },

    title: {
      color:
        colors.textPrimary,
      fontSize: 30,
      fontWeight: "800",
    },

    subtitle: {
      marginTop:
        spacing.sm,
      color:
        colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },

    input: {
      marginTop:
        spacing.sm,
      backgroundColor:
        colors.white,
    },

    fieldError: {
      marginTop: 4,
      marginLeft: 4,
      color:
        colors.error,
      fontSize: 12,
    },

    errorBox: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom:
        spacing.sm,
      padding:
        spacing.md,
      borderWidth: 1,
      borderColor:
        colors.error,
      borderRadius:
        radius.md,
      backgroundColor:
        "#FFF5F5",
    },

    errorText: {
      flex: 1,
      color:
        colors.error,
      fontSize: 13,
      lineHeight: 19,
    },

    loginButton: {
      marginTop:
        spacing.lg,
      borderRadius:
        radius.md,
    },

    loginButtonContent: {
      minHeight: 50,
    },

    backButton: {
      alignSelf:
        "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop:
        spacing.lg,
      padding:
        spacing.sm,
    },

    backText: {
      color:
        colors.primary,
      fontSize: 13,
      fontWeight: "700",
    },
  });

