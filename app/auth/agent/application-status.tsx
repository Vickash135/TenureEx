import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Button } from "react-native-paper";

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

const LOGIN_ROUTE =
    "/auth/agent/login" as Href;

const AGREEMENT_ROUTE =
    "/auth/agent/agreement" as Href;

const DIRECT_DEBIT_ROUTE =
    "/auth/agent/direct-debit" as Href;

const API_BASE_URL = (
    process.env.EXPO_PUBLIC_API_URL ??
    (Platform.OS === "android"
        ? "http://10.0.2.2:3000/api/v1"
        : "http://localhost:3000/api/v1")
).replace(/\/+$/, "");

type AgreementSummary = {
    id: string;
    status: string;
    title?: string;
    sentAt?: string | null;
    signedAt?: string | null;
};

type DirectDebitSummary = {
    id: string;
    status: string;
    submittedAt?: string | null;
    validatedAt?: string | null;
    failureReason?: string | null;
};

type ApplicationStatusResponse = {
    id: string;

    applicantUserId?: string;

    registrationType?: string;

    applicantName?: string;

    businessName?: string | null;

    companyNumber?: string | null;

    contactEmail?: string;

    contactPhone?: string;

    status: string;

    submittedAt?: string | null;

    reviewStartedAt?: string | null;

    reviewedAt?: string | null;

    approvedAt?: string | null;

    rejectedAt?: string | null;

    rejectionReason?: string | null;

    additionalInfoRequest?: string | null;

    estimatedProcessingDays?: number | null;

    agreements?: AgreementSummary[];

    directDebitSetup?: DirectDebitSummary | null;
};

async function requestStatus(
    applicationId: string,
    token: string,
): Promise<ApplicationStatusResponse> {
    const response = await fetch(
        `${API_BASE_URL}/agent-registration/${applicationId}/status`,
        {
            method: "GET",

            headers: {
                "Content-Type": "application/json",

                Authorization:
                    `Bearer ${token}`,
            },
        },
    );

    let data: any;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "TenureEx returned an invalid response.",
        );
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "Your registration session has expired. Please restart verification to continue.",
            );
        }

        const message =
            Array.isArray(data?.message)
                ? data.message.join("\n")
                : typeof data?.message === "string"
                    ? data.message
                    : "Unable to load your application.";

        throw new Error(message);
    }

    return data as ApplicationStatusResponse;
}

export default function AgentApplicationStatusRoute() {
    const [
        application,
        setApplication,
    ] =
        useState<ApplicationStatusResponse | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const loadStatus =
        useCallback(
            async (
                manual = false,
            ) => {
                try {
                    if (manual) {
                        setRefreshing(true);
                    } else {
                        setLoading(true);
                    }

                    setError("");

                    const applicationId =
                        await getAgentApplicationId();

                    const onboardingToken =
                        await getAgentOnboardingToken();

                    if (!applicationId) {
                        throw new Error(
                            "No Estate Agent application was found on this device.",
                        );
                    }

                    if (!onboardingToken) {
                        throw new Error(
                            "Your Estate Agent onboarding session could not be found.",
                        );
                    }

                    const data =
                        await requestStatus(
                            applicationId,
                            onboardingToken,
                        );

                    setApplication(data);
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load application status.",
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [],
        );

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const status =
        application?.status ?? "";

    const latestAgreement =
        application?.agreements?.[
        0
        ];

    const directDebit =
        application?.directDebitSetup;

    const screen =
        getStatusDisplay(
            status,
            latestAgreement?.status,
            directDebit?.status,
        );

    const handleContinue =
        () => {
            if (
                status ===
                "AUTHORISED" ||
                status ===
                "AGREEMENT_SENT"
            ) {
                router.push(
                    AGREEMENT_ROUTE,
                );

                return;
            }

            if (
                status ===
                "AGREEMENT_SIGNED" ||
                status ===
                "PAYMENT_SETUP_PENDING"
            ) {
                router.push(
                    DIRECT_DEBIT_ROUTE,
                );

                return;
            }

            if (
                status ===
                "APPROVED"
            ) {
                router.replace(
                    LOGIN_ROUTE,
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
                    color={colors.primary}
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading your
                    application...
                </Text>
            </View>
        );
    }

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
                                icon="login"
                                onPress={() =>
                                    router.replace(
                                        LOGIN_ROUTE,
                                    )
                                }
                                textColor={
                                    colors.primary
                                }
                            >
                                Sign in
                            </Button>
                        </View>

                        <View
                            style={[
                                styles.mainIcon,

                                {
                                    backgroundColor:
                                        screen.background,
                                },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={
                                    screen.icon
                                }
                                size={38}
                                color={
                                    screen.color
                                }
                            />
                        </View>

                        <Text
                            style={
                                styles.eyebrow
                            }
                        >
                            ESTATE AGENT
                            APPLICATION
                        </Text>

                        <Text
                            style={
                                styles.title
                            }
                        >
                            {screen.title}
                        </Text>

                        <Text
                            style={
                                styles.description
                            }
                        >
                            {
                                screen.description
                            }
                        </Text>

                        {error ? (
                            <ErrorCard
                                message={
                                    error
                                }
                            />
                        ) : null}

                        {application ? (
                            <>
                                <View
                                    style={
                                        styles.summaryCard
                                    }
                                >
                                    <SummaryRow
                                        label="Applicant"
                                        value={
                                            application.applicantName ??
                                            "Estate Agent applicant"
                                        }
                                    />

                                    {application.businessName ? (
                                        <SummaryRow
                                            label="Business"
                                            value={
                                                application.businessName
                                            }
                                        />
                                    ) : null}

                                    {application.companyNumber ? (
                                        <SummaryRow
                                            label="Company number"
                                            value={
                                                application.companyNumber
                                            }
                                        />
                                    ) : null}

                                    {application.contactEmail ? (
                                        <SummaryRow
                                            label="Email"
                                            value={
                                                application.contactEmail
                                            }
                                        />
                                    ) : null}

                                    <SummaryRow
                                        label="Status"
                                        value={
                                            formatStatus(
                                                status,
                                            )
                                        }
                                    />

                                    {application.submittedAt ? (
                                        <SummaryRow
                                            label="Submitted"
                                            value={
                                                formatDate(
                                                    application.submittedAt,
                                                )
                                            }
                                        />
                                    ) : null}
                                </View>

                                {application.estimatedProcessingDays ? (
                                    <View
                                        style={
                                            styles.infoCard
                                        }
                                    >
                                        <MaterialCommunityIcons
                                            name="clock-outline"
                                            size={
                                                21
                                            }
                                            color={
                                                colors.primary
                                            }
                                        />

                                        <Text
                                            style={
                                                styles.infoText
                                            }
                                        >
                                            Estimated
                                            processing
                                            time:{" "}
                                            {
                                                application.estimatedProcessingDays
                                            }{" "}
                                            business
                                            days.
                                        </Text>
                                    </View>
                                ) : null}

                                {application.additionalInfoRequest ? (
                                    <View
                                        style={
                                            styles.warningCard
                                        }
                                    >
                                        <MaterialCommunityIcons
                                            name="file-alert-outline"
                                            size={
                                                22
                                            }
                                            color="#B54708"
                                        />

                                        <View
                                            style={{
                                                flex:
                                                    1,
                                            }}
                                        >
                                            <Text
                                                style={
                                                    styles.warningTitle
                                                }
                                            >
                                                More
                                                information
                                                required
                                            </Text>

                                            <Text
                                                style={
                                                    styles.warningText
                                                }
                                            >
                                                {
                                                    application.additionalInfoRequest
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                ) : null}

                                {application.rejectionReason ? (
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

                                        <View
                                            style={{
                                                flex:
                                                    1,
                                            }}
                                        >
                                            <Text
                                                style={
                                                    styles.errorTitle
                                                }
                                            >
                                                Rejection
                                                reason
                                            </Text>

                                            <Text
                                                style={
                                                    styles.errorText
                                                }
                                            >
                                                {
                                                    application.rejectionReason
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                ) : null}

                                <View
                                    style={
                                        styles.timeline
                                    }
                                >
                                    <TimelineItem
                                        title="Application submitted"
                                        icon="file-check-outline"
                                        completed={
                                            Boolean(
                                                application.submittedAt,
                                            )
                                        }
                                    />

                                    <TimelineItem
                                        title="TenureEx review"
                                        icon="account-search-outline"
                                        completed={[
                                            "AUTHORISED",
                                            "AGREEMENT_SENT",
                                            "AGREEMENT_SIGNED",
                                            "PAYMENT_SETUP_PENDING",
                                            "APPROVED",
                                        ].includes(
                                            status,
                                        )}
                                    />

                                    <TimelineItem
                                        title="Service agreement"
                                        icon="file-sign"
                                        completed={
                                            latestAgreement?.status ===
                                            "SIGNED" ||
                                            [
                                                "AGREEMENT_SIGNED",
                                                "PAYMENT_SETUP_PENDING",
                                                "APPROVED",
                                            ].includes(
                                                status,
                                            )
                                        }
                                    />

                                    <TimelineItem
                                        title="Direct Debit"
                                        icon="bank-outline"
                                        completed={
                                            directDebit?.status ===
                                            "ACTIVE" ||
                                            status ===
                                            "APPROVED"
                                        }
                                    />

                                    <TimelineItem
                                        title="Account activation"
                                        icon="check-decagram-outline"
                                        completed={
                                            status ===
                                            "APPROVED"
                                        }
                                        last
                                    />
                                </View>

                                {shouldShowContinue(
                                    status,
                                ) ? (
                                    <Button
                                        mode="contained"
                                        icon="arrow-right"
                                        onPress={
                                            handleContinue
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
                                        {getContinueText(
                                            status,
                                        )}
                                    </Button>
                                ) : null}

                                <Button
                                    mode="outlined"
                                    icon="refresh"
                                    onPress={() =>
                                        loadStatus(
                                            true,
                                        )
                                    }
                                    loading={
                                        refreshing
                                    }
                                    disabled={
                                        refreshing
                                    }
                                    textColor={
                                        colors.primary
                                    }
                                    contentStyle={
                                        styles.buttonContent
                                    }
                                    style={
                                        styles.refreshButton
                                    }
                                >
                                    Refresh status
                                </Button>
                            </>
                        ) : (
                            <Button
                                mode="contained"
                                onPress={() =>
                                    loadStatus()
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

function ErrorCard({
    message,
}: {
    message: string;
}) {
    return (
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
                    styles.errorText
                }
            >
                {message}
            </Text>
        </View>
    );
}

function TimelineItem({
    title,
    icon,
    completed,
    last = false,
}: {
    title: string;

    icon:
    keyof typeof MaterialCommunityIcons.glyphMap;

    completed: boolean;

    last?: boolean;
}) {
    return (
        <View
            style={
                styles.timelineItem
            }
        >
            <View
                style={
                    styles.timelineLeft
                }
            >
                <View
                    style={[
                        styles.timelineCircle,

                        completed &&
                        styles.timelineCircleComplete,
                    ]}
                >
                    <MaterialCommunityIcons
                        name={
                            completed
                                ? "check"
                                : icon
                        }
                        size={17}
                        color={
                            completed
                                ? colors.white
                                : colors.textMuted
                        }
                    />
                </View>

                {!last ? (
                    <View
                        style={[
                            styles.timelineLine,

                            completed &&
                            styles.timelineLineComplete,
                        ]}
                    />
                ) : null}
            </View>

            <Text
                style={[
                    styles.timelineText,

                    completed &&
                    styles.timelineTextComplete,
                ]}
            >
                {title}
            </Text>
        </View>
    );
}

function shouldShowContinue(
    status: string,
) {
    return [
        "AUTHORISED",
        "AGREEMENT_SENT",
        "PAYMENT_SETUP_PENDING",
        "APPROVED",
    ].includes(status);
}

function getContinueText(
    status: string,
) {
    if (
        status ===
        "AUTHORISED" ||
        status ===
        "AGREEMENT_SENT"
    ) {
        return "Review agreement";
    }

    if (
        status ===
        "PAYMENT_SETUP_PENDING"
    ) {
        return "Continue Direct Debit setup";
    }

    return "Continue to sign in";
}

function getStatusDisplay(
    status: string,
    agreementStatus?: string,
    directDebitStatus?: string,
) {
    if (
        directDebitStatus ===
        "SUBMITTED"
    ) {
        return {
            title:
                "Direct Debit submitted",

            description:
                "Your Direct Debit information has been submitted and is awaiting TenureEx validation.",

            icon:
                "bank-outline" as const,
            color:
                colors.primary,

            background:
                colors.primaryLight,
        };
    }

    if (
        agreementStatus ===
        "SIGNED" &&
        status ===
        "AGREEMENT_SENT"
    ) {
        return {
            title:
                "Agreement signed",

            description:
                "Your agreement has been signed. Please wait for TenureEx Admin to send the Direct Debit request.",

            icon:
                "file-check-outline" as const,

            color:
                colors.success,

            background:
                colors.successLight,
        };
    }

    switch (status) {
        case "PENDING_REVIEW":
            return {
                title:
                    "Application received",

                description:
                    "Your Estate Agent application has been submitted and is waiting for TenureEx review.",

                icon:
                    "clock-outline" as const,

                color:
                    colors.primary,

                background:
                    colors.primaryLight,
            };

        case "UNDER_REVIEW":
            return {
                title:
                    "Application under review",

                description:
                    "The TenureEx team is currently reviewing your Estate Agent application.",

                icon:
                    "account-search-outline" as const,

                color:
                    colors.primary,

                background:
                    colors.primaryLight,
            };

        case "MORE_INFORMATION_REQUIRED":
            return {
                title:
                    "More information required",

                description:
                    "TenureEx needs additional information before continuing with your application.",

                icon:
                    "file-alert-outline" as const,

                color:
                    "#B54708",

                background:
                    "#FFF4E5",
            };

        case "AUTHORISED":
            return {
                title:
                    "Application authorised",

                description:
                    "Your application passed the initial review. TenureEx will now provide your service agreement.",

                icon:
                    "shield-check-outline" as const,

                color:
                    colors.success,

                background:
                    colors.successLight,
            };

        case "AGREEMENT_SENT":
            return {
                title:
                    "Agreement ready",

                description:
                    "Your TenureEx Estate Agent Service Agreement is ready to review and sign.",

                icon:
                    "file-sign" as const,

                color:
                    colors.primary,

                background:
                    colors.primaryLight,
            };

        case "AGREEMENT_SIGNED":
            return {
                title:
                    "Agreement signed",

                description:
                    "Your agreement has been signed successfully. TenureEx Admin will send you a Direct Debit request before you can continue.",

                icon:
                    "file-check-outline" as const,

                color:
                    colors.success,

                background:
                    colors.successLight,
            };

        case "PAYMENT_SETUP_PENDING":
            return {
                title:
                    "Payment setup",

                description:
                    "Complete or wait for validation of your Direct Debit setup.",

                icon:
                    "bank-outline" as const,

                color:
                    colors.primary,

                background:
                    colors.primaryLight,
            };

        case "APPROVED":
            return {
                title:
                    "Estate Agent approved",

                description:
                    "Your Estate Agent application has been approved and your account has been activated.",

                icon:
                    "check-decagram-outline" as const,

                color:
                    colors.success,

                background:
                    colors.successLight,
            };

        case "REJECTED":
            return {
                title:
                    "Application not approved",

                description:
                    "Your Estate Agent application was not approved.",

                icon:
                    "close-circle-outline" as const,

                color:
                    colors.error,

                background:
                    "#FEF3F2",
            };

        default:
            return {
                title:
                    "Application status",

                description:
                    "Your Estate Agent application is being processed.",

                icon:
                    "information-outline" as const,

                color:
                    colors.primary,

                background:
                    colors.primaryLight,
            };
    }
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

            fontSize: 13,
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
                720,

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

            justifyContent:
                "space-between",

            alignItems:
                "center",

            gap:
                spacing.md,
        },

        mainIcon: {
            width: 72,

            height: 72,

            marginTop:
                spacing.xxxl,

            borderRadius: 23,

            alignItems:
                "center",

            justifyContent:
                "center",
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

        summaryCard: {
            marginTop:
                spacing.xxl,

            overflow:
                "hidden",

            backgroundColor:
                "#F8FAFB",

            borderWidth: 1,

            borderColor:
                colors.border,

            borderRadius:
                radius.lg,
        },

        summaryRow: {
            flexDirection:
                "row",

            justifyContent:
                "space-between",

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

            textAlign:
                "right",
        },

        infoCard: {
            flexDirection:
                "row",

            gap:
                spacing.sm,

            marginTop:
                spacing.lg,

            padding:
                spacing.md,

            borderRadius:
                radius.md,

            backgroundColor:
                colors.primaryLight,
        },

        infoText: {
            flex: 1,

            color:
                colors.textSecondary,

            fontSize: 12,

            lineHeight: 18,
        },

        warningCard: {
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
                "#FEDF89",

            borderRadius:
                radius.md,

            backgroundColor:
                "#FFFAEB",
        },

        warningTitle: {
            color:
                "#93370D",

            fontWeight:
                "900",

            fontSize: 12,
        },

        warningText: {
            marginTop: 4,

            color:
                "#B54708",

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

        errorTitle: {
            color:
                colors.error,

            fontSize: 12,

            fontWeight:
                "900",
        },

        errorText: {
            flex: 1,

            color:
                colors.error,

            fontSize: 12,

            lineHeight: 18,
        },

        timeline: {
            marginTop:
                spacing.xxl,

            padding:
                spacing.lg,

            borderWidth: 1,

            borderColor:
                colors.border,

            borderRadius:
                radius.lg,
        },

        timelineItem: {
            minHeight: 61,

            flexDirection:
                "row",

            gap:
                spacing.md,
        },

        timelineLeft: {
            width: 34,

            alignItems:
                "center",
        },

        timelineCircle: {
            width: 34,

            height: 34,

            borderRadius: 17,

            alignItems:
                "center",

            justifyContent:
                "center",

            backgroundColor:
                "#EDF0F2",
        },

        timelineCircleComplete: {
            backgroundColor:
                colors.success,
        },

        timelineLine: {
            width: 2,

            flex: 1,

            backgroundColor:
                colors.border,
        },

        timelineLineComplete: {
            backgroundColor:
                colors.success,
        },

        timelineText: {
            paddingTop: 8,

            color:
                colors.textMuted,

            fontSize: 13,

            fontWeight:
                "700",
        },

        timelineTextComplete: {
            color:
                colors.textPrimary,
        },

        primaryButton: {
            marginTop:
                spacing.xxl,

            borderRadius:
                radius.md,
        },

        refreshButton: {
            marginTop:
                spacing.md,

            borderRadius:
                radius.md,
        },

        buttonContent: {
            minHeight: 52,
        },
    });