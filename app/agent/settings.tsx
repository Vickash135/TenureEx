import AgentModuleScreen from "./AgentModuleScreen";
export default function SettingsScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Settings"
      pageSubtitle="Manage agency details, users, notifications and preferences."
      activePage="Settings"
      primaryAction="Save changes"
      primaryActionIcon="content-save-outline"
      searchPlaceholder="Search settings..."
      statistics={[
        {
          label: "Agency users",
          value: "12",
          icon: "account-multiple-outline",
        },
        {
          label: "Administrator accounts",
          value: "3",
          icon: "shield-account-outline",
        },
        {
          label: "Notification rules",
          value: "8",
          icon: "bell-cog-outline",
        },
        {
          label: "Connected services",
          value: "4",
          icon: "connection",
        },
      ]}
      records={[
        {
          id: "S001",
          title: "Agency profile",
          subtitle: "Northgate Estates",
          detail: "Business information, address and branding",
          status: "Configured",
          statusType: "success",
          icon: "office-building-cog-outline",
        },
        {
          id: "S002",
          title: "Team and permissions",
          subtitle: "12 active users",
          detail: "Administrators, property managers and support staff",
          status: "Manage",
          statusType: "primary",
          icon: "account-cog-outline",
        },
        {
          id: "S003",
          title: "Notifications",
          subtitle: "Email and application alerts",
          detail: "Maintenance, compliance and message notifications",
          status: "Enabled",
          statusType: "success",
          icon: "bell-cog-outline",
        },
      ]}
    />
  );
}