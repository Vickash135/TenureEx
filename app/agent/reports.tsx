import AgentModuleScreen from "./AgentModuleScreen";

export default function ReportsScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Reports"
      pageSubtitle="Generate portfolio, occupancy, maintenance and finance reports."
      activePage="Reports"
      primaryAction="Create report"
      primaryActionIcon="chart-box-plus-outline"
      searchPlaceholder="Search reports..."
      statistics={[
        {
          label: "Reports generated",
          value: "36",
          icon: "chart-box-outline",
        },
        {
          label: "Scheduled reports",
          value: "8",
          icon: "calendar-sync-outline",
        },
        {
          label: "Shared this month",
          value: "14",
          icon: "share-variant-outline",
        },
        {
          label: "Portfolio value",
          value: "£38.4m",
          icon: "cash-multiple",
        },
      ]}
      records={[
        {
          id: "R001",
          title: "Monthly portfolio overview",
          subtitle: "July 2026",
          detail: "Properties, occupancy, landlords and maintenance",
          status: "Ready",
          statusType: "success",
          icon: "chart-box-outline",
        },
        {
          id: "R002",
          title: "Compliance status report",
          subtitle: "Generated 21 July 2026",
          detail: "Certificates, expired documents and upcoming renewals",
          status: "Ready",
          statusType: "success",
          icon: "shield-check-outline",
        },
        {
          id: "R003",
          title: "Landlord performance report",
          subtitle: "Scheduled for 1 August 2026",
          detail: "Portfolio distribution and landlord activity",
          status: "Scheduled",
          statusType: "primary",
          icon: "calendar-clock-outline",
        },
      ]}
    />
  );
}