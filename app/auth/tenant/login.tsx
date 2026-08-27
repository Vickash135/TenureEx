import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
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
    Snackbar,
    TextInput,
} from "react-native-paper";

import { api, clearAuthSession, saveAuthTokens, saveCurrentUser } from "../../../src/api/client";
import { colors, radius, spacing } from "../../../src/theme";

type LoginForm = {
    email: string;
    password: string;
    rememberMe: boolean;
};

type LoginErrors = {
    email?: string;
    password?: string;
};

export default function TenantLoginScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 850;

    const [form, setForm] = useState<LoginForm>({
        email: "",
        password: "",
        rememberMe: false,
    });

    const [errors, setErrors] = useState<LoginErrors>({});
    const [passwordVisible, setPasswordVisible] =
        useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const updateField = <K extends keyof LoginForm>(
        field: K,
        value: LoginForm[K],
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

    const validateForm = () => {
        const nextErrors: LoginErrors = {};

        if (!form.email.trim()) {
            nextErrors.email = "Email address is required.";
        } else if (!isValidEmail(form.email)) {
            nextErrors.email =
                "Enter a valid email address.";
        }

        if (!form.password) {
            nextErrors.password = "Password is required.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            await clearAuthSession("tenant");

            const response = await api.post("/auth/login", {
                email: form.email.trim().toLowerCase(),
                password: form.password,
            });

            const { user, accessToken, refreshToken } = response.data;
            const accountRoles: string[] = user?.accountRoles ?? [user?.userType];

            if (!accountRoles.includes("TENANT")) {
                await clearAuthSession("tenant");
                setMessage("This account is not registered as a Tenant account.");
                return;
            }

            await saveAuthTokens(accessToken, refreshToken, "tenant");

            const [meResponse, propertiesResponse] = await Promise.all([
                api.get("/auth/me"),
                api.get("/property-workflows/tenant/my-properties"),
            ]);

            const tenantRoles: string[] = meResponse.data?.accountRoles ?? [meResponse.data?.userType];
            if (!tenantRoles.includes("TENANT")) {
                await clearAuthSession("tenant");
                setMessage("You do not have permission to access the Tenant portal.");
                return;
            }

            const approvedProperties = Array.isArray(propertiesResponse.data)
                ? propertiesResponse.data
                : [];

            if (approvedProperties.length === 0) {
                await clearAuthSession("tenant");
                setMessage(
                    "Your tenant registration is not approved for a property yet. Please wait for the Estate Agent to approve your application.",
                );
                return;
            }

            await saveCurrentUser(meResponse.data, "tenant");
            setMessage("Login successful.");
            router.replace("/tenant/dashboard" as never);
        } catch (error: any) {
            await clearAuthSession("tenant");
            const backendMessage = error?.response?.data?.message;
            setMessage(
                Array.isArray(backendMessage)
                    ? backendMessage.join("\n")
                    : typeof backendMessage === "string"
                        ? backendMessage
                        : "Unable to log in. Please check your email and password.",
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
                <View
                    style={[
                        styles.container,
                        !isDesktop && styles.mobileContainer,
                    ]}
                >
                    {isDesktop ? (
                        <View style={styles.informationPanel}>
                            <View style={styles.logo}>
                                <MaterialCommunityIcons
                                    name="home-city-outline"
                                    size={34}
                                    color={colors.white}
                                />
                            </View>

                            <Text style={styles.brandName}>
                                TenureEx
                            </Text>

                            <Text style={styles.panelTitle}>
                                Find and manage your next home
                            </Text>

                            <Text style={styles.panelDescription}>
                                Sign in to view matched properties,
                                manage applications, upload documents,
                                sign agreements and report maintenance
                                issues.
                            </Text>

                            <View style={styles.features}>
                                <FeatureItem
                                    icon="home-search-outline"
                                    text="View suitable property recommendations"
                                />

                                <FeatureItem
                                    icon="file-sign"
                                    text="Review and sign agreements digitally"
                                />

                                <FeatureItem
                                    icon="tools"
                                    text="Report and track maintenance issues"
                                />

                                <FeatureItem
                                    icon="translate"
                                    text="Use a preferred second language"
                                />
                            </View>
                        </View>
                    ) : null}

                    <View style={styles.formPanel}>
                        {!isDesktop ? (
                            <View style={styles.mobileBrand}>
                                <View style={styles.mobileLogo}>
                                    <MaterialCommunityIcons
                                        name="home-city-outline"
                                        size={27}
                                        color={colors.white}
                                    />
                                </View>

                                <View>
                                    <Text style={styles.mobileBrandName}>
                                        TenureEx
                                    </Text>

                                    <Text
                                        style={styles.mobileBrandRole}
                                    >
                                        Tenant Portal
                                    </Text>
                                </View>
                            </View>
                        ) : null}

                        <View style={styles.formHeader}>
                            <Text style={styles.title}>
                                Tenant login
                            </Text>

                            <Text style={styles.subtitle}>
                                Sign in to access your tenant account.
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View>
                                <TextInput
                                    mode="outlined"
                                    label="Email address"
                                    placeholder="tenant@example.com"
                                    value={form.email}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    error={Boolean(errors.email)}
                                    left={
                                        <TextInput.Icon icon="email-outline" />
                                    }
                                    onChangeText={(value) =>
                                        updateField("email", value)
                                    }
                                />

                                <HelperText
                                    type="error"
                                    visible={Boolean(errors.email)}
                                >
                                    {errors.email}
                                </HelperText>
                            </View>

                            <View>
                                <TextInput
                                    mode="outlined"
                                    label="Password"
                                    value={form.password}
                                    secureTextEntry={!passwordVisible}
                                    error={Boolean(errors.password)}
                                    left={
                                        <TextInput.Icon icon="lock-outline" />
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
                                                    (current) => !current,
                                                )
                                            }
                                        />
                                    }
                                    onChangeText={(value) =>
                                        updateField("password", value)
                                    }
                                />

                                <HelperText
                                    type="error"
                                    visible={Boolean(errors.password)}
                                >
                                    {errors.password}
                                </HelperText>
                            </View>

                            <View style={styles.optionsRow}>
                                <View style={styles.rememberRow}>
                                    <Checkbox
                                        status={
                                            form.rememberMe
                                                ? "checked"
                                                : "unchecked"
                                        }
                                        onPress={() =>
                                            updateField(
                                                "rememberMe",
                                                !form.rememberMe,
                                            )
                                        }
                                    />

                                    <Text style={styles.rememberText}>
                                        Remember me
                                    </Text>
                                </View>

                                <Button
                                    mode="text"
                                    compact
                                    onPress={() =>
                                        router.push(
                                            "/auth/tenant/forgot-password" as never,
                                        )
                                    }
                                >
                                    Forgot password?
                                </Button>
                            </View>

                            <Button
                                mode="contained"
                                icon="login"
                                loading={loading}
                                disabled={loading}
                                contentStyle={styles.primaryButton}
                                onPress={handleLogin}
                            >
                                Sign in
                            </Button>

                            <View style={styles.dividerRow}>
                                <View style={styles.divider} />

                                <Text style={styles.dividerText}>
                                    New to TenureEx?
                                </Text>

                                <View style={styles.divider} />
                            </View>

                            <Button
                                mode="outlined"
                                icon="account-plus-outline"
                                contentStyle={styles.secondaryButton}
                                onPress={() =>
                                    router.push(
                                        "/auth/tenant/signup" as never,
                                    )
                                }
                            >
                                Create tenant account
                            </Button>

                            <Text style={styles.privacyText}>
                                By continuing, you agree to the
                                TenureEx Terms and Conditions and
                                acknowledge the Privacy Policy.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Snackbar
                visible={Boolean(message)}
                onDismiss={() => setMessage("")}
                duration={2500}
            >
                {message}
            </Snackbar>
        </KeyboardAvoidingView>
    );
}

function FeatureItem({
    icon,
    text,
}: {
    icon:
    keyof typeof MaterialCommunityIcons.glyphMap;
    text: string;
}) {
    return (
        <View style={styles.feature}>
            <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={colors.white}
                />
            </View>

            <Text style={styles.featureText}>
                {text}
            </Text>
        </View>
    );
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim(),
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },

    page: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.lg,
    },

    container: {
        width: "100%",
        maxWidth: 1080,
        minHeight: 650,
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        backgroundColor: colors.white,
    },

    mobileContainer: {
        maxWidth: 560,
        minHeight: 0,
        flexDirection: "column",
    },

    informationPanel: {
        flex: 1,
        justifyContent: "center",
        padding: 48,
        backgroundColor: colors.primary,
    },

    logo: {
        width: 62,
        height: 62,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.16)",
    },

    brandName: {
        marginTop: spacing.md,
        color: colors.white,
        fontSize: 17,
        fontWeight: "900",
    },

    panelTitle: {
        marginTop: 38,
        color: colors.white,
        fontSize: 30,
        fontWeight: "900",
        lineHeight: 39,
    },

    panelDescription: {
        marginTop: spacing.md,
        color: colors.white,
        fontSize: 12,
        lineHeight: 21,
        opacity: 0.88,
    },

    features: {
        marginTop: 34,
        gap: spacing.md,
    },

    feature: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },

    featureIcon: {
        width: 39,
        height: 39,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.14)",
    },

    featureText: {
        flex: 1,
        color: colors.white,
        fontSize: 10,
        fontWeight: "700",
        lineHeight: 16,
    },

    formPanel: {
        flex: 1,
        justifyContent: "center",
        padding: 46,
    },

    mobileBrand: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.xl,
    },

    mobileLogo: {
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        backgroundColor: colors.primary,
    },

    mobileBrandName: {
        color: colors.textPrimary,
        fontSize: 17,
        fontWeight: "900",
    },

    mobileBrandRole: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: 9,
    },

    formHeader: {
        marginBottom: spacing.xl,
    },

    title: {
        color: colors.textPrimary,
        fontSize: 27,
        fontWeight: "900",
    },

    subtitle: {
        marginTop: spacing.sm,
        color: colors.textMuted,
        fontSize: 11,
        lineHeight: 18,
    },

    form: {
        gap: spacing.sm,
    },

    optionsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
    },

    rememberRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    rememberText: {
        color: colors.textSecondary,
        fontSize: 10,
        fontWeight: "700",
    },

    primaryButton: {
        minHeight: 49,
    },

    secondaryButton: {
        minHeight: 49,
    },

    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginVertical: spacing.md,
    },

    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },

    dividerText: {
        color: colors.textMuted,
        fontSize: 9,
    },

    privacyText: {
        marginTop: spacing.md,
        color: colors.textMuted,
        fontSize: 8,
        lineHeight: 14,
        textAlign: "center",
    },
});