import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
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

type MaintenancePriority = "Low" | "Medium" | "High" | "Emergency";

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
  reportedPhotoCount: number;
};

type TenantProperty = {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  townCity?: string | null;
  county?: string | null;
  postcode: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  propertyType?: string | null;
};

type AvailabilitySlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

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

function backendMessage(error: any) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join("\n");
  if (typeof message === "string") return message;
  return "Unable to submit maintenance request.";
}

function buildLocalDate(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeValue.trim().match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const value = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) {
    return null;
  }

  return value;
}


function dateToIso(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToValue(value: Date) {
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function slotPickerDate(
  slot: AvailabilitySlot,
  field: "date" | "startTime" | "endTime",
) {
  const baseDate = slot.date
    ? buildLocalDate(slot.date, "12:00") ?? new Date()
    : new Date();

  if (field === "date") return baseDate;

  const timeValue =
    field === "startTime" ? slot.startTime : slot.endTime;

  const match = timeValue.match(/^(\d{2}):(\d{2})$/);
  const value = new Date(baseDate);

  if (match) {
    value.setHours(Number(match[1]), Number(match[2]), 0, 0);
  } else {
    value.setHours(field === "startTime" ? 9 : 10, 0, 0, 0);
  }

  return value;
}

type WebPickerFieldProps = {
  label: string;
  type: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  min?: string;
};

function WebPickerField({
  label,
  type,
  value,
  onChange,
  min,
}: WebPickerFieldProps) {
  return (
    <View style={styles.webPickerField}>
      <Text style={styles.pickerLabel}>{label}</Text>
      {React.createElement("input", {
        type,
        value,
        min,
        step: type === "time" ? 900 : undefined,
        onChange: (event: any) => onChange(event.target.value),
        style: {
          width: "100%",
          height: 52,
          boxSizing: "border-box",
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: "0 14px",
          fontSize: 14,
          fontFamily: "inherit",
          color: colors.textPrimary,
          backgroundColor: colors.white,
          outline: "none",
          cursor: "pointer",
        },
        "aria-label": label,
      })}
    </View>
  );
}

function mapRequest(row: any): MaintenanceRequest {
  return {
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
    reportedPhotoCount: Array.isArray(row.photos)
      ? row.photos.filter((photo: any) => photo.phase === "REPORTED").length
      : 0,
  };
}

export default function MaintenanceScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 950;
  const params = useLocalSearchParams<{ propertyId?: string | string[] }>();
  const requestedPropertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const [property, setProperty] = useState<TenantProperty | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [priority, setPriority] = useState<MaintenancePriority>("Medium");
  const [categoryMenu, setCategoryMenu] = useState(false);
  const [priorityMenu, setPriorityMenu] = useState(false);
  const [roomLocation, setRoomLocation] = useState("");
  const [accessPermission, setAccessPermission] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { id: "slot-1", date: "", startTime: "", endTime: "" },
  ]);
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [failedPhotoRequestId, setFailedPhotoRequestId] = useState("");
  const [retryingPhotos, setRetryingPhotos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pickerTarget, setPickerTarget] = useState<{
    slotId: string;
    field: "date" | "startTime" | "endTime";
  } | null>(null);

  const activeRequests = useMemo(
    () => requests.filter((request) => request.status !== "Completed").length,
    [requests],
  );

  const loadWorkflow = useCallback(async () => {
    setLoading(true);
    try {
      const [propertiesResponse, requestsResponse] = await Promise.all([
        api.get("/property-workflows/tenant/my-properties"),
        api.get("/property-workflows/maintenance-requests"),
      ]);

      const activeProperties = (Array.isArray(propertiesResponse.data)
        ? propertiesResponse.data
        : []
      )
        .map((row: any) => row?.property)
        .filter(Boolean) as TenantProperty[];

      const exactProperty = requestedPropertyId
        ? activeProperties.find((item) => item.id === requestedPropertyId)
        : activeProperties[0];

      const selected = exactProperty ?? activeProperties[0] ?? null;
      setProperty(selected);

      const requestRows = Array.isArray(requestsResponse.data)
        ? requestsResponse.data
        : [];

      setRequests(
        requestRows
          .filter(
            (row: any) =>
              row.tenantUserId && (!selected || row.propertyId === selected.id),
          )
          .map(mapRequest),
      );

      if (!selected) {
        setMessage(
          "No active approved tenancy was found. Maintenance is available only for the property approved for your tenant account.",
        );
      }
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || "Unable to load tenant maintenance.",
      );
    } finally {
      setLoading(false);
    }
  }, [requestedPropertyId]);

  useEffect(() => {
    void loadWorkflow();
  }, [loadWorkflow]);

  const updateSlot = (
    id: string,
    field: "date" | "startTime" | "endTime",
    value: string,
  ) => {
    setAvailabilitySlots((current) =>
      current.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot,
      ),
    );
  };

  const handleNativePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (!pickerTarget) return;

    if (event.type === "dismissed") {
      setPickerTarget(null);
      return;
    }

    if (!selectedDate) return;

    updateSlot(
      pickerTarget.slotId,
      pickerTarget.field,
      pickerTarget.field === "date"
        ? dateToIso(selectedDate)
        : timeToValue(selectedDate),
    );

    if (Platform.OS === "android") {
      setPickerTarget(null);
    }
  };

  const addSlot = () => {
    setAvailabilitySlots((current) => [
      ...current,
      { id: `slot-${Date.now()}`, date: "", startTime: "", endTime: "" },
    ]);
  };

  const removeSlot = (id: string) => {
    setAvailabilitySlots((current) =>
      current.length === 1
        ? current
        : current.filter((slot) => slot.id !== id),
    );
  };

  const pickIssuePhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPendingPhotos(result.assets);

      if (failedPhotoRequestId) {
        setSubmitError(
          "Photo selected. Click Retry photo upload to attach it to the maintenance request that is already saved.",
        );
      } else {
        setSubmitError("");
      }
    }
  };

  const uploadReportedPhotos = async (
    requestId: string,
    assets: any[],
  ) => {
    if (!assets.length) return;

    const data = new FormData();
    let appended = 0;

    for (let index = 0; index < assets.length; index += 1) {
      const asset = assets[index];
      const fallbackName =
        asset.fileName || `issue-${index + 1}.jpg`;

      if (Platform.OS === "web") {
        if (asset.file) {
          data.append(
            "photos",
            asset.file,
            asset.file.name || fallbackName,
          );
          appended += 1;
          continue;
        }

        if (asset.uri) {
          const fileResponse = await fetch(asset.uri);
          const blob = await fileResponse.blob();
          data.append("photos", blob, fallbackName);
          appended += 1;
        }

        continue;
      }

      if (asset.uri) {
        data.append(
          "photos",
          {
            uri: asset.uri,
            name: fallbackName,
            type: asset.mimeType || "image/jpeg",
          } as any,
        );
        appended += 1;
      }
    }

    if (!appended) {
      throw new Error(
        "The selected photo could not be prepared for upload. Please choose the photo again.",
      );
    }

    await api.post(
      `/property-workflows/maintenance-requests/${requestId}/reported-photos`,
      data,
    );
  };

  const resetSubmittedForm = () => {
    setTitle("");
    setDescription("");
    setRoomLocation("");
    setCategory("Plumbing");
    setPriority("Medium");
    setAccessPermission(false);
    setAvailabilitySlots([
      {
        id: `slot-${Date.now()}`,
        date: "",
        startTime: "",
        endTime: "",
      },
    ]);
    setPendingPhotos([]);
    setFailedPhotoRequestId("");
    setSubmitError("");
  };

  const addPhotosToExistingRequest = async (
    requestId: string,
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    setMessage("");
    setSubmitError("");

    try {
      await uploadReportedPhotos(requestId, result.assets);
      setMessage("Problem photo uploaded successfully.");
      await loadWorkflow();
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to upload the problem photo.";

      setSubmitError(messageText);
      setMessage(messageText);
      console.error(
        "Existing maintenance request photo upload failed:",
        error?.response?.data || error,
      );
    }
  };

  const retryPhotoUpload = async () => {
    if (!failedPhotoRequestId || !pendingPhotos.length) {
      setSubmitError(
        "Choose at least one problem photo before retrying.",
      );
      return;
    }

    setRetryingPhotos(true);
    setSubmitError("");
    setMessage("");

    try {
      await uploadReportedPhotos(
        failedPhotoRequestId,
        pendingPhotos,
      );

      resetSubmittedForm();
      setMessage(
        "Maintenance request and problem photos submitted successfully.",
      );
      await loadWorkflow();
    } catch (error: any) {
      const messageText =
        error?.response?.data?.message ||
        error?.message ||
        "The maintenance request exists, but the photo upload still failed.";

      setSubmitError(
        `The maintenance request is already saved. Photo upload failed: ${messageText}`,
      );
      setMessage(messageText);

      console.error(
        "Maintenance photo retry failed:",
        error?.response?.data || error,
      );
    } finally {
      setRetryingPhotos(false);
    }
  };

  const failSubmit = (messageText: string) => {
    setSubmitError(messageText);
    setMessage(messageText);
  };

  const handleSubmit = async () => {
    setSubmitError("");

    if (failedPhotoRequestId) {
      failSubmit(
        "This maintenance request is already saved. Use Retry photo upload instead of submitting another request.",
      );
      return;
    }
    if (!property?.id) {
      failSubmit(
        "Maintenance can only be reported for your active approved tenancy property.",
      );
      return;
    }

    if (title.trim().length < 3) {
      failSubmit("Issue title must contain at least 3 characters.");
      return;
    }

    if (description.trim().length < 5) {
      failSubmit("Issue description must contain at least 5 characters.");
      return;
    }

    const preparedSlots: { startAt: string; endAt: string }[] = [];

    for (let index = 0; index < availabilitySlots.length; index += 1) {
      const slot = availabilitySlots[index];
      const hasAnyValue = Boolean(
        slot.date.trim() || slot.startTime.trim() || slot.endTime.trim(),
      );

      if (!hasAnyValue) continue;

      if (!slot.date.trim() || !slot.startTime.trim() || !slot.endTime.trim()) {
        failSubmit(
          `Complete the date, start time and end time for availability option ${index + 1}.`,
        );
        return;
      }

      const start = buildLocalDate(slot.date, slot.startTime);
      const end = buildLocalDate(slot.date, slot.endTime);

      if (!start || !end) {
        failSubmit(
          `Availability option ${index + 1} has an invalid date or time. Please choose the date and times again.`,
        );
        return;
      }

      if (end.getTime() <= start.getTime()) {
        failSubmit(
          `Availability option ${index + 1} must end after it starts.`,
        );
        return;
      }

      preparedSlots.push({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
    }

    if (!preparedSlots.length) {
      failSubmit("Add at least one available date and time slot.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await api.post(
        "/property-workflows/maintenance-requests",
        {
          propertyId: property.id,
          title: title.trim(),
          description: description.trim(),
          category,
          roomLocation: roomLocation.trim() || undefined,
          priority: priority.toUpperCase(),
          accessPermission,
          slots: preparedSlots,
        },
      );

      const requestId = response.data.request.id as string;

      if (pendingPhotos.length) {
        try {
          await uploadReportedPhotos(
            requestId,
            pendingPhotos,
          );
        } catch (photoError: any) {
          const photoMessage =
            photoError?.response?.data?.message ||
            photoError?.message ||
            "Unable to upload the selected problem photos.";

          // The maintenance request is already created at this point.
          // Remember its ID so another Submit cannot create a duplicate.
          setFailedPhotoRequestId(requestId);
          setSubmitError(
            `Your maintenance request was saved, but the problem photos were not uploaded: ${photoMessage}`,
          );
          setMessage(
            "Request saved. Please retry the problem photo upload.",
          );

          console.error(
            "Maintenance request created, photo upload failed:",
            photoError?.response?.data || photoError,
          );

          await loadWorkflow();
          return;
        }
      }

      resetSubmittedForm();
      setMessage(
        pendingPhotos.length
          ? "Maintenance request and problem photos submitted successfully."
          : "Maintenance request submitted successfully.",
      );
      await loadWorkflow();
    } catch (error: any) {
      const messageText = backendMessage(error);
      setSubmitError(messageText);
      setMessage(messageText);
      console.error(
        "Maintenance request submission failed:",
        error?.response?.data || error,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCompletion = async (id: string, completed: boolean) => {
    try {
      await api.patch(
        `/property-workflows/maintenance-requests/${id}/tenant-confirm`,
        {
          completed,
          note: completed
            ? "Work confirmed as completed by the tenant."
            : "The issue is not fully resolved and needs more work.",
        },
      );
      setMessage(
        completed
          ? "Maintenance work confirmed as completed."
          : "The maintenance issue has been reopened.",
      );
      await loadWorkflow();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to update maintenance request.",
      );
    }
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.screenContent}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.brand}
            onPress={() => router.replace("/tenant/dashboard" as never)}
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="tools"
                size={27}
                color={colors.white}
              />
            </View>
            <View>
              <Text style={styles.brandName}>Maintenance</Text>
              <Text style={styles.brandSubtitle}>Your approved home</Text>
            </View>
          </Pressable>

          <Button mode="text" icon="arrow-left" onPress={() => router.back()}>
            Back
          </Button>
        </View>

        {property ? (
          <View style={styles.propertyBanner}>
            <View style={styles.propertyIcon}>
              <MaterialCommunityIcons
                name="home-outline"
                size={29}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.propertyLabel}>MAINTENANCE FOR</Text>
              <Text style={styles.propertyAddress}>{property.addressLine1}</Text>
              <Text style={styles.propertyMeta}>
                {[property.townCity, property.postcode].filter(Boolean).join(", ")}
              </Text>
            </View>
            <Chip icon="check-circle-outline">Active tenancy</Chip>
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="progress-wrench"
              size={38}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>PROPERTY MAINTENANCE</Text>
            <Text style={styles.heroTitle}>Report and track repairs</Text>
            <Text style={styles.heroDescription}>
              Report an issue for your approved tenancy property, give suitable
              visit times and track the repair until you confirm it is resolved.
            </Text>
          </View>
          <Chip icon="tools">{activeRequests} active</Chip>
        </View>

        <View style={[styles.layout, !isDesktop && styles.layoutStacked]}>
          <View style={styles.mainColumn}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Report a maintenance issue</Text>
              <Text style={styles.cardDescription}>
                This request is automatically linked to your approved property.
              </Text>

              <View style={styles.form}>
                <TextInput
                  mode="outlined"
                  label="Issue title"
                  placeholder="Example: Bathroom tap leaking"
                  value={title}
                  onChangeText={setTitle}
                  left={<TextInput.Icon icon="format-title" />}
                />

                <View style={styles.menuRow}>
                  <View style={styles.menuField}>
                    <Menu
                      visible={categoryMenu}
                      onDismiss={() => setCategoryMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          icon="shape-outline"
                          contentStyle={styles.menuButtonContent}
                          onPress={() => setCategoryMenu(true)}
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
                      onDismiss={() => setPriorityMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          icon="alert-outline"
                          contentStyle={styles.menuButtonContent}
                          onPress={() => setPriorityMenu(true)}
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
                  placeholder="Explain where the problem is, what happened and when it started"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  style={styles.descriptionInput}
                  left={<TextInput.Icon icon="text-box-outline" />}
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
                      <Text style={styles.availabilityTitle}>
                        When can the provider visit?
                      </Text>
                      <Text style={styles.availabilityText}>
                        Add one or more visit options. Choose a date from the
                        calendar and select the start and end times.
                      </Text>
                    </View>
                    <Button mode="text" icon="plus" onPress={addSlot}>
                      Add option
                    </Button>
                  </View>

                  {availabilitySlots.map((slot, index) => (
                    <View key={slot.id} style={styles.slotCard}>
                      <View style={styles.slotHeader}>
                        <Text style={styles.slotLabel}>Option {index + 1}</Text>
                        {availabilitySlots.length > 1 ? (
                          <Button
                            compact
                            mode="text"
                            textColor={colors.error}
                            icon="delete-outline"
                            onPress={() => removeSlot(slot.id)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </View>

                      {Platform.OS === "web" ? (
                        <>
                          <WebPickerField
                            label="Visit date"
                            type="date"
                            value={slot.date}
                            min={dateToIso(new Date())}
                            onChange={(value) =>
                              updateSlot(slot.id, "date", value)
                            }
                          />

                          <View style={styles.timeRow}>
                            <View style={styles.timeField}>
                              <WebPickerField
                                label="Available from"
                                type="time"
                                value={slot.startTime}
                                onChange={(value) =>
                                  updateSlot(slot.id, "startTime", value)
                                }
                              />
                            </View>

                            <View style={styles.timeField}>
                              <WebPickerField
                                label="Available until"
                                type="time"
                                value={slot.endTime}
                                onChange={(value) =>
                                  updateSlot(slot.id, "endTime", value)
                                }
                              />
                            </View>
                          </View>
                        </>
                      ) : (
                        <>
                          <Pressable
                            onPress={() =>
                              setPickerTarget({
                                slotId: slot.id,
                                field: "date",
                              })
                            }
                          >
                            <View pointerEvents="none">
                              <TextInput
                                mode="outlined"
                                label="Visit date"
                                value={slot.date}
                                placeholder="Choose date"
                                editable={false}
                                right={
                                  <TextInput.Icon icon="calendar-month-outline" />
                                }
                              />
                            </View>
                          </Pressable>

                          <View style={styles.timeRow}>
                            <Pressable
                              style={styles.timeField}
                              onPress={() =>
                                setPickerTarget({
                                  slotId: slot.id,
                                  field: "startTime",
                                })
                              }
                            >
                              <View pointerEvents="none">
                                <TextInput
                                  mode="outlined"
                                  label="Available from"
                                  value={slot.startTime}
                                  placeholder="Choose time"
                                  editable={false}
                                  right={<TextInput.Icon icon="clock-outline" />}
                                />
                              </View>
                            </Pressable>

                            <Pressable
                              style={styles.timeField}
                              onPress={() =>
                                setPickerTarget({
                                  slotId: slot.id,
                                  field: "endTime",
                                })
                              }
                            >
                              <View pointerEvents="none">
                                <TextInput
                                  mode="outlined"
                                  label="Available until"
                                  value={slot.endTime}
                                  placeholder="Choose time"
                                  editable={false}
                                  right={<TextInput.Icon icon="clock-outline" />}
                                />
                              </View>
                            </Pressable>
                          </View>

                          {pickerTarget?.slotId === slot.id ? (
                            <View style={styles.nativePickerCard}>
                              <Text style={styles.nativePickerTitle}>
                                {pickerTarget.field === "date"
                                  ? "Choose visit date"
                                  : pickerTarget.field === "startTime"
                                    ? "Choose available from time"
                                    : "Choose available until time"}
                              </Text>

                              <DateTimePicker
                                value={slotPickerDate(
                                  slot,
                                  pickerTarget.field,
                                )}
                                mode={
                                  pickerTarget.field === "date"
                                    ? "date"
                                    : "time"
                                }
                                display={
                                  Platform.OS === "ios"
                                    ? "spinner"
                                    : "default"
                                }
                                minimumDate={
                                  pickerTarget.field === "date"
                                    ? new Date()
                                    : undefined
                                }
                                minuteInterval={15}
                                onChange={handleNativePickerChange}
                              />

                              {Platform.OS === "ios" ? (
                                <Button
                                  mode="contained"
                                  compact
                                  icon="check"
                                  onPress={() => setPickerTarget(null)}
                                  style={styles.pickerDoneButton}
                                >
                                  Done
                                </Button>
                              ) : null}
                            </View>
                          ) : null}
                        </>
                      )}
                    </View>
                  ))}
                </View>

                <Pressable
                  style={[
                    styles.accessRow,
                    accessPermission && styles.accessRowSelected,
                  ]}
                  onPress={() => setAccessPermission((value) => !value)}
                >
                  <MaterialCommunityIcons
                    name={
                      accessPermission
                        ? "checkbox-marked-circle-outline"
                        : "checkbox-blank-circle-outline"
                    }
                    size={23}
                    color={
                      accessPermission ? colors.primary : colors.textMuted
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accessTitle}>Access permission</Text>
                    <Text style={styles.accessText}>
                      Select only if an approved maintenance provider may enter
                      the property as agreed when you are not present.
                    </Text>
                  </View>
                </Pressable>

                <Button
                  mode="outlined"
                  icon="camera-outline"
                  onPress={pickIssuePhotos}
                >
                  Add problem photos ({pendingPhotos.length})
                </Button>

                {submitError ? (
                  <View style={styles.submitErrorCard}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={21}
                      color={colors.error}
                    />
                    <View style={styles.submitErrorContent}>
                      <Text style={styles.submitErrorText}>
                        {submitError}
                      </Text>

                      {failedPhotoRequestId ? (
                        <Button
                          mode="contained"
                          compact
                          icon="image-sync-outline"
                          loading={retryingPhotos}
                          disabled={
                            retryingPhotos ||
                            !pendingPhotos.length
                          }
                          onPress={retryPhotoUpload}
                          style={styles.retryPhotoButton}
                        >
                          Retry photo upload
                        </Button>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                <View style={styles.submitRow}>
                  <Button
                    mode="contained"
                    icon="send-outline"
                    loading={submitting}
                    disabled={
                      submitting ||
                      loading ||
                      !property ||
                      Boolean(failedPhotoRequestId)
                    }
                    onPress={handleSubmit}
                  >
                    {failedPhotoRequestId
                      ? "Request saved - retry photos above"
                      : submitting
                        ? "Submitting maintenance request..."
                        : "Submit maintenance request"}
                  </Button>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Your repair requests</Text>
                <Text style={styles.sectionDescription}>
                  Only requests for this tenancy property are shown.
                </Text>
              </View>
              <Chip>{requests.length} total</Chip>
            </View>

            <View style={styles.requestList}>
              {requests.length ? (
                requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onConfirm={(completed) =>
                      void confirmCompletion(request.id, completed)
                    }
                    onAddProblemPhotos={() =>
                      void addPhotosToExistingRequest(request.id)
                    }
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons
                    name="tools"
                    size={30}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyTitle}>No maintenance requests</Text>
                  <Text style={styles.emptyText}>
                    New repair requests for this home will appear here.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sideColumn}>
            <WorkflowNotifications
              compact
              title="Maintenance updates"
              limit={5}
            />

            {property?.id ? (
              <PropertyMaintenanceProviders
                actingRole="TENANT"
                propertyEndpoint="/property-workflows/tenant/my-properties"
                fixedPropertyId={property.id}
                hidePropertySelector
                title="Maintenance team"
                subtitle="Providers linked to this home. Tenant-added providers require Estate Agent approval."
              />
            ) : null}

            <View style={styles.emergencyCard}>
              <MaterialCommunityIcons
                name="alert-octagon-outline"
                size={31}
                color={colors.error}
              />
              <Text style={styles.emergencyTitle}>Emergency issue?</Text>
              <Text style={styles.emergencyText}>
                For immediate danger, fire, suspected gas leaks or serious
                flooding, use the appropriate emergency service or emergency
                property contact instead of waiting for a normal maintenance
                request.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Snackbar
        visible={Boolean(message)}
        duration={5000}
        onDismiss={() => setMessage("")}
        action={{ label: "Close", onPress: () => setMessage("") }}
      >
        {message}
      </Snackbar>
    </ScreenContainer>
  );
}

function RequestCard({
  request,
  onConfirm,
  onAddProblemPhotos,
}: {
  request: MaintenanceRequest;
  onConfirm: (completed: boolean) => void;
  onAddProblemPhotos: () => void;
}) {
  const statusIcon =
    request.status === "Completed"
      ? "check-circle-outline"
      : request.status === "In progress"
        ? "progress-wrench"
        : request.status === "Scheduled"
          ? "calendar-check-outline"
          : request.status === "Reopened"
            ? "restore"
            : "clock-outline";

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTop}>
        <View style={styles.requestIcon}>
          <MaterialCommunityIcons
            name={statusIcon}
            size={27}
            color={
              request.status === "Completed" ? colors.success : colors.primary
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.requestTitleRow}>
            <Text style={styles.requestTitle}>{request.title}</Text>
            <Chip compact>{request.status}</Chip>
          </View>
          <Text style={styles.requestMeta}>
            {request.category} • {request.priority} priority
            {request.roomLocation ? ` • ${request.roomLocation}` : ""}
          </Text>
        </View>
      </View>

      <Text style={styles.requestDescription}>{request.description}</Text>

      {request.scheduledStart ? (
        <Text style={styles.requestDate}>
          Visit scheduled: {new Date(request.scheduledStart).toLocaleString()}
        </Text>
      ) : null}

      <Text style={styles.requestDate}>Submitted {request.createdAt}</Text>

      {request.reportedPhotoCount === 0 &&
      (request.status === "Open" || request.status === "Reopened") ? (
        <View style={styles.missingPhotoRow}>
          <View style={styles.missingPhotoCopy}>
            <MaterialCommunityIcons
              name="image-outline"
              size={19}
              color={colors.warning}
            />
            <Text style={styles.missingPhotoText}>
              No problem photo is attached to this request yet.
            </Text>
          </View>
          <Button
            mode="outlined"
            compact
            icon="camera-plus-outline"
            onPress={onAddProblemPhotos}
          >
            Add problem photo
          </Button>
        </View>
      ) : null}

      {request.status === "Awaiting tenant confirmation" ? (
        <View style={styles.confirmRow}>
          <Button
            mode="contained"
            icon="check-circle-outline"
            onPress={() => onConfirm(true)}
          >
            Confirm completed
          </Button>
          <Button
            mode="outlined"
            icon="restore"
            onPress={() => onConfirm(false)}
          >
            Not fixed / reopen
          </Button>
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
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  brandName: { color: colors.textPrimary, fontSize: 17, fontWeight: "900" },
  brandSubtitle: { marginTop: 2, color: colors.textMuted, fontSize: 9 },
  propertyBanner: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },
  propertyIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.white,
  },
  propertyLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  propertyAddress: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  propertyMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 10 },
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
    maxWidth: 700,
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },
  layout: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xl },
  layoutStacked: { flexDirection: "column" },
  mainColumn: { flex: 1, minWidth: 0, gap: spacing.lg },
  sideColumn: { width: 340, maxWidth: "100%", gap: spacing.lg },
  card: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "900" },
  cardDescription: { marginTop: 5, color: colors.textMuted, fontSize: 9 },
  form: { gap: spacing.md, marginTop: spacing.xl },
  menuRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  menuField: { flexGrow: 1, flexBasis: 240 },
  menuButtonContent: { justifyContent: "flex-start", minHeight: 54 },
  descriptionInput: { minHeight: 130 },
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
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  availabilityTitle: {
    color: colors.textPrimary,
    fontWeight: "900",
    fontSize: 13,
  },
  availabilityText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },
  slotCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  slotLabel: { color: colors.primary, fontSize: 10, fontWeight: "900" },
  webPickerField: {
    flex: 1,
    gap: 6,
  },
  pickerLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  nativePickerCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  nativePickerTitle: {
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },
  pickerDoneButton: {
    alignSelf: "flex-end",
    marginTop: spacing.sm,
  },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  timeField: { flexGrow: 1, flexBasis: 180 },
  accessRow: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  accessRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  accessTitle: { color: colors.textPrimary, fontWeight: "800" },
  accessText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },
  submitErrorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    backgroundColor: colors.errorLight,
  },
  submitErrorContent: {
    flex: 1,
    gap: spacing.sm,
  },
  submitErrorText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 16,
  },
  retryPhotoButton: {
    alignSelf: "flex-start",
  },
  submitRow: { alignItems: "flex-end" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "900" },
  sectionDescription: { marginTop: 4, color: colors.textMuted, fontSize: 9 },
  requestList: { gap: spacing.md },
  requestCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  requestTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
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
  requestTitle: { flex: 1, color: colors.textPrimary, fontSize: 12, fontWeight: "900" },
  requestMeta: { marginTop: 5, color: colors.textMuted, fontSize: 8 },
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
  missingPhotoRow: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    backgroundColor: colors.warningLight,
    gap: spacing.sm,
  },
  missingPhotoCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  missingPhotoText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 14,
  },
  confirmRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  emptyTitle: { color: colors.textPrimary, fontWeight: "900" },
  emptyText: { color: colors.textMuted, fontSize: 9, textAlign: "center" },
  emergencyCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  emergencyTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: "900" },
  emergencyText: { color: colors.textSecondary, fontSize: 9, lineHeight: 16 },
});
