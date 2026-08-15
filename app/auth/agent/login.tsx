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
  Checkbox,
  TextInput,
} from "react-native-paper";

import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInUp,
} from "react-native-reanimated";

import {
  api,
  clearAuthSession,
  saveAuthTokens,
  saveCurrentUser,
} from "../../../src/api/client";

import type { AgentCurrentUser } from "../../../src/auth/agent-permissions";
import TenureExLogo from "../../../src/components/Logo/TenureExLogo";

import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

const AGENT_FORGOT_PASSWORD_ROUTE =
  "/auth/agent/forgot-password" as Href;

const AGENT_DASHBOARD_ROUTE =
  "/agent/dashboard" as Href;

const AGENT_SIGNUP_ROUTE =
  "/auth/agent/signup" as Href;

const MAIN_PAGE_ROUTE = "/" as Href;

type EstateAgentUser = {
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

type LoginResponse = {
  message: string;

  user: EstateAgentUser;

  accessToken: string;

  refreshToken: string;

  tokenType: string;

  expiresIn: number;
};

export default function AgentLoginScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 960;
  const isSmallMobile = width < 380;

  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  */

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Validation State
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Validate
  |--------------------------------------------------------------------------
  */

  const validateForm = (): boolean => {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setApiError("");

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setEmailError(
        "Please enter your work email.",
      );

      valid = false;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail,
      )
    ) {
      setEmailError(
        "Please enter a valid email address.",
      );

      valid = false;
    }

    if (!password.trim()) {
      setPasswordError(
        "Please enter your password.",
      );

      valid = false;
    }

    return valid;
  };

  /*
  |--------------------------------------------------------------------------
  | REAL BACKEND LOGIN
  |--------------------------------------------------------------------------
  */

  const handleSignIn =
    async (): Promise<void> => {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setApiError("");

      try {
        /*
        --------------------------------------------------------------
        Clear any old user session before starting a new one
        --------------------------------------------------------------
        */

        await clearAuthSession();

        /*
        --------------------------------------------------------------
        POST /api/v1/auth/login
        --------------------------------------------------------------
        */

        const response =
          await api.post<LoginResponse>(
            "/auth/login",
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

        /*
        --------------------------------------------------------------
        Safety: only ESTATE_AGENT users can enter this portal
        --------------------------------------------------------------
        */

        if (
          user.userType !==
          "ESTATE_AGENT"
        ) {
          await clearAuthSession();

          setApiError(
            "This account is not registered as an Estate Agent account.",
          );

          return;
        }

        /*
        --------------------------------------------------------------
        Estate Agent must be ACTIVE
        --------------------------------------------------------------
        */

        if (user.status !== "ACTIVE") {
          await clearAuthSession();

          setApiError(
            getAccountStatusMessage(
              user.status,
            ),
          );

          return;
        }

        /*
        --------------------------------------------------------------
        Verification safety
        --------------------------------------------------------------
        */

        if (!user.emailVerified) {
          await clearAuthSession();

          setApiError(
            "Your email address has not been verified.",
          );

          return;
        }

        

        /*
        --------------------------------------------------------------
        Store JWT tokens
        --------------------------------------------------------------
        */

        await saveAuthTokens(
          accessToken,
          refreshToken,
        );

        /*
        --------------------------------------------------------------
        Store user
        --------------------------------------------------------------
        */

        await saveCurrentUser(
          user,
        );

        /*
        --------------------------------------------------------------
        Verify JWT with /auth/me
        --------------------------------------------------------------
        */

        const meResponse =
          await api.get<AgentCurrentUser>(
            "/auth/me",
          );

        if (
          meResponse.data.userType !==
          "ESTATE_AGENT"
        ) {
          await clearAuthSession();

          setApiError(
            "You do not have permission to access the Estate Agent portal.",
          );

          return;
        }

        if (
          meResponse.data.status !==
          "ACTIVE"
        ) {
          await clearAuthSession();

          setApiError(
            "Your Estate Agent account is currently not active.",
          );

          return;
        }

        /*
        --------------------------------------------------------------
        Store the FULL /auth/me user, including agency role + permissions
        --------------------------------------------------------------
        */

        await saveCurrentUser(meResponse.data);

        /*
        --------------------------------------------------------------
        Login complete
        --------------------------------------------------------------
        */

        router.replace(
          AGENT_DASHBOARD_ROUTE,
        );
      } catch (error: unknown) {
        await clearAuthSession();

        if (
          axios.isAxiosError(
            error,
          )
        ) {
          /*
          ------------------------------------------------------------
          Backend responded
          ------------------------------------------------------------
          */

          if (error.response) {
            const backendMessage =
              error.response.data
                ?.message;

            if (
              Array.isArray(
                backendMessage,
              )
            ) {
              setApiError(
                backendMessage.join(
                  "\n",
                ),
              );
            } else if (
              typeof backendMessage ===
              "string"
            ) {
              setApiError(
                backendMessage,
              );
            } else if (
              error.response.status ===
              401
            ) {
              setApiError(
                "Invalid email or password.",
              );
            } else {
              setApiError(
                "Unable to sign in. Please try again.",
              );
            }
          }

          /*
          ------------------------------------------------------------
          Backend not reachable
          ------------------------------------------------------------
          */

          else if (
            error.request
          ) {
            setApiError(
              Platform.OS ===
                "web"
                ? "Unable to connect to the TenureEx server. Make sure the backend is running on port 3000."
                : "Unable to connect to the TenureEx server. Please check your network connection.",
            );
          }

          /*
          ------------------------------------------------------------
          Axios configuration issue
          ------------------------------------------------------------
          */

          else {
            setApiError(
              "Unable to process the login request.",
            );
          }
        } else {
          setApiError(
            "An unexpected error occurred. Please try again.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Screen
  |--------------------------------------------------------------------------
  */

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
          "#F6F8FA",
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
          contentContainerStyle={[
            styles.scrollContent,

            isDesktop &&
              styles.desktopScrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={[
              styles.mainContainer,

              isDesktop &&
                styles.desktopMainContainer,
            ]}
          >
            {isDesktop && (
              <Animated.View
                entering={FadeInLeft.duration(
                  650,
                )}
                style={
                  styles.heroPanel
                }
              >
                <LinearGradient
                  colors={[
                    colors.primaryDark,
                    colors.primary,
                    "#18768A",
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 1,
                  }}
                  style={
                    styles.heroGradient
                  }
                >
                  <TenureExLogo
                    light
                  />

                  <View
                    style={
                      styles.heroVisual
                    }
                  >
                    <View
                      style={
                        styles.mainBuilding
                      }
                    >
                      <MaterialCommunityIcons
                        name="office-building-outline"
                        size={112}
                        color={
                          colors.white
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.smallBuilding
                      }
                    >
                      <MaterialCommunityIcons
                        name="home-city-outline"
                        size={55}
                        color="rgba(255,255,255,0.48)"
                      />
                    </View>

                    <View
                      style={
                        styles.portfolioCard
                      }
                    >
                      <View
                        style={
                          styles.portfolioIcon
                        }
                      >
                        <MaterialCommunityIcons
                          name="chart-line"
                          size={20}
                          color={
                            colors.success
                          }
                        />
                      </View>

                      <View>
                        <Text
                          style={
                            styles.portfolioValue
                          }
                        >
                          92%
                        </Text>

                        <Text
                          style={
                            styles.portfolioLabel
                          }
                        >
                          Portfolio
                          health
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={
                      styles.heroTextContainer
                    }
                  >
                    <Text
                      style={
                        styles.heroEyebrow
                      }
                    >
                      BUILT FOR UK
                      ESTATE AGENCIES
                    </Text>

                    <Text
                      style={
                        styles.heroTitle
                      }
                    >
                      Property
                      operations,
                      simplified.
                    </Text>

                    <Text
                      style={
                        styles.heroDescription
                      }
                    >
                      Manage
                      landlords,
                      properties,
                      applicants,
                      tenants,
                      maintenance and
                      compliance from
                      one professional
                      workspace.
                    </Text>

                    <View
                      style={
                        styles.featureList
                      }
                    >
                      <FeatureItem
                        text="Complete portfolio overview"
                      />

                      <FeatureItem
                        text="Landlord and tenant management"
                      />

                      <FeatureItem
                        text="Maintenance request tracking"
                      />

                      <FeatureItem
                        text="Compliance monitoring and reports"
                      />
                    </View>
                  </View>

                  <View
                    style={
                      styles.heroFooter
                    }
                  >
                    <MaterialCommunityIcons
                      name="shield-check-outline"
                      size={18}
                      color="rgba(255,255,255,0.76)"
                    />

                    <Text
                      style={
                        styles.heroFooterText
                      }
                    >
                      Secure estate
                      agency
                      operations
                      platform
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            <Animated.View
              entering={
                isDesktop
                  ? FadeIn.duration(
                      600,
                    )
                  : FadeInUp.duration(
                      550,
                    )
              }
              style={[
                styles.formPanel,

                isDesktop &&
                  styles.desktopFormPanel,
              ]}
            >
              <View
                style={
                  styles.formContainer
                }
              >
                <Pressable
                  onPress={() =>
                    router.replace(
                      MAIN_PAGE_ROUTE,
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.backToMainButton,

                    pressed &&
                      styles.backToMainButtonPressed,
                  ]}
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
                      styles.backToMainText
                    }
                  >
                    Back to main
                    page
                  </Text>
                </Pressable>

                {!isDesktop && (
                  <View
                    style={
                      styles.mobileLogo
                    }
                  >
                    <TenureExLogo />
                  </View>
                )}

                <Text
                  style={
                    styles.portalLabel
                  }
                >
                  ESTATE AGENT PORTAL
                </Text>

                <Text
                  style={[
                    styles.title,

                    isSmallMobile &&
                      styles.smallTitle,
                  ]}
                >
                  Welcome back
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Sign in to manage
                  your property
                  portfolio and daily
                  agency operations.
                </Text>

                <View
                  style={styles.form}
                >
                  {/* EMAIL */}

                  <View>
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
                      textColor={
                        colors.textPrimary
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
                  </View>

                  {/* PASSWORD */}

                  <View>
                    <View
                      style={
                        styles.passwordHeading
                      }
                    >
                      <Text
                        style={
                          styles.fieldLabel
                        }
                      >
                        Password
                      </Text>

                      <Pressable
                        onPress={() =>
                          router.push(
                            AGENT_FORGOT_PASSWORD_ROUTE,
                          )
                        }
                      >
                        <Text
                          style={
                            styles.forgotPassword
                          }
                        >
                          Forgot
                          password?
                        </Text>
                      </Pressable>
                    </View>

                    <TextInput
                      value={password}
                      onChangeText={(
                        value,
                      ) => {
                        setPassword(
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
                      placeholder="Enter your password"
                      secureTextEntry={
                        !showPassword
                      }
                      error={Boolean(
                        passwordError,
                      )}
                      autoCapitalize="none"
                      autoCorrect={
                        false
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
                      textColor={
                        colors.textPrimary
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
                  </View>

                  {/* REMEMBER */}

                  <Pressable
                    onPress={() =>
                      setRememberMe(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    style={
                      styles.rememberContainer
                    }
                  >
                    <Checkbox
                      status={
                        rememberMe
                          ? "checked"
                          : "unchecked"
                      }
                      onPress={() =>
                        setRememberMe(
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
                        styles.rememberText
                      }
                    >
                      Keep me signed
                      in on this
                      device
                    </Text>
                  </Pressable>

                  {/* API ERROR */}

                  {apiError ? (
                    <Animated.View
                      entering={FadeIn.duration(
                        200,
                      )}
                      style={
                        styles.apiErrorBox
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
                          styles.apiErrorText
                        }
                      >
                        {apiError}
                      </Text>
                    </Animated.View>
                  ) : null}

                  {/* SIGN IN */}

                  <Button
                    mode="contained"
                    onPress={
                      handleSignIn
                    }
                    loading={loading}
                    disabled={loading}
                    icon="arrow-right"
                    buttonColor={
                      colors.primary
                    }
                    textColor={
                      colors.white
                    }
                    style={
                      styles.signInButton
                    }
                    contentStyle={
                      styles.signInButtonContent
                    }
                    labelStyle={
                      styles.signInButtonLabel
                    }
                  >
                    {loading
                      ? "Signing in"
                      : "Sign in"}
                  </Button>

                  {/* REAL BACKEND STATUS */}

                  <View
                    style={
                      styles.secureCard
                    }
                  >
                    <View
                      style={
                        styles.secureIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="shield-lock-outline"
                        size={22}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.secureInformation
                      }
                    >
                      <Text
                        style={
                          styles.secureTitle
                        }
                      >
                        Secure
                        TenureEx login
                      </Text>

                      <Text
                        style={
                          styles.secureDescription
                        }
                      >
                        Your account
                        must be
                        verified,
                        approved and
                        active before
                        Estate Agent
                        access is
                        granted.
                      </Text>
                    </View>
                  </View>

                  {/* REGISTER */}

                  <View
                    style={
                      styles.registerContainer
                    }
                  >
                    <Text
                      style={
                        styles.registerQuestion
                      }
                    >
                      Do not have an
                      Estate Agent
                      account?
                    </Text>

                    <Pressable
                      onPress={() =>
                        router.push(
                          AGENT_SIGNUP_ROUTE,
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.registerButton,

                        pressed &&
                          styles.registerButtonPressed,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account-plus-outline"
                        size={18}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={
                          styles.registerButtonText
                        }
                      >
                        Register
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View
                  style={
                    styles.securityContainer
                  }
                >
                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    size={16}
                    color={
                      colors.textMuted
                    }
                  />

                  <Text
                    style={
                      styles.securityText
                    }
                  >
                    Your connection
                    is encrypted and
                    secure.
                  </Text>
                </View>

                <Text
                  style={
                    styles.copyright
                  }
                >
                  © 2026 TenureEx.
                  All rights
                  reserved.
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/*
|--------------------------------------------------------------------------
| Account Status Messages
|--------------------------------------------------------------------------
*/

function getAccountStatusMessage(
  status: string,
): string {
  switch (status) {
    case "PENDING_REVIEW":
      return "Your Estate Agent application is awaiting TenureEx review.";

    case "UNDER_REVIEW":
      return "Your Estate Agent application is currently under review.";

    case "MORE_INFORMATION_REQUIRED":
      return "TenureEx requires additional information before your application can continue.";

    case "AGREEMENT_PENDING":
    case "AGREEMENT_SENT":
      return "Please complete your Estate Agent agreement before signing in.";

    case "AGREEMENT_SIGNED":
    case "PAYMENT_SETUP_PENDING":
      return "Please complete the remaining onboarding steps before signing in.";

    case "REJECTED":
      return "Your Estate Agent application has not been approved.";

    case "SUSPENDED":
      return "Your Estate Agent account is currently suspended.";

    case "DISABLED":
      return "Your Estate Agent account is currently disabled.";

    default:
      return "Your Estate Agent account is not active yet.";
  }
}

/*
|--------------------------------------------------------------------------
| Feature
|--------------------------------------------------------------------------
*/

function FeatureItem({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.featureItem
      }
    >
      <View
        style={
          styles.featureCheck
        }
      >
        <MaterialCommunityIcons
          name="check"
          size={14}
          color={
            colors.primaryDark
          }
        />
      </View>

      <Text
        style={
          styles.featureText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

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
      justifyContent:
        "center",

      padding:
        spacing.lg,
    },

    desktopScrollContent: {
      padding:
        spacing.xl,
    },

    mainContainer: {
      width: "100%",
      maxWidth: 1320,

      alignSelf:
        "center",
    },

    desktopMainContainer: {
      minHeight: 720,

      flexDirection:
        "row",

      overflow:
        "hidden",

      backgroundColor:
        colors.white,

      borderRadius: 28,

      shadowColor:
        "#102B3A",

      shadowOpacity:
        0.13,

      shadowRadius: 35,

      shadowOffset: {
        width: 0,
        height: 16,
      },

      elevation: 8,
    },

    heroPanel: {
      flex: 1.08,

      minHeight: 720,
    },

    heroGradient: {
      flex: 1,

      padding: 38,
    },

    heroVisual: {
      flex: 1,

      minHeight: 270,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    mainBuilding: {
      width: 190,
      height: 190,

      borderRadius: 50,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.11)",

      borderWidth: 1,

      borderColor:
        "rgba(255,255,255,0.20)",
    },

    smallBuilding: {
      position:
        "absolute",

      left: "18%",
      top: "25%",

      transform: [
        {
          rotate:
            "-5deg",
        },
      ],
    },

    portfolioCard: {
      position:
        "absolute",

      right: "7%",
      bottom: "10%",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

      paddingHorizontal:
        15,

      paddingVertical:
        12,

      backgroundColor:
        colors.white,

      borderRadius:
        radius.lg,

      shadowColor:
        "#062633",

      shadowOpacity: 0.2,

      shadowRadius: 18,

      shadowOffset: {
        width: 0,
        height: 8,
      },

      elevation: 5,
    },

    portfolioIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        colors.successLight,
    },

    portfolioValue: {
      color:
        colors.textPrimary,

      fontSize: 18,

      fontWeight:
        "900",
    },

    portfolioLabel: {
      marginTop: 1,

      color:
        colors.textSecondary,

      fontSize: 10,
    },

    heroTextContainer: {
      zIndex: 2,
    },

    heroEyebrow: {
      color:
        "#B8E3D7",

      fontSize: 10,

      fontWeight:
        "900",

      letterSpacing:
        1.7,
    },

    heroTitle: {
      maxWidth: 520,

      marginTop: 12,

      color:
        colors.white,

      fontSize: 40,

      lineHeight: 47,

      fontWeight:
        "900",
    },

    heroDescription: {
      maxWidth: 540,

      marginTop: 15,

      color:
        "rgba(255,255,255,0.77)",

      fontSize: 15,

      lineHeight: 23,
    },

    featureList: {
      marginTop: 24,

      gap: 11,
    },

    featureItem: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,
    },

    featureCheck: {
      width: 23,
      height: 23,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#C8E9DF",
    },

    featureText: {
      color:
        colors.white,

      fontSize: 13,

      fontWeight:
        "600",
    },

    heroFooter: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 8,

      marginTop: 28,
    },

    heroFooterText: {
      color:
        "rgba(255,255,255,0.7)",

      fontSize: 11,
    },

    formPanel: {
      width: "100%",
    },

    desktopFormPanel: {
      flex: 0.92,

      justifyContent:
        "center",

      backgroundColor:
        colors.white,
    },

    formContainer: {
      width: "100%",

      maxWidth: 470,

      alignSelf:
        "center",

      paddingHorizontal:
        spacing.md,

      paddingVertical:
        spacing.xl,
    },

    mobileLogo: {
      marginBottom:
        spacing.xxxl,
    },

    backToMainButton: {
      alignSelf:
        "flex-start",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 7,

      marginBottom:
        spacing.xl,

      paddingHorizontal:
        12,

      paddingVertical: 9,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius:
        radius.md,

      backgroundColor:
        colors.white,
    },

    backToMainButtonPressed: {
      opacity: 0.7,
    },

    backToMainText: {
      color:
        colors.primary,

      fontSize: 12,

      fontWeight:
        "800",
    },

    portalLabel: {
      color:
        colors.primary,

      fontSize: 10,

      fontWeight:
        "900",

      letterSpacing:
        1.8,
    },

    title: {
      ...typography.displayMedium,

      marginTop:
        spacing.md,

      color:
        colors.textPrimary,
    },

    smallTitle: {
      fontSize: 31,

      lineHeight: 38,
    },

    subtitle: {
      ...typography.bodyMedium,

      maxWidth: 410,

      marginTop:
        spacing.sm,

      color:
        colors.textSecondary,
    },

    form: {
      marginTop:
        spacing.xxl,

      gap:
        spacing.lg,
    },

    fieldLabel: {
      ...typography.label,

      marginBottom:
        spacing.sm,

      color:
        colors.textPrimary,
    },

    input: {
      backgroundColor:
        colors.white,

      fontSize: 14,
    },

    inputContent: {
      minHeight: 54,
    },

    passwordHeading: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    forgotPassword: {
      marginBottom:
        spacing.sm,

      color:
        colors.primary,

      fontSize: 12,

      fontWeight:
        "700",
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

      paddingHorizontal:
        13,

      paddingVertical:
        12,

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

    rememberContainer: {
      flexDirection:
        "row",

      alignItems:
        "center",

      alignSelf:
        "flex-start",

      marginLeft: -8,
    },

    rememberText: {
      flexShrink: 1,

      color:
        colors.textSecondary,

      fontSize: 12,
    },

    signInButton: {
      borderRadius:
        radius.md,
    },

    signInButtonContent: {
      minHeight: 55,

      flexDirection:
        "row-reverse",
    },

    signInButtonLabel: {
      fontSize: 15,

      fontWeight:
        "800",
    },

    secureCard: {
      flexDirection:
        "row",

      gap: 12,

      padding:
        spacing.lg,

      backgroundColor:
        colors.primaryLight,

      borderWidth: 1,

      borderColor:
        "#CDE2E8",

      borderRadius:
        radius.lg,
    },

    secureIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        colors.white,
    },

    secureInformation: {
      flex: 1,
    },

    secureTitle: {
      color:
        colors.textPrimary,

      fontSize: 13,

      fontWeight:
        "800",
    },

    secureDescription: {
      marginTop: 3,

      color:
        colors.textSecondary,

      fontSize: 11,

      lineHeight: 17,
    },

    registerContainer: {
      alignItems:
        "center",

      gap:
        spacing.sm,

      paddingTop:
        spacing.sm,
    },

    registerQuestion: {
      color:
        colors.textSecondary,

      fontSize: 12,

      textAlign:
        "center",
    },

    registerButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 7,

      minHeight: 46,

      width: "100%",

      paddingHorizontal:
        spacing.md,

      borderWidth: 1,

      borderColor:
        colors.primary,

      borderRadius:
        radius.md,

      backgroundColor:
        colors.white,
    },

    registerButtonPressed: {
      opacity: 0.72,
    },

    registerButtonText: {
      color:
        colors.primary,

      fontSize: 13,

      fontWeight:
        "900",
    },

    securityContainer: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 6,

      marginTop:
        spacing.xl,
    },

    securityText: {
      color:
        colors.textMuted,

      fontSize: 10,
    },

    copyright: {
      marginTop:
        spacing.lg,

      color:
        colors.textMuted,

      fontSize: 10,

      textAlign:
        "center",
    },

    backgroundCircleOne: {
      position:
        "absolute",

      top: -180,

      right: -130,

      width: 420,

      height: 420,

      borderRadius: 210,

      backgroundColor:
        "rgba(15,92,115,0.055)",
    },

    backgroundCircleTwo: {
      position:
        "absolute",

      bottom: -130,

      left: -100,

      width: 300,

      height: 300,

      borderRadius: 150,

      backgroundColor:
        "rgba(199,154,59,0.05)",
    },
  });