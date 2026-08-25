import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Dialog,
  Menu,
  Portal,
  Searchbar,
  Switch,
  TextInput,
} from "react-native-paper";

import { colors, radius, spacing } from "../../src/theme";
import LandlordModuleScreen from "./LandlordModuleScreen";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type DocumentCategory =
  | "Gas Safety Certificate"
  | "EPC"
  | "EICR"
  | "Tenancy Agreement"
  | "Deposit Protection"
  | "Insurance"
  | "Landlord Licence"
  | "Inventory"
  | "Right to Rent"
  | "Identity"
  | "Other";

type DocumentStatus =
  | "Valid"
  | "Expiring soon"
  | "Expired"
  | "Pending review"
  | "Rejected"
  | "No expiry";

type ApprovalStatus =
  | "Approved"
  | "Pending"
  | "Rejected";

type DocumentRecord = {
  id: string;

  title: string;
  category: DocumentCategory;
  description: string;

  propertyId: string;
  propertyAddress: string;

  tenantName: string;

  documentNumber: string;
  issuingOrganisation: string;

  issueDate: string;
  expiryDate: string;
  hasExpiryDate: boolean;

  status: DocumentStatus;
  approvalStatus: ApprovalStatus;

  fileName: string;
  fileType: string;
  fileSize: string;

  uploadedDate: string;
  uploadedBy: string;

  reminderEnabled: boolean;
  reminderDays: string;

  agentNotes: string;
  rejectionReason: string;
};

type DocumentErrors = Partial<
  Record<keyof DocumentRecord, string>
>;

const emptyDocument: DocumentRecord = {
  id: "",

  title: "",
  category: "Other",
  description: "",

  propertyId: "",
  propertyAddress: "",

  tenantName: "",

  documentNumber: "",
  issuingOrganisation: "",

  issueDate: "",
  expiryDate: "",
  hasExpiryDate: true,

  status: "Pending review",
  approvalStatus: "Pending",

  fileName: "",
  fileType: "",
  fileSize: "",

  uploadedDate: "",
  uploadedBy: "Landlord",

  reminderEnabled: true,
  reminderDays: "30",

  agentNotes: "",
  rejectionReason: "",
};

const initialDocuments: DocumentRecord[]= [];

const categoryOptions: DocumentCategory[] = [
  "Gas Safety Certificate",
  "EPC",
  "EICR",
  "Tenancy Agreement",
  "Deposit Protection",
  "Insurance",
  "Landlord Licence",
  "Inventory",
  "Right to Rent",
  "Identity",
  "Other",
];

const statusOptions: DocumentStatus[] = [
  "Valid",
  "Expiring soon",
  "Expired",
  "Pending review",
  "Rejected",
  "No expiry",
];

const approvalOptions: ApprovalStatus[] = [
  "Approved",
  "Pending",
  "Rejected",
];

export default function LandlordDocumentsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;

  const [documents, setDocuments] =
    useState<DocumentRecord[]>(initialDocuments);

  const [searchText, setSearchText] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState<"All" | DocumentCategory>("All");

  const [statusFilter, setStatusFilter] =
    useState<"All" | DocumentStatus>("All");

  const [showCategoryMenu, setShowCategoryMenu] =
    useState(false);

  const [showStatusMenu, setShowStatusMenu] =
    useState(false);

  const [showFormDialog, setShowFormDialog] =
    useState(false);

  const [showDetailsDialog, setShowDetailsDialog] =
    useState(false);

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentRecord | null>(null);

  const [documentForm, setDocumentForm] =
    useState<DocumentRecord>(emptyDocument);

  const [formErrors, setFormErrors] =
    useState<DocumentErrors>({});

  const filteredDocuments = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return documents.filter((document) => {
      const searchableText = [
        document.id,
        document.title,
        document.category,
        document.propertyId,
        document.propertyAddress,
        document.tenantName,
        document.documentNumber,
        document.issuingOrganisation,
        document.fileName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        document.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        document.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    documents,
    searchText,
    categoryFilter,
    statusFilter,
  ]);

  const validCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.status === "Valid" ||
          document.status === "No expiry",
      ).length,
    [documents],
  );

  const expiringCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.status === "Expiring soon",
      ).length,
    [documents],
  );

  const expiredCount = useMemo(
    () =>
      documents.filter(
        (document) => document.status === "Expired",
      ).length,
    [documents],
  );

  const pendingCount = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.approvalStatus === "Pending",
      ).length,
    [documents],
  );

  const updateForm = <
    K extends keyof DocumentRecord,
  >(
    field: K,
    value: DocumentRecord[K],
  ) => {
    setDocumentForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const openAddDocument = () => {
    setEditingId(null);

    setDocumentForm({
      ...emptyDocument,
      id: createDocumentId(documents),
      uploadedDate: getDisplayDate(),
    });

    setFormErrors({});
    setShowFormDialog(true);
  };

  const openEditDocument = (
    document: DocumentRecord,
  ) => {
    setEditingId(document.id);
    setDocumentForm({ ...document });
    setFormErrors({});
    setShowDetailsDialog(false);
    setShowFormDialog(true);
  };

  const openDetails = (
    document: DocumentRecord,
  ) => {
    setSelectedDocument(document);
    setShowDetailsDialog(true);
  };

  const requestDelete = (
    document: DocumentRecord,
  ) => {
    setSelectedDocument(document);
    setShowDetailsDialog(false);
    setShowDeleteDialog(true);
  };

  const validateForm = () => {
    const errors: DocumentErrors = {};

    if (!documentForm.title.trim()) {
      errors.title = "Document title is required.";
    }

    if (!documentForm.propertyAddress.trim()) {
      errors.propertyAddress =
        "Property address is required.";
    }

    if (!documentForm.issueDate.trim()) {
      errors.issueDate =
        "Issue date is required.";
    }

    if (
      documentForm.hasExpiryDate &&
      !documentForm.expiryDate.trim()
    ) {
      errors.expiryDate =
        "Expiry date is required.";
    }

    if (!documentForm.fileName.trim()) {
      errors.fileName =
        "Add a document file.";
    }

    if (
      documentForm.reminderEnabled &&
      (!documentForm.reminderDays.trim() ||
        Number(documentForm.reminderDays) <= 0)
    ) {
      errors.reminderDays =
        "Enter valid reminder days.";
    }

    if (
      documentForm.approvalStatus === "Rejected" &&
      !documentForm.rejectionReason.trim()
    ) {
      errors.rejectionReason =
        "Enter the rejection reason.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const saveDocument = () => {
    if (!validateForm()) {
      return;
    }

    const preparedDocument: DocumentRecord = {
      ...documentForm,
      expiryDate: documentForm.hasExpiryDate
        ? documentForm.expiryDate
        : "",
      status: documentForm.hasExpiryDate
        ? documentForm.status
        : "No expiry",
      reminderEnabled:
        documentForm.hasExpiryDate &&
        documentForm.reminderEnabled,
      reminderDays: documentForm.hasExpiryDate
        ? documentForm.reminderDays
        : "",
    };

    if (editingId) {
      setDocuments((current) =>
        current.map((document) =>
          document.id === editingId
            ? preparedDocument
            : document,
        ),
      );
    } else {
      setDocuments((current) => [
        preparedDocument,
        ...current,
      ]);
    }

    setShowFormDialog(false);
    setEditingId(null);
    setDocumentForm(emptyDocument);
    setFormErrors({});
  };

  const deleteSelectedDocument = () => {
    if (!selectedDocument) {
      return;
    }

    setDocuments((current) =>
      current.filter(
        (document) =>
          document.id !== selectedDocument.id,
      ),
    );

    setSelectedDocument(null);
    setShowDeleteDialog(false);
  };

  const changeSelectedApproval = (
    approvalStatus: ApprovalStatus,
  ) => {
    if (!selectedDocument) {
      return;
    }

    const updatedDocument: DocumentRecord = {
      ...selectedDocument,
      approvalStatus,
      status:
        approvalStatus === "Rejected"
          ? "Rejected"
          : approvalStatus === "Pending"
            ? "Pending review"
            : selectedDocument.hasExpiryDate
              ? selectedDocument.status ===
                  "Pending review" ||
                selectedDocument.status === "Rejected"
                ? "Valid"
                : selectedDocument.status
              : "No expiry",
    };

    setDocuments((current) =>
      current.map((document) =>
        document.id === selectedDocument.id
          ? updatedDocument
          : document,
      ),
    );

    setSelectedDocument(updatedDocument);
  };

  const addExampleFile = () => {
    const normalisedTitle =
      documentForm.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "document";

    updateForm(
      "fileName",
      `${normalisedTitle}.pdf`,
    );

    updateForm("fileType", "PDF");
    updateForm("fileSize", "1.2 MB");
  };

  const clearFilters = () => {
    setSearchText("");
    setCategoryFilter("All");
    setStatusFilter("All");
  };

  return (
    <>
      <LandlordModuleScreen
        pageTitle="Documents"
        pageSubtitle="Store property documents, monitor certificate expiry dates and submit records for agent approval."
        activePage="Documents"
        primaryAction="Add document"
        primaryActionIcon="file-plus-outline"
        onPrimaryAction={openAddDocument}
        statistics={[
          {
            label: "Total documents",
            value: String(documents.length),
            icon: "file-document-multiple-outline",
            helper: "All property and tenancy records",
          },
          {
            label: "Valid documents",
            value: String(validCount),
            icon: "shield-check-outline",
            helper: "Approved and currently valid",
          },
          {
            label: "Expiring soon",
            value: String(expiringCount),
            icon: "calendar-alert",
            helper: "Renewal action required",
          },
          {
            label: "Pending review",
            value: String(pendingCount),
            icon: "clock-check-outline",
            helper: `${expiredCount} expired document${
              expiredCount === 1 ? "" : "s"
            }`,
          },
        ]}
      >
        <View style={styles.pageContent}>
          <View style={styles.filterCard}>
            <View
              style={[
                styles.filterRow,
                !isTablet &&
                  styles.filterRowMobile,
              ]}
            >
              <Searchbar
                placeholder="Search by document, property, tenant or file name"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchbar}
                inputStyle={styles.searchbarInput}
              />

              <View
                style={[
                  styles.filterButtons,
                  !isTablet &&
                    styles.filterButtonsMobile,
                ]}
              >
                <Menu
                  visible={showCategoryMenu}
                  onDismiss={() =>
                    setShowCategoryMenu(false)
                  }
                  anchor={
                    <Button
                      mode="outlined"
                      icon="file-tree-outline"
                      onPress={() =>
                        setShowCategoryMenu(true)
                      }
                      style={styles.filterButton}
                    >
                      {categoryFilter === "All"
                        ? "All categories"
                        : categoryFilter}
                    </Button>
                  }
                >
                  <Menu.Item
                    title="All categories"
                    onPress={() => {
                      setCategoryFilter("All");
                      setShowCategoryMenu(false);
                    }}
                  />

                  {categoryOptions.map(
                    (category) => (
                      <Menu.Item
                        key={category}
                        title={category}
                        onPress={() => {
                          setCategoryFilter(category);
                          setShowCategoryMenu(false);
                        }}
                      />
                    ),
                  )}
                </Menu>

                <Menu
                  visible={showStatusMenu}
                  onDismiss={() =>
                    setShowStatusMenu(false)
                  }
                  anchor={
                    <Button
                      mode="outlined"
                      icon="list-status"
                      onPress={() =>
                        setShowStatusMenu(true)
                      }
                      style={styles.filterButton}
                    >
                      {statusFilter === "All"
                        ? "All statuses"
                        : statusFilter}
                    </Button>
                  }
                >
                  <Menu.Item
                    title="All statuses"
                    onPress={() => {
                      setStatusFilter("All");
                      setShowStatusMenu(false);
                    }}
                  />

                  {statusOptions.map((status) => (
                    <Menu.Item
                      key={status}
                      title={status}
                      onPress={() => {
                        setStatusFilter(status);
                        setShowStatusMenu(false);
                      }}
                    />
                  ))}
                </Menu>

                <Button
                  mode="text"
                  icon="filter-remove-outline"
                  onPress={clearFilters}
                >
                  Clear
                </Button>
              </View>
            </View>

            <Text style={styles.resultText}>
              Showing {filteredDocuments.length} of{" "}
              {documents.length} documents
            </Text>
          </View>

          {filteredDocuments.length === 0 ? (
            <EmptyDocuments
              onAddDocument={openAddDocument}
              onClearFilters={clearFilters}
            />
          ) : (
            <View
              style={[
                styles.documentGrid,
                isDesktop
                  ? styles.documentGridDesktop
                  : isTablet
                    ? styles.documentGridTablet
                    : styles.documentGridMobile,
              ]}
            >
              {filteredDocuments.map(
                (document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onView={() =>
                      openDetails(document)
                    }
                    onEdit={() =>
                      openEditDocument(document)
                    }
                    onDelete={() =>
                      requestDelete(document)
                    }
                  />
                ),
              )}
            </View>
          )}
        </View>
      </LandlordModuleScreen>

      <Portal>
        <Dialog
          visible={showFormDialog}
          onDismiss={() =>
            setShowFormDialog(false)
          }
          style={styles.formDialog}
        >
          <Dialog.Title>
            {editingId
              ? "Edit document"
              : "Add document"}
          </Dialog.Title>

          <Dialog.ScrollArea
            style={styles.dialogScrollArea}
          >
            <ScrollView
              contentContainerStyle={
                styles.formContent
              }
              keyboardShouldPersistTaps="handled"
            >
              <FormSection
                icon="file-document-outline"
                title="Document information"
                subtitle="Enter the document title, category and description."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Document title *"
                    value={documentForm.title}
                    onChangeText={(value) =>
                      updateForm("title", value)
                    }
                    error={formErrors.title}
                    icon="format-title"
                  />

                  <FormTextInput
                    label="Document number"
                    value={
                      documentForm.documentNumber
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "documentNumber",
                        value,
                      )
                    }
                    icon="identifier"
                  />

                  <FormTextInput
                    label="Issuing organisation"
                    value={
                      documentForm.issuingOrganisation
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "issuingOrganisation",
                        value,
                      )
                    }
                    icon="office-building-outline"
                  />
                </ResponsiveFields>

                <SelectionGroup
                  label="Document category"
                  value={documentForm.category}
                  options={categoryOptions}
                  onSelect={(value) =>
                    updateForm("category", value)
                  }
                />

                <FormTextInput
                  label="Description"
                  value={
                    documentForm.description
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "description",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={4}
                  icon="text-long"
                />
              </FormSection>

              <FormSection
                icon="home-outline"
                title="Property and tenant"
                subtitle="Connect the document to a property and tenant."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Property ID"
                    value={
                      documentForm.propertyId
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "propertyId",
                        value.toUpperCase(),
                      )
                    }
                    icon="home-outline"
                    autoCapitalize="characters"
                  />

                  <FormTextInput
                    label="Property address *"
                    value={
                      documentForm.propertyAddress
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "propertyAddress",
                        value,
                      )
                    }
                    error={
                      formErrors.propertyAddress
                    }
                    icon="map-marker-outline"
                  />

                  <FormTextInput
                    label="Tenant name"
                    value={
                      documentForm.tenantName
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "tenantName",
                        value,
                      )
                    }
                    icon="account-outline"
                  />
                </ResponsiveFields>
              </FormSection>

              <FormSection
                icon="calendar-range"
                title="Dates and expiry"
                subtitle="Record when the document was issued and when it expires."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Issue date *"
                    value={
                      documentForm.issueDate
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "issueDate",
                        value,
                      )
                    }
                    error={formErrors.issueDate}
                    placeholder="DD Month YYYY"
                    icon="calendar-outline"
                  />

                  {documentForm.hasExpiryDate ? (
                    <FormTextInput
                      label="Expiry date *"
                      value={
                        documentForm.expiryDate
                      }
                      onChangeText={(value) =>
                        updateForm(
                          "expiryDate",
                          value,
                        )
                      }
                      error={formErrors.expiryDate}
                      placeholder="DD Month YYYY"
                      icon="calendar-alert"
                    />
                  ) : null}
                </ResponsiveFields>

                <ToggleRow
                  icon="calendar-remove-outline"
                  title="Document has an expiry date"
                  description="Turn this off for records such as signed agreements that do not expire."
                  value={
                    documentForm.hasExpiryDate
                  }
                  onValueChange={(value) => {
                    updateForm(
                      "hasExpiryDate",
                      value,
                    );

                    if (!value) {
                      updateForm(
                        "status",
                        "No expiry",
                      );
                      updateForm(
                        "reminderEnabled",
                        false,
                      );
                    }
                  }}
                />

                {documentForm.hasExpiryDate ? (
                  <SelectionGroup
                    label="Document status"
                    value={documentForm.status}
                    options={statusOptions.filter(
                      (status) =>
                        status !== "No expiry",
                    )}
                    onSelect={(value) =>
                      updateForm("status", value)
                    }
                  />
                ) : null}
              </FormSection>

              <FormSection
                icon="cloud-upload-outline"
                title="Document file"
                subtitle="Attach the document file to this record."
              >
                <View style={styles.uploadBox}>
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={42}
                    color={colors.primary}
                  />

                  <Text style={styles.uploadTitle}>
                    Upload document
                  </Text>

                  <Text style={styles.uploadText}>
                    Select a PDF or image document.
                    This frontend version stores the
                    example file name while the app
                    remains open.
                  </Text>

                  <Button
                    mode="outlined"
                    icon="paperclip"
                    onPress={addExampleFile}
                  >
                    Select document
                  </Button>
                </View>

                {documentForm.fileName ? (
                  <View style={styles.filePreview}>
                    <View style={styles.fileIcon}>
                      <MaterialCommunityIcons
                        name="file-pdf-box"
                        size={30}
                        color={colors.error}
                      />
                    </View>

                    <View style={styles.fileInformation}>
                      <Text
                        style={styles.fileName}
                        numberOfLines={1}
                      >
                        {documentForm.fileName}
                      </Text>

                      <Text style={styles.fileMeta}>
                        {documentForm.fileType ||
                          "File"}
                        {documentForm.fileSize
                          ? ` · ${documentForm.fileSize}`
                          : ""}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.removeFileButton}
                      onPress={() => {
                        updateForm("fileName", "");
                        updateForm("fileType", "");
                        updateForm("fileSize", "");
                      }}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={19}
                        color={colors.error}
                      />
                    </Pressable>
                  </View>
                ) : null}

                {formErrors.fileName ? (
                  <Text style={styles.inputError}>
                    {formErrors.fileName}
                  </Text>
                ) : null}
              </FormSection>

              <FormSection
                icon="bell-ring-outline"
                title="Expiry reminder"
                subtitle="Receive a reminder before the document expires."
              >
                <ToggleRow
                  icon="bell-outline"
                  title="Enable expiry reminder"
                  description="Show an alert before the expiry date."
                  value={
                    documentForm.reminderEnabled
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "reminderEnabled",
                      value,
                    )
                  }
                  disabled={
                    !documentForm.hasExpiryDate
                  }
                />

                {documentForm.hasExpiryDate &&
                documentForm.reminderEnabled ? (
                  <FormTextInput
                    label="Reminder before expiry (days) *"
                    value={
                      documentForm.reminderDays
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "reminderDays",
                        numbersOnly(value),
                      )
                    }
                    error={
                      formErrors.reminderDays
                    }
                    keyboardType="number-pad"
                    icon="calendar-clock-outline"
                  />
                ) : null}
              </FormSection>

              <FormSection
                icon="check-decagram-outline"
                title="Agent review"
                subtitle="Track whether the document has been approved."
              >
                <SelectionGroup
                  label="Approval status"
                  value={
                    documentForm.approvalStatus
                  }
                  options={approvalOptions}
                  onSelect={(value) => {
                    updateForm(
                      "approvalStatus",
                      value,
                    );

                    if (value === "Rejected") {
                      updateForm(
                        "status",
                        "Rejected",
                      );
                    }
                  }}
                />

                <FormTextInput
                  label="Agent notes"
                  value={
                    documentForm.agentNotes
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "agentNotes",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={4}
                  icon="note-text-outline"
                />

                {documentForm.approvalStatus ===
                "Rejected" ? (
                  <FormTextInput
                    label="Rejection reason *"
                    value={
                      documentForm.rejectionReason
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "rejectionReason",
                        value,
                      )
                    }
                    error={
                      formErrors.rejectionReason
                    }
                    multiline
                    numberOfLines={4}
                    icon="alert-circle-outline"
                  />
                ) : null}
              </FormSection>

              <FormSection
                icon="account-arrow-up-outline"
                title="Upload information"
                subtitle="Record who added the document and when."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Uploaded by"
                    value={
                      documentForm.uploadedBy
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "uploadedBy",
                        value,
                      )
                    }
                    icon="account-outline"
                  />

                  <FormTextInput
                    label="Upload date"
                    value={
                      documentForm.uploadedDate
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "uploadedDate",
                        value,
                      )
                    }
                    placeholder="DD Month YYYY"
                    icon="calendar-outline"
                  />
                </ResponsiveFields>
              </FormSection>
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setShowFormDialog(false)
              }
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              icon="content-save-outline"
              onPress={saveDocument}
            >
              {editingId
                ? "Save changes"
                : "Add document"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showDetailsDialog}
          onDismiss={() =>
            setShowDetailsDialog(false)
          }
          style={styles.detailsDialog}
        >
          {selectedDocument ? (
            <>
              <Dialog.Title>
                Document details
              </Dialog.Title>

              <Dialog.ScrollArea
                style={styles.dialogScrollArea}
              >
                <ScrollView
                  contentContainerStyle={
                    styles.detailsContent
                  }
                >
                  <DocumentDetails
                    document={selectedDocument}
                  />
                </ScrollView>
              </Dialog.ScrollArea>

              <Dialog.Actions
                style={styles.detailsActions}
              >
                <Button
                  icon="delete-outline"
                  textColor={colors.error}
                  onPress={() =>
                    requestDelete(
                      selectedDocument,
                    )
                  }
                >
                  Delete
                </Button>

                <Button
                  icon="pencil-outline"
                  onPress={() =>
                    openEditDocument(
                      selectedDocument,
                    )
                  }
                >
                  Edit
                </Button>

                {selectedDocument.approvalStatus ===
                "Pending" ? (
                  <>
                    <Button
                      icon="close-circle-outline"
                      textColor={colors.error}
                      onPress={() =>
                        changeSelectedApproval(
                          "Rejected",
                        )
                      }
                    >
                      Reject
                    </Button>

                    <Button
                      icon="check-circle-outline"
                      onPress={() =>
                        changeSelectedApproval(
                          "Approved",
                        )
                      }
                    >
                      Approve
                    </Button>
                  </>
                ) : null}

                <Button
                  mode="contained"
                  onPress={() =>
                    setShowDetailsDialog(false)
                  }
                >
                  Close
                </Button>
              </Dialog.Actions>
            </>
          ) : null}
        </Dialog>

        <Dialog
          visible={showDeleteDialog}
          onDismiss={() =>
            setShowDeleteDialog(false)
          }
        >
          <Dialog.Icon icon="alert-outline" />

          <Dialog.Title>
            Delete document?
          </Dialog.Title>

          <Dialog.Content>
            <Text style={styles.deleteText}>
              {selectedDocument
                ? `Are you sure you want to delete "${selectedDocument.title}"?`
                : "Are you sure you want to delete this document?"}
            </Text>

            <Text style={styles.deleteWarning}>
              This action cannot be undone.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setShowDeleteDialog(false)
              }
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              buttonColor={colors.error}
              icon="delete-outline"
              onPress={deleteSelectedDocument}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function DocumentCard({
  document,
  onView,
  onEdit,
  onDelete,
}: {
  document: DocumentRecord;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.documentCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onView}
      accessibilityRole="button"
      accessibilityLabel={`View ${document.title}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.documentIcon}>
          <MaterialCommunityIcons
            name={getDocumentIcon(
              document.category,
            )}
            size={30}
            color={colors.primary}
          />
        </View>

        <View style={styles.cardTitleArea}>
          <Text
            style={styles.cardTitle}
            numberOfLines={2}
          >
            {document.title}
          </Text>

          <Text style={styles.documentId}>
            {document.id} · {document.propertyId}
          </Text>
        </View>

        <StatusBadge status={document.status} />
      </View>

      <Text
        style={styles.categoryText}
        numberOfLines={1}
      >
        {document.category}
      </Text>

      <Text
        style={styles.propertyAddress}
        numberOfLines={2}
      >
        {document.propertyAddress}
      </Text>

      <View style={styles.informationGrid}>
        <InformationItem
          icon="calendar-check-outline"
          label="Issued"
          value={document.issueDate || "Not entered"}
        />

        <InformationItem
          icon="calendar-alert"
          label="Expires"
          value={
            document.hasExpiryDate
              ? document.expiryDate || "Not entered"
              : "No expiry"
          }
        />

        <InformationItem
          icon="account-outline"
          label="Tenant"
          value={
            document.tenantName ||
            "Property document"
          }
        />

        <InformationItem
          icon="file-outline"
          label="File"
          value={
            document.fileName || "No file"
          }
        />
      </View>

      <View style={styles.cardFooter}>
        <ApprovalBadge
          approval={
            document.approvalStatus
          }
        />

        {document.reminderEnabled ? (
          <View style={styles.reminderLabel}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={15}
              color={colors.primary}
            />

            <Text style={styles.reminderText}>
              {document.reminderDays} days
            </Text>
          </View>
        ) : (
          <Text style={styles.noReminderText}>
            No reminder
          </Text>
        )}
      </View>

      <View style={styles.cardActions}>
        <Button
          mode="text"
          compact
          icon="eye-outline"
          onPress={onView}
        >
          View
        </Button>

        <Button
          mode="text"
          compact
          icon="pencil-outline"
          onPress={onEdit}
        >
          Edit
        </Button>

        <Button
          mode="text"
          compact
          icon="delete-outline"
          textColor={colors.error}
          onPress={onDelete}
        >
          Delete
        </Button>
      </View>
    </Pressable>
  );
}

function DocumentDetails({
  document,
}: {
  document: DocumentRecord;
}) {
  return (
    <View style={styles.detailsWrapper}>
      <View style={styles.detailsHero}>
        <View style={styles.detailsHeroIcon}>
          <MaterialCommunityIcons
            name={getDocumentIcon(
              document.category,
            )}
            size={38}
            color={colors.primary}
          />
        </View>

        <View style={styles.detailsHeroText}>
          <Text style={styles.detailsTitle}>
            {document.title}
          </Text>

          <Text style={styles.detailsSubtitle}>
            {document.id} · {document.category}
          </Text>

          <View style={styles.badgeRow}>
            <StatusBadge status={document.status} />

            <ApprovalBadge
              approval={
                document.approvalStatus
              }
            />
          </View>
        </View>
      </View>

      <DetailsSection
        icon="file-document-outline"
        title="Document"
      >
        <DetailsGrid>
          <DetailItem
            label="Document ID"
            value={document.id}
          />

          <DetailItem
            label="Category"
            value={document.category}
          />

          <DetailItem
            label="Document number"
            value={
              document.documentNumber || "—"
            }
          />

          <DetailItem
            label="Issued by"
            value={
              document.issuingOrganisation ||
              "Not entered"
            }
          />
        </DetailsGrid>

        <Text style={styles.detailsParagraph}>
          {document.description ||
            "No description entered."}
        </Text>
      </DetailsSection>

      <DetailsSection
        icon="home-outline"
        title="Property and tenant"
      >
        <DetailsGrid>
          <DetailItem
            label="Property ID"
            value={document.propertyId || "—"}
          />

          <DetailItem
            label="Property"
            value={document.propertyAddress}
          />

          <DetailItem
            label="Tenant"
            value={
              document.tenantName ||
              "Not connected to a tenant"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="calendar-range"
        title="Dates and reminders"
      >
        <DetailsGrid>
          <DetailItem
            label="Issue date"
            value={document.issueDate}
          />

          <DetailItem
            label="Expiry date"
            value={
              document.hasExpiryDate
                ? document.expiryDate
                : "No expiry"
            }
          />

          <DetailItem
            label="Reminder"
            value={
              document.reminderEnabled
                ? `${document.reminderDays} days before expiry`
                : "Disabled"
            }
          />

          <DetailItem
            label="Uploaded"
            value={
              document.uploadedDate ||
              "Not entered"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="paperclip"
        title="File"
      >
        <View style={styles.filePreview}>
          <View style={styles.fileIcon}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={30}
              color={colors.error}
            />
          </View>

          <View style={styles.fileInformation}>
            <Text style={styles.fileName}>
              {document.fileName ||
                "No file attached"}
            </Text>

            <Text style={styles.fileMeta}>
              {document.fileType || "File"}
              {document.fileSize
                ? ` · ${document.fileSize}`
                : ""}
            </Text>
          </View>

          <Button
            mode="outlined"
            compact
            icon="eye-outline"
            onPress={() => {}}
            disabled={!document.fileName}
          >
            Preview
          </Button>
        </View>
      </DetailsSection>

      <DetailsSection
        icon="check-decagram-outline"
        title="Agent review"
      >
        <DetailsGrid>
          <DetailItem
            label="Approval status"
            value={
              document.approvalStatus
            }
          />

          <DetailItem
            label="Uploaded by"
            value={
              document.uploadedBy ||
              "Not entered"
            }
          />
        </DetailsGrid>

        <Text style={styles.notesHeading}>
          Agent notes
        </Text>

        <Text style={styles.detailsParagraph}>
          {document.agentNotes ||
            "No agent notes entered."}
        </Text>

        {document.approvalStatus ===
        "Rejected" ? (
          <>
            <Text style={styles.notesHeading}>
              Rejection reason
            </Text>

            <Text
              style={[
                styles.detailsParagraph,
                styles.rejectionText,
              ]}
            >
              {document.rejectionReason ||
                "No rejection reason entered."}
            </Text>
          </>
        ) : null}
      </DetailsSection>
    </View>
  );
}

function EmptyDocuments({
  onAddDocument,
  onClearFilters,
}: {
  onAddDocument: () => void;
  onClearFilters: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons
          name="file-search-outline"
          size={42}
          color={colors.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No documents found
      </Text>

      <Text style={styles.emptyText}>
        Change the search or filters, or add a
        new property document.
      </Text>

      <View style={styles.emptyActions}>
        <Button
          mode="outlined"
          icon="filter-remove-outline"
          onPress={onClearFilters}
        >
          Clear filters
        </Button>

        <Button
          mode="contained"
          icon="file-plus-outline"
          onPress={onAddDocument}
        >
          Add document
        </Button>
      </View>
    </View>
  );
}

function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formSection}>
      <View style={styles.formSectionHeader}>
        <View style={styles.formSectionIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={colors.primary}
          />
        </View>

        <View style={styles.formSectionHeading}>
          <Text style={styles.formSectionTitle}>
            {title}
          </Text>

          <Text style={styles.formSectionSubtitle}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.formSectionBody}>
        {children}
      </View>
    </View>
  );
}

function ResponsiveFields({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.responsiveFields}>
      {children}
    </View>
  );
}

function FormTextInput({
  label,
  value,
  onChangeText,
  error,
  icon,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  icon?: IconName;
} & Omit<
  React.ComponentProps<typeof TextInput>,
  "label" | "value" | "onChangeText" | "error"
>) {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={Boolean(error)}
        left={
          icon ? (
            <TextInput.Icon icon={icon} />
          ) : undefined
        }
        style={styles.formInput}
        {...inputProps}
      />

      {error ? (
        <Text style={styles.inputError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function SelectionGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.selectionGroup}>
      <Text style={styles.selectionLabel}>
        {label}
      </Text>

      <View style={styles.selectionOptions}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.selectionOption,
              value === option &&
                styles.selectionOptionSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.selectionOptionText,
                value === option &&
                  styles.selectionOptionTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        disabled && styles.disabledRow,
      ]}
    >
      <View style={styles.toggleIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={
            disabled
              ? colors.textMuted
              : colors.primary
          }
        />
      </View>

      <View style={styles.toggleTextArea}>
        <Text style={styles.toggleTitle}>
          {title}
        </Text>

        <Text style={styles.toggleDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        color={colors.primary}
      />
    </View>
  );
}

function InformationItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.informationItem}>
      <View style={styles.informationIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={colors.primary}
        />
      </View>

      <View style={styles.informationText}>
        <Text style={styles.informationLabel}>
          {label}
        </Text>

        <Text
          style={styles.informationValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: DocumentStatus;
}) {
  const success =
    status === "Valid" || status === "No expiry";

  const warning =
    status === "Expiring soon" ||
    status === "Pending review";

  const error =
    status === "Expired" ||
    status === "Rejected";

  return (
    <View
      style={[
        styles.badge,
        success && styles.successBadge,
        warning && styles.warningBadge,
        error && styles.errorBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          success && styles.successBadgeText,
          warning && styles.warningBadgeText,
          error && styles.errorBadgeText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function ApprovalBadge({
  approval,
}: {
  approval: ApprovalStatus;
}) {
  return (
    <View
      style={[
        styles.badge,
        approval === "Approved" &&
          styles.successBadge,
        approval === "Pending" &&
          styles.warningBadge,
        approval === "Rejected" &&
          styles.errorBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          approval === "Approved" &&
            styles.successBadgeText,
          approval === "Pending" &&
            styles.warningBadgeText,
          approval === "Rejected" &&
            styles.errorBadgeText,
        ]}
      >
        {approval}
      </Text>
    </View>
  );
}

function DetailsSection({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailsSection}>
      <View style={styles.detailsSectionHeader}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />

        <Text style={styles.detailsSectionTitle}>
          {title}
        </Text>
      </View>

      <View style={styles.detailsSectionBody}>
        {children}
      </View>
    </View>
  );
}

function DetailsGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailsGrid}>
      {children}
    </View>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function createDocumentId(
  documents: DocumentRecord[],
) {
  const highest = documents.reduce(
    (currentHighest, document) => {
      const number =
        Number(
          document.id.replace(/\D/g, ""),
        ) || 0;

      return Math.max(currentHighest, number);
    },
    0,
  );

  return `D${String(highest + 1).padStart(
    3,
    "0",
  )}`;
}

function numbersOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function getDisplayDate() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getDocumentIcon(
  category: DocumentCategory,
): IconName {
  switch (category) {
    case "Gas Safety Certificate":
      return "fire-alert";

    case "EPC":
      return "home-lightning-bolt-outline";

    case "EICR":
      return "lightning-bolt-outline";

    case "Tenancy Agreement":
      return "file-sign";

    case "Deposit Protection":
      return "shield-home-outline";

    case "Insurance":
      return "shield-check-outline";

    case "Landlord Licence":
      return "card-account-details-outline";

    case "Inventory":
      return "clipboard-list-outline";

    case "Right to Rent":
      return "account-check-outline";

    case "Identity":
      return "card-account-details-star-outline";

    default:
      return "file-document-outline";
  }
}

const styles = StyleSheet.create({
  pageContent: {
    width: "100%",
    gap: spacing.xl,
  },

  filterCard: {
    width: "100%",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  filterRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  filterRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  searchbar: {
    flex: 1,
    minWidth: 250,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchbarInput: {
    fontSize: 13,
  },

  filterButtons: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  filterButtonsMobile: {
    width: "100%",
    alignItems: "stretch",
  },

  filterButton: {
    borderColor: colors.border,
  },

  resultText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  documentGrid: {
    width: "100%",
    gap: spacing.lg,
  },

  documentGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  documentGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  documentGridMobile: {
    flexDirection: "column",
  },

  documentCard: {
    flexGrow: 1,
    flexBasis: 340,
    maxWidth: 520,
    minWidth: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  cardPressed: {
    opacity: 0.88,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  documentIcon: {
    width: 54,
    height: 54,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  cardTitleArea: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },

  documentId: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  categoryText: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  propertyAddress: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 17,
  },

  informationGrid: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  informationItem: {
    flexGrow: 1,
    flexBasis: 145,
    minWidth: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  informationIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },

  informationText: {
    flex: 1,
    minWidth: 0,
  },

  informationLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  informationValue: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "700",
  },

  cardFooter: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  reminderLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  reminderText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "800",
  },

  noReminderText: {
    color: colors.textMuted,
    fontSize: 9,
  },

  cardActions: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
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

  emptyCard: {
    width: "100%",
    alignItems: "center",
    padding: spacing.xl * 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
  },

  emptyTitle: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: spacing.sm,
    maxWidth: 420,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  emptyActions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },

  formDialog: {
    width: "94%",
    maxWidth: 1000,
    maxHeight: "94%",
    alignSelf: "center",
  },

  detailsDialog: {
    width: "94%",
    maxWidth: 850,
    maxHeight: "92%",
    alignSelf: "center",
  },

  dialogScrollArea: {
    paddingHorizontal: 0,
  },

  formContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  formSection: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  formSectionIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  formSectionHeading: {
    flex: 1,
  },

  formSectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  formSectionSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },

  formSectionBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  responsiveFields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  inputWrapper: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 220,
  },

  formInput: {
    backgroundColor: colors.white,
  },

  inputError: {
    marginTop: 4,
    marginLeft: 4,
    color: colors.error,
    fontSize: 9,
    fontWeight: "600",
  },

  selectionGroup: {
    gap: spacing.sm,
  },

  selectionLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  selectionOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  selectionOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  selectionOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  selectionOptionText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  selectionOptionTextSelected: {
    color: colors.primary,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  disabledRow: {
    opacity: 0.55,
  },

  toggleIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  toggleTextArea: {
    flex: 1,
    minWidth: 0,
  },

  toggleTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  toggleDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },

  uploadBox: {
    alignItems: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  uploadTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  uploadText: {
    marginTop: 4,
    marginBottom: spacing.md,
    maxWidth: 440,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },

  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  fileIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.errorLight,
  },

  fileInformation: {
    flex: 1,
    minWidth: 0,
  },

  fileName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  fileMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
  },

  removeFileButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.errorLight,
  },

  detailsContent: {
    padding: spacing.lg,
  },

  detailsWrapper: {
    gap: spacing.lg,
  },

  detailsHero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  detailsHeroIcon: {
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.white,
  },

  detailsHeroText: {
    flex: 1,
    minWidth: 0,
  },

  detailsTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  detailsSubtitle: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 11,
  },

  badgeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  detailsSection: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  detailsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  detailsSectionTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  detailsSectionBody: {
    padding: spacing.md,
    gap: spacing.md,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  detailItem: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 150,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  detailLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  detailValue: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },

  detailsParagraph: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },

  notesHeading: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  rejectionText: {
    color: colors.error,
  },

  detailsActions: {
    flexWrap: "wrap",
  },

  deleteText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 19,
  },

  deleteWarning: {
    marginTop: spacing.sm,
    color: colors.error,
    fontSize: 10,
    fontWeight: "800",
  },
});