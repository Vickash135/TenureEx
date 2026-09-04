import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Divider,
  Snackbar,
  TextInput,
} from "react-native-paper";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { api } from "../../src/api/client";
import ScreenContainer from "../../src/components/ScreenContainer";
import WorkflowNotifications from "../../src/components/WorkflowNotifications";
import { colors, radius, spacing, typography } from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
type JobStatus = "New" | "Scheduled" | "In progress" | "Awaiting tenant confirmation" | "Completed";
type JobPriority = "Urgent" | "High" | "Normal";

type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  userType: string;
  status: string;
};

type MaintenanceJob = {
  id: string;
  title: string;
  category: string;
  property: string;
  postcode: string;
  tenant: string;
  phone: string;
  email: string;
  reportedDate: string;
  appointmentDate: string;
  appointmentTime: string;
  priority: JobPriority;
  status: JobStatus;
  icon: IconName;
  description: string;
  accessInstructions: string;
  reportedBy: string;
};

const maintenanceRoleConfig = { _tenureExRole: "maintenance" } as any;

function safeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null) {
  const date = safeDate(value);
  return date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "Not available";
}

function formatDateTime(value?: string | null) {
  const date = safeDate(value);
  return date
    ? date.toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Not available";
}

function toStatus(value: string): JobStatus {
  if (value === "COMPLETED") return "Completed";
  if (value === "IN_PROGRESS") return "In progress";
  if (value === "SCHEDULED") return "Scheduled";
  if (value === "AWAITING_TENANT_CONFIRMATION") return "Awaiting tenant confirmation";
  return "New";
}

function categoryIcon(category?: string): IconName {
  const value = String(category || "").toLowerCase();
  if (value.includes("plumb") || value.includes("water")) return "water-pump";
  if (value.includes("heat") || value.includes("boiler")) return "water-boiler";
  if (value.includes("electric") || value.includes("light")) return "lightbulb-outline";
  if (value.includes("security") || value.includes("lock")) return "lock-outline";
  if (value.includes("vent") || value.includes("fan")) return "fan";
  return "tools";
}

export default function JobDetailsScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ jobId?: string | string[]; id?: string | string[] }>();
  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const requestedJobId = useMemo(() => {
    const raw = params.jobId ?? params.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.id, params.jobId]);

  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [rawJob, setRawJob] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [providerNotes, setProviderNotes] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const mapJob = (row: any): MaintenanceJob => {
    const scheduled = safeDate(row.scheduledStart);
    const tenantName = [row.tenant?.firstName, row.tenant?.lastName].filter(Boolean).join(" ") || "Tenant";
    return {
      id: row.id,
      title: row.title || "Maintenance job",
      category: row.category || "Maintenance",
      property: [row.property?.addressLine1, row.property?.addressLine2, row.property?.townCity]
        .filter(Boolean)
        .join(", ") || "Property details unavailable",
      postcode: row.property?.postcode || "",
      tenant: tenantName,
      phone: row.tenant?.phone || "Not provided",
      email: row.tenant?.email || "Not provided",
      reportedDate: formatDate(row.createdAt),
      appointmentDate: scheduled ? scheduled.toLocaleDateString("en-GB") : "Not scheduled",
      appointmentTime: scheduled
        ? scheduled.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : "Awaiting tenant/provider selection",
      priority: row.priority === "EMERGENCY" ? "Urgent" : row.priority === "HIGH" ? "High" : "Normal",
      status: toStatus(row.status),
      icon: categoryIcon(row.category),
      description: row.description || "No description provided.",
      accessInstructions: row.accessPermission
        ? "Tenant has provided property access permission for the agreed visit."
        : "Access permission has not been recorded. Confirm access with the tenant before attending.",
      reportedBy: tenantName,
    };
  };

  const loadJob = async () => {
    if (!requestedJobId) {
      setLoadError("No maintenance request ID was provided.");
      setLoadingPage(false);
      return;
    }

    setLoadingPage(true);
    setLoadError("");
    try {
      const [meResponse, jobResponse] = await Promise.all([
        api.get("/auth/me", maintenanceRoleConfig),
        api.get(`/property-workflows/maintenance-requests/${requestedJobId}`, maintenanceRoleConfig),
      ]);
      setCurrentUser(meResponse.data as CurrentUser);
      setRawJob(jobResponse.data);
      setSelectedJob(mapJob(jobResponse.data));
      setProviderNotes(jobResponse.data?.providerNotes || jobResponse.data?.completionNotes || "");
    } catch (error: any) {
      const message = error?.response?.data?.message;
      setLoadError(Array.isArray(message) ? message.join(", ") : message || "Unable to load this maintenance job.");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    void loadJob();
  }, [requestedJobId]);

  const providerName = currentUser
    ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") || currentUser.email
    : "Maintenance Provider";
  const providerInitials = currentUser
    ? `${currentUser.firstName?.charAt(0) || ""}${currentUser.lastName?.charAt(0) || ""}`.toUpperCase() || "MP"
    : "MP";

  const tenantSlots = (rawJob?.slots || []).filter((slot: any) => slot.proposedBy === "TENANT");
  const beforePhotos = (rawJob?.photos || []).filter((photo: any) => photo.phase === "BEFORE");
  const afterPhotos = (rawJob?.photos || []).filter((photo: any) => photo.phase === "AFTER");

  const handleAcceptSlot = async (slotId: string) => {
    if (!rawJob) return;
    setLoadingAction(true);
    try {
      await api.post(`/property-workflows/maintenance-requests/${rawJob.id}/accept-slot`, { slotId }, maintenanceRoleConfig);
      showMessage("Visit time selected. The tenant has been notified.");
      await loadJob();
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "Unable to select this time slot.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStartWork = async () => {
    if (!rawJob) return;
    if (rawJob.status !== "SCHEDULED") {
      showMessage("This job must be scheduled before work can start.");
      return;
    }
    setLoadingAction(true);
    try {
      await api.patch(
        `/property-workflows/maintenance-requests/${rawJob.id}/start`,
        { providerNotes: providerNotes.trim() || undefined },
        maintenanceRoleConfig,
      );
      showMessage("Job started and provider notes saved.");
      await loadJob();
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "Unable to start this job.");
    } finally {
      setLoadingAction(false);
    }
  };

  const uploadEvidence = async (phase: "before" | "after") => {
    if (!rawJob) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const data = new FormData();
    result.assets.forEach((asset: any, index) => {
      data.append("photos", {
        uri: asset.uri,
        name: asset.fileName || `${phase}-${index + 1}.jpg`,
        type: asset.mimeType || "image/jpeg",
      } as any);
    });

    setLoadingAction(true);
    try {
      await api.post(
        `/property-workflows/maintenance-requests/${rawJob.id}/${phase}-photos`,
        data,
        { ...maintenanceRoleConfig, headers: { "Content-Type": "multipart/form-data" } },
      );
      showMessage(`${phase === "before" ? "Before" : "After"} photos uploaded successfully.`);
      await loadJob();
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "Unable to upload photos.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFinishWork = async () => {
    if (!rawJob) return;
    if (rawJob.status !== "IN_PROGRESS") {
      showMessage("Start the scheduled job before finishing it.");
      return;
    }
    setLoadingAction(true);
    try {
      await api.patch(
        `/property-workflows/maintenance-requests/${rawJob.id}/finish`,
        { completionNotes: providerNotes.trim() || undefined },
        maintenanceRoleConfig,
      );
      showMessage("Work sent to the tenant for confirmation.");
      await loadJob();
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "Unable to finish this job.");
    } finally {
      setLoadingAction(false);
    }
  };

  const openPhone = async () => {
    if (!rawJob?.tenant?.phone) {
      showMessage("The tenant has not provided a phone number.");
      return;
    }
    try {
      await Linking.openURL(`tel:${rawJob.tenant.phone}`);
    } catch {
      showMessage("This device could not open the phone dialler.");
    }
  };

  const openDirections = async () => {
    if (!selectedJob) return;
    const address = [selectedJob.property, selectedJob.postcode].filter(Boolean).join(", ");
    if (!address) {
      showMessage("Property address is unavailable.");
      return;
    }
    try {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
    } catch {
      showMessage("Unable to open map directions on this device.");
    }
  };

  if (loadingPage) {
    return (
      <ScreenContainer contentStyle={[styles.screenContent, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>Loading maintenance job…</Text>
      </ScreenContainer>
    );
  }

  if (loadError || !selectedJob || !rawJob) {
    return (
      <ScreenContainer contentStyle={[styles.screenContent, { justifyContent: "center", alignItems: "center", padding: spacing.xl }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={44} color={colors.error} />
        <Text style={{ marginTop: spacing.md, color: colors.textPrimary, fontWeight: "900", fontSize: 18 }}>Unable to open job</Text>
        <Text style={{ marginTop: spacing.sm, color: colors.textSecondary, textAlign: "center" }}>{loadError || "Maintenance request was not found."}</Text>
        <Button mode="contained" onPress={() => router.replace("/maintenance/assigned-jobs" as never)} style={{ marginTop: spacing.lg }}>Back to assigned jobs</Button>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.screenContent}>
      <View style={styles.page}>
        <Animated.View entering={FadeInUp.duration(450)} style={styles.header}>
          <Pressable style={styles.brandRow} onPress={() => router.replace("/maintenance/dashboard" as never)}>
            <View style={styles.brandLogo}><MaterialCommunityIcons name="home-city-outline" size={27} color={colors.white} /></View>
            <View><Text style={styles.brandName}>TENUREEX</Text><Text style={styles.brandSubtitle}>Maintenance Provider</Text></View>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconButton} onPress={() => router.push("/maintenance/messages" as never)}>
              <MaterialCommunityIcons name="message-text-outline" size={21} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.profileButton} onPress={() => router.push("/maintenance/settings" as never)}>
              <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{providerInitials}</Text></View>
              {isTablet ? <View><Text style={styles.profileName}>{providerName}</Text><Text style={styles.profileRole}>Provider account</Text></View> : null}
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.backRow}>
          <Pressable style={styles.backButton} onPress={() => router.replace("/maintenance/assigned-jobs" as never)}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.primary} />
            <Text style={styles.backText}>Assigned jobs</Text>
          </Pressable>
        </Animated.View>

        <WorkflowNotifications compact title="Job updates" limit={4} />

        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={[styles.jobHeading, isDesktop && styles.desktopJobHeading]}>
          <View style={styles.jobHeadingMain}>
            <View style={styles.jobLargeIcon}><MaterialCommunityIcons name={selectedJob.icon} size={34} color={colors.primary} /></View>
            <View style={styles.headingText}>
              <View style={styles.headingBadges}><StatusBadge status={selectedJob.status} /><PriorityBadge priority={selectedJob.priority} /></View>
              <Text style={[styles.pageTitle, isSmallPhone && styles.smallPageTitle]}>{selectedJob.title}</Text>
              <Text style={styles.jobReference}>{selectedJob.id} · {selectedJob.category}</Text>
            </View>
          </View>

          <View style={styles.headingActions}>
            {rawJob.status === "SCHEDULED" ? (
              <Button mode="contained" icon="play-outline" loading={loadingAction} disabled={loadingAction} onPress={() => void handleStartWork()} buttonColor={colors.primary} style={styles.actionButton}>Start work</Button>
            ) : null}
            {rawJob.status === "IN_PROGRESS" ? (
              <Button mode="outlined" icon="check-circle-outline" loading={loadingAction} disabled={loadingAction} onPress={() => void handleFinishWork()} textColor={colors.primary} style={styles.completeButton}>Finish work</Button>
            ) : null}
          </View>
        </Animated.View>

        <View style={[styles.contentGrid, isDesktop && styles.desktopContentGrid]}>
          <View style={styles.mainColumn}>
            <Animated.View entering={FadeInDown.delay(170).duration(450)} style={styles.card}>
              <SectionHeader icon="clipboard-text-outline" title="Job information" description="Maintenance request and property details" />
              <Divider style={styles.divider} />
              <Text style={styles.sectionLabel}>ISSUE DESCRIPTION</Text>
              <Text style={styles.descriptionText}>{selectedJob.description}</Text>
              <View style={[styles.informationGrid, isTablet && styles.tabletInformationGrid]}>
                <InformationItem icon="map-marker-outline" label="Property" value={[selectedJob.property, selectedJob.postcode].filter(Boolean).join(", ")} />
                <InformationItem icon="calendar-outline" label="Reported date" value={selectedJob.reportedDate} />
                <InformationItem icon="account-outline" label="Reported by" value={selectedJob.reportedBy} />
                <InformationItem icon="office-building-outline" label="Management contact" value="Managed through TenureEx" />
              </View>
              <View style={styles.accessNotice}>
                <MaterialCommunityIcons name="key-outline" size={21} color={colors.primary} />
                <View style={styles.flex}><Text style={styles.accessTitle}>Access instructions</Text><Text style={styles.accessDescription}>{selectedJob.accessInstructions}</Text></View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(205).duration(450)} style={styles.card}>
              <SectionHeader icon="calendar-multiple-check" title="Tenant available times" description="Choose an available tenant visit window to accept and schedule the job" />
              <Divider style={styles.divider} />
              <View style={styles.slotList}>
                {tenantSlots.length === 0 ? (
                  <Text style={styles.emptySlotText}>No tenant availability slots are currently available.</Text>
                ) : tenantSlots.map((slot: any) => (
                  <View key={slot.id} style={styles.slotOption}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotDate}>{formatDateTime(slot.startAt)}</Text>
                      <Text style={styles.slotTime}>Until {formatDateTime(slot.endAt)} · {String(slot.status).replaceAll("_", " ")}</Text>
                    </View>
                    <Button
                      mode={slot.status === "SELECTED" ? "contained" : "outlined"}
                      disabled={loadingAction || !["OPEN", "REOPENED"].includes(rawJob.status) || slot.status !== "AVAILABLE"}
                      onPress={() => void handleAcceptSlot(slot.id)}
                    >
                      {slot.status === "SELECTED" ? "Selected" : "Choose time"}
                    </Button>
                  </View>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(220).duration(450)} style={styles.card}>
              <SectionHeader icon="calendar-clock-outline" title="Appointment and progress" description="Live schedule, status, provider notes and work evidence" />
              <Divider style={styles.divider} />
              <View style={[styles.formRow, !isTablet && styles.mobileFormRow]}>
                <TextInput mode="outlined" label="Appointment date" value={selectedJob.appointmentDate} editable={false} left={<TextInput.Icon icon="calendar-outline" />} outlineColor={colors.border} activeOutlineColor={colors.primary} style={[styles.input, styles.rowInput]} />
                <TextInput mode="outlined" label="Appointment time" value={selectedJob.appointmentTime} editable={false} left={<TextInput.Icon icon="clock-outline" />} outlineColor={colors.border} activeOutlineColor={colors.primary} style={[styles.input, styles.rowInput]} />
              </View>

              <Text style={styles.inputLabel}>Current job status</Text>
              <View style={styles.statusSelector}>
                <View style={styles.statusSelectorLeft}><MaterialCommunityIcons name="progress-wrench" size={20} color={colors.primary} /><Text style={styles.statusSelectorText}>{selectedJob.status}</Text></View>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} />
              </View>

              <TextInput
                mode="outlined"
                label={rawJob.status === "AWAITING_TENANT_CONFIRMATION" || rawJob.status === "COMPLETED" ? "Provider completion notes" : "Provider notes"}
                placeholder="Add inspection notes, required parts or progress information"
                value={providerNotes}
                onChangeText={setProviderNotes}
                editable={["SCHEDULED", "IN_PROGRESS"].includes(rawJob.status)}
                multiline
                numberOfLines={5}
                left={<TextInput.Icon icon="note-text-outline" />}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={[styles.input, styles.notesInput]}
              />

              <View style={styles.formActions}>
                <Button mode="outlined" icon="camera-outline" disabled={rawJob.status !== "IN_PROGRESS" || loadingAction} onPress={() => void uploadEvidence("before")} textColor={colors.primary} style={styles.photoButton}>Before photos ({beforePhotos.length})</Button>
                <Button mode="outlined" icon="camera-check-outline" disabled={rawJob.status !== "IN_PROGRESS" || loadingAction} onPress={() => void uploadEvidence("after")} textColor={colors.primary} style={styles.photoButton}>After photos ({afterPhotos.length})</Button>
                {rawJob.status === "SCHEDULED" ? <Button mode="contained" icon="play-outline" loading={loadingAction} disabled={loadingAction} onPress={() => void handleStartWork()} buttonColor={colors.primary} style={styles.saveButton}>Start work</Button> : null}
                {rawJob.status === "IN_PROGRESS" ? <Button mode="contained" icon="check-circle-outline" loading={loadingAction} disabled={loadingAction} onPress={() => void handleFinishWork()} buttonColor={colors.primary} style={styles.saveButton}>Finish work</Button> : null}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(270).duration(450)} style={styles.card}>
              <SectionHeader icon="timeline-outline" title="Activity timeline" description="Events backed by maintenance request timestamps" />
              <Divider style={styles.divider} />
              <View style={styles.timeline}>
                <TimelineItem icon="clipboard-plus-outline" title="Maintenance request submitted" description={`Reported by ${selectedJob.reportedBy}`} date={formatDateTime(rawJob.createdAt)} active />
                {rawJob.scheduledStart ? <TimelineItem icon="calendar-check-outline" title="Appointment scheduled" description={`${selectedJob.appointmentDate} at ${selectedJob.appointmentTime}`} date={formatDateTime(rawJob.scheduledStart)} /> : null}
                {rawJob.completedByProviderAt ? <TimelineItem icon="check-circle-outline" title="Provider finished work" description="Work was sent to the tenant for confirmation." date={formatDateTime(rawJob.completedByProviderAt)} /> : null}
                {rawJob.reopenedAt ? <TimelineItem icon="backup-restore" title="Job reopened" description={rawJob.tenantCompletionNote || "Tenant requested further work."} date={formatDateTime(rawJob.reopenedAt)} /> : null}
                {rawJob.tenantConfirmedAt ? <TimelineItem icon="check-decagram-outline" title="Tenant confirmed completion" description={rawJob.tenantCompletionNote || "The tenant confirmed that the work was completed."} date={formatDateTime(rawJob.tenantConfirmedAt)} /> : null}
              </View>
            </Animated.View>
          </View>

          <View style={styles.sideColumn}>
            <Animated.View entering={FadeInDown.delay(190).duration(450)} style={styles.sideCard}>
              <SectionHeader icon="account-outline" title="Tenant contact" description="Contact details returned by the maintenance API" />
              <Divider style={styles.divider} />
              <View style={styles.tenantProfile}>
                <View style={styles.tenantAvatar}><Text style={styles.tenantAvatarText}>{selectedJob.tenant.split(" ").map((name) => name[0]).join("").slice(0, 2).toUpperCase() || "T"}</Text></View>
                <View style={styles.flex}><Text style={styles.tenantName}>{selectedJob.tenant}</Text><Text style={styles.tenantRole}>Current tenant</Text></View>
              </View>
              <ContactItem icon="phone-outline" label="Phone" value={selectedJob.phone} />
              <ContactItem icon="email-outline" label="Email" value={selectedJob.email} />
              <Button mode="contained" icon="message-text-outline" onPress={() => router.push("/maintenance/messages" as never)} buttonColor={colors.primary} style={styles.messageButton}>Message tenant</Button>
              <Button mode="outlined" icon="phone-outline" onPress={() => void openPhone()} textColor={colors.primary} style={styles.callButton}>Call tenant</Button>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.sideCard}>
              <SectionHeader icon="map-marker-outline" title="Property visit" description="Location and confirmed appointment information" />
              <Divider style={styles.divider} />
              <View style={styles.propertyMap}>
                <MaterialCommunityIcons name="map-marker-radius-outline" size={42} color={colors.primary} />
                <Text style={styles.propertyAddress}>{selectedJob.property}</Text>
                <Text style={styles.propertyPostcode}>{selectedJob.postcode}</Text>
              </View>
              <View style={styles.appointmentCard}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={22} color={colors.primary} />
                <View style={styles.flex}><Text style={styles.appointmentLabel}>Scheduled visit</Text><Text style={styles.appointmentValue}>{selectedJob.appointmentDate}</Text><Text style={styles.appointmentTime}>{selectedJob.appointmentTime}</Text></View>
              </View>
              <Button mode="outlined" icon="map-outline" onPress={() => void openDirections()} textColor={colors.primary} style={styles.navigationButton}>Open directions</Button>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(290).duration(450)} style={styles.sideCard}>
              <SectionHeader icon="shield-check-outline" title="Safety reminder" description="Before attending the maintenance visit" />
              <Divider style={styles.divider} />
              <SafetyItem text="Confirm the appointment with the tenant." />
              <SafetyItem text="Carry suitable identification and equipment." />
              <SafetyItem text="Record photos before and after completing work." />
              <SafetyItem text="Report any additional property risks through TenureEx." />
            </Animated.View>
          </View>
        </View>
      </View>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3200} action={{ label: "Close", onPress: () => setSnackbarVisible(false) }}>
        {snackbarMessage}
      </Snackbar>
    </ScreenContainer>
  );
}

function SectionHeader({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return <View style={styles.sectionHeader}><View style={styles.sectionIcon}><MaterialCommunityIcons name={icon} size={21} color={colors.primary} /></View><View style={styles.flex}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionDescription}>{description}</Text></View></View>;
}
function InformationItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <View style={styles.informationItem}><View style={styles.informationIcon}><MaterialCommunityIcons name={icon} size={19} color={colors.primary} /></View><View style={styles.flex}><Text style={styles.informationLabel}>{label}</Text><Text style={styles.informationValue}>{value}</Text></View></View>;
}
function ContactItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <View style={styles.contactItem}><MaterialCommunityIcons name={icon} size={19} color={colors.textMuted} /><View style={styles.flex}><Text style={styles.contactLabel}>{label}</Text><Text style={styles.contactValue}>{value}</Text></View></View>;
}
function TimelineItem({ icon, title, description, date, active = false }: { icon: IconName; title: string; description: string; date: string; active?: boolean }) {
  return <View style={styles.timelineItem}><View style={styles.timelineIndicator}><View style={[styles.timelineIcon, active && styles.activeTimelineIcon]}><MaterialCommunityIcons name={icon} size={18} color={active ? colors.white : colors.primary} /></View><View style={styles.timelineLine} /></View><View style={styles.timelineContent}><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.timelineDescription}>{description}</Text><Text style={styles.timelineDate}>{date}</Text></View></View>;
}
function SafetyItem({ text }: { text: string }) {
  return <View style={styles.safetyItem}><View style={styles.safetyCheck}><MaterialCommunityIcons name="check" size={14} color={colors.primary} /></View><Text style={styles.safetyText}>{text}</Text></View>;
}
function StatusBadge({ status }: { status: JobStatus }) {
  const backgroundColor = status === "New" ? "#E8F1FF" : status === "Scheduled" ? "#F1EAFF" : status === "In progress" ? "#FFF2D5" : "#E8F7EE";
  const textColor = status === "New" ? "#245AA6" : status === "Scheduled" ? "#6540AC" : status === "In progress" ? "#8B5D00" : "#277A46";
  return <View style={[styles.statusBadge, { backgroundColor }]}><Text style={[styles.statusBadgeText, { color: textColor }]}>{status}</Text></View>;
}
function PriorityBadge({ priority }: { priority: JobPriority }) {
  const backgroundColor = priority === "Urgent" ? "#FDECEC" : priority === "High" ? "#FFF2D5" : colors.background;
  const textColor = priority === "Urgent" ? "#B42318" : priority === "High" ? "#8B5D00" : colors.textSecondary;
  return <View style={[styles.priorityBadge, { backgroundColor }]}><MaterialCommunityIcons name={priority === "Urgent" ? "alert-circle-outline" : priority === "High" ? "alert-outline" : "information-outline"} size={14} color={textColor} /><Text style={[styles.priorityBadgeText, { color: textColor }]}>{priority} priority</Text></View>;
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },

  flex: {
    flex: 1,
  },

  page: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingVertical: spacing.md,
  },

  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  brandLogo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.3,
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  profileButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },

  profileAvatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  profileAvatarText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
  },

  backRow: {
    marginTop: spacing.lg,
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  backText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  jobHeading: {
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  desktopJobHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  jobHeadingMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },

  jobLargeIcon: {
    width: 70,
    height: 70,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: colors.white,
  },

  headingText: {
    flex: 1,
  },

  headingBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  pageTitle: {
    ...typography.headingMedium,
    marginTop: spacing.md,
    color: colors.textPrimary,
  },

  smallPageTitle: {
    fontSize: 24,
    lineHeight: 30,
  },

  jobReference: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  headingActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  actionButton: {
    borderRadius: radius.md,
  },

  completeButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  priorityBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  contentGrid: {
    gap: spacing.xl,
  },

  desktopContentGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  mainColumn: {
    flex: 1.6,
    gap: spacing.xl,
  },

  sideColumn: {
    flex: 0.85,
    gap: spacing.xl,
  },

  slotList: { gap: spacing.md },
  slotOption: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft },
  slotDate: { color: colors.textPrimary, fontWeight: "900", fontSize: 12 },
  slotTime: { marginTop: 3, color: colors.textSecondary, fontSize: 10 },
  emptySlotText: { color: colors.textSecondary, paddingVertical: spacing.md },

  card: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 2,
  },

  sideCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  sectionIcon: {
    width: 43,
    height: 43,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  divider: {
    marginVertical: spacing.lg,
    backgroundColor: colors.border,
  },

  sectionLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  descriptionText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 18,
  },

  informationGrid: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  tabletInformationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  informationItem: {
    flex: 1,
    minWidth: 240,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  informationIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  informationLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  informationValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 9,
    lineHeight: 15,
    fontWeight: "700",
  },

  accessNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  accessTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  accessDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  mobileFormRow: {
    flexDirection: "column",
  },

  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  rowInput: {
    flex: 1,
  },

  inputLabel: {
    marginBottom: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  statusSelector: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.white,
  },

  statusSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  statusSelectorText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },

  notesInput: {
    minHeight: 130,
  },

  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },

  photoButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  saveButton: {
    borderRadius: radius.md,
  },

  tenantProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  tenantAvatar: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  tenantAvatarText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  tenantName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  tenantRole: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  contactLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  contactValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "700",
  },

  messageButton: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
  },

  callButton: {
    marginTop: spacing.sm,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  propertyMap: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  propertyAddress: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },

  propertyPostcode: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: "center",
  },

  appointmentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  appointmentLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  appointmentValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  appointmentTime: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "800",
  },

  navigationButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  safetyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  safetyCheck: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },

  safetyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  timeline: {
    gap: 0,
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
  },

  timelineIndicator: {
    alignItems: "center",
  },

  timelineIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  activeTimelineIcon: {
    backgroundColor: colors.primary,
  },

  timelineLine: {
    width: 2,
    minHeight: 42,
    flex: 1,
    backgroundColor: colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingBottom: spacing.xl,
  },

  timelineTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  timelineDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  timelineDate: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },
});