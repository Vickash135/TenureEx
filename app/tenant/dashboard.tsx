import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Button,
    Divider,
    ProgressBar
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type TenantStage =
  | "searching"
  | "application-submitted"
  | "application-approved"
  | "agreement-signed"
  | "active-tenancy";

type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under review"
  | "Approved"
  | "Rejected";

type DashboardRoute =
  | "/tenant/preferences"
  | "/tenant/properties"
  | "/tenant/property-details"
  | "/tenant/applications"
  | "/tenant/documents"
  | "/tenant/agreement"
  | "/tenant/my-property"
  | "/tenant/maintenance"
  | "/tenant/payments"
  | "/tenant/messages"
  | "/tenant/settings";

type DashboardAction = {
  title: string;
  description: string;
  icon: IconName;
  route: DashboardRoute;
  visible: boolean;
};

type SuggestedProperty = {
  id: string;
  title: string;
  address: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  matchScore: number;
};

type TenantApplication = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  submittedDate: string;
  status: ApplicationStatus;
};

const tenantProfile = {
  firstName: "Amelia",
  lastName: "Brown",
  email: "amelia.brown@example.com",
  preferredLanguage: "Tamil",

  profileCompletion: 80,

  personalInformationCompleted: true,
  identificationUploaded: true,
  preferencesCompleted: true,
  rightToRentVerified: true,

  applicationSubmitted: true,
  applicationApproved: false,

  agreementAvailable: false,
  agreementSigned: false,

  tenancyActive: false,
};

const suggestedProperties: SuggestedProperty[] = [
  {
    id: "PROP-001",
    title: "Modern Two-Bedroom City Apartment",
    address: "42 King Street, Leeds, LS1 2HQ",
    monthlyRent: 1325,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "Flat",
    matchScore: 94,
  },
  {
    id: "PROP-002",
    title: "Three-Bedroom Family Home",
    address:
      "18 Victoria Road, Manchester, M14 6BT",
    monthlyRent: 1450,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: "House",
    matchScore: 89,
  },
  {
    id: "PROP-003",
    title: "City Centre One-Bedroom Flat",
    address:
      "91 High Street, Birmingham, B4 7SL",
    monthlyRent: 1100,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Flat",
    matchScore: 84,
  },
];

const applications: TenantApplication[] = [
  {
    id: "APP-1001",
    propertyId: "PROP-001",
    propertyTitle:
      "Modern Two-Bedroom City Apartment",
    propertyAddress:
      "42 King Street, Leeds, LS1 2HQ",
    submittedDate: "25 July 2026",
    status: "Under review",
  },
];

export default function TenantDashboardScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;

  const tenantStage = getTenantStage();

  const unreadMessages = 3;

  const currentApplication =
    applications[0] ?? null;

  const nextStep = getNextStep(
    tenantStage,
    currentApplication,
  );

  const visibleActions = useMemo(
    () =>
      getDashboardActions(
        tenantStage,
        currentApplication,
      ).filter((action) => action.visible),
    [tenantStage, currentApplication],
  );

  const stageInformation =
    getStageInformation(tenantStage);

  const showPropertySuggestions =
    tenantStage === "searching" ||
    tenantStage ===
      "application-submitted";

  const showApplicationSection =
    tenantProfile.applicationSubmitted &&
    currentApplication !== null;

  const showActiveTenancy =
    tenantStage === "active-tenancy";

  const handleNextStep = () => {
    if (!nextStep) {
      return;
    }

    router.push({
      pathname: nextStep.route as never,
      params: nextStep.params,
    });
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.brandArea}
            onPress={() =>
              router.replace(
                "/tenant/dashboard" as never,
              )
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={28}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TenureEx
              </Text>

              <Text style={styles.brandSubtitle}>
                Tenant portal
              </Text>
            </View>
          </Pressable>

          <View style={styles.topBarActions}>
            <Pressable
              style={
                styles.notificationButton
              }
              onPress={() =>
                router.push(
                  "/tenant/messages" as never,
                )
              }
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={23}
                color={colors.textPrimary}
              />

              {unreadMessages > 0 ? (
                <View
                  style={
                    styles.notificationBadge
                  }
                >
                  <Text
                    style={
                      styles.notificationBadgeText
                    }
                  >
                    {unreadMessages}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              style={styles.profileButton}
              onPress={() =>
                router.push(
                  "/tenant/settings" as never,
                )
              }
            >
              <View style={styles.profileAvatar}>
                <Text
                  style={
                    styles.profileAvatarText
                  }
                >
                  {tenantProfile.firstName.charAt(
                    0,
                  )}
                  {tenantProfile.lastName.charAt(
                    0,
                  )}
                </Text>
              </View>

              {isTablet ? (
                <View>
                  <Text
                    style={styles.profileName}
                  >
                    {tenantProfile.firstName}{" "}
                    {tenantProfile.lastName}
                  </Text>

                  <Text
                    style={styles.profileRole}
                  >
                    Tenant
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.hero,
            !isTablet && styles.heroMobile,
          ]}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>
              Welcome,{" "}
              {tenantProfile.firstName}
            </Text>

            <Text style={styles.heroTitle}>
              {stageInformation.title}
            </Text>

            <Text
              style={styles.heroDescription}
            >
              {stageInformation.description}
            </Text>

            <View style={styles.heroActions}>
              {nextStep ? (
                <Button
                  mode="contained"
                  icon={nextStep.icon}
                  buttonColor={colors.white}
                  textColor={colors.primary}
                  onPress={handleNextStep}
                >
                  {nextStep.buttonLabel}
                </Button>
              ) : null}

              <Button
                mode="outlined"
                icon="message-text-outline"
                textColor={colors.white}
                style={
                  styles.heroOutlineButton
                }
                onPress={() =>
                  router.push(
                    "/tenant/messages" as never,
                  )
                }
              >
                Messages
              </Button>
            </View>
          </View>

          <View
            style={styles.heroIllustration}
          >
            <MaterialCommunityIcons
              name={stageInformation.icon}
              size={82}
              color={colors.white}
            />

            <Text
              style={
                styles.heroIllustrationText
              }
            >
              {stageInformation.label}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statisticsGrid,
            isDesktop
              ? styles.fourColumns
              : isTablet
                ? styles.twoColumns
                : styles.oneColumn,
          ]}
        >
          <StatisticCard
            title="Profile completion"
            value={`${tenantProfile.profileCompletion}%`}
            helper="Tenant account progress"
            icon="account-check-outline"
          />

          <StatisticCard
            title="Property matches"
            value={`${suggestedProperties.length}`}
            helper="Based on your preferences"
            icon="home-search-outline"
          />

          <StatisticCard
            title="Applications"
            value={`${applications.length}`}
            helper="Property applications"
            icon="clipboard-text-outline"
          />

          <StatisticCard
            title="Current stage"
            value={getShortStageLabel(
              tenantStage,
            )}
            helper="Tenant journey status"
            icon={stageInformation.icon}
            compactValue
          />
        </View>

        <View
          style={[
            styles.mainColumns,
            !isDesktop &&
              styles.mainColumnsStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <SectionHeader
              title="Your progress"
              subtitle="Complete each required stage before your tenancy becomes active."
            />

            <View style={styles.progressCard}>
              <View
                style={styles.progressHeader}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.progressTitle}
                  >
                    Account and tenancy
                    progress
                  </Text>

                  <Text
                    style={
                      styles.progressDescription
                    }
                  >
                    Your available services will
                    change as your application
                    progresses.
                  </Text>
                </View>

                <Text
                  style={
                    styles.progressPercentage
                  }
                >
                  {calculateJourneyProgress()}%
                </Text>
              </View>

              <ProgressBar
                progress={
                  calculateJourneyProgress() /
                  100
                }
                color={colors.primary}
                style={styles.progressBar}
              />

              <View style={styles.checklist}>
                <ChecklistItem
                  title="Personal information"
                  complete={
                    tenantProfile.personalInformationCompleted
                  }
                />

                <ChecklistItem
                  title="Identification uploaded"
                  complete={
                    tenantProfile.identificationUploaded
                  }
                />

                <ChecklistItem
                  title="Property preferences"
                  complete={
                    tenantProfile.preferencesCompleted
                  }
                />

                <ChecklistItem
                  title="Right to Rent verified"
                  complete={
                    tenantProfile.rightToRentVerified
                  }
                />

                <ChecklistItem
                  title="Application submitted"
                  complete={
                    tenantProfile.applicationSubmitted
                  }
                />

                <ChecklistItem
                  title="Application approved"
                  complete={
                    tenantProfile.applicationApproved
                  }
                />

                <ChecklistItem
                  title="Agreement signed"
                  complete={
                    tenantProfile.agreementSigned
                  }
                />

                <ChecklistItem
                  title="Tenancy activated"
                  complete={
                    tenantProfile.tenancyActive
                  }
                />
              </View>

              {nextStep ? (
                <View style={styles.nextStepBox}>
                  <View
                    style={styles.nextStepIcon}
                  >
                    <MaterialCommunityIcons
                      name={nextStep.icon}
                      size={25}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={
                      styles.nextStepContent
                    }
                  >
                    <Text
                      style={
                        styles.nextStepLabel
                      }
                    >
                      YOUR NEXT STEP
                    </Text>

                    <Text
                      style={
                        styles.nextStepTitle
                      }
                    >
                      {nextStep.title}
                    </Text>

                    <Text
                      style={
                        styles.nextStepDescription
                      }
                    >
                      {nextStep.description}
                    </Text>
                  </View>

                  <Button
                    mode="contained"
                    compact
                    onPress={handleNextStep}
                  >
                    Continue
                  </Button>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.sideColumn}>
            <SectionHeader
              title="Quick actions"
              subtitle="Services currently available to you."
            />

            <View style={styles.quickActions}>
              {visibleActions
                .slice(0, 5)
                .map((action) => (
                  <QuickAction
                    key={action.route}
                    action={action}
                  />
                ))}
            </View>
          </View>
        </View>

        {showApplicationSection &&
        currentApplication ? (
          <>
            <SectionHeader
              title="Current application"
              subtitle="Track the latest progress of your property application."
              actionLabel="View applications"
              onAction={() =>
                router.push(
                  "/tenant/applications" as never,
                )
              }
            />

            <View
              style={styles.applicationCard}
            >
              <View
                style={
                  styles.applicationIcon
                }
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={31}
                  color={colors.primary}
                />
              </View>

              <View
                style={
                  styles.applicationContent
                }
              >
                <View
                  style={
                    styles.applicationHeader
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={
                        styles.applicationTitle
                      }
                    >
                      {
                        currentApplication.propertyTitle
                      }
                    </Text>

                    <Text
                      style={
                        styles.applicationAddress
                      }
                    >
                      {
                        currentApplication.propertyAddress
                      }
                    </Text>
                  </View>

                  <ApplicationBadge
                    status={
                      currentApplication.status
                    }
                  />
                </View>

                <Divider
                  style={styles.divider}
                />

                <View
                  style={
                    styles.applicationDetails
                  }
                >
                  <ApplicationDetail
                    label="Application ID"
                    value={
                      currentApplication.id
                    }
                  />

                  <ApplicationDetail
                    label="Submitted"
                    value={
                      currentApplication.submittedDate
                    }
                  />

                  <ApplicationDetail
                    label="Current status"
                    value={
                      currentApplication.status
                    }
                  />
                </View>

                <View
                  style={
                    styles.applicationActions
                  }
                >
                  <Button
                    mode="outlined"
                    icon="file-document-multiple-outline"
                    onPress={() =>
                      router.push({
                        pathname:
                          "/tenant/documents" as never,
                        params: {
                          applicationId:
                            currentApplication.id,
                          propertyId:
                            currentApplication.propertyId,
                        },
                      })
                    }
                  >
                    Documents
                  </Button>

                  <Button
                    mode="contained"
                    icon="clipboard-text-outline"
                    onPress={() =>
                      router.push(
                        "/tenant/applications" as never,
                      )
                    }
                  >
                    View application
                  </Button>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {showPropertySuggestions ? (
          <>
            <SectionHeader
              title="Suggested properties"
              subtitle="Properties matched using your saved preferences."
              actionLabel="View all"
              onAction={() =>
                router.push(
                  "/tenant/properties" as never,
                )
              }
            />

            <View
              style={[
                styles.propertyGrid,
                isDesktop
                  ? styles.threeColumns
                  : isTablet
                    ? styles.twoColumns
                    : styles.oneColumn,
              ]}
            >
              {suggestedProperties.map(
                (property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                  />
                ),
              )}
            </View>
          </>
        ) : null}

        {showActiveTenancy ? (
          <View
            style={styles.activeTenancyCard}
          >
            <View
              style={
                styles.activeTenancyIcon
              }
            >
              <MaterialCommunityIcons
                name="home-outline"
                size={35}
                color={colors.success}
              />
            </View>

            <View
              style={
                styles.activeTenancyContent
              }
            >
              <Text
                style={
                  styles.activeTenancyLabel
                }
              >
                ACTIVE TENANCY
              </Text>

              <Text
                style={
                  styles.activeTenancyTitle
                }
              >
                Your property management
                services are ready
              </Text>

              <Text
                style={
                  styles.activeTenancyDescription
                }
              >
                You can now view your property,
                manage payments and submit
                maintenance requests.
              </Text>
            </View>

            <Button
              mode="contained"
              icon="home-account"
              onPress={() =>
                router.push({
                  pathname:
                    "/tenant/my-property" as never,
                  params: {
                    propertyId:
                      currentApplication
                        ?.propertyId ??
                      "PROP-001",
                    applicationId:
                      currentApplication?.id ??
                      "",
                  },
                })
              }
            >
              Open My Property
            </Button>
          </View>
        ) : null}

        <SectionHeader
          title="Available services"
          subtitle="Only services relevant to your current stage are displayed."
        />

        <View
          style={[
            styles.serviceGrid,
            isDesktop
              ? styles.threeColumns
              : isTablet
                ? styles.twoColumns
                : styles.oneColumn,
          ]}
        >
          {visibleActions.map((action) => (
            <ServiceCard
              key={action.route}
              action={action}
            />
          ))}
        </View>

        <View style={styles.languageCard}>
          <View style={styles.languageIcon}>
            <MaterialCommunityIcons
              name="translate"
              size={30}
              color={colors.primary}
            />
          </View>

          <View style={styles.languageContent}>
            <Text
              style={styles.languageTitle}
            >
              Language and accessibility
            </Text>

            <Text
              style={
                styles.languageDescription
              }
            >
              Your selected additional language
              is{" "}
              <Text
                style={styles.languageStrong}
              >
                {
                  tenantProfile.preferredLanguage
                }
              </Text>
              . You can update language and
              accessibility settings from your
              account.
            </Text>
          </View>

          <Button
            mode="outlined"
            icon="cog-outline"
            onPress={() =>
              router.push(
                "/tenant/settings" as never,
              )
            }
          >
            Manage
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

function getTenantStage(): TenantStage {
  if (tenantProfile.tenancyActive) {
    return "active-tenancy";
  }

  if (tenantProfile.agreementSigned) {
    return "agreement-signed";
  }

  if (
    tenantProfile.applicationApproved ||
    tenantProfile.agreementAvailable
  ) {
    return "application-approved";
  }

  if (tenantProfile.applicationSubmitted) {
    return "application-submitted";
  }

  return "searching";
}

function getStageInformation(
  stage: TenantStage,
): {
  title: string;
  description: string;
  label: string;
  icon: IconName;
} {
  switch (stage) {
    case "application-submitted":
      return {
        title:
          "Your application is being reviewed",
        description:
          "Track your application and respond if the estate agent asks for more information or documents.",
        label: "Application under review",
        icon: "file-search-outline",
      };

    case "application-approved":
      return {
        title:
          "Your application has been approved",
        description:
          "Review the tenancy agreement carefully and add your electronic signature.",
        label: "Ready for agreement",
        icon: "file-sign",
      };

    case "agreement-signed":
      return {
        title:
          "Your agreement has been signed",
        description:
          "The tenancy is being prepared. You will receive confirmation when your property services become active.",
        label: "Agreement completed",
        icon: "file-check-outline",
      };

    case "active-tenancy":
      return {
        title:
          "Manage your home and tenancy",
        description:
          "Access rent payments, maintenance, tenancy documents and property support.",
        label: "Active tenancy",
        icon: "home-outline",
      };

    default:
      return {
        title:
          "Find and apply for your next home",
        description:
          "Complete your preferences to receive suitable property recommendations.",
        label: "Property search",
        icon: "home-search-outline",
      };
  }
}

function getNextStep(
  stage: TenantStage,
  application: TenantApplication | null,
): {
  title: string;
  description: string;
  buttonLabel: string;
  icon: IconName;
  route: DashboardRoute;
  params?: Record<string, string>;
} | null {
  if (
    !tenantProfile.preferencesCompleted
  ) {
    return {
      title:
        "Complete your property preferences",
      description:
        "Tell us your budget, location and household requirements.",
      buttonLabel: "Preferences",
      icon: "tune-variant",
      route: "/tenant/preferences",
    };
  }

  if (
    !tenantProfile.identificationUploaded ||
    !tenantProfile.rightToRentVerified
  ) {
    return {
      title:
        "Complete your supporting documents",
      description:
        "Upload identity and Right to Rent evidence.",
      buttonLabel: "Upload documents",
      icon: "file-upload-outline",
      route: "/tenant/documents",
      params: {
        applicationId:
          application?.id ?? "",
        propertyId:
          application?.propertyId ?? "",
      },
    };
  }

  if (stage === "searching") {
    return {
      title: "Choose a suitable property",
      description:
        "View properties matched to your preferences.",
      buttonLabel: "View properties",
      icon: "home-search-outline",
      route: "/tenant/properties",
    };
  }

  if (
    stage === "application-submitted"
  ) {
    return {
      title:
        "Track your property application",
      description:
        "Your application is currently being reviewed.",
      buttonLabel: "View application",
      icon: "clipboard-text-outline",
      route: "/tenant/applications",
    };
  }

  if (
    stage === "application-approved"
  ) {
    return {
      title:
        "Review and sign your agreement",
      description:
        "Read the tenancy terms and provide your electronic signature.",
      buttonLabel: "Open agreement",
      icon: "file-sign",
      route: "/tenant/agreement",
      params: {
        applicationId:
          application?.id ?? "",
        propertyId:
          application?.propertyId ??
          "PROP-001",
      },
    };
  }

  if (stage === "agreement-signed") {
    return {
      title:
        "Wait for tenancy activation",
      description:
        "Your signed agreement is being finalised by the landlord or agent.",
      buttonLabel: "View agreement",
      icon: "file-check-outline",
      route: "/tenant/agreement",
      params: {
        applicationId:
          application?.id ?? "",
        propertyId:
          application?.propertyId ??
          "PROP-001",
      },
    };
  }

  if (stage === "active-tenancy") {
    return {
      title: "Manage your property",
      description:
        "Access payments, maintenance and tenancy information.",
      buttonLabel: "My Property",
      icon: "home-account",
      route: "/tenant/my-property",
      params: {
        applicationId:
          application?.id ?? "",
        propertyId:
          application?.propertyId ??
          "PROP-001",
      },
    };
  }

  return null;
}

function getDashboardActions(
  stage: TenantStage,
  application: TenantApplication | null,
): DashboardAction[] {
  const active =
    stage === "active-tenancy";

  const approved =
    stage === "application-approved" ||
    stage === "agreement-signed" ||
    active;

  return [
    {
      title: "Property preferences",
      description:
        "Update your budget, location and household requirements.",
      icon: "tune-variant",
      route: "/tenant/preferences",
      visible: !active,
    },
    {
      title: "Property suggestions",
      description:
        "View properties matched to your saved preferences.",
      icon: "home-search-outline",
      route: "/tenant/properties",
      visible:
        stage === "searching" ||
        stage ===
          "application-submitted",
    },
    {
      title: "Applications",
      description:
        "Track submitted applications and their review status.",
      icon: "clipboard-text-outline",
      route: "/tenant/applications",
      visible:
        tenantProfile.applicationSubmitted,
    },
    {
      title: "Documents",
      description:
        "View and upload application documents.",
      icon: "file-document-multiple-outline",
      route: "/tenant/documents",
      visible: !active,
    },
    {
      title: "Agreement",
      description:
        "Review your tenancy agreement and signature status.",
      icon: "file-sign",
      route: "/tenant/agreement",
      visible: approved,
    },
    {
      title: "My Property",
      description:
        "View your active tenancy and property details.",
      icon: "home-account",
      route: "/tenant/my-property",
      visible: active,
    },
    {
      title: "Maintenance",
      description:
        "Report and track property maintenance issues.",
      icon: "tools",
      route: "/tenant/maintenance",
      visible: active,
    },
    {
      title: "Payments",
      description:
        "View rent, deposit and payment history.",
      icon: "cash-multiple",
      route: "/tenant/payments",
      visible: active,
    },
    {
      title: "Messages",
      description:
        "Contact the estate agent, landlord or support team.",
      icon: "message-text-outline",
      route: "/tenant/messages",
      visible: true,
    },
    {
      title: "Settings",
      description:
        "Manage your account, notifications and language.",
      icon: "cog-outline",
      route: "/tenant/settings",
      visible: true,
    },
  ];
}

function calculateJourneyProgress() {
  const steps = [
    tenantProfile.personalInformationCompleted,
    tenantProfile.identificationUploaded,
    tenantProfile.preferencesCompleted,
    tenantProfile.rightToRentVerified,
    tenantProfile.applicationSubmitted,
    tenantProfile.applicationApproved,
    tenantProfile.agreementSigned,
    tenantProfile.tenancyActive,
  ];

  const completed =
    steps.filter(Boolean).length;

  return Math.round(
    (completed / steps.length) * 100,
  );
}

function getShortStageLabel(
  stage: TenantStage,
) {
  switch (stage) {
    case "application-submitted":
      return "Under review";

    case "application-approved":
      return "Approved";

    case "agreement-signed":
      return "Signed";

    case "active-tenancy":
      return "Active";

    default:
      return "Searching";
  }
}

function StatisticCard({
  title,
  value,
  helper,
  icon,
  compactValue = false,
}: {
  title: string;
  value: string;
  helper: string;
  icon: IconName;
  compactValue?: boolean;
}) {
  return (
    <View style={styles.statisticCard}>
      <View style={styles.statisticIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color={colors.primary}
        />
      </View>

      <View style={styles.statisticContent}>
        <Text
          style={styles.statisticTitle}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.statisticValue,
            compactValue &&
              styles.statisticValueCompact,
          ]}
        >
          {value}
        </Text>

        <Text
          style={styles.statisticHelper}
        >
          {helper}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={styles.sectionHeaderText}
      >
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text
          style={styles.sectionSubtitle}
        >
          {subtitle}
        </Text>
      </View>

      {actionLabel && onAction ? (
        <Button
          mode="text"
          compact
          icon="arrow-right"
          contentStyle={
            styles.actionButtonContent
          }
          onPress={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

function ChecklistItem({
  title,
  complete,
}: {
  title: string;
  complete: boolean;
}) {
  return (
    <View style={styles.checklistItem}>
      <MaterialCommunityIcons
        name={
          complete
            ? "check-circle"
            : "circle-outline"
        }
        size={21}
        color={
          complete
            ? colors.success
            : colors.textMuted
        }
      />

      <Text
        style={[
          styles.checklistText,
          complete &&
            styles.checklistCompleteText,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.checklistStatus,
          complete &&
            styles.checklistStatusComplete,
        ]}
      >
        {complete ? "Complete" : "Required"}
      </Text>
    </View>
  );
}

function QuickAction({
  action,
}: {
  action: DashboardAction;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.pressed,
      ]}
      onPress={() =>
        router.push(
          action.route as never,
        )
      }
    >
      <View
        style={styles.quickActionIcon}
      >
        <MaterialCommunityIcons
          name={action.icon}
          size={24}
          color={colors.primary}
        />
      </View>

      <View
        style={styles.quickActionContent}
      >
        <Text
          style={styles.quickActionTitle}
        >
          {action.title}
        </Text>

        <Text
          style={
            styles.quickActionDescription
          }
          numberOfLines={2}
        >
          {action.description}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={21}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

function PropertyCard({
  property,
}: {
  property: SuggestedProperty;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.propertyCard,
        pressed && styles.pressed,
      ]}
      onPress={() =>
        router.push({
          pathname:
            "/tenant/property-details" as never,
          params: {
            propertyId: property.id,
          },
        })
      }
    >
      <View style={styles.propertyImage}>
        <MaterialCommunityIcons
          name="home-city-outline"
          size={58}
          color={colors.primary}
        />

        <View style={styles.matchBadge}>
          <Text
            style={styles.matchBadgeText}
          >
            {property.matchScore}% match
          </Text>
        </View>
      </View>

      <View style={styles.propertyContent}>
        <Text
          style={styles.propertyTitle}
          numberOfLines={2}
        >
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color={colors.textMuted}
          />

          <Text
            style={styles.propertyAddress}
            numberOfLines={2}
          >
            {property.address}
          </Text>
        </View>

        <View style={styles.propertyFacts}>
          <PropertyFact
            icon="bed-outline"
            text={`${property.bedrooms} bedroom(s)`}
          />

          <PropertyFact
            icon="shower"
            text={`${property.bathrooms} bathroom(s)`}
          />

          <PropertyFact
            icon="home-outline"
            text={property.propertyType}
          />
        </View>

        <View style={styles.propertyFooter}>
          <View>
            <Text style={styles.rentLabel}>
              Monthly rent
            </Text>

            <Text style={styles.rentValue}>
              {formatCurrency(
                property.monthlyRent,
              )}
            </Text>
          </View>

          <Button
            mode="contained"
            compact
            onPress={() =>
              router.push({
                pathname:
                  "/tenant/property-details" as never,
                params: {
                  propertyId: property.id,
                },
              })
            }
          >
            View
          </Button>
        </View>
      </View>
    </Pressable>
  );
}

function PropertyFact({
  icon,
  text,
}: {
  icon: IconName;
  text: string;
}) {
  return (
    <View style={styles.propertyFact}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={colors.primary}
      />

      <Text
        style={styles.propertyFactText}
      >
        {text}
      </Text>
    </View>
  );
}

function ApplicationDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.applicationDetail}
    >
      <Text
        style={styles.applicationDetailLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.applicationDetailValue}
      >
        {value}
      </Text>
    </View>
  );
}

function ApplicationBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const success = status === "Approved";
  const error = status === "Rejected";

  return (
    <View
      style={[
        styles.statusBadge,
        success
          ? styles.successBadge
          : error
            ? styles.errorBadge
            : styles.warningBadge,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          success
            ? styles.successBadgeText
            : error
              ? styles.errorBadgeText
              : styles.warningBadgeText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function ServiceCard({
  action,
}: {
  action: DashboardAction;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.serviceCard,
        pressed && styles.pressed,
      ]}
      onPress={() =>
        router.push(
          action.route as never,
        )
      }
    >
      <View style={styles.serviceIcon}>
        <MaterialCommunityIcons
          name={action.icon}
          size={28}
          color={colors.primary}
        />
      </View>

      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>
          {action.title}
        </Text>

        <Text
          style={styles.serviceDescription}
        >
          {action.description}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="arrow-right"
        size={21}
        color={colors.primary}
      />
    </Pressable>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

const styles = StyleSheet.create({
  screenContent: {
    padding: 0,
  },

  page: {
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 70,
  },

  topBar: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  brandArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  logo: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  notificationButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.background,
  },

  notificationBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: colors.error,
  },

  notificationBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
  },

  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: 4,
  },

  profileAvatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  profileAvatarText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
  },

  hero: {
    minHeight: 290,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xl,
    padding: spacing.xl * 1.5,
    overflow: "hidden",
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },

  heroMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
  },

  heroContent: {
    flex: 1,
    maxWidth: 760,
  },

  heroGreeting: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },

  heroTitle: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 39,
  },

  heroDescription: {
    maxWidth: 680,
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 12,
    lineHeight: 20,
    opacity: 0.9,
  },

  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  heroOutlineButton: {
    borderColor: colors.white,
  },

  heroIllustration: {
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor:
      "rgba(255,255,255,0.12)",
  },

  heroIllustrationText: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  statisticsGrid: {
    gap: spacing.md,
  },

  fourColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  threeColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  twoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  oneColumn: {
    flexDirection: "column",
  },

  statisticCard: {
    flexGrow: 1,
    flexBasis: 240,
    minWidth: 210,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  statisticIcon: {
    width: 53,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  statisticContent: {
    flex: 1,
  },

  statisticTitle: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  statisticValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
  },

  statisticValueCompact: {
    fontSize: 15,
  },

  statisticHelper: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  mainColumns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },

  mainColumnsStacked: {
    flexDirection: "column",
  },

  mainColumn: {
    flex: 2,
    width: "100%",
    minWidth: 0,
  },

  sideColumn: {
    flex: 1,
    width: "100%",
    minWidth: 290,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  actionButtonContent: {
    flexDirection: "row-reverse",
  },

  progressCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  progressTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  progressDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  progressPercentage: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },

  progressBar: {
    height: 9,
    marginTop: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },

  checklist: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  checklistText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  checklistCompleteText: {
    color: colors.textPrimary,
  },

  checklistStatus: {
    color: colors.warning,
    fontSize: 8,
    fontWeight: "900",
  },

  checklistStatusComplete: {
    color: colors.success,
  },

  nextStepBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  nextStepIcon: {
    width: 47,
    height: 47,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.white,
  },

  nextStepContent: {
    flex: 1,
    minWidth: 0,
  },

  nextStepLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  nextStepTitle: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  nextStepDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },

  quickActions: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  quickAction: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  quickActionIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  quickActionContent: {
    flex: 1,
  },

  quickActionTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  quickActionDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 13,
  },

  applicationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  applicationIcon: {
    width: 65,
    height: 65,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  applicationContent: {
    flex: 1,
    minWidth: 0,
  },

  applicationHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  applicationTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  applicationAddress: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
  },

  divider: {
    marginVertical: spacing.lg,
  },

  applicationDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
  },

  applicationDetail: {
    minWidth: 150,
  },

  applicationDetailLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  applicationDetailValue: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  applicationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  successBadge: {
    backgroundColor: colors.successLight,
  },

  successBadgeText: {
    color: colors.success,
  },

  warningBadge: {
    backgroundColor: colors.warningLight,
  },

  warningBadgeText: {
    color: colors.warning,
  },

  errorBadge: {
    backgroundColor: colors.errorLight,
  },

  errorBadgeText: {
    color: colors.error,
  },

  propertyGrid: {
    gap: spacing.lg,
  },

  propertyCard: {
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 280,
    maxWidth: 520,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  propertyImage: {
    height: 165,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  matchBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.success,
  },

  matchBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
  },

  propertyContent: {
    padding: spacing.lg,
  },

  propertyTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: spacing.sm,
  },

  propertyAddress: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },

  propertyFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  propertyFact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.background,
  },

  propertyFactText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
  },

  propertyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  rentLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  rentValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  activeTenancyCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.successLight,
  },

  activeTenancyIcon: {
    width: 65,
    height: 65,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.white,
  },

  activeTenancyContent: {
    flex: 1,
    minWidth: 230,
  },

  activeTenancyLabel: {
    color: colors.success,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  activeTenancyTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  activeTenancyDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  serviceGrid: {
    gap: spacing.lg,
  },

  serviceCard: {
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 280,
    maxWidth: 520,
    minHeight: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  serviceIcon: {
    width: 55,
    height: 55,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  serviceContent: {
    flex: 1,
  },

  serviceTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  serviceDescription: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  languageCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  languageIcon: {
    width: 58,
    height: 58,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  languageContent: {
    flex: 1,
    minWidth: 220,
  },

  languageTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  languageDescription: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 17,
  },

  languageStrong: {
    color: colors.primary,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.82,
  },
});