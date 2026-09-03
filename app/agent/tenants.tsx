import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Button, Card, Dialog, Divider, Menu, Portal, TextInput } from "react-native-paper";

import { api } from "../../src/api/client";
import WorkflowNotifications from "../../src/components/WorkflowNotifications";
import { colors, radius, spacing } from "../../src/theme";
import AgentModuleScreen from "./AgentModuleScreen";

type PropertyRow = {
  id: string;
  addressLine1: string;
  townCity?: string | null;
  postcode: string;
};

type InquiryRow = {
  id: string;
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  status: string;
  createdAt: string;
  property?: PropertyRow | null;
};

type ActiveTenantRow = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  status: string;
  startedAt: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    tenantProfile?: any;
  } | null;
  property?: PropertyRow | null;
};

type ApplicationRow = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  status: string;
  currentAddress?: string | null;
  postcode?: string | null;
  phone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  agreementSignedAt?: string | null;
  signatureName?: string | null;
  submittedAt?: string | null;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  } | null;
  property?: PropertyRow | null;
};

type TenantSection = "tenants" | "enquiries" | "applications";

export default function TenantsScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ section?: string }>();

  const section: TenantSection = (
    ["tenants", "enquiries", "applications"] as TenantSection[]
  ).includes(params.section as TenantSection)
    ? (params.section as TenantSection)
    : "tenants";

  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [activeTenants, setActiveTenants] = useState<ActiveTenantRow[]>([]);

  const [tenantSearch, setTenantSearch] = useState("");
  const [enquirySearch, setEnquirySearch] = useState("");
  const [applicationSearch, setApplicationSearch] = useState("");

  const [selectedTenant, setSelectedTenant] = useState<ActiveTenantRow | null>(null);
  const [tenantDetailsOpen, setTenantDetailsOpen] = useState(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propertyMenuOpen, setPropertyMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const load = async () => {
    try {
      setMessage("");

      const [
        propertyResponse,
        inquiryResponse,
        applicationResponse,
        activeTenantResponse,
      ] = await Promise.all([
        api.get("/agency-landlords/properties"),
        api.get("/property-workflows/tenant-inquiries"),
        api.get("/property-workflows/tenant-applications"),
        api.get("/property-workflows/active-tenants"),
      ]);

      const propertyRows = Array.isArray(propertyResponse.data)
        ? propertyResponse.data
        : propertyResponse.data?.properties ?? [];

      setProperties(propertyRows);
      setInquiries(Array.isArray(inquiryResponse.data) ? inquiryResponse.data : []);
      setApplications(
        Array.isArray(applicationResponse.data) ? applicationResponse.data : [],
      );
      setActiveTenants(
        Array.isArray(activeTenantResponse.data) ? activeTenantResponse.data : [],
      );

      if (!selectedPropertyId && propertyRows[0]?.id) {
        setSelectedPropertyId(propertyRows[0].id);
      }
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || "Unable to load tenant workflow.",
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId),
    [properties, selectedPropertyId],
  );

  const pendingApplications = applications.filter((item) =>
    ["PENDING_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(item.status),
  ).length;

  const newInquiries = inquiries.filter((item) => item.status === "NEW").length;

  const filteredTenants = activeTenants.filter((item) => {
    const q = tenantSearch.trim().toLowerCase();
    if (!q) return true;

    return [
      item.tenant?.firstName,
      item.tenant?.lastName,
      item.tenant?.email,
      item.tenant?.phone,
      item.property?.addressLine1,
      item.property?.townCity,
      item.property?.postcode,
      item.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const filteredInquiries = inquiries.filter((item) => {
    const q = enquirySearch.trim().toLowerCase();
    if (!q) return true;

    return [
      item.firstName,
      item.lastName,
      item.email,
      item.phone,
      item.property?.addressLine1,
      item.property?.townCity,
      item.property?.postcode,
      item.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const filteredApplications = applications.filter((item) => {
    const q = applicationSearch.trim().toLowerCase();
    if (!q) return true;

    return [
      item.tenant?.firstName,
      item.tenant?.lastName,
      item.tenant?.email,
      item.property?.addressLine1,
      item.property?.townCity,
      item.property?.postcode,
      item.id,
      item.propertyId,
      item.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const prefillFromInquiry = (inquiry: InquiryRow) => {
    setSelectedPropertyId(inquiry.propertyId);
    setEmail(inquiry.email);
    setFirstName(inquiry.firstName);
    setLastName(inquiry.lastName);
    setMessage(
      "Tenant enquiry selected. Confirm the details and send the formal invitation when ready.",
    );
  };

  const sendInvitation = async () => {
    if (!selectedPropertyId || !email.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/property-workflows/tenant-invitations", {
        propertyId: selectedPropertyId,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      setMessage(response.data?.message || "Tenant invitation sent.");
      setEmail("");
      setFirstName("");
      setLastName("");
      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || "Unable to send tenant invitation.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openApplication = async (id: string) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get(
        `/property-workflows/tenant-applications/${id}`,
      );
      setSelectedApplication(response.data);
      setReviewMessage("");
      setDetailsOpen(true);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to load the tenant application.",
      );
    } finally {
      setLoading(false);
    }
  };

  const review = async (
    action: "APPROVE" | "REJECT" | "REQUEST_MORE_INFORMATION",
  ) => {
    if (!selectedApplication?.id) return;

    if (action === "REQUEST_MORE_INFORMATION" && !reviewMessage.trim()) {
      setMessage("Enter the information you need from the tenant.");
      return;
    }

    setLoading(true);

    try {
      await api.patch(
        `/property-workflows/tenant-applications/${selectedApplication.id}/review`,
        {
          action,
          message: reviewMessage.trim() || undefined,
        },
      );

      setDetailsOpen(false);
      setSelectedApplication(null);
      setReviewMessage("");

      setMessage(
        action === "APPROVE"
          ? "Tenant approved. Tenant dashboard access is now enabled for this property."
          : action === "REJECT"
            ? "Tenant application rejected."
            : "More information has been requested from the tenant.",
      );

      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || "Unable to review this application.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AgentModuleScreen
        pageTitle="Tenants"
        pageSubtitle="Manage current tenants, property enquiries, formal tenant invitations and tenant applications."
        activePage="Tenants"
        primaryAction="Invite tenant"
        primaryActionIcon="account-plus-outline"
        statistics={[
          {
            label: "New enquiries",
            value: String(newInquiries),
            icon: "message-question-outline",
            helper: "Interested renters waiting for contact",
          },
          {
            label: "Awaiting review",
            value: String(pendingApplications),
            icon: "account-clock-outline",
            helper: "Completed applications needing a decision",
          },
          {
            label: "Active tenants",
            value: String(activeTenants.length),
            icon: "account-check-outline",
            helper: "Current approved tenancies",
          },
          {
            label: "Total applications",
            value: String(applications.length),
            icon: "file-account-outline",
            helper: "All tenant applications",
          },
        ]}
        records={[]}
        hideRecords
        customContent={
          <View style={styles.workflow}>
            <WorkflowNotifications
              compact
              title="Tenant workflow notifications"
              limit={6}
            />

            {section === "tenants" ? (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionIcon}>
                      <MaterialCommunityIcons
                        name="account-group-outline"
                        size={23}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.sectionHeadingText}>
                      <Text style={styles.sectionTitle}>Tenants</Text>
                      <Text style={styles.sectionSubtitle}>
                        Current tenants and the properties they occupy. Open a
                        tenant to review their complete tenancy details.
                      </Text>
                    </View>
                  </View>

                  <TextInput
                    mode="outlined"
                    label="Search tenants or properties"
                    value={tenantSearch}
                    onChangeText={setTenantSearch}
                    left={<TextInput.Icon icon="magnify" />}
                    style={styles.input}
                  />

                  {filteredTenants.length === 0 ? (
                    <EmptyText text="No active tenants found." />
                  ) : (
                    filteredTenants.map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemTop}>
                          <View style={styles.avatar}>
                            <MaterialCommunityIcons
                              name="account-check-outline"
                              size={20}
                              color={colors.primary}
                            />
                          </View>

                          <View style={styles.itemBody}>
                            <Text style={styles.itemTitle}>
                              {item.tenant?.firstName} {item.tenant?.lastName}
                            </Text>

                            <Text style={styles.itemMeta}>
                              {[
                                item.property?.addressLine1,
                                item.property?.townCity,
                                item.property?.postcode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </Text>

                            <Text style={styles.itemMeta}>
                              {item.tenant?.email}
                              {item.tenant?.phone
                                ? ` · ${item.tenant.phone}`
                                : ""}
                            </Text>
                          </View>

                          <StatusPill label={item.status} />
                        </View>

                        <Button
                          mode="outlined"
                          icon="eye-outline"
                          onPress={() => {
                            setSelectedTenant(item);
                            setTenantDetailsOpen(true);
                          }}
                        >
                          View tenant details
                        </Button>
                      </View>
                    ))
                  )}
                </Card.Content>
              </Card>
            ) : null}

            {section === "enquiries" ? (
              <>
                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionIcon}>
                        <MaterialCommunityIcons
                          name="email-arrow-right-outline"
                          size={23}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.sectionHeadingText}>
                        <Text style={styles.sectionTitle}>
                          Send formal tenant invitation
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                          Use this only after the tenant has selected the
                          property and you have confirmed that they should
                          proceed.
                        </Text>
                      </View>
                    </View>

                    <Menu
                      visible={propertyMenuOpen}
                      onDismiss={() => setPropertyMenuOpen(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          icon="home-search-outline"
                          onPress={() => setPropertyMenuOpen(true)}
                        >
                          {selectedProperty
                            ? `${selectedProperty.addressLine1}, ${selectedProperty.postcode}`
                            : "Select property"}
                        </Button>
                      }
                    >
                      {properties.map((property) => (
                        <Menu.Item
                          key={property.id}
                          title={`${property.addressLine1}, ${property.postcode}`}
                          onPress={() => {
                            setSelectedPropertyId(property.id);
                            setPropertyMenuOpen(false);
                          }}
                        />
                      ))}
                    </Menu>

                    <View style={styles.formGrid}>
                      <TextInput
                        label="First name"
                        value={firstName}
                        onChangeText={setFirstName}
                        mode="outlined"
                        style={styles.input}
                      />
                      <TextInput
                        label="Last name"
                        value={lastName}
                        onChangeText={setLastName}
                        mode="outlined"
                        style={styles.input}
                      />
                    </View>

                    <TextInput
                      label="Tenant email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      mode="outlined"
                      style={styles.input}
                    />

                    <Button
                      mode="contained"
                      icon="send-outline"
                      loading={loading}
                      disabled={
                        loading ||
                        !selectedPropertyId ||
                        !email.trim().includes("@")
                      }
                      onPress={() => void sendInvitation()}
                    >
                      Send secure invitation
                    </Button>
                  </Card.Content>
                </Card>

                <Card style={styles.card}>
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionIcon}>
                        <MaterialCommunityIcons
                          name="message-question-outline"
                          size={23}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.sectionHeadingText}>
                        <Text style={styles.sectionTitle}>
                          Property enquiries
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                          People who selected a property on the public landing
                          page and contacted you.
                        </Text>
                      </View>
                    </View>

                    <TextInput
                      mode="outlined"
                      label="Search enquiries"
                      value={enquirySearch}
                      onChangeText={setEnquirySearch}
                      left={<TextInput.Icon icon="magnify" />}
                      style={styles.input}
                    />

                    <Divider style={styles.divider} />

                    {filteredInquiries.length === 0 ? (
                      <EmptyText text="No tenant property enquiries found." />
                    ) : (
                      filteredInquiries.map((inquiry) => (
                        <View key={inquiry.id} style={styles.itemCard}>
                          <View style={styles.itemTop}>
                            <View style={styles.avatar}>
                              <MaterialCommunityIcons
                                name="account-outline"
                                size={20}
                                color={colors.primary}
                              />
                            </View>

                            <View style={styles.itemBody}>
                              <Text style={styles.itemTitle}>
                                {inquiry.firstName} {inquiry.lastName}
                              </Text>

                              <Text style={styles.itemMeta}>
                                {inquiry.email}
                                {inquiry.phone ? ` · ${inquiry.phone}` : ""}
                              </Text>

                              <Text style={styles.itemMeta}>
                                {[
                                  inquiry.property?.addressLine1 ||
                                    inquiry.propertyId,
                                  inquiry.property?.townCity,
                                  inquiry.property?.postcode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </Text>
                            </View>

                            <StatusPill label={inquiry.status} />
                          </View>

                          {inquiry.message ? (
                            <Text style={styles.messageText}>
                              {inquiry.message}
                            </Text>
                          ) : null}

                          <Button
                            mode="text"
                            icon="account-arrow-right-outline"
                            onPress={() => prefillFromInquiry(inquiry)}
                          >
                            Confirm & prepare invitation
                          </Button>
                        </View>
                      ))
                    )}
                  </Card.Content>
                </Card>
              </>
            ) : null}

            {section === "applications" ? (
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionIcon}>
                      <MaterialCommunityIcons
                        name="file-account-outline"
                        size={23}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.sectionHeadingText}>
                      <Text style={styles.sectionTitle}>
                        Tenant applications
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        Review all submitted information and the signed
                        agreement before approving dashboard access.
                      </Text>
                    </View>
                  </View>

                  <TextInput
                    mode="outlined"
                    label="Search applications, tenants or properties"
                    value={applicationSearch}
                    onChangeText={setApplicationSearch}
                    left={<TextInput.Icon icon="magnify" />}
                    style={styles.input}
                  />

                  <Divider style={styles.divider} />

                  {filteredApplications.length === 0 ? (
                    <EmptyText text="No tenant applications found." />
                  ) : (
                    filteredApplications.map((application) => (
                      <View key={application.id} style={styles.itemCard}>
                        <View style={styles.itemTop}>
                          <View style={styles.avatar}>
                            <MaterialCommunityIcons
                              name="file-account-outline"
                              size={20}
                              color={colors.primary}
                            />
                          </View>

                          <View style={styles.itemBody}>
                            <Text style={styles.itemTitle}>
                              {application.tenant
                                ? `${application.tenant.firstName} ${application.tenant.lastName}`
                                : "Tenant application"}
                            </Text>

                            <Text style={styles.itemMeta}>
                              {application.property
                                ? [
                                    application.property.addressLine1,
                                    application.property.townCity,
                                    application.property.postcode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")
                                : "Property details unavailable"}
                            </Text>

                            <Text style={styles.itemMeta}>
                              Application {application.id.slice(0, 8)} ·
                              Property {application.propertyId.slice(0, 8)}
                            </Text>

                            <Text style={styles.itemMeta}>
                              Agreement:{" "}
                              {application.agreementSignedAt
                                ? "Signed"
                                : "Not signed"}
                            </Text>
                          </View>

                          <StatusPill label={application.status} />
                        </View>

                        <Button
                          mode="outlined"
                          icon="eye-outline"
                          onPress={() => void openApplication(application.id)}
                        >
                          View full application
                        </Button>
                      </View>
                    ))
                  )}
                </Card.Content>
              </Card>
            ) : null}

            {message ? (
              <Text style={styles.feedback}>{message}</Text>
            ) : null}
          </View>
        }
      />

      <Portal>
        <Dialog
          visible={tenantDetailsOpen}
          onDismiss={() => setTenantDetailsOpen(false)}
          style={[
            styles.dialog,
            {
              width: windowWidth < 700 ? "96%" : "88%",
              maxWidth: 850,
            },
          ]}
        >
          <Dialog.Title>Tenant details</Dialog.Title>

          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView contentContainerStyle={styles.dialogBody}>
              {selectedTenant ? (
                <>
                  <DetailSection title="Tenant">
                    <DetailRow
                      label="Name"
                      value={`${selectedTenant.tenant?.firstName || ""} ${
                        selectedTenant.tenant?.lastName || ""
                      }`.trim()}
                    />
                    <DetailRow
                      label="Email"
                      value={selectedTenant.tenant?.email}
                    />
                    <DetailRow
                      label="Phone"
                      value={selectedTenant.tenant?.phone}
                    />
                    <DetailRow
                      label="Date of birth"
                      value={
                        selectedTenant.tenant?.tenantProfile?.dateOfBirth
                          ? new Date(
                              selectedTenant.tenant.tenantProfile.dateOfBirth,
                            ).toLocaleDateString("en-GB")
                          : "—"
                      }
                    />
                    <DetailRow
                      label="Current address"
                      value={selectedTenant.tenant?.tenantProfile?.currentAddress}
                    />
                    <DetailRow
                      label="Postcode"
                      value={selectedTenant.tenant?.tenantProfile?.postcode}
                    />
                  </DetailSection>

                  <DetailSection title="Tenancy">
                    <DetailRow
                      label="Property"
                      value={[
                        selectedTenant.property?.addressLine1,
                        selectedTenant.property?.townCity,
                        selectedTenant.property?.postcode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    />
                    <DetailRow
                      label="Status"
                      value={selectedTenant.status}
                    />
                    <DetailRow
                      label="Tenancy started"
                      value={
                        selectedTenant.startedAt
                          ? new Date(selectedTenant.startedAt).toLocaleString(
                              "en-GB",
                            )
                          : "—"
                      }
                    />
                    <DetailRow
                      label="Tenant ID"
                      value={selectedTenant.tenantUserId}
                    />
                  </DetailSection>
                </>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={() => setTenantDetailsOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={detailsOpen}
          onDismiss={() => setDetailsOpen(false)}
          style={[
            styles.dialog,
            {
              width: windowWidth < 700 ? "96%" : "92%",
              maxWidth: windowWidth < 900 ? 760 : 980,
              maxHeight: Math.max(440, windowHeight * 0.9),
            },
          ]}
        >
          <View style={styles.dialogHeader}>
            <View style={styles.dialogHeaderText}>
              <Text style={styles.dialogTitle}>
                Tenant application review
              </Text>
              <Text style={styles.dialogSubtitle}>
                Review the tenant details, property information and signed
                tenancy agreement before making a decision.
              </Text>
            </View>

            {selectedApplication?.status ? (
              <StatusPill label={selectedApplication.status} />
            ) : null}
          </View>

          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView
              style={styles.dialogScroll}
              contentContainerStyle={styles.dialogBody}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {selectedApplication ? (
                <>
                  <DetailSection title="Tenant">
                    <DetailRow
                      label="Name"
                      value={`${selectedApplication.tenant?.firstName || ""} ${
                        selectedApplication.tenant?.lastName || ""
                      }`.trim()}
                    />
                    <DetailRow
                      label="Email"
                      value={selectedApplication.tenant?.email}
                    />
                    <DetailRow
                      label="Phone"
                      value={
                        selectedApplication.phone ||
                        selectedApplication.tenant?.phone
                      }
                    />
                    <DetailRow
                      label="Date of birth"
                      value={
                        selectedApplication.dateOfBirth
                          ? new Date(
                              selectedApplication.dateOfBirth,
                            ).toLocaleDateString("en-GB")
                          : "—"
                      }
                    />
                    <DetailRow
                      label="Current address"
                      value={selectedApplication.currentAddress}
                    />
                    <DetailRow
                      label="Postcode"
                      value={selectedApplication.postcode}
                    />
                    <DetailRow
                      label="Identification"
                      value={selectedApplication.identificationType}
                    />
                    <DetailRow
                      label="Identification document"
                      value={selectedApplication.identificationFileUrl}
                    />
                    <DetailRow
                      label="Emergency contact"
                      value={`${selectedApplication.emergencyContactName || "—"}${
                        selectedApplication.emergencyContactPhone
                          ? ` · ${selectedApplication.emergencyContactPhone}`
                          : ""
                      }`}
                    />
                  </DetailSection>

                  <DetailSection title="Property">
                    <DetailRow
                      label="Address"
                      value={[
                        selectedApplication.property?.addressLine1,
                        selectedApplication.property?.townCity,
                        selectedApplication.property?.postcode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    />
                    <DetailRow
                      label="Application status"
                      value={selectedApplication.status}
                    />
                    <DetailRow
                      label="Submitted"
                      value={
                        selectedApplication.submittedAt
                          ? new Date(
                              selectedApplication.submittedAt,
                            ).toLocaleString("en-GB")
                          : "—"
                      }
                    />
                  </DetailSection>

                  <DetailSection title="Agreement">
                    <DetailRow
                      label="Agreement"
                      value={
                        selectedApplication.agreementTitle ||
                        "Tenancy agreement"
                      }
                    />
                    <DetailRow
                      label="Version"
                      value={selectedApplication.agreementVersion}
                    />
                    <DetailRow
                      label="Signed by"
                      value={selectedApplication.signatureName}
                    />
                    <DetailRow
                      label="Signed at"
                      value={
                        selectedApplication.agreementSignedAt
                          ? new Date(
                              selectedApplication.agreementSignedAt,
                            ).toLocaleString("en-GB")
                          : "Not signed"
                      }
                    />

                    {selectedApplication.agreementTerms?.propertyAddress ? (
                      <DetailRow
                        label="Premises"
                        value={
                          selectedApplication.agreementTerms.propertyAddress
                        }
                      />
                    ) : null}

                    {selectedApplication.agreementTerms?.monthlyRent ? (
                      <DetailRow
                        label="Monthly rent"
                        value={`£${selectedApplication.agreementTerms.monthlyRent}`}
                      />
                    ) : null}

                    {selectedApplication.agreementTerms?.depositAmount ? (
                      <DetailRow
                        label="Deposit"
                        value={`£${selectedApplication.agreementTerms.depositAmount}`}
                      />
                    ) : null}

                    <Text style={styles.termsTitle}>
                      Agreement terms accepted by the tenant
                    </Text>

                    {Array.isArray(
                      selectedApplication.agreementTerms?.terms,
                    ) ? (
                      selectedApplication.agreementTerms.terms.map(
                        (term: string, index: number) => (
                          <View
                            key={`${index}-${term.slice(0, 10)}`}
                            style={styles.termReviewRow}
                          >
                            <Text style={styles.termReviewNumber}>
                              {index + 1}
                            </Text>
                            <Text style={styles.termsText}>{term}</Text>
                          </View>
                        ),
                      )
                    ) : (
                      <Text style={styles.termsText}>
                        No detailed agreement terms snapshot available.
                      </Text>
                    )}
                  </DetailSection>

                  {selectedApplication.moreInformationRequest ||
                  selectedApplication.moreInformationResponse ? (
                    <DetailSection title="More information history">
                      {selectedApplication.moreInformationRequest ? (
                        <DetailRow
                          label="Estate Agent request"
                          value={selectedApplication.moreInformationRequest}
                        />
                      ) : null}

                      {selectedApplication.moreInformationResponse ? (
                        <DetailRow
                          label="Tenant response"
                          value={selectedApplication.moreInformationResponse}
                        />
                      ) : null}

                      {selectedApplication.resubmittedAt ? (
                        <DetailRow
                          label="Resubmitted"
                          value={new Date(
                            selectedApplication.resubmittedAt,
                          ).toLocaleString("en-GB")}
                        />
                      ) : null}
                    </DetailSection>
                  ) : null}

                  {selectedApplication.additionalNotes ? (
                    <DetailSection title="Tenant notes">
                      <Text style={styles.termsText}>
                        {selectedApplication.additionalNotes}
                      </Text>
                    </DetailSection>
                  ) : null}

                  <TextInput
                    label="Review note / information required"
                    value={reviewMessage}
                    onChangeText={setReviewMessage}
                    multiline
                    mode="outlined"
                  />
                </>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>

          <View style={styles.dialogFooter}>
            <Button onPress={() => setDetailsOpen(false)}>Close</Button>

            <View style={styles.dialogDecisionActions}>
              <Button
                mode="outlined"
                textColor={colors.error}
                disabled={loading}
                onPress={() => void review("REJECT")}
              >
                Reject
              </Button>

              <Button
                mode="outlined"
                disabled={loading}
                onPress={() => void review("REQUEST_MORE_INFORMATION")}
              >
                Request more info
              </Button>

              <Button
                mode="contained"
                disabled={
                  loading || selectedApplication?.status === "APPROVED"
                }
                onPress={() => void review("APPROVE")}
              >
                Approve tenant
              </Button>
            </View>
          </View>
        </Dialog>
      </Portal>
    </>
  );
}

function EmptyText({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function StatusPill({ label }: { label: string }) {
  const clean = label.replaceAll("_", " ");

  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusText}>{clean}</Text>
    </View>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  workflow: {
    gap: spacing.lg,
  },

  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  cardContent: {
    gap: spacing.md,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeadingText: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 3,
  },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  input: {
    flex: 1,
    minWidth: 220,
    backgroundColor: colors.white,
  },

  divider: {
    marginVertical: 2,
  },

  itemCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 8,
  },

  itemTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  itemBody: {
    flex: 1,
  },

  itemTitle: {
    color: colors.textPrimary,
    fontWeight: "900",
    fontSize: 15,
  },

  itemMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  messageText: {
    color: colors.textSecondary,
    lineHeight: 19,
  },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },

  statusText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  empty: {
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },

  feedback: {
    color: colors.primary,
    fontWeight: "800",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },

  dialog: {
    alignSelf: "center",
    marginVertical: 0,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.white,
  },

  dialogHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  dialogHeaderText: {
    flex: 1,
  },

  dialogTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: "900",
  },

  dialogSubtitle: {
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 4,
    maxWidth: 680,
  },

  dialogScrollArea: {
    paddingHorizontal: 0,
    flexShrink: 1,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },

  dialogScroll: {
    flexShrink: 1,
  },

  dialogBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },

  dialogFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },

  dialogDecisionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },

  detailSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 8,
  },

  detailSectionTitle: {
    color: colors.textPrimary,
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
  },

  detailRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  detailLabel: {
    width: 145,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  detailValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },

  termsTitle: {
    color: colors.textPrimary,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 2,
  },

  termsText: {
    color: colors.textPrimary,
    lineHeight: 20,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.sm,
    flex: 1,
  },

  termReviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 7,
  },

  termReviewNumber: {
    width: 24,
    minHeight: 24,
    borderRadius: 12,
    textAlign: "center",
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontWeight: "900",
    fontSize: 11,
    paddingTop: 4,
  },
});
