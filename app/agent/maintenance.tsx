import AgentModuleScreen from "./AgentModuleScreen";

export default function MaintenanceScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Maintenance"
      pageSubtitle="Track tenant reports, contractor assignments and completion."
      activePage="Maintenance"
      primaryAction="Create request"
      primaryActionIcon="plus-circle-outline"
      searchPlaceholder="Search maintenance requests..."
      statistics={[
        {
          label: "Open requests",
          value: "8",
          icon: "tools",
        },
        {
          label: "Urgent",
          value: "2",
          icon: "alert-outline",
        },
        {
          label: "In progress",
          value: "4",
          icon: "progress-wrench",
        },
        {
          label: "Completed this month",
          value: "27",
          icon: "check-circle-outline",
        },
      ]}
      records={[
        {
          id: "M001",
          title: "Boiler not heating",
          subtitle: "Flat 8, Park View",
          detail: "Reported by Emily Johnson · Contractor assigned",
          status: "Urgent",
          statusType: "error",
          icon: "water-boiler-alert",
        },
        {
          id: "M002",
          title: "Kitchen tap leaking",
          subtitle: "18 Ashford Street",
          detail: "Reported yesterday · Awaiting contractor",
          status: "New",
          statusType: "primary",
          icon: "water-pump",
        },
        {
          id: "M003",
          title: "Bedroom light fault",
          subtitle: "42 Camden Avenue",
          detail: "Electrician visit booked for Friday",
          status: "In progress",
          statusType: "warning",
          icon: "lightbulb-alert-outline",
        },
      ]}
    />
  );
}