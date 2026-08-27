import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Chip,
  Menu,
  Snackbar,
  TextInput,
} from "react-native-paper";

import { api } from "../../src/api/client";
import PropertyMaintenanceProviders from "../../src/components/PropertyMaintenanceProviders";
import ScreenContainer from "../../src/components/ScreenContainer";
import WorkflowNotifications from "../../src/components/WorkflowNotifications";
import { colors, radius, spacing } from "../../src/theme";

type MaintenanceStatus =
  | "Open"
  | "Scheduled"
  | "In progress"
  | "Awaiting tenant confirmation"
  | "Completed"
  | "Reopened";

type MaintenancePriority =
  | "Low"
  | "Medium"
  | "High"
  | "Emergency";

type MaintenanceRequest = {
  id: string;
  propertyId?: string;
  title: string;
  category: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  scheduledStart?: string | null;
  roomLocation?: string | null;
  photos?: Array<{ id: string; phase: string; url: string }>;
};

type TenantProperty = {
  id: string;
  addressLine1: string;
  townCity?: string | null;
  postcode: string;
};

type AvailabilitySlot = { id: string; startAt: string; endAt: string };

const initialRequests: MaintenanceRequest[] = [];

const categories = [
  "Plumbing",
  "Electrical",
  "Heating",
  "Appliance",
  "Security",
  "Structural",
  "Other",
];

const priorities: MaintenancePriority[] = [
  "Low",
  "Medium",
  "High",
  "Emergency",
];

export default function MaintenanceScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 950;

  const params = useLocalSearchParams<{
    propertyId?: string | string[];
  }>();

  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const [requests, setRequests] =
    useState<MaintenanceRequest[]>(initialRequests);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState("Plumbing");
  const [priority, setPriority] =
    useState<MaintenancePriority>("Medium");

  const [categoryMenu, setCategoryMenu] =
    useState(false);
  const [priorityMenu, setPriorityMenu] =
    useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId ?? "");
  const [propertyMenu, setPropertyMenu] = useState(false);
  const [roomLocation, setRoomLocation] = useState("");
  const [accessPermission, setAccessPermission] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { id: "slot-1", startAt: "", endAt: "" },
  ]);
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);

  const activeRequests = useMemo(
    () => requests.filter((request) => request.status !== "Completed").length,
    [requests],
  );

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId),
    [properties, selectedPropertyId],
  );

  const mapRequest = (row: any): MaintenanceRequest => ({
    id: row.id,
    propertyId: row.propertyId,
    title: row.title,
    category: row.category || "Other",
    description: row.description,
    priority:
      row.priority === "EMERGENCY"
        ? "Emergency"
        : row.priority === "HIGH"
          ? "High"
          : row.priority === "LOW"
            ? "Low"
            : "Medium",
    status:
      row.status === "COMPLETED"
        ? "Completed"
        : row.status === "IN_PROGRESS"
          ? "In progress"
          : row.status === "SCHEDULED"
            ? "Scheduled"
            : row.status === "AWAITING_TENANT_CONFIRMATION"
              ? "Awaiting tenant confirmation"
              : row.status === "REOPENED"
                ? "Reopened"
                : "Open",
    createdAt: new Date(row.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    scheduledStart: row.scheduledStart,
    roomLocation: row.roomLocation,
    photos: row.photos,
  });

  const loadWorkflow = async () => {
    try {
      const [propertiesResponse, requestsResponse] = await Promise.all([
        api.get("/property-workflows/tenant/my-properties"),
        api.get("/property-workflows/maintenance-requests"),
      ]);
      const propertyRows = (Array.isArray(propertiesResponse.data)
        ? propertiesResponse.data
        : []
      )
        .map((row: any) => row.property)
        .filter(Boolean) as TenantProperty[];
      setProperties(propertyRows);
      if (!selectedPropertyId && propertyRows[0]) {
        setSelectedPropertyId(propertyRows[0].id);
      }
      const requestRows = Array.isArray(requestsResponse.data)
        ? requestsResponse.data
        : [];
      setRequests(
        requestRows
          .filter((row: any) => row.tenantUserId)
          .map(mapRequest),
      );
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to load tenant maintenance.");
    }
  };

  useEffect(() => {
    void loadWorkflow();
  }, []);

  const updateSlot = (id: string, field: "startAt" | "endAt", value: string) => {
    setAvailabilitySlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)),
    );
  };

  const addSlot = () => {
    setAvailabilitySlots((current) => [
      ...current,
      { id: `slot-${Date.now()}`, startAt: "", endAt: "" },
    ]);
  };

  const removeSlot = (id: string) => {
    setAvailabilitySlots((current) =>
      current.length === 1 ? current : current.filter((slot) => slot.id !== id),
    );
  };

  const pickIssuePhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) setPendingPhotos(result.assets);
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId) {
      setMessage("Select the property for this maintenance request.");
      return;
    }
    if (!title.trim()) {
      setMessage("Enter a short issue title.");
      return;
    }
    if (!description.trim()) {
      setMessage("Describe the maintenance issue.");
      return;
    }
    const validSlots = availabilitySlots.filter(
      (slot) => slot.startAt.trim() && slot.endAt.trim(),
    );
    if (!validSlots.length) {
      setMessage("Add at least one available date and time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/property-workflows/maintenance-requests", {
        propertyId: selectedPropertyId,
        title: title.trim(),
        description: description.trim(),
        category,
        roomLocation: roomLocation.trim() || undefined,
        priority: priority.toUpperCase(),
        accessPermission,
        slots: validSlots.map((slot) => ({
          startAt: new Date(slot.startAt).toISOString(),
          endAt: new Date(slot.endAt).toISOString(),
        })),
      });

      if (pendingPhotos.length) {
        const data = new FormData();
        pendingPhotos.forEach((asset: any, index) => {
          data.append(
            "photos",
            {
              uri: asset.uri,
              name: asset.fileName || `issue-${index + 1}.jpg`,
              type: asset.mimeType || "image/jpeg",
            } as any,
          );
        });
        await api.post(
          `/property-workflows/maintenance-requests/${response.data.request.id}/reported-photos`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      }

      setTitle("");
      setDescription("");
      setRoomLocation("");
      setCategory("Plumbing");
      setPriority("Medium");
      setAccessPermission(false);
      setAvailabilitySlots([{ id: `slot-${Date.now()}`, startAt: "", endAt: "" }]);
      setPendingPhotos([]);
      setMessage(
        "Maintenance request submitted. All approved maintenance providers for this property have been notified.",
      );
      await loadWorkflow();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to submit maintenance request.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCompletion = async (id: string, completed: boolean) => {
    try {
      await api.patch(`/property-workflows/maintenance-requests/${id}/tenant-confirm`, {
        completed,
        note: completed
          ? "Work confirmed as completed by the tenant."
          : "The issue is not fully resolved and needs more work.",
      });
      setMessage(completed ? "Maintenance work confirmed as completed." : "The maintenance issue has been reopened.");
      await loadWorkflow();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to update maintenance request.");
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
              router.replace(
                "/tenant/my-property" as never,
              )
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="tools"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                Maintenance
              </Text>

              <Text style={styles.brandSubtitle}>
                Property {selectedProperty?.postcode ?? propertyId ?? "Not selected"}
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

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="home-outline"
              size={38}
              color={colors.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>
              PROPERTY MAINTENANCE
            </Text>

            <Text style={styles.heroTitle}>
              Report and track maintenance
            </Text>

            <Text style={styles.heroDescription}>
              Report non-emergency maintenance issues
              and follow their progress.
            </Text>
          </View>

          <Chip icon="tools">
            {activeRequests} active
          </Chip>
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop && styles.layoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                New maintenance request
              </Text>

              <Text style={styles.cardDescription}>
                Give clear information so the issue can
                be handled correctly.
              </Text>

              <View style={styles.form}>
                <Menu
                  visible={propertyMenu}
                  onDismiss={() => setPropertyMenu(false)}
                  anchor={
                    <Button mode="outlined" icon="home-search-outline" onPress={() => setPropertyMenu(true)}>
                      {selectedProperty
                        ? `${selectedProperty.addressLine1}, ${selectedProperty.postcode}`
                        : "Select approved tenancy property"}
                    </Button>
                  }
                >
                  {properties.map((item) => (
                    <Menu.Item
                      key={item.id}
                      title={`${item.addressLine1}, ${item.townCity ?? ""} ${item.postcode}`}
                      onPress={() => {
                        setSelectedPropertyId(item.id);
                        setPropertyMenu(false);
                      }}
                    />
                  ))}
                </Menu>

                <TextInput
                  mode="outlined"
                  label="Issue title"
                  placeholder="Example: Bathroom tap leaking"
                  value={title}
                  onChangeText={setTitle}
                  left={
                    <TextInput.Icon icon="format-title" />
                  }
                />

                <View style={styles.menuRow}>
                  <View style={styles.menuField}>
                    <Menu
                      visible={categoryMenu}
                      onDismiss={() =>
                        setCategoryMenu(false)
                      }
                      anchor={
                        <Button
                          mode="outlined"
                          icon="shape-outline"
                          contentStyle={
                            styles.menuButtonContent
                          }
                          onPress={() =>
                            setCategoryMenu(true)
                          }
                        >
                          Category: {category}
                        </Button>
                      }
                    >
                      {categories.map((item) => (
                        <Menu.Item
                          key={item}
                          title={item}
                          onPress={() => {
                            setCategory(item);
                            setCategoryMenu(false);
                          }}
                        />
                      ))}
                    </Menu>
                  </View>

                  <View style={styles.menuField}>
                    <Menu
                      visible={priorityMenu}
                      onDismiss={() =>
                        setPriorityMenu(false)
                      }
                      anchor={
                        <Button
                          mode="outlined"
                          icon="alert-outline"
                          contentStyle={
                            styles.menuButtonContent
                          }
                          onPress={() =>
                            setPriorityMenu(true)
                          }
                        >
                          Priority: {priority}
                        </Button>
                      }
                    >
                      {priorities.map((item) => (
                        <Menu.Item
                          key={item}
                          title={item}
                          onPress={() => {
                            setPriority(item);
                            setPriorityMenu(false);
                          }}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

                <TextInput
                  mode="outlined"
                  label="Issue description"
                  placeholder="Explain where the problem is and what happened"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  style={styles.descriptionInput}
                  left={
                    <TextInput.Icon icon="text-box-outline" />
                  }
                />

                <TextInput
                  mode="outlined"
                  label="Room / location (optional)"
                  placeholder="Example: Kitchen, bathroom, bedroom"
                  value={roomLocation}
                  onChangeText={setRoomLocation}
                  left={<TextInput.Icon icon="floor-plan" />}
                />

                <View style={styles.availabilityCard}>
                  <View style={styles.availabilityHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.availabilityTitle}>Your available visit times</Text>
                      <Text style={styles.availabilityText}>Add one or more time slots. A maintenance provider can select one that works for them.</Text>
                    </View>
                    <Button mode="text" icon="plus" onPress={addSlot}>Add time</Button>
                  </View>
                  {availabilitySlots.map((slot, index) => (
                    <View key={slot.id} style={styles.slotCard}>
                      <Text style={styles.slotLabel}>Option {index + 1}</Text>
                      <TextInput
                        mode="outlined"
                        label="Available from"
                        placeholder="2026-09-01T09:00:00+01:00"
                        value={slot.startAt}
                        onChangeText={(value) => updateSlot(slot.id, "startAt", value)}
                      />
                      <TextInput
                        mode="outlined"
                        label="Available until"
                        placeholder="2026-09-01T12:00:00+01:00"
                        value={slot.endAt}
                        onChangeText={(value) => updateSlot(slot.id, "endAt", value)}
                      />
                      {availabilitySlots.length > 1 ? (
                        <Button mode="text" textColor={colors.error} icon="delete-outline" onPress={() => removeSlot(slot.id)}>Remove</Button>
                      ) : null}
                    </View>
                  ))}
                </View>

                <Pressable
                  style={[styles.accessRow, accessPermission && styles.accessRowSelected]}
                  onPress={() => setAccessPermission((value) => !value)}
                >
                  <MaterialCommunityIcons
                    name={accessPermission ? "checkbox-marked-circle-outline" : "checkbox-blank-circle-outline"}
                    size={23}
                    color={accessPermission ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accessTitle}>Permission to access the property</Text>
                    <Text style={styles.accessText}>Select this if an approved maintenance provider may enter as agreed even when you are not present.</Text>
                  </View>
                </Pressable>

                <Button mode="outlined" icon="camera-outline" onPress={pickIssuePhotos}>
                  Add problem photos ({pendingPhotos.length})
                </Button>

                <View style={styles.submitRow}>
                  <Button
                    mode="contained"
                    icon="send-outline"
                    loading={submitting}
                    disabled={submitting}
                    onPress={handleSubmit}
                  >
                    Submit request
                  </Button>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Maintenance requests
                </Text>

                <Text style={styles.sectionDescription}>
                  View current and previous reported
                  issues.
                </Text>
              </View>

              <Chip>{requests.length} total</Chip>
            </View>

            <View style={styles.requestList}>
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onConfirm={(completed) => void confirmCompletion(request.id, completed)}
                />
              ))}
            </View>
          </View>

          <View style={styles.sideColumn}>
            <WorkflowNotifications compact title="Maintenance updates" limit={5} />
            {selectedPropertyId ? (
              <PropertyMaintenanceProviders
            actingRole="TENANT"
                propertyEndpoint="/property-workflows/tenant/my-properties"
                title="My property maintenance people"
              />
            ) : null}
            <View style={styles.emergencyCard}>
              <MaterialCommunityIcons
                name="alert-octagon-outline"
                size={31}
                color={colors.error}
              />

              <Text style={styles.emergencyTitle}>
                Emergency issue?
              </Text>

              <Text style={styles.emergencyText}>
                For immediate danger, fire, gas leaks or
                serious flooding, contact the emergency
                services or your emergency property
                number.
              </Text>

              <Button
                mode="outlined"
                icon="phone-outline"
                textColor={colors.error}
                onPress={() =>
                  setMessage(
                    "Emergency contact integration can be added later.",
                  )
                }
              >
                Emergency contact
              </Button>
            </View>

            <View style={styles.helpCard}>
              <MaterialCommunityIcons
                name="information-outline"
                size={27}
                color={colors.primary}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.helpTitle}>
                  Reporting tips
                </Text>

                <Text style={styles.helpText}>
                  Include the room, when the issue
                  started and whether it is becoming
                  worse.
                </Text>
              </View>
            </View>
          </View>
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

function RequestCard({
  request,
  onConfirm,
}: {
  request: MaintenanceRequest;
  onConfirm: (completed: boolean) => void;
}) {
  const statusIcon =
    request.status === "Completed"
      ? "check-circle-outline"
      : request.status === "In progress"
        ? "progress-wrench"
        : "clock-outline";

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTop}>
        <View style={styles.requestIcon}>
          <MaterialCommunityIcons
            name={statusIcon}
            size={27}
            color={
              request.status === "Completed"
                ? colors.success
                : colors.primary
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.requestTitleRow}>
            <Text style={styles.requestTitle}>
              {request.title}
            </Text>

            <Chip compact>{request.status}</Chip>
          </View>

          <Text style={styles.requestMeta}>
            {request.id} • {request.category} •{" "}
            {request.priority} priority
          </Text>
        </View>
      </View>

      <Text style={styles.requestDescription}>
        {request.description}
      </Text>

      {request.scheduledStart ? (
        <Text style={styles.requestDate}>Visit scheduled: {new Date(request.scheduledStart).toLocaleString()}</Text>
      ) : null}

      <Text style={styles.requestDate}>Submitted {request.createdAt}</Text>

      {request.status === "Awaiting tenant confirmation" ? (
        <View style={styles.confirmRow}>
          <Button mode="contained" icon="check-circle-outline" onPress={() => onConfirm(true)}>Confirm completed</Button>
          <Button mode="outlined" icon="restore" onPress={() => onConfirm(false)}>Not fixed / reopen</Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: 0 },

  page: {
    width: "100%",
    maxWidth: 1450,
    alignSelf: "center",
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 70,
  },

  topBar: {
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

  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  heroIcon: {
    width: 67,
    height: 67,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  heroLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  heroTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
  },

  heroDescription: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 10,
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
    width: 330,
    gap: spacing.lg,
  },

  card: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  cardDescription: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
  },

  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  menuRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  menuField: {
    flexGrow: 1,
    flexBasis: 240,
  },

  menuButtonContent: {
    justifyContent: "flex-start",
    minHeight: 54,
  },

  descriptionInput: {
    minHeight: 130,
  },

  availabilityCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
  },
  availabilityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  availabilityTitle: { color: colors.textPrimary, fontWeight: "900", fontSize: 13 },
  availabilityText: { marginTop: 3, color: colors.textSecondary, fontSize: 10, lineHeight: 15 },
  slotCard: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white },
  slotLabel: { color: colors.primary, fontSize: 10, fontWeight: "900" },
  accessRow: { flexDirection: "row", gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  accessRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  accessTitle: { color: colors.textPrimary, fontWeight: "800" },
  accessText: { marginTop: 3, color: colors.textSecondary, fontSize: 10, lineHeight: 15 },
  confirmRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },

  submitRow: {
    alignItems: "flex-end",
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

  requestList: {
    gap: spacing.md,
  },

  requestCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  requestTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  requestIcon: {
    width: 53,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  requestTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  requestTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  requestMeta: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 8,
  },

  requestDescription: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  requestDate: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  emergencyCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  emergencyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  emergencyText: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
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

  helpText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },
});