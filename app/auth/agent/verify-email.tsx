import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";

import { getAgentApplicationId } from "../../../src/auth/agent-onboarding-storage";
import TenureExLogo from "../../../src/components/Logo/TenureExLogo";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../../src/theme";

const API_BASE_URL = (
    process.env.EXPO_PUBLIC_API_URL ??
    (Platform.OS === "android"
        ? "http://10.0.2.2:3000/api/v1"
        : "http://localhost:3000/api/v1")
).replace(/\/+$/, "");
export default function VerifyAgentEmailRoute() {
  const params =
    useLocalSearchParams<{
      userId?: string;
      token?: string;
    }>();

  const [loading, setLoading] =
    useState(true);
  const [success, setSuccess] =
    useState(false);
  const [message, setMessage] =
    useState(
      "Verifying your email address...",
    );

  useEffect(() => {
    const verify =
      async () => {
        if (
          !params.userId ||
          !params.token
        ) {
          setLoading(false);
          setMessage(
            "The verification link is incomplete.",
          );
          return;
        }

        try {
          const response =
            await fetch(
              `${API_BASE_URL}/agent-registration/verify-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  userId:
                    params.userId,
                  token:
                    params.token,
                }),
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              typeof data?.message ===
                "string"
                ? data.message
                : "Unable to verify your email.",
            );
          }

          setSuccess(true);
          setMessage(
            "Your email has been verified successfully.",
          );
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to verify your email.",
          );
        } finally {
          setLoading(false);
        }
      };

    void verify();
  }, [
    params.token,
    params.userId,
  ]);

  const continueRegistration =
    async () => {
      const applicationId =
        await getAgentApplicationId();

      if (!applicationId) {
        setMessage(
          "Email verified, but the saved Estate Agent application could not be found on this device. Return to the registration page you started from.",
        );
        return;
      }

      router.replace({
        pathname:
          "/auth/agent/signup",
        params: {
          userId:
            params.userId ?? "",
          applicationId,
          emailVerified:
            "1",
        },
      });
    };

  return (
    <LinearGradient
      colors={[
        "#EAF3F6",
        "#F7F9FA",
        "#FFFFFF",
      ]}
      style={styles.root}
    >
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.card}
        >
          <TenureExLogo />

          {loading ? (
            <ActivityIndicator
              size="large"
              color={
                colors.primary
              }
            />
          ) : (
            <MaterialCommunityIcons
              name={
                success
                  ? "email-check-outline"
                  : "alert-circle-outline"
              }
              size={48}
              color={
                success
                  ? colors.success
                  : colors.error
              }
            />
          )}

          <Text
            style={styles.title}
          >
            {loading
              ? "Verifying email"
              : success
                ? "Email verified"
                : "Verification failed"}
          </Text>

          <Text
            style={
              styles.description
            }
          >
            {message}
          </Text>

          {success ? (
            <Button
              mode="contained"
              icon="arrow-right"
              onPress={() => {
                void continueRegistration();
              }}
              buttonColor={
                colors.primary
              }
            >
              Continue to phone verification
            </Button>
          ) : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding:
        spacing.lg,
    },
    card: {
      width: "100%",
      maxWidth: 560,
      backgroundColor:
        colors.white,
      borderRadius:
        radius.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding:
        spacing.xl,
      gap:
        spacing.lg,
      alignItems: "center",
    },
    title: {
  ...typography.headingLarge,
  color: colors.textPrimary,
  textAlign: "center",
},

description: {
  ...typography.bodyMedium,
  color: colors.textMuted,
  textAlign: "center",
  lineHeight: 22,
},
  });
