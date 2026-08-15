import AgentModuleScreen from "./AgentModuleScreen";
export default function MessagesScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Messages"
      pageSubtitle="Communicate with landlords, tenants and contractors."
      activePage="Messages"
      primaryAction="New message"
      primaryActionIcon="message-plus-outline"
      searchPlaceholder="Search conversations..."
      statistics={[
        {
          label: "Unread",
          value: "4",
          icon: "email-alert-outline",
        },
        {
          label: "Open conversations",
          value: "18",
          icon: "message-text-outline",
        },
        {
          label: "Landlord messages",
          value: "7",
          icon: "account-tie-outline",
        },
        {
          label: "Tenant messages",
          value: "11",
          icon: "account-group-outline",
        },
      ]}
      records={[
        {
          id: "MSG001",
          title: "Emily Johnson",
          subtitle: "Re: Boiler maintenance appointment",
          detail: "Thank you, Friday morning works for me.",
          status: "Unread",
          statusType: "primary",
          icon: "account-outline",
        },
        {
          id: "MSG002",
          title: "Daniel Thompson",
          subtitle: "Property approval required",
          detail: "Could you confirm when the listing will be published?",
          status: "Unread",
          statusType: "primary",
          icon: "account-tie-outline",
        },
        {
          id: "MSG003",
          title: "Apex Plumbing Services",
          subtitle: "Job M001 update",
          detail: "Engineer assigned and expected at 10:00.",
          status: "Read",
          statusType: "neutral",
          icon: "pipe-wrench",
        },
      ]}
    />
  );
}