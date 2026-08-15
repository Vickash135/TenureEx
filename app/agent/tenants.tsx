import AgentModuleScreen from "./AgentModuleScreen";

export default function TenantsScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Tenants"
      pageSubtitle="Manage active tenancies, contact details and tenant activity."
      activePage="Tenants"
      primaryAction="Add tenant"
      primaryActionIcon="account-plus-outline"
      searchPlaceholder="Search tenants..."
      statistics={[
        {
          label: "Active tenants",
          value: "156",
          icon: "account-group-outline",
        },
        {
          label: "Tenancies ending soon",
          value: "12",
          icon: "calendar-clock-outline",
        },
        {
          label: "Rent up to date",
          value: "143",
          icon: "cash-check",
        },
        {
          label: "Open issues",
          value: "8",
          icon: "tools",
        },
      ]}
      records={[
        {
          id: "T001",
          title: "Emily Johnson",
          subtitle: "Flat 8, Park View",
          detail: "Tenancy ends 30 November 2026 · £1,380 per month",
          status: "Active",
          statusType: "success",
          icon: "account-outline",
        },
        {
          id: "T002",
          title: "James Williams",
          subtitle: "24 Westbourne Road",
          detail: "Tenancy ends 12 January 2027 · £2,450 per month",
          status: "Active",
          statusType: "success",
          icon: "account-outline",
        },
        {
          id: "T003",
          title: "Amelia Taylor",
          subtitle: "31 Victoria Road",
          detail: "Tenancy ends in 28 days · Renewal not confirmed",
          status: "Ending soon",
          statusType: "warning",
          icon: "calendar-alert-outline",
        },
      ]}
    />
  );
}