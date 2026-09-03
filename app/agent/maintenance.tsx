import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { api } from "../../src/api/client";
import PropertyMaintenanceProviders from "../../src/components/PropertyMaintenanceProviders";
import { colors } from "../../src/theme";
import AgentModuleScreen, { type AgentRecord } from "./AgentModuleScreen";

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");

      const response = await api.get(
        "/property-workflows/maintenance-requests",
      );

      setRequests(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load maintenance requests.",
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const records = useMemo<AgentRecord[]>(
    () =>
      requests.map((request) => ({
        id: request.id,

        title: request.title,

        subtitle:
          [
            request.property?.addressLine1,
            request.property?.postcode,
          ]
            .filter(Boolean)
            .join(", ") || request.propertyId,

        detail: `${String(
          request.category || "Maintenance",
        )} · ${String(
          request.priority || "MEDIUM",
        ).replaceAll("_", " ")}`,

        status: String(
          request.status || "OPEN",
        ).replaceAll("_", " "),

        statusType:
          request.priority === "EMERGENCY"
            ? "error"
            : request.status === "COMPLETED"
              ? "success"
              : request.status === "IN_PROGRESS"
                ? "warning"
                : "primary",

        icon: "tools",

        onOpen: () =>
          router.push(
            `/agent/maintenance-request/${request.id}` as never,
          ),
      })),
    [requests],
  );

  const openCount = requests.filter(
    (request) => !["COMPLETED"].includes(request.status),
  ).length;

  const urgentCount = requests.filter(
    (request) =>
      request.priority === "EMERGENCY" ||
      request.priority === "HIGH",
  ).length;

  const inProgressCount = requests.filter(
    (request) => request.status === "IN_PROGRESS",
  ).length;

  const awaitingTenantCount = requests.filter(
    (request) =>
      request.status === "AWAITING_TENANT_CONFIRMATION",
  ).length;

  return (
    <AgentModuleScreen
      pageTitle="Maintenance"
      pageSubtitle="Track tenant maintenance reports and manage the approved maintenance team for each property."
      activePage="Maintenance"
      primaryAction="Refresh"
      primaryActionIcon="refresh"
      onPrimaryAction={() => void load()}
      searchPlaceholder="Search maintenance requests..."
      filterOptions={[
        "All",
        "OPEN",
        "SCHEDULED",
        "IN PROGRESS",
        "AWAITING TENANT CONFIRMATION",
        "COMPLETED",
      ]}
      statistics={[
        {
          label: "Open requests",
          value: String(openCount),
          icon: "tools",
          helper: "All requests not yet completed",
        },
        {
          label: "Urgent / high",
          value: String(urgentCount),
          icon: "alert-outline",
          helper: "Higher-priority repairs",
        },
        {
          label: "In progress",
          value: String(inProgressCount),
          icon: "progress-wrench",
          helper: "Providers currently working",
        },
        {
          label: "Awaiting tenant",
          value: String(awaitingTenantCount),
          icon: "account-check-outline",
          helper:
            "Provider finished; tenant must confirm",
        },
      ]}
      records={records}
      customContent={
        <View style={{ gap: 18 }}>
          <PropertyMaintenanceProviders
            actingRole="ESTATE_AGENT"
            propertyEndpoint="/agency-landlords/properties"
            canApprove
            title="Property maintenance teams"
            subtitle="Invite providers, see providers added by Landlords or Tenants, and approve Tenant-added providers before they can take jobs."
          />

          {error ? (
            <Text
              style={{
                color: colors.error,
                fontWeight: "700",
              }}
            >
              {error}
            </Text>
          ) : null}
        </View>
      }
    />
  );
}