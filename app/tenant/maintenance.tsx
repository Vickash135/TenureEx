import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
    Chip,
    Menu,
    Snackbar,
    TextInput,
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, radius, spacing } from "../../src/theme";

type MaintenanceStatus =
  | "Open"
  | "In progress"
  | "Completed";

type MaintenancePriority =
  | "Low"
  | "Medium"
  | "High"
  | "Emergency";

type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
};

const initialRequests: MaintenanceRequest[] = [
  {
    id: "MNT-1001",
    title: "Kitchen tap leaking",
    category: "Plumbing",
    description:
      "The kitchen tap continues dripping after it is turned off.",
    priority: "Medium",
    status: "In progress",
    createdAt: "20 July 2026",
  },
  {
    id: "MNT-1002",
    title: "Bedroom light not working",
    category: "Electrical",
    description:
      "The main ceiling light in the bedroom is not switching on.",
    priority: "Low",
    status: "Completed",
    createdAt: "10 July 2026",
  },
];

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
  const [submitting, setSubmitting] =
    useState(false);

  const activeRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status !== "Completed",
      ).length,
    [requests],
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      setMessage("Enter a short issue title.");
      return;
    }

    if (!description.trim()) {
      setMessage("Describe the maintenance issue.");
      return;
    }

    setSubmitting(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 700),
      );

      const newRequest: MaintenanceRequest = {
        id: `MNT-${Date.now()}`,
        title: title.trim(),
        category,
        description: description.trim(),
        priority,
        status: "Open",
        createdAt: new Date().toLocaleDateString(
          "en-GB",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        ),
      };

      setRequests((current) => [
        newRequest,
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setCategory("Plumbing");
      setPriority("Medium");

      setMessage(
        "Maintenance request submitted successfully.",
      );
    } finally {
      setSubmitting(false);
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
                Property {propertyId ?? "PROP-001"}
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
                />
              ))}
            </View>
          </View>

          <View style={styles.sideColumn}>
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
}: {
  request: MaintenanceRequest;
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

      <Text style={styles.requestDate}>
        Submitted {request.createdAt}
      </Text>
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