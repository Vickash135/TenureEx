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
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    Button,
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

const LOGIN_ROUTE =
    "/auth/agent/login" as Href;

const API_BASE_URL = (
    process.env.EXPO_PUBLIC_API_URL ??
    (Platform.OS === "android"
        ? "http://10.0.2.2:3000/api/v1"
        : "http://localhost:3000/api/v1")
).replace(/\/+$/, "");
type DirectDebit = {
    id: string;

    applicationId: string;

    provider?: string | null;

    providerCustomerReference?: string | null;

    providerMandateReference?: string | null;

    status: string;

    submittedAt?: string | null;

    validatedAt?: string | null;

    failedAt?: string | null;

    failureReason?: string | null;

    createdAt?: string;

    updatedAt?: string;
};

type SubmitResponse = {
    message: string;

    directDebit: DirectDebit;
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
                    : "Unable to process Direct Debit setup.";

        throw new Error(
            message,
        );
    }

    return data;
}

function generateReference(
    prefix: string,
) {
    const timestamp =
        Date.now()
            .toString()
            .slice(-10);

    const random =
        Math.floor(
            1000 +
            Math.random() *
            9000,
        );

    return `${prefix}_${timestamp}_${random}`;
}

export default function AgentDirectDebitRoute() {
    const [
        directDebit,
        setDirectDebit,
    ] =
        useState<DirectDebit | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const startDirectDebit =
        useCallback(
            async () => {
                try {
                    setLoading(
                        true,
                    );

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
                            `${API_BASE_URL}/agent-onboarding/${applicationId}/direct-debit/start`,
                            {
                                method:
                                    "POST",

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
                        )) as DirectDebit;

                    setDirectDebit(
                        data,
                    );
                } catch (err) {
                    setError(
                        err instanceof
                            Error
                            ? err.message
                            : "Unable to start Direct Debit setup.",
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
        startDirectDebit();
    }, [startDirectDebit]);

    const handleSubmit =
        async () => {
            try {
                setSubmitting(
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
                DEVELOPMENT PROVIDER
        
                In production these references will come from
                GoCardless / Stripe / another Direct Debit provider.
        
                Backend currently accepts ONLY these two fields.
                */

                const providerCustomerReference =
                    generateReference(
                        "CUS_DEV",
                    );

                const providerMandateReference =
                    generateReference(
                        "MD_DEV",
                    );

                const response =
                    await fetch(
                        `${API_BASE_URL}/agent-onboarding/${applicationId}/direct-debit/submit`,
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
                                        providerCustomerReference,

                                        providerMandateReference,
                                    },
                                ),
                        },
                    );

                const data =
                    (await parseResponse(
                        response,
                    )) as SubmitResponse;

                setDirectDebit(
                    data.directDebit,
                );
            } catch (err) {
                setError(
                    err instanceof
                        Error
                        ? err.message
                        : "Unable to submit Direct Debit setup.",
                );
            } finally {
                setSubmitting(
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
                    Preparing Direct
                    Debit setup...
                </Text>
            </View>
        );
    }

    const status =
        directDebit?.status ??
        "NOT_STARTED";

    const submitted =
        status ===
        "SUBMITTED" ||
        status ===
        "ACTIVE";

    const active =
        status ===
        "ACTIVE";

    return (
        <LinearGradient
            colors={[
                "#EAF3F6",
                "#F7F9FA",
                "#FFFFFF",
            ]}
            style={
                styles.root
            }
        >
            <SafeAreaView
                style={
                    styles.safeArea
                }
            >
                <ScrollView
                    contentContainerStyle={
                        styles.scrollContent
                    }
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
                                name={
                                    active
                                        ? "bank-check"
                                        : submitted
                                            ? "bank-outline"
                                            : "bank-outline"
                                }
                                size={
                                    38
                                }
                                color={
                                    active
                                        ? colors.success
                                        : colors.primary
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
                            {active
                                ? "Direct Debit active"
                                : submitted
                                    ? "Direct Debit submitted"
                                    : "Direct Debit setup"}
                        </Text>

                        <Text
                            style={
                                styles.description
                            }
                        >
                            {active
                                ? "Your Direct Debit setup has been validated by TenureEx."
                                : submitted
                                    ? "Your Direct Debit information has been submitted and is awaiting TenureEx validation."
                                    : "Complete the payment setup required for your Estate Agent account."}
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

                        <View
                            style={
                                styles.securityCard
                            }
                        >
                            <MaterialCommunityIcons
                                name="shield-lock-outline"
                                size={
                                    24
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
                                        styles.securityTitle
                                    }
                                >
                                    Secure payment
                                    setup
                                </Text>

                                <Text
                                    style={
                                        styles.securityText
                                    }
                                >
                                    TenureEx will use
                                    an authorised
                                    Direct Debit
                                    provider in the
                                    production
                                    system. Bank
                                    account details
                                    should not be
                                    stored directly
                                    inside this
                                    application.
                                </Text>
                            </View>
                        </View>

                        {directDebit ? (
                            <View
                                style={
                                    styles.summaryCard
                                }
                            >
                                <SummaryRow
                                    label="Status"
                                    value={
                                        formatStatus(
                                            directDebit.status,
                                        )
                                    }
                                />

                                <SummaryRow
                                    label="Provider"
                                    value={
                                        directDebit.provider ??
                                        "Development provider"
                                    }
                                />

                                {directDebit.providerCustomerReference ? (
                                    <SummaryRow
                                        label="Customer reference"
                                        value={
                                            directDebit.providerCustomerReference
                                        }
                                    />
                                ) : null}

                                {directDebit.providerMandateReference ? (
                                    <SummaryRow
                                        label="Mandate reference"
                                        value={
                                            directDebit.providerMandateReference
                                        }
                                    />
                                ) : null}

                                {directDebit.submittedAt ? (
                                    <SummaryRow
                                        label="Submitted"
                                        value={
                                            formatDate(
                                                directDebit.submittedAt,
                                            )
                                        }
                                    />
                                ) : null}

                                {directDebit.validatedAt ? (
                                    <SummaryRow
                                        label="Validated"
                                        value={
                                            formatDate(
                                                directDebit.validatedAt,
                                            )
                                        }
                                    />
                                ) : null}
                            </View>
                        ) : null}

                        {directDebit?.failureReason ? (
                            <View
                                style={
                                    styles.errorCard
                                }
                            >
                                <MaterialCommunityIcons
                                    name="close-circle-outline"
                                    size={
                                        22
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
                                    {
                                        directDebit.failureReason
                                    }
                                </Text>
                            </View>
                        ) : null}

                        {!submitted ? (
                            <>
                                <View
                                    style={
                                        styles.developmentCard
                                    }
                                >
                                    <MaterialCommunityIcons
                                        name="code-tags"
                                        size={
                                            21
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
                                                styles.developmentTitle
                                            }
                                        >
                                            Development
                                            mode
                                        </Text>

                                        <Text
                                            style={
                                                styles.developmentText
                                            }
                                        >
                                            For now,
                                            TenureEx will
                                            create
                                            development
                                            customer and
                                            mandate
                                            references.
                                            Later this
                                            button will
                                            redirect the
                                            applicant to
                                            the real
                                            Direct Debit
                                            provider.
                                        </Text>
                                    </View>
                                </View>

                                <Button
                                    mode="contained"
                                    icon="bank-plus"
                                    onPress={
                                        handleSubmit
                                    }
                                    loading={
                                        submitting
                                    }
                                    disabled={
                                        submitting
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
                                    Complete
                                    development
                                    Direct Debit
                                    setup
                                </Button>
                            </>
                        ) : null}

                        {submitted &&
                            !active ? (
                            <View
                                style={
                                    styles.pendingCard
                                }
                            >
                                <MaterialCommunityIcons
                                    name="clock-check-outline"
                                    size={
                                        24
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
                                            styles.pendingTitle
                                        }
                                    >
                                        Awaiting
                                        TenureEx
                                        validation
                                    </Text>

                                    <Text
                                        style={
                                            styles.pendingText
                                        }
                                    >
                                        Your payment
                                        setup has been
                                        submitted. An
                                        administrator
                                        must validate
                                        it before final
                                        account
                                        approval.
                                    </Text>
                                </View>
                            </View>
                        ) : null}

                        {active ? (
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
                                        Direct Debit
                                        validated
                                    </Text>

                                    <Text
                                        style={
                                            styles.successText
                                        }
                                    >
                                        The remaining
                                        step is final
                                        TenureEx
                                        approval.
                                    </Text>
                                </View>
                            </View>
                        ) : null}

                        <Button
                            mode="outlined"
                            icon="clipboard-text-outline"
                            onPress={() =>
                                router.replace(
                                    STATUS_ROUTE,
                                )
                            }
                            textColor={
                                colors.primary
                            }
                            contentStyle={
                                styles.buttonContent
                            }
                            style={
                                styles.secondaryButton
                            }
                        >
                            View application
                            status
                        </Button>

                        {active ? (
                            <Button
                                mode="text"
                                icon="login"
                                onPress={() =>
                                    router.replace(
                                        LOGIN_ROUTE,
                                    )
                                }
                                textColor={
                                    colors.primary
                                }
                                style={
                                    styles.loginButton
                                }
                            >
                                Go to sign in
                            </Button>
                        ) : null}
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

function SummaryRow({
    label,
    value,
}: {
    label: string;

    value: string;
}) {
    return (
        <View
            style={
                styles.summaryRow
            }
        >
            <Text
                style={
                    styles.summaryLabel
                }
            >
                {label}
            </Text>

            <Text
                selectable
                style={
                    styles.summaryValue
                }
            >
                {value}
            </Text>
        </View>
    );
}

function formatStatus(
    value: string,
) {
    return value
        .replace(
            /_/g,
            " ",
        )
        .toLowerCase()
        .replace(
            /\b\w/g,
            (character) =>
                character.toUpperCase(),
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
                700,

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
            width: 72,

            height: 72,

            marginTop:
                spacing.xxxl,

            alignItems:
                "center",

            justifyContent:
                "center",

            borderRadius: 23,

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

        securityCard: {
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
                colors.primaryLight,
        },

        securityTitle: {
            color:
                colors.textPrimary,

            fontSize: 13,

            fontWeight:
                "900",
        },

        securityText: {
            marginTop: 4,

            color:
                colors.textSecondary,

            fontSize: 12,

            lineHeight: 18,
        },

        summaryCard: {
            marginTop:
                spacing.xl,

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

        summaryRow: {
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

        summaryLabel: {
            width: 145,

            color:
                colors.textMuted,

            fontSize: 11,

            fontWeight:
                "700",
        },

        summaryValue: {
            flex: 1,

            color:
                colors.textPrimary,

            fontSize: 12,

            fontWeight:
                "800",
        },

        developmentCard: {
            flexDirection:
                "row",

            gap:
                spacing.md,

            marginTop:
                spacing.xl,

            padding:
                spacing.lg,

            borderWidth: 1,

            borderColor:
                "#CDE2E8",

            borderRadius:
                radius.lg,

            backgroundColor:
                "#F1F8FA",
        },

        developmentTitle: {
            color:
                colors.textPrimary,

            fontSize: 13,

            fontWeight:
                "900",
        },

        developmentText: {
            marginTop: 4,

            color:
                colors.textSecondary,

            fontSize: 12,

            lineHeight: 18,
        },

        pendingCard: {
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
                colors.primaryLight,
        },

        pendingTitle: {
            color:
                colors.textPrimary,

            fontSize: 13,

            fontWeight:
                "900",
        },

        pendingText: {
            marginTop: 4,

            color:
                colors.textSecondary,

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

        errorCard: {
            flexDirection:
                "row",

            gap:
                spacing.md,

            marginTop:
                spacing.lg,

            padding:
                spacing.lg,

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

        primaryButton: {
            marginTop:
                spacing.xl,

            borderRadius:
                radius.md,
        },

        secondaryButton: {
            marginTop:
                spacing.lg,

            borderRadius:
                radius.md,
        },

        loginButton: {
            marginTop:
                spacing.sm,
        },

        buttonContent: {
            minHeight: 52,
        },
    });