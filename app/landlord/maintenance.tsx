import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
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
  Divider,
  Menu,
  Portal,
  Searchbar,
  TextInput,
} from "react-native-paper";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import { api } from "../../src/api/client";
import PropertyMaintenanceProviders from "../../src/components/PropertyMaintenanceProviders";
import WorkflowNotifications from "../../src/components/WorkflowNotifications";
import { colors, radius, spacing } from "../../src/theme";
import LandlordModuleScreen from "./LandlordModuleScreen";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type MaintenanceStatus =
  | "Reported"
  | "Awaiting landlord"
  | "Approved"
  | "Contractor assigned"
  | "Appointment booked"
  | "In progress"
  | "Awaiting tenant confirmation"
  | "Completed"
  | "Reopened"
  | "Rejected";

type MaintenancePriority =
  | "Low"
  | "Medium"
  | "High"
  | "Emergency";

type MaintenanceCategory =
  | "Plumbing"
  | "Heating"
  | "Electrical"
  | "Appliance"
  | "Structural"
  | "Security"
  | "Damp and mould"
  | "Pest control"
  | "Other";

type MaintenanceRoute =
  | "Contact landlord first"
  | "Agent can arrange"
  | "Use preferred contractor";

type MaintenanceRequest = {
  id: string;
  propertyId: string;
  propertyAddress: string;

  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;

  title: string;
  description: string;
  category: MaintenanceCategory;
  roomLocation: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;

  dateReported: string;
  tenantAvailability: string;
  accessPermission: boolean;

  maintenanceRoute: MaintenanceRoute;
  landlordDecision: string;

  contractorName: string;
  contractorPhone: string;
  contractorEmail: string;

  appointmentDate: string;
  appointmentTime: string;

  estimatedCost: string;
  finalCost: string;

  emergencyApproval: boolean;
  spendingLimit: string;

  reportedPhotos: string[];
  completionPhotos: string[];

  contractorNotes: string;
  completionNotes: string;
  tenantFeedback: string;
};

type RequestErrors = Partial<
  Record<keyof MaintenanceRequest, string>
>;

const emptyRequest: MaintenanceRequest = {
  id: "",
  propertyId: "",
  propertyAddress: "",

  tenantName: "",
  tenantEmail: "",
  tenantPhone: "",

  title: "",
  description: "",
  category: "Other",
  roomLocation: "",
  priority: "Medium",
  status: "Reported",

  dateReported: "",
  tenantAvailability: "",
  accessPermission: false,

  maintenanceRoute: "Contact landlord first",
  landlordDecision: "",

  contractorName: "",
  contractorPhone: "",
  contractorEmail: "",

  appointmentDate: "",
  appointmentTime: "",

  estimatedCost: "",
  finalCost: "",

  emergencyApproval: false,
  spendingLimit: "",

  reportedPhotos: [],
  completionPhotos: [],

  contractorNotes: "",
  completionNotes: "",
  tenantFeedback: "",
};

const initialRequests: MaintenanceRequest[]= [];

const statusOptions: MaintenanceStatus[] = [
  "Reported",
  "Awaiting landlord",
  "Approved",
  "Contractor assigned",
  "Appointment booked",
  "In progress",
  "Awaiting tenant confirmation",
  "Completed",
  "Reopened",
  "Rejected",
];

const priorityOptions: MaintenancePriority[] = [
  "Low",
  "Medium",
  "High",
  "Emergency",
];

const categoryOptions: MaintenanceCategory[] = [
  "Plumbing",
  "Heating",
  "Electrical",
  "Appliance",
  "Structural",
  "Security",
  "Damp and mould",
  "Pest control",
  "Other",
];

const routeOptions: MaintenanceRoute[] = [
  "Contact landlord first",
  "Agent can arrange",
  "Use preferred contractor",
];

function getMaintenancePhotoUrl(photo: string): string {
  if (!photo) return "";
  if (/^https?:\/\//i.test(photo)) return photo;

  const baseUrl = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  const apiOrigin = baseUrl.replace(/\/api\/v1$/i, "");

  if (photo.startsWith("/api/v1/")) {
    return `${apiOrigin}${photo}`;
  }

  if (photo.startsWith("/")) {
    return `${apiOrigin}${photo}`;
  }

  return `${baseUrl}/${photo}`;
}

export default function LandlordMaintenanceScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;

  const [requests, setRequests] =
    useState<MaintenanceRequest[]>(
      initialRequests,
    );

  const [workflowMessage, setWorkflowMessage] = useState("");

  const mapWorkflowRequest = (row: any): MaintenanceRequest => {
    const status: MaintenanceStatus =
      row.status === "COMPLETED"
        ? "Completed"
        : row.status === "IN_PROGRESS"
          ? "In progress"
          : row.status === "SCHEDULED"
            ? "Appointment booked"
            : row.status === "AWAITING_TENANT_CONFIRMATION"
              ? "Awaiting tenant confirmation"
              : row.status === "REOPENED"
                ? "Reopened"
                : "Reported";

    const priority: MaintenancePriority =
      row.priority === "EMERGENCY"
        ? "Emergency"
        : row.priority === "HIGH"
          ? "High"
          : row.priority === "LOW"
            ? "Low"
            : "Medium";

    const route: MaintenanceRoute =
      row.property?.maintenanceRoute === "AGENT_CAN_ARRANGE"
        ? "Agent can arrange"
        : row.property?.maintenanceRoute === "USE_PREFERRED_CONTRACTOR"
          ? "Use preferred contractor"
          : "Contact landlord first";

    const selectedSlot = (row.slots || []).find((slot: any) => slot.status === "SELECTED");
    const availability = (row.slots || [])
      .filter((slot: any) => slot.proposedBy === "TENANT")
      .map((slot: any) => `${new Date(slot.startAt).toLocaleString("en-GB")} - ${new Date(slot.endAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`)
      .join(" | ");

    return {
      id: row.id,
      propertyId: row.propertyId,
      propertyAddress: [row.property?.addressLine1, row.property?.townCity, row.property?.postcode].filter(Boolean).join(", "),
      tenantName: [row.tenant?.firstName, row.tenant?.lastName].filter(Boolean).join(" ") || "Tenant",
      tenantEmail: row.tenant?.email || "",
      tenantPhone: row.tenant?.phone || "",
      title: row.title,
      description: row.description,
      category: (categoryOptions.includes(row.category as MaintenanceCategory) ? row.category : "Other") as MaintenanceCategory,
      roomLocation: row.roomLocation || "Not specified",
      priority,
      status,
      dateReported: new Date(row.createdAt).toLocaleDateString("en-GB"),
      tenantAvailability: availability,
      accessPermission: Boolean(row.accessPermission),
      maintenanceRoute: route,
      landlordDecision: "",
      contractorName: [row.assignedProvider?.firstName, row.assignedProvider?.lastName].filter(Boolean).join(" "),
      contractorPhone: row.assignedProvider?.phone || "",
      contractorEmail: row.assignedProvider?.email || "",
      appointmentDate: selectedSlot ? new Date(selectedSlot.startAt).toLocaleDateString("en-GB") : "",
      appointmentTime: selectedSlot ? new Date(selectedSlot.startAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "",
      estimatedCost: "",
      finalCost: "",
      emergencyApproval: Boolean(row.property?.emergencyRepairPermission),
      spendingLimit: row.property?.emergencySpendingLimit ? String(row.property.emergencySpendingLimit) : "",
      reportedPhotos: (row.photos || []).filter((photo: any) => photo.phase === "REPORTED").map((photo: any) => photo.url),
      completionPhotos: (row.photos || []).filter((photo: any) => photo.phase === "AFTER").map((photo: any) => photo.url),
      contractorNotes: row.providerNotes || "",
      completionNotes: row.completionNotes || "",
      tenantFeedback: row.tenantCompletionNote || "",
    };
  };

  const loadWorkflowRequests = async () => {
    try {
      setWorkflowMessage("");
      const response = await api.get("/property-workflows/maintenance-requests");
      const rows = Array.isArray(response.data) ? response.data : [];
      setRequests(rows.map(mapWorkflowRequest));
    } catch (error: any) {
      setWorkflowMessage(error?.response?.data?.message || "Unable to load maintenance requests.");
    }
  };

  useEffect(() => {
    void loadWorkflowRequests();
  }, []);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | MaintenanceStatus>(
      "All",
    );

  const [priorityFilter, setPriorityFilter] =
    useState<"All" | MaintenancePriority>(
      "All",
    );

  const [showStatusMenu, setShowStatusMenu] =
    useState(false);

  const [
    showPriorityMenu,
    setShowPriorityMenu,
  ] = useState(false);

  const [showFormDialog, setShowFormDialog] =
    useState(false);

  const [showDetailsDialog, setShowDetailsDialog] =
    useState(false);

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);

  const [requestForm, setRequestForm] =
    useState<MaintenanceRequest>(
      emptyRequest,
    );

  const [formErrors, setFormErrors] =
    useState<RequestErrors>({});

  const filteredRequests = useMemo(() => {
    const search =
      searchText.trim().toLowerCase();

    return requests.filter((request) => {
      const searchableText = [
        request.id,
        request.propertyId,
        request.propertyAddress,
        request.tenantName,
        request.title,
        request.description,
        request.category,
        request.roomLocation,
        request.contractorName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        request.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    requests,
    searchText,
    statusFilter,
    priorityFilter,
  ]);

  const openCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status !== "Completed" &&
          request.status !== "Rejected",
      ).length,
    [requests],
  );

  const emergencyCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.priority === "Emergency",
      ).length,
    [requests],
  );

  const awaitingLandlordCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status ===
          "Awaiting landlord",
      ).length,
    [requests],
  );

  const completedCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "Completed",
      ).length,
    [requests],
  );

  const updateForm = <
    K extends keyof MaintenanceRequest,
  >(
    field: K,
    value: MaintenanceRequest[K],
  ) => {
    setRequestForm((current) => ({
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

  const openAddRequest = () => {
    setEditingId(null);
    setRequestForm({
      ...emptyRequest,
      id: createRequestId(requests),
    });
    setFormErrors({});
    setShowFormDialog(true);
  };

  const openEditRequest = (
    request: MaintenanceRequest,
  ) => {
    setEditingId(request.id);
    setRequestForm({
      ...request,
      reportedPhotos: [
        ...request.reportedPhotos,
      ],
      completionPhotos: [
        ...request.completionPhotos,
      ],
    });
    setFormErrors({});
    setShowDetailsDialog(false);
    setShowFormDialog(true);
  };

  const openDetails = (
    request: MaintenanceRequest,
  ) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const requestDelete = (
    request: MaintenanceRequest,
  ) => {
    setSelectedRequest(request);
    setShowDetailsDialog(false);
    setShowDeleteDialog(true);
  };

  const validateForm = () => {
    const errors: RequestErrors = {};

    if (!requestForm.propertyAddress.trim()) {
      errors.propertyAddress =
        "Property address is required.";
    }

    if (!requestForm.tenantName.trim()) {
      errors.tenantName =
        "Tenant name is required.";
    }

    if (!requestForm.title.trim()) {
      errors.title =
        "Issue title is required.";
    }

    if (!requestForm.description.trim()) {
      errors.description =
        "Issue description is required.";
    }

    if (!requestForm.roomLocation.trim()) {
      errors.roomLocation =
        "Room or location is required.";
    }

    if (!requestForm.dateReported.trim()) {
      errors.dateReported =
        "Reported date is required.";
    }

    if (
      requestForm.estimatedCost &&
      Number(requestForm.estimatedCost) < 0
    ) {
      errors.estimatedCost =
        "Estimated cost cannot be negative.";
    }

    if (
      requestForm.finalCost &&
      Number(requestForm.finalCost) < 0
    ) {
      errors.finalCost =
        "Final cost cannot be negative.";
    }

    if (
      requestForm.emergencyApproval &&
      (!requestForm.spendingLimit.trim() ||
        Number(requestForm.spendingLimit) <= 0)
    ) {
      errors.spendingLimit =
        "Enter an emergency spending limit.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const saveRequest = () => {
    if (!validateForm()) {
      return;
    }

    if (editingId) {
      setRequests((current) =>
        current.map((request) =>
          request.id === editingId
            ? requestForm
            : request,
        ),
      );
    } else {
      setRequests((current) => [
        requestForm,
        ...current,
      ]);
    }

    setShowFormDialog(false);
    setEditingId(null);
    setRequestForm(emptyRequest);
    setFormErrors({});
  };

  const deleteSelectedRequest = () => {
    if (!selectedRequest) {
      return;
    }

    setRequests((current) =>
      current.filter(
        (request) =>
          request.id !== selectedRequest.id,
      ),
    );

    setSelectedRequest(null);
    setShowDeleteDialog(false);
  };

  const updateSelectedStatus = (
    status: MaintenanceStatus,
  ) => {
    if (!selectedRequest) {
      return;
    }

    const updatedRequest = {
      ...selectedRequest,
      status,
    };

    setRequests((current) =>
      current.map((request) =>
        request.id === selectedRequest.id
          ? updatedRequest
          : request,
      ),
    );

    setSelectedRequest(updatedRequest);
  };

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("All");
    setPriorityFilter("All");
  };

  return (
    <>
      <LandlordModuleScreen
        pageTitle="Maintenance"
        pageSubtitle="Review repair requests, approve work, assign contractors and follow each issue to completion."
        activePage="Maintenance"
        primaryAction="Refresh requests"
        primaryActionIcon="refresh"
        onPrimaryAction={() => void loadWorkflowRequests()}
        statistics={[
          {
            label: "Open requests",
            value: String(openCount),
            icon: "tools",
            helper:
              "All active maintenance requests",
          },
          {
            label: "Awaiting decision",
            value: String(
              awaitingLandlordCount,
            ),
            icon: "account-clock-outline",
            helper:
              "Waiting for landlord approval",
          },
          {
            label: "Emergency",
            value: String(emergencyCount),
            icon: "alert-decagram-outline",
            helper:
              "Requires immediate attention",
          },
          {
            label: "Completed",
            value: String(completedCount),
            icon: "check-circle-outline",
            helper:
              "Repairs confirmed complete",
          },
        ]}
      >
        <View style={styles.pageContent}>
          <WorkflowNotifications compact title="Maintenance notifications" limit={6} />

          <PropertyMaintenanceProviders
            actingRole="LANDLORD"
            propertyEndpoint="/landlord-properties"
            title="Property maintenance teams"
            subtitle="Invite providers for your properties. Providers added by the Estate Agent are visible here, and providers you add are shared with the Estate Agent."
          />

          {workflowMessage ? (
            <Text style={{ color: colors.error, fontWeight: "800" }}>{workflowMessage}</Text>
          ) : null}

          <View style={styles.filterCard}>
            <View
              style={[
                styles.filterRow,
                !isTablet &&
                  styles.filterRowMobile,
              ]}
            >
              <Searchbar
                placeholder="Search by request, property, tenant, issue or contractor"
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

                <Menu
                  visible={showPriorityMenu}
                  onDismiss={() =>
                    setShowPriorityMenu(false)
                  }
                  anchor={
                    <Button
                      mode="outlined"
                      icon="alert-outline"
                      onPress={() =>
                        setShowPriorityMenu(true)
                      }
                      style={styles.filterButton}
                    >
                      {priorityFilter === "All"
                        ? "All priorities"
                        : priorityFilter}
                    </Button>
                  }
                >
                  <Menu.Item
                    title="All priorities"
                    onPress={() => {
                      setPriorityFilter("All");
                      setShowPriorityMenu(false);
                    }}
                  />

                  {priorityOptions.map(
                    (priority) => (
                      <Menu.Item
                        key={priority}
                        title={priority}
                        onPress={() => {
                          setPriorityFilter(
                            priority,
                          );
                          setShowPriorityMenu(
                            false,
                          );
                        }}
                      />
                    ),
                  )}
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
              Showing {filteredRequests.length} of{" "}
              {requests.length} requests
            </Text>
          </View>

          {filteredRequests.length === 0 ? (
            <EmptyRequests
              onAddRequest={openAddRequest}
              onClearFilters={clearFilters}
            />
          ) : (
            <View
              style={[
                styles.requestGrid,
                isDesktop
                  ? styles.requestGridDesktop
                  : isTablet
                    ? styles.requestGridTablet
                    : styles.requestGridMobile,
              ]}
            >
              {filteredRequests.map(
                (request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onView={() =>
                      openDetails(request)
                    }
                    onEdit={() =>
                      openEditRequest(request)
                    }
                    onDelete={() =>
                      requestDelete(request)
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
              ? "Edit maintenance request"
              : "Add maintenance request"}
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
                icon="home-outline"
                title="Property and tenant"
                subtitle="Identify the property and person connected to the request."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Property ID"
                    value={requestForm.propertyId}
                    onChangeText={(value) =>
                      updateForm(
                        "propertyId",
                        value.toUpperCase(),
                      )
                    }
                    icon="identifier"
                    autoCapitalize="characters"
                  />

                  <FormTextInput
                    label="Property address *"
                    value={
                      requestForm.propertyAddress
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
                    label="Tenant name *"
                    value={
                      requestForm.tenantName
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "tenantName",
                        value,
                      )
                    }
                    error={formErrors.tenantName}
                    icon="account-outline"
                  />

                  <FormTextInput
                    label="Tenant email"
                    value={
                      requestForm.tenantEmail
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "tenantEmail",
                        value,
                      )
                    }
                    icon="email-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <InternationalPhoneInput
                    label="Tenant phone"
                    value={requestForm.tenantPhone}
                    onChangeText={(value) =>
                      updateForm("tenantPhone", value)
                    }
                  />
                </ResponsiveFields>
              </FormSection>

              <FormSection
                icon="alert-circle-outline"
                title="Issue details"
                subtitle="Record what happened, where it happened and how urgent it is."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Issue title *"
                    value={requestForm.title}
                    onChangeText={(value) =>
                      updateForm("title", value)
                    }
                    error={formErrors.title}
                    icon="format-title"
                  />

                  <FormTextInput
                    label="Room or location *"
                    value={
                      requestForm.roomLocation
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "roomLocation",
                        value,
                      )
                    }
                    error={
                      formErrors.roomLocation
                    }
                    icon="floor-plan"
                  />

                  <FormTextInput
                    label="Date reported *"
                    value={
                      requestForm.dateReported
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "dateReported",
                        value,
                      )
                    }
                    error={
                      formErrors.dateReported
                    }
                    placeholder="DD Month YYYY"
                    icon="calendar-outline"
                  />
                </ResponsiveFields>

                <SelectionGroup
                  label="Category"
                  value={requestForm.category}
                  options={categoryOptions}
                  onSelect={(value) =>
                    updateForm(
                      "category",
                      value,
                    )
                  }
                />

                <SelectionGroup
                  label="Priority"
                  value={requestForm.priority}
                  options={priorityOptions}
                  onSelect={(value) =>
                    updateForm(
                      "priority",
                      value,
                    )
                  }
                />

                <SelectionGroup
                  label="Current status"
                  value={requestForm.status}
                  options={statusOptions}
                  onSelect={(value) =>
                    updateForm("status", value)
                  }
                />

                <FormTextInput
                  label="Issue description *"
                  value={
                    requestForm.description
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "description",
                      value,
                    )
                  }
                  error={formErrors.description}
                  multiline
                  numberOfLines={5}
                  icon="text-long"
                />
              </FormSection>

              <FormSection
                icon="calendar-clock-outline"
                title="Tenant availability and access"
                subtitle="Record suitable times and whether entry is permitted."
              >
                <FormTextInput
                  label="Tenant availability"
                  value={
                    requestForm.tenantAvailability
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "tenantAvailability",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={3}
                  icon="calendar-account-outline"
                />

                <ToggleRow
                  icon="door-open"
                  title="Access permitted"
                  description="The tenant allows access when they are not present."
                  value={
                    requestForm.accessPermission
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "accessPermission",
                      value,
                    )
                  }
                />
              </FormSection>

              <FormSection
                icon="account-check-outline"
                title="Landlord decision"
                subtitle="Choose how this maintenance request should be routed."
              >
                <SelectionGroup
                  label="Maintenance route"
                  value={
                    requestForm.maintenanceRoute
                  }
                  options={routeOptions}
                  onSelect={(value) =>
                    updateForm(
                      "maintenanceRoute",
                      value,
                    )
                  }
                />

                <FormTextInput
                  label="Decision or instruction"
                  value={
                    requestForm.landlordDecision
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "landlordDecision",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={4}
                  icon="message-text-outline"
                />

                <ToggleRow
                  icon="alert-decagram-outline"
                  title="Emergency work approved"
                  description="Urgent work may proceed without further approval."
                  value={
                    requestForm.emergencyApproval
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "emergencyApproval",
                      value,
                    )
                  }
                />

                {requestForm.emergencyApproval ? (
                  <FormTextInput
                    label="Emergency spending limit (£) *"
                    value={
                      requestForm.spendingLimit
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "spendingLimit",
                        decimalOnly(value),
                      )
                    }
                    error={
                      formErrors.spendingLimit
                    }
                    keyboardType="decimal-pad"
                    icon="currency-gbp"
                  />
                ) : null}
              </FormSection>

              <FormSection
                icon="account-hard-hat-outline"
                title="Contractor"
                subtitle="Assign a contractor and save their contact details."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Contractor name"
                    value={
                      requestForm.contractorName
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "contractorName",
                        value,
                      )
                    }
                    icon="account-hard-hat-outline"
                  />

                  <InternationalPhoneInput
                    label="Contractor phone"
                    value={requestForm.contractorPhone}
                    onChangeText={(value) =>
                      updateForm("contractorPhone", value)
                    }
                  />

                  <FormTextInput
                    label="Contractor email"
                    value={
                      requestForm.contractorEmail
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "contractorEmail",
                        value,
                      )
                    }
                    icon="email-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </ResponsiveFields>

                <FormTextInput
                  label="Contractor notes"
                  value={
                    requestForm.contractorNotes
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "contractorNotes",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={4}
                  icon="note-text-outline"
                />
              </FormSection>

              <FormSection
                icon="calendar-check-outline"
                title="Appointment"
                subtitle="Set the repair booking date and time."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Appointment date"
                    value={
                      requestForm.appointmentDate
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "appointmentDate",
                        value,
                      )
                    }
                    placeholder="DD Month YYYY"
                    icon="calendar-outline"
                  />

                  <FormTextInput
                    label="Appointment time"
                    value={
                      requestForm.appointmentTime
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "appointmentTime",
                        value,
                      )
                    }
                    placeholder="For example, 10:30 AM"
                    icon="clock-outline"
                  />
                </ResponsiveFields>
              </FormSection>

              <FormSection
                icon="cash-multiple"
                title="Repair costs"
                subtitle="Record the expected and final repair amounts."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Estimated cost (£)"
                    value={
                      requestForm.estimatedCost
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "estimatedCost",
                        decimalOnly(value),
                      )
                    }
                    error={
                      formErrors.estimatedCost
                    }
                    keyboardType="decimal-pad"
                    icon="currency-gbp"
                  />

                  <FormTextInput
                    label="Final cost (£)"
                    value={requestForm.finalCost}
                    onChangeText={(value) =>
                      updateForm(
                        "finalCost",
                        decimalOnly(value),
                      )
                    }
                    error={formErrors.finalCost}
                    keyboardType="decimal-pad"
                    icon="cash-check"
                  />
                </ResponsiveFields>
              </FormSection>

              <FormSection
                icon="image-multiple-outline"
                title="Reported photos"
                subtitle="Add the photos supplied when the issue was reported."
              >
                <PhotoManager
                  photos={
                    requestForm.reportedPhotos
                  }
                  emptyText="No reported photos added."
                  onAdd={() => {
                    const next =
                      requestForm.reportedPhotos
                        .length + 1;

                    updateForm(
                      "reportedPhotos",
                      [
                        ...requestForm.reportedPhotos,
                        `reported-photo-${next}.jpg`,
                      ],
                    );
                  }}
                  onRemove={(index) =>
                    updateForm(
                      "reportedPhotos",
                      requestForm.reportedPhotos.filter(
                        (_, photoIndex) =>
                          photoIndex !== index,
                      ),
                    )
                  }
                />
              </FormSection>

              <FormSection
                icon="check-decagram-outline"
                title="Completion"
                subtitle="Add completion notes, evidence and tenant confirmation."
              >
                <FormTextInput
                  label="Completion notes"
                  value={
                    requestForm.completionNotes
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "completionNotes",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={4}
                  icon="clipboard-check-outline"
                />

                <FormTextInput
                  label="Tenant feedback or reopen reason"
                  value={
                    requestForm.tenantFeedback
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "tenantFeedback",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={4}
                  icon="message-reply-text-outline"
                />

                <PhotoManager
                  photos={
                    requestForm.completionPhotos
                  }
                  emptyText="No completion photos added."
                  onAdd={() => {
                    const next =
                      requestForm.completionPhotos
                        .length + 1;

                    updateForm(
                      "completionPhotos",
                      [
                        ...requestForm.completionPhotos,
                        `completion-photo-${next}.jpg`,
                      ],
                    );
                  }}
                  onRemove={(index) =>
                    updateForm(
                      "completionPhotos",
                      requestForm.completionPhotos.filter(
                        (_, photoIndex) =>
                          photoIndex !== index,
                      ),
                    )
                  }
                />
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
              onPress={saveRequest}
            >
              {editingId
                ? "Save changes"
                : "Add request"}
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
          {selectedRequest ? (
            <>
              <Dialog.Title>
                Maintenance details
              </Dialog.Title>

              <Dialog.ScrollArea
                style={styles.dialogScrollArea}
              >
                <ScrollView
                  contentContainerStyle={
                    styles.detailsContent
                  }
                >
                  <RequestDetails
                    request={selectedRequest}
                  />
                </ScrollView>
              </Dialog.ScrollArea>

              <Dialog.Actions
                style={styles.detailsActions}
              >
                <Button
                  textColor={colors.error}
                  icon="delete-outline"
                  onPress={() =>
                    requestDelete(
                      selectedRequest,
                    )
                  }
                >
                  Delete
                </Button>

                <Button
                  icon="pencil-outline"
                  onPress={() =>
                    openEditRequest(
                      selectedRequest,
                    )
                  }
                >
                  Edit
                </Button>

                {selectedRequest.status ===
                "Awaiting landlord" ? (
                  <>
                    <Button
                      icon="close-circle-outline"
                      textColor={colors.error}
                      onPress={() =>
                        updateSelectedStatus(
                          "Rejected",
                        )
                      }
                    >
                      Reject
                    </Button>

                    <Button
                      icon="check-circle-outline"
                      onPress={() =>
                        updateSelectedStatus(
                          "Approved",
                        )
                      }
                    >
                      Approve
                    </Button>
                  </>
                ) : null}

                {selectedRequest.status ===
                "Approved" ? (
                  <Button
                    icon="account-hard-hat-outline"
                    onPress={() =>
                      updateSelectedStatus(
                        "Contractor assigned",
                      )
                    }
                  >
                    Assign
                  </Button>
                ) : null}

                {selectedRequest.status ===
                "Contractor assigned" ? (
                  <Button
                    icon="calendar-check-outline"
                    onPress={() =>
                      updateSelectedStatus(
                        "Appointment booked",
                      )
                    }
                  >
                    Book
                  </Button>
                ) : null}

                {selectedRequest.status ===
                  "Appointment booked" ||
                selectedRequest.status ===
                  "In progress" ? (
                  <Button
                    icon="check-decagram-outline"
                    onPress={() =>
                      updateSelectedStatus(
                        "Awaiting tenant confirmation",
                      )
                    }
                  >
                    Finish work
                  </Button>
                ) : null}

                {selectedRequest.status ===
                "Awaiting tenant confirmation" ? (
                  <>
                    <Button
                      icon="backup-restore"
                      onPress={() =>
                        updateSelectedStatus(
                          "Reopened",
                        )
                      }
                    >
                      Reopen
                    </Button>

                    <Button
                      icon="check-circle-outline"
                      onPress={() =>
                        updateSelectedStatus(
                          "Completed",
                        )
                      }
                    >
                      Complete
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
            Delete maintenance request?
          </Dialog.Title>

          <Dialog.Content>
            <Text style={styles.deleteText}>
              {selectedRequest
                ? `Are you sure you want to delete ${selectedRequest.id}: ${selectedRequest.title}?`
                : "Are you sure you want to delete this maintenance request?"}
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
              onPress={deleteSelectedRequest}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function RequestCard({
  request,
  onView,
  onEdit,
  onDelete,
}: {
  request: MaintenanceRequest;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.requestCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onView}
      accessibilityRole="button"
      accessibilityLabel={`View maintenance request ${request.id}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.categoryIcon}>
          <MaterialCommunityIcons
            name={getCategoryIcon(
              request.category,
            )}
            size={28}
            color={colors.primary}
          />
        </View>

        <View style={styles.cardTitleArea}>
          <Text
            style={styles.cardTitle}
            numberOfLines={2}
          >
            {request.title}
          </Text>

          <Text style={styles.cardId}>
            {request.id} · {request.propertyId}
          </Text>
        </View>

        <PriorityBadge
          priority={request.priority}
        />
      </View>

      <Text
        style={styles.propertyAddress}
        numberOfLines={2}
      >
        {request.propertyAddress}
      </Text>

      <Text
        style={styles.issueDescription}
        numberOfLines={3}
      >
        {request.description}
      </Text>

      <View style={styles.factGrid}>
        <Fact
          icon="account-outline"
          label="Tenant"
          value={request.tenantName}
        />

        <Fact
          icon="floor-plan"
          label="Location"
          value={request.roomLocation}
        />

        <Fact
          icon="calendar-outline"
          label="Reported"
          value={request.dateReported}
        />

        <Fact
          icon="account-hard-hat-outline"
          label="Contractor"
          value={
            request.contractorName ||
            "Not assigned"
          }
        />
      </View>

      <Divider style={styles.cardDivider} />

      <View style={styles.statusRow}>
        <StatusBadge status={request.status} />

        <Text style={styles.costText}>
          {request.finalCost
            ? `${formatCurrency(
                Number(request.finalCost),
              )} final`
            : request.estimatedCost
              ? `${formatCurrency(
                  Number(request.estimatedCost),
                )} estimated`
              : "Cost not entered"}
        </Text>
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

function RequestDetails({
  request,
}: {
  request: MaintenanceRequest;
}) {
  return (
    <View style={styles.detailsWrapper}>
      <View style={styles.detailsHero}>
        <View style={styles.detailsHeroIcon}>
          <MaterialCommunityIcons
            name={getCategoryIcon(
              request.category,
            )}
            size={36}
            color={colors.primary}
          />
        </View>

        <View style={styles.detailsHeroText}>
          <Text style={styles.detailsTitle}>
            {request.title}
          </Text>

          <Text style={styles.detailsSubtitle}>
            {request.id} ·{" "}
            {request.propertyAddress}
          </Text>

          <View style={styles.badgeRow}>
            <StatusBadge
              status={request.status}
            />

            <PriorityBadge
              priority={request.priority}
            />
          </View>
        </View>
      </View>

      <DetailsSection
        icon="alert-circle-outline"
        title="Issue"
      >
        <DetailsGrid>
          <DetailItem
            label="Category"
            value={request.category}
          />

          <DetailItem
            label="Room or location"
            value={request.roomLocation}
          />

          <DetailItem
            label="Date reported"
            value={request.dateReported}
          />

          <DetailItem
            label="Property ID"
            value={request.propertyId || "—"}
          />
        </DetailsGrid>

        <Text style={styles.detailsParagraph}>
          {request.description}
        </Text>
      </DetailsSection>

      <DetailsSection
        icon="account-outline"
        title="Tenant"
      >
        <DetailsGrid>
          <DetailItem
            label="Name"
            value={request.tenantName}
          />

          <DetailItem
            label="Email"
            value={request.tenantEmail || "—"}
          />

          <DetailItem
            label="Phone"
            value={request.tenantPhone || "—"}
          />

          <DetailItem
            label="Access permission"
            value={
              request.accessPermission
                ? "Permitted"
                : "Tenant must be present"
            }
          />
        </DetailsGrid>

        <Text style={styles.notesHeading}>
          Availability
        </Text>

        <Text style={styles.detailsParagraph}>
          {request.tenantAvailability ||
            "Not entered"}
        </Text>
      </DetailsSection>

      <DetailsSection
        icon="account-check-outline"
        title="Landlord decision"
      >
        <DetailsGrid>
          <DetailItem
            label="Maintenance route"
            value={
              request.maintenanceRoute
            }
          />

          <DetailItem
            label="Emergency approval"
            value={
              request.emergencyApproval
                ? "Approved"
                : "Not approved"
            }
          />

          <DetailItem
            label="Spending limit"
            value={
              request.spendingLimit
                ? formatCurrency(
                    Number(
                      request.spendingLimit,
                    ),
                  )
                : "Not set"
            }
          />
        </DetailsGrid>

        <Text style={styles.notesHeading}>
          Decision or instruction
        </Text>

        <Text style={styles.detailsParagraph}>
          {request.landlordDecision ||
            "No decision entered."}
        </Text>
      </DetailsSection>

      <DetailsSection
        icon="account-hard-hat-outline"
        title="Contractor and appointment"
      >
        <DetailsGrid>
          <DetailItem
            label="Contractor"
            value={
              request.contractorName ||
              "Not assigned"
            }
          />

          <DetailItem
            label="Phone"
            value={
              request.contractorPhone || "—"
            }
          />

          <DetailItem
            label="Email"
            value={
              request.contractorEmail || "—"
            }
          />

          <DetailItem
            label="Appointment"
            value={
              request.appointmentDate
                ? `${request.appointmentDate}${
                    request.appointmentTime
                      ? ` at ${request.appointmentTime}`
                      : ""
                  }`
                : "Not booked"
            }
          />
        </DetailsGrid>

        <Text style={styles.notesHeading}>
          Contractor notes
        </Text>

        <Text style={styles.detailsParagraph}>
          {request.contractorNotes ||
            "No contractor notes."}
        </Text>
      </DetailsSection>

      <DetailsSection
        icon="cash-multiple"
        title="Costs"
      >
        <DetailsGrid>
          <DetailItem
            label="Estimated cost"
            value={
              request.estimatedCost
                ? formatCurrency(
                    Number(
                      request.estimatedCost,
                    ),
                  )
                : "Not entered"
            }
          />

          <DetailItem
            label="Final cost"
            value={
              request.finalCost
                ? formatCurrency(
                    Number(request.finalCost),
                  )
                : "Not entered"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="image-multiple-outline"
        title="Reported photos"
      >
        <PhotoList
          photos={request.reportedPhotos}
          emptyText="No reported photos."
        />
      </DetailsSection>

      <DetailsSection
        icon="check-decagram-outline"
        title="Completion"
      >
        <Text style={styles.notesHeading}>
          Completion notes
        </Text>

        <Text style={styles.detailsParagraph}>
          {request.completionNotes ||
            "Work has not been marked complete."}
        </Text>

        <Text style={styles.notesHeading}>
          Tenant confirmation or reopen reason
        </Text>

        <Text style={styles.detailsParagraph}>
          {request.tenantFeedback ||
            "No tenant feedback entered."}
        </Text>

        <PhotoList
          photos={request.completionPhotos}
          emptyText="No completion photos."
        />
      </DetailsSection>
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

          <Text
            style={styles.formSectionSubtitle}
          >
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
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      style={styles.toggleRow}
      onPress={() => onValueChange(!value)}
    >
      <View style={styles.toggleIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.toggleTextArea}>
        <Text style={styles.toggleTitle}>
          {title}
        </Text>

        <Text
          style={styles.toggleDescription}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.customSwitch,
          value && styles.customSwitchActive,
        ]}
      >
        <View
          style={[
            styles.customSwitchThumb,
            value &&
              styles.customSwitchThumbActive,
          ]}
        />
      </View>
    </Pressable>
  );
}

function PhotoManager({
  photos,
  emptyText,
  onAdd,
  onRemove,
}: {
  photos: string[];
  emptyText: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View style={styles.photoManager}>
      <View style={styles.photoUploadBox}>
        <MaterialCommunityIcons
          name="cloud-upload-outline"
          size={36}
          color={colors.primary}
        />

        <Text style={styles.photoUploadTitle}>
          Add photos
        </Text>

        <Text style={styles.photoUploadText}>
          Add sample photo names for this
          frontend-only version.
        </Text>

        <Button
          mode="outlined"
          icon="image-plus"
          onPress={onAdd}
        >
          Add photo
        </Button>
      </View>

      {photos.length > 0 ? (
        <View style={styles.photoList}>
          {photos.map((photo, index) => (
            <View
              key={`${photo}-${index}`}
              style={styles.photoItem}
            >
              <MaterialCommunityIcons
                name="image-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={styles.photoName}
                numberOfLines={1}
              >
                {photo}
              </Text>

              <Pressable
                onPress={() => onRemove(index)}
                style={styles.removePhotoButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.error}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyPhotoText}>
          {emptyText}
        </Text>
      )}
    </View>
  );
}

function PhotoList({
  photos,
  emptyText,
}: {
  photos: string[];
  emptyText: string;
}) {
  if (photos.length === 0) {
    return (
      <Text style={styles.emptyPhotoText}>
        {emptyText}
      </Text>
    );
  }

  return (
    <View style={styles.photoGrid}>
      {photos.map((photo, index) => {
        const uri = getMaintenancePhotoUrl(photo);

        return (
          <View key={`${photo}-${index}`} style={styles.photoPreviewCard}>
            <Image
              source={{ uri }}
              style={styles.photoPreviewImage}
              resizeMode="cover"
            />
            <Text style={styles.photoPreviewLabel} numberOfLines={1}>
              Photo {index + 1}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function EmptyRequests({
  onAddRequest,
  onClearFilters,
}: {
  onAddRequest: () => void;
  onClearFilters: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons
          name="tools"
          size={42}
          color={colors.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No maintenance requests found
      </Text>

      <Text style={styles.emptyText}>
        Change the search or filters, or add a
        new maintenance request.
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
          icon="plus-circle-outline"
          onPress={onAddRequest}
        >
          Add request
        </Button>
      </View>
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={colors.primary}
        />
      </View>

      <View style={styles.factTextArea}>
        <Text style={styles.factLabel}>
          {label}
        </Text>

        <Text
          style={styles.factValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: MaintenancePriority;
}) {
  return (
    <View
      style={[
        styles.badge,
        priority === "Low" &&
          styles.lowBadge,
        priority === "Medium" &&
          styles.mediumBadge,
        priority === "High" &&
          styles.highBadge,
        priority === "Emergency" &&
          styles.emergencyBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          priority === "Low" &&
            styles.lowBadgeText,
          priority === "Medium" &&
            styles.mediumBadgeText,
          priority === "High" &&
            styles.highBadgeText,
          priority === "Emergency" &&
            styles.emergencyBadgeText,
        ]}
      >
        {priority}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: MaintenanceStatus;
}) {
  const isSuccess =
    status === "Completed" ||
    status === "Approved";

  const isError =
    status === "Rejected" ||
    status === "Reopened";

  const isWarning =
    status === "Awaiting landlord" ||
    status ===
      "Awaiting tenant confirmation";

  return (
    <View
      style={[
        styles.badge,
        isSuccess &&
          styles.statusSuccessBadge,
        isError && styles.statusErrorBadge,
        isWarning &&
          styles.statusWarningBadge,
        !isSuccess &&
          !isError &&
          !isWarning &&
          styles.statusPrimaryBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isSuccess &&
            styles.statusSuccessText,
          isError && styles.statusErrorText,
          isWarning &&
            styles.statusWarningText,
          !isSuccess &&
            !isError &&
            !isWarning &&
            styles.statusPrimaryText,
        ]}
      >
        {status}
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

function createRequestId(
  requests: MaintenanceRequest[],
) {
  const highest = requests.reduce(
    (currentHighest, request) => {
      const number =
        Number(
          request.id.replace(/\D/g, ""),
        ) || 0;

      return Math.max(
        currentHighest,
        number,
      );
    },
    0,
  );

  return `M${String(highest + 1).padStart(
    3,
    "0",
  )}`;
}

function decimalOnly(value: string) {
  const cleaned = value.replace(
    /[^0-9.]/g,
    "",
  );

  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts
    .slice(1)
    .join("")}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getCategoryIcon(
  category: MaintenanceCategory,
): IconName {
  switch (category) {
    case "Plumbing":
      return "pipe-wrench";

    case "Heating":
      return "radiator";

    case "Electrical":
      return "lightning-bolt-outline";

    case "Appliance":
      return "washing-machine";

    case "Structural":
      return "home-alert-outline";

    case "Security":
      return "shield-lock-outline";

    case "Damp and mould":
      return "water-alert-outline";

    case "Pest control":
      return "bug-outline";

    default:
      return "tools";
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

  requestGrid: {
    width: "100%",
    gap: spacing.lg,
  },

  requestGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  requestGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  requestGridMobile: {
    flexDirection: "column",
  },

  requestCard: {
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

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  categoryIcon: {
    width: 52,
    height: 52,
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

  cardId: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  propertyAddress: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 17,
  },

  issueDescription: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  factGrid: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  fact: {
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

  factIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },

  factTextArea: {
    flex: 1,
    minWidth: 0,
  },

  factLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  factValue: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "700",
  },

  cardDivider: {
    marginVertical: spacing.md,
    backgroundColor: colors.border,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  costText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
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

  lowBadge: {
    backgroundColor: colors.successLight,
  },

  lowBadgeText: {
    color: colors.success,
  },

  mediumBadge: {
    backgroundColor: colors.primaryLight,
  },

  mediumBadgeText: {
    color: colors.primary,
  },

  highBadge: {
    backgroundColor: colors.warningLight,
  },

  highBadgeText: {
    color: colors.warning,
  },

  emergencyBadge: {
    backgroundColor: colors.errorLight,
  },

  emergencyBadgeText: {
    color: colors.error,
  },

  statusSuccessBadge: {
    backgroundColor: colors.successLight,
  },

  statusSuccessText: {
    color: colors.success,
  },

  statusErrorBadge: {
    backgroundColor: colors.errorLight,
  },

  statusErrorText: {
    color: colors.error,
  },

  statusWarningBadge: {
    backgroundColor: colors.warningLight,
  },

  statusWarningText: {
    color: colors.warning,
  },

  statusPrimaryBadge: {
    backgroundColor: colors.primaryLight,
  },

  statusPrimaryText: {
    color: colors.primary,
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
    textAlign: "center",
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

  customSwitch: {
    width: 46,
    height: 26,
    justifyContent: "center",
    paddingHorizontal: 3,
    borderRadius: 13,
    backgroundColor: colors.border,
  },

  customSwitchActive: {
    backgroundColor: colors.primary,
  },

  customSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },

  customSwitchThumbActive: {
    alignSelf: "flex-end",
  },

  photoManager: {
    gap: spacing.md,
  },

  photoUploadBox: {
    alignItems: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  photoUploadTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  photoUploadText: {
    marginTop: 4,
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 10,
    textAlign: "center",
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  photoPreviewCard: {
    width: 220,
    maxWidth: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  photoPreviewImage: {
    width: "100%",
    height: 150,
    backgroundColor: colors.surfaceSoft,
  },

  photoPreviewLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  photoList: {
    gap: spacing.sm,
  },

  photoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  photoName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },

  removePhotoButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.errorLight,
  },

  emptyPhotoText: {
    color: colors.textMuted,
    fontSize: 10,
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
    lineHeight: 17,
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

  notesHeading: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  detailsParagraph: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
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