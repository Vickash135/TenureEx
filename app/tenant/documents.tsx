import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Button,
    Chip,
    Divider,
    ProgressBar,
    Snackbar,
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type DocumentStatus =
  | "Not uploaded"
  | "Uploaded"
  | "Verified"
  | "Rejected";

type DocumentType =
  | "identity"
  | "rightToRent"
  | "income"
  | "bankStatement"
  | "employment"
  | "landlordReference"
  | "guarantor";

type ApplicationDocument = {
  id: DocumentType;
  title: string;
  description: string;
  icon: IconName;
  required: boolean;
  acceptedFormats: string;
  status: DocumentStatus;
  fileName: string;
  uploadedAt: string;
};

const initialDocuments: ApplicationDocument[] = [
  {
    id: "identity",
    title: "Proof of identity",
    description:
      "Upload a valid passport, driving licence or national identity card.",
    icon: "card-account-details-outline",
    required: true,
    acceptedFormats: "PDF, JPG or PNG",
    status: "Not uploaded",
    fileName: "",
    uploadedAt: "",
  },
  {
    id: "rightToRent",
    title: "Right to Rent evidence",
    description:
      "Upload your Right to Rent share-code evidence or supporting immigration document.",
    icon: "shield-account-outline",
    required: true,
    acceptedFormats: "PDF, JPG or PNG",
    status: "Not uploaded",
    fileName: "",
    uploadedAt: "",
  },
  {
    id: "income",
    title: "Proof of income",
    description:
      "Upload your latest payslips, benefit statement, pension statement or self-employment evidence.",
    icon: "cash-check",
    required: true,
    acceptedFormats: "PDF, JPG or PNG",
    status: "Not uploaded",
    fileName: "",
    uploadedAt: "",
  },
  {
    id: "bankStatement",
    title: "Bank statements",
    description:
      "Upload recent bank statements showing your income and regular financial commitments.",
    icon: "bank-outline",
    required: true,
    acceptedFormats: "PDF only",
    status: "Not uploaded",
    fileName: "",
    uploadedAt: "",
  },
  {
    id: "employment",
    title: "Employment evidence",
    description:
      "Upload your employment contract or a letter confirming your employment.",
    icon: "briefcase-outline",
    required: false,
    acceptedFormats: "PDF, JPG or PNG",
    status: "Not uploaded",
    fileName: "",
    uploadedAt: "",
  },
  {
    id: "landlordReference",
    title: "Landlord reference",
    description:
      "Upload a reference from your current or previous landlord when available.",
    icon: "home-account",
    required: false,
    acceptedFormats: "PDF, JPG or PNG",
    status: "Not uploaded",
    fileName: "",
    uploadedAt: "",
  },
  {
    id: "guarantor",
    title: "Guarantor documents",
    description:
      "Upload proof of identity, address and income for your guarantor when required.",
    icon: "account-cash-outline",
    required: false,
    acceptedFormats: "PDF, JPG or PNG",
    status: "Not uploaded",
    fileName: "",
    uploadedAt: "",
  },
];

export default function TenantDocumentsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;

  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    applicationId?: string | string[];
  }>();

  const propertyId = Array.isArray(
    params.propertyId,
  )
    ? params.propertyId[0]
    : params.propertyId;

  const applicationId = Array.isArray(
    params.applicationId,
  )
    ? params.applicationId[0]
    : params.applicationId;

  const [documents, setDocuments] =
    useState<ApplicationDocument[]>(
      initialDocuments,
    );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const requiredDocuments = useMemo(
    () =>
      documents.filter(
        (document) => document.required,
      ),
    [documents],
  );

  const uploadedRequiredCount = useMemo(
    () =>
      requiredDocuments.filter(
        (document) =>
          document.status === "Uploaded" ||
          document.status === "Verified",
      ).length,
    [requiredDocuments],
  );

  const totalUploadedCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.status === "Uploaded" ||
          document.status === "Verified",
      ).length,
    [documents],
  );

  const uploadProgress =
    requiredDocuments.length > 0
      ? uploadedRequiredCount /
        requiredDocuments.length
      : 0;

  const allRequiredDocumentsUploaded =
    uploadedRequiredCount ===
    requiredDocuments.length;

  const handleSelectDocument = (
    documentId: DocumentType,
  ) => {
    const selectedDocument =
      documents.find(
        (document) =>
          document.id === documentId,
      );

    if (!selectedDocument) {
      return;
    }

    /*
     * This currently uses a sample file so the page
     * works without installing another package.
     *
     * Later you can connect expo-document-picker.
     */

    const sampleFileName =
      getSampleFileName(documentId);

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              status: "Uploaded",
              fileName: sampleFileName,
              uploadedAt:
                new Date().toLocaleString(
                  "en-GB",
                ),
            }
          : document,
      ),
    );

    setMessage(
      `${selectedDocument.title} uploaded successfully.`,
    );
  };

  const handleReplaceDocument = (
    documentId: DocumentType,
  ) => {
    handleSelectDocument(documentId);
  };

  const handleRemoveDocument = (
    documentId: DocumentType,
  ) => {
    const selectedDocument =
      documents.find(
        (document) =>
          document.id === documentId,
      );

    if (!selectedDocument) {
      return;
    }

    Alert.alert(
      "Remove document",
      `Remove ${selectedDocument.fileName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setDocuments((current) =>
              current.map((document) =>
                document.id === documentId
                  ? {
                      ...document,
                      status:
                        "Not uploaded",
                      fileName: "",
                      uploadedAt: "",
                    }
                  : document,
              ),
            );

            setMessage(
              "Document removed.",
            );
          },
        },
      ],
    );
  };

  const handleSubmitDocuments =
    async () => {
      if (
        !allRequiredDocumentsUploaded
      ) {
        setMessage(
          "Upload all required documents before continuing.",
        );

        return;
      }

      setLoading(true);

      try {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000),
        );

        console.log(
          "Application documents submitted:",
          {
            applicationId,
            propertyId,
            documents,
          },
        );

        setMessage(
          "Documents submitted successfully.",
        );

        setTimeout(() => {
          router.replace({
            pathname:
              "/tenant/application-success" as never,
            params: {
              applicationId:
                applicationId ??
                `APP-${Date.now()}`,
              propertyId:
                propertyId ?? "",
            },
          });
        }, 700);
      } catch {
        setMessage(
          "Unable to submit the documents. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.brand}
            onPress={() =>
              router.push(
                "/tenant/dashboard" as never,
              )
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TenureEx
              </Text>

              <Text
                style={
                  styles.brandSubtitle
                }
              >
                Application documents
              </Text>
            </View>
          </Pressable>

          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => router.back()}
          >
            Back
          </Button>
        </View>

        <View style={styles.progressSteps}>
          <ProgressStep
            number="1"
            title="Preferences"
            complete
          />

          <ProgressLine complete />

          <ProgressStep
            number="2"
            title="Property"
            complete
          />

          <ProgressLine complete />

          <ProgressStep
            number="3"
            title="Application"
            complete
          />

          <ProgressLine complete />

          <ProgressStep
            number="4"
            title="Documents"
            active
          />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="file-upload-outline"
              size={38}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>
              SUPPORTING DOCUMENTS
            </Text>

            <Text style={styles.heroTitle}>
              Upload your application
              documents
            </Text>

            <Text
              style={styles.heroDescription}
            >
              Upload clear and readable
              documents. Required documents
              must be uploaded before the
              application can be submitted.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop &&
              styles.layoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <View
              style={styles.progressCard}
            >
              <View
                style={
                  styles.progressHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.progressTitle
                    }
                  >
                    Required documents
                  </Text>

                  <Text
                    style={
                      styles.progressDescription
                    }
                  >
                    {
                      uploadedRequiredCount
                    }{" "}
                    of{" "}
                    {
                      requiredDocuments.length
                    }{" "}
                    required documents
                    uploaded
                  </Text>
                </View>

                <Text
                  style={
                    styles.progressPercentage
                  }
                >
                  {Math.round(
                    uploadProgress * 100,
                  )}
                  %
                </Text>
              </View>

              <ProgressBar
                progress={uploadProgress}
                color={
                  allRequiredDocumentsUploaded
                    ? colors.success
                    : colors.primary
                }
                style={styles.progressBar}
              />

              {allRequiredDocumentsUploaded ? (
                <View
                  style={
                    styles.completedNotice
                  }
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={22}
                    color={colors.success}
                  />

                  <Text
                    style={
                      styles.completedNoticeText
                    }
                  >
                    All required documents
                    have been uploaded.
                  </Text>
                </View>
              ) : null}
            </View>

            <View
              style={styles.sectionHeader}
            >
              <View>
                <Text
                  style={styles.sectionTitle}
                >
                  Required documents
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  These documents are needed
                  for your application.
                </Text>
              </View>

              <Chip
                icon="file-check-outline"
                compact
              >
                {uploadedRequiredCount}/
                {requiredDocuments.length}
              </Chip>
            </View>

            <View
              style={
                styles.documentList
              }
            >
              {requiredDocuments.map(
                (document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onUpload={() =>
                      handleSelectDocument(
                        document.id,
                      )
                    }
                    onReplace={() =>
                      handleReplaceDocument(
                        document.id,
                      )
                    }
                    onRemove={() =>
                      handleRemoveDocument(
                        document.id,
                      )
                    }
                  />
                ),
              )}
            </View>

            <View
              style={styles.sectionHeader}
            >
              <View>
                <Text
                  style={styles.sectionTitle}
                >
                  Additional documents
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  Upload these documents when
                  they apply to your situation.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.documentList
              }
            >
              {documents
                .filter(
                  (document) =>
                    !document.required,
                )
                .map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onUpload={() =>
                      handleSelectDocument(
                        document.id,
                      )
                    }
                    onReplace={() =>
                      handleReplaceDocument(
                        document.id,
                      )
                    }
                    onRemove={() =>
                      handleRemoveDocument(
                        document.id,
                      )
                    }
                  />
                ))}
            </View>

            <View
              style={styles.submitCard}
            >
              <View
                style={
                  styles.submitInformation
                }
              >
                <MaterialCommunityIcons
                  name={
                    allRequiredDocumentsUploaded
                      ? "check-decagram-outline"
                      : "alert-circle-outline"
                  }
                  size={28}
                  color={
                    allRequiredDocumentsUploaded
                      ? colors.success
                      : colors.primary
                  }
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={
                      styles.submitTitle
                    }
                  >
                    {allRequiredDocumentsUploaded
                      ? "Ready to submit"
                      : "Documents incomplete"}
                  </Text>

                  <Text
                    style={
                      styles.submitDescription
                    }
                  >
                    {allRequiredDocumentsUploaded
                      ? "Continue to submit your property application."
                      : "Upload every required document before continuing."}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.submitActions
                }
              >
                <Button
                  mode="outlined"
                  icon="arrow-left"
                  disabled={loading}
                  onPress={() =>
                    router.back()
                  }
                >
                  Back to application
                </Button>

                <Button
                  mode="contained"
                  icon="send-check-outline"
                  loading={loading}
                  disabled={
                    loading ||
                    !allRequiredDocumentsUploaded
                  }
                  onPress={
                    handleSubmitDocuments
                  }
                >
                  Submit application
                </Button>
              </View>
            </View>
          </View>

          {isTablet ? (
            <View
              style={styles.sideColumn}
            >
              <View
                style={styles.summaryCard}
              >
                <View
                  style={
                    styles.summaryIcon
                  }
                >
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={29}
                    color={colors.primary}
                  />
                </View>

                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  APPLICATION
                </Text>

                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  Supporting documents
                </Text>

                <Divider
                  style={styles.divider}
                />

                <SummaryRow
                  label="Application ID"
                  value={
                    applicationId ??
                    "New application"
                  }
                />

                <SummaryRow
                  label="Property ID"
                  value={
                    propertyId ??
                    "Not provided"
                  }
                />

                <SummaryRow
                  label="Documents uploaded"
                  value={`${totalUploadedCount}/${documents.length}`}
                />

                <SummaryRow
                  label="Required complete"
                  value={
                    allRequiredDocumentsUploaded
                      ? "Yes"
                      : "No"
                  }
                />
              </View>

              <View
                style={styles.securityCard}
              >
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={26}
                  color={colors.success}
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={
                      styles.securityTitle
                    }
                  >
                    Document security
                  </Text>

                  <Text
                    style={
                      styles.securityDescription
                    }
                  >
                    Identity and financial
                    documents must be stored
                    securely and viewed only by
                    authorised application
                    reviewers.
                  </Text>
                </View>
              </View>

              <View
                style={styles.helpCard}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={26}
                  color={colors.primary}
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.helpTitle}
                  >
                    Upload guidance
                  </Text>

                  <Text
                    style={
                      styles.helpDescription
                    }
                  >
                    Make sure the complete
                    document is visible. Avoid
                    blurry images, shadows and
                    cropped information.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <Snackbar
        visible={Boolean(message)}
        duration={3000}
        onDismiss={() => setMessage("")}
        action={{
          label: "Close",
          onPress: () => setMessage(""),
        }}
      >
        {message}
      </Snackbar>
    </ScreenContainer>
  );
}

function DocumentCard({
  document,
  onUpload,
  onReplace,
  onRemove,
}: {
  document: ApplicationDocument;
  onUpload: () => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const uploaded =
    document.status === "Uploaded" ||
    document.status === "Verified";

  return (
    <View
      style={[
        styles.documentCard,
        uploaded &&
          styles.documentCardUploaded,
      ]}
    >
      <View
        style={styles.documentTopRow}
      >
        <View
          style={[
            styles.documentIcon,
            uploaded &&
              styles.documentIconUploaded,
          ]}
        >
          <MaterialCommunityIcons
            name={
              uploaded
                ? "file-check-outline"
                : document.icon
            }
            size={27}
            color={
              uploaded
                ? colors.success
                : colors.primary
            }
          />
        </View>

        <View
          style={
            styles.documentContent
          }
        >
          <View
            style={
              styles.documentTitleRow
            }
          >
            <Text
              style={
                styles.documentTitle
              }
            >
              {document.title}
            </Text>

            <Chip
              compact
              icon={
                document.required
                  ? "alert-circle-outline"
                  : "information-outline"
              }
            >
              {document.required
                ? "Required"
                : "Optional"}
            </Chip>
          </View>

          <Text
            style={
              styles.documentDescription
            }
          >
            {document.description}
          </Text>

          <Text
            style={
              styles.documentFormats
            }
          >
            Accepted:{" "}
            {document.acceptedFormats}
          </Text>
        </View>
      </View>

      {uploaded ? (
        <View
          style={styles.uploadedFile}
        >
          <View
            style={
              styles.uploadedFileIcon
            }
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={
                styles.uploadedFileName
              }
              numberOfLines={1}
            >
              {document.fileName}
            </Text>

            <Text
              style={
                styles.uploadedFileDate
              }
            >
              Uploaded{" "}
              {document.uploadedAt}
            </Text>
          </View>

          <StatusBadge
            status={document.status}
          />
        </View>
      ) : null}

      <View
        style={styles.documentActions}
      >
        {!uploaded ? (
          <Button
            mode="contained"
            icon="file-upload-outline"
            onPress={onUpload}
          >
            Select file
          </Button>
        ) : (
          <>
            <Button
              mode="outlined"
              icon="file-replace-outline"
              onPress={onReplace}
            >
              Replace
            </Button>

            <Button
              mode="text"
              icon="delete-outline"
              textColor={colors.error}
              onPress={onRemove}
            >
              Remove
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: DocumentStatus;
}) {
  const icon: IconName =
    status === "Verified"
      ? "check-decagram"
      : status === "Rejected"
        ? "close-circle"
        : status === "Uploaded"
          ? "clock-check-outline"
          : "clock-outline";

  return (
    <View style={styles.statusBadge}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={
          status === "Rejected"
            ? colors.error
            : status === "Verified"
              ? colors.success
              : colors.primary
        }
      />

      <Text style={styles.statusText}>
        {status}
      </Text>
    </View>
  );
}

function ProgressStep({
  number,
  title,
  active = false,
  complete = false,
}: {
  number: string;
  title: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <View style={styles.progressStep}>
      <View
        style={[
          styles.progressCircle,
          active &&
            styles.progressCircleActive,
          complete &&
            styles.progressCircleComplete,
        ]}
      >
        <MaterialCommunityIcons
          name={
            complete
              ? "check"
              : (`numeric-${number}` as IconName)
          }
          size={17}
          color={
            active || complete
              ? colors.white
              : colors.textMuted
          }
        />
      </View>

      <Text
        style={[
          styles.progressStepTitle,
          (active || complete) &&
            styles.progressStepTitleActive,
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

function ProgressLine({
  complete = false,
}: {
  complete?: boolean;
}) {
  return (
    <View
      style={[
        styles.progressLine,
        complete &&
          styles.progressLineComplete,
      ]}
    />
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
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>
        {label}
      </Text>

      <Text style={styles.summaryRowValue}>
        {value}
      </Text>
    </View>
  );
}

function getSampleFileName(
  documentId: DocumentType,
) {
  const fileNames: Record<
    DocumentType,
    string
  > = {
    identity: "passport.pdf",
    rightToRent:
      "right-to-rent-evidence.pdf",
    income: "latest-payslips.pdf",
    bankStatement:
      "bank-statements.pdf",
    employment:
      "employment-contract.pdf",
    landlordReference:
      "landlord-reference.pdf",
    guarantor:
      "guarantor-documents.pdf",
  };

  return fileNames[documentId];
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
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  logo: {
    width: 48,
    height: 48,
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
  },

  progressSteps: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  progressStep: {
    width: 95,
    alignItems: "center",
  },

  progressCircle: {
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.background,
  },

  progressCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  progressCircleComplete: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },

  progressStepTitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },

  progressStepTitleActive: {
    color: colors.textPrimary,
  },

  progressLine: {
    width: 55,
    height: 2,
    marginTop: 18,
    backgroundColor: colors.border,
  },

  progressLineComplete: {
    backgroundColor: colors.success,
  },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  heroIcon: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  heroContent: {
    flex: 1,
  },

  heroLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  heroTitle: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 30,
  },

  heroDescription: {
    maxWidth: 760,
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 17,
  },

  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },

  layoutStacked: {
    flexDirection: "column",
  },

  mainColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.lg,
  },

  sideColumn: {
    width: 340,
    gap: spacing.lg,
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
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  progressTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  progressDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  progressPercentage: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "900",
  },

  progressBar: {
    height: 9,
    marginTop: spacing.lg,
    borderRadius: 5,
  },

  completedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.successLight,
  },

  completedNoticeText: {
    flex: 1,
    color: colors.success,
    fontSize: 9,
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  documentList: {
    gap: spacing.md,
  },

  documentCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  documentCardUploaded: {
    borderColor: colors.success,
  },

  documentTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  documentIcon: {
    width: 55,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  documentIconUploaded: {
    backgroundColor: colors.successLight,
  },

  documentContent: {
    flex: 1,
  },

  documentTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  documentTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  documentDescription: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  documentFormats: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  uploadedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  uploadedFileIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.white,
  },

  uploadedFileName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  uploadedFileDate: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusText: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
  },

  documentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },

  submitCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  submitInformation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  submitTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  submitDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  submitActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.md,
  },

  summaryCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  summaryIcon: {
    width: 57,
    height: 57,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  summaryLabel: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  summaryTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  divider: {
    marginVertical: spacing.lg,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  summaryRowLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  summaryRowValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
    textAlign: "right",
  },

  securityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.successLight,
  },

  securityTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  securityDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  helpTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  helpDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },
});