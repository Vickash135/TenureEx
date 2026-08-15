import AgentModuleScreen from "./AgentModuleScreen";

export default function ContractorsScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Contractors"
      pageSubtitle="Manage approved contractors, trades and job assignments."
      activePage="Contractors"
      primaryAction="Add contractor"
      primaryActionIcon="account-hard-hat-outline"
      searchPlaceholder="Search contractors..."
      statistics={[
        {
          label: "Approved contractors",
          value: "24",
          icon: "hard-hat",
        },
        {
          label: "Active jobs",
          value: "11",
          icon: "briefcase-outline",
        },
        {
          label: "Available today",
          value: "16",
          icon: "calendar-check-outline",
        },
        {
          label: "Awaiting approval",
          value: "3",
          icon: "account-clock-outline",
        },
      ]}
      records={[
        {
          id: "C001",
          title: "Apex Plumbing Services",
          subtitle: "Plumbing and heating",
          detail: "4 active jobs · Rating 4.8/5",
          status: "Available",
          statusType: "success",
          icon: "pipe-wrench",
        },
        {
          id: "C002",
          title: "BrightSpark Electrical",
          subtitle: "Electrical maintenance",
          detail: "2 active jobs · Rating 4.7/5",
          status: "Busy",
          statusType: "warning",
          icon: "lightning-bolt-outline",
        },
        {
          id: "C003",
          title: "Citywide Property Repairs",
          subtitle: "General property repairs",
          detail: "Documents submitted · Insurance under review",
          status: "Pending",
          statusType: "warning",
          icon: "hammer-wrench",
        },
      ]}
    />
  );
}