import AgentModuleScreen from "./AgentModuleScreen";

export default function ApplicantsScreen() {
  return (
    <AgentModuleScreen
      pageTitle="Applicants"
      pageSubtitle="Review applications, referencing and tenancy decisions."
      activePage="Applicants"
      primaryAction="Add applicant"
      primaryActionIcon="account-plus-outline"
      searchPlaceholder="Search applicants..."
      statistics={[
        {
          label: "Total applicants",
          value: "31",
          icon: "account-search-outline",
        },
        {
          label: "New applications",
          value: "9",
          icon: "file-document-plus-outline",
        },
        {
          label: "Referencing",
          value: "12",
          icon: "account-clock-outline",
        },
        {
          label: "Approved",
          value: "10",
          icon: "account-check-outline",
        },
      ]}
      records={[
        {
          id: "A001",
          title: "Oliver Harris",
          subtitle: "Applied for 18 Ashford Street",
          detail: "Submitted today · Income verification received",
          status: "Referencing",
          statusType: "warning",
          icon: "account-search-outline",
        },
        {
          id: "A002",
          title: "Sophia Turner",
          subtitle: "Applied for 42 Camden Avenue",
          detail: "Submitted yesterday · Documents complete",
          status: "Approved",
          statusType: "success",
          icon: "account-check-outline",
        },
        {
          id: "A003",
          title: "Harry Walker",
          subtitle: "Applied for 8 Green Lane",
          detail: "Submitted 2 days ago · Awaiting documents",
          status: "New",
          statusType: "primary",
          icon: "account-plus-outline",
        },
      ]}
    />
  );
}