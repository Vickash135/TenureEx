import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Button,
  Checkbox,
  TextInput,
} from "react-native-paper";

import Animated, {
  FadeInUp,
} from "react-native-reanimated";

import {
  getAgentApplicationId,
  getAgentOnboardingToken,
} from "../../../src/auth/agent-onboarding-storage";

import TenureExLogo from "../../../src/components/Logo/TenureExLogo";

import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

const STATUS_ROUTE =
  "/auth/agent/application-status" as Href;

const DIRECT_DEBIT_ROUTE =
  "/auth/agent/direct-debit" as Href;

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000/api/v1"
    : "http://localhost:3000/api/v1";

type Agreement = {
  id: string;

  applicationId: string;

  agreementType: string;

  status: string;

  title: string;

  version: string;

  documentUrl?: string | null;

  termsSnapshot?: {
    businessName?: string;

    applicantName?: string;

    applicationId?: string;

    companyNumber?: string;

    registrationType?: string;
  };

  sentAt?: string | null;

  viewedAt?: string | null;

  signedAt?: string | null;

  expiresAt?: string | null;

  signatureName?: string | null;
};

type SignAgreementResponse = {
  message: string;

  agreement: Agreement;

  nextStep?: string;
};

async function parseResponse(
  response: Response,
) {
  let data: any;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "TenureEx returned an invalid response.",
    );
  }

  if (!response.ok) {
    const message =
      Array.isArray(
        data?.message,
      )
        ? data.message.join(
            "\n",
          )
        : typeof data?.message ===
            "string"
          ? data.message
          : "Unable to process the agreement.";

    throw new Error(
      message,
    );
  }

  return data;
}

export default function AgentAgreementRoute() {
  const [
    agreement,
    setAgreement,
  ] =
    useState<Agreement | null>(
      null,
    );

  const [
    signatureName,
    setSignatureName,
  ] = useState("");

  const [
    accepted,
    setAccepted,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    signing,
    setSigning,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const loadAgreement =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          const applicationId =
            await getAgentApplicationId();

          const token =
            await getAgentOnboardingToken();

          if (!applicationId) {
            throw new Error(
              "Your Estate Agent application could not be found.",
            );
          }

          if (!token) {
            throw new Error(
              "Your onboarding session is missing or expired.",
            );
          }

          const response =
            await fetch(
              `${API_BASE_URL}/agent-onboarding/${applicationId}/agreement`,
              {
                method:
                  "GET",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          const data =
            (await parseResponse(
              response,
            )) as Agreement;

          setAgreement(
            data,
          );

          if (
            data.signatureName
          ) {
            setSignatureName(
              data.signatureName,
            );
          } else if (
            data.termsSnapshot
              ?.applicantName
          ) {
            setSignatureName(
              data
                .termsSnapshot
                .applicantName,
            );
          }
        } catch (err) {
          setError(
            err instanceof
              Error
              ? err.message
              : "Unable to load the agreement.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    loadAgreement();
  }, [loadAgreement]);

  const handleSign =
    async () => {
      const cleanName =
        signatureName.trim();

      if (!cleanName) {
        setError(
          "Please enter your full name as your digital signature.",
        );

        return;
      }

      if (!accepted) {
        setError(
          "Please confirm that you have read and agree to the TenureEx Estate Agent Service Agreement.",
        );

        return;
      }

      try {
        setSigning(
          true,
        );

        setError("");

        const applicationId =
          await getAgentApplicationId();

        const token =
          await getAgentOnboardingToken();

        if (
          !applicationId ||
          !token
        ) {
          throw new Error(
            "Your onboarding session could not be found.",
          );
        }

        /*
        IMPORTANT:
        Backend DTO accepts ONLY signatureName.
        Do not send accepted.
        */

        const response =
          await fetch(
            `${API_BASE_URL}/agent-onboarding/${applicationId}/agreement/sign`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  {
                    signatureName:
                      cleanName,
                  },
                ),
            },
          );

        const data =
          (await parseResponse(
            response,
          )) as SignAgreementResponse;

        setAgreement(
          data.agreement,
        );

        router.replace(
          DIRECT_DEBIT_ROUTE,
        );
      } catch (err) {
        setError(
          err instanceof
            Error
            ? err.message
            : "Unable to sign the agreement.",
        );
      } finally {
        setSigning(
          false,
        );
      }
    };

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={
            colors.primary
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading your
          agreement...
        </Text>
      </View>
    );
  }

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
                450,
              )
            }
            style={
              styles.card
            }
          >
            <View
              style={
                styles.header
              }
            >
              <TenureExLogo />

              <Button
                mode="text"
                icon="arrow-left"
                onPress={() =>
                  router.replace(
                    STATUS_ROUTE,
                  )
                }
                textColor={
                  colors.primary
                }
              >
                Status
              </Button>
            </View>

            <View
              style={
                styles.iconContainer
              }
            >
              <MaterialCommunityIcons
                name="file-sign"
                size={
                  36
                }
                color={
                  colors.primary
                }
              />
            </View>

            <Text
              style={
                styles.eyebrow
              }
            >
              ESTATE AGENT
              ONBOARDING
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Service agreement
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Review your
              TenureEx Estate
              Agent Service
              Agreement before
              signing.
            </Text>

            {error ? (
              <View
                style={
                  styles.errorCard
                }
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={
                    21
                  }
                  color={
                    colors.error
                  }
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {agreement ? (
              <>
                <View
                  style={
                    styles.document
                  }
                >
                  <View
                    style={
                      styles.documentHeader
                    }
                  >
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={
                        26
                      }
                      color={
                        colors.primary
                      }
                    />

                    <View
                      style={{
                        flex:
                          1,
                      }}
                    >
                      <Text
                        style={
                          styles.documentTitle
                        }
                      >
                        {
                          agreement.title
                        }
                      </Text>

                      <Text
                        style={
                          styles.documentVersion
                        }
                      >
                        Version{" "}
                        {
                          agreement.version
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.statusBadge
                      }
                    >
                      <Text
                        style={
                          styles.statusBadgeText
                        }
                      >
                        {
                          agreement.status
                        }
                      </Text>
                    </View>
                  </View>

                  <AgreementRow
                    label="Applicant"
                    value={
                      agreement
                        .termsSnapshot
                        ?.applicantName ??
                      "-"
                    }
                  />

                  <AgreementRow
                    label="Business"
                    value={
                      agreement
                        .termsSnapshot
                        ?.businessName ??
                      "-"
                    }
                  />

                  <AgreementRow
                    label="Company number"
                    value={
                      agreement
                        .termsSnapshot
                        ?.companyNumber ??
                      "-"
                    }
                  />

                  <AgreementRow
                    label="Registration type"
                    value={
                      agreement
                        .termsSnapshot
                        ?.registrationType ??
                      "-"
                    }
                  />

                  <AgreementRow
                    label="Application ID"
                    value={
                      agreement.applicationId
                    }
                  />

                  {agreement.sentAt ? (
                    <AgreementRow
                      label="Sent"
                      value={
                        formatDate(
                          agreement.sentAt,
                        )
                      }
                    />
                  ) : null}

                  {agreement.expiresAt ? (
                    <AgreementRow
                      label="Agreement expires"
                      value={
                        formatDate(
                          agreement.expiresAt,
                        )
                      }
                    />
                  ) : null}
                </View>

                <View
                  style={
                    styles.termsCard
                  }
                >
                  <Text
                    style={
                      styles.termsTitle
                    }
                  >
                    Agreement
                    declaration
                  </Text>

                  <Text
                    style={
                      styles.termsText
                    }
                  >
                    By signing this
                    agreement you
                    confirm that the
                    registration
                    information
                    supplied to
                    TenureEx is
                    accurate and
                    that you are
                    authorised to
                    act on behalf of
                    the registered
                    Estate Agent
                    business where
                    applicable.
                  </Text>

                  <Text
                    style={
                      styles.termsText
                    }
                  >
                    You agree to use
                    the TenureEx
                    platform in
                    accordance with
                    the applicable
                    service terms,
                    privacy
                    requirements and
                    platform
                    policies.
                  </Text>
                </View>

                {agreement.status ===
                "SIGNED" ? (
                  <View
                    style={
                      styles.successCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={
                        24
                      }
                      color={
                        colors.success
                      }
                    />

                    <View
                      style={{
                        flex:
                          1,
                      }}
                    >
                      <Text
                        style={
                          styles.successTitle
                        }
                      >
                        Agreement
                        signed
                      </Text>

                      <Text
                        style={
                          styles.successText
                        }
                      >
                        Signed by{" "}
                        {
                          agreement.signatureName
                        }
                        {agreement.signedAt
                          ? ` on ${formatDate(
                              agreement.signedAt,
                            )}`
                          : ""}
                        .
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text
                      style={
                        styles.fieldLabel
                      }
                    >
                      Digital
                      signature
                    </Text>

                    <TextInput
                      value={
                        signatureName
                      }
                      onChangeText={(
                        value,
                      ) => {
                        setSignatureName(
                          value,
                        );

                        setError(
                          "",
                        );
                      }}
                      mode="outlined"
                      placeholder="Enter your full legal name"
                      left={
                        <TextInput.Icon
                          icon="draw"
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

                    <Pressable
                      style={
                        styles.checkboxRow
                      }
                      onPress={() =>
                        setAccepted(
                          (
                            current,
                          ) =>
                            !current,
                        )
                      }
                    >
                      <Checkbox
                        status={
                          accepted
                            ? "checked"
                            : "unchecked"
                        }
                        onPress={() =>
                          setAccepted(
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
                        I have read
                        and agree to
                        the TenureEx
                        Estate Agent
                        Service
                        Agreement and
                        confirm that
                        typing my
                        name above
                        represents my
                        digital
                        signature.
                      </Text>
                    </Pressable>

                    <Button
                      mode="contained"
                      icon="file-sign"
                      onPress={
                        handleSign
                      }
                      loading={
                        signing
                      }
                      disabled={
                        signing
                      }
                      buttonColor={
                        colors.primary
                      }
                      contentStyle={
                        styles.buttonContent
                      }
                      style={
                        styles.primaryButton
                      }
                    >
                      Sign agreement
                    </Button>
                  </>
                )}

                {agreement.status ===
                "SIGNED" ? (
                  <Button
                    mode="contained"
                    icon="arrow-right"
                    onPress={() =>
                      router.replace(
                        DIRECT_DEBIT_ROUTE,
                      )
                    }
                    buttonColor={
                      colors.primary
                    }
                    contentStyle={
                      styles.buttonContent
                    }
                    style={
                      styles.primaryButton
                    }
                  >
                    Continue to
                    Direct Debit
                  </Button>
                ) : null}
              </>
            ) : (
              <Button
                mode="contained"
                onPress={
                  loadAgreement
                }
                buttonColor={
                  colors.primary
                }
                style={
                  styles.primaryButton
                }
              >
                Try again
              </Button>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function AgreementRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <View
      style={
        styles.agreementRow
      }
    >
      <Text
        style={
          styles.agreementLabel
        }
      >
        {label}
      </Text>

      <Text
        selectable
        style={
          styles.agreementValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
    },

    loadingContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        spacing.md,

      backgroundColor:
        colors.background,
    },

    loadingText: {
      color:
        colors.textSecondary,
    },

    scrollContent: {
      flexGrow: 1,

      alignItems:
        "center",

      padding:
        spacing.lg,

      paddingVertical:
        spacing.xxxl,
    },

    card: {
      width:
        "100%",

      maxWidth:
        760,

      padding: 36,

      backgroundColor:
        colors.white,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 26,

      shadowColor:
        "#102B3A",

      shadowOpacity:
        0.1,

      shadowRadius:
        30,

      shadowOffset: {
        width: 0,

        height: 12,
      },

      elevation: 7,
    },

    header: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    iconContainer: {
      width: 70,

      height: 70,

      marginTop:
        spacing.xxxl,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius: 22,

      backgroundColor:
        colors.primaryLight,
    },

    eyebrow: {
      marginTop:
        spacing.xl,

      color:
        colors.primary,

      fontSize: 10,

      fontWeight:
        "900",

      letterSpacing:
        1.5,
    },

    title: {
      ...typography.headingLarge,

      marginTop:
        spacing.sm,

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

    document: {
      marginTop:
        spacing.xxl,

      overflow:
        "hidden",

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius:
        radius.lg,

      backgroundColor:
        "#F8FAFB",
    },

    documentHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        spacing.md,

      padding:
        spacing.lg,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.border,
    },

    documentTitle: {
      color:
        colors.textPrimary,

      fontSize: 15,

      fontWeight:
        "900",
    },

    documentVersion: {
      marginTop: 3,

      color:
        colors.textMuted,

      fontSize: 10,
    },

    statusBadge: {
      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius:
        999,

      backgroundColor:
        colors.primaryLight,
    },

    statusBadgeText: {
      color:
        colors.primary,

      fontSize: 9,

      fontWeight:
        "900",
    },

    agreementRow: {
      flexDirection:
        "row",

      gap:
        spacing.lg,

      padding:
        spacing.md,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.border,
    },

    agreementLabel: {
      width: 140,

      color:
        colors.textMuted,

      fontSize: 11,

      fontWeight:
        "700",
    },

    agreementValue: {
      flex: 1,

      color:
        colors.textPrimary,

      fontSize: 12,

      fontWeight:
        "800",
    },

    termsCard: {
      gap:
        spacing.md,

      marginTop:
        spacing.xl,

      padding:
        spacing.lg,

      borderRadius:
        radius.lg,

      backgroundColor:
        colors.primaryLight,
    },

    termsTitle: {
      color:
        colors.textPrimary,

      fontSize: 13,

      fontWeight:
        "900",
    },

    termsText: {
      color:
        colors.textSecondary,

      fontSize: 12,

      lineHeight: 19,
    },

    fieldLabel: {
      ...typography.label,

      marginTop:
        spacing.xl,

      marginBottom:
        spacing.sm,

      color:
        colors.textPrimary,
    },

    input: {
      backgroundColor:
        colors.white,
    },

    checkboxRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginTop:
        spacing.md,

      marginLeft: -8,
    },

    checkboxText: {
      flex: 1,

      paddingTop: 8,

      color:
        colors.textSecondary,

      fontSize: 12,

      lineHeight: 18,
    },

    primaryButton: {
      marginTop:
        spacing.xl,

      borderRadius:
        radius.md,
    },

    buttonContent: {
      minHeight: 52,
    },

    errorCard: {
      flexDirection:
        "row",

      gap:
        spacing.md,

      marginTop:
        spacing.lg,

      padding:
        spacing.md,

      borderWidth: 1,

      borderColor:
        "#FECDCA",

      borderRadius:
        radius.md,

      backgroundColor:
        "#FEF3F2",
    },

    errorText: {
      flex: 1,

      color:
        colors.error,

      fontSize: 12,

      lineHeight: 18,
    },

    successCard: {
      flexDirection:
        "row",

      gap:
        spacing.md,

      marginTop:
        spacing.xl,

      padding:
        spacing.lg,

      borderRadius:
        radius.lg,

      backgroundColor:
        colors.successLight,
    },

    successTitle: {
      color:
        colors.textPrimary,

      fontSize: 13,

      fontWeight:
        "900",
    },

    successText: {
      marginTop: 4,

      color:
        colors.textSecondary,

      fontSize: 12,

      lineHeight: 18,
    },
  });