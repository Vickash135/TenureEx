import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  Divider,
  Portal,
  TextInput,
} from "react-native-paper";

import { api } from "../api/client";
import { colors, radius } from "../theme";

type PortalType = "tenant" | "landlord" | "agent";

type Inspector = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;

  councilProfile?: {
    councilName: string;
    department?: string | null;
    jobTitle?: string | null;
  } | null;
};

type Property = {
  id: string;
  addressLine1: string;
  townCity: string;
  postcode: string;
  councilName?: string | null;
};

type CaseRow = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  scheduledStart?: string | null;
  property?: Property | null;
  inspector?: Inspector | null;
};

export default function CouncilInspectionHub({
  portal,
}: {
  portal: PortalType;
}) {
  const { width } = useWindowDimensions();

  const isMobile = width < 720;
  const isSmallMobile = width < 470;

  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [propertyId, setPropertyId] = useState("");

  const [inspectorId, setInspectorId] = useState("");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [category, setCategory] = useState(
    "Housing condition"
  );

  const [priority, setPriority] = useState("NORMAL");

  const [accessNotes, setAccessNotes] = useState("");

  // =========================================================
  // LOAD DATA
  // =========================================================

  const load = async () => {
    setLoading(true);

    try {
      const [directoryResponse, propertiesResponse, casesResponse] =
        await Promise.all([
          api.get("/council-inspections/directory"),
          api.get("/council-inspections/properties"),
          api.get("/council-inspections/cases"),
        ]);

      setInspectors(
        Array.isArray(directoryResponse.data)
          ? directoryResponse.data
          : []
      );

      setProperties(
        Array.isArray(propertiesResponse.data)
          ? propertiesResponse.data
          : []
      );

      setCases(
        Array.isArray(casesResponse.data)
          ? casesResponse.data
          : []
      );
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to load Council & Inspections."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return cases;
    }

    return cases.filter((item) =>
      `
        ${item.title}
        ${item.status}
        ${item.priority}
        ${item.category}
        ${item.property?.addressLine1 || ""}
        ${item.property?.postcode || ""}
        ${item.inspector?.firstName || ""}
        ${item.inspector?.lastName || ""}
      `
        .toLowerCase()
        .includes(query)
    );
  }, [cases, search]);

  const openCases = useMemo(
    () =>
      cases.filter(
        (item) =>
          !["CLOSED", "DECLINED"].includes(item.status)
      ).length,
    [cases]
  );

  // =========================================================
  // REQUEST INSPECTION
  // =========================================================

  const submit = async () => {
    if (
      !propertyId ||
      !inspectorId ||
      !title.trim() ||
      !description.trim()
    ) {
      setMessage(
        "Select a property and inspector, then enter the issue title and description."
      );

      return;
    }

    setLoading(true);

    try {
      await api.post("/council-inspections/cases", {
        propertyId,
        inspectorUserId: inspectorId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        accessNotes: accessNotes.trim(),
      });

      setOpen(false);

      setPropertyId("");
      setInspectorId("");
      setTitle("");
      setDescription("");
      setCategory("Housing condition");
      setPriority("NORMAL");
      setAccessNotes("");

      setMessage(
        "Inspection request sent to the Council Inspector."
      );

      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to create inspection request."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // BACK ROUTE
  // =========================================================

  const dashboardRoute =
    portal === "tenant"
      ? "/tenant/dashboard"
      : portal === "landlord"
        ? "/landlord/dashboard"
        : "/agent/dashboard";

  const portalLabel =
    portal === "tenant"
      ? "Tenant"
      : portal === "landlord"
        ? "Landlord"
        : "Estate Agent";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <View style={s.page}>
      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <Pressable
        onPress={() =>
          router.push(dashboardRoute as never)
        }
        style={s.backButton}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={18}
          color={colors.primary}
        />

        <Text style={s.backText}>
          Back to {portalLabel} dashboard
        </Text>
      </Pressable>

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <View
        style={[
          s.header,
          isMobile && s.headerMobile,
        ]}
      >
        <View style={s.headerLeft}>
          <View style={s.titleRow}>
            <View style={s.titleIcon}>
              <MaterialCommunityIcons
                name="clipboard-search-outline"
                size={25}
                color={colors.primary}
              />
            </View>

            <View style={s.titleTextContainer}>
              <Text style={s.title}>
                Council & Inspections
              </Text>

              <Text style={s.subtitle}>
                Request housing inspections and follow
                findings, required actions and case
                progress.
              </Text>
            </View>
          </View>
        </View>

        <Button
          mode="contained"
          icon="plus"
          onPress={() => {
            setMessage("");
            setOpen(true);
          }}
          style={[
            s.requestButton,
            isMobile && s.requestButtonMobile,
          ]}
          contentStyle={s.requestButtonContent}
        >
          Request inspection
        </Button>
      </View>

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message ? (
        <View style={s.messageBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={colors.primary}
          />

          <Text style={s.messageText}>
            {String(message)}
          </Text>

          <Pressable
            onPress={() => setMessage("")}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      ) : null}

      {/* =====================================================
          STATS
      ===================================================== */}

      <View
        style={[
          s.stats,
          isMobile && s.statsMobile,
        ]}
      >
        <Stat
          icon="clipboard-text-outline"
          label="My cases"
          description="Total inspection requests"
          value={cases.length}
          mobile={isSmallMobile}
        />

        <Stat
          icon="progress-clock"
          label="Open cases"
          description="Currently in progress"
          value={openCases}
          mobile={isSmallMobile}
        />

        <Stat
          icon="badge-account-outline"
          label="Inspectors"
          description="Approved and available"
          value={inspectors.length}
          mobile={isSmallMobile}
        />
      </View>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <View style={s.searchCard}>
        <TextInput
          mode="outlined"
          placeholder="Search by case, property, status or inspector..."
          value={search}
          onChangeText={setSearch}
          left={
            <TextInput.Icon icon="magnify" />
          }
          right={
            search ? (
              <TextInput.Icon
                icon="close"
                onPress={() => setSearch("")}
              />
            ) : undefined
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={s.searchInput}
        />
      </View>

      {/* =====================================================
          INSPECTION CASES
      ===================================================== */}

      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionTitle}>
            Inspection cases
          </Text>

          <Text style={s.sectionSubtitle}>
            View and follow your Council inspection
            requests.
          </Text>
        </View>

        <View style={s.countBadge}>
          <Text style={s.countBadgeText}>
            {filtered.length}
          </Text>
        </View>
      </View>

      <View style={s.caseList}>
        {loading && !cases.length ? (
          <EmptyState
            icon="loading"
            title="Loading inspections..."
            description="Your inspection cases are being loaded."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="clipboard-search-outline"
            title={
              search
                ? "No matching inspections"
                : "No inspection cases yet"
            }
            description={
              search
                ? "Try searching with a different case, property or inspector."
                : "When you request an inspection, it will appear here."
            }
          />
        ) : (
          filtered.map((item) => (
            <InspectionCard
              key={item.id}
              item={item}
              portal={portal}
              mobile={isMobile}
            />
          ))
        )}
      </View>

      {/* =====================================================
          APPROVED INSPECTORS
      ===================================================== */}

      <View style={s.inspectorsSection}>
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>
              Approved Council Inspectors
            </Text>

            <Text style={s.sectionSubtitle}>
              Inspectors available through TenureEx.
            </Text>
          </View>

          <View style={s.approvedPill}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={15}
              color={colors.primary}
            />

            <Text style={s.approvedPillText}>
              Approved
            </Text>
          </View>
        </View>

        {inspectors.length === 0 ? (
          <EmptyState
            icon="badge-account-outline"
            title="No inspectors available"
            description="There are currently no approved Council Inspectors available."
          />
        ) : (
          <View
            style={[
              s.inspectorGrid,
              isMobile && s.inspectorGridMobile,
            ]}
          >
            {inspectors.map((inspector) => (
              <InspectorCard
                key={inspector.id}
                inspector={inspector}
                mobile={isMobile}
              />
            ))}
          </View>
        )}
      </View>

      {/* =====================================================
          REQUEST DIALOG
      ===================================================== */}

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => setOpen(false)}
          style={s.dialog}
        >
          <View style={s.dialogHeader}>
            <View style={s.dialogIcon}>
              <MaterialCommunityIcons
                name="clipboard-plus-outline"
                size={25}
                color={colors.primary}
              />
            </View>

            <View style={s.dialogHeaderText}>
              <Text style={s.dialogTitle}>
                Request Council inspection
              </Text>

              <Text style={s.dialogSubtitle}>
                Provide the property and inspection
                details below.
              </Text>
            </View>
          </View>

          <Divider />

          <Dialog.ScrollArea style={s.dialogScrollArea}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                s.dialogScrollContent
              }
            >
              {/* PROPERTY */}

              <FormSection
                number="1"
                title="Select property"
                description="Choose the property that needs inspection."
              >
                {properties.length === 0 ? (
                  <Text style={s.noOptions}>
                    No eligible properties available.
                  </Text>
                ) : (
                  <View style={s.choiceList}>
                    {properties.map((property) => {
                      const selected =
                        propertyId === property.id;

                      return (
                        <Pressable
                          key={property.id}
                          onPress={() =>
                            setPropertyId(property.id)
                          }
                          style={[
                            s.choice,
                            selected &&
                              s.choiceActive,
                          ]}
                        >
                          <View
                            style={[
                              s.choiceIcon,
                              selected &&
                                s.choiceIconActive,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="home-outline"
                              size={20}
                              color={
                                selected
                                  ? colors.white
                                  : colors.primary
                              }
                            />
                          </View>

                          <View style={s.choiceTextWrap}>
                            <Text
                              style={[
                                s.choiceTitle,
                                selected &&
                                  s.choiceTitleActive,
                              ]}
                            >
                              {property.addressLine1}
                            </Text>

                            <Text
                              style={[
                                s.choiceSub,
                                selected &&
                                  s.choiceSubActive,
                              ]}
                            >
                              {[
                                property.townCity,
                                property.postcode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </Text>
                          </View>

                          <MaterialCommunityIcons
                            name={
                              selected
                                ? "radiobox-marked"
                                : "radiobox-blank"
                            }
                            size={21}
                            color={
                              selected
                                ? colors.white
                                : colors.textMuted
                            }
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </FormSection>

              {/* INSPECTOR */}

              <FormSection
                number="2"
                title="Select Council Inspector"
                description="Choose an approved inspector for this request."
              >
                {inspectors.length === 0 ? (
                  <Text style={s.noOptions}>
                    No approved inspectors are currently
                    available.
                  </Text>
                ) : (
                  <View style={s.choiceList}>
                    {inspectors.map((inspector) => {
                      const selected =
                        inspectorId === inspector.id;

                      return (
                        <Pressable
                          key={inspector.id}
                          onPress={() =>
                            setInspectorId(
                              inspector.id
                            )
                          }
                          style={[
                            s.choice,
                            selected &&
                              s.choiceActive,
                          ]}
                        >
                          <View
                            style={[
                              s.choiceIcon,
                              selected &&
                                s.choiceIconActive,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="badge-account-outline"
                              size={20}
                              color={
                                selected
                                  ? colors.white
                                  : colors.primary
                              }
                            />
                          </View>

                          <View style={s.choiceTextWrap}>
                            <Text
                              style={[
                                s.choiceTitle,
                                selected &&
                                  s.choiceTitleActive,
                              ]}
                            >
                              {inspector.firstName}{" "}
                              {inspector.lastName}
                            </Text>

                            <Text
                              style={[
                                s.choiceSub,
                                selected &&
                                  s.choiceSubActive,
                              ]}
                            >
                              {[
                                inspector.councilProfile
                                  ?.jobTitle ||
                                  "Council Inspector",

                                inspector.councilProfile
                                  ?.councilName,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </Text>
                          </View>

                          <MaterialCommunityIcons
                            name={
                              selected
                                ? "radiobox-marked"
                                : "radiobox-blank"
                            }
                            size={21}
                            color={
                              selected
                                ? colors.white
                                : colors.textMuted
                            }
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </FormSection>

              {/* DETAILS */}

              <FormSection
                number="3"
                title="Inspection details"
                description="Describe the issue that needs to be inspected."
              >
                <View style={s.formFields}>
                  <TextInput
                    mode="outlined"
                    label="Issue title"
                    placeholder="e.g. Damp and mould concern"
                    value={title}
                    onChangeText={setTitle}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />

                  <TextInput
                    mode="outlined"
                    label="Category"
                    value={category}
                    onChangeText={setCategory}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />

                  <TextInput
                    mode="outlined"
                    label="Description"
                    placeholder="Describe the problem and where it is located..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />

                  <Text style={s.fieldLabel}>
                    Priority
                  </Text>

                  <View style={s.priorityChoices}>
                    {[
                      {
                        value: "NORMAL",
                        label: "Normal",
                        icon: "minus-circle-outline",
                      },
                      {
                        value: "HIGH",
                        label: "High",
                        icon: "alert-circle-outline",
                      },
                      {
                        value: "URGENT",
                        label: "Urgent",
                        icon: "alert-octagon-outline",
                      },
                    ].map((option) => {
                      const selected =
                        priority === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() =>
                            setPriority(option.value)
                          }
                          style={[
                            s.priorityChoice,
                            selected &&
                              s.priorityChoiceActive,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={option.icon as any}
                            size={18}
                            color={
                              selected
                                ? colors.primary
                                : colors.textMuted
                            }
                          />

                          <Text
                            style={[
                              s.priorityChoiceText,
                              selected &&
                                s.priorityChoiceTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    mode="outlined"
                    label="Access notes"
                    placeholder="e.g. Please call before arrival"
                    value={accessNotes}
                    onChangeText={setAccessNotes}
                    multiline
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </View>
              </FormSection>
            </ScrollView>
          </Dialog.ScrollArea>

          <Divider />

          <Dialog.Actions
            style={[
              s.dialogActions,
              isMobile &&
                s.dialogActionsMobile,
            ]}
          >
            <Button
              mode="outlined"
              onPress={() => setOpen(false)}
              style={[
                s.dialogButton,
                isMobile &&
                  s.dialogButtonMobile,
              ]}
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              icon="send-outline"
              loading={loading}
              disabled={loading}
              onPress={submit}
              style={[
                s.dialogButton,
                isMobile &&
                  s.dialogButtonMobile,
              ]}
            >
              Send request
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

// ===========================================================
// STAT
// ===========================================================

function Stat({
  icon,
  label,
  description,
  value,
  mobile,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  value: number;
  mobile: boolean;
}) {
  return (
    <View
      style={[
        s.stat,
        mobile && s.statSmall,
      ]}
    >
      <View style={s.statTop}>
        <View style={s.statIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={colors.primary}
          />
        </View>

        <Text style={s.statValue}>
          {value}
        </Text>
      </View>

      <Text style={s.statLabel}>
        {label}
      </Text>

      <Text style={s.statDescription}>
        {description}
      </Text>
    </View>
  );
}

// ===========================================================
// INSPECTION CARD
// ===========================================================

function InspectionCard({
  item,
  portal,
  mobile,
}: {
  item: CaseRow;
  portal: PortalType;
  mobile: boolean;
}) {
  const status = item.status.replace(/_/g, " ");

  const scheduled =
    item.scheduledStart &&
    !Number.isNaN(
      new Date(item.scheduledStart).getTime()
    )
      ? new Date(
          item.scheduledStart
        ).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <Pressable
      onPress={() =>
        router.push(
          `/${portal}/council-inspection-details?inspectionId=${item.id}` as never
        )
      }
      style={({ pressed }) => [
        s.caseCard,
        mobile && s.caseCardMobile,
        pressed && s.cardPressed,
      ]}
    >
      <View style={s.caseMain}>
        <View style={s.caseIcon}>
          <MaterialCommunityIcons
            name="clipboard-search-outline"
            size={24}
            color={colors.primary}
          />
        </View>

        <View style={s.caseContent}>
          <View
            style={[
              s.caseTitleRow,
              mobile && s.caseTitleRowMobile,
            ]}
          >
            <View style={s.caseTitleContent}>
              <Text
                style={s.caseTitle}
                numberOfLines={2}
              >
                {item.title}
              </Text>

              <View style={s.propertyLine}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color={colors.textMuted}
                />

                <Text style={s.caseAddress}>
                  {item.property
                    ? [
                        item.property.addressLine1,
                        item.property.postcode,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : "Property"}
                </Text>
              </View>
            </View>

            <View
              style={[
                s.caseBadges,
                mobile && s.caseBadgesMobile,
              ]}
            >
              <StatusBadge status={item.status} />

              <PriorityBadge
                priority={item.priority}
              />
            </View>
          </View>

          <View style={s.caseDetails}>
            <View style={s.caseDetail}>
              <MaterialCommunityIcons
                name="account-outline"
                size={15}
                color={colors.textMuted}
              />

              <Text
                style={s.caseDetailText}
                numberOfLines={1}
              >
                {item.inspector
                  ? `${item.inspector.firstName} ${item.inspector.lastName}`
                  : "Inspector not assigned"}
              </Text>
            </View>

            {item.inspector?.councilProfile
              ?.councilName ? (
              <View style={s.caseDetail}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={15}
                  color={colors.textMuted}
                />

                <Text
                  style={s.caseDetailText}
                  numberOfLines={1}
                >
                  {
                    item.inspector.councilProfile
                      .councilName
                  }
                </Text>
              </View>
            ) : null}

            {scheduled ? (
              <View style={s.caseDetail}>
                <MaterialCommunityIcons
                  name="calendar-clock-outline"
                  size={15}
                  color={colors.textMuted}
                />

                <Text style={s.caseDetailText}>
                  {scheduled}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={s.caseFooter}>
        <Text style={s.caseCategory}>
          {item.category}
        </Text>

        <View style={s.viewAction}>
          <Text style={s.viewActionText}>
            View case
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={19}
            color={colors.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

// ===========================================================
// INSPECTOR CARD
// ===========================================================

function InspectorCard({
  inspector,
  mobile,
}: {
  inspector: Inspector;
  mobile: boolean;
}) {
  const initials =
    `${inspector.firstName?.[0] || ""}${inspector.lastName?.[0] || ""}`.toUpperCase();

  return (
    <View
      style={[
        s.inspectorCard,
        mobile && s.inspectorCardMobile,
      ]}
    >
      <View style={s.inspectorTop}>
        <View style={s.inspectorAvatar}>
          <Text style={s.inspectorInitials}>
            {initials || "CI"}
          </Text>
        </View>

        <View style={s.inspectorStatus}>
          <View style={s.statusDot} />

          <Text style={s.inspectorStatusText}>
            Approved
          </Text>
        </View>
      </View>

      <Text style={s.inspectorName}>
        {inspector.firstName}{" "}
        {inspector.lastName}
      </Text>

      <Text style={s.inspectorRole}>
        {inspector.councilProfile?.jobTitle ||
          "Council Inspector"}
      </Text>

      <View style={s.inspectorDivider} />

      <View style={s.inspectorMetaRow}>
        <MaterialCommunityIcons
          name="office-building-outline"
          size={16}
          color={colors.textMuted}
        />

        <Text
          style={s.inspectorMeta}
          numberOfLines={1}
        >
          {inspector.councilProfile?.councilName ||
            "Local authority"}
        </Text>
      </View>

      {inspector.councilProfile?.department ? (
        <View style={s.inspectorMetaRow}>
          <MaterialCommunityIcons
            name="briefcase-outline"
            size={16}
            color={colors.textMuted}
          />

          <Text
            style={s.inspectorMeta}
            numberOfLines={1}
          >
            {inspector.councilProfile.department}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ===========================================================
// STATUS
// ===========================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const label = status.replace(/_/g, " ");

  return (
    <View style={s.statusBadge}>
      <View style={s.statusBadgeDot} />

      <Text style={s.statusBadgeText}>
        {label}
      </Text>
    </View>
  );
}

// ===========================================================
// PRIORITY
// ===========================================================

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  return (
    <View style={s.priorityBadge}>
      <Text style={s.priorityBadgeText}>
        {priority}
      </Text>
    </View>
  );
}

// ===========================================================
// EMPTY
// ===========================================================

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={30}
          color={colors.primary}
        />
      </View>

      <Text style={s.emptyTitle}>
        {title}
      </Text>

      <Text style={s.emptyDescription}>
        {description}
      </Text>
    </View>
  );
}

// ===========================================================
// FORM SECTION
// ===========================================================

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: any;
}) {
  return (
    <View style={s.formSection}>
      <View style={s.formSectionHeading}>
        <View style={s.formNumber}>
          <Text style={s.formNumberText}>
            {number}
          </Text>
        </View>

        <View style={s.formHeadingText}>
          <Text style={s.formTitle}>
            {title}
          </Text>

          <Text style={s.formDescription}>
            {description}
          </Text>
        </View>
      </View>

      {children}
    </View>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const s = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    gap: 22,
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },

  backText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  // HEADER

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
  },

  headerMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 16,
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  titleIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  titleTextContainer: {
    flex: 1,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
  },

  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },

  requestButton: {
    borderRadius: 12,
  },

  requestButtonMobile: {
    width: "100%",
  },

  requestButtonContent: {
    minHeight: 46,
    paddingHorizontal: 7,
  },

  // MESSAGE

  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  messageText: {
    flex: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  // STATS

  stats: {
    flexDirection: "row",
    gap: 14,
  },

  statsMobile: {
    flexWrap: "wrap",
  },

  stat: {
    flex: 1,
    minWidth: 190,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  statSmall: {
    minWidth: "100%",
  },

  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  statValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 13,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  statDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 11,
  },

  // SEARCH

  searchCard: {
    width: "100%",
  },

  searchInput: {
    backgroundColor: colors.white,
  },

  // SECTION

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 11,
  },

  countBadge: {
    minWidth: 31,
    height: 31,
    paddingHorizontal: 9,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  countBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  // CASE LIST

  caseList: {
    gap: 12,
  },

  caseCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  caseCardMobile: {
    borderRadius: 14,
  },

  cardPressed: {
    opacity: 0.88,
  },

  caseMain: {
    flexDirection: "row",
    gap: 14,
    padding: 17,
  },

  caseIcon: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  caseContent: {
    flex: 1,
    minWidth: 0,
  },

  caseTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },

  caseTitleRowMobile: {
    flexDirection: "column",
    gap: 8,
  },

  caseTitleContent: {
    flex: 1,
    minWidth: 0,
  },

  caseTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  propertyLine: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  caseAddress: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 12,
  },

  caseBadges: {
    alignItems: "flex-end",
    gap: 6,
  },

  caseBadgesMobile: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },

  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  statusBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },

  priorityBadgeText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
  },

  caseDetails: {
    marginTop: 12,
    gap: 6,
  },

  caseDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  caseDetailText: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 11,
  },

  caseFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#FAFBFC",
  },

  caseCategory: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  viewAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  viewActionText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  // INSPECTORS

  inspectorsSection: {
    gap: 14,
    marginTop: 2,
  },

  inspectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  inspectorGridMobile: {
    flexDirection: "column",
  },

  inspectorCard: {
    width: 265,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  inspectorCardMobile: {
    width: "100%",
  },

  inspectorTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  inspectorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  inspectorInitials: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  inspectorStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  inspectorStatusText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "800",
  },

  inspectorName: {
    marginTop: 13,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  inspectorRole: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
  },

  inspectorDivider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: colors.border,
  },

  inspectorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },

  inspectorMeta: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
  },

  approvedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },

  approvedPillText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  // EMPTY

  emptyState: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },

  emptyTitle: {
    marginTop: 12,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 420,
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  // DIALOG

  dialog: {
    alignSelf: "center",
    width: "94%",
    maxWidth: 690,
    maxHeight: "92%",
    borderRadius: 22,
    backgroundColor: colors.white,
  },

  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },

  dialogIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  dialogHeaderText: {
    flex: 1,
  },

  dialogTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },

  dialogSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },

  dialogScrollArea: {
    paddingHorizontal: 0,
  },

  dialogScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 22,
  },

  dialogActions: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 8,
  },

  dialogActionsMobile: {
    flexDirection: "column-reverse",
    alignItems: "stretch",
  },

  dialogButton: {
    minWidth: 110,
  },

  dialogButtonMobile: {
    width: "100%",
  },

  // FORM

  formSection: {
    gap: 12,
  },

  formSectionHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  formNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  formNumberText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  formHeadingText: {
    flex: 1,
  },

  formTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  formDescription: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 10,
  },

  choiceList: {
    gap: 8,
  },

  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },

  choiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  choiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  choiceIconActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  choiceTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  choiceTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },

  choiceTitleActive: {
    color: colors.white,
  },

  choiceSub: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 10,
  },

  choiceSubActive: {
    color: "rgba(255,255,255,0.80)",
  },

  noOptions: {
    padding: 14,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  formFields: {
    gap: 12,
  },

  fieldLabel: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  priorityChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  priorityChoice: {
    flexGrow: 1,
    minWidth: 105,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
  },

  priorityChoiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  priorityChoiceText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  priorityChoiceTextActive: {
    color: colors.primary,
    fontWeight: "900",
  },
});