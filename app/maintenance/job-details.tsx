import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
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
    Menu,
    Snackbar,
    TextInput,
} from "react-native-paper";
import Animated, {
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
    typography,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type JobStatus =
  | "New"
  | "Accepted"
  | "Scheduled"
  | "In progress"
  | "Completed";

type JobPriority = "Urgent" | "High" | "Normal";

type MaintenanceJob = {
  id: string;
  title: string;
  category: string;
  property: string;
  postcode: string;
  tenant: string;
  phone: string;
  email: string;
  landlord: string;
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

const jobs: MaintenanceJob[] = [
  {
    id: "JOB-1048",
    title: "Kitchen sink leaking",
    category: "Plumbing",
    property: "18 Meadow Lane, Leeds",
    postcode: "LS10 2AB",
    tenant: "Olivia Bennett",
    phone: "07123 456789",
    email: "olivia.bennett@example.com",
    landlord: "Sarah Thompson",
    reportedDate: "29 July 2026",
    appointmentDate: "30 July 2026",
    appointmentTime: "10:30 AM",
    priority: "Urgent",
    status: "New",
    icon: "water-pump",
    description:
      "Water is leaking underneath the kitchen sink and collecting inside the cabinet. The tenant has turned off the local water valve but requires an urgent inspection.",
    accessInstructions:
      "Tenant will be present. Ring apartment 4B using the main entrance intercom.",
    reportedBy: "Olivia Bennett",
  },
  {
    id: "JOB-1045",
    title: "Boiler pressure issue",
    category: "Heating",
    property: "42 Green Road, Leeds",
    postcode: "LS8 4QA",
    tenant: "Daniel Hughes",
    phone: "07234 567890",
    email: "daniel.hughes@example.com",
    landlord: "Michael Carter",
    reportedDate: "28 July 2026",
    appointmentDate: "30 July 2026",
    appointmentTime: "2:00 PM",
    priority: "High",
    status: "Scheduled",
    icon: "water-boiler",
    description:
      "The boiler pressure continues to fall below the recommended level. The tenant currently has limited heating and hot water.",
    accessInstructions:
      "Tenant will provide access. Boiler is located inside the kitchen utility cupboard.",
    reportedBy: "Daniel Hughes",
  },
  {
    id: "JOB-1041",
    title: "Bedroom light not working",
    category: "Electrical",
    property: "7 Park View, Bradford",
    postcode: "BD3 7LP",
    tenant: "Amelia Taylor",
    phone: "07345 678901",
    email: "amelia.taylor@example.com",
    landlord: "Northside Lettings",
    reportedDate: "27 July 2026",
    appointmentDate: "31 July 2026",
    appointmentTime: "9:00 AM",
    priority: "Normal",
    status: "Accepted",
    icon: "lightbulb-outline",
    description:
      "The main bedroom ceiling light does not switch on. The tenant has already replaced the bulb.",
    accessInstructions:
      "Use the side entrance. Tenant will be working from home.",
    reportedBy: "Amelia Taylor",
  },
  {
    id: "JOB-1038",
    title: "Bathroom extractor fan",
    category: "Ventilation",
    property: "51 Station Road, Leeds",
    postcode: "LS12 5TR",
    tenant: "Noah Wilson",
    phone: "07456 789012",
    email: "noah.wilson@example.com",
    landlord: "Oakfield Property Group",
    reportedDate: "26 July 2026",
    appointmentDate: "31 July 2026",
    appointmentTime: "1:30 PM",
    priority: "Normal",
    status: "In progress",
    icon: "fan",
    description:
      "The bathroom extractor fan is making a loud noise and is no longer removing moisture effectively.",
    accessInstructions:
      "Collect property keys from Oakfield Property Group before the appointment.",
    reportedBy: "Noah Wilson",
  },
];

const statusOptions: JobStatus[] = [
  "New",
  "Accepted",
  "Scheduled",
  "In progress",
  "Completed",
];

export default function JobDetailsScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    jobId?: string | string[];
  }>();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const requestedJobId = Array.isArray(params.jobId)
    ? params.jobId[0]
    : params.jobId;

  const selectedJob = useMemo(() => {
    return (
      jobs.find((job) => job.id === requestedJobId) ??
      jobs[0]
    );
  }, [requestedJobId]);

  const [status, setStatus] = useState<JobStatus>(
    selectedJob.status
  );
  const [statusMenuVisible, setStatusMenuVisible] =
    useState(false);
  const [providerNotes, setProviderNotes] =
    useState("");
  const [appointmentDate, setAppointmentDate] =
    useState(selectedJob.appointmentDate);
  const [appointmentTime, setAppointmentTime] =
    useState(selectedJob.appointmentTime);
  const [loading, setLoading] = useState(false);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSaveUpdate = () => {
    if (!appointmentDate.trim()) {
      showMessage("Please enter an appointment date.");
      return;
    }

    if (!appointmentTime.trim()) {
      showMessage("Please enter an appointment time.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      showMessage("Job update saved successfully.");
    }, 700);
  };

  const handleAcceptJob = () => {
    setStatus("Accepted");
    showMessage("The maintenance job has been accepted.");
  };

  const handleCompleteJob = () => {
    setStatus("Completed");
    showMessage("The job has been marked as completed.");
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <Animated.View
          entering={FadeInUp.duration(450)}
          style={styles.header}
        >
          <Pressable
            style={styles.brandRow}
            onPress={() =>
              router.replace(
                "/maintenance/dashboard" as never
              )
            }
          >
            <View style={styles.brandLogo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TENUREEX
              </Text>

              <Text style={styles.brandSubtitle}>
                Maintenance Provider
              </Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerIconButton}
              onPress={() =>
                router.push(
                  "/maintenance/messages" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={21}
                color={colors.textPrimary}
              />
            </Pressable>

            <Pressable
              style={styles.profileButton}
              onPress={() =>
                router.push(
                  "/maintenance/settings" as never
                )
              }
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  MP
                </Text>
              </View>

              {isTablet ? (
                <View>
                  <Text style={styles.profileName}>
                    Martin Plumbing
                  </Text>

                  <Text style={styles.profileRole}>
                    Provider account
                  </Text>
                </View>
              ) : null}

              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(450)}
          style={styles.backRow}
        >
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.replace(
                "/maintenance/assigned-jobs" as never
              )
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={colors.primary}
            />

            <Text style={styles.backText}>
              Assigned jobs
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(450)}
          style={[
            styles.jobHeading,
            isDesktop && styles.desktopJobHeading,
          ]}
        >
          <View style={styles.jobHeadingMain}>
            <View style={styles.jobLargeIcon}>
              <MaterialCommunityIcons
                name={selectedJob.icon}
                size={34}
                color={colors.primary}
              />
            </View>

            <View style={styles.headingText}>
              <View style={styles.headingBadges}>
                <StatusBadge status={status} />

                <PriorityBadge
                  priority={selectedJob.priority}
                />
              </View>

              <Text
                style={[
                  styles.pageTitle,
                  isSmallPhone && styles.smallPageTitle,
                ]}
              >
                {selectedJob.title}
              </Text>

              <Text style={styles.jobReference}>
                {selectedJob.id} ·{" "}
                {selectedJob.category}
              </Text>
            </View>
          </View>

          <View style={styles.headingActions}>
            {status === "New" ? (
              <Button
                mode="contained"
                icon="check"
                onPress={handleAcceptJob}
                buttonColor={colors.primary}
                style={styles.actionButton}
              >
                Accept job
              </Button>
            ) : null}

            {status !== "Completed" ? (
              <Button
                mode="outlined"
                icon="check-circle-outline"
                onPress={handleCompleteJob}
                textColor={colors.primary}
                style={styles.completeButton}
              >
                Mark completed
              </Button>
            ) : null}
          </View>
        </Animated.View>

        <View
          style={[
            styles.contentGrid,
            isDesktop && styles.desktopContentGrid,
          ]}
        >
          <View style={styles.mainColumn}>
            <Animated.View
              entering={FadeInDown.delay(170).duration(450)}
              style={styles.card}
            >
              <SectionHeader
                icon="clipboard-text-outline"
                title="Job information"
                description="Maintenance request and property details"
              />

              <Divider style={styles.divider} />

              <Text style={styles.sectionLabel}>
                ISSUE DESCRIPTION
              </Text>

              <Text style={styles.descriptionText}>
                {selectedJob.description}
              </Text>

              <View
                style={[
                  styles.informationGrid,
                  isTablet &&
                    styles.tabletInformationGrid,
                ]}
              >
                <InformationItem
                  icon="map-marker-outline"
                  label="Property"
                  value={`${selectedJob.property}, ${selectedJob.postcode}`}
                />

                <InformationItem
                  icon="calendar-outline"
                  label="Reported date"
                  value={selectedJob.reportedDate}
                />

                <InformationItem
                  icon="account-outline"
                  label="Reported by"
                  value={selectedJob.reportedBy}
                />

                <InformationItem
                  icon="office-building-outline"
                  label="Landlord / agent"
                  value={selectedJob.landlord}
                />
              </View>

              <View style={styles.accessNotice}>
                <MaterialCommunityIcons
                  name="key-outline"
                  size={21}
                  color={colors.primary}
                />

                <View style={styles.flex}>
                  <Text style={styles.accessTitle}>
                    Access instructions
                  </Text>

                  <Text style={styles.accessDescription}>
                    {selectedJob.accessInstructions}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(220).duration(450)}
              style={styles.card}
            >
              <SectionHeader
                icon="calendar-clock-outline"
                title="Appointment and progress"
                description="Update the visit schedule and current job status"
              />

              <Divider style={styles.divider} />

              <View
                style={[
                  styles.formRow,
                  !isTablet && styles.mobileFormRow,
                ]}
              >
                <TextInput
                  mode="outlined"
                  label="Appointment date"
                  value={appointmentDate}
                  onChangeText={setAppointmentDate}
                  left={
                    <TextInput.Icon
                      icon="calendar-outline"
                    />
                  }
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={[
                    styles.input,
                    styles.rowInput,
                  ]}
                />

                <TextInput
                  mode="outlined"
                  label="Appointment time"
                  value={appointmentTime}
                  onChangeText={setAppointmentTime}
                  left={
                    <TextInput.Icon
                      icon="clock-outline"
                    />
                  }
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  style={[
                    styles.input,
                    styles.rowInput,
                  ]}
                />
              </View>

              <Text style={styles.inputLabel}>
                Job status
              </Text>

              <Menu
                visible={statusMenuVisible}
                onDismiss={() =>
                  setStatusMenuVisible(false)
                }
                anchor={
                  <Pressable
                    style={styles.statusSelector}
                    onPress={() =>
                      setStatusMenuVisible(true)
                    }
                  >
                    <View style={styles.statusSelectorLeft}>
                      <MaterialCommunityIcons
                        name="progress-wrench"
                        size={20}
                        color={colors.primary}
                      />

                      <Text
                        style={
                          styles.statusSelectorText
                        }
                      >
                        {status}
                      </Text>
                    </View>

                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                }
              >
                {statusOptions.map((option) => (
                  <Menu.Item
                    key={option}
                    title={option}
                    leadingIcon={
                      option === status
                        ? "check-circle-outline"
                        : "circle-outline"
                    }
                    onPress={() => {
                      setStatus(option);
                      setStatusMenuVisible(false);
                    }}
                  />
                ))}
              </Menu>

              <TextInput
                mode="outlined"
                label="Provider notes"
                placeholder="Add inspection notes, required parts or progress information"
                value={providerNotes}
                onChangeText={setProviderNotes}
                multiline
                numberOfLines={5}
                left={
                  <TextInput.Icon
                    icon="note-text-outline"
                  />
                }
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={[
                  styles.input,
                  styles.notesInput,
                ]}
              />

              <View style={styles.formActions}>
                <Button
                  mode="outlined"
                  icon="camera-outline"
                  onPress={() =>
                    showMessage(
                      "Photo upload will be connected when backend storage is added."
                    )
                  }
                  textColor={colors.primary}
                  style={styles.photoButton}
                >
                  Add evidence
                </Button>

                <Button
                  mode="contained"
                  icon="content-save-outline"
                  loading={loading}
                  disabled={loading}
                  onPress={handleSaveUpdate}
                  buttonColor={colors.primary}
                  style={styles.saveButton}
                >
                  Save update
                </Button>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(270).duration(450)}
              style={styles.card}
            >
              <SectionHeader
                icon="timeline-outline"
                title="Activity timeline"
                description="Recent events connected to this maintenance job"
              />

              <Divider style={styles.divider} />

              <View style={styles.timeline}>
                <TimelineItem
                  icon="clipboard-plus-outline"
                  title="Maintenance request submitted"
                  description={`Reported by ${selectedJob.reportedBy}`}
                  date={selectedJob.reportedDate}
                  active
                />

                <TimelineItem
                  icon="account-arrow-right-outline"
                  title="Job assigned to provider"
                  description="Assigned to Martin Plumbing"
                  date="29 July 2026"
                />

                {status !== "New" ? (
                  <TimelineItem
                    icon="check-circle-outline"
                    title="Job accepted"
                    description="The provider accepted this maintenance request"
                    date="30 July 2026"
                  />
                ) : null}

                {status === "Scheduled" ||
                status === "In progress" ||
                status === "Completed" ? (
                  <TimelineItem
                    icon="calendar-check-outline"
                    title="Appointment scheduled"
                    description={`${appointmentDate} at ${appointmentTime}`}
                    date="30 July 2026"
                  />
                ) : null}

                {status === "Completed" ? (
                  <TimelineItem
                    icon="check-decagram-outline"
                    title="Job completed"
                    description="The provider marked this maintenance work as completed"
                    date="30 July 2026"
                  />
                ) : null}
              </View>
            </Animated.View>
          </View>

          <View style={styles.sideColumn}>
            <Animated.View
              entering={FadeInDown.delay(190).duration(450)}
              style={styles.sideCard}
            >
              <SectionHeader
                icon="account-outline"
                title="Tenant contact"
                description="Contact details for the property visit"
              />

              <Divider style={styles.divider} />

              <View style={styles.tenantProfile}>
                <View style={styles.tenantAvatar}>
                  <Text style={styles.tenantAvatarText}>
                    {selectedJob.tenant
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.tenantName}>
                    {selectedJob.tenant}
                  </Text>

                  <Text style={styles.tenantRole}>
                    Current tenant
                  </Text>
                </View>
              </View>

              <ContactItem
                icon="phone-outline"
                label="Phone"
                value={selectedJob.phone}
              />

              <ContactItem
                icon="email-outline"
                label="Email"
                value={selectedJob.email}
              />

              <Button
                mode="contained"
                icon="message-text-outline"
                onPress={() =>
                  router.push(
                    "/maintenance/messages" as never
                  )
                }
                buttonColor={colors.primary}
                style={styles.messageButton}
              >
                Message tenant
              </Button>

              <Button
                mode="outlined"
                icon="phone-outline"
                onPress={() =>
                  showMessage(
                    `Call ${selectedJob.phone}`
                  )
                }
                textColor={colors.primary}
                style={styles.callButton}
              >
                Call tenant
              </Button>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(240).duration(450)}
              style={styles.sideCard}
            >
              <SectionHeader
                icon="map-marker-outline"
                title="Property visit"
                description="Location and appointment information"
              />

              <Divider style={styles.divider} />

              <View style={styles.propertyMap}>
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={42}
                  color={colors.primary}
                />

                <Text style={styles.propertyAddress}>
                  {selectedJob.property}
                </Text>

                <Text style={styles.propertyPostcode}>
                  {selectedJob.postcode}
                </Text>
              </View>

              <View style={styles.appointmentCard}>
                <MaterialCommunityIcons
                  name="calendar-clock-outline"
                  size={22}
                  color={colors.primary}
                />

                <View style={styles.flex}>
                  <Text style={styles.appointmentLabel}>
                    Scheduled visit
                  </Text>

                  <Text style={styles.appointmentValue}>
                    {appointmentDate}
                  </Text>

                  <Text style={styles.appointmentTime}>
                    {appointmentTime}
                  </Text>
                </View>
              </View>

              <Button
                mode="outlined"
                icon="map-outline"
                onPress={() =>
                  showMessage(
                    "Map navigation will open when device maps are connected."
                  )
                }
                textColor={colors.primary}
                style={styles.navigationButton}
              >
                Open directions
              </Button>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(290).duration(450)}
              style={styles.sideCard}
            >
              <SectionHeader
                icon="shield-check-outline"
                title="Safety reminder"
                description="Before attending the maintenance visit"
              />

              <Divider style={styles.divider} />

              <SafetyItem text="Confirm the appointment with the tenant." />

              <SafetyItem text="Carry suitable identification and equipment." />

              <SafetyItem text="Record photos before and after completing work." />

              <SafetyItem text="Report any additional property risks." />
            </Animated.View>
          </View>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3200}
        action={{
          label: "Close",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScreenContainer>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.flex}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionDescription}>
          {description}
        </Text>
      </View>
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
          size={19}
          color={colors.primary}
        />
      </View>

      <View style={styles.flex}>
        <Text style={styles.informationLabel}>
          {label}
        </Text>

        <Text style={styles.informationValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ContactItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.contactItem}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={colors.textMuted}
      />

      <View style={styles.flex}>
        <Text style={styles.contactLabel}>
          {label}
        </Text>

        <Text style={styles.contactValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function TimelineItem({
  icon,
  title,
  description,
  date,
  active = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  date: string;
  active?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIndicator}>
        <View
          style={[
            styles.timelineIcon,
            active && styles.activeTimelineIcon,
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={
              active
                ? colors.white
                : colors.primary
            }
          />
        </View>

        <View style={styles.timelineLine} />
      </View>

      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>
          {title}
        </Text>

        <Text style={styles.timelineDescription}>
          {description}
        </Text>

        <Text style={styles.timelineDate}>
          {date}
        </Text>
      </View>
    </View>
  );
}

function SafetyItem({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.safetyItem}>
      <View style={styles.safetyCheck}>
        <MaterialCommunityIcons
          name="check"
          size={14}
          color={colors.primary}
        />
      </View>

      <Text style={styles.safetyText}>
        {text}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: JobStatus;
}) {
  const backgroundColor =
    status === "New"
      ? "#E8F1FF"
      : status === "Scheduled"
        ? "#F1EAFF"
        : status === "In progress"
          ? "#FFF2D5"
          : status === "Completed"
            ? "#E8F7EE"
            : "#E9F7EF";

  const textColor =
    status === "New"
      ? "#245AA6"
      : status === "Scheduled"
        ? "#6540AC"
        : status === "In progress"
          ? "#8B5D00"
          : "#277A46";

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          {
            color: textColor,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: JobPriority;
}) {
  const backgroundColor =
    priority === "Urgent"
      ? "#FDECEC"
      : priority === "High"
        ? "#FFF2D5"
        : colors.background;

  const textColor =
    priority === "Urgent"
      ? "#B42318"
      : priority === "High"
        ? "#8B5D00"
        : colors.textSecondary;

  return (
    <View
      style={[
        styles.priorityBadge,
        {
          backgroundColor,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={
          priority === "Urgent"
            ? "alert-circle-outline"
            : priority === "High"
              ? "alert-outline"
              : "information-outline"
        }
        size={14}
        color={textColor}
      />

      <Text
        style={[
          styles.priorityBadgeText,
          {
            color: textColor,
          },
        ]}
      >
        {priority} priority
      </Text>
    </View>
  );
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