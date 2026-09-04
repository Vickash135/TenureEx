import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { router, type Href } from "expo-router";
import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Modal,
  TextInput as NativeTextInput,
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
  Chip,
  Divider,
} from "react-native-paper";

import {
  api,
  clearAuthSession,
} from "../../src/api/client";

import TenureExLogo from "../../src/components/Logo/TenureExLogo";

import {
  colors,
  radius,
  spacing,
} from "../../src/theme";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  status: string;
};

type ApplicantUser = {
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

type Agreement = {
  id: string;
  agreementType: string;
  status: string;
  sentAt: string | null;
  signedAt: string | null;
  createdAt: string;
};

type DirectDebitSetup = {
  id: string;
  status: string;
  provider: string | null;
  providerCustomerReference: string | null;
  providerMandateReference: string | null;
  submittedAt: string | null;
  validatedAt: string | null;
};

type StatusHistoryItem = {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  note: string | null;
  createdAt: string;
};

type AgencyApplication = {
  id: string;
  applicantUserId: string;
  reviewerUserId: string | null;
  registrationType: string;
  applicantName: string;
  businessName: string | null;
  companyNumber: string | null;
  hmrcLookupCompleted: boolean;
  hmrcVerified: boolean;
  contactEmail: string;
  contactPhone: string;
  businessDetails: string | null;
  employeeCount: number | null;
  requiredLoginCount: number | null;
  propertyCount: number | null;
  branchCount: number | null;
  authorisedDeclaration: boolean;
  status: string;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  additionalInfoRequest: string | null;
  additionalInfoRequestedAt: string | null;
  additionalInfoResponse: string | null;
  additionalInfoRespondedAt: string | null;
  additionalInfoResolvedAt: string | null;
  estimatedProcessingDays: number | null;
  createdAt: string;
  updatedAt: string;
  applicantUser: ApplicantUser;
  reviewerUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  agreements: Agreement[];
  directDebitSetup: DirectDebitSetup | null;
  statusHistory?: StatusHistoryItem[];
};

type StatusFilter =
  | "ALL"
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "INFORMATION_RESPONSES"
  | "AUTHORISED"
  | "AGREEMENT_PENDING"
  | "AGREEMENT_SENT"
  | "AGREEMENT_SIGNED"
  | "PAYMENT_SETUP_PENDING"
  | "FINAL_VALIDATION"
  | "APPROVED"
  | "REJECTED";

const ADMIN_LOGIN_ROUTE =
  "/auth/admin/login" as Href;

const FILTERS: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Pending",
    value: "PENDING_REVIEW",
  },
  {
    label: "Under review",
    value: "UNDER_REVIEW",
  },
  {
    label: "More info requested",
    value: "MORE_INFORMATION_REQUIRED",
  },
  {
    label: "Information responses",
    value: "INFORMATION_RESPONSES",
  },
  {
    label: "Authorised",
    value: "AUTHORISED",
  },
  {
    label: "Agreement",
    value: "AGREEMENT_PENDING",
  },
  {
    label: "Final validation",
    value: "FINAL_VALIDATION",
  },
  {
    label: "Approved",
    value: "APPROVED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
];

function apiMessage(
  error: unknown,
) {
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
      return message.join(
        "\n",
      );
    }

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }

    if (error.request) {
      return "Unable to connect to the TenureEx server.";
    }
  }

  return "Unable to complete the admin request.";
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function prettyStatus(
  value: string,
) {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function statusColour(
  status: string,
) {
  if (
    status === "APPROVED" ||
    status === "AUTHORISED" ||
    status === "AGREEMENT_SIGNED"
  ) {
    return "#067647";
  }

  if (
    status === "REJECTED"
  ) {
    return "#B42318";
  }

  if (
    status === "MORE_INFORMATION_REQUIRED"
  ) {
    return "#B54708";
  }

  return colors.primary;
}

export default function AdminDashboardScreen() {
  const { width } =
    useWindowDimensions();

  const isDesktop =
    width >= 1050;

  const [admin, setAdmin] =
    useState<AdminUser | null>(
      null,
    );

  const [
    applications,
    setApplications,
  ] = useState<
    AgencyApplication[]
  >([]);

  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState<
    AgencyApplication | null
  >(null);

  const [loading, setLoading] =
    useState(true);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<StatusFilter>(
      "ALL",
    );

  const [
    requestInfoText,
    setRequestInfoText,
  ] = useState("");

  const [
    rejectReason,
    setRejectReason,
  ] = useState("");

  const [reviewNote, setReviewNote] =
    useState("");

  const [
    finalApprovalNote,
    setFinalApprovalNote,
  ] = useState("");

  const [
    deleteConfirmOpen,
    setDeleteConfirmOpen,
  ] = useState(false);

  const loadAdmin =
    async () => {
      const response =
        await api.get<AdminUser>(
          "/auth/me",
        );

      if (
        response.data.userType !==
        "TENUREEX_ADMIN"
      ) {
        throw new Error(
          "ADMIN_ACCESS_DENIED",
        );
      }

      setAdmin(
        response.data,
      );
    };

  const loadApplications =
    async () => {
      const response =
        await api.get<
          AgencyApplication[]
        >(
          "/admin/agent-applications",
        );

      setApplications(
        response.data,
      );
    };

  const initialise =
    async () => {
      setLoading(true);
      setError("");

      try {
        await Promise.all([
          loadAdmin(),
          loadApplications(),
        ]);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message ===
            "ADMIN_ACCESS_DENIED"
        ) {
          await clearAuthSession();

          router.replace(
            ADMIN_LOGIN_ROUTE,
          );
          return;
        }

        if (
          axios.isAxiosError(
            err,
          ) &&
          (
            err.response?.status ===
              401 ||
            err.response?.status ===
              403
          )
        ) {
          await clearAuthSession();

          router.replace(
            ADMIN_LOGIN_ROUTE,
          );
          return;
        }

        setError(
          apiMessage(err),
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void initialise();
  }, []);

  const counts =
    useMemo(
      () => ({
        total:
          applications.length,

        pending:
          applications.filter(
            (item) =>
              item.status ===
              "PENDING_REVIEW",
          ).length,

        review:
          applications.filter(
            (item) =>
              item.status ===
                "UNDER_REVIEW" ||
              item.status ===
                "MORE_INFORMATION_REQUIRED",
          ).length,

        infoResponses:
          applications.filter(
            (item) =>
              Boolean(
                item.additionalInfoResponse &&
                item.additionalInfoRespondedAt &&
                !item.additionalInfoResolvedAt,
              ),
          ).length,

        approved:
          applications.filter(
            (item) =>
              item.status ===
              "APPROVED",
          ).length,

        rejected:
          applications.filter(
            (item) =>
              item.status ===
              "REJECTED",
          ).length,
      }),
      [applications],
    );

  const filteredApplications =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      return applications.filter(
        (application) => {
          const hasReturnedInformation =
            Boolean(
              application.additionalInfoResponse &&
              application.additionalInfoRespondedAt &&
              !application.additionalInfoResolvedAt,
            );

          const matchesFilter =
            filter === "ALL" ||
            (
              filter === "INFORMATION_RESPONSES" &&
              hasReturnedInformation
            ) ||
            application.status ===
              filter ||
            (
              filter ===
                "AGREEMENT_PENDING" &&
              [
                "AGREEMENT_PENDING",
                "AGREEMENT_SENT",
                "AGREEMENT_SIGNED",
              ].includes(
                application.status,
              )
            );

          const searchable = [
            application.applicantName,
            application.businessName,
            application.contactEmail,
            application.contactPhone,
            application.companyNumber,
            application.id,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !cleanSearch ||
            searchable.includes(
              cleanSearch,
            );

          return (
            matchesFilter &&
            matchesSearch
          );
        },
      );
    }, [
      applications,
      filter,
      search,
    ]);

  const openApplication =
    async (
      applicationId: string,
    ) => {
      setDetailsLoading(true);
      setError("");
      setMessage("");

      try {
        const response =
          await api.get<AgencyApplication>(
            `/admin/agent-applications/${applicationId}`,
          );

        setSelectedApplication(
          response.data,
        );

        setRequestInfoText(
          response.data
            .additionalInfoRequest ??
            "",
        );

        setRejectReason(
          response.data
            .rejectionReason ??
            "",
        );

        setReviewNote("");
        setFinalApprovalNote("");
      } catch (err) {
        setError(
          apiMessage(err),
        );
      } finally {
        setDetailsLoading(false);
      }
    };

  const refreshAfterAction =
    async (
      applicationId: string,
      successMessage: string,
    ) => {
      await loadApplications();

      const response =
        await api.get<AgencyApplication>(
          `/admin/agent-applications/${applicationId}`,
        );

      setSelectedApplication(
        response.data,
      );

      setMessage(
        successMessage,
      );
    };

  const deleteEstateAgent =
    async () => {
      if (!selectedApplication) {
        return;
      }

      const applicationId =
        selectedApplication.id;

      const deletedEmail =
        selectedApplication.applicantUser.email;

      setActionLoading(true);
      setError("");
      setMessage("");

      try {
        const response =
          await api.delete<{
            message: string;
          }>(
            `/admin/agent-applications/${applicationId}`,
          );

        setDeleteConfirmOpen(
          false,
        );

        setSelectedApplication(
          null,
        );

        await loadApplications();

        setMessage(
          response.data.message ||
            `${deletedEmail} has been deleted.`,
        );
      } catch (err) {
        setError(
          apiMessage(err),
        );
      } finally {
        setActionLoading(false);
      }
    };

  const performAction =
    async (
      action:
        | "start-review"
        | "request-info"
        | "reject"
        | "authorise"
        | "send-agreement"
        | "agreement-signed"
        | "send-direct-debit-request"
        | "direct-debit"
        | "final-approve",
    ) => {
      if (!selectedApplication) {
        return;
      }

      if (
        action ===
          "request-info" &&
        !requestInfoText.trim()
      ) {
        setError(
          "Enter the information you need from the applicant.",
        );
        return;
      }

      if (
        action ===
          "reject" &&
        !rejectReason.trim()
      ) {
        setError(
          "Enter the reason for rejection.",
        );
        return;
      }

      setActionLoading(true);
      setError("");
      setMessage("");

      const id =
        selectedApplication.id;

      try {
        if (
          action ===
          "start-review"
        ) {
          await api.patch(
            `/admin/agent-applications/${id}/start-review`,
            {
              note:
                reviewNote.trim() ||
                undefined,
            },
          );
        }

        if (
          action ===
          "request-info"
        ) {
          await api.patch(
            `/admin/agent-applications/${id}/request-info`,
            {
              message:
                requestInfoText.trim(),
            },
          );
        }

        if (
          action === "reject"
        ) {
          await api.patch(
            `/admin/agent-applications/${id}/reject`,
            {
              reason:
                rejectReason.trim(),
            },
          );
        }

        if (
          action ===
          "authorise"
        ) {
          await api.patch(
            `/admin/agent-applications/${id}/authorise`,
          );
        }

        if (
          action ===
          "send-agreement"
        ) {
          await api.post(
            `/admin/agent-applications/${id}/send-agreement`,
          );
        }

        if (
          action ===
          "agreement-signed"
        ) {
          await api.patch(
            `/admin/agent-applications/${id}/agreement-signed`,
          );
        }

        if (
          action ===
          "send-direct-debit-request"
        ) {
          await api.post(
            `/admin/agent-applications/${id}/send-direct-debit-request`,
          );
        }

        if (
          action ===
          "direct-debit"
        ) {
          await api.post(
            `/admin/agent-applications/${id}/direct-debit`,
          );
        }

        if (
          action ===
          "final-approve"
        ) {
          await api.patch(
            `/admin/agent-applications/${id}/final-approve`,
            {
              validationSuccessful:
                true,
              note:
                finalApprovalNote.trim() ||
                undefined,
            },
          );
        }

        await refreshAfterAction(
          id,
          "Application updated successfully.",
        );
      } catch (err) {
        setError(
          apiMessage(err),
        );
      } finally {
        setActionLoading(false);
      }
    };

  const signOut =
    async () => {
      await clearAuthSession();

      router.replace(
        ADMIN_LOGIN_ROUTE,
      );
    };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.loadingState
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
            Loading Admin Portal…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.shell}
      >
        {isDesktop ? (
          <View
            style={
              styles.sidebar
            }
          >
            <View>
              <View
                style={
                  styles.sidebarBrand
                }
              >
                <TenureExLogo />

                <View>
                  <Text
                    style={
                      styles.sidebarBrandName
                    }
                  >
                    TenureEx
                  </Text>

                  <Text
                    style={
                      styles.sidebarBrandSubtitle
                    }
                  >
                    Admin Portal
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.navItemActive
                }
              >
                <MaterialCommunityIcons
                  name="clipboard-account-outline"
                  size={21}
                  color={
                    colors.white
                  }
                />

                <Text
                  style={
                    styles.navItemActiveText
                  }
                >
                  Agent Applications
                </Text>
              </View>
            </View>

            <View>
              <View
                style={
                  styles.adminProfile
                }
              >
                <View
                  style={
                    styles.adminAvatar
                  }
                >
                  <MaterialCommunityIcons
                    name="shield-account-outline"
                    size={24}
                    color={
                      colors.primary
                    }
                  />
                </View>

                <View
                  style={
                    styles.adminProfileText
                  }
                >
                  <Text
                    numberOfLines={1}
                    style={
                      styles.adminName
                    }
                  >
                    {admin
                      ? `${admin.firstName} ${admin.lastName}`
                      : "TenureEx Admin"}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={
                      styles.adminEmail
                    }
                  >
                    {admin?.email ??
                      ""}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={
                  signOut
                }
                style={
                  styles.signOutButton
                }
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={19}
                  color={
                    colors.error
                  }
                />

                <Text
                  style={
                    styles.signOutText
                  }
                >
                  Sign out
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <ScrollView
          style={styles.main}
          contentContainerStyle={
            styles.mainContent
          }
        >
          <View
            style={styles.header}
          >
            <View>
              <Text
                style={
                  styles.eyebrow
                }
              >
                TENUREEX ADMIN
              </Text>

              <Text
                style={
                  styles.pageTitle
                }
              >
                Estate Agent Applications
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                Review registrations and
                complete the Estate Agent
                approval process.
              </Text>
            </View>

            <View
              style={
                styles.headerActions
              }
            >
              <Button
                mode="outlined"
                icon="badge-account-outline"
                onPress={() => router.push("/admin/council-inspectors" as Href)}
              >
                Council Inspectors
              </Button>

              <Button
                mode="outlined"
                icon="refresh"
                onPress={() =>
                  void initialise()
                }
              >
                Refresh
              </Button>

              {!isDesktop ? (
                <Button
                  mode="text"
                  icon="logout"
                  textColor={
                    colors.error
                  }
                  onPress={
                    signOut
                  }
                >
                  Sign out
                </Button>
              ) : null}
            </View>
          </View>

          {error ? (
            <View
              style={
                styles.errorBanner
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
                  styles.errorBannerText
                }
              >
                {error}
              </Text>
            </View>
          ) : null}

          {message ? (
            <View
              style={
                styles.successBanner
              }
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color="#067647"
              />

              <Text
                style={
                  styles.successBannerText
                }
              >
                {message}
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.statsGrid
            }
          >
            <StatCard
              label="Total applications"
              value={counts.total}
              icon="file-account-outline"
            />

            <StatCard
              label="Pending review"
              value={counts.pending}
              icon="clock-outline"
            />

            <StatCard
              label="In review"
              value={counts.review}
              icon="clipboard-search-outline"
            />

            <StatCard
              label="Information responses"
              value={counts.infoResponses}
              icon="message-reply-text-outline"
            />

            <StatCard
              label="Approved"
              value={counts.approved}
              icon="check-decagram-outline"
            />

            <StatCard
              label="Rejected"
              value={counts.rejected}
              icon="close-circle-outline"
            />
          </View>

          <View
            style={
              styles.panel
            }
          >
            <View
              style={
                styles.controls
              }
            >
              <View
                style={
                  styles.searchBox
                }
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={
                    colors.textMuted
                  }
                />

                <NativeTextInput
                  value={search}
                  onChangeText={
                    setSearch
                  }
                  placeholder="Search name, business, email or company number"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  style={
                    styles.searchInput
                  }
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterRow
                }
              >
                {FILTERS.map(
                  (item) => (
                    <Chip
                      key={
                        item.value
                      }
                      selected={
                        filter ===
                        item.value
                      }
                      onPress={() =>
                        setFilter(
                          item.value,
                        )
                      }
                      style={
                        filter ===
                        item.value
                          ? styles.filterChipSelected
                          : styles.filterChip
                      }
                    >
                      {item.label}
                    </Chip>
                  ),
                )}
              </ScrollView>
            </View>

            <Divider />

            {detailsLoading ? (
              <View
                style={
                  styles.tableLoading
                }
              >
                <ActivityIndicator
                  color={
                    colors.primary
                  }
                />
              </View>
            ) : null}

            {filteredApplications.length ===
            0 ? (
              <View
                style={
                  styles.emptyState
                }
              >
                <MaterialCommunityIcons
                  name="clipboard-text-search-outline"
                  size={42}
                  color={
                    colors.textMuted
                  }
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No applications found
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Try another search or
                  status filter.
                </Text>
              </View>
            ) : (
              filteredApplications.map(
                (
                  application,
                ) => (
                  <Pressable
                    key={
                      application.id
                    }
                    onPress={() =>
                      void openApplication(
                        application.id,
                      )
                    }
                    style={({ pressed }) => [
                      styles.applicationRow,
                      pressed &&
                        styles.applicationRowPressed,
                    ]}
                  >
                    <View
                      style={
                        styles.applicationIdentity
                      }
                    >
                      <View
                        style={
                          styles.applicationAvatar
                        }
                      >
                        <MaterialCommunityIcons
                          name={
                            application.registrationType ===
                            "BUSINESS"
                              ? "office-building-outline"
                              : "account-outline"
                          }
                          size={22}
                          color={
                            colors.primary
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.applicationMainText
                        }
                      >
                        <Text
                          style={
                            styles.applicationName
                          }
                        >
                          {application.businessName ||
                            application.applicantName}
                        </Text>

                        <Text
                          style={
                            styles.applicationSecondary
                          }
                        >
                          {
                            application.applicantName
                          }{" "}
                          •{" "}
                          {
                            application.contactEmail
                          }
                        </Text>

                        <Text
                          style={
                            styles.applicationMeta
                          }
                        >
                          Submitted{" "}
                          {formatDate(
                            application.submittedAt,
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.applicationRight
                      }
                    >
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            borderColor:
                              statusColour(
                                application.status,
                              ),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                statusColour(
                                  application.status,
                                ),
                            },
                          ]}
                        >
                          {prettyStatus(
                            application.status,
                          )}
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={23}
                        color={
                          colors.textMuted
                        }
                      />
                    </View>
                  </Pressable>
                ),
              )
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={
          Boolean(
            selectedApplication,
          )
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectedApplication(
            null,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            {selectedApplication ? (
              <>
                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.modalEyebrow
                      }
                    >
                      ESTATE AGENT APPLICATION
                    </Text>

                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {selectedApplication.businessName ||
                        selectedApplication.applicantName}
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {selectedApplication.applicantName}{" "}
                      •{" "}
                      {prettyStatus(
                        selectedApplication.status,
                      )}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setSelectedApplication(
                        null,
                      )
                    }
                    style={
                      styles.closeButton
                    }
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={22}
                      color={
                        colors.textPrimary
                      }
                    />
                  </Pressable>
                </View>

                <Divider />

                <ScrollView
                  contentContainerStyle={
                    styles.modalBody
                  }
                >
                  <Section
                    title="Applicant"
                  >
                    <DetailRow
                      label="Applicant name"
                      value={
                        selectedApplication.applicantName
                      }
                    />

                    <DetailRow
                      label="Registration type"
                      value={
                        selectedApplication.registrationType
                      }
                    />

                    <DetailRow
                      label="Email"
                      value={
                        selectedApplication.contactEmail
                      }
                    />

                    <DetailRow
                      label="Phone"
                      value={
                        selectedApplication.contactPhone
                      }
                    />

                    <DetailRow
                      label="Email verified"
                      value={
                        selectedApplication.applicantUser
                          ?.emailVerified
                          ? "Yes"
                          : "No"
                      }
                    />

                    <DetailRow
                      label="Phone verified"
                      value={
                        selectedApplication.applicantUser
                          ?.phoneVerified
                          ? "Yes"
                          : "No"
                      }
                    />
                  </Section>

                  <Section
                    title="Business"
                  >
                    <DetailRow
                      label="Business name"
                      value={
                        selectedApplication.businessName ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="Company number"
                      value={
                        selectedApplication.companyNumber ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="Employees"
                      value={
                        selectedApplication.employeeCount?.toString() ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="Required logins"
                      value={
                        selectedApplication.requiredLoginCount?.toString() ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="Properties"
                      value={
                        selectedApplication.propertyCount?.toString() ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="Branches"
                      value={
                        selectedApplication.branchCount?.toString() ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="HMRC verified"
                      value={
                        selectedApplication.hmrcVerified
                          ? "Yes"
                          : "No"
                      }
                    />

                    <DetailRow
                      label="Declaration accepted"
                      value={
                        selectedApplication.authorisedDeclaration
                          ? "Yes"
                          : "No"
                      }
                    />
                  </Section>

                  {selectedApplication.businessDetails ? (
                    <Section
                      title="Business details"
                    >
                      <Text
                        style={
                          styles.bodyCopy
                        }
                      >
                        {
                          selectedApplication.businessDetails
                        }
                      </Text>
                    </Section>
                  ) : null}

                  <Section
                    title="Onboarding status"
                  >
                    <DetailRow
                      label="Current status"
                      value={prettyStatus(
                        selectedApplication.status,
                      )}
                    />

                    <DetailRow
                      label="Submitted"
                      value={formatDate(
                        selectedApplication.submittedAt,
                      )}
                    />

                    <DetailRow
                      label="Review started"
                      value={formatDate(
                        selectedApplication.reviewStartedAt,
                      )}
                    />

                    <DetailRow
                      label="Agreement"
                      value={
                        selectedApplication.agreements?.[0]
                          ? prettyStatus(
                              selectedApplication.agreements[0]
                                .status,
                            )
                          : "Not created"
                      }
                    />

                    <DetailRow
                      label="Direct Debit"
                      value={
                        selectedApplication.directDebitSetup
                          ? prettyStatus(
                              selectedApplication.directDebitSetup
                                .status,
                            )
                          : "Not started"
                      }
                    />
                  </Section>

                  {(selectedApplication.additionalInfoRequest ||
                    selectedApplication.additionalInfoResponse) ? (
                    <Section
                      title="More information review"
                    >
                      <View style={styles.infoReviewCard}>
                        <Text style={styles.infoReviewLabel}>
                          Admin requested
                        </Text>
                        <Text style={styles.infoReviewText}>
                          {selectedApplication.additionalInfoRequest ||
                            "No information request recorded."}
                        </Text>
                        {selectedApplication.additionalInfoRequestedAt ? (
                          <Text style={styles.infoReviewMeta}>
                            Requested {formatDate(selectedApplication.additionalInfoRequestedAt)}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.infoReviewCard}>
                        <Text style={styles.infoReviewLabel}>
                          Estate Agent response
                        </Text>
                        <Text style={styles.infoReviewText}>
                          {selectedApplication.additionalInfoResponse ||
                            "Waiting for the Estate Agent to respond."}
                        </Text>
                        {selectedApplication.additionalInfoRespondedAt ? (
                          <Text style={styles.infoReviewMeta}>
                            Received {formatDate(selectedApplication.additionalInfoRespondedAt)}
                          </Text>
                        ) : null}
                      </View>

                      {selectedApplication.additionalInfoResponse &&
                      selectedApplication.additionalInfoRespondedAt &&
                      !selectedApplication.additionalInfoResolvedAt ? (
                        <View style={styles.infoNeedsReviewBanner}>
                          <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={20}
                            color="#B54708"
                          />
                          <Text style={styles.infoNeedsReviewText}>
                            This response is waiting for Admin review.
                          </Text>
                        </View>
                      ) : null}
                    </Section>
                  ) : null}

                  {selectedApplication.statusHistory &&
                  selectedApplication.statusHistory.length >
                    0 ? (
                    <Section
                      title="Status history"
                    >
                      {selectedApplication.statusHistory.map(
                        (
                          history,
                        ) => (
                          <View
                            key={
                              history.id
                            }
                            style={
                              styles.historyItem
                            }
                          >
                            <View
                              style={
                                styles.historyDot
                              }
                            />

                            <View
                              style={
                                styles.historyContent
                              }
                            >
                              <Text
                                style={
                                  styles.historyStatus
                                }
                              >
                                {prettyStatus(
                                  history.newStatus,
                                )}
                              </Text>

                              <Text
                                style={
                                  styles.historyMeta
                                }
                              >
                                {formatDate(
                                  history.createdAt,
                                )}
                              </Text>

                              {history.note ? (
                                <Text
                                  style={
                                    styles.historyNote
                                  }
                                >
                                  {
                                    history.note
                                  }
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        ),
                      )}
                    </Section>
                  ) : null}

                  {selectedApplication.status ===
                  "PENDING_REVIEW" ? (
                    <ActionSection
                      title={
                        selectedApplication.additionalInfoResponse &&
                        selectedApplication.additionalInfoRespondedAt &&
                        !selectedApplication.additionalInfoResolvedAt
                          ? "Review returned information"
                          : "Start review"
                      }
                      description={
                        selectedApplication.additionalInfoResponse &&
                        selectedApplication.additionalInfoRespondedAt &&
                        !selectedApplication.additionalInfoResolvedAt
                          ? "Read the Estate Agent response above, then restart the formal review before making a decision."
                          : "Move this application into formal TenureEx review."
                      }
                    >
                      <AdminTextArea
                        label="Review note (optional)"
                        value={
                          reviewNote
                        }
                        onChangeText={
                          setReviewNote
                        }
                      />

                      <Button
                        mode="contained"
                        icon={
                          selectedApplication.additionalInfoResponse &&
                          selectedApplication.additionalInfoRespondedAt &&
                          !selectedApplication.additionalInfoResolvedAt
                            ? "message-text-check-outline"
                            : "clipboard-search-outline"
                        }
                        loading={
                          actionLoading
                        }
                        disabled={
                          actionLoading
                        }
                        onPress={() =>
                          void performAction(
                            "start-review",
                          )
                        }
                      >
                        {selectedApplication.additionalInfoResponse &&
                        selectedApplication.additionalInfoRespondedAt &&
                        !selectedApplication.additionalInfoResolvedAt
                          ? "Review response"
                          : "Start review"}
                      </Button>
                    </ActionSection>
                  ) : null}

                  {[
                    "UNDER_REVIEW",
                    "MORE_INFORMATION_REQUIRED",
                  ].includes(
                    selectedApplication.status,
                  ) ? (
                    <ActionSection
                      title="Review decision"
                      description="Request more information, reject the application, or authorise it."
                    >
                      <AdminTextArea
                        label="Information request"
                        value={
                          requestInfoText
                        }
                        onChangeText={
                          setRequestInfoText
                        }
                      />

                      <Button
                        mode="outlined"
                        icon="message-question-outline"
                        loading={
                          actionLoading
                        }
                        disabled={
                          actionLoading
                        }
                        onPress={() =>
                          void performAction(
                            "request-info",
                          )
                        }
                      >
                        Request more information
                      </Button>

                      <AdminTextArea
                        label="Rejection reason"
                        value={
                          rejectReason
                        }
                        onChangeText={
                          setRejectReason
                        }
                      />

                      <View
                        style={
                          styles.actionButtonRow
                        }
                      >
                        <Button
                          mode="outlined"
                          icon="close-circle-outline"
                          textColor={
                            colors.error
                          }
                          disabled={
                            actionLoading
                          }
                          onPress={() =>
                            void performAction(
                              "reject",
                            )
                          }
                        >
                          Reject
                        </Button>

                        <Button
                          mode="contained"
                          icon="shield-check-outline"
                          loading={
                            actionLoading
                          }
                          disabled={
                            actionLoading
                          }
                          onPress={() =>
                            void performAction(
                              "authorise",
                            )
                          }
                        >
                          Authorise
                        </Button>
                      </View>
                    </ActionSection>
                  ) : null}

                  {selectedApplication.status ===
                  "AUTHORISED" ? (
                    <ActionSection
                      title="Service agreement"
                      description="Generate and send the Estate Agent service agreement."
                    >
                      <Button
                        mode="contained"
                        icon="file-send-outline"
                        loading={
                          actionLoading
                        }
                        disabled={
                          actionLoading
                        }
                        onPress={() =>
                          void performAction(
                            "send-agreement",
                          )
                        }
                      >
                        Send agreement
                      </Button>
                    </ActionSection>
                  ) : null}

                  {[
                    "AGREEMENT_PENDING",
                    "AGREEMENT_SENT",
                  ].includes(
                    selectedApplication.status,
                  ) ? (
                    <ActionSection
                      title="Agreement"
                      description="Use this development action after the applicant has signed the agreement."
                    >
                      <Button
                        mode="contained"
                        icon="file-sign"
                        loading={
                          actionLoading
                        }
                        disabled={
                          actionLoading
                        }
                        onPress={() =>
                          void performAction(
                            "agreement-signed",
                          )
                        }
                      >
                        Mark agreement signed
                      </Button>
                    </ActionSection>
                  ) : null}

                  {selectedApplication.status ===
                  "AGREEMENT_SIGNED" ? (
                    <ActionSection
                      title="Direct Debit request"
                      description="The agreement is signed. Send the Direct Debit setup request to the Estate Agent."
                    >
                      <Button
                        mode="contained"
                        icon="bank-transfer-out"
                        loading={actionLoading}
                        disabled={actionLoading}
                        onPress={() =>
                          void performAction(
                            "send-direct-debit-request",
                          )
                        }
                      >
                        Send Direct Debit Request
                      </Button>
                    </ActionSection>
                  ) : null}

                  {selectedApplication.directDebitSetup?.status ===
                  "SUBMITTED" ? (
                    <ActionSection
                      title="Direct Debit validation"
                      description="Validate the submitted Direct Debit setup before final approval."
                    >
                      <Button
                        mode="contained"
                        icon="bank-check"
                        loading={
                          actionLoading
                        }
                        disabled={
                          actionLoading
                        }
                        onPress={() =>
                          void performAction(
                            "direct-debit",
                          )
                        }
                      >
                        Validate Direct Debit
                      </Button>
                    </ActionSection>
                  ) : null}

                  {selectedApplication.status ===
                  "FINAL_VALIDATION" ? (
                    <ActionSection
                      title="Final approval"
                      description="Complete final validation and activate the Estate Agent account."
                    >
                      <AdminTextArea
                        label="Final approval note (optional)"
                        value={
                          finalApprovalNote
                        }
                        onChangeText={
                          setFinalApprovalNote
                        }
                      />

                      <Button
                        mode="contained"
                        icon="check-decagram-outline"
                        loading={
                          actionLoading
                        }
                        disabled={
                          actionLoading
                        }
                        onPress={() =>
                          void performAction(
                            "final-approve",
                          )
                        }
                      >
                        Final approve & activate
                      </Button>
                    </ActionSection>
                  ) : null}

                  {selectedApplication.status ===
                  "APPROVED" ? (
                    <View
                      style={
                        styles.approvedBox
                      }
                    >
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={30}
                        color="#067647"
                      />

                      <View
                        style={
                          styles.approvedText
                        }
                      >
                        <Text
                          style={
                            styles.approvedTitle
                          }
                        >
                          Estate Agent approved
                        </Text>

                        <Text
                          style={
                            styles.approvedDescription
                          }
                        >
                          This application has completed the TenureEx onboarding process.
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  <ActionSection
                    title="Danger zone"
                    description="Permanently delete this Estate Agent account, application and onboarding records. This action cannot be undone."
                  >
                    <Button
                      mode="outlined"
                      icon="trash-can-outline"
                      textColor={
                        colors.error
                      }
                      disabled={
                        actionLoading
                      }
                      onPress={() =>
                        setDeleteConfirmOpen(
                          true,
                        )
                      }
                    >
                      Delete Estate Agent
                    </Button>
                  </ActionSection>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          deleteConfirmOpen
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          !actionLoading &&
          setDeleteConfirmOpen(
            false,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.deleteConfirmCard
            }
          >
            <View
              style={
                styles.deleteConfirmIcon
              }
            >
              <MaterialCommunityIcons
                name="alert-outline"
                size={28}
                color={
                  colors.error
                }
              />
            </View>

            <Text
              style={
                styles.deleteConfirmTitle
              }
            >
              Delete Estate Agent?
            </Text>

            <Text
              style={
                styles.deleteConfirmText
              }
            >
              This permanently removes {selectedApplication?.applicantUser.email || "this Estate Agent"}, the application, agreement, Direct Debit setup and any agency created from this onboarding record. This cannot be undone.
            </Text>

            <View
              style={
                styles.deleteConfirmActions
              }
            >
              <Button
                mode="outlined"
                disabled={
                  actionLoading
                }
                onPress={() =>
                  setDeleteConfirmOpen(
                    false,
                  )
                }
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                buttonColor={
                  colors.error
                }
                icon="trash-can-outline"
                loading={
                  actionLoading
                }
                disabled={
                  actionLoading
                }
                onPress={() =>
                  void deleteEstateAgent()
                }
              >
                Delete permanently
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon:
    keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View
      style={styles.statCard}
    >
      <View
        style={
          styles.statIcon
        }
      >
        <MaterialCommunityIcons
          name={icon}
          size={23}
          color={
            colors.primary
          }
        />
      </View>

      <View>
        <Text
          style={
            styles.statValue
          }
        >
          {value}
        </Text>

        <Text
          style={
            styles.statLabel
          }
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={styles.section}
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      <View
        style={
          styles.sectionContent
        }
      >
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.detailRow}
    >
      <Text
        style={
          styles.detailLabel
        }
      >
        {label}
      </Text>

      <Text
        selectable
        style={
          styles.detailValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function ActionSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View
      style={
        styles.actionSection
      }
    >
      <Text
        style={
          styles.actionTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.actionDescription
        }
      >
        {description}
      </Text>

      <View
        style={
          styles.actionContent
        }
      >
        {children}
      </View>
    </View>
  );
}

function AdminTextArea({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText:
    (text: string) => void;
}) {
  return (
    <View>
      <Text
        style={
          styles.textAreaLabel
        }
      >
        {label}
      </Text>

      <NativeTextInput
        value={value}
        onChangeText={
          onChangeText
        }
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={
          styles.textArea
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    shell: {
      flex: 1,
      flexDirection: "row",
    },

    sidebar: {
      width: 280,
      padding:
        spacing.lg,
      justifyContent:
        "space-between",
      backgroundColor:
        "#111827",
    },

    sidebarBrand: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom:
        spacing.xl,
    },

    sidebarBrandName: {
      color:
        colors.white,
      fontSize: 20,
      fontWeight: "800",
    },

    sidebarBrandSubtitle: {
      marginTop: 2,
      color:
        "rgba(255,255,255,0.65)",
      fontSize: 12,
    },

    navItemActive: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal:
        spacing.md,
      paddingVertical: 13,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.primary,
    },

    navItemActiveText: {
      color:
        colors.white,
      fontSize: 14,
      fontWeight: "700",
    },

    adminProfile: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical:
        spacing.md,
      borderTopWidth: 1,
      borderTopColor:
        "rgba(255,255,255,0.10)",
    },

    adminAvatar: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
      backgroundColor:
        colors.white,
    },

    adminProfileText: {
      flex: 1,
      minWidth: 0,
    },

    adminName: {
      color:
        colors.white,
      fontSize: 13,
      fontWeight: "700",
    },

    adminEmail: {
      marginTop: 2,
      color:
        "rgba(255,255,255,0.60)",
      fontSize: 11,
    },

    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 12,
      borderRadius:
        radius.md,
      backgroundColor:
        "rgba(255,255,255,0.06)",
    },

    signOutText: {
      color:
        "#FDA29B",
      fontSize: 13,
      fontWeight: "700",
    },

    main: {
      flex: 1,
    },

    mainContent: {
      padding:
        spacing.xl,
      paddingBottom: 70,
    },

    header: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: spacing.lg,
      flexWrap: "wrap",
    },

    eyebrow: {
      color:
        colors.primary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
    },

    pageTitle: {
      marginTop: 5,
      color:
        colors.textPrimary,
      fontSize: 30,
      fontWeight: "800",
    },

    pageSubtitle: {
      marginTop: 7,
      maxWidth: 650,
      color:
        colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },

    headerActions: {
      flexDirection: "row",
      gap: spacing.sm,
    },

    statsGrid: {
      marginTop:
        spacing.xl,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },

    statCard: {
      minWidth: 180,
      flexGrow: 1,
      flexBasis: 180,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding:
        spacing.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.white,
    },

    statIcon: {
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius:
        radius.md,
      backgroundColor:
        colors.primaryLight,
    },

    statValue: {
      color:
        colors.textPrimary,
      fontSize: 25,
      fontWeight: "800",
    },

    statLabel: {
      marginTop: 2,
      color:
        colors.textSecondary,
      fontSize: 12,
    },

    panel: {
      marginTop:
        spacing.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.lg,
      backgroundColor:
        colors.white,
    },

    controls: {
      padding:
        spacing.lg,
      gap: spacing.md,
    },

    searchBox: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal:
        spacing.md,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.white,
    },

    searchInput: {
      flex: 1,
      minWidth: 0,
      color:
        colors.textPrimary,
      fontSize: 14,
      outlineStyle:
        "none" as never,
    },

    filterRow: {
      gap: spacing.sm,
    },

    filterChip: {
      backgroundColor:
        colors.background,
    },

    filterChipSelected: {
      backgroundColor:
        colors.primaryLight,
    },

    tableLoading: {
      padding:
        spacing.xl,
      alignItems: "center",
    },

    applicationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: spacing.md,
      padding:
        spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
    },

    applicationRowPressed: {
      backgroundColor:
        colors.background,
    },

    applicationIdentity: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },

    applicationAvatar: {
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius:
        radius.md,
      backgroundColor:
        colors.primaryLight,
    },

    applicationMainText: {
      flex: 1,
      minWidth: 0,
    },

    applicationName: {
      color:
        colors.textPrimary,
      fontSize: 14,
      fontWeight: "800",
    },

    applicationSecondary: {
      marginTop: 3,
      color:
        colors.textSecondary,
      fontSize: 12,
    },

    applicationMeta: {
      marginTop: 3,
      color:
        colors.textMuted,
      fontSize: 11,
    },

    applicationRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },

    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderWidth: 1,
      borderRadius: 999,
    },

    statusBadgeText: {
      fontSize: 10,
      fontWeight: "800",
    },

    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal:
        spacing.lg,
    },

    emptyTitle: {
      marginTop:
        spacing.md,
      color:
        colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },

    emptyText: {
      marginTop: 5,
      color:
        colors.textSecondary,
      fontSize: 13,
    },

    loadingState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },

    loadingText: {
      color:
        colors.textSecondary,
      fontSize: 14,
    },

    errorBanner: {
      marginTop:
        spacing.lg,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: spacing.sm,
      padding:
        spacing.md,
      borderWidth: 1,
      borderColor:
        "#FDA29B",
      borderRadius:
        radius.md,
      backgroundColor:
        "#FFF5F5",
    },

    errorBannerText: {
      flex: 1,
      color:
        colors.error,
      fontSize: 13,
      lineHeight: 19,
    },

    successBanner: {
      marginTop:
        spacing.lg,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: spacing.sm,
      padding:
        spacing.md,
      borderWidth: 1,
      borderColor:
        "#ABEFC6",
      borderRadius:
        radius.md,
      backgroundColor:
        "#ECFDF3",
    },

    successBannerText: {
      flex: 1,
      color: "#067647",
      fontSize: 13,
      lineHeight: 19,
    },

    modalBackdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding:
        spacing.md,
      backgroundColor:
        "rgba(15,23,42,0.56)",
    },

    modalCard: {
      width: "100%",
      maxWidth: 880,
      maxHeight: "94%",
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      backgroundColor:
        colors.white,
    },

    modalHeader: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      gap: spacing.md,
      padding:
        spacing.lg,
    },

    modalHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    modalEyebrow: {
      color:
        colors.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.7,
    },

    modalTitle: {
      marginTop: 5,
      color:
        colors.textPrimary,
      fontSize: 23,
      fontWeight: "800",
    },

    modalSubtitle: {
      marginTop: 4,
      color:
        colors.textSecondary,
      fontSize: 12,
    },

    closeButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 7,
    },

    modalBody: {
      padding:
        spacing.lg,
      paddingBottom: 50,
      gap: spacing.lg,
    },

    section: {
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 8,
      backgroundColor:
        colors.white,
    },

    sectionTitle: {
      paddingHorizontal:
        spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
      color:
        colors.textPrimary,
      fontSize: 13,
      fontWeight: "800",
      backgroundColor:
        colors.background,
    },

    sectionContent: {
      paddingHorizontal:
        spacing.md,
    },

    detailRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      gap: spacing.md,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
    },

    detailLabel: {
      flex: 1,
      color:
        colors.textSecondary,
      fontSize: 12,
    },

    detailValue: {
      flex: 1.3,
      color:
        colors.textPrimary,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "right",
    },

    bodyCopy: {
      paddingVertical:
        spacing.md,
      color:
        colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },

    infoReviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: "#FFFFFF",
  },

  infoReviewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  infoReviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },

  infoReviewMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },

  infoNeedsReviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },

  infoNeedsReviewText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#B54708",
  },

  historyItem: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingVertical: 10,
    },

    historyDot: {
      width: 9,
      height: 9,
      marginTop: 5,
      borderRadius: 5,
      backgroundColor:
        colors.primary,
    },

    historyContent: {
      flex: 1,
    },

    historyStatus: {
      color:
        colors.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },

    historyMeta: {
      marginTop: 2,
      color:
        colors.textMuted,
      fontSize: 10,
    },

    historyNote: {
      marginTop: 4,
      color:
        colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
    },

    actionSection: {
      padding:
        spacing.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 8,
      backgroundColor:
        "#F8FAFC",
    },

    actionTitle: {
      color:
        colors.textPrimary,
      fontSize: 15,
      fontWeight: "800",
    },

    actionDescription: {
      marginTop: 4,
      color:
        colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },

    actionContent: {
      marginTop:
        spacing.md,
      gap: spacing.md,
    },

    actionButtonRow: {
      flexDirection: "row",
      justifyContent:
        "flex-end",
      gap: spacing.sm,
      flexWrap: "wrap",
    },

    textAreaLabel: {
      marginBottom: 6,
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
    },

    textArea: {
      minHeight: 88,
      padding:
        spacing.md,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 7,
      color:
        colors.textPrimary,
      fontSize: 13,
      backgroundColor:
        colors.white,
    },

    deleteConfirmCard: {
      width: "100%",
      maxWidth: 520,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: "#FDA29B",
      borderRadius: radius.lg,
      backgroundColor: colors.white,
    },

    deleteConfirmIcon: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: "#FEF3F2",
    },

    deleteConfirmTitle: {
      marginTop: spacing.md,
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },

    deleteConfirmText: {
      marginTop: spacing.sm,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },

    deleteConfirmActions: {
      marginTop: spacing.lg,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      flexWrap: "wrap",
    },

    approvedBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding:
        spacing.lg,
      borderWidth: 1,
      borderColor:
        "#ABEFC6",
      borderRadius: 8,
      backgroundColor:
        "#ECFDF3",
    },

    approvedText: {
      flex: 1,
    },

    approvedTitle: {
      color: "#067647",
      fontSize: 14,
      fontWeight: "800",
    },

    approvedDescription: {
      marginTop: 3,
      color: "#067647",
      fontSize: 12,
      lineHeight: 18,
    },
  });
