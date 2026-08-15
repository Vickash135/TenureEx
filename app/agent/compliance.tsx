import AgentModuleScreen from "./AgentModuleScreen";

export default function ComplianceScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Compliance"
      pageSubtitle="Monitor certificates, expiry dates and legal requirements."
      activePage="Compliance"
      primaryAction="Add document"
      primaryActionIcon="file-plus-outline"
      searchPlaceholder="Search compliance documents..."
      statistics={[
        {
          label: "Compliant properties",
          value: "117",
          icon: "shield-check-outline",
        },
        {
          label: "Expiring within 30 days",
          value: "7",
          icon: "calendar-alert-outline",
        },
        {
          label: "Expired",
          value: "2",
          icon: "alert-octagon-outline",
        },
        {
          label: "Documents stored",
          value: "486",
          icon: "file-document-multiple-outline",
        },
      ]}
      records={[
        {
          id: "CO001",
          title: "Gas safety certificate",
          subtitle: "16 Riverside Court",
          detail: "Expires in 14 days · Landlord: Emma Wilson",
          status: "Expiring soon",
          statusType: "error",
          icon: "fire-alert",
        },
        {
          id: "CO002",
          title: "Electrical safety report",
          subtitle: "8 Green Lane",
          detail: "Expires in 29 days · Inspection required",
          status: "Attention",
          statusType: "warning",
          icon: "flash-alert-outline",
        },
        {
          id: "CO003",
          title: "Energy performance certificate",
          subtitle: "31 Victoria Road",
          detail: "Expires in 43 days · Rating C",
          status: "Valid",
          statusType: "success",
          icon: "home-lightning-bolt-outline",
        },
      ]}
    />
  );
}