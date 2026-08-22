import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  Button,
  Dialog,
  Divider,
  Portal,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";

import { api } from "../../src/api/client";

import {
  colors,
  radius,
  spacing,
} from "../../src/theme";

import AgentModuleScreen from "./AgentModuleScreen";

type AgencyProperty = {
  id: string;

  addressLine1: string;
  addressLine2?: string | null;
  townCity: string;
  county?: string | null;
  postcode: string;

  propertyType: string;

  bedrooms: number;
  bathrooms: number;

  monthlyRent: string | number;

  commissionType?: "FIXED" | "PERCENTAGE" | null;
  commissionValue?: string | number | null;
  commissionAmount?: string | number | null;
  tenantMonthlyRent?: string | number | null;

  depositAmount?: string | number | null;

  propertyStatus: string;

  approvalStatus:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

  submittedForReviewAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;

  rejectionReason?: string | null;

  description?: string | null;
  specialNotes?: string | null;

  gasSafetyExpiry?: string | null;
  epcExpiry?: string | null;
  eicrExpiry?: string | null;

  photoUrls?: string[];

  landlord: {
    name: string;
    email: string;
    phone?: string | null;
  };
};

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

function getPropertyPhotoUrl(
  photoUrl: string,
): string {
  if (!photoUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(photoUrl)) {
    return photoUrl;
  }

  let cleanPhotoName = photoUrl
    .trim()
    .replace(/^\/+/, "");

  cleanPhotoName =
    cleanPhotoName
      .replace(
        /^api\/v1\/uploads\/properties\//,
        "",
      )
      .replace(
        /^uploads\/properties\//,
        "",
      )
      .replace(
        /^properties\//,
        "",
      );

  return `${API_BASE_URL}/uploads/properties/${encodeURIComponent(
    cleanPhotoName,
  )}`;
}

export default function PropertiesScreen() {
  const [properties, setProperties] =
    useState<AgencyProperty[]>([]);

  const [selected, setSelected] =
    useState<AgencyProperty | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [rejecting, setRejecting] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [commissionType, setCommissionType] =
    useState<"FIXED" | "PERCENTAGE">("FIXED");

  const [commissionValue, setCommissionValue] =
    useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const response =
        await api.get<AgencyProperty[]>(
          "/agency-landlords/properties",
        );

      setProperties(
        response.data ?? [],
      );
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ??
          "Could not load agency properties.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: properties.length,

      pending: properties.filter(
        (property) =>
          property.approvalStatus ===
          "PENDING",
      ).length,

      approved: properties.filter(
        (property) =>
          property.approvalStatus ===
          "APPROVED",
      ).length,

      rejected: properties.filter(
        (property) =>
          property.approvalStatus ===
          "REJECTED",
      ).length,
    }),
    [properties],
  );

  const records = properties.map(
    (property) => ({
      id: property.id,

      title: property.addressLine1,

      subtitle: `${property.townCity}, ${property.postcode}`,

      detail:
        `Landlord: ${property.landlord.name}` +
        ` · £${Number(
          property.monthlyRent,
        ).toLocaleString()} per month`,

      status:
        property.approvalStatus ===
        "PENDING"
          ? "Pending"
          : property.approvalStatus ===
              "APPROVED"
            ? "Approved"
            : "Rejected",

      statusType:
        property.approvalStatus ===
        "PENDING"
          ? ("warning" as const)
          : property.approvalStatus ===
              "APPROVED"
            ? ("success" as const)
            : ("error" as const),

      icon:
        "home-city-outline" as const,

      onEdit: () => {
        setSelected(property);
        setRejecting(false);
        setReason("");
        setCommissionType(
          property.commissionType === "PERCENTAGE"
            ? "PERCENTAGE"
            : "FIXED",
        );
        setCommissionValue(
          property.commissionValue !== null &&
          property.commissionValue !== undefined
            ? String(property.commissionValue)
            : "",
        );
      },
    }),
  );

  const landlordRent =
    Number(selected?.monthlyRent ?? 0);

  const parsedCommissionValue =
    Number(commissionValue);

  const validCommissionValue =
    commissionValue.trim() !== "" &&
    Number.isFinite(parsedCommissionValue) &&
    parsedCommissionValue >= 0 &&
    !(
      commissionType === "PERCENTAGE" &&
      parsedCommissionValue > 100
    );

  const calculatedCommission =
    validCommissionValue
      ? commissionType === "PERCENTAGE"
        ? landlordRent * (parsedCommissionValue / 100)
        : parsedCommissionValue
      : 0;

  const calculatedTenantRent =
    landlordRent + calculatedCommission;

  const approve = async () => {
    if (!selected) {
      return;
    }

    if (!validCommissionValue) {
      setMessage(
        commissionType === "PERCENTAGE"
          ? "Enter a valid commission percentage between 0 and 100."
          : "Enter a valid commission amount.",
      );
      return;
    }

    try {
      setProcessing(true);

      const response =
        await api.patch(
          `/agency-landlords/properties/${selected.id}/approve`,
          {
            commissionType,
            commissionValue: parsedCommissionValue,
          },
        );

      setMessage(
        response.data.message ??
          "Property approved.",
      );

      setSelected(null);

      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ??
          "Could not approve property.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const reject = async () => {
    if (
      !selected ||
      !reason.trim()
    ) {
      return;
    }

    try {
      setProcessing(true);

      const response =
        await api.patch(
          `/agency-landlords/properties/${selected.id}/reject`,
          {
            reason: reason.trim(),
          },
        );

      setMessage(
        response.data.message ??
          "Property rejected.",
      );

      setSelected(null);
      setRejecting(false);
      setReason("");

      await load();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ??
          "Could not reject property.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AgentModuleScreen
        pageTitle="Properties"
        pageSubtitle="Review landlord property submissions and manage approved agency properties."
        activePage="Properties"
        primaryAction="Refresh"
        primaryActionIcon="refresh"
        onPrimaryAction={() =>
          void load()
        }
        searchPlaceholder="Search by address or landlord..."
        filterOptions={[
          "All",
          "Pending",
          "Approved",
          "Rejected",
        ]}
        emptyMessage={
          loading
            ? "Loading properties..."
            : "No linked landlord properties found."
        }
        statistics={[
          {
            label: "Total properties",
            value: String(
              counts.total,
            ),
            icon:
              "office-building-outline",
          },
          {
            label: "Approved",
            value: String(
              counts.approved,
            ),
            icon:
              "check-decagram-outline",
          },
          {
            label:
              "Awaiting approval",
            value: String(
              counts.pending,
            ),
            icon:
              "clock-outline",
            helper:
              "Requires Estate Agent review",
          },
          {
            label: "Rejected",
            value: String(
              counts.rejected,
            ),
            icon:
              "close-circle-outline",
          },
        ]}
        records={records}
      />

      <Portal>
        <Dialog
          visible={!!selected}
          onDismiss={() =>
            setSelected(null)
          }
          style={styles.dialog}
        >
          {selected ? (
            <>
              <Dialog.Title>
                Property review
              </Dialog.Title>

              <Dialog.ScrollArea
                style={{
                  maxHeight: 590,
                }}
              >
                <ScrollView
                  contentContainerStyle={
                    styles.content
                  }
                >
                  <Text variant="titleMedium">
                    {
                      selected.addressLine1
                    }
                  </Text>

                  <Text>
                    {[
                      selected.addressLine2,
                      selected.townCity,
                      selected.county,
                      selected.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>

                  <Divider />

                  <Text variant="titleSmall">
                    Landlord
                  </Text>

                  <Text>
                    {
                      selected.landlord
                        .name
                    }
                  </Text>

                  <Text>
                    {
                      selected.landlord
                        .email
                    }
                  </Text>

                  {selected.landlord
                    .phone ? (
                    <Text>
                      {
                        selected
                          .landlord
                          .phone
                      }
                    </Text>
                  ) : null}

                  <Divider />

                  <View style={styles.infoCommissionRow}>
                    <View style={styles.propertyInfoColumn}>
                      <Text variant="titleSmall">
                        Property information
                      </Text>

                      <Text>Type: {selected.propertyType}</Text>

                      <Text>
                        Bedrooms: {selected.bedrooms} · Bathrooms:{" "}
                        {selected.bathrooms}
                      </Text>

                      <Text>
                        Landlord rent: £
                        {Number(selected.monthlyRent).toLocaleString()}{" "}
                        per month
                      </Text>

                      <Text>
                        Property status: {selected.propertyStatus}
                      </Text>

                      <Text>
                        Approval status: {selected.approvalStatus}
                      </Text>
                    </View>

                    <View style={styles.commissionColumn}>
                      <Text variant="titleSmall">
                        Estate agent commission
                      </Text>

                      {selected.approvalStatus === "PENDING" ? (
                        <>
                          <SegmentedButtons
                            value={commissionType}
                            onValueChange={(value) =>
                              setCommissionType(
                                value as "FIXED" | "PERCENTAGE",
                              )
                            }
                            buttons={[
                              { value: "FIXED", label: "Amount" },
                              { value: "PERCENTAGE", label: "Percentage" },
                            ]}
                          />

                          <TextInput
                            mode="outlined"
                            keyboardType="decimal-pad"
                            label={
                              commissionType === "PERCENTAGE"
                                ? "Commission percentage"
                                : "Commission amount"
                            }
                            left={
                              commissionType === "FIXED" ? (
                                <TextInput.Affix text="£" />
                              ) : undefined
                            }
                            right={
                              commissionType === "PERCENTAGE" ? (
                                <TextInput.Affix text="%" />
                              ) : undefined
                            }
                            value={commissionValue}
                            onChangeText={setCommissionValue}
                          />

                          <Text>
                            Commission: £
                            {calculatedCommission.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>

                          <Text style={styles.finalRent}>
                            Tenant rent: £
                            {calculatedTenantRent.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            per month
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text>
                            Type:{" "}
                            {selected.commissionType === "PERCENTAGE"
                              ? "Percentage"
                              : "Fixed amount"}
                          </Text>

                          <Text>
                            Commission: £
                            {Number(
                              selected.commissionAmount ?? 0,
                            ).toLocaleString()}
                          </Text>

                          <Text style={styles.finalRent}>
                            Tenant rent: £
                            {Number(
                              selected.tenantMonthlyRent ??
                                selected.monthlyRent,
                            ).toLocaleString()}{" "}
                            per month
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {selected.description ? (
                    <Text>
                      Description:{" "}
                      {
                        selected.description
                      }
                    </Text>
                  ) : null}

                  {selected.specialNotes ? (
                    <Text>
                      Notes:{" "}
                      {
                        selected.specialNotes
                      }
                    </Text>
                  ) : null}

                  {selected.rejectionReason ? (
                    <Text
                      style={{
                        color:
                          colors.error,
                      }}
                    >
                      Previous rejection:{" "}
                      {
                        selected.rejectionReason
                      }
                    </Text>
                  ) : null}

                  {(selected.photoUrls
                    ?.length ??
                    0) > 0 ? (
                    <>
                      <Divider />

                      <Text variant="titleSmall">
                        Property photos
                      </Text>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={
                          false
                        }
                      >
                        <View
                          style={
                            styles.photos
                          }
                        >
                          {selected.photoUrls!.map(
                            (
                              photoUrl,
                              index,
                            ) => {
                              const finalUrl =
                                getPropertyPhotoUrl(
                                  photoUrl,
                                );

                              return (
                                <Image
                                  key={`${photoUrl}-${index}`}
                                  source={{
                                    uri: finalUrl,
                                  }}
                                  style={
                                    styles.photo
                                  }
                                  resizeMode="cover"
                                  onError={(
                                    event,
                                  ) => {
                                    console.error(
                                      "AGENT PROPERTY IMAGE ERROR:",
                                      finalUrl,
                                      event
                                        .nativeEvent,
                                    );
                                  }}
                                />
                              );
                            },
                          )}
                        </View>
                      </ScrollView>
                    </>
                  ) : null}

                  {selected.approvalStatus ===
                    "PENDING" &&
                  rejecting ? (
                    <TextInput
                      mode="outlined"
                      multiline
                      numberOfLines={4}
                      label="Reason / changes required"
                      value={reason}
                      onChangeText={
                        setReason
                      }
                    />
                  ) : null}
                </ScrollView>
              </Dialog.ScrollArea>

              <Dialog.Actions>
                <Button
                  onPress={() =>
                    setSelected(null)
                  }
                >
                  Close
                </Button>

                {selected.approvalStatus ===
                  "PENDING" &&
                !rejecting ? (
                  <Button
                    textColor={
                      colors.error
                    }
                    onPress={() =>
                      setRejecting(
                        true,
                      )
                    }
                  >
                    Reject
                  </Button>
                ) : null}

                {selected.approvalStatus ===
                  "PENDING" &&
                rejecting ? (
                  <Button
                    onPress={() => {
                      setRejecting(
                        false,
                      );

                      setReason("");
                    }}
                  >
                    Cancel rejection
                  </Button>
                ) : null}

                {selected.approvalStatus ===
                  "PENDING" &&
                rejecting ? (
                  <Button
                    mode="contained"
                    buttonColor={
                      colors.error
                    }
                    disabled={
                      !reason.trim() ||
                      processing
                    }
                    loading={
                      processing
                    }
                    onPress={() =>
                      void reject()
                    }
                  >
                    Confirm reject
                  </Button>
                ) : null}

                {selected.approvalStatus ===
                  "PENDING" &&
                !rejecting ? (
                  <Button
                    mode="contained"
                    loading={
                      processing
                    }
                    disabled={
                      processing ||
                      !validCommissionValue
                    }
                    onPress={() =>
                      void approve()
                    }
                  >
                    Approve property
                  </Button>
                ) : null}
              </Dialog.Actions>
            </>
          ) : null}
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!message}
        onDismiss={() =>
          setMessage("")
        }
        duration={4500}
      >
        {message}
      </Snackbar>
    </View>
  );
}

const styles =
  StyleSheet.create({
    dialog: {
      width: 720,
      maxWidth: "95%",
      alignSelf: "center",
      borderRadius: radius.xl,
    },

    content: {
      padding: spacing.lg,
      gap: spacing.sm,
    },

    infoCommissionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xl,
    },

    propertyInfoColumn: {
      flex: 1,
      minWidth: 250,
      gap: spacing.sm,
    },

    commissionColumn: {
      flex: 1,
      minWidth: 280,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSoft,
    },

    finalRent: {
      fontWeight: "700",
    },

    photos: {
      flexDirection: "row",
      gap: spacing.sm,
    },

    photo: {
      width: 150,
      height: 110,
      borderRadius: radius.md,
      backgroundColor:
        colors.surfaceSoft,
    },
  });