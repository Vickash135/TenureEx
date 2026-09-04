import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
    Dialog,
    Portal,
    TextInput,
} from "react-native-paper";

import { api } from "../api/client";
import { colors, radius, spacing } from "../theme";
import ScreenContainer from "./ScreenContainer";

type PortalType =
  | "council"
  | "agent"
  | "landlord"
  | "tenant";

type PickerTarget =
  | "startDate"
  | "startTime"
  | "endDate"
  | "endTime"
  | null;

export default function CouncilInspectionDetails({
  portal,
}: {
  portal: PortalType;
}) {
  const params =
    useLocalSearchParams<{
      inspectionId?: string;
    }>();

  const id = String(params.inspectionId || "");

  const { width } = useWindowDimensions();

  const isInspector = portal === "council";
  const isMobile = width < 650;

  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState("");

  // =========================================================
  // SCHEDULE
  // =========================================================

  const [schedule, setSchedule] = useState(false);

  const [startDateTime, setStartDateTime] =
    useState<Date>(() => {
      const date = new Date();
      date.setMinutes(
        Math.ceil(date.getMinutes() / 15) * 15
      );
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    });

  const [endDateTime, setEndDateTime] =
    useState<Date>(() => {
      const date = new Date();
      date.setMinutes(
        Math.ceil(date.getMinutes() / 15) * 15
      );
      date.setHours(date.getHours() + 1);
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    });

  const [pickerTarget, setPickerTarget] =
    useState<PickerTarget>(null);

  // =========================================================
  // OTHER EXISTING STATE
  // =========================================================

  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");

  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");

  const [finding, setFinding] = useState({
    category: "Housing condition",
    severity: "MAJOR",
    location: "",
    description: "",
    recommendation: "",
  });

  const [action, setAction] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    dueAt: "",
  });

  const [evidence, setEvidence] = useState({
    actionId: "",
    note: "",
    fileName: "",
    fileUrl: "",
  });

  // =========================================================
  // LOAD
  // =========================================================

  const load = async () => {
    try {
      const response = await api.get(
        `/council-inspections/cases/${id}`
      );

      setData(response.data);

      setNotes(
        response.data.inspectionNotes || ""
      );

      setOutcome(response.data.outcome || "");
    } catch (error: any) {
      setMsg(
        error?.response?.data?.message ||
          "Unable to load inspection."
      );
    }
  };

  useEffect(() => {
    if (id) {
      void load();
    }
  }, [id]);

  // =========================================================
  // GENERIC API CALL
  // =========================================================

  const call = async (
    method: string,
    url: string,
    body?: any
  ) => {
    try {
      await (api as any)[method](url, body);

      await load();

      setMsg("Saved successfully.");

      return true;
    } catch (error: any) {
      setMsg(
        error?.response?.data?.message ||
          "Unable to update inspection."
      );

      return false;
    }
  };

  // =========================================================
  // DATE/TIME HELPERS
  // =========================================================

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatWebDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatWebTime = (date: Date) => {
    const hours = String(
      date.getHours()
    ).padStart(2, "0");

    const minutes = String(
      date.getMinutes()
    ).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  // =========================================================
  // OPEN SCHEDULE
  // =========================================================

  const openScheduleDialog = () => {
    if (data?.scheduledStart) {
      const existingStart = new Date(
        data.scheduledStart
      );

      setStartDateTime(existingStart);

      if (data?.scheduledEnd) {
        setEndDateTime(
          new Date(data.scheduledEnd)
        );
      } else {
        const calculatedEnd = new Date(
          existingStart
        );

        calculatedEnd.setHours(
          calculatedEnd.getHours() + 1
        );

        setEndDateTime(calculatedEnd);
      }
    } else {
      const newStart = new Date();

      newStart.setMinutes(
        Math.ceil(newStart.getMinutes() / 15) *
          15
      );

      newStart.setSeconds(0);
      newStart.setMilliseconds(0);

      const newEnd = new Date(newStart);
      newEnd.setHours(newEnd.getHours() + 1);

      setStartDateTime(newStart);
      setEndDateTime(newEnd);
    }

    setPickerTarget(null);
    setSchedule(true);
  };

  // =========================================================
  // NATIVE PICKER
  // =========================================================

  const handleNativePickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (
      Platform.OS === "android" &&
      event.type === "dismissed"
    ) {
      setPickerTarget(null);
      return;
    }

    if (!selected || !pickerTarget) {
      if (Platform.OS === "android") {
        setPickerTarget(null);
      }

      return;
    }

    if (pickerTarget === "startDate") {
      const updated = new Date(
        startDateTime
      );

      updated.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );

      setStartDateTime(updated);
    }

    if (pickerTarget === "startTime") {
      const updated = new Date(
        startDateTime
      );

      updated.setHours(
        selected.getHours(),
        selected.getMinutes(),
        0,
        0
      );

      setStartDateTime(updated);
    }

    if (pickerTarget === "endDate") {
      const updated = new Date(endDateTime);

      updated.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );

      setEndDateTime(updated);
    }

    if (pickerTarget === "endTime") {
      const updated = new Date(endDateTime);

      updated.setHours(
        selected.getHours(),
        selected.getMinutes(),
        0,
        0
      );

      setEndDateTime(updated);
    }

    if (Platform.OS === "android") {
      setPickerTarget(null);
    }
  };

  const pickerDate = useMemo(() => {
    if (
      pickerTarget === "startDate" ||
      pickerTarget === "startTime"
    ) {
      return startDateTime;
    }

    return endDateTime;
  }, [
    pickerTarget,
    startDateTime,
    endDateTime,
  ]);

  // =========================================================
  // WEB DATE CHANGE
  // =========================================================

  const updateWebDate = (
    target: "start" | "end",
    value: string
  ) => {
    if (!value) return;

    const [year, month, day] = value
      .split("-")
      .map(Number);

    if (!year || !month || !day) return;

    if (target === "start") {
      const next = new Date(startDateTime);

      next.setFullYear(
        year,
        month - 1,
        day
      );

      setStartDateTime(next);
    } else {
      const next = new Date(endDateTime);

      next.setFullYear(
        year,
        month - 1,
        day
      );

      setEndDateTime(next);
    }
  };

  const updateWebTime = (
    target: "start" | "end",
    value: string
  ) => {
    if (!value) return;

    const [hours, minutes] = value
      .split(":")
      .map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return;
    }

    if (target === "start") {
      const next = new Date(startDateTime);

      next.setHours(
        hours,
        minutes,
        0,
        0
      );

      setStartDateTime(next);
    } else {
      const next = new Date(endDateTime);

      next.setHours(
        hours,
        minutes,
        0,
        0
      );

      setEndDateTime(next);
    }
  };

  // =========================================================
  // SAVE SCHEDULE
  // =========================================================

  const saveSchedule = async () => {
    if (
      Number.isNaN(
        startDateTime.getTime()
      ) ||
      Number.isNaN(endDateTime.getTime())
    ) {
      setMsg(
        "Please select a valid inspection date and time."
      );

      return;
    }

    if (startDateTime <= new Date()) {
      setMsg(
        "The inspection start time must be in the future."
      );

      return;
    }

    if (endDateTime <= startDateTime) {
      setMsg(
        "The inspection end time must be after the start time."
      );

      return;
    }

    const success = await call(
      "patch",
      `/council-inspections/cases/${id}/schedule`,
      {
        startAt:
          startDateTime.toISOString(),

        endAt: endDateTime.toISOString(),
      }
    );

    if (success) {
      setPickerTarget(null);
      setSchedule(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (!data) {
    return (
      <ScreenContainer
        scrollable
        contentStyle={s.page}
      >
        <Text>
          {msg || "Loading inspection..."}
        </Text>
      </ScreenContainer>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <ScreenContainer
      scrollable
      contentStyle={s.page}
    >
      <View style={s.wrap}>
        {/* HEADER */}

        <View style={s.head}>
          <View style={s.headText}>
            <Text style={s.title}>
              {data.title}
            </Text>

            <Text style={s.sub}>
              {data.property?.addressLine1},{" "}
              {data.property?.postcode} ·{" "}
              {data.status.replace(/_/g, " ")}
            </Text>
          </View>

          <Button
            mode="outlined"
            onPress={() => router.back()}
          >
            Back
          </Button>
        </View>

        {msg ? (
          <Text style={s.msg}>{msg}</Text>
        ) : null}

        {/* =====================================================
            CASE OVERVIEW
        ===================================================== */}

        <Card title="Case overview">
          <KV
            l="Category"
            v={data.category}
          />

          <KV
            l="Priority"
            v={data.priority}
          />

          <KV
            l="Requested by"
            v={
              data.requester
                ? `${data.requester.firstName} ${data.requester.lastName}`
                : "—"
            }
          />

          <KV
            l="Inspector"
            v={
              data.inspector
                ? `${data.inspector.firstName} ${data.inspector.lastName}`
                : "—"
            }
          />

          <KV
            l="Description"
            v={data.description}
          />

          <KV
            l="Access notes"
            v={data.accessNotes || "—"}
          />

          <KV
            l="Scheduled"
            v={
              data.scheduledStart
                ? new Date(
                    data.scheduledStart
                  ).toLocaleString("en-GB")
                : "Not scheduled"
            }
          />
        </Card>

        {/* =====================================================
            REQUEST ACTIONS
        ===================================================== */}

        {isInspector &&
        data.status === "REQUESTED" ? (
          <View style={s.actions}>
            <Button
              mode="contained"
              onPress={() =>
                call(
                  "post",
                  `/council-inspections/cases/${id}/accept`
                )
              }
            >
              Accept request
            </Button>

            <Button
              mode="outlined"
              textColor={colors.error}
              onPress={() =>
                call(
                  "post",
                  `/council-inspections/cases/${id}/decline`,
                  {
                    reason:
                      "Unable to take this inspection request.",
                  }
                )
              }
            >
              Decline
            </Button>
          </View>
        ) : null}

        {/* =====================================================
            INSPECTION MANAGEMENT
        ===================================================== */}

        {isInspector ? (
          <Card title="Inspection management">
            <Button
              mode="outlined"
              icon="calendar-clock"
              onPress={openScheduleDialog}
            >
              {data.scheduledStart
                ? "Change inspection schedule"
                : "Schedule inspection"}
            </Button>

            <TextInput
              mode="outlined"
              label="Inspection notes"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TextInput
              mode="outlined"
              label="Outcome"
              value={outcome}
              onChangeText={setOutcome}
            />

            <View style={s.actions}>
              <Button
                mode="contained"
                onPress={() =>
                  call(
                    "patch",
                    `/council-inspections/cases/${id}/inspection`,
                    {
                      status: "IN_PROGRESS",
                      inspectionNotes: notes,
                      outcome,
                    }
                  )
                }
              >
                Save / start inspection
              </Button>

              <Button
                mode="contained"
                onPress={() =>
                  call(
                    "patch",
                    `/council-inspections/cases/${id}/inspection`,
                    {
                      status: "COMPLETED",
                      inspectionNotes: notes,
                      outcome,
                    }
                  )
                }
              >
                Complete inspection
              </Button>
            </View>
          </Card>
        ) : null}

        {/* =====================================================
            FINDINGS
        ===================================================== */}

        <Card title="Findings">
          {data.findings?.map((f: any) => (
            <View
              key={f.id}
              style={s.item}
            >
              <Text style={s.itemTitle}>
                {f.severity} · {f.category}
              </Text>

              <Text style={s.sub}>
                {f.location || "Property"}
              </Text>

              <Text>{f.description}</Text>

              {f.recommendation ? (
                <Text style={s.recommend}>
                  Recommendation:{" "}
                  {f.recommendation}
                </Text>
              ) : null}
            </View>
          ))}

          {!data.findings?.length ? (
            <Text style={s.sub}>
              No findings recorded.
            </Text>
          ) : null}

          {isInspector ? (
            <View style={s.formStack}>
              <TextInput
                mode="outlined"
                label="Finding category"
                value={finding.category}
                onChangeText={(v) =>
                  setFinding({
                    ...finding,
                    category: v,
                  })
                }
              />

              <TextInput
                mode="outlined"
                label="Severity (MINOR / MAJOR / CRITICAL)"
                value={finding.severity}
                onChangeText={(v) =>
                  setFinding({
                    ...finding,
                    severity: v,
                  })
                }
              />

              <TextInput
                mode="outlined"
                label="Location"
                value={finding.location}
                onChangeText={(v) =>
                  setFinding({
                    ...finding,
                    location: v,
                  })
                }
              />

              <TextInput
                mode="outlined"
                label="Finding description"
                multiline
                value={finding.description}
                onChangeText={(v) =>
                  setFinding({
                    ...finding,
                    description: v,
                  })
                }
              />

              <TextInput
                mode="outlined"
                label="Recommendation"
                multiline
                value={finding.recommendation}
                onChangeText={(v) =>
                  setFinding({
                    ...finding,
                    recommendation: v,
                  })
                }
              />

              <Button
                mode="contained"
                onPress={async () => {
                  await call(
                    "post",
                    `/council-inspections/cases/${id}/findings`,
                    finding
                  );

                  setFinding({
                    ...finding,
                    description: "",
                    recommendation: "",
                  });
                }}
              >
                Add finding
              </Button>
            </View>
          ) : null}
        </Card>

        {/* =====================================================
            REQUIRED ACTIONS
        ===================================================== */}

        <Card title="Required actions">
          {data.actions?.map((a: any) => (
            <View
              key={a.id}
              style={s.item}
            >
              <Text style={s.itemTitle}>
                {a.title}
              </Text>

              <Text>{a.description}</Text>

              <Text style={s.sub}>
                Status:{" "}
                {a.status.replace(/_/g, " ")}

                {a.dueAt
                  ? ` · Due ${new Date(
                      a.dueAt
                    ).toLocaleDateString(
                      "en-GB"
                    )}`
                  : ""}
              </Text>

              <View style={s.actions}>
                {!isInspector &&
                !a.maintenanceRequestId ? (
                  <Button
                    mode="outlined"
                    onPress={() =>
                      call(
                        "post",
                        `/council-inspections/cases/${id}/actions/${a.id}/maintenance`
                      )
                    }
                  >
                    Create maintenance job
                  </Button>
                ) : null}

                {a.maintenanceRequestId ? (
                  <Text style={s.link}>
                    Maintenance:{" "}
                    {a.maintenanceRequestId.slice(
                      0,
                      8
                    )}
                  </Text>
                ) : null}

                {isInspector &&
                a.status !== "VERIFIED" ? (
                  <Button
                    mode="outlined"
                    onPress={() =>
                      call(
                        "patch",
                        `/council-inspections/cases/${id}/actions/${a.id}/verify`
                      )
                    }
                  >
                    Verify action
                  </Button>
                ) : null}
              </View>
            </View>
          ))}

          {isInspector ? (
            <View style={s.formStack}>
              <TextInput
                mode="outlined"
                label="Required action"
                value={action.title}
                onChangeText={(v) =>
                  setAction({
                    ...action,
                    title: v,
                  })
                }
              />

              <TextInput
                mode="outlined"
                multiline
                label="Work required"
                value={action.description}
                onChangeText={(v) =>
                  setAction({
                    ...action,
                    description: v,
                  })
                }
              />

              <TextInput
                mode="outlined"
                label="Priority"
                value={action.priority}
                onChangeText={(v) =>
                  setAction({
                    ...action,
                    priority: v,
                  })
                }
              />

              <TextInput
                mode="outlined"
                label="Due date (YYYY-MM-DD)"
                value={action.dueAt}
                onChangeText={(v) =>
                  setAction({
                    ...action,
                    dueAt: v,
                  })
                }
              />

              <Button
                mode="contained"
                onPress={async () => {
                  await call(
                    "post",
                    `/council-inspections/cases/${id}/actions`,
                    {
                      ...action,

                      dueAt: action.dueAt
                        ? new Date(
                            `${action.dueAt}T12:00:00`
                          ).toISOString()
                        : undefined,
                    }
                  );

                  setAction({
                    title: "",
                    description: "",
                    priority: "NORMAL",
                    dueAt: "",
                  });
                }}
              >
                Issue required action
              </Button>
            </View>
          ) : null}
        </Card>

        {/* =====================================================
            TENANT MAINTENANCE AVAILABILITY
        ===================================================== */}

        {portal === "tenant" &&
        data.actions?.some(
          (a: any) =>
            a.maintenanceRequestId
        ) ? (
          <Card title="Maintenance availability">
            <Text style={s.sub}>
              Council-required repair work is
              linked to maintenance. Add a
              suitable visit time so an approved
              maintenance provider can pick the
              job.
            </Text>

            <TextInput
              mode="outlined"
              label="Available from (YYYY-MM-DDTHH:mm)"
              value={slotStart}
              onChangeText={setSlotStart}
            />

            <TextInput
              mode="outlined"
              label="Available until (YYYY-MM-DDTHH:mm)"
              value={slotEnd}
              onChangeText={setSlotEnd}
            />

            <Button
              mode="contained"
              onPress={async () => {
                const linkedAction =
                  data.actions.find(
                    (a: any) =>
                      a.maintenanceRequestId
                  );

                if (
                  !linkedAction?.maintenanceRequestId
                ) {
                  return;
                }

                try {
                  await api.post(
                    `/property-workflows/maintenance-requests/${linkedAction.maintenanceRequestId}/tenant-slots`,
                    {
                      slots: [
                        {
                          startAt:
                            new Date(
                              slotStart
                            ).toISOString(),

                          endAt:
                            new Date(
                              slotEnd
                            ).toISOString(),
                        },
                      ],
                    }
                  );

                  setMsg(
                    "Availability sent to the maintenance team."
                  );

                  setSlotStart("");
                  setSlotEnd("");
                } catch (error: any) {
                  setMsg(
                    error?.response?.data
                      ?.message ||
                      "Unable to save availability."
                  );
                }
              }}
            >
              Send availability to maintenance
              team
            </Button>
          </Card>
        ) : null}

        {/* =====================================================
            EVIDENCE
        ===================================================== */}

        <Card title="Evidence">
          <TextInput
            mode="outlined"
            label="Action ID (optional)"
            value={evidence.actionId}
            onChangeText={(v) =>
              setEvidence({
                ...evidence,
                actionId: v,
              })
            }
          />

          <TextInput
            mode="outlined"
            multiline
            label="Evidence / completion note"
            value={evidence.note}
            onChangeText={(v) =>
              setEvidence({
                ...evidence,
                note: v,
              })
            }
          />

          <TextInput
            mode="outlined"
            label="File name (optional)"
            value={evidence.fileName}
            onChangeText={(v) =>
              setEvidence({
                ...evidence,
                fileName: v,
              })
            }
          />

          <TextInput
            mode="outlined"
            label="File URL (optional)"
            value={evidence.fileUrl}
            onChangeText={(v) =>
              setEvidence({
                ...evidence,
                fileUrl: v,
              })
            }
          />

          <Button
            mode="contained"
            onPress={async () => {
              await call(
                "post",
                `/council-inspections/cases/${id}/evidence`,
                evidence
              );

              setEvidence({
                actionId: "",
                note: "",
                fileName: "",
                fileUrl: "",
              });
            }}
          >
            Submit evidence
          </Button>

          {data.evidence?.map((e: any) => (
            <View
              key={e.id}
              style={s.item}
            >
              <Text>
                {e.note ||
                  e.fileName ||
                  "Evidence submitted"}
              </Text>

              <Text style={s.sub}>
                {new Date(
                  e.createdAt
                ).toLocaleString("en-GB")}
              </Text>
            </View>
          ))}
        </Card>

        {/* =====================================================
            HISTORY
        ===================================================== */}

        <Card title="Case history">
          {data.events?.map((e: any) => (
            <View
              key={e.id}
              style={s.item}
            >
              <Text style={s.itemTitle}>
                {e.title}
              </Text>

              <Text>{e.message}</Text>

              <Text style={s.sub}>
                {new Date(
                  e.createdAt
                ).toLocaleString("en-GB")}
              </Text>
            </View>
          ))}
        </Card>

        {isInspector ? (
          <Button
            mode="contained"
            onPress={() =>
              call(
                "post",
                `/council-inspections/cases/${id}/close`
              )
            }
          >
            Close case
          </Button>
        ) : null}

        {/* =====================================================
            SCHEDULE DIALOG
        ===================================================== */}

        <Portal>
          <Dialog
            visible={schedule}
            onDismiss={() => {
              setPickerTarget(null);
              setSchedule(false);
            }}
            style={s.scheduleDialog}
          >
            <View style={s.scheduleHeader}>
              <View style={s.scheduleHeaderIcon}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={26}
                  color={colors.primary}
                />
              </View>

              <View style={s.scheduleHeaderText}>
                <Text style={s.scheduleTitle}>
                  Schedule inspection
                </Text>

                <Text
                  style={
                    s.scheduleDescription
                  }
                >
                  Select the inspection date and
                  expected start and finish time.
                </Text>
              </View>
            </View>

            <Dialog.Content
              style={s.scheduleContent}
            >
              {/* START */}

              <View
                style={s.scheduleSection}
              >
                <View
                  style={
                    s.scheduleSectionHeader
                  }
                >
                  <View
                    style={
                      s.scheduleNumber
                    }
                  >
                    <Text
                      style={
                        s.scheduleNumberText
                      }
                    >
                      1
                    </Text>
                  </View>

                  <View style={s.scheduleHeaderText}>
                    <Text
                      style={
                        s.scheduleSectionTitle
                      }
                    >
                      Inspection starts
                    </Text>

                    <Text
                      style={
                        s.scheduleSectionSub
                      }
                    >
                      Choose the arrival date and
                      time.
                    </Text>
                  </View>
                </View>

                {Platform.OS === "web" ? (
                  <View
                    style={[
                      s.webPickerRow,

                      isMobile &&
                        s.mobilePickerRow,
                    ]}
                  >
                    <WebPickerField
                      icon="calendar-month-outline"
                      label="Start date"
                      type="date"
                      value={formatWebDate(
                        startDateTime
                      )}
                      onChange={(value) =>
                        updateWebDate(
                          "start",
                          value
                        )
                      }
                    />

                    <WebPickerField
                      icon="clock-outline"
                      label="Start time"
                      type="time"
                      value={formatWebTime(
                        startDateTime
                      )}
                      onChange={(value) =>
                        updateWebTime(
                          "start",
                          value
                        )
                      }
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      s.nativePickerRow,

                      isMobile &&
                        s.mobilePickerRow,
                    ]}
                  >
                    <PickerButton
                      icon="calendar-month-outline"
                      label="Start date"
                      value={formatDate(
                        startDateTime
                      )}
                      onPress={() =>
                        setPickerTarget(
                          "startDate"
                        )
                      }
                    />

                    <PickerButton
                      icon="clock-outline"
                      label="Start time"
                      value={formatTime(
                        startDateTime
                      )}
                      onPress={() =>
                        setPickerTarget(
                          "startTime"
                        )
                      }
                    />
                  </View>
                )}
              </View>

              {/* END */}

              <View
                style={s.scheduleSection}
              >
                <View
                  style={
                    s.scheduleSectionHeader
                  }
                >
                  <View
                    style={
                      s.scheduleNumber
                    }
                  >
                    <Text
                      style={
                        s.scheduleNumberText
                      }
                    >
                      2
                    </Text>
                  </View>

                  <View style={s.scheduleHeaderText}>
                    <Text
                      style={
                        s.scheduleSectionTitle
                      }
                    >
                      Inspection ends
                    </Text>

                    <Text
                      style={
                        s.scheduleSectionSub
                      }
                    >
                      Choose the expected finish
                      date and time.
                    </Text>
                  </View>
                </View>

                {Platform.OS === "web" ? (
                  <View
                    style={[
                      s.webPickerRow,

                      isMobile &&
                        s.mobilePickerRow,
                    ]}
                  >
                    <WebPickerField
                      icon="calendar-month-outline"
                      label="End date"
                      type="date"
                      value={formatWebDate(
                        endDateTime
                      )}
                      onChange={(value) =>
                        updateWebDate(
                          "end",
                          value
                        )
                      }
                    />

                    <WebPickerField
                      icon="clock-outline"
                      label="End time"
                      type="time"
                      value={formatWebTime(
                        endDateTime
                      )}
                      onChange={(value) =>
                        updateWebTime(
                          "end",
                          value
                        )
                      }
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      s.nativePickerRow,

                      isMobile &&
                        s.mobilePickerRow,
                    ]}
                  >
                    <PickerButton
                      icon="calendar-month-outline"
                      label="End date"
                      value={formatDate(
                        endDateTime
                      )}
                      onPress={() =>
                        setPickerTarget(
                          "endDate"
                        )
                      }
                    />

                    <PickerButton
                      icon="clock-outline"
                      label="End time"
                      value={formatTime(
                        endDateTime
                      )}
                      onPress={() =>
                        setPickerTarget(
                          "endTime"
                        )
                      }
                    />
                  </View>
                )}
              </View>

              {/* SUMMARY */}

              <View
                style={s.scheduleSummary}
              >
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={21}
                  color={colors.primary}
                />

                <View style={s.scheduleSummaryText}>
                  <Text
                    style={
                      s.scheduleSummaryTitle
                    }
                  >
                    Selected schedule
                  </Text>

                  <Text
                    style={
                      s.scheduleSummaryValue
                    }
                  >
                    {formatDate(
                      startDateTime
                    )}{" "}
                    at{" "}
                    {formatTime(
                      startDateTime
                    )}{" "}
                    →{" "}
                    {formatDate(
                      endDateTime
                    )}{" "}
                    at{" "}
                    {formatTime(endDateTime)}
                  </Text>
                </View>
              </View>

              {/* NATIVE DATE/TIME PICKER */}

              {Platform.OS !== "web" &&
              pickerTarget ? (
                <View
                  style={
                    s.nativePickerContainer
                  }
                >
                  <DateTimePicker
                    value={pickerDate}
                    mode={
                      pickerTarget.endsWith(
                        "Time"
                      )
                        ? "time"
                        : "date"
                    }
                    display={
                      Platform.OS === "ios"
                        ? "spinner"
                        : "default"
                    }
                    minimumDate={
                      pickerTarget.includes(
                        "Date"
                      )
                        ? new Date()
                        : undefined
                    }
                    minuteInterval={5}
                    onChange={
                      handleNativePickerChange
                    }
                  />

                  {Platform.OS === "ios" ? (
                    <Button
                      mode="contained-tonal"
                      onPress={() =>
                        setPickerTarget(null)
                      }
                    >
                      Done
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </Dialog.Content>

            <Dialog.Actions
              style={[
                s.scheduleActions,

                isMobile &&
                  s.mobileScheduleActions,
              ]}
            >
              <Button
                mode="outlined"
                onPress={() => {
                  setPickerTarget(null);
                  setSchedule(false);
                }}
                style={
                  isMobile
                    ? s.mobileScheduleButton
                    : undefined
                }
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                icon="calendar-check-outline"
                onPress={saveSchedule}
                style={
                  isMobile
                    ? s.mobileScheduleButton
                    : undefined
                }
              >
                Save schedule
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ScreenContainer>
  );
}

// ===========================================================
// PICKER BUTTON
// ===========================================================

function PickerButton({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.pickerButton,

        pressed && {
          opacity: 0.8,
        },
      ]}
    >
      <View style={s.pickerButtonIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={s.pickerButtonText}>
        <Text style={s.pickerLabel}>
          {label}
        </Text>

        <Text style={s.pickerValue}>
          {value}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-down"
        size={20}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

// ===========================================================
// WEB DATE/TIME PICKER
// ===========================================================

function WebPickerField({
  icon,
  label,
  type,
  value,
  onChange,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  type: "date" | "time";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={s.webPickerField}>
      <View style={s.webPickerLabelRow}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.primary}
        />

        <Text style={s.webPickerLabel}>
          {label}
        </Text>
      </View>

      {Platform.OS === "web"
        ? ((
            <input
              type={type}
              value={value}
              onChange={(event: any) =>
                onChange(event.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                height: 48,
                borderRadius: 8,
                border:
                  "1px solid #D7DEE3",
                padding: "0 12px",
                fontSize: 15,
                outline: "none",
                backgroundColor: "#FFFFFF",
                color: "#172B35",
                fontFamily: "inherit",
              }}
            />
          ) as any)
        : null}
    </View>
  );
}

// ===========================================================
// CARD
// ===========================================================

function Card({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>
        {title}
      </Text>

      <View style={s.formStack}>
        {children}
      </View>
    </View>
  );
}

// ===========================================================
// KEY VALUE
// ===========================================================

function KV({
  l,
  v,
}: {
  l: string;
  v: string;
}) {
  return (
    <View>
      <Text style={s.label}>{l}</Text>

      <Text style={s.value}>{v}</Text>
    </View>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const s = StyleSheet.create({
  page: {
    padding: spacing.xl,
  },

  wrap: {
    maxWidth: 1050,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },

  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },

  headText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: colors.textPrimary,
  },

  sub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },

  msg: {
    padding: 10,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    borderRadius: radius.md,
    fontWeight: "700",
  },

  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    gap: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.textPrimary,
  },

  formStack: {
    gap: 10,
  },

  label: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.textMuted,
    textTransform: "uppercase",
  },

  value: {
    marginTop: 2,
    color: colors.textPrimary,
  },

  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },

  itemTitle: {
    fontWeight: "900",
    color: colors.textPrimary,
  },

  recommend: {
    color: colors.primary,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },

  link: {
    color: colors.primary,
    fontWeight: "800",
  },

  // =========================================================
  // SCHEDULE MODAL
  // =========================================================

  scheduleDialog: {
    width: "92%",
    maxWidth: 720,
    alignSelf: "center",
    borderRadius: 24,
    backgroundColor: colors.white,
  },

  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 8,
  },

  scheduleHeaderIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  scheduleHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  scheduleTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
  },

  scheduleDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },

  scheduleContent: {
    paddingTop: 14,
    gap: 14,
  },

  scheduleSection: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  scheduleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  scheduleNumber: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  scheduleNumberText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  scheduleSectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  scheduleSectionSub: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11,
  },

  nativePickerRow: {
    flexDirection: "row",
    gap: 10,
  },

  webPickerRow: {
    flexDirection: "row",
    gap: 12,
  },

  mobilePickerRow: {
    flexDirection: "column",
  },

  pickerButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  pickerButtonIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  pickerButtonText: {
    flex: 1,
    minWidth: 0,
  },

  pickerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  pickerValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },

  webPickerField: {
    flex: 1,
    minWidth: 0,
  },

  webPickerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  webPickerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  scheduleSummary: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  scheduleSummaryText: {
    flex: 1,
    minWidth: 0,
  },

  scheduleSummaryTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  scheduleSummaryValue: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  nativePickerContainer: {
    gap: 10,
    paddingTop: 4,
  },

  scheduleActions: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  mobileScheduleActions: {
    flexDirection: "column-reverse",
    alignItems: "stretch",
  },

  mobileScheduleButton: {
    width: "100%",
  },
});